/**
 * Notion Agent
 * Responsible ONLY for Notion operations.
 */

import { createNotionTask, updateNotionTask, verifyNotionTask } from '../integrations/notion';

export class NotionAgent {
  readonly id = 'notion';
  readonly name = 'Notion Agent';

  async executeTask(taskInput: {
    title: string;
    description?: string;
    dueDate?: string;
    status?: string;
  }) {
    return await createNotionTask({
      title: taskInput.title,
      description: taskInput.description,
      dueDate: taskInput.dueDate,
      status: taskInput.status || 'To Do',
    });
  }

  async updateStatus(pageId: string, status: string, notes?: string) {
    return await updateNotionTask({ pageId, status, notes });
  }

  async verifyTask(pageId: string, expectedTitle?: string) {
    return await verifyNotionTask({ pageId, expectedTitle });
  }
}

export const notionAgent = new NotionAgent();
