import React, { useState } from 'react';
import { ActivityLog, AgentId } from '../types';
import {
  Activity,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  ShieldCheck,
  Download,
  Trash2,
} from 'lucide-react';

interface ActivityViewProps {
  logs: ActivityLog[];
  onClearLogs?: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({ logs = [], onClearLogs }) => {
  const [selectedAgent, setSelectedAgent] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const safeLogs = logs || [];
  const filteredLogs = safeLogs.filter((log) => {
    if (selectedAgent !== 'ALL' && log.agent !== selectedAgent) return false;
    if (selectedStatus !== 'ALL' && log.status !== selectedStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.agentName.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const exportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mindmesh-audit-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="activity-view-root" className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Operational Observability Feed</span>
          </h2>
          <p className="text-xs text-slate-400">
            Immutable trace of agent handoffs, tool invocations, and verification audits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="export-logs-btn"
            onClick={exportLogs}
            className="px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-[#0E121E] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search actions, agents, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.06] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Agent Filter */}
          <select
            id="filter-agent-select"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Agents</option>
            <option value="orchestrator">Orchestrator</option>
            <option value="planner">Planner</option>
            <option value="notion">Notion</option>
            <option value="calendar">Calendar</option>
            <option value="slack">Slack</option>
            <option value="verifier">Verification</option>
          </select>

          {/* Status Filter */}
          <select
            id="filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-slate-300 text-xs focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="RETRYING">Retrying</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#0E121E] border border-white/[0.08] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/40 border-b border-white/[0.06] text-slate-400 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Agent</th>
                <th className="py-3 px-4">Target App</th>
                <th className="py-3 px-4">Action & Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-sans font-semibold text-slate-200">
                        {log.agentName}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300">
                        {log.app || 'system'}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <p className="font-sans text-slate-200 font-medium">{log.action}</p>
                      {log.details && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{log.details}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          log.status === 'VERIFIED'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : log.status === 'SUCCESS'
                            ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                            : log.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : log.status === 'RETRYING'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-white/[0.04] text-slate-400 border-white/[0.08]'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                      {log.durationMs ? `${log.durationMs}ms` : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No activity logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
