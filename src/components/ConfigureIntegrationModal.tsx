import React, { useState } from 'react';
import { IntegrationStatus } from '../types';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Loader2,
  ExternalLink,
  Key,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ConfigureIntegrationModalProps {
  integration: IntegrationStatus | null;
  onClose: () => void;
  onSave: (id: string, values: Record<string, string>) => Promise<void>;
  onTest: (id: string) => Promise<{ ok: boolean; error?: string; [key: string]: any }>;
}

export const ConfigureIntegrationModal: React.FC<ConfigureIntegrationModalProps> = ({
  integration,
  onClose,
  onSave,
  onTest,
}) => {
  if (!integration) return null;

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    ok: boolean;
    message?: string;
    diagnostics?: any;
  }>({ tested: false, ok: false });

  const handleChange = (key: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(integration.id, formValues);
      setIsSaving(false);
      // Automatically test connection after saving
      handleTest();
    } catch (err: any) {
      setIsSaving(false);
      setTestResult({
        tested: true,
        ok: false,
        message: err.message || 'Failed to save configuration',
      });
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const res = await onTest(integration.id);
      setIsTesting(false);
      let successMsg = `Successfully connected! ${res.team ? `Workspace: ${res.team}` : ''} ${res.botName ? `(${res.botName})` : ''} ${res.databaseTitle ? `Database: "${res.databaseTitle}"` : ''} ${res.calendarTitle ? `Calendar: ${res.calendarTitle}` : ''}`.trim();
      if (!successMsg || successMsg === 'Successfully connected!') {
        successMsg = res.mode === 'BUFFERED_SCHEDULER'
          ? 'MindMesh Active Calendar Scheduler is ready and operational.'
          : 'Successfully authenticated and ready for operations.';
      }
      setTestResult({
        tested: true,
        ok: res.ok,
        message: res.ok ? successMsg : res.error || 'Connection failed.',
        diagnostics: res,
      });
    } catch (err: any) {
      setIsTesting(false);
      setTestResult({
        tested: true,
        ok: false,
        message: err.message || 'Network request failed',
      });
    }
  };

  return (
    <div
      id="configure-integration-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        id="configure-integration-modal-card"
        className="w-full max-w-lg rounded-2xl bg-[#0F131E] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Configure {integration.name}
              </h3>
              <p className="text-xs text-slate-400">
                Server-side credential injection & real API handshake
              </p>
            </div>
          </div>
          <button
            id="close-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Security Banner */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              Secrets are stored purely in server memory and securely proxied. Tokens are never
              revealed to the frontend browser bundle.
            </p>
          </div>

          {/* Test Status Feedback */}
          {testResult.tested && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs ${
                testResult.ok
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold block">
                  {testResult.ok ? 'Connection Verified' : 'Authentication Diagnostic'}
                </span>
                <span className="mt-0.5 block leading-relaxed">{testResult.message}</span>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSave} className="space-y-4">
            {(integration.configFields || []).map((field) => (
              <div key={field.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200">
                    {field.label}
                  </label>
                  {field.isConfigured && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      Configured
                    </span>
                  )}
                </div>
                <input
                  id={`input-${field.key}`}
                  type={field.type}
                  placeholder={
                    field.isConfigured && field.isSecret
                      ? '••••••••••••••••••••'
                      : field.placeholder
                  }
                  value={formValues[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/[0.1] text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all font-mono"
                />
                {field.description && (
                  <p className="text-[11px] text-slate-400">{field.description}</p>
                )}
              </div>
            ))}

            {/* Official API Documentation Helper */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              <span>Need help obtaining tokens?</span>
              <a
                href={integration.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <span>Official Documentation</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
              <button
                type="button"
                id="btn-test-connection"
                onClick={handleTest}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-xs font-medium text-slate-300 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Key className="w-3.5 h-3.5" />
                )}
                <span>Test Live API</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-credentials"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save & Connect</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
