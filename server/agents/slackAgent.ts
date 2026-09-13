/**
 * Slack Agent
 * Responsible ONLY for Slack operations.
 */

import { sendSlackMessage, verifySlackMessage } from '../integrations/slack';

export class SlackAgent {
  readonly id = 'slack';
  readonly name = 'Slack Agent';

  async postMessage(params: {
    channel?: string;
    message: string;
    blocks?: any[];
  }) {
    return await sendSlackMessage(params);
  }

  async verifyMessage(channel: string, messageId: string) {
    return await verifySlackMessage({ channel, messageId });
  }
}

export const slackAgent = new SlackAgent();
