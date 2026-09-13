import React from 'react';
import { Agent, AgentStatus } from '../types';
import {
  Bot,
  Compass,
  FileText,
  Calendar,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  RotateCw,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

interface AgentsViewProps {
  agents: Agent[];
  dynamicStatuses: Record<string, { status: AgentStatus; tasksCompleted: number; lastAction?: string }>;
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  dynamicStatuses,
}) => {
  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'orchestrator':
        return { icon: Bot, color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' };
      case 'planner':
        return { icon: Compass, color: 'text-violet-400 bg-violet-500/15 border-violet-500/30' };
      case 'notion':
        return { icon: FileText, color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' };
      case 'calendar':
        return { icon: Calendar, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' };
      case 'slack':
        return { icon: MessageSquare, color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' };
      case 'verifier':
        return { icon: ShieldCheck, color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30' };
      default:
        return { icon: Sparkles, color: 'text-slate-400 bg-white/[0.05] border-white/[0.1]' };
    }
  };

  const getStatusBadge = (status: AgentStatus) => {
    switch (status) {
      case 'EXECUTING':
        return {
          label: 'EXECUTING',
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse',
          icon: RotateCw,
        };
      case 'THINKING':
        return {
          label: 'THINKING',
          color: 'bg-violet-500/20 text-violet-300 border-violet-500/40 animate-pulse',
          icon: Sparkles,
        };
      case 'VERIFYING':
        return {
          label: 'VERIFYING',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse',
          icon: ShieldCheck,
        };
      case 'COMPLETED':
        return {
          label: 'READY',
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
        };
      case 'ERROR':
        return {
          label: 'ERROR',
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          icon: AlertCircle,
        };
      case 'IDLE':
      default:
        return {
          label: 'IDLE',
          color: 'bg-white/[0.04] text-slate-400 border-white/[0.08]',
          icon: Clock,
        };
    }
  };

  return (
    <div id="agents-view-root" className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-400" />
            <span>Operational Agent Roster</span>
          </h2>
          <p className="text-xs text-slate-400">
            6 specialized autonomous domain units coordinated by Gemini
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Multi-Agent Swarm Synchronized</span>
        </div>
      </div>

      {/* Agents 2x3 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(agents || []).map((agent) => {
          const dyn = dynamicStatuses[agent.id];
          const currentStatus: AgentStatus = dyn?.status || agent.status;
          const completedCount = dyn?.tasksCompleted ?? agent.tasksCompleted;
          const lastAction = dyn?.lastAction || agent.lastAction || 'System initialized';

          const iconCfg = getAgentIcon(agent.id);
          const Icon = iconCfg.icon;
          const statusBadge = getStatusBadge(currentStatus);
          const StatusIcon = statusBadge.icon;

          return (
            <div
              key={agent.id}
              id={`agent-card-${agent.id}`}
              className="rounded-2xl bg-[#0E121E] border border-white/[0.08] p-5 flex flex-col justify-between hover:border-white/[0.15] transition-all shadow-xl"
            >
              <div>
                {/* Agent Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${iconCfg.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{agent.name}</h3>
                      <p className="text-[11px] text-indigo-300 font-medium">{agent.role}</p>
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusBadge.label}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {agent.description}
                </p>

                {/* Capabilities List */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                    Tools & Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(agent.capabilities || []).map((cap, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-black/40 border border-white/[0.06] text-slate-300 font-mono"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Metrics Bar */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Tasks Certified</span>
                  <span className="text-white font-mono font-bold">{completedCount}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
                  <span className="text-slate-400">Last:</span>
                  <span className="text-slate-300 truncate font-mono">{lastAction}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
