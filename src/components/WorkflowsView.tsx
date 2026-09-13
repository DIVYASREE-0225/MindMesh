import React, { useState } from 'react';
import { Workflow } from '../types';
import { TaskTimeline } from './TaskTimeline';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
  Search,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface WorkflowsViewProps {
  workflows: Workflow[];
  onSelectWorkflow: (wf: Workflow) => void;
  onOpenIntegrationConfig: (app: 'slack' | 'calendar' | 'notion') => void;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({
  workflows = [],
  onSelectWorkflow,
  onOpenIntegrationConfig,
}) => {
  const safeWorkflows = workflows || [];
  const [selectedWfId, setSelectedWfId] = useState<string | null>(
    safeWorkflows.length > 0 ? safeWorkflows[0].id : null
  );
  const [filter, setFilter] = useState<'ALL' | 'COMPLETED' | 'RUNNING' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkflows = safeWorkflows.filter((wf) => {
    if (filter !== 'ALL' && wf.status !== filter) return false;
    if (
      searchQuery &&
      !wf.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !wf.originalGoal.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const activeSelectedWf = safeWorkflows.find((w) => w.id === selectedWfId) || safeWorkflows[0];

  return (
    <div id="workflows-view-root" className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Workflow History & Inspection</span>
          </h2>
          <p className="text-xs text-slate-400">
            Audit history of autonomous operational workflows executed by MindMesh
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/[0.06] text-xs">
          {(['ALL', 'COMPLETED', 'RUNNING', 'FAILED'] as const).map((status) => (
            <button
              key={status}
              id={`filter-btn-${status}`}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                filter === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List: 5 Cols */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search workflows by goal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0C101B] border border-white/[0.08] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          {/* Workflow Items List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredWorkflows.length > 0 ? (
              filteredWorkflows.map((wf) => {
                const isSelected = wf.id === activeSelectedWf?.id;
                return (
                  <div
                    key={wf.id}
                    id={`wf-item-${wf.id}`}
                    onClick={() => {
                      setSelectedWfId(wf.id);
                      onSelectWorkflow(wf);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-[#0E121E] border-white/[0.07] hover:border-white/[0.15]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="text-xs font-bold text-white line-clamp-1">{wf.title}</h4>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          wf.status === 'COMPLETED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : wf.status === 'RUNNING'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {wf.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {wf.originalGoal}
                    </p>

                    <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{new Date(wf.startTime).toLocaleTimeString()}</span>
                      <div className="flex items-center gap-2">
                        <span>{(wf.tasks || []).length} tasks</span>
                        {wf.executionTimeMs && (
                          <span>{(wf.executionTimeMs / 1000).toFixed(1)}s</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-[#0C101B] rounded-xl border border-white/[0.05]">
                No workflows match filter.
              </div>
            )}
          </div>
        </div>

        {/* Right Inspector: 7 Cols */}
        <div className="lg:col-span-7">
          {activeSelectedWf ? (
            <div className="space-y-4">
              <TaskTimeline
                workflow={activeSelectedWf}
                onOpenIntegrationConfig={onOpenIntegrationConfig}
              />
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#0C101B] border border-white/[0.07] text-slate-500 text-xs">
              Select a workflow from the list to inspect its execution timeline and verification receipts.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
