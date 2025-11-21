import React, { useEffect, useState } from 'react';
import {
  Copy,
  RotateCcw,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import type { Message } from '../../types';

interface ChatBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  onDelete?: () => void;
  isStreaming?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  onRegenerate,
  onDelete,
  isStreaming = false,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      console.error('Failed to copy message');
    }
  };

  const getStateIcon = () => {
    switch (message.state) {
      case 'streaming':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'tool_call':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'done':
        return <Check className="w-4 h-4 text-green-500" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-gray-400" />;
    }
  };

  return (
    <div
      className={`flex w-full mb-4 ${
        isAssistant ? 'justify-start' : 'justify-end'
      } animate-in fade-in slide-in-from-bottom-4 duration-300`}
    >
      <div
        className={`flex gap-3 max-w-2xl ${
          isAssistant ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        <div
          className={`flex-1 rounded-lg px-4 py-3 ${
            isAssistant
              ? 'bg-slate-100 text-slate-900'
              : 'bg-blue-600 text-white'
          } shadow-sm`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
          {message.error && (
            <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
              {message.error}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-start gap-2">
          {getStateIcon()}
          {isAssistant && !isStreaming && (
            <div className="flex gap-1">
              <button
                onClick={copyToClipboard}
                className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                title="Copy"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-600" />
                )}
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                  title="Regenerate"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-1.5 hover:bg-red-100 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
