import React, { useState } from 'react';
import {
  Workflow,
  AgentId,
  AgentStatus,
  ActivityLog,
} from '../types';
import { EXAMPLE_WORKFLOWS } from '../lib/constants';
import { WorkflowGraph } from './WorkflowGraph';
import { TaskTimeline } from './TaskTimeline';
import {
  Sparkles,
  ArrowRight,
  Loader2,
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface CommandCenterProps {
  activeWorkflow: Workflow | null;
  agentStatuses: Record<string, { status: AgentStatus; lastAction?: string }>;
  logs: ActivityLog[];
  isRunning: boolean;
  onRunWorkflow: (goal: string) => Promise<void>;
  onOpenIntegrationConfig: (app: 'slack' | 'calendar' | 'notion') => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  activeWorkflow,
  agentStatuses,
  logs,
  isRunning,
  onRunWorkflow,
  onOpenIntegrationConfig,
}) => {
  const [inputGoal, setInputGoal] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentId | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputGoal.trim() || isRunning) return;
    onRunWorkflow(inputGoal.trim());
  };

  const handleSelectExample = (prompt: string) => {
    setInputGoal(prompt);
    onRunWorkflow(prompt);
  };

  return (
    <div id="command-center-root" className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Think once. We execute everywhere.</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          MINDMESH
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto font-normal leading-relaxed">
          Your AI operations team for getting real work done. Autonomous decomposition, cross-application execution, and active state verification.
        </p>
      </div>

      {/* Large Command Input Box */}
      <div className="relative max-w-3xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="relative rounded-2xl bg-[#0F1322] border border-white/[0.12] p-2 shadow-2xl focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/25 transition-all"
        >
          <div className="p-3 pb-1 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0 mt-0.5">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <label htmlFor="workflow-goal-input" className="sr-only">
                What do you want MindMesh to accomplish?
              </label>
              <textarea
                id="workflow-goal-input"
                rows={3}
                value={inputGoal}
                onChange={(e) => setInputGoal(e.target.value)}
                placeholder="What do you want MindMesh to accomplish? (e.g. Organize our upcoming hackathon kickoff for next Friday...)"
                className="w-full bg-transparent text-sm sm:text-base text-slate-100 placeholder:text-slate-500 resize-none focus:outline-none leading-relaxed font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.06] bg-black/30 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="hidden sm:inline">TARGETS:</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400">Notion</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400">Calendar</span>
              <span className="px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400">Slack</span>
            </div>

            <button
              type="submit"
              id="run-workflow-btn"
              disabled={!inputGoal.trim() || isRunning}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:opacity-95 active:scale-[0.98] text-xs font-bold text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ORCHESTRATING...</span>
                </>
              ) : (
                <>
                  <span>RUN WORKFLOW</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Example Prompt Chips */}
        <div className="mt-4 flex items-center gap-2 flex-wrap justify-center">
          <span className="text-xs text-slate-500 font-medium">Try example:</span>
          {(EXAMPLE_WORKFLOWS || []).map((ex, idx) => (
            <button
              key={idx}
              id={`example-prompt-btn-${idx}`}
              onClick={() => handleSelectExample(ex.prompt)}
              disabled={isRunning}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] text-slate-300 transition-all hover:border-indigo-500/30 disabled:opacity-40"
            >
              <span>{ex.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Execution Viewport */}
      {activeWorkflow ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Animated Execution Graph */}
          <WorkflowGraph
            workflow={activeWorkflow}
            agentStatuses={agentStatuses}
            onSelectAgent={(agentId) => setSelectedAgent(agentId)}
            selectedAgentId={selectedAgent}
          />

          {/* Execution Timeline & Diagnostics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 2 Cols: Task Timeline */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight uppercase flex items-center gap-2">
                  <span>Execution Timeline</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                    {(activeWorkflow.tasks || []).length} tasks
                  </span>
                </h3>
              </div>
              <TaskTimeline
                workflow={activeWorkflow}
                onOpenIntegrationConfig={onOpenIntegrationConfig}
              />
            </div>

            {/* 1 Col: Real-time Agent Log Activity Stream */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Agent Stream</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">LIVE EVENTS</span>
              </div>

              <div
                id="live-agent-stream"
                className="rounded-2xl bg-[#090C15] border border-white/[0.08] p-4 max-h-[460px] overflow-y-auto space-y-2.5 font-mono text-xs"
              >
                {activeWorkflow.logs && activeWorkflow.logs.length > 0 ? (
                  (activeWorkflow.logs || []).slice(0, 15).map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-indigo-400 font-semibold">{log.agentName}</span>
                        <span className="text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs leading-tight">{log.action}</p>
                      {log.details && (
                        <p className="text-[11px] text-slate-500 truncate font-mono">{log.details}</p>
                      )}
                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <span
                          className={`font-semibold ${
                            log.status === 'VERIFIED'
                              ? 'text-emerald-400'
                              : log.status === 'SUCCESS'
                              ? 'text-cyan-400'
                              : log.status === 'FAILED'
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {log.status}
                        </span>
                        {log.durationMs && (
                          <span className="text-slate-500">{log.durationMs}ms</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-6">Awaiting agent dispatch...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Idle Welcome Feature Cards */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="p-5 rounded-2xl bg-[#0C101B] border border-white/[0.07] space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="text-sm font-bold text-white">Genuine Multi-Agent Architecture</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              No monolithic chatbots. Orchestrator, Planner, Notion, Calendar, Slack, and Verification agents operate as independent domain units.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C101B] border border-white/[0.07] space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="text-sm font-bold text-white">Autonomous State Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Never blindly trusts API status codes. The Verification Agent independently queries the target application to mathematically certify mutations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0C101B] border border-white/[0.07] space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="text-sm font-bold text-white">Idempotent Error Recovery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built-in duplicate protection prevents double calendar bookings or duplicate Slack messages during automatic retry loops.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
