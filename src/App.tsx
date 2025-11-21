import React, { useEffect, useState } from 'react';
import { ConversationProvider, useConversation } from './context/ConversationContext';
import { ConversationSidebar } from './components/Chat/ConversationSidebar';
import { ChatWindow } from './components/Chat/ChatWindow';
import { PlanTimeline } from './components/Plan/PlanTimeline';
import { NodeInspector } from './components/Inspector/NodeInspector';
import { auth } from './services/supabaseClient';
import { conversationAPI, planAPI, stepAPI } from './services/api';
import type { Plan, Step, NodeInspectorData, NodeInspectorEdge } from './types';
import {
  LayoutGrid,
  MessageCircle,
  Zap,
  Network,
  LogOut,
  Settings,
  Menu,
  X,
} from 'lucide-react';

type Tab = 'chat' | 'plan' | 'inspector';

const AppContent: React.FC = () => {
  const { currentConversation, setCurrentConversation } = useConversation();
  const [currentTab, setCurrentTab] = useState<Tab>('chat');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planSteps, setPlanSteps] = useState<Step[]>([]);
  const [inspectorNodes, setInspectorNodes] = useState<NodeInspectorData[]>([]);
  const [inspectorEdges, setInspectorEdges] = useState<NodeInspectorEdge[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const conversations = await conversationAPI.getConversations();
          if (conversations.length > 0) {
            setCurrentConversation(conversations[0]);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [setCurrentConversation]);

  useEffect(() => {
    if (currentConversation) {
      loadPlans();
    }
  }, [currentConversation]);

  const loadPlans = async () => {
    if (!currentConversation) return;
    try {
      const plans = await planAPI.getConversationPlans(currentConversation.id);
      if (plans.length > 0) {
        const plan = plans[0];
        setSelectedPlan(plan);
        const steps = await stepAPI.getSteps(plan.id);
        setPlanSteps(steps);
        generateInspectorData(plan, steps);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const generateInspectorData = (plan: Plan, steps: Step[]) => {
    const nodes: NodeInspectorData[] = [
      {
        id: 'model',
        type: 'model',
        label: 'Model',
        x: 100,
        y: 100,
        heat: 50,
        connections: ['orchestrator'],
      },
      {
        id: 'orchestrator',
        type: 'agent',
        label: 'Orchestrator',
        x: 300,
        y: 100,
        heat: 75,
        connections: steps.map((s) => `tool-${s.tool_name}`),
      },
      ...steps.map((step, idx) => ({
        id: `tool-${step.tool_name}`,
        type: 'tool' as const,
        label: step.tool_name,
        x: 500 + idx * 150,
        y: 100 + Math.sin(idx) * 100,
        heat: step.status === 'running' ? 100 : step.status === 'completed' ? 50 : 20,
        connections: ['orchestrator'],
      })),
    ];

    const edges: NodeInspectorEdge[] = [
      {
        id: 'model-orchestrator',
        source: 'model',
        target: 'orchestrator',
        animated: true,
      },
      ...steps.map((step) => ({
        id: `orchestrator-${step.tool_name}`,
        source: 'orchestrator',
        target: `tool-${step.tool_name}`,
        animated: step.status === 'running',
      })),
    ];

    setInspectorNodes(nodes);
    setInspectorEdges(edges);
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-300 border-t-blue-600 animate-spin mx-auto" />
          </div>
          <p className="text-slate-600 font-medium">Initializing agent kernel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Agent Kernel</h1>
          <p className="text-slate-600 mb-8">
            Multimodal AI orchestration platform with advanced planning and execution
          </p>
          <button
            onClick={() => auth.signInWithOAuth({ provider: 'google' })}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Agent Kernel</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
            <div className="text-sm">
              <div className="font-medium text-slate-900">{user?.email}</div>
              <div className="text-xs text-slate-600">Authenticated</div>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab('chat')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {isSidebarOpen && (
          <div className="hidden lg:block w-64 bg-slate-900 overflow-hidden">
            <ConversationSidebar />
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-2 px-4 py-3 border-b border-slate-200 bg-white">
            <button
              onClick={() => setCurrentTab('chat')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentTab === 'chat'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </button>
            <button
              onClick={() => setCurrentTab('plan')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentTab === 'plan'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Plan
            </button>
            <button
              onClick={() => setCurrentTab('inspector')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                currentTab === 'inspector'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Network className="w-4 h-4" />
              Network
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {currentTab === 'chat' && <ChatWindow />}
            {currentTab === 'plan' && selectedPlan && (
              <div className="overflow-y-auto p-6 max-w-4xl mx-auto w-full">
                <PlanTimeline plan={selectedPlan} steps={planSteps} />
              </div>
            )}
            {currentTab === 'inspector' && (
              <NodeInspector
                nodes={inspectorNodes}
                edges={inspectorEdges}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <ConversationProvider>
      <AppContent />
    </ConversationProvider>
  );
}

export default App;
