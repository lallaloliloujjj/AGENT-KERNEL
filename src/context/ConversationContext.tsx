import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Conversation, Message, Plan } from '../types';

interface ConversationContextType {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  selectedPlan: Plan | null;
  streamingMessage: Partial<Message> | null;

  setCurrentConversation: (conversation: Conversation | null) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setStreamingMessage: (message: Partial<Message> | null) => void;
  setSelectedPlan: (plan: Plan | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  createConversation: (title: string) => void;
  archiveConversation: (conversationId: string) => void;
  clearMessages: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<Partial<Message> | null>(null);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
    );
  }, []);

  const createConversation = useCallback((title: string) => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      user_id: '', // Will be set by auth context
      title,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      archived: false,
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    setMessages([]);
  }, []);

  const archiveConversation = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId ? { ...conv, archived: true } : conv
      )
    );
    if (currentConversation?.id === conversationId) {
      setCurrentConversation(null);
      setMessages([]);
    }
  }, [currentConversation]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value: ConversationContextType = {
    conversations,
    currentConversation,
    messages,
    isLoading,
    error,
    selectedPlan,
    streamingMessage,
    setCurrentConversation,
    addMessage,
    updateMessage,
    setStreamingMessage,
    setSelectedPlan,
    setLoading: setIsLoading,
    setError,
    createConversation,
    archiveConversation,
    clearMessages,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within ConversationProvider');
  }
  return context;
};
