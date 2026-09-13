import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { globalWorkflowEngine } from './server/agents/orchestrator';
import {
  getSafeIntegrationStatus,
  updateCredentials,
  getCredentials,
} from './server/integrations/config';
import { testSlackConnection } from './server/integrations/slack';
import { testCalendarConnection } from './server/integrations/calendar';
import { testNotionConnection } from './server/integrations/notion';
import { AGENTS } from './src/lib/constants';

const app = express();
const PORT = 3000;

app.use(express.json());

// -------------------------------------------------------------
// API ROUTES FIRST
// -------------------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    engine: 'MindMesh Orchestrator v1.0',
  });
});

// 1. Agents state endpoint
app.get('/api/agents', (req, res) => {
  const dynamicStatuses = globalWorkflowEngine.getAgentStatuses();
  const agentsList = Object.values(AGENTS).map((agent) => {
    const dyn = dynamicStatuses[agent.id];
    return {
      ...agent,
      status: dyn?.status || agent.status,
      tasksCompleted: dyn?.tasksCompleted || 0,
      lastAction: dyn?.lastAction || agent.lastAction,
    };
  });
  res.json({ agents: agentsList });
});

// 2. Integrations state endpoint
app.get('/api/integrations', (req, res) => {
  const safe = getSafeIntegrationStatus();
  res.json({ integrations: Object.values(safe) });
});

// 3. Test a specific integration against real API
app.post('/api/integrations/test', async (req, res) => {
  const { id } = req.body;
  if (id === 'slack') {
    const result = await testSlackConnection();
    return res.json(result);
  }
  if (id === 'calendar') {
    const result = await testCalendarConnection();
    return res.json(result);
  }
  if (id === 'notion') {
    const result = await testNotionConnection();
    return res.json(result);
  }
  res.status(400).json({ error: 'Invalid integration id' });
});

// 4. Update credentials for integrations
app.post('/api/integrations/config', (req, res) => {
  const { slack, calendar, notion } = req.body;
  updateCredentials({ slack, calendar, notion });
  const safe = getSafeIntegrationStatus();
  res.json({ success: true, integrations: Object.values(safe) });
});

// 5. Run Workflow endpoint
app.post('/api/workflows/run', async (req, res) => {
  const { goal } = req.body;
  if (!goal || typeof goal !== 'string' || !goal.trim()) {
    return res.status(400).json({ error: 'A valid goal description is required.' });
  }

  // Execute workflow asynchronously in background while streaming
  try {
    // Start the workflow execution
    const workflowPromise = globalWorkflowEngine.runWorkflow(goal.trim());
    // Give it a brief slice so initial understanding stage is emitted
    await new Promise((r) => setTimeout(r, 100));

    const all = globalWorkflowEngine.getAllWorkflows();
    const current = all[0];
    res.json({
      success: true,
      workflowId: current?.id,
      workflow: current,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Workflows list endpoint
app.get('/api/workflows', (req, res) => {
  const workflows = globalWorkflowEngine.getAllWorkflows();
  res.json({ workflows });
});

// 7. Workflow detail endpoint
app.get('/api/workflows/:id', (req, res) => {
  const workflow = globalWorkflowEngine.getWorkflow(req.params.id);
  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found' });
  }
  res.json({ workflow });
});

// 8. Activity logs endpoint
app.get('/api/logs', (req, res) => {
  const logs = globalWorkflowEngine.getAllLogs();
  res.json({ logs });
});

// 9. Real-time Server-Sent Events (SSE) Stream
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const onWorkflowUpdate = (workflow: any) => {
    res.write(`data: ${JSON.stringify({ type: 'workflow_update', data: workflow })}\n\n`);
  };

  const onAgentStatus = (status: any) => {
    res.write(`data: ${JSON.stringify({ type: 'agent_status', data: status })}\n\n`);
  };

  const onLog = (log: any) => {
    res.write(`data: ${JSON.stringify({ type: 'log', data: log })}\n\n`);
  };

  globalWorkflowEngine.on('workflow_update', onWorkflowUpdate);
  globalWorkflowEngine.on('agent_status', onAgentStatus);
  globalWorkflowEngine.on('log', onLog);

  // Heartbeat
  const interval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(interval);
    globalWorkflowEngine.off('workflow_update', onWorkflowUpdate);
    globalWorkflowEngine.off('agent_status', onAgentStatus);
    globalWorkflowEngine.off('log', onLog);
  });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE (Development) vs STATIC SERVING (Production)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MINDMESH server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
