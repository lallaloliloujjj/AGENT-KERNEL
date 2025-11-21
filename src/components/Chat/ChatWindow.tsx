import React, { useEffect, useRef, useState } from 'react';
import { useConversation } from '../../context/ConversationContext';
import { ChatBubble } from './ChatBubble';
import { MessageComposer } from './MessageComposer';
import type { Message } from '../../types';
import { messageAPI, streamChatResponse } from '../../services/api';

export const ChatWindow: React.FC = () => {
  const {
    currentConversation,
    messages,
    isLoading,
    streamingMessage,
    addMessage,
    updateMessage,
    setStreamingMessage,
    setLoading,
    setError,
  } = useConversation();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const handleSendMessage = async (content: string) => {
    if (!currentConversation) return;

    try {
      setLoading(true);
      setError(null);

      const userMessage = await messageAPI.createMessage(
        currentConversation.id,
        'user',
        content
      );
      addMessage(userMessage);

      setIsStreaming(true);
      let assistantContent = '';
      let assistantMessage: Message | null = null;

      try {
        for await (const chunk of streamChatResponse(
          currentConversation.id,
          [...messages, userMessage]
        )) {
          assistantContent += chunk;

          if (!assistantMessage) {
            assistantMessage = await messageAPI.createMessage(
              currentConversation.id,
              'assistant',
              assistantContent
            );
            addMessage(assistantMessage);
            setStreamingMessage({
              id: assistantMessage.id,
              content: assistantContent,
              state: 'streaming',
            });
          } else {
            setStreamingMessage({
              id: assistantMessage.id,
              content: assistantContent,
              state: 'streaming',
            });
            await updateMessage(assistantMessage.id, {
              content: assistantContent,
            });
          }
        }

        if (assistantMessage) {
          await updateMessage(assistantMessage.id, {
            state: 'done',
            content: assistantContent,
          });
        }
      } finally {
        setIsStreaming(false);
        setStreamingMessage(null);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to send message'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mb-4 text-slate-600">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No Conversation Selected
          </h3>
          <p className="text-slate-600">
            Start a new conversation or select an existing one from the sidebar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              {currentConversation.title}
            </h1>
            {currentConversation.description && (
              <p className="text-slate-600 mt-1">
                {currentConversation.description}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                isStreaming={isStreaming && message.id === streamingMessage?.id}
              />
            ))}

            {streamingMessage && (
              <ChatBubble
                message={{
                  id: streamingMessage.id || 'temp',
                  conversation_id: currentConversation.id,
                  role: 'assistant',
                  content: streamingMessage.content || '',
                  state: streamingMessage.state as Message['state'],
                  metadata: {},
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }}
                isStreaming={true}
              />
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <MessageComposer
            onSend={handleSendMessage}
            isLoading={isLoading || isStreaming}
            disabled={!currentConversation}
          />
        </div>
      </div>
    </div>
  );
};
