import type { Message, Plan, Step, Tool, Conversation } from '../types';
import { supabase } from './supabaseClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Conversation API
export const conversationAPI = {
  async createConversation(title: string): Promise<Conversation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        archived: false,
      })
      .select()
      .single();

    if (error) throw new APIError(500, 'Failed to create conversation', error);
    return data;
  },

  async getConversations(): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (error) throw new APIError(500, 'Failed to fetch conversations', error);
    return data || [];
  },

  async getConversation(id: string): Promise<Conversation> {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new APIError(500, 'Failed to fetch conversation', error);
    return data;
  },

  async archiveConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ archived: true })
      .eq('id', id);

    if (error) throw new APIError(500, 'Failed to archive conversation', error);
  },

  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw new APIError(500, 'Failed to delete conversation', error);
  },
};

// Messages API
export const messageAPI = {
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw new APIError(500, 'Failed to fetch messages', error);
    return data || [];
  },

  async createMessage(
    conversationId: string,
    role: Message['role'],
    content: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        state: 'done',
      })
      .select()
      .single();

    if (error) throw new APIError(500, 'Failed to create message', error);
    return data;
  },

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new APIError(500, 'Failed to update message', error);
    return data;
  },

  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) throw new APIError(500, 'Failed to delete message', error);
  },
};

// Plans API
export const planAPI = {
  async createPlan(
    conversationId: string,
    goal: string,
    planJson: Record<string, unknown>
  ): Promise<Plan> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('plans')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        goal,
        plan_json: planJson,
        status: 'planning',
      })
      .select('*')
      .single();

    if (error) throw new APIError(500, 'Failed to create plan', error);
    return data;
  },

  async getPlan(id: string): Promise<Plan> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new APIError(500, 'Failed to fetch plan', error);
    return data;
  },

  async getConversationPlans(conversationId: string): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (error) throw new APIError(500, 'Failed to fetch plans', error);
    return data || [];
  },

  async updatePlanStatus(id: string, status: Plan['status']): Promise<Plan> {
    const { data, error } = await supabase
      .from('plans')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new APIError(500, 'Failed to update plan', error);
    return data;
  },

  async executePlan(id: string): Promise<Plan> {
    const { data, error } = await supabase
      .from('plans')
      .update({ status: 'executing' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new APIError(500, 'Failed to execute plan', error);
    return data;
  },
};

// Steps API
export const stepAPI = {
  async getSteps(planId: string): Promise<Step[]> {
    const { data, error } = await supabase
      .from('steps')
      .select('*')
      .eq('plan_id', planId)
      .order('step_number', { ascending: true });

    if (error) throw new APIError(500, 'Failed to fetch steps', error);
    return data || [];
  },

  async updateStep(id: string, updates: Partial<Step>): Promise<Step> {
    const { data, error } = await supabase
      .from('steps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new APIError(500, 'Failed to update step', error);
    return data;
  },
};

// Tools API
export const toolAPI = {
  async getTools(): Promise<Tool[]> {
    const { data, error } = await supabase
      .from('tools_registry')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw new APIError(500, 'Failed to fetch tools', error);
    return data || [];
  },

  async getTool(name: string): Promise<Tool> {
    const { data, error } = await supabase
      .from('tools_registry')
      .select('*')
      .eq('name', name)
      .single();

    if (error) throw new APIError(500, 'Failed to fetch tool', error);
    return data;
  },

  async registerTool(tool: Omit<Tool, 'id' | 'created_at' | 'updated_at'>): Promise<Tool> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('tools_registry')
      .insert({
        ...tool,
        installed_by: user.id,
      })
      .select()
      .single();

    if (error) throw new APIError(500, 'Failed to register tool', error);
    return data;
  },

  async updateTool(name: string, updates: Partial<Tool>): Promise<Tool> {
    const { data, error } = await supabase
      .from('tools_registry')
      .update(updates)
      .eq('name', name)
      .select()
      .single();

    if (error) throw new APIError(500, 'Failed to update tool', error);
    return data;
  },
};

// Stream message from model
export async function* streamChatResponse(
  conversationId: string,
  messages: Message[]
): AsyncGenerator<string> {
  try {
    const response = await fetch(`${API_BASE}/agent/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
      },
      body: JSON.stringify({
        conversationId,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(response.status, 'Failed to stream response', error);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i].trim();
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'token' && data.content) {
              yield data.content;
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }
      buffer = lines[lines.length - 1];
    }

    if (buffer.trim().startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.trim().slice(6));
        if (data.type === 'token' && data.content) {
          yield data.content;
        }
      } catch {
        // Ignore parsing errors
      }
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(500, 'Stream failed', error);
  }
}
