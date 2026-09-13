import React, { useState } from 'react';
import { IntegrationStatus } from '../types';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  Key,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Calendar,
  MessageSquare,
  FileText,
  Lock,
  RefreshCw,
} from 'lucide-react';

interface IntegrationsViewProps {
  integrations: IntegrationStatus[];
  onOpenConfig: (integration: IntegrationStatus) => void;
  onTestIntegration: (id: string) => Promise<{ ok: boolean; error?: string; [key: string]: any }>;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({
  integrations,
  onOpenConfig,
  onTestIntegration,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<
    Record<string, { ok: boolean; message: string }>
  >({});

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await onTestIntegration(id);
      setTestFeedback((prev) => ({
        ...prev,
        [id]: {
          ok: res.ok,
          message: res.ok
            ? `Connection verified: ${res.team || res.calendarTitle || res.botName || 'Live'}`
            : res.error || 'Authentication error',
        },
      }));
    } catch (err: any) {
      setTestFeedback((prev) => ({
        ...prev,
        [id]: {
          ok: false,
          message: err.message || 'Network test request failed',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const getIntegrationVisuals = (id: string) => {
    switch (id) {
      case 'slack':
        return {
          icon: MessageSquare,
          accent: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        };
      case 'calendar':
        return {
          icon: Calendar,
          accent: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        };
      case 'notion':
        return {
          icon: FileText,
          accent: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
        };
      default:
        return {
          icon: Zap,
          accent: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
        };
    }
  };

  return (
    <div id="integrations-view-root" className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-400" />
            <span>Target API Integrations</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real services authenticated on the server. MindMesh acts directly via official API routes.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>No Client-Side Secrets</span>
        </div>
      </div>

      {/* Integrations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {(integrations || []).map((item) => {
          const vis = getIntegrationVisuals(item.id);
          const Icon = vis.icon;
          const isTesting = testingId === item.id;
          const feedback = testFeedback[item.id];

          return (
            <div
              key={item.id}
              id={`integration-card-${item.id}`}
              className="rounded-2xl bg-[#0E121E] border border-white/[0.08] p-5 flex flex-col justify-between hover:border-white/[0.15] transition-all shadow-xl"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${vis.accent}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">{item.name}</h3>
                      <p className="text-[11px] text-slate-400">{item.description}</p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      item.isConnected
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-white/[0.05] text-slate-400 border-white/[0.1]'
                    }`}
                  >
                    {item.isConnected ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <Lock className="w-3 h-3" />
                    )}
                    <span>{item.isConnected ? 'Connected' : 'Unconfigured'}</span>
                  </span>
                </div>

                {/* Connection details if available */}
                <div className="space-y-2 mb-4 p-3 rounded-xl bg-black/40 border border-white/[0.05] text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Account Target</span>
                    <span className="text-slate-200 font-medium font-mono truncate max-w-[140px]">
                      {item.accountName || 'Not configured'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Auth Mechanism</span>
                    <span className="text-slate-300 font-mono text-[11px]">
                      {item.id === 'slack'
                        ? 'Bot Token / Webhook'
                        : item.id === 'calendar'
                        ? 'OAuth2 Bearer'
                        : 'Secret Key + DB ID'}
                    </span>
                  </div>
                  {item.lastTested && (
                    <div className="flex items-center justify-between text-slate-400 text-[10px]">
                      <span>Last Verified</span>
                      <span className="text-slate-500 font-mono">
                        {new Date(item.lastTested).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Test Feedback Notice */}
                {feedback && (
                  <div
                    className={`p-2.5 rounded-xl border mb-4 text-xs flex items-start gap-2 ${
                      feedback.ok
                        ? 'bg-emerald-950/30 border-emerald-500/25 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-500/25 text-rose-300'
                    }`}
                  >
                    {feedback.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-snug text-[11px]">{feedback.message}</span>
                  </div>
                )}

                {/* Permissions / Scopes list */}
                <div className="space-y-1 mb-4">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block">
                    Granted Scopes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(item.scopes || []).map((scope, idx) => (
                      <span
                        key={idx}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 font-mono border border-white/[0.04]"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2">
                <button
                  id={`btn-test-${item.id}`}
                  onClick={() => handleTest(item.id)}
                  disabled={isTesting}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isTesting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-300" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Test Connection</span>
                </button>

                <button
                  id={`btn-configure-${item.id}`}
                  onClick={() => onOpenConfig(item)}
                  className="py-2 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-xs font-semibold text-indigo-300 flex items-center justify-center gap-1 transition-all"
                >
                  <Key className="w-3 h-3" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
