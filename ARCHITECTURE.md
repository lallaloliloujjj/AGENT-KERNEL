# Multimodal AI Agent Kernel Architecture

## Overview

This is an enterprise-grade multimodal AI orchestration platform designed to enable complex task planning and execution through an intelligent kernel that leverages AI models (Gemini v3 Pro / GPT-5) to generate plans, manage tool discovery, and coordinate multi-step workflows with comprehensive security and observability.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE (React)                       │
│  ┌──────────────┬──────────────┬──────────────────┬────────────┐
│  │ Chat Window  │ Plan Timeline│ Node Inspector   │ Admin Panel│
│  └──────────────┴──────────────┴──────────────────┴────────────┘
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│               API Gateway & Authentication Layer                │
│                    (Supabase Auth + JWT)                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                   CORE BACKEND SERVICES                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Orchestrator Service (Stateless)                         │  │
│  │ - Plan Generation & Validation                           │  │
│  │ - Step Execution Coordination                            │  │
│  │ - Error Handling & Retry Logic                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Model Layer Proxy                                        │  │
│  │ - Token Streaming (SSE)                                  │  │
│  │ - Function Calling                                       │  │
│  │ - Multi-Model Fallback Strategy                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────┬──────────────┬────────────────┬──────────────┬────────────┘
      │              │                │              │
┌─────▼──┐  ┌───────▼─────┐  ┌──────▼──────┐  ┌────▼──────┐
│ Tool   │  │ Task Queue  │  │  Security & │  │  Memory   │
│Registry│  │ (BullMQ)    │  │  Policy     │  │  Layer    │
│& MCP   │  │             │  │  Engine     │  │           │
└────────┘  ├─────────────┤  ├─────────────┤  ├───────────┤
            │   Workers   │  │   Vault &   │  │ Vector DB │
            │   Pool      │  │   RLS       │  │ (Pinecone)│
            └─────────────┘  └─────────────┘  └───────────┘
```

## Core Components

### 1. Orchestrator Service

The orchestrator is the central coordination engine that manages plan execution:

**Responsibilities:**
- Receives goals from users via chat interface
- Calls AI model to generate structured execution plans
- Validates plans against policy engine and security constraints
- Enqueues steps in task queue for processing
- Monitors execution and collects results
- Handles errors, retries, and fallbacks

**Key Features:**
- Stateless design for horizontal scalability
- Support for parallel and sequential step execution
- Dependency resolution and topological sorting
- Idempotency key tracking for safe retries
- Cost estimation and quota enforcement
- Real-time status streaming to frontend

### 2. Model Layer Proxy

Abstracts all interactions with external AI models:

**Responsibilities:**
- Stream tokens to frontend in real-time via Server-Sent Events
- Manage function-calling with validated tool schemas
- Batch requests for cost optimization
- Implement multi-model fallback strategies
- Cache prompt/response pairs when appropriate
- Track token consumption and costs

**Supported Models:**
- Gemini v3 Pro (primary)
- GPT-5 Pro (fallback)
- Future: Claude, Anthropic models

### 3. Tool Registry & MCP Framework

Provides standardized interface for tool discovery and execution:

**Components:**
- **Tool Registry Database**: Central catalog of all available tools with metadata
- **MCP Servers**: Standard implementation for each connector (Google Drive, Gmail, etc.)
- **Schema Validation**: AJV-based JSON schema validation of tool arguments
- **Tool Discovery API**: Exposes available tools to AI model for function-calling

**Tool Lifecycle:**
1. Register tool with metadata and JSON schema
2. Configure authentication (OAuth/API Key)
3. Make available in tool registry
4. Model discovers and selects tool
5. Orchestrator validates and executes
6. Results stored and tracked

### 4. Worker Pool

Executes tools in isolated, scaled environment:

**Features:**
- Process-level isolation for security
- Resource limits (CPU, memory, timeout)
- Dead letter queue for failed jobs
- Graceful shutdown with job completion
- Telemetry and metrics collection
- Support for both sync and async operations

### 5. Memory Layer

Multi-tier memory system for context management:

**Tiers:**
1. **Short-Term (Messages Table)**: Recent conversation history in Supabase
2. **Working Memory (Redis)**: Active context for current plan execution
3. **Long-Term (Vector DB)**: Searchable embeddings with metadata filtering
4. **Event Store**: Append-only transaction log for replay capability

**Capabilities:**
- Vector search with k-NN for semantic retrieval
- Privacy-aware storage with PII detection
- TTL-based memory expiration
- User consent controls for data retention

### 6. Security & Policy Engine

Multi-layered security architecture:

**Components:**
- **Vault Integration**: Secure credential storage (OAuth tokens, API keys)
- **RLS Policies**: Row-Level Security at database level
- **Policy Engine**: OPA-inspired declarative authorization
- **DLP Scanner**: Detects PII, credentials, sensitive data
- **Human-in-Loop**: Approval workflow for high-risk operations
- **Audit Logging**: WORM (Write Once Read Many) immutable logs

**Risk Level Assessment:**
- **Low**: Non-sensitive read operations
- **Medium**: Data modification, external API calls
- **High**: Cross-user data access, credential operations
- **Critical**: Requires explicit human approval

### 7. A2A Gateway (Agent-to-Agent)

Internal communication infrastructure:

**Message Types:**
- REQUEST: Agent makes request to another agent
- ACK: Acknowledgment of request receipt
- START: Processing has begun
- PROGRESS: Status update during processing
- DONE: Operation completed successfully
- FAIL: Operation failed

**Security:**
- Capability tokens for delegation
- Signature verification using service keys
- Rate limiting per agent pair

## Database Schema

### Core Tables

**conversations**
- id (UUID PK)
- user_id (FK → auth.users)
- title, description
- archived boolean
- created_at, updated_at

**messages**
- id (UUID PK)
- conversation_id (FK)
- role (user|assistant|system|tool)
- content text
- state (queued|generating|streaming|tool_call|waiting|done|error)
- metadata JSONB

**plans**
- id (UUID PK)
- user_id (FK)
- conversation_id (FK)
- goal text
- status (planning|queued|executing|completed|failed|cancelled)
- plan_json JSONB (structured plan from model)
- cost_estimate, actual_cost numeric
- created_at, updated_at, completed_at

**steps**
- id (UUID PK)
- plan_id (FK)
- step_number integer
- tool_name text
- input_payload, output_payload JSONB
- status (pending|running|completed|failed|skipped)
- risk_level (low|medium|high|critical)
- dependencies text[]
- timeout_ms integer
- idempotency_key text
- error text
- retry_count, max_retries integer

**tools_registry**
- id (UUID PK)
- name text UNIQUE
- version text
- description text
- json_schema JSONB (JSON Schema for validation)
- auth_type (oauth|api_key|service_account|none)
- auth_scopes text[]
- risk_level
- is_active boolean
- usage_count integer
- last_used timestamptz

**auth_credentials**
- id (UUID PK)
- user_id (FK)
- provider text
- vault_reference text (pointer to encrypted secret)
- scopes text[]
- expires_at timestamptz

**memories**
- id (UUID PK)
- user_id (FK)
- content text
- vector_id text (reference to vector DB)
- summary text
- source_uri text
- privacy_flag boolean
- conversation_id (FK)
- expires_at timestamptz

**audit_logs** (immutable)
- id (UUID PK)
- actor_id (FK)
- action text
- resource_type, resource_id text
- payload JSONB
- ip_address, user_agent
- result (success|failure)
- created_at (no updates allowed)

## API Contracts

### Chat Endpoint

```
POST /api/agent/chat
{
  "conversationId": "conv-123",
  "message": "Rédige et envoie un résumé du dernier contrat",
  "attachments": [{
    "type": "image|file|audio",
    "storageUrl": "https://..."
  }]
}

Response: Server-Sent Events stream
data: {"type":"token","content":"Le "}
data: {"type":"token","content":"résumé"}
data: {"type":"plan","content":{...}}
data: {"type":"done"}
```

### Tool Registry Endpoint

```
GET /api/tools
Response:
[
  {
    "id": "tool-123",
    "name": "google_drive_read",
    "version": "1.0.0",
    "json_schema": {...},
    "risk_level": "low"
  }
]
```

### Plan Execution Endpoint

```
POST /api/plans/{planId}/execute
Response:
{
  "planId": "plan-123",
  "status": "executing",
  "steps": [...]
}
```

## Frontend Architecture

### Component Hierarchy

```
App
├── ConversationProvider (Context)
├── Header
│   ├── Branding
│   ├── User Profile
│   └── Actions (Settings, Logout)
├── Sidebar (Desktop)
│   └── ConversationList
├── MainArea
│   ├── TabSelector (Chat|Plan|Network)
│   └── TabContent
│       ├── ChatWindow
│       │   ├── ConversationSidebar
│       │   └── MessageArea
│       │       ├── ChatBubbles
│       │       └── MessageComposer
│       ├── PlanTimeline
│       │   └── StepCards (expandable)
│       └── NodeInspector
│           ├── Canvas (network visualization)
│           └── NodeDetails (sidebar)
└── AdminPanel
    ├── Overview (stats)
    ├── Tools (registry management)
    ├── Credentials (OAuth/API keys)
    └── Policies (authorization rules)
```

### State Management

**Global Context:**
- ConversationContext: Current conversation, messages, plans
- AuthContext: User authentication and session state

**Local Component State:**
- UI state (modals, expanded items, selection)
- Temporary form state
- Loading and error states

## Security Architecture

### Authentication & Authorization

1. **User Authentication**
   - Supabase Auth with Google OAuth
   - JWT tokens in Authorization header
   - Refresh token rotation

2. **Row-Level Security (RLS)**
   - PostgreSQL RLS policies on all tables
   - Users can only access their own data
   - Org admins can manage org resources

3. **Service Accounts**
   - Internal agents (Orchestrator, Memory Worker, etc.)
   - Service-specific signing keys
   - Capabilities-based authorization

### Data Protection

1. **Credential Storage**
   - Never store raw tokens in database
   - Vault references for encrypted secrets
   - Token rotation before expiration

2. **PII Detection & Redaction**
   - DLP scanner detects email, phone, SSN, etc.
   - Automatic redaction before sending to model
   - Privacy-flag on memory entries

3. **Audit Trail**
   - Immutable audit logs (WORM)
   - All data access logged with: who, what, when, why
   - Compliance with GDPR, SOC 2, etc.

## Deployment Architecture

### Container Structure

```
docker-compose:
  - frontend (React/Vite)
  - api (Node.js/Express)
  - orchestrator (Node.js)
  - worker (Node.js)
  - redis (cache & queue)
  - postgres (Supabase local)
  - vector-db (Pinecone/Weaviate)
```

### Kubernetes Deployment

```
Deployments:
  - frontend-api (Nginx)
  - orchestrator-api (3+ replicas, auto-scale)
  - worker-pool (0-10 replicas, auto-scale on queue depth)
  - memory-indexer (1 replica)

Services:
  - frontend-api (LoadBalancer)
  - orchestrator-api (ClusterIP)
  - worker-pool (internal)

ConfigMaps:
  - environment variables
  - feature flags

Secrets:
  - API keys
  - Database credentials
  - OAuth secrets
```

## Monitoring & Observability

### Metrics

**System Level:**
- Request rate, latency, error rate
- CPU, memory, disk usage
- Queue depth and processing time

**Business Level:**
- Plans created/completed/failed
- Token consumption
- Cost per user/day
- Tool usage frequency

### Logging

- Structured JSON logs with correlation IDs
- Log aggregation (ELK stack or Loki)
- Log retention: 90 days standard, 7 years for audit

### Tracing

- OpenTelemetry instrumentation
- Trace propagation through all services
- Jaeger backend for visualization

### Alerting

- High error rate (>5%)
- Queue backlog (>1000 items)
- Service down (health check failed)
- Quota exceeded
- Cost anomaly detection

## Development Workflow

### Local Development

```bash
npm install
npm run dev
# or
docker-compose up -d
```

### Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Type checking
npm run typecheck
```

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Security scanning
npm run security
```

## Future Enhancements

1. **Multi-Model Orchestration**: Support for multiple concurrent models
2. **Advanced Memory**: Hierarchical summarization and importance scoring
3. **Auto-Marketplace**: Third-party connector marketplace with revenue sharing
4. **Streaming Plans**: Progressive plan generation (not waiting for complete plan)
5. **Visual Debugger**: Step-by-step execution with breakpoints
6. **Custom Training**: Fine-tune models on org-specific patterns
7. **Batch Processing**: Queue plans for scheduled execution
8. **Webhooks**: Trigger plans from external events

## References

- [OpenAPI Spec](./openapi.yaml)
- [Database Migrations](./supabase/migrations/)
- [Component Library](./src/components/)
- [Type Definitions](./src/types/)
