import React from 'react';
import {
  Sparkles,
  Layers,
  Bot,
  Zap,
  Activity,
  Settings,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export type NavTab = 'command' | 'workflows' | 'agents' | 'integrations' | 'activity' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  connectedIntegrationsCount: number;
  isStreamConnected: boolean;
  activeWorkflowsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  connectedIntegrationsCount,
  isStreamConnected,
  activeWorkflowsCount,
}) => {
  const navItems = [
    {
      id: 'command',
      label: 'Command Center',
      icon: Sparkles,
      badge: activeWorkflowsCount > 0 ? `${activeWorkflowsCount} active` : undefined,
    },
    {
      id: 'workflows',
      label: 'Workflows',
      icon: Layers,
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: Bot,
      badge: '6 units',
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: Zap,
      badge: `${connectedIntegrationsCount}/3 live`,
      badgeColor: connectedIntegrationsCount > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400',
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: Activity,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside
      id="sidebar-container"
      className="w-64 bg-[#0A0D14] border-r border-white/[0.07] flex flex-col justify-between shrink-0 select-none z-20"
    >
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-base">MINDMESH</span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  AI Ops
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate">Many Agents. One Intelligence.</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onSelectTab(item.id as NavTab)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-950'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      item.badgeColor || (isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.06] text-slate-400')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-white/[0.07] space-y-2">
        {/* Real-time Engine Connection Indicator */}
        <div className="px-3 py-2 rounded-lg bg-black/40 border border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isStreamConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            <span className="text-xs text-slate-300 font-medium">
              {isStreamConnected ? 'Orchestrator Online' : 'Connecting...'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Gemini 3.8</span>
        </div>

        {/* User Workspace Profile */}
        <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              MM
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">Ops Workspace</p>
              <p className="text-[10px] text-slate-400 truncate">Autonomous Multi-Agent</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
