import React, { useState, useRef } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  ImageIcon,
  Loader2,
  X,
} from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'audio';
  size: number;
}

interface MessageComposerProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSend,
  isLoading = false,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || attachments.length > 0) {
      onSend(message, attachments.length > 0 ? attachments : undefined);
      setMessage('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isLoading && !disabled) {
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(
        textareaRef.current.scrollHeight,
        200
      ) + 'px';
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const type = file.type.startsWith('image/')
          ? 'image'
          : file.type.startsWith('audio/')
            ? 'audio'
            : 'file';

        setAttachments((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type,
            size: file.size,
          },
        ]);
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      // Record audio logic would go here
      setTimeout(() => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      }, 5000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="space-y-3">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2"
              >
                {att.type === 'image' && (
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                )}
                {att.type === 'audio' && (
                  <Mic className="w-4 h-4 text-green-600" />
                )}
                {att.type === 'file' && (
                  <Paperclip className="w-4 h-4 text-amber-600" />
                )}
                <div className="flex-1 text-sm">
                  <div className="font-medium text-slate-900">{att.name}</div>
                  <div className="text-xs text-slate-600">
                    {formatFileSize(att.size)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 hover:bg-slate-200 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 px-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5 text-slate-600" />
          </button>

          <button
            type="button"
            onClick={startRecording}
            disabled={disabled || isLoading || isRecording}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-red-100 hover:bg-red-200'
                : 'hover:bg-slate-200'
            }`}
            title="Record audio"
          >
            <Mic
              className={`w-5 h-5 ${
                isRecording ? 'text-red-600 animate-pulse' : 'text-slate-600'
              }`}
            />
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={disabled || isLoading}
            placeholder="Message the AI agent... (Ctrl+Enter to send)"
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-48 disabled:bg-slate-100 disabled:text-slate-500"
            rows={1}
          />

          <button
            type="submit"
            disabled={disabled || isLoading || (!message.trim() && attachments.length === 0)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            title="Send message (Ctrl+Enter)"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileAttach}
        className="hidden"
        accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
      />
    </form>
  );
};
