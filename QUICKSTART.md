# Quick Start Guide - Agent Kernel

Get up and running with the Multimodal AI Agent Kernel in minutes!

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier available)
- Git

## Setup (5 minutes)

### 1. Clone and Install

```bash
# Navigate to project directory
cd project

# Install dependencies
npm install

# Update browserslist (recommended)
npx update-browserslist-db@latest
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get Supabase credentials:
1. Go to https://supabase.com/dashboard
2. Create new project (or select existing)
3. Go to Settings > API
4. Copy Project URL and Anon Key
5. Paste into .env.local

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser!

## First Steps in the UI

### 1. Authenticate
- Click "Sign In with Google"
- Complete Google OAuth flow
- You're logged in!

### 2. Create First Conversation
- Click "New Chat" in sidebar
- Enter a title (e.g., "My First Plan")
- Start chatting!

### 3. Explore Tabs
- **Chat Tab**: Send messages and see responses (streaming not yet connected to backend)
- **Plan Tab**: View execution plans (demo data available when plans exist)
- **Network Tab**: Interactive node visualization of agent topology

### 4. Admin Panel
- Click Settings icon
- View system metrics and tool registry
- Manage connectors and policies

## Project Structure Quick Tour

```
src/
├── components/    # React components
│   ├── Chat/     # Messaging interface
│   ├── Plan/     # Plan visualization
│   ├── Inspector/# Network topology
│   └── Admin/    # Admin controls
├── context/       # React Context providers
├── services/      # API integration
├── types/         # TypeScript definitions
└── App.tsx        # Main application
```

## Available Commands

```bash
# Development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Database Setup (Optional)

To fully enable data persistence:

1. **Apply migrations** (when backend is ready):
```bash
# Via Supabase CLI
supabase db push

# Or manually in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Create a new query
# 3. Copy SQL from supabase/migrations/
# 4. Execute
```

2. **Verify tables created**:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

## Testing Key Features

### Chat Interface
- Type a message and press Ctrl+Enter
- Try attaching files (click attachment icon)
- Use record button for audio (mock)

### Plan Timeline
- (Will appear when backend sends plan data)
- Click steps to expand details
- View input/output payloads

### Network Inspector
- Click "Network" tab
- Drag to pan the canvas
- Scroll to zoom
- Click nodes for details
- Download visualization as image

## Common Issues & Quick Fixes

### "Cannot find module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Port 5173 already in use
```bash
# Use different port
npm run dev -- --port 3000
```

### Supabase connection errors
- Verify VITE_SUPABASE_URL and key in .env.local
- Check Supabase project is active
- Ensure Google OAuth is configured in Supabase

### Build errors
```bash
# Clear Vite cache
rm -rf .vite dist

# Run type check
npm run typecheck

# Rebuild
npm run build
```

## Next Steps

### Short Term (This Week)
1. [ ] Get frontend running locally
2. [ ] Configure Supabase credentials
3. [ ] Explore UI components
4. [ ] Read ARCHITECTURE.md

### Medium Term (Next 2 Weeks)
1. [ ] Start backend API implementation
2. [ ] Integrate Gemini API
3. [ ] Build first MCP connector
4. [ ] Connect frontend to real API

### Long Term (Next Month)
1. [ ] Deploy to staging environment
2. [ ] Implement security policies
3. [ ] Set up monitoring
4. [ ] Production deployment

## Documentation

| Document | Purpose |
|----------|---------|
| **PROJECT_SUMMARY.md** | Project overview and features |
| **ARCHITECTURE.md** | System design and components |
| **IMPLEMENTATION_GUIDE.md** | Step-by-step development guide |
| **QUICKSTART.md** | This file - quick setup |

## Getting Help

### Reading Order for Different Needs

**I want to understand the system:**
1. Read PROJECT_SUMMARY.md
2. Read ARCHITECTURE.md

**I want to continue development:**
1. Read IMPLEMENTATION_GUIDE.md
2. Check component code in src/components/
3. Review type definitions in src/types/

**I have a technical question:**
1. Check ARCHITECTURE.md > your topic
2. Look at relevant component code
3. Review IMPLEMENTATION_GUIDE.md debugging section

## Architecture Overview (TL;DR)

```
User Interactions
       ↓
[React Frontend] → Chat, Plans, Network visualization
       ↓
[Supabase Backend] → Auth, Database, RLS
       ↓
[Express API] → Orchestration, Tool execution (coming)
       ↓
[AI Models] → Gemini/GPT-5 (coming)
       ↓
[Tool Connectors] → Google Drive, Gmail, etc. (coming)
```

## Key Technologies

- **Frontend**: React 18, TypeScript 5, Tailwind CSS 3, Vite 5
- **Backend Ready**: Node.js, Express, PostgreSQL
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (Google OAuth)
- **Styling**: Tailwind CSS with custom components
- **Icons**: Lucide React

## Development Timeline

**Week 1**: Frontend complete ✓ (you are here)
**Week 2-3**: Backend API + AI integration
**Week 3-4**: MCP connectors + memory layer
**Week 4-5**: Security, testing, optimization
**Week 5-6**: Deployment and hardening

## What's Included

✓ Production-ready React frontend
✓ Comprehensive type system
✓ Database schema with RLS
✓ API service layer interface
✓ Beautiful UI components
✓ Network visualization
✓ Admin controls
✓ Complete documentation

## What's Next

⏳ Express backend server
⏳ AI model integration
⏳ Tool connector implementations
⏳ Vector database integration
⏳ Security hardening
⏳ Performance optimization

---

**Ready to build?** Start with `npm run dev` and explore the UI!

**Questions?** Check the documentation files in the project root.

**Want to contribute?** See IMPLEMENTATION_GUIDE.md for setup instructions.
