# Implementation Guide - Multimodal AI Agent Kernel

## Phase 1: Foundation (Current - MVP)

### Completed Tasks ✓

1. **Frontend Core (React/Vite)**
   - [x] Project structure with organized directories
   - [x] TypeScript type definitions for all entities
   - [x] Supabase integration with authentication
   - [x] React Context for conversation management
   - [x] Component library foundation

2. **Core Components**
   - [x] ChatWindow with message streaming support
   - [x] MessageComposer with file attachment support
   - [x] ChatBubble with status indicators
   - [x] ConversationSidebar with search and create
   - [x] PlanTimeline with step visualization
   - [x] NodeInspector with canvas-based network visualization
   - [x] AdminPanel with tool management UI

3. **Services & API**
   - [x] Supabase client initialization
   - [x] API service layer (conversation, message, plan, tool APIs)
   - [x] SSE streaming support for chat responses

4. **Database**
   - [x] Core schema definition (ready to apply)
   - [x] RLS policies for all tables
   - [x] Indexes for performance

### Next Tasks (Phase 2)

1. **Backend API (Node.js/Express)**
   - [ ] Initialize Express server
   - [ ] Implement authentication middleware (JWT validation)
   - [ ] Create API endpoints:
     - POST /api/agent/chat (streaming)
     - POST /api/agent/plan
     - GET /api/tools
     - POST /api/tools/register
     - POST /api/plans/{planId}/execute
     - GET /api/plans/{planId}/steps
     - POST /api/steps/{stepId}/retry

2. **Model Layer Proxy**
   - [ ] Gemini API integration
   - [ ] GPT-5 API integration (fallback)
   - [ ] Token streaming implementation
   - [ ] Function-calling schema generation from Tool Registry
   - [ ] Cost calculation and tracking

3. **Task Queue & Workers**
   - [ ] BullMQ setup with Redis
   - [ ] Worker process implementation
   - [ ] Job processing lifecycle
   - [ ] Retry logic with exponential backoff
   - [ ] Dead letter queue for failed jobs

4. **Tool Registry & MCP Connectors**
   - [ ] Tool Registry CRUD endpoints
   - [ ] Google Drive MCP connector (read, search, upload)
   - [ ] Gmail MCP connector (search, read, send)
   - [ ] OAuth flow implementation for connectors
   - [ ] Tool validation and execution sandbox

5. **Memory Layer**
   - [ ] Vector DB integration (Pinecone)
   - [ ] Embedding worker (convert text to vectors)
   - [ ] Memory retrieval API (k-NN search)
   - [ ] Summarization worker
   - [ ] Privacy and consent management

6. **Security & Policy**
   - [ ] Vault integration for credentials
   - [ ] DLP scanner implementation
   - [ ] Policy engine setup
   - [ ] Audit logging implementation
   - [ ] Human-in-loop approval workflow

## Setting Up Backend

### Prerequisites

```bash
# Node.js 18+
node --version

# Install dependencies
npm install express dotenv cors helmet ajv redis bull ioredis axios
npm install -D @types/express @types/node typescript
```

### Backend Project Structure

```
backend/
├── src/
│   ├── index.ts (entry point)
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── cache.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   └── audit.ts
│   ├── services/
│   │   ├── orchestrator.ts
│   │   ├── modelProxy.ts
│   │   ├── toolRegistry.ts
│   │   ├── worker.ts
│   │   ├── memory.ts
│   │   └── security.ts
│   ├── routes/
│   │   ├── chat.ts
│   │   ├── plans.ts
│   │   ├── tools.ts
│   │   ├── steps.ts
│   │   └── admin.ts
│   ├── connectors/
│   │   ├── google/
│   │   │   ├── drive.ts
│   │   │   └── gmail.ts
│   │   └── base.ts
│   ├── types/
│   │   └── index.ts (shared types)
│   └── utils/
│       ├── logger.ts
│       ├── errors.ts
│       └── validation.ts
├── .env.example
└── package.json
```

### Minimal Express Server Template

```typescript
// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authenticateToken } from './middleware/auth';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Auth middleware
app.use(authenticateToken);

// Routes
app.post('/api/agent/chat', async (req, res) => {
  // Implement streaming response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  // Stream tokens
  res.write('data: {"type":"token","content":"Hello"}\n\n');
  res.end();
});

app.listen(3000, () => {
  console.log('API server listening on port 3000');
});
```

## Setting Up Google OAuth

### 1. Create Google Cloud Project

```
1. Go to https://console.cloud.google.com/
2. Create new project "Agent Kernel"
3. Enable APIs:
   - Google Drive API
   - Gmail API
4. Create OAuth 2.0 credentials:
   - Type: Web application
   - Authorized URIs: http://localhost:5173, https://yourdomain.com
   - Download JSON credentials
```

### 2. Configure Supabase Auth

```sql
-- In Supabase Dashboard > Auth > Providers > Google
-- Add your Google OAuth credentials
-- Callback URL: https://your-supabase-url.supabase.co/auth/v1/callback
```

### 3. Frontend Integration

```typescript
// src/services/auth.ts
const handleGoogleSignIn = async () => {
  const { data, error } = await auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'email profile'
    }
  });
};
```

## Environment Configuration

### .env (Frontend)

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
VITE_API_URL=http://localhost:3000/api
```

### .env (Backend)

```env
# Database
DATABASE_URL=postgres://user:pass@localhost:5432/agent_kernel

# Auth
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# API Keys
GEMINI_API_KEY=xxxxx
OPENAI_API_KEY=xxxxx

# OAuth
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx

# External Services
REDIS_URL=redis://localhost:6379
PINECONE_API_KEY=xxxxx
PINECONE_INDEX=agent-kernel

# Vault
VAULT_ADDR=https://vault.example.com
VAULT_TOKEN=xxxxx

# Server
PORT=3000
NODE_ENV=development
```

## Database Migration Guide

### Apply Migrations Locally

```bash
# Using Supabase CLI
supabase migration new create_core_tables
# (edit migration file)
supabase migration up

# Or execute directly in Supabase Dashboard
# Copy migration SQL to SQL Editor and run
```

### Verify Schema

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS enabled
SELECT tablename FROM pg_tables
WHERE tablename IN ('users', 'conversations', 'messages')
AND schemaname = 'public';

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('users', 'conversations', 'messages')
AND schemaname = 'public';
```

## Testing Locally

### 1. Test Chat API

```bash
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "conversationId": "test-123",
    "message": "Hello agent"
  }'
```

### 2. Test Tool Registry

```bash
curl -X GET http://localhost:3000/api/tools \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Test Plan Execution

```bash
curl -X POST http://localhost:3000/api/plans/plan-123/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "parallelSteps": true
  }'
```

## Debugging Tips

### Frontend Debugging

```typescript
// Enable verbose logging
localStorage.setItem('DEBUG', 'agent:*');

// Watch Supabase calls
const { data, error } = await supabase
  .from('messages')
  .select('*');
console.log('DB Response:', { data, error });
```

### Backend Debugging

```typescript
// Enable stack traces
process.env.DEBUG = '*';

// Log incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    user: req.user?.id,
    body: req.body
  });
  next();
});
```

### Real-time Debugging

```bash
# Monitor Redis queue
redis-cli
MONITOR

# Watch Postgres logs
tail -f /var/log/postgresql/postgresql.log

# WebSocket debugging
wscat -c ws://localhost:3000/ws
```

## Common Issues & Solutions

### Issue: CORS errors

**Solution:**
```typescript
// Ensure frontend and backend URLs match
app.use(cors({
  origin: ['http://localhost:5173', 'https://yourdomain.com'],
  credentials: true
}));
```

### Issue: JWT token expired

**Solution:**
```typescript
// Implement token refresh logic
const refreshToken = async () => {
  const { data } = await auth.refreshSession();
  // Update auth header
};
```

### Issue: Streaming responses not working

**Solution:**
```typescript
// Ensure Content-Type and caching headers are set
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');
```

### Issue: Tool execution timeout

**Solution:**
```typescript
// Increase timeout in worker
const job = await queue.add('execute-tool', { toolId, args }, {
  timeout: 60000, // 60 seconds
});
```

## Performance Optimization

### Frontend Optimizations

```typescript
// Use React.memo for expensive components
export const ChatBubble = React.memo(({ message }) => {
  // Component code
});

// Lazy load components
const NodeInspector = lazy(() => import('./NodeInspector'));

// Virtualize long lists
import { FixedSizeList } from 'react-window';
<FixedSizeList height={600} itemCount={messages.length}>
  {({ index, style }) => (
    <div style={style}>
      <ChatBubble message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

### Backend Optimizations

```typescript
// Database query optimization
// Use indexes on user_id, created_at
SELECT * FROM messages
WHERE conversation_id = $1
ORDER BY created_at DESC
LIMIT 50;

// Connection pooling
const pool = new Pool({ max: 20 });

// Redis caching
const toolCache = await redis.get(`tool:${toolId}`);
if (!toolCache) {
  const tool = await db.tools.findOne(toolId);
  await redis.setex(`tool:${toolId}`, 3600, JSON.stringify(tool));
}
```

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] API endpoints tested
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] SSL certificates installed

## Next Steps

1. Implement backend API server
2. Connect to Gemini/GPT-5 APIs
3. Build MCP connectors for Google Workspace
4. Set up task queue and workers
5. Integrate vector database
6. Implement security and audit
7. Deploy to staging environment
8. Load testing and optimization
9. Production deployment
