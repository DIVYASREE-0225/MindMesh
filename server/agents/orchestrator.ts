/**
 * Orchestrator Agent & Workflow Engine
 * Coordinates the full multi-agent lifecycle:
 * Understanding -> Planning -> Delegating -> Executing -> Verifying -> Completed
 */

import { EventEmitter } from 'events';
import { getGeminiClient } from '../gemini';
import { generatePlan, PlannedTask } from './planner';
import { notionAgent } from './notionAgent';
import { calendarAgent } from './calendarAgent';
import { slackAgent } from './slackAgent';
import { verifierAgent } from './verifierAgent';
import {
  Workflow,
  WorkflowTask,
  ActivityLog,
  WorkflowStage,
  AgentId,
  AgentStatus,
} from '../../src/types';

export class WorkflowEngine extends EventEmitter {
  private activeWorkflows: Map<string, Workflow> = new Map();
  private workflowLogs: ActivityLog[] = [];
  private agentStatuses: Map<AgentId, { status: AgentStatus; tasksCompleted: number; lastAction?: string }> =
    new Map();

  constructor() {
    super();
    this.resetAgentStatuses();
  }

  private resetAgentStatuses() {
    const agents: AgentId[] = ['orchestrator', 'planner', 'notion', 'calendar', 'slack', 'verifier'];
    for (const a of agents) {
      if (!this.agentStatuses.has(a)) {
        this.agentStatuses.set(a, { status: 'IDLE', tasksCompleted: 0 });
      } else {
        const current = this.agentStatuses.get(a)!;
        this.agentStatuses.set(a, { ...current, status: 'IDLE' });
      }
    }
  }

  public getAgentStatuses() {
    return Object.fromEntries(this.agentStatuses.entries());
  }

  public getAllLogs(): ActivityLog[] {
    return this.workflowLogs;
  }

  public getAllWorkflows(): Workflow[] {
    return Array.from(this.activeWorkflows.values()).reverse();
  }

  public getWorkflow(id: string): Workflow | undefined {
    return this.activeWorkflows.get(id);
  }

  private logActivity(params: {
    workflowId?: string;
    agent: AgentId;
    agentName: string;
    action: string;
    app?: 'slack' | 'calendar' | 'notion' | 'system';
    status: 'SUCCESS' | 'VERIFIED' | 'FAILED' | 'RETRYING' | 'INFO';
    durationMs?: number;
    details?: string;
    payload?: any;
  }) {
    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      workflowId: params.workflowId,
      timestamp: new Date().toISOString(),
      agent: params.agent,
      agentName: params.agentName,
      action: params.action,
      app: params.app,
      status: params.status,
      durationMs: params.durationMs,
      details: params.details,
      payload: params.payload,
    };

    this.workflowLogs.unshift(log);
    if (this.workflowLogs.length > 500) {
      this.workflowLogs.pop();
    }

    if (params.workflowId && this.activeWorkflows.has(params.workflowId)) {
      const wf = this.activeWorkflows.get(params.workflowId)!;
      wf.logs.unshift(log);
    }

    // Update agent state
    const current = this.agentStatuses.get(params.agent) || { status: 'IDLE', tasksCompleted: 0 };
    current.lastAction = params.action;
    if (params.status === 'VERIFIED') {
      current.tasksCompleted += 1;
    }
    this.agentStatuses.set(params.agent, current);

    this.emit('log', log);
    return log;
  }

  private updateAgentStatus(agent: AgentId, status: AgentStatus) {
    const current = this.agentStatuses.get(agent) || { status: 'IDLE', tasksCompleted: 0 };
    current.status = status;
    this.agentStatuses.set(agent, current);
    this.emit('agent_status', { agent, status });
  }

  private emitWorkflowUpdate(wf: Workflow) {
    this.activeWorkflows.set(wf.id, { ...wf });
    this.emit('workflow_update', wf);
  }

  /**
   * Main Orchestrator Run Loop
   */
  async runWorkflow(goal: string): Promise<Workflow> {
    const workflowId = `wf_${Date.now()}`;
    const startTime = new Date().toISOString();

    const workflow: Workflow = {
      id: workflowId,
      title: goal.length > 60 ? `${goal.substring(0, 57)}...` : goal,
      originalGoal: goal,
      status: 'RUNNING',
      currentStage: 'UNDERSTANDING',
      tasks: [],
      startTime,
      memory: {
        createdEventIds: [],
        createdNotionPageIds: [],
        sentSlackMessageIds: [],
        sessionData: {},
      },
      logs: [],
    };

    this.activeWorkflows.set(workflowId, workflow);
    this.emitWorkflowUpdate(workflow);

    try {
      // 1. UNDERSTANDING PHASE
      this.updateAgentStatus('orchestrator', 'THINKING');
      this.logActivity({
        workflowId,
        agent: 'orchestrator',
        agentName: 'Orchestrator Agent',
        action: 'Understanding goal and synthesizing operational scope',
        app: 'system',
        status: 'INFO',
        details: `Input: "${goal}"`,
      });

      await new Promise((r) => setTimeout(r, 600));

      // 2. PLANNING PHASE
      workflow.currentStage = 'PLANNING';
      this.emitWorkflowUpdate(workflow);

      this.updateAgentStatus('orchestrator', 'EXECUTING');
      this.updateAgentStatus('planner', 'THINKING');
      this.logActivity({
        workflowId,
        agent: 'planner',
        agentName: 'Planner Agent',
        action: 'Generating structured task execution graph via Gemini',
        app: 'system',
        status: 'INFO',
      });

      const planStartTime = Date.now();
      let plannedTasks: PlannedTask[] = [];
      try {
        plannedTasks = await generatePlan(goal);
      } catch (err: any) {
        this.logActivity({
          workflowId,
          agent: 'planner',
          agentName: 'Planner Agent',
          action: 'Planner generation failed',
          app: 'system',
          status: 'FAILED',
          details: err.message,
        });
        throw new Error(`Planner failed: ${err.message}`);
      }

      this.updateAgentStatus('planner', 'COMPLETED');
      this.logActivity({
        workflowId,
        agent: 'planner',
        agentName: 'Planner Agent',
        action: `Created structured execution plan with ${plannedTasks.length} tasks`,
        app: 'system',
        status: 'SUCCESS',
        durationMs: Date.now() - planStartTime,
        payload: plannedTasks,
      });

      // Populate workflow tasks
      workflow.tasks = plannedTasks.map((pt) => ({
        id: pt.id,
        title: pt.title,
        description: pt.description,
        agent: pt.agent,
        app: pt.app,
        priority: pt.priority,
        dependencies: pt.dependencies,
        status: 'PENDING',
        toolUsed: pt.toolName,
        toolInput: pt.toolInput,
        retryCount: 0,
        maxRetries: 2,
      }));

      // 3. DELEGATING & EXECUTING PHASE
      workflow.currentStage = 'DELEGATING';
      this.emitWorkflowUpdate(workflow);
      await new Promise((r) => setTimeout(r, 500));

      workflow.currentStage = 'EXECUTING';
      this.emitWorkflowUpdate(workflow);

      let anyFailure = false;

      // Sort tasks by priority
      const sortedTasks = [...workflow.tasks].sort((a, b) => a.priority - b.priority);

      for (const task of sortedTasks) {
        await this.executeAndVerifyTask(workflow, task);
        if (task.status === 'FAILED') {
          anyFailure = true;
        }
      }

      // 4. SYNTHESIS & REPORT PHASE
      workflow.currentStage = 'COMPLETED';
      workflow.status = anyFailure ? 'PARTIAL_SUCCESS' : 'COMPLETED';
      workflow.endTime = new Date().toISOString();
      workflow.executionTimeMs = Date.now() - new Date(startTime).getTime();

      // Generate concise executive summary
      this.updateAgentStatus('orchestrator', 'THINKING');
      const summary = await this.generateFinalSummary(workflow);
      workflow.summary = summary;

      this.updateAgentStatus('orchestrator', 'COMPLETED');
      this.logActivity({
        workflowId,
        agent: 'orchestrator',
        agentName: 'Orchestrator Agent',
        action: 'Generated final workflow execution report',
        app: 'system',
        status: 'SUCCESS',
        details: summary,
      });

      this.emitWorkflowUpdate(workflow);
      return workflow;
    } catch (err: any) {
      workflow.status = 'FAILED';
      workflow.currentStage = 'FAILED';
      workflow.endTime = new Date().toISOString();
      workflow.executionTimeMs = Date.now() - new Date(startTime).getTime();
      workflow.summary = `Workflow execution stopped with critical error: ${err.message}`;

      this.updateAgentStatus('orchestrator', 'ERROR');
      this.logActivity({
        workflowId,
        agent: 'orchestrator',
        agentName: 'Orchestrator Agent',
        action: 'Workflow failed',
        app: 'system',
        status: 'FAILED',
        details: err.message,
      });

      this.emitWorkflowUpdate(workflow);
      return workflow;
    }
  }

  /**
   * Executes a single task with specialized agent, then hands off to Verification Agent
   */
  private async executeAndVerifyTask(workflow: Workflow, task: WorkflowTask): Promise<void> {
    const taskIndex = workflow.tasks.findIndex((t) => t.id === task.id);
    if (taskIndex === -1) return;

    let attempts = 0;
    let verified = false;

    while (attempts <= task.maxRetries && !verified) {
      attempts += 1;
      task.retryCount = attempts - 1;
      task.status = attempts > 1 ? 'RETRYING' : 'RUNNING';
      workflow.tasks[taskIndex] = { ...task };
      this.emitWorkflowUpdate(workflow);

      this.updateAgentStatus(task.agent, 'EXECUTING');
      this.logActivity({
        workflowId: workflow.id,
        agent: task.agent,
        agentName: `${task.agent.toUpperCase()} Agent`,
        action: `${task.toolUsed || 'execute'} (Attempt ${attempts}/${task.maxRetries + 1})`,
        app: task.app,
        status: attempts > 1 ? 'RETRYING' : 'INFO',
        details: `Executing: ${task.title}`,
      });

      const execStart = Date.now();
      let toolResult: any = null;

      try {
        if (task.agent === 'notion') {
          toolResult = await notionAgent.executeTask({
            title: task.toolInput?.title || task.title,
            description: task.toolInput?.description || task.description,
            status: task.toolInput?.status || 'To Do',
          });
          if (toolResult.pageId) {
            task.externalId = toolResult.pageId;
            task.externalUrl = toolResult.pageUrl;
            workflow.memory.createdNotionPageIds.push(toolResult.pageId);
          }
        } else if (task.agent === 'calendar') {
          // Idempotency: Check if already created during retry
          if (task.externalId) {
            toolResult = {
              success: true,
              eventId: task.externalId,
              eventUrl: task.externalUrl,
              title: task.toolInput?.title || task.title,
            };
          } else {
            // Check availability first if possible
            if (task.toolInput?.startTime && task.toolInput?.endTime) {
              await calendarAgent.checkAvailability(task.toolInput.startTime, task.toolInput.endTime);
            }

            toolResult = await calendarAgent.scheduleEvent({
              title: task.toolInput?.title || task.title,
              description: task.toolInput?.description || task.description,
              startTime: task.toolInput?.startTime || new Date(Date.now() + 86400000).toISOString(),
              endTime: task.toolInput?.endTime || new Date(Date.now() + 90000000).toISOString(),
              location: task.toolInput?.location,
              attendees: task.toolInput?.attendees,
            });

            if (toolResult.eventId) {
              task.externalId = toolResult.eventId;
              task.externalUrl = toolResult.eventUrl;
              workflow.memory.createdEventIds.push(toolResult.eventId);
            }
          }
        } else if (task.agent === 'slack') {
          // Format Slack message with workflow context if available
          let msgText = task.toolInput?.message || `*${task.title}*\n${task.description || ''}`;
          if (workflow.memory.createdEventIds.length > 0) {
            msgText += `\n📅 *Calendar Event Created*: ${workflow.tasks.find((t) => t.agent === 'calendar')?.title || 'Scheduled'}`;
          }
          if (workflow.memory.createdNotionPageIds.length > 0) {
            msgText += `\n📝 *Notion Tasks*: Created in workspace`;
          }

          toolResult = await slackAgent.postMessage({
            channel: task.toolInput?.channel || '#general',
            message: msgText,
          });

          if (toolResult.messageId) {
            task.externalId = toolResult.messageId;
            workflow.memory.sentSlackMessageIds.push(toolResult.messageId);
          }
        }
      } catch (err: any) {
        toolResult = {
          success: false,
          error: err.message,
          retryable: true,
        };
      }

      task.executionTimeMs = Date.now() - execStart;
      task.toolResult = toolResult;

      if (!toolResult?.success) {
        task.error = toolResult?.error || 'Execution failed';
        this.updateAgentStatus(task.agent, 'ERROR');
        this.logActivity({
          workflowId: workflow.id,
          agent: task.agent,
          agentName: `${task.agent.toUpperCase()} Agent`,
          action: `${task.toolUsed} failed`,
          app: task.app,
          status: 'FAILED',
          durationMs: task.executionTimeMs,
          details: task.error,
        });

        // Check if retryable
        if (toolResult?.retryable && attempts <= task.maxRetries) {
          await new Promise((r) => setTimeout(r, 1200));
          continue; // Retry loop
        } else {
          task.status = 'FAILED';
          workflow.tasks[taskIndex] = { ...task };
          this.emitWorkflowUpdate(workflow);
          return;
        }
      }

      // Action returned success from API -> Now Hand Off to Verification Agent
      this.updateAgentStatus(task.agent, 'COMPLETED');
      this.updateAgentStatus('verifier', 'VERIFYING');
      task.verificationStatus = 'VERIFYING';
      workflow.tasks[taskIndex] = { ...task };
      this.emitWorkflowUpdate(workflow);

      this.logActivity({
        workflowId: workflow.id,
        agent: 'verifier',
        agentName: 'Verification Agent',
        action: `Auditing ${task.app} state for task: ${task.title}`,
        app: task.app,
        status: 'INFO',
        details: `Verifying receipt ID: ${task.externalId || 'unknown'}`,
      });

      const auditStart = Date.now();
      const report = await verifierAgent.auditAction({
        taskId: task.id,
        taskTitle: task.title,
        app: task.app,
        toolUsed: task.toolUsed || '',
        toolResult: task.toolResult,
        expectedParams: task.toolInput,
      });

      if (report.verified) {
        verified = true;
        task.status = 'VERIFIED';
        task.verificationStatus = 'VERIFIED';
        task.verificationDetails = report.reason;

        this.updateAgentStatus('verifier', 'COMPLETED');
        this.logActivity({
          workflowId: workflow.id,
          agent: 'verifier',
          agentName: 'Verification Agent',
          action: `Certified state: ${task.title}`,
          app: task.app,
          status: 'VERIFIED',
          durationMs: Date.now() - auditStart,
          details: report.reason,
        });
      } else {
        task.verificationStatus = 'FAILED';
        task.verificationDetails = report.reason;

        this.updateAgentStatus('verifier', 'ERROR');
        this.logActivity({
          workflowId: workflow.id,
          agent: 'verifier',
          agentName: 'Verification Agent',
          action: `Verification failed for: ${task.title}`,
          app: task.app,
          status: 'FAILED',
          durationMs: Date.now() - auditStart,
          details: report.reason,
        });

        // Retry if possible
        if (attempts <= task.maxRetries) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        } else {
          task.status = 'FAILED';
        }
      }

      workflow.tasks[taskIndex] = { ...task };
      this.emitWorkflowUpdate(workflow);
    }
  }

  /**
   * Synthesizes a clean executive report
   */
  private async generateFinalSummary(wf: Workflow): Promise<string> {
    const verifiedTasks = wf.tasks.filter((t) => t.status === 'VERIFIED');
    const failedTasks = wf.tasks.filter((t) => t.status === 'FAILED');

    try {
      const ai = getGeminiClient();
      const prompt = `You are the Orchestrator for MindMesh.
Summarize the execution of this workflow in a clean, professional, concise report (3-4 short bullet points, no fluff, no marketing jargon):
Goal: "${wf.originalGoal}"
Total Tasks: ${wf.tasks.length}
Verified Tasks: ${verifiedTasks.length}
Failed Tasks: ${failedTasks.length}
Tasks Details:
${wf.tasks
  .map(
    (t) =>
      `- [${t.status}] ${t.title} (${t.app}): ${
        t.status === 'VERIFIED' ? t.verificationDetails || 'Verified' : t.error || 'Failed'
      }`
  )
  .join('\n')}

Format requirement:
Start with: "Workflow completed ${failedTasks.length > 0 ? 'with partial success' : 'successfully'}."
Follow with crisp bullet points starting with checkmarks (✓) or alerts (⚠).`;

      let summaryText = '';
      for (const modelName of ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-3.8-flash']) {
        try {
          const res = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
          });
          summaryText = res.text?.trim() || '';
          if (summaryText) break;
        } catch {
          // try next model
        }
      }

      return summaryText || 'Workflow execution completed.';
    } catch {
      // Fallback deterministic summary
      return `Workflow completed ${failedTasks.length > 0 ? 'with partial success' : 'successfully'}.\n${wf.tasks
        .map((t) => `${t.status === 'VERIFIED' ? '✓' : '⚠'} ${t.title} (${t.app.toUpperCase()}): ${t.status}`)
        .join('\n')}\n✓ All external actions audited by Verification Agent.`;
    }
  }
}

// Global Singleton
export const globalWorkflowEngine = new WorkflowEngine();
