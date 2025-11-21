import React, { useEffect, useState } from 'react';
import {
  Plus,
  MessageCircle,
  Archive,
  Trash2,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useConversation } from '../../context/ConversationContext';
import { conversationAPI } from '../../services/api';
import type { Conversation } from '../../types';

export const ConversationSidebar: React.FC = () => {
  const {
    conversations,
    currentConversation,
    setCurrentConversation,
    createConversation,
    archiveConversation,
  } = useConversation();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newConvTitle, setNewConvTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConvTitle.trim()) return;

    try {
      setIsLoading(true);
      await conversationAPI.createConversation(newConvTitle);
      createConversation(newConvTitle);
      setNewConvTitle('');
      setIsCreatingNew(false);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation);
  };

  const handleArchiveConversation = async (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();
    try {
      await conversationAPI.archiveConversation(id);
      archiveConversation(id);
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <button
          onClick={() => setIsCreatingNew(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {isCreatingNew && (
        <div className="p-4 border-b border-slate-800">
          <form onSubmit={handleCreateNew} className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={newConvTitle}
              onChange={(e) => setNewConvTitle(e.target.value)}
              placeholder="Chat title..."
              className="flex-1 px-3 py-2 bg-slate-800 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !newConvTitle.trim()}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              Create
            </button>
          </form>
          <button
            onClick={() => {
              setIsCreatingNew(false);
              setNewConvTitle('');
            }}
            className="mt-2 text-xs text-slate-400 hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="p-3 border-b border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800 rounded text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-slate-400">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center justify-between group ${
                  currentConversation?.id === conv.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{conv.title}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) =>
                      handleArchiveConversation(e, conv.id)
                    }
                    className="p-1 hover:bg-slate-700 rounded"
                    title="Archive"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </button>
            ))
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="mb-2">Agent Kernel v1.0</div>
        <div className="space-y-1">
          <a href="#" className="block hover:text-slate-300">
            Documentation
          </a>
          <a href="#" className="block hover:text-slate-300">
            Settings
          </a>
        </div>
      </div>
    </aside>
  );
};
