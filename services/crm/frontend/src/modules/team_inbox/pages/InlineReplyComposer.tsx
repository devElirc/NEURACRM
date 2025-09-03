import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { useAuth } from '../../../auth/AuthProvider';
import { 
  Send, 
  Paperclip, 
  Smile, 
  X,
  Bold,
  Italic,
  Link,
  Code
} from 'lucide-react';
import { Button } from './ui/Button';

interface InlineReplyComposerProps {
  onSend: (content: string) => void;
  onSendReplyAll?: (content: string) => void;
  onCancel: () => void;
  replyTo?: Message;
  placeholder?: string;
  showReplyAllButton?: boolean;
}

export function InlineReplyComposer({ 
  onSend, 
  onSendReplyAll, 
  onCancel, 
  replyTo, 
  placeholder = "Write your reply...",
  showReplyAllButton = false 
}: InlineReplyComposerProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSend = async () => {
    if (!content.trim()) return;

    setIsSending(true);
    try {
      onSend(content);
      setContent('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReplyAll = async () => {
    if (!content.trim() || !onSendReplyAll) return;

    setIsSending(true);
    try {
      onSendReplyAll(content);
      setContent('');
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send reply all:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-white">
              {(user?.full_name || user?.email || '').charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {replyTo ? `Replying to ${replyTo.from.name || replyTo.from.email}` : 'New message'}
          </span>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <div className="flex items-center space-x-1">
          <button className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <Bold className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <Italic className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <Link className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <Code className="w-4 h-4" />
          </button>
          <div className="h-4 border-l border-gray-300 dark:border-gray-600 mx-1"></div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <Smile className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex items-center space-x-2">
                  <Paperclip className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900 dark:text-white">{file.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-0 py-0 border-0 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-0 bg-transparent text-gray-900 dark:text-white resize-none min-h-[80px] max-h-48"
          rows={3}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Press Cmd+Enter to send
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          {showReplyAllButton && onSendReplyAll && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleSendReplyAll}
              disabled={!content.trim() || isSending}
              isLoading={isSending}
            >
              <Send className="w-4 h-4 mr-2" />
              Reply All
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={handleSend}
            disabled={!content.trim() || isSending}
            isLoading={isSending}
          >
            <Send className="w-4 h-4 mr-2" />
            {showReplyAllButton ? 'Reply' : 'Send Reply'}
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}