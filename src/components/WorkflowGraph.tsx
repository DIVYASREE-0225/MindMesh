import React from 'react';
import {
  Workflow,
  AgentId,
  AgentStatus,
  WorkflowStage,
} from '../types';
import {
  Bot,
  Calendar,
  MessageSquare,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Workflow as WorkflowIcon,
  Compass,
} from 'lucide-react';

interface WorkflowGraphProps {
  workflow?: Workflow | null;
  agentStatuses: Record<string, { status: AgentStatus; lastAction?: string }>;
  onSelectAgent?: (agentId: AgentId) => void;
  selectedAgentId?: AgentId | null;
}

export const WorkflowGraph: React.FC<WorkflowGraphProps> = ({
  workflow,
  agentStatuses,
  onSelectAgent,
  selectedAgentId,
}) => {
  const currentStage: WorkflowStage = workflow?.currentStage || 'UNDERSTANDING';

  // Helper to get agent real-time badge
  const getAgentNodeState = (agentId: AgentId) => {
    const dynStatus = agentStatuses[agentId]?.status || 'IDLE';
    const activeTask = workflow?.tasks?.find((t) => t.agent === agentId && (t.status === 'RUNNING' || t.status === 'RETRYING'));
    const verifiedTask = workflow?.tasks?.find((t) => t.agent === agentId && t.status === 'VERIFIED');
    const failedTask = workflow?.tasks?.find((t) => t.agent === agentId && t.status === 'FAILED');

    let state: 'IDLE' | 'ACTIVE' | 'VERIFIED' | 'FAILED' = 'IDLE';
    if (activeTask || dynStatus === 'EXECUTING' || dynStatus === 'THINKING' || dynStatus === 'VERIFYING') {
      state = 'ACTIVE';
    } else if (failedTask) {
      state = 'FAILED';
    } else if (verifiedTask || dynStatus === 'COMPLETED') {
      state = 'VERIFIED';
    }

    return {
      status: dynStatus,
      state,
      taskCount: workflow?.tasks?.filter((t) => t.agent === agentId).length || 0,
      activeTask,
      verifiedTask,
      failedTask,
      lastAction: agentStatuses[agentId]?.lastAction,
    };
  };

  const orchestratorState = getAgentNodeState('orchestrator');
  const plannerState = getAgentNodeState('planner');
  const notionState = getAgentNodeState('notion');
  const calendarState = getAgentNodeState('calendar');
  const slackState = getAgentNodeState('slack');
  const verifierState = getAgentNodeState('verifier');

  const isWorkflowActive = workflow?.status === 'RUNNING';
  const isCompleted = workflow?.status === 'COMPLETED' || workflow?.status === 'PARTIAL_SUCCESS';

  return (
    <div
      id="workflow-graph-container"
      className="relative rounded-2xl bg-[#0B0E17]/80 border border-white/[0.08] p-6 shadow-2xl backdrop-blur-sm overflow-hidden"
    >
      {/* Background ambient grid pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e2538_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

      {/* Top Header info */}
      <div className="flex items-center justify-between relative z-10 mb-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <WorkflowIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Agent Execution Topology
              {workflow && (
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-300 font-mono">
                  {workflow.id}
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Live multi-agent coordination with autonomous verification handshake
            </p>
          </div>
        </div>

        {/* Workflow Stage Progress Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          {(['UNDERSTANDING', 'PLANNING', 'DELEGATING', 'EXECUTING', 'VERIFYING', 'COMPLETED'] as WorkflowStage[]).map(
            (stage, idx) => {
              const isCurrent = currentStage === stage && isWorkflowActive;
              const isPast =
                isCompleted ||
                (currentStage === 'COMPLETED') ||
                (['UNDERSTANDING', 'PLANNING', 'DELEGATING', 'EXECUTING', 'VERIFYING', 'COMPLETED'].indexOf(currentStage) > idx);

              return (
                <div
                  key={stage}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                    isCurrent
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 shadow-sm shadow-indigo-500/20 animate-pulse'
                      : isPast
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/[0.03] text-slate-400 border border-transparent'
                  }`}
                >
                  {isCurrent && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                  {isPast && <CheckCircle2 className="w-2.5 h-2.5" />}
                  <span>{stage}</span>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* GRAPH TOPOLOGY CANVAS */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto py-2">
        {/* ROW 1: ORCHESTRATOR AGENT */}
        <div className="w-full flex justify-center mb-5">
          <div
            id="node-orchestrator"
            onClick={() => onSelectAgent?.('orchestrator')}
            className={`cursor-pointer transition-all duration-200 w-72 rounded-xl p-3.5 border flex items-center justify-between ${
              orchestratorState.state === 'ACTIVE'
                ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/40'
                : 'bg-[#121622] border-white/[0.1] hover:border-indigo-400/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  orchestratorState.state === 'ACTIVE'
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20'
                }`}
              >
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">ORCHESTRATOR</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    Master
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {orchestratorState.state === 'ACTIVE' ? 'Coordinating tasks...' : 'Workflow Director'}
                </p>
              </div>
            </div>
            <div>
              {orchestratorState.state === 'ACTIVE' ? (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 uppercase font-mono">
                  {orchestratorState.status}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CONNECTING LINE 1 */}
        <div className="h-6 w-0.5 bg-gradient-to-b from-indigo-500/60 to-violet-500/60 relative">
          {isWorkflowActive && (
            <div className="absolute inset-0 bg-cyan-400 animate-ping opacity-75" />
          )}
        </div>

        {/* ROW 2: PLANNER AGENT */}
        <div className="w-full flex justify-center mb-5">
          <div
            id="node-planner"
            onClick={() => onSelectAgent?.('planner')}
            className={`cursor-pointer transition-all duration-200 w-72 rounded-xl p-3 border flex items-center justify-between ${
              plannerState.state === 'ACTIVE'
                ? 'bg-violet-950/40 border-violet-500/60 shadow-lg shadow-violet-500/20 ring-1 ring-violet-500/40'
                : 'bg-[#121622] border-white/[0.1] hover:border-violet-400/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  plannerState.state === 'ACTIVE'
                    ? 'bg-violet-600 text-white animate-pulse'
                    : 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                }`}
              >
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">PLANNER</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 font-mono">
                    Schema
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {plannerState.state === 'ACTIVE' ? 'Generating task graph...' : 'Structured Planner'}
                </p>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {plannerState.state === 'ACTIVE' ? 'THINKING' : plannerState.state === 'VERIFIED' ? 'READY' : 'IDLE'}
            </div>
          </div>
        </div>

        {/* SPLIT BRANCHES TO 3 OPERATIONAL AGENTS */}
        <div className="w-full relative py-1 mb-5">
          {/* Horizontal crossbar connecting the 3 columns */}
          <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-500/40 via-violet-500/40 to-amber-500/40" />
          <div className="grid grid-cols-3 gap-4 pt-4">
            {/* NOTION AGENT */}
            <div
              id="node-notion"
              onClick={() => onSelectAgent?.('notion')}
              className={`cursor-pointer rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between min-h-[96px] ${
                notionState.state === 'ACTIVE'
                  ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/40'
                  : notionState.state === 'VERIFIED'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-[#121622] border-white/[0.08] hover:border-blue-400/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/20">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Notion Agent</h4>
                    <span className="text-[10px] text-slate-400">Tasks & DB</span>
                  </div>
                </div>
                {notionState.state === 'ACTIVE' && (
                  <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                )}
                {notionState.state === 'VERIFIED' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {notionState.state === 'FAILED' && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px]">
                <span className="text-slate-400">create_notion_task</span>
                <span
                  className={`font-semibold ${
                    notionState.state === 'VERIFIED'
                      ? 'text-emerald-400'
                      : notionState.state === 'ACTIVE'
                      ? 'text-blue-400'
                      : 'text-slate-400'
                  }`}
                >
                  {notionState.state}
                </span>
              </div>
            </div>

            {/* CALENDAR AGENT */}
            <div
              id="node-calendar"
              onClick={() => onSelectAgent?.('calendar')}
              className={`cursor-pointer rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between min-h-[96px] ${
                calendarState.state === 'ACTIVE'
                  ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/40'
                  : calendarState.state === 'VERIFIED'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-[#121622] border-white/[0.08] hover:border-amber-400/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/20">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Calendar Agent</h4>
                    <span className="text-[10px] text-slate-400">G-Calendar</span>
                  </div>
                </div>
                {calendarState.state === 'ACTIVE' && (
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                )}
                {calendarState.state === 'VERIFIED' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {calendarState.state === 'FAILED' && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px]">
                <span className="text-slate-400">schedule_event</span>
                <span
                  className={`font-semibold ${
                    calendarState.state === 'VERIFIED'
                      ? 'text-emerald-400'
                      : calendarState.state === 'ACTIVE'
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                >
                  {calendarState.state}
                </span>
              </div>
            </div>

            {/* SLACK AGENT */}
            <div
              id="node-slack"
              onClick={() => onSelectAgent?.('slack')}
              className={`cursor-pointer rounded-xl p-3 border transition-all duration-200 flex flex-col justify-between min-h-[96px] ${
                slackState.state === 'ACTIVE'
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/40'
                  : slackState.state === 'VERIFIED'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-[#121622] border-white/[0.08] hover:border-emerald-400/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Slack Agent</h4>
                    <span className="text-[10px] text-slate-400">Team Comms</span>
                  </div>
                </div>
                {slackState.state === 'ACTIVE' && (
                  <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                )}
                {slackState.state === 'VERIFIED' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                {slackState.state === 'FAILED' && (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[10px]">
                <span className="text-slate-400">send_slack_message</span>
                <span
                  className={`font-semibold ${
                    slackState.state === 'VERIFIED'
                      ? 'text-emerald-400'
                      : slackState.state === 'ACTIVE'
                      ? 'text-emerald-400'
                      : 'text-slate-400'
                  }`}
                >
                  {slackState.state}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* MERGE CONNECTION LINES TO VERIFICATION AGENT */}
        <div className="h-6 w-0.5 bg-gradient-to-b from-slate-600 to-cyan-500/60 relative mb-1">
          {verifierState.state === 'ACTIVE' && (
            <div className="absolute inset-0 bg-cyan-400 animate-ping opacity-75" />
          )}
        </div>

        {/* ROW 4: VERIFICATION AGENT */}
        <div className="w-full flex justify-center mb-4">
          <div
            id="node-verifier"
            onClick={() => onSelectAgent?.('verifier')}
            className={`cursor-pointer transition-all duration-200 w-80 rounded-xl p-3.5 border flex items-center justify-between ${
              verifierState.state === 'ACTIVE'
                ? 'bg-cyan-950/40 border-cyan-400/60 shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/40'
                : verifierState.state === 'VERIFIED'
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-[#121622] border-white/[0.1] hover:border-cyan-400/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  verifierState.state === 'ACTIVE'
                    ? 'bg-cyan-500 text-black font-bold animate-pulse'
                    : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-tight">VERIFICATION AGENT</span>
                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-semibold">
                    Auditor
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {verifierState.state === 'ACTIVE'
                    ? 'Querying target APIs...'
                    : 'Mathematical state confirmation'}
                </p>
              </div>
            </div>
            <div>
              {verifierState.state === 'ACTIVE' ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : verifierState.state === 'VERIFIED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <span className="text-[10px] text-slate-400 font-mono">STANDBY</span>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM FINAL REPORT / STATUS BADGE */}
        {isCompleted && (
          <div className="mt-2 w-full flex items-center justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Workflow execution completed and audited</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
