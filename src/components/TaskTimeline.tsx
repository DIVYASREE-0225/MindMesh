import React, { useState } from 'react';
import {
  Workflow,
  WorkflowTask,
  TaskStatus,
} from '../types';
import {
  Calendar,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface TaskTimelineProps {
  workflow?: Workflow | null;
  onOpenIntegrationConfig?: (app: 'slack' | 'calendar' | 'notion') => void;
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({
  workflow,
  onOpenIntegrationConfig,
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  if (!workflow || !workflow.tasks || workflow.tasks.length === 0) {
    return (
      <div
        id="task-timeline-empty"
        className="rounded-2xl bg-[#0B0E17]/60 border border-white/[0.06] p-8 text-center"
      >
        <p className="text-sm text-slate-400">No active tasks scheduled.</p>
        <p className="text-xs text-slate-500 mt-1">
          Submit an operational goal to trigger the Orchestrator and Planner.
        </p>
      </div>
    );
  }

  const getAppBadge = (app: 'slack' | 'calendar' | 'notion') => {
    switch (app) {
      case 'calendar':
        return {
          icon: Calendar,
          label: 'Google Calendar',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        };
      case 'notion':
        return {
          icon: FileText,
          label: 'Notion',
          color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        };
      case 'slack':
        return {
          icon: MessageSquare,
          label: 'Slack',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        };
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'VERIFIED':
        return {
          label: 'VERIFIED',
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
        };
      case 'SUCCESS':
        return {
          label: 'SUCCESS (PENDING AUDIT)',
          color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          icon: CheckCircle2,
        };
      case 'RUNNING':
        return {
          label: 'RUNNING',
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse',
          icon: RotateCw,
        };
      case 'RETRYING':
        return {
          label: 'RETRYING',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
          icon: RotateCw,
        };
      case 'FAILED':
        return {
          label: 'FAILED',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: AlertCircle,
        };
      case 'WAITING':
      case 'PENDING':
      default:
        return {
          label: 'PENDING',
          color: 'bg-white/[0.04] text-slate-400 border-white/[0.08]',
          icon: Clock,
        };
    }
  };

  return (
    <div id="task-timeline-container" className="space-y-4">
      {/* Workflow Metadata Bar */}
      <div className="rounded-xl bg-[#0E121E] border border-white/[0.08] p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            Active Mission
          </span>
          <h4 className="text-sm font-bold text-white tracking-tight">{workflow.title}</h4>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 text-[10px] block">STATUS</span>
            <span
              className={`font-semibold ${
                workflow.status === 'COMPLETED'
                  ? 'text-emerald-400'
                  : workflow.status === 'RUNNING'
                  ? 'text-indigo-400'
                  : workflow.status === 'PARTIAL_SUCCESS'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {workflow.status}
            </span>
          </div>
          <div className="border-l border-white/[0.08] pl-4">
            <span className="text-slate-400 text-[10px] block">STARTED</span>
            <span className="text-slate-300">
              {new Date(workflow.startTime).toLocaleTimeString()}
            </span>
          </div>
          {workflow.executionTimeMs && (
            <div className="border-l border-white/[0.08] pl-4">
              <span className="text-slate-400 text-[10px] block">ELAPSED</span>
              <span className="text-slate-300 font-semibold">
                {(workflow.executionTimeMs / 1000).toFixed(1)}s
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Task Cards Grid */}
      <div className="space-y-3">
        {(workflow.tasks || []).map((task, index) => {
          const appBadge = getAppBadge(task.app);
          const AppIcon = appBadge.icon;
          const statusBadge = getStatusBadge(task.status);
          const StatusIcon = statusBadge.icon;
          const isExpanded = expandedTaskId === task.id;

          return (
            <div
              key={task.id}
              id={`task-card-${task.id}`}
              className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                task.status === 'VERIFIED'
                  ? 'bg-[#0E131F]/90 border-emerald-500/25'
                  : task.status === 'FAILED'
                  ? 'bg-[#180E14]/90 border-rose-500/30'
                  : task.status === 'RUNNING' || task.status === 'RETRYING'
                  ? 'bg-[#111528]/90 border-indigo-500/40 shadow-lg shadow-indigo-950/40'
                  : 'bg-[#0B0E17]/80 border-white/[0.08]'
              }`}
            >
              {/* Main Card Header */}
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {/* Step Index Badge */}
                  <div className="w-6 h-6 rounded-full bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-semibold text-slate-300 shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  <div>
                    {/* Agent & App labels */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-indigo-300">
                        {task.agent.toUpperCase()} AGENT
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <div
                        className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${appBadge.color}`}
                      >
                        <AppIcon className="w-3 h-3" />
                        <span>{appBadge.label}</span>
                      </div>
                      {task.retryCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          Retry: {task.retryCount}/{task.maxRetries}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-white tracking-tight">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{task.description}</p>
                    )}
                  </div>
                </div>

                {/* Right Status Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.color}`}
                  >
                    <StatusIcon
                      className={`w-3.5 h-3.5 ${
                        task.status === 'RUNNING' || task.status === 'RETRYING' ? 'animate-spin' : ''
                      }`}
                    />
                    <span>{statusBadge.label}</span>
                  </div>

                  {task.executionTimeMs && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {task.executionTimeMs}ms
                    </span>
                  )}
                </div>
              </div>

              {/* Verified or Error Highlights */}
              {task.verificationDetails && (
                <div className="px-4 py-2 bg-emerald-950/30 border-t border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{task.verificationDetails}</span>
                  </div>
                  {task.externalUrl && (
                    <a
                      href={task.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 ml-2"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {task.error && (
                <div className="px-4 py-2.5 bg-rose-950/40 border-t border-rose-500/20 flex items-center justify-between text-xs text-rose-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{task.error}</span>
                  </div>
                  <button
                    id={`btn-fix-integration-${task.app}`}
                    onClick={() => onOpenIntegrationConfig?.(task.app)}
                    className="text-[11px] px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-medium transition-colors"
                  >
                    Configure {appBadge.label}
                  </button>
                </div>
              )}

              {/* Toggle Diagnostics / Tool Call Inspection */}
              <div className="px-4 py-1.5 bg-black/30 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <span>Tool:</span>
                  <span className="text-slate-300 font-medium">{task.toolUsed || 'none'}</span>
                  {task.externalId && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span>ID:</span>
                      <span className="text-slate-300 truncate max-w-[140px]">
                        {task.externalId}
                      </span>
                    </>
                  )}
                </div>
                <button
                  id={`toggle-task-detail-${task.id}`}
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="inline-flex items-center gap-1 hover:text-slate-200 transition-colors"
                >
                  <span>{isExpanded ? 'Hide Payload' : 'View Payload'}</span>
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Expandable JSON payload */}
              {isExpanded && (
                <div className="p-4 bg-black/70 border-t border-white/[0.06] text-xs font-mono space-y-3">
                  {task.toolInput && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                        Tool Input Arguments
                      </span>
                      <pre className="p-2.5 rounded-lg bg-black/90 border border-white/[0.08] text-slate-300 overflow-x-auto text-[11px]">
                        {JSON.stringify(task.toolInput, null, 2)}
                      </pre>
                    </div>
                  )}
                  {task.toolResult && (
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                        Tool Raw Execution Result
                      </span>
                      <pre className="p-2.5 rounded-lg bg-black/90 border border-white/[0.08] text-slate-300 overflow-x-auto text-[11px]">
                        {JSON.stringify(task.toolResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Final Orchestrator Executive Summary */}
      {workflow.summary && (
        <div
          id="workflow-final-summary"
          className="rounded-xl p-4 bg-gradient-to-br from-indigo-950/50 via-slate-900/60 to-black/80 border border-indigo-500/30 shadow-xl"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Orchestrator Final Execution Report
            </h4>
          </div>
          <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans font-medium pl-6">
            {workflow.summary}
          </div>
        </div>
      )}
    </div>
  );
};
