import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Workflow,
  Agent,
  AgentStatus,
  IntegrationStatus,
  ActivityLog,
  AgentId,
} from './types';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { CommandCenter } from './components/CommandCenter';
import { WorkflowsView } from './components/WorkflowsView';
import { AgentsView } from './components/AgentsView';
import { IntegrationsView } from './components/IntegrationsView';
import { ActivityView } from './components/ActivityView';
import { SettingsView } from './components/SettingsView';
import { ConfigureIntegrationModal } from './components/ConfigureIntegrationModal';
import { AGENTS } from './lib/constants';

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('command');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [agents, setAgents] = useState<Agent[]>(Object.values(AGENTS));
  const [agentStatuses, setAgentStatuses] = useState<
    Record<string, { status: AgentStatus; tasksCompleted: number; lastAction?: string }>
  >({});
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isStreamConnected, setIsStreamConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [configModalIntegration, setConfigModalIntegration] = useState<IntegrationStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      // 1. Integrations
      const resInt = await fetch('/api/integrations');
      if (resInt.ok) {
        const data = await resInt.json();
        setIntegrations(data.integrations || []);
      }

      // 2. Agents
      const resAgents = await fetch('/api/agents');
      if (resAgents.ok) {
        const data = await resAgents.json();
        setAgents(data.agents || []);
        const statusMap: Record<string, any> = {};
        for (const a of data.agents || []) {
          statusMap[a.id] = {
            status: a.status,
            tasksCompleted: a.tasksCompleted,
            lastAction: a.lastAction,
          };
        }
        setAgentStatuses(statusMap);
      }

      // 3. Workflows
      const resWf = await fetch('/api/workflows');
      if (resWf.ok) {
        const data = await resWf.json();
        setWorkflows(data.workflows || []);
        if (data.workflows && data.workflows.length > 0 && !activeWorkflow) {
          setActiveWorkflow(data.workflows[0]);
        }
      }

      // 4. Logs
      const resLogs = await fetch('/api/logs');
      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch initial state:', err);
    }
  }, [activeWorkflow]);

  // Setup SSE connection
  useEffect(() => {
    fetchData();

    let es: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      es = new EventSource('/api/stream');
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsStreamConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'workflow_update') {
            const updatedWf: Workflow = payload.data;
            setActiveWorkflow(updatedWf);
            setWorkflows((prev) => {
              const idx = prev.findIndex((w) => w.id === updatedWf.id);
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = updatedWf;
                return copy;
              } else {
                return [updatedWf, ...prev];
              }
            });

            if (updatedWf.status === 'COMPLETED' || updatedWf.status === 'PARTIAL_SUCCESS' || updatedWf.status === 'FAILED') {
              setIsRunning(false);
            }
          }

          if (payload.type === 'agent_status') {
            const { agent, status } = payload.data;
            setAgentStatuses((prev) => ({
              ...prev,
              [agent]: {
                ...(prev[agent] || { tasksCompleted: 0 }),
                status,
              },
            }));
          }

          if (payload.type === 'log') {
            const logItem: ActivityLog = payload.data;
            setLogs((prev) => [logItem, ...prev.slice(0, 400)]);
          }
        } catch (err) {
          console.error('Error handling SSE payload:', err);
        }
      };

      es.onerror = () => {
        setIsStreamConnected(false);
        es?.close();
        // Reconnect after 3s
        reconnectTimeout = setTimeout(connectSSE, 3000);
      };
    };

    connectSSE();

    return () => {
      if (es) es.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [fetchData]);

  // Execute a workflow
  const handleRunWorkflow = async (goal: string) => {
    setIsRunning(true);
    setErrorMessage(null);
    setCurrentTab('command');

    try {
      const res = await fetch('/api/workflows/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to trigger workflow');
      }

      const data = await res.json();
      if (data.workflow) {
        setActiveWorkflow(data.workflow);
        setWorkflows((prev) => [data.workflow, ...prev]);
      }
    } catch (err: any) {
      setIsRunning(false);
      setErrorMessage(err.message || 'An error occurred while launching the workflow.');
    }
  };

  // Test an integration
  const handleTestIntegration = async (id: string) => {
    const res = await fetch('/api/integrations/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    // Re-fetch integration status
    const resInt = await fetch('/api/integrations');
    if (resInt.ok) {
      const updated = await resInt.json();
      setIntegrations(updated.integrations || []);
    }
    return data;
  };

  // Save integration config
  const handleSaveIntegrationConfig = async (id: string, values: Record<string, string>) => {
    const body: Record<string, any> = {};
    body[id] = values;

    const res = await fetch('/api/integrations/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update credentials');
    }

    const data = await res.json();
    setIntegrations(data.integrations || []);
  };

  const handleOpenConfigByApp = (app: 'slack' | 'calendar' | 'notion') => {
    const found = integrations.find((i) => i.id === app);
    if (found) {
      setConfigModalIntegration(found);
    }
  };

  const connectedCount = integrations.filter((i) => i.isConnected).length;
  const activeCount = workflows.filter((w) => w.status === 'RUNNING').length;

  return (
    <div className="flex h-screen w-screen bg-[#07090E] text-slate-100 overflow-hidden font-sans">
      {/* Primary Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        connectedIntegrationsCount={connectedCount}
        isStreamConnected={isStreamConnected}
        activeWorkflowsCount={activeCount}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Header */}
        <Header
          currentTab={currentTab}
          onNewWorkflow={() => setCurrentTab('command')}
          isStreamConnected={isStreamConnected}
          connectedCount={connectedCount}
        />

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div className="bg-rose-950/80 border-b border-rose-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-rose-200">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white ml-4 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {currentTab === 'command' && (
            <CommandCenter
              activeWorkflow={activeWorkflow}
              agentStatuses={agentStatuses}
              logs={logs}
              isRunning={isRunning}
              onRunWorkflow={handleRunWorkflow}
              onOpenIntegrationConfig={handleOpenConfigByApp}
            />
          )}

          {currentTab === 'workflows' && (
            <WorkflowsView
              workflows={workflows}
              onSelectWorkflow={(wf) => setActiveWorkflow(wf)}
              onOpenIntegrationConfig={handleOpenConfigByApp}
            />
          )}

          {currentTab === 'agents' && (
            <AgentsView agents={agents} dynamicStatuses={agentStatuses} />
          )}

          {currentTab === 'integrations' && (
            <IntegrationsView
              integrations={integrations}
              onOpenConfig={(item) => setConfigModalIntegration(item)}
              onTestIntegration={handleTestIntegration}
            />
          )}

          {currentTab === 'activity' && <ActivityView logs={logs} />}

          {currentTab === 'settings' && (
            <SettingsView onOpenIntegrationConfig={handleOpenConfigByApp} />
          )}
        </main>
      </div>

      {/* Integration Configuration Modal */}
      <ConfigureIntegrationModal
        integration={configModalIntegration}
        onClose={() => setConfigModalIntegration(null)}
        onSave={handleSaveIntegrationConfig}
        onTest={handleTestIntegration}
      />
    </div>
  );
}

export default App;
