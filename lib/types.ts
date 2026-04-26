// Minimal types for posse

export interface Agent {
  id: string;
  name: string;
  model: { id: string; speed?: string };
  description: string | null;
  system: string;
  tools: unknown[];
  skills: unknown[];
  mcp_servers: unknown[];
  callable_agents?: unknown[];
  metadata?: Record<string, string>;
  version: number;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface AgentVersion extends Agent {
  // same shape, each entry is a historical version
}

export interface Environment {
  id: string;
  name: string;
  description?: string;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
  [key: string]: unknown;
}

export interface CreateEnvironmentRequest {
  name: string;
  config: Record<string, unknown>;
}

export interface Session {
  id: string;
  status: "idle" | "running" | "rescheduling" | "terminated";
  agent: string | { type: string; id: string; version: number };
  environment_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

// Raw event from /v1/sessions/{id}/events
export interface SessionEvent {
  id: string;
  type: string;
  processed_at: string | null;
  // user.message + agent.message + agent.tool_result
  content?: Array<{ type: string; text?: string }>;
  // agent.tool_use
  name?: string;
  input?: unknown;
  is_error?: boolean;
  tool_use_id?: string;
  // catch-all
  [key: string]: unknown;
}

export interface Message {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  eventType?: string;
  timestamp?: string;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // base64
}

// Memory stores
export interface MemoryStore {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  memory_store_id: string;
  path: string;
  content?: string; // only present when fetching individual memory
  content_sha256?: string;
  size_bytes?: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryVersion {
  id: string;
  memory_id: string;
  operation: "created" | "modified" | "deleted";
  content?: string;
  path?: string;
  created_at: string;
}
