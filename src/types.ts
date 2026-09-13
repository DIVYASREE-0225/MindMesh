export type AgentId = 'orchestrator' | 'planner' | 'notion' | 'calendar' | 'slack' | 'verifier';

export type AgentStatus = 'IDLE' | 'THINKING' | 'EXECUTING' | 'VERIFYING' | 'COMPLETED' | 'ERROR';

export interface AgentInfo {
  id: AgentId;
  name: string;
  role: string;
  app?: 'slack' | 'calendar' | 'notion' | 'system';
  status: AgentStatus;
  tasksCompleted: number;
  lastAction?: string;
  lastActionTime?: string;
  description: string;
  capabilities: string[];
}

export type Agent = AgentInfo;

export type TaskStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'WAITING'
  | 'SUCCESS'
  | 'VERIFIED'
  | 'FAILED'
  | 'RETRYING';

export type IntegrationApp = 'slack' | 'calendar' | 'notion';

export interface WorkflowTask {
  id: string;
  title: string;
  description?: string;
  agent: AgentId;
  app: IntegrationApp;
  priority: number;
  dependencies?: string[];
  status: TaskStatus;
  toolUsed?: string;
  toolInput?: Record<string, any>;
  toolResult?: Record<string, any>;
  verificationStatus?: 'PENDING' | 'VERIFYING' | 'VERIFIED' | 'FAILED' | 'SKIPPED';
  verificationDetails?: string;
  retryCount: number;
  maxRetries: number;
  error?: string;
  executionTimeMs?: number;
  externalId?: string;
  externalUrl?: string;
}

export type WorkflowStage =
  | 'UNDERSTANDING'
  | 'PLANNING'
  | 'DELEGATING'
  | 'EXECUTING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'FAILED';

export interface WorkflowMemory {
  userPreferences?: Record<string, any>;
  createdEventIds: string[];
  createdNotionPageIds: string[];
  sentSlackMessageIds: string[];
  sessionData: Record<string, any>;
}

export interface Workflow {
  id: string;
  title: string;
  originalGoal: string;
  status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL_SUCCESS';
  currentStage: WorkflowStage;
  tasks: WorkflowTask[];
  startTime: string;
  endTime?: string;
  executionTimeMs?: number;
  summary?: string;
  memory: WorkflowMemory;
  logs: ActivityLog[];
}

export interface ActivityLog {
  id: string;
  workflowId?: string;
  timestamp: string;
  agent: AgentId;
  agentName: string;
  action: string;
  app?: IntegrationApp | 'system';
  status: 'SUCCESS' | 'VERIFIED' | 'FAILED' | 'RETRYING' | 'INFO';
  durationMs?: number;
  details?: string;
  payload?: any;
}

export interface IntegrationConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'select';
  placeholder: string;
  isSecret: boolean;
  isConfigured: boolean;
  description?: string;
}

export interface IntegrationStatus {
  id: IntegrationApp;
  name: string;
  description: string;
  isConnected: boolean;
  status: 'CONNECTED' | 'NOT_CONNECTED' | 'ERROR';
  lastTested?: string;
  errorMessage?: string;
  accountInfo?: string;
  scopes?: string[];
  configFields: IntegrationConfigField[];
  docsUrl: string;
}
