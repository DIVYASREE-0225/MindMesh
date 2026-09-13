/**
 * Notion Integration Service
 * Performs REAL API interactions against the official Notion REST API.
 */

import { getCredentials } from './config';

export interface NotionTaskParams {
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD or ISO string
  status?: string;
}

export interface NotionTaskResult {
  success: boolean;
  pageId?: string;
  pageUrl?: string;
  title?: string;
  error?: string;
  retryable?: boolean;
  raw?: any;
}

export interface NotionVerifyResult {
  verified: boolean;
  pageId?: string;
  title?: string;
  archived?: boolean;
  url?: string;
  reason?: string;
  raw?: any;
}

const NOTION_VERSION = '2022-06-28';

/**
 * Extracts a clean 32-character Notion UUID from full URLs, query strings, or formatted UUIDs.
 */
export function sanitizeNotionId(input?: string): string {
  if (!input) return '';
  const clean = input.split('?')[0].split('#')[0].replace(/-/g, '').trim();
  const match = clean.match(/[a-fA-F0-9]{32}/);
  return match ? match[0] : clean;
}

export async function testNotionConnection(): Promise<{ ok: boolean; error?: string; botName?: string; workspace?: string; databaseTitle?: string }> {
  const { notion } = getCredentials();

  if (!notion.apiKey) {
    return { ok: false, error: 'Notion Internal Integration Secret (NOTION_API_KEY) is not configured' };
  }

  try {
    const res = await fetch('https://api.notion.com/v1/users/me', {
      headers: {
        'Authorization': `Bearer ${notion.apiKey}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        ok: false,
        error: data.message || `Notion API returned HTTP ${res.status}`,
      };
    }

    let databaseTitle: string | undefined;
    const cleanId = sanitizeNotionId(notion.databaseId);
    if (cleanId) {
      try {
        const dbRes = await fetch(`https://api.notion.com/v1/databases/${cleanId}`, {
          headers: {
            'Authorization': `Bearer ${notion.apiKey}`,
            'Notion-Version': NOTION_VERSION,
          },
        });
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          databaseTitle = dbData.title?.[0]?.plain_text || 'Database Linked';
        } else {
          // Check if page
          const pageRes = await fetch(`https://api.notion.com/v1/pages/${cleanId}`, {
            headers: {
              'Authorization': `Bearer ${notion.apiKey}`,
              'Notion-Version': NOTION_VERSION,
            },
          });
          if (pageRes.ok) {
            databaseTitle = 'Parent Page Linked';
          }
        }
      } catch {
        // Non-blocking
      }
    }

    return {
      ok: true,
      botName: data.name || 'Notion Integration Bot',
      workspace: data.bot?.workspace_name,
      databaseTitle,
    };
  } catch (err: any) {
    return { ok: false, error: `Notion connection failed: ${err.message}` };
  }
}

export async function createNotionTask(params: NotionTaskParams): Promise<NotionTaskResult> {
  const { notion } = getCredentials();

  if (!notion.apiKey) {
    return {
      success: false,
      error: 'Notion API key required. Please configure NOTION_API_KEY in Integrations.',
      retryable: false,
    };
  }

  try {
    let parent: any = null;
    let properties: any = {};
    const cleanDbId = sanitizeNotionId(notion.databaseId);

    // 1. Try configured Database ID if available
    let databaseSchema: any = null;
    if (cleanDbId) {
      try {
        const dbRes = await fetch(`https://api.notion.com/v1/databases/${cleanDbId}`, {
          headers: {
            'Authorization': `Bearer ${notion.apiKey}`,
            'Notion-Version': NOTION_VERSION,
          },
        });
        if (dbRes.ok) {
          databaseSchema = await dbRes.json();
          parent = { database_id: cleanDbId };
        }
      } catch {
        // Fall through
      }
    }

    // 2. If configured target is not a database, check if it is a parent page
    if (!parent && cleanDbId) {
      try {
        const pageRes = await fetch(`https://api.notion.com/v1/pages/${cleanDbId}`, {
          headers: {
            'Authorization': `Bearer ${notion.apiKey}`,
            'Notion-Version': NOTION_VERSION,
          },
        });
        if (pageRes.ok) {
          parent = { page_id: cleanDbId };
        }
      } catch {
        // Fall through
      }
    }

    // 3. If still no parent, search for accessible databases or pages
    if (!parent) {
      const searchRes = await fetch('https://api.notion.com/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notion.apiKey}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page_size: 5 }),
      });
      const searchData = await searchRes.json();

      if (searchRes.ok && searchData.results && searchData.results.length > 0) {
        // Prefer databases over pages
        const foundDb = searchData.results.find((r: any) => r.object === 'database');
        if (foundDb) {
          parent = { database_id: sanitizeNotionId(foundDb.id) };
          databaseSchema = foundDb;
        } else {
          const foundPage = searchData.results.find((r: any) => r.object === 'page');
          if (foundPage) {
            parent = { page_id: sanitizeNotionId(foundPage.id) };
          }
        }
      }
    }

    if (!parent) {
      return {
        success: false,
        error: 'No accessible Notion database or page found. Share a page or database with your Notion integration bot.',
        retryable: false,
      };
    }

    // Construct properties based on target type
    if (parent.database_id) {
      // Find the actual title property name (e.g. "Task name", "Name", "Title")
      let titlePropertyName = 'Name';
      let statusPropertyName: string | null = null;
      let statusPropertyType: 'status' | 'select' | null = null;
      let datePropertyName: string | null = null;

      if (databaseSchema?.properties) {
        for (const [key, prop] of Object.entries<any>(databaseSchema.properties)) {
          if (prop.type === 'title') {
            titlePropertyName = key;
          } else if (prop.type === 'status' || prop.type === 'select') {
            if (!statusPropertyName || key.toLowerCase().includes('status')) {
              statusPropertyName = key;
              statusPropertyType = prop.type;
            }
          } else if (prop.type === 'date') {
            if (!datePropertyName || key.toLowerCase().includes('due')) {
              datePropertyName = key;
            }
          }
        }
      }

      properties[titlePropertyName] = {
        title: [{ text: { content: params.title } }],
      };

      if (statusPropertyName && statusPropertyType) {
        const desiredStatus = params.status || 'To Do';
        if (statusPropertyType === 'status') {
          // Standard Notion status values: 'Not started', 'In progress', 'Done'
          const mappedStatus =
            desiredStatus.toLowerCase().includes('done') || desiredStatus.toLowerCase().includes('complete')
              ? 'Done'
              : desiredStatus.toLowerCase().includes('progress')
              ? 'In progress'
              : 'Not started';
          properties[statusPropertyName] = { status: { name: mappedStatus } };
        } else {
          properties[statusPropertyName] = { select: { name: desiredStatus } };
        }
      }

      if (datePropertyName && params.dueDate) {
        properties[datePropertyName] = { date: { start: params.dueDate } };
      }
    } else {
      // Page parent
      properties = {
        title: [{ text: { content: params.title } }],
      };
    }

    // Children blocks for task description
    const children: any[] = [];
    if (params.description) {
      children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: { content: params.description },
            },
          ],
        },
      });
    }

    const payload: any = { parent, properties };
    if (children.length > 0) {
      payload.children = children;
    }

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notion.apiKey}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      // If error was due to status property mismatch, retry once without status
      if (res.status === 400 && Object.keys(properties).length > 1) {
        const safeProps = {
          [Object.keys(properties)[0]]: properties[Object.keys(properties)[0]],
        };
        const retryRes = await fetch('https://api.notion.com/v1/pages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${notion.apiKey}`,
            'Notion-Version': NOTION_VERSION,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ parent, properties: safeProps, children }),
        });
        const retryData = await retryRes.json();
        if (retryRes.ok) {
          return {
            success: true,
            pageId: retryData.id,
            pageUrl: retryData.url,
            title: params.title,
            raw: retryData,
          };
        }
      }

      return {
        success: false,
        error: `Notion API error: ${data.message || `HTTP ${res.status}`}`,
        retryable: res.status >= 500,
        raw: data,
      };
    }

    return {
      success: true,
      pageId: data.id,
      pageUrl: data.url,
      title: params.title,
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network failure connecting to Notion API: ${err.message}`,
      retryable: true,
    };
  }
}

export async function updateNotionTask(params: {
  pageId: string;
  status?: string;
  notes?: string;
}): Promise<NotionTaskResult> {
  const { notion } = getCredentials();

  if (!notion.apiKey) {
    return {
      success: false,
      error: 'Notion API key missing',
      retryable: false,
    };
  }

  try {
    const properties: any = {};
    if (params.status) {
      properties['Status'] = {
        select: {
          name: params.status,
        },
      };
    }

    const res = await fetch(`https://api.notion.com/v1/pages/${encodeURIComponent(params.pageId)}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notion.apiKey}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ properties }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.message || `Failed to update Notion page (HTTP ${res.status})`,
        retryable: res.status >= 500,
        raw: data,
      };
    }

    return {
      success: true,
      pageId: data.id,
      pageUrl: data.url,
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Network error updating Notion: ${err.message}`,
      retryable: true,
    };
  }
}

export async function verifyNotionTask(params: {
  pageId: string;
  expectedTitle?: string;
}): Promise<NotionVerifyResult> {
  const { notion } = getCredentials();

  if (!notion.apiKey) {
    return {
      verified: false,
      reason: 'Notion integration key missing for verification query.',
    };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${encodeURIComponent(params.pageId)}`, {
      headers: {
        'Authorization': `Bearer ${notion.apiKey}`,
        'Notion-Version': NOTION_VERSION,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        verified: false,
        reason: `Notion page ${params.pageId} could not be retrieved: ${data.message || `HTTP ${res.status}`}`,
        raw: data,
      };
    }

    if (data.archived) {
      return {
        verified: false,
        reason: `Notion page ${params.pageId} exists but is archived.`,
        raw: data,
      };
    }

    // Extract title from properties
    let foundTitle = '';
    if (data.properties) {
      for (const key of Object.keys(data.properties)) {
        const prop = data.properties[key];
        if (prop.type === 'title' && prop.title && prop.title.length > 0) {
          foundTitle = prop.title.map((t: any) => t.plain_text).join('');
          break;
        }
      }
    }

    return {
      verified: true,
      pageId: data.id,
      title: foundTitle || 'Untitled Page',
      archived: data.archived,
      url: data.url,
      raw: data,
    };
  } catch (err: any) {
    return {
      verified: false,
      reason: `Verification call to Notion API failed: ${err.message}`,
    };
  }
}
