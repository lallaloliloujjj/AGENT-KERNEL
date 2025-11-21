export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';
export type MessageState = 'queued' | 'generating' | 'streaming' | 'tool_call' | 'waiting' | 'done' | 'error';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AuthType = 'oauth' | 'api_key' | 'service_account' | 'none';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'service';
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  state: MessageState;
  attachments?: Attachment[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  tool_calls?: ToolCall[];
  error?: string;
}

export interface Attachment {
  id: string;
  message_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_url: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ToolCall {
  id: string;
  tool_name: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  timestamp: string;
}

export interface Plan {
  id: string;
  user_id: string;
  conversation_id: string;
  goal: string;
  status: 'planning' | 'queued' | 'executing' | 'completed' | 'failed' | 'cancelled';
  steps: Step[];
  plan_json: Record<string, unknown>;
  cost_estimate: number;
  actual_cost?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Step {
  id: string;
  plan_id: string;
  step_number: number;
  tool_name: string;
  description: string;
  input_payload: Record<string, unknown>;
  output_payload?: Record<string, unknown>;
  status: StepStatus;
  risk_level: RiskLevel;
  dependencies: string[];
  timeout_ms: number;
  idempotency_key: string;
  worker_id?: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
  retry_count: number;
  max_retries: number;
}

export interface Tool {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  json_schema: Record<string, unknown>;
  auth_type: AuthType;
  auth_scopes?: string[];
  risk_level: RiskLevel;
  endpoint?: string;
  installed_by: string;
  is_active: boolean;
  usage_count: number;
  last_used?: string;
  created_at: string;
  updated_at: string;
}

export interface ToolRegistry {
  id: string;
  tool_id: string;
  organization_id: string;
  is_enabled: boolean;
  config: Record<string, unknown>;
  rate_limit_per_minute?: number;
  quota_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthCredential {
  id: string;
  user_id: string;
  provider: string;
  vault_reference: string;
  scopes: string[];
  expires_at?: string;
  last_used?: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  content: string;
  embedding_vector?: number[];
  vector_id?: string;
  summary?: string;
  source_uri?: string;
  privacy_flag: boolean;
  conversation_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  payload: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  result: 'success' | 'failure';
  error_message?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  messages: Message[];
  last_plan_id?: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

export interface A2AMessage {
  id: string;
  from: string;
  to: string;
  type: 'REQUEST' | 'ACK' | 'START' | 'PROGRESS' | 'DONE' | 'FAIL';
  capability_token: string;
  payload: Record<string, unknown>;
  signature: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface NodeInspectorData {
  id: string;
  type: 'agent' | 'tool' | 'data' | 'model' | 'memory';
  label: string;
  x: number;
  y: number;
  value?: unknown;
  connections: string[];
  heat: number;
  metadata?: Record<string, unknown>;
}

export interface NodeInspectorEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  flow?: number;
  animated: boolean;
}

export interface ConversationContextState {
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  selectedPlan?: Plan;
  streamingMessage?: Partial<Message>;
}

export interface OrchestratorContextState {
  plans: Plan[];
  selectedPlan: Plan | null;
  isExecuting: boolean;
  progress: number;
}
