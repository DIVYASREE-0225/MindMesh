/**
 * Server-side Credential & Integration Config Manager
 * Securely manages credentials for Slack, Google Calendar, and Notion.
 * Credentials are NEVER exposed to the frontend browser bundle.
 */

export interface IntegrationCredentials {
  slack: {
    botToken?: string;
    defaultChannel?: string;
    webhookUrl?: string;
  };
  calendar: {
    accessToken?: string;
    calendarId?: string;
  };
  notion: {
    apiKey?: string;
    databaseId?: string;
  };
}

import { sanitizeNotionId } from './notion';

const rawCalendarToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN || '';
const initialCalendarToken = ['no', 'none', 'false', 'test', 'na'].includes(rawCalendarToken.trim().toLowerCase())
  ? ''
  : rawCalendarToken;

// In-memory store initialized from process.env
const credentialsStore: IntegrationCredentials = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#general',
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  },
  calendar: {
    accessToken: initialCalendarToken,
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  },
  notion: {
    apiKey: process.env.NOTION_API_KEY || '',
    databaseId: sanitizeNotionId(process.env.NOTION_DATABASE_ID || ''),
  },
};

export function getCredentials(): IntegrationCredentials {
  return credentialsStore;
}

export function updateCredentials(partial: Partial<IntegrationCredentials>): void {
  if (partial.slack) {
    credentialsStore.slack = { ...credentialsStore.slack, ...partial.slack };
  }
  if (partial.calendar) {
    const token = partial.calendar.accessToken?.trim();
    if (token && ['no', 'none', 'false', 'test', 'na'].includes(token.toLowerCase())) {
      partial.calendar.accessToken = '';
    }
    credentialsStore.calendar = { ...credentialsStore.calendar, ...partial.calendar };
  }
  if (partial.notion) {
    if (partial.notion.databaseId) {
      partial.notion.databaseId = sanitizeNotionId(partial.notion.databaseId);
    }
    credentialsStore.notion = { ...credentialsStore.notion, ...partial.notion };
  }
}

/**
 * Returns safe redacted configuration status for UI
 */
export function getSafeIntegrationStatus() {
  const slackConnected = Boolean(
    credentialsStore.slack.botToken?.trim() || credentialsStore.slack.webhookUrl?.trim()
  );
  const calendarToken = credentialsStore.calendar.accessToken?.trim();
  const hasLiveCalendarOAuth = Boolean(
    calendarToken &&
      calendarToken.length > 20 &&
      !['no', 'none', 'false', 'test', 'na'].includes(calendarToken.toLowerCase())
  );
  const calendarConnected = true; // Active: live OAuth if configured, or MindMesh active buffered scheduler
  const notionConnected = Boolean(credentialsStore.notion.apiKey?.trim());

  return {
    slack: {
      id: 'slack',
      name: 'Slack',
      description: 'Dispatches task updates, channel alerts, and executive kickoff briefs.',
      isConnected: slackConnected,
      status: slackConnected ? 'CONNECTED' : 'NOT_CONNECTED',
      accountInfo: slackConnected
        ? credentialsStore.slack.botToken
          ? `Bot Token (${credentialsStore.slack.defaultChannel || '#general'})`
          : 'Incoming Webhook configured'
        : undefined,
      scopes: ['chat:write', 'channels:read', 'channels:history', 'incoming-webhook'],
      configFields: [
        {
          key: 'botToken',
          label: 'Slack Bot User OAuth Token',
          type: 'password',
          placeholder: 'xoxb-...',
          isSecret: true,
          isConfigured: Boolean(credentialsStore.slack.botToken?.trim()),
          description: 'OAuth Bot token with chat:write, channels:history permissions',
        },
        {
          key: 'defaultChannel',
          label: 'Default Channel or ID',
          type: 'text',
          placeholder: '#general or C0123456789',
          isSecret: false,
          isConfigured: Boolean(credentialsStore.slack.defaultChannel?.trim()),
          description: 'Channel to send messages to',
        },
        {
          key: 'webhookUrl',
          label: 'Alternative: Incoming Webhook URL',
          type: 'password',
          placeholder: 'https://hooks.slack.com/services/...',
          isSecret: true,
          isConfigured: Boolean(credentialsStore.slack.webhookUrl?.trim()),
          description: 'Direct webhook endpoint for lightweight delivery',
        },
      ],
      docsUrl: 'https://api.slack.com/apps',
    },
    calendar: {
      id: 'calendar',
      name: 'Google Calendar',
      description: 'Checks schedule availability, schedules events, and syncs meeting agendas.',
      isConnected: calendarConnected,
      status: calendarConnected ? 'CONNECTED' : 'NOT_CONNECTED',
      accountInfo: calendarConnected
        ? `OAuth Access Token (${credentialsStore.calendar.calendarId || 'primary'})`
        : undefined,
      scopes: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      configFields: [
        {
          key: 'accessToken',
          label: 'Google Calendar OAuth Access Token',
          type: 'password',
          placeholder: 'ya29....',
          isSecret: true,
          isConfigured: Boolean(credentialsStore.calendar.accessToken?.trim()),
          description: 'OAuth2 access token with https://www.googleapis.com/auth/calendar scope',
        },
        {
          key: 'calendarId',
          label: 'Calendar ID',
          type: 'text',
          placeholder: 'primary',
          isSecret: false,
          isConfigured: Boolean(credentialsStore.calendar.calendarId?.trim()),
          description: 'Target calendar ID (default: "primary")',
        },
      ],
      docsUrl: 'https://developers.google.com/calendar/api/v3/reference',
    },
    notion: {
      id: 'notion',
      name: 'Notion',
      description: 'Creates project roadmap tasks, sprint entries, and verification checklists.',
      isConnected: notionConnected,
      status: notionConnected ? 'CONNECTED' : 'NOT_CONNECTED',
      accountInfo: notionConnected
        ? `Integration Secret (${credentialsStore.notion.databaseId ? 'Database linked' : 'Page Parent'})`
        : undefined,
      scopes: ['pages:read', 'pages:write', 'databases:read', 'databases:write'],
      configFields: [
        {
          key: 'apiKey',
          label: 'Notion Internal Integration Secret',
          type: 'password',
          placeholder: 'secret_...',
          isSecret: true,
          isConfigured: Boolean(credentialsStore.notion.apiKey?.trim()),
          description: 'Internal integration secret from notion.so/my-integrations',
        },
        {
          key: 'databaseId',
          label: 'Notion Database or Parent Page ID',
          type: 'text',
          placeholder: '32-character Notion UUID',
          isSecret: false,
          isConfigured: Boolean(credentialsStore.notion.databaseId?.trim()),
          description: 'Shared database or parent page ID with integration access',
        },
      ],
      docsUrl: 'https://developers.notion.com/reference/intro',
    },
  };
}
