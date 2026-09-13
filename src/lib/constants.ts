import { AgentInfo } from '../types';

export const AGENTS: Record<string, AgentInfo> = {
  orchestrator: {
    id: 'orchestrator',
    name: 'Orchestrator Agent',
    role: 'Central Workflow Coordinator',
    app: 'system',
    status: 'IDLE',
    tasksCompleted: 0,
    description: 'Decomposes user objectives, maintains cross-agent execution lifecycle, manages error recovery and final state verification synthesis.',
    capabilities: [
      'Intent decomposition & synthesis',
      'Dependency graph scheduling',
      'Recovery & retry orchestration',
      'Unified execution reporting'
    ]
  },
  planner: {
    id: 'planner',
    name: 'Planner Agent',
    role: 'Task Structuring & Dependency Engine',
    app: 'system',
    status: 'IDLE',
    tasksCompleted: 0,
    description: 'Translates high-level goals into structured task sequences, assigns appropriate operational agents, and computes priority topologies.',
    capabilities: [
      'Structured JSON plan generation',
      'Agent role delegation mapping',
      'Priority weighting & sequencing',
      'Idempotency key attribution'
    ]
  },
  notion: {
    id: 'notion',
    name: 'Notion Agent',
    role: 'Workspace & Document Specialist',
    app: 'notion',
    status: 'IDLE',
    tasksCompleted: 0,
    description: 'Interfaces with Notion API to construct project databases, roadmap entries, task trackers, and sprint deliverables.',
    capabilities: [
      'create_notion_task',
      'update_notion_task',
      'verify_notion_task',
      'Notion blocks & properties formulation'
    ]
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar Agent',
    role: 'Time Horizon & Event Dispatcher',
    app: 'calendar',
    status: 'IDLE',
    tasksCompleted: 0,
    description: 'Inspects real-time schedule availability, reserves event slots, synchronizes attendees, and manages calendar conflicts.',
    capabilities: [
      'check_calendar_availability',
      'create_calendar_event',
      'verify_calendar_event',
      'Conflict detection & timezone alignment'
    ]
  },
  slack: {
    id: 'slack',
    name: 'Slack Agent',
    role: 'Team Comms & Notification Broadcaster',
    app: 'slack',
    status: 'IDLE',
    tasksCompleted: 0,
    description: 'Dispatches targeted updates, milestone broadcasts, and executive summaries to team channels or specific threads.',
    capabilities: [
      'send_slack_message',
      'verify_slack_message',
      'Channel routing & block kit formatting',
      'Delivery receipt polling'
    ]
  },
  verifier: {
    id: 'verifier',
    name: 'Verification Agent',
    role: 'Autonomous State Auditor',
    app: 'system',
    status: 'IDLE',
    tasksCompleted: 0,
    description: 'Independently inspects target APIs post-execution to mathematically confirm state mutation before marking tasks as verified.',
    capabilities: [
      'Independent state query audit',
      'Payload diff verification',
      'Duplicate action suppression',
      'Idempotency safety assertions'
    ]
  }
};

export const EXAMPLE_WORKFLOWS = [
  {
    title: 'Organize Hackathon Kickoff',
    prompt: 'Organize our upcoming hackathon kickoff for next Friday. Create the planning tasks, schedule the kickoff meeting, and notify the team.',
    badge: 'Popular Demo',
    tags: ['Notion', 'Calendar', 'Slack']
  },
  {
    title: 'Sprint Planning & Kickoff',
    prompt: 'Plan Sprint 24 kickoff. Create sprint backlog tasks in Notion, block out a 45-minute sprint planning calendar invite, and post the agenda to the engineering Slack channel.',
    badge: 'Operations',
    tags: ['Notion', 'Calendar', 'Slack']
  },
  {
    title: 'Client Project Onboarding',
    prompt: 'Kick off the new client onboarding pipeline: create the onboarding checklist in Notion, book the discovery kickoff call on Google Calendar, and send the welcome announcement on Slack.',
    badge: 'Client Success',
    tags: ['Notion', 'Calendar', 'Slack']
  },
  {
    title: 'Emergency Incident Briefing',
    prompt: 'Initiate critical incident post-mortem: create the incident remediation log in Notion, schedule the 30-min debrief on Calendar, and post the alert to #incident-response.',
    badge: 'DevOps',
    tags: ['Notion', 'Calendar', 'Slack']
  }
];
