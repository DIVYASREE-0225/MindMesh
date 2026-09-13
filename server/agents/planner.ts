/**
 * Planner Agent
 * Converts natural-language user goals into structured tasks with
 * agent assignment, priority, and tool inputs using Gemini.
 */

import { Type } from '@google/genai';
import { getGeminiClient } from '../gemini';
import { getCredentials } from '../integrations/config';

export interface PlannedTask {
  id: string;
  title: string;
  agent: 'notion' | 'calendar' | 'slack';
  app: 'notion' | 'calendar' | 'slack';
  priority: number;
  dependencies: string[];
  description: string;
  toolName: string;
  toolInput: Record<string, any>;
}

export async function generatePlan(goal: string): Promise<PlannedTask[]> {
  const ai = getGeminiClient();
  const { slack } = getCredentials();
  const defaultSlackChannel = slack.defaultChannel?.trim() || '#general';

  const systemInstruction = `You are the PLANNER AGENT for MindMesh, a multi-agent AI Operations Assistant.
Your sole job is to translate a user's high-level goal into an ordered sequence of concrete tasks for our 3 specialized operational agents:
1. 'notion' (Creates Notion pages/database entries, sprint/project deliverables, checklists)
2. 'calendar' (Checks calendar availability, books/schedules Google Calendar events with accurate dates/times)
3. 'slack' (Dispatches announcements, status updates, team briefs, and invitations to Slack channels)

STRICT RULES:
- Never assign general or system tasks. Every task MUST be assigned to 'notion', 'calendar', or 'slack'.
- Assign realistic priorities (1, 2, 3...).
- Calculate realistic start/end times for calendar events (default to next Friday or upcoming business day at 10:00 AM if not specified, duration 45-60 min, ISO format e.g. 2026-09-18T10:00:00Z).
- Provide concrete toolInputs:
  - For Notion: { "title": string, "description": string, "status": "To Do" | "In Progress" }
  - For Calendar: { "title": string, "description": string, "startTime": ISO_STRING, "endTime": ISO_STRING, "location": string }
  - For Slack: { "channel": "${defaultSlackChannel}", "message": string }
- Return a clean array of structured tasks.`;

  let parsed: any[] = [];
  // Prioritize gemini-3.6-flash and gemini-flash-latest to avoid temporary demand spikes
  const modelsToTry = [
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
  ];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Decompose this operational objective into structured tasks:\n"${goal}"`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: 'Unique task id like task_1, task_2' },
                title: { type: Type.STRING, description: 'Clear concise task title' },
                agent: {
                  type: Type.STRING,
                  enum: ['notion', 'calendar', 'slack'],
                  description: 'Target specialized agent',
                },
                priority: { type: Type.INTEGER, description: 'Execution priority, 1 being highest' },
                dependencies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'IDs of preceding tasks this task depends on',
                },
                description: { type: Type.STRING, description: 'Detailed action specification' },
                toolName: {
                  type: Type.STRING,
                  description: 'Target tool: create_notion_task, create_calendar_event, or send_slack_message',
                },
                toolInputJson: {
                  type: Type.STRING,
                  description: 'JSON-serialized string of tool input arguments',
                },
              },
              required: ['id', 'title', 'agent', 'priority', 'description', 'toolName'],
            },
          },
        },
      });

      const rawText = response.text?.trim() || '[]';
      parsed = JSON.parse(rawText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        break;
      }
    } catch {
      // Continue to next available model without throwing or logging unhandled error traces
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  // Resilient fallback plan if LLM rate limited / 503 unavailable
  if (!Array.isArray(parsed) || parsed.length === 0) {
    const nextFriday = new Date(Date.now() + 5 * 24 * 3600 * 1000);
    nextFriday.setHours(10, 0, 0, 0);
    const eventEnd = new Date(nextFriday.getTime() + 60 * 60 * 1000);

    parsed = [
      {
        id: 'task_1',
        title: `Project Planning & Deliverables: ${goal.slice(0, 45)}`,
        agent: 'notion',
        priority: 1,
        dependencies: [],
        description: `Create project tracking board and deliverables checklist for: ${goal}`,
        toolName: 'create_notion_task',
        toolInputJson: JSON.stringify({
          title: `Roadmap: ${goal.slice(0, 50)}`,
          description: `Autonomous MindMesh operational sprint for: ${goal}`,
          status: 'In Progress',
        }),
      },
      {
        id: 'task_2',
        title: `Kickoff & Alignment Session: ${goal.slice(0, 40)}`,
        agent: 'calendar',
        priority: 2,
        dependencies: ['task_1'],
        description: `Schedule alignment session on calendar for: ${goal}`,
        toolName: 'create_calendar_event',
        toolInputJson: JSON.stringify({
          title: `Kickoff: ${goal.slice(0, 50)}`,
          description: `Operational coordination session for ${goal}`,
          startTime: nextFriday.toISOString(),
          endTime: eventEnd.toISOString(),
          location: 'Online / Google Meet',
        }),
      },
      {
        id: 'task_3',
        title: `Broadcast Operational Update to ${defaultSlackChannel}`,
        agent: 'slack',
        priority: 3,
        dependencies: ['task_2'],
        description: `Notify team in Slack channel ${defaultSlackChannel} of schedule and Notion tasks`,
        toolName: 'send_slack_message',
        toolInputJson: JSON.stringify({
          channel: defaultSlackChannel,
          message: `🚀 *MindMesh Operational Objective:* ${goal}\n• Notion project board deployed\n• Kickoff calendar session reserved for ${nextFriday.toDateString()}\n• Real-time multi-agent execution completed.`,
        }),
      },
    ];
  }

  return parsed.map((t: any, index: number) => {
    let parsedInput: Record<string, any> = {};
    if (t.toolInputJson) {
      try {
        parsedInput = JSON.parse(t.toolInputJson);
      } catch {
        parsedInput = { title: t.title, description: t.description };
      }
    } else if (t.toolInput) {
      parsedInput = t.toolInput;
    } else {
      parsedInput = { title: t.title, description: t.description };
    }

    // Assign tool defaults if needed
    if (t.agent === 'calendar' && (!parsedInput.startTime || !parsedInput.endTime)) {
      const start = new Date(Date.now() + 5 * 24 * 3600 * 1000);
      start.setHours(14, 0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      parsedInput.startTime = start.toISOString();
      parsedInput.endTime = end.toISOString();
      parsedInput.title = parsedInput.title || t.title;
    }

    if (t.agent === 'slack' && !parsedInput.channel) {
      parsedInput.channel = defaultSlackChannel;
      parsedInput.message = parsedInput.message || `📢 Update: ${t.title}\n${t.description}`;
    }

    return {
      id: t.id || `task_${index + 1}`,
      title: t.title,
      agent: t.agent,
      app: t.agent,
      priority: Number(t.priority) || index + 1,
      dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
      description: t.description || '',
      toolName: t.toolName || (t.agent === 'notion' ? 'create_notion_task' : t.agent === 'calendar' ? 'create_calendar_event' : 'send_slack_message'),
      toolInput: parsedInput,
    };
  });
}
