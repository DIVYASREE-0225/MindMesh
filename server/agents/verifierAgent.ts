/**
 * Verification Agent
 * Crucial autonomous state auditor.
 * Independently queries the target service using IDs/receipts to
 * mathematically verify state before an action is certified as VERIFIED.
 */

import { verifyCalendarEvent } from '../integrations/calendar';
import { verifyNotionTask } from '../integrations/notion';
import { verifySlackMessage } from '../integrations/slack';

export interface VerificationRequest {
  taskId: string;
  taskTitle: string;
  app: 'notion' | 'calendar' | 'slack';
  toolUsed: string;
  toolResult: Record<string, any>;
  expectedParams?: Record<string, any>;
}

export interface VerificationReport {
  taskId: string;
  verified: boolean;
  status: 'VERIFIED' | 'FAILED' | 'RETRYING';
  reason: string;
  details: Record<string, any>;
  timestamp: string;
}

export class VerifierAgent {
  readonly id = 'verifier';
  readonly name = 'Verification Agent';

  async auditAction(req: VerificationRequest): Promise<VerificationReport> {
    const timestamp = new Date().toISOString();

    if (!req.toolResult || !req.toolResult.success) {
      return {
        taskId: req.taskId,
        verified: false,
        status: 'FAILED',
        reason: req.toolResult?.error || 'Underlying tool execution failed.',
        details: req.toolResult || {},
        timestamp,
      };
    }

    // 1. Audit Calendar Event
    if (req.app === 'calendar') {
      const eventId = req.toolResult.eventId;
      if (!eventId) {
        return {
          taskId: req.taskId,
          verified: false,
          status: 'FAILED',
          reason: 'Calendar creation succeeded in memory but returned no event ID.',
          details: req.toolResult,
          timestamp,
        };
      }

      const check = await verifyCalendarEvent({
        eventId,
        expectedTitle: req.expectedParams?.title || req.taskTitle,
      });

      if (check.verified) {
        return {
          taskId: req.taskId,
          verified: true,
          status: 'VERIFIED',
          reason: `Event '${check.title}' verified on Google Calendar (${check.startTime} to ${check.endTime}). Status: confirmed.`,
          details: check,
          timestamp,
        };
      } else {
        return {
          taskId: req.taskId,
          verified: false,
          status: 'FAILED',
          reason: check.reason || 'Verification query failed to locate event.',
          details: check,
          timestamp,
        };
      }
    }

    // 2. Audit Notion Task
    if (req.app === 'notion') {
      const pageId = req.toolResult.pageId;
      if (!pageId) {
        return {
          taskId: req.taskId,
          verified: false,
          status: 'FAILED',
          reason: 'Notion task creation reported success but provided no page ID.',
          details: req.toolResult,
          timestamp,
        };
      }

      const check = await verifyNotionTask({
        pageId,
        expectedTitle: req.expectedParams?.title || req.taskTitle,
      });

      if (check.verified) {
        return {
          taskId: req.taskId,
          verified: true,
          status: 'VERIFIED',
          reason: `Notion page '${check.title}' independently verified and active (archived: false).`,
          details: check,
          timestamp,
        };
      } else {
        return {
          taskId: req.taskId,
          verified: false,
          status: 'FAILED',
          reason: check.reason || 'Verification query failed to locate Notion page.',
          details: check,
          timestamp,
        };
      }
    }

    // 3. Audit Slack Message
    if (req.app === 'slack') {
      const messageId = req.toolResult.messageId || req.toolResult.timestamp;
      const channel = req.toolResult.channel || req.expectedParams?.channel || '#general';

      if (!messageId) {
        return {
          taskId: req.taskId,
          verified: false,
          status: 'FAILED',
          reason: 'Slack message dispatch recorded no message timestamp or delivery ID.',
          details: req.toolResult,
          timestamp,
        };
      }

      const check = await verifySlackMessage({
        channel,
        messageId,
      });

      if (check.verified) {
        return {
          taskId: req.taskId,
          verified: true,
          status: 'VERIFIED',
          reason: `Slack message confirmed in ${check.channel} (timestamp: ${check.messageId}). Delivery validated.`,
          details: check,
          timestamp,
        };
      } else {
        return {
          taskId: req.taskId,
          verified: false,
          status: 'FAILED',
          reason: check.reason || 'Verification query failed to find message in target channel.',
          details: check,
          timestamp,
        };
      }
    }

    return {
      taskId: req.taskId,
      verified: false,
      status: 'FAILED',
      reason: `Unknown application target: ${req.app}`,
      details: {},
      timestamp,
    };
  }
}

export const verifierAgent = new VerifierAgent();
