import React from 'react';
import {
  Settings,
  Cpu,
  ShieldCheck,
  RotateCw,
  Server,
  Terminal,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

interface SettingsViewProps {
  onOpenIntegrationConfig: (app: 'slack' | 'calendar' | 'notion') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenIntegrationConfig }) => {
  return (
    <div id="settings-view-root" className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <span>System Architecture & Engine Settings</span>
        </h2>
        <p className="text-xs text-slate-400">
          Core runtime configuration, intelligence model parameters, and reliability guardrails
        </p>
      </div>

      {/* Model & AI Settings Card */}
      <div className="rounded-2xl bg-[#0E121E] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Reasoning & Planning Layer</h3>
            <p className="text-xs text-slate-400">Powered by official @google/genai TypeScript SDK</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Model Engine</span>
            <p className="text-xs font-semibold text-white font-mono">gemini-3.6-flash</p>
            <p className="text-[11px] text-slate-400">High-throughput reasoning with multi-model resilience</p>
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.05] space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono">Output Mode</span>
            <p className="text-xs font-semibold text-white font-mono">Structured JSON Schema</p>
            <p className="text-[11px] text-slate-400">Deterministic type enforcement via Type.OBJECT / Type.ARRAY</p>
          </div>
        </div>
      </div>

      {/* Verification & Reliability Policy Card */}
      <div className="rounded-2xl bg-[#0E121E] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Verification & State Audit Policy</h3>
            <p className="text-xs text-slate-400">Autonomous post-execution verification rules</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-black/30 border border-white/[0.05] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Strict Verification Invariant: </span>
              MindMesh never reports success merely because an external API function returned without throwing. The Verification Agent executes an independent query against the provider (fetching event by ID, checking Notion page status, querying Slack channel history) before marking a task VERIFIED.
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/30 border border-white/[0.05] flex items-start gap-2.5">
            <RotateCw className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Idempotency & Retry Backoff: </span>
              Retries are capped at 2 attempts. If a calendar event or page was partially registered prior to an audit timeout, subsequent retries retain the external reference to eliminate duplicate side effects.
            </div>
          </div>
        </div>
      </div>

      {/* Integration Quicklinks */}
      <div className="rounded-2xl bg-[#0E121E] border border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">External Service Credentials</h3>
            <p className="text-xs text-slate-400">Configure or re-test live operational connections</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            id="cfg-btn-slack"
            onClick={() => onOpenIntegrationConfig('slack')}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-200 transition-all"
          >
            Configure Slack Webhook / Bot
          </button>
          <button
            id="cfg-btn-calendar"
            onClick={() => onOpenIntegrationConfig('calendar')}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-200 transition-all"
          >
            Configure Google Calendar
          </button>
          <button
            id="cfg-btn-notion"
            onClick={() => onOpenIntegrationConfig('notion')}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-200 transition-all"
          >
            Configure Notion Database
          </button>
        </div>
      </div>
    </div>
  );
};
