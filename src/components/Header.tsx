import React from 'react';
import { NavTab } from './Sidebar';
import {
  Sparkles,
  Plus,
  Zap,
  Activity,
  Radio,
} from 'lucide-react';

interface HeaderProps {
  currentTab: NavTab;
  onNewWorkflow: () => void;
  isStreamConnected: boolean;
  connectedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNewWorkflow,
  isStreamConnected,
  connectedCount,
}) => {
  const getTabTitle = () => {
    switch (currentTab) {
      case 'command':
        return 'Command Center';
      case 'workflows':
        return 'Workflow Operations';
      case 'agents':
        return 'Agent Swarm';
      case 'integrations':
        return 'API Integrations';
      case 'activity':
        return 'Observability Feed';
      case 'settings':
        return 'System Settings';
    }
  };

  return (
    <header
      id="app-header"
      className="h-16 px-6 border-b border-white/[0.07] bg-[#0A0D14]/80 backdrop-blur-md flex items-center justify-between shrink-0 sticky top-0 z-10"
    >
      <div className="flex items-center gap-3">
        <h2 className="text-base font-bold text-white tracking-tight">{getTabTitle()}</h2>
        <span className="hidden sm:inline text-xs text-slate-500 font-mono">v1.0</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time SSE indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/[0.06] text-xs font-mono">
          <Radio
            className={`w-3 h-3 ${
              isStreamConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'
            }`}
          />
          <span className={isStreamConnected ? 'text-emerald-400' : 'text-slate-500'}>
            {isStreamConnected ? 'STREAM ACTIVE' : 'CONNECTING'}
          </span>
        </div>

        {/* Integrations count badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>{connectedCount}/3 Integrations</span>
        </div>

        {/* New Workflow Button */}
        {currentTab !== 'command' && (
          <button
            id="header-new-workflow-btn"
            onClick={onNewWorkflow}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Workflow</span>
          </button>
        )}
      </div>
    </header>
  );
};
