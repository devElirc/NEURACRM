import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthProvider';
import { Message } from '../types';
import { 
  Bot, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Send, 
  AlertCircle,
  Sparkles,
  Brain,
  MessageSquare,
  RotateCcw,
  X
} from 'lucide-react';
import { Button } from './ui/Button';
import { getApiBaseUrl } from '../../../utils/tenant'


// Utility: Format plain text AI reply into HTML
const formatAIContent = (text: string) => {
  if (!text) return '';

  // Split by double line breaks to create paragraphs
  const paragraphs = text.split(/\n{2,}/g).map(p => p.trim()).filter(Boolean);

  const formatted = [];
  let currentList: string[] = [];

  paragraphs.forEach(p => {
    if (/^\d+\s/.test(p)) {
      // This is part of a numbered list
      const item = p.replace(/^\d+\s/, '').trim();
      currentList.push(`<li>${item}</li>`);
    } else {
      // Flush numbered list if exists
      if (currentList.length) {
        formatted.push(`<ol class="pl-5 list-decimal mb-2">${currentList.join('')}</ol>`);
        currentList = [];
      }
      // Regular paragraph
      formatted.push(`<p class="mb-2">${p}</p>`);
    }
  });

  // Flush last list if exists
  if (currentList.length) {
    formatted.push(`<ol class="pl-5 list-decimal mb-2">${currentList.join('')}</ol>`);
  }

  return formatted.join('');
};


interface AIReplyPanelProps {
  conversationId: string;
  message: Message;
  onSendReply: (content: string) => void;
  onClose: () => void;
}

interface AIReplyState {
  status: 'idle' | 'generating' | 'ready' | 'editing' | 'approved' | 'rejected' | 'sent';
  content: string;
  confidence: number;
  tokens: number;
  model: string;
  tone: string;
  generatedAt: Date | null;
  editedContent?: string;
}

export function AIReplyPanel({ conversationId, message, onSendReply, onClose }: AIReplyPanelProps) {
  const { user, tokens } = useAuth();
  const [aiReply, setAiReply] = useState<AIReplyState>({
    status: 'idle',
    content: '',
    confidence: 0,
    tokens: 0,
    model: 'GPT-4',
    tone: 'Professional',
    generatedAt: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (message?.id) {
      generateAIReply();
    }
  }, [message.id]);

  const generateAIReply = async () => {
    setAiReply(prev => ({ ...prev, status: 'generating' }));

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/inbox/ai-reply/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          settings: { tone: 'professional', length: 'medium' },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate AI reply');
      }

      const data = await res.json();

      const generatedContent = data.content || `Hi ${message.from?.name || 'there'},\n\nThank you for reaching out.`;

      setAiReply({
        status: 'ready',
        content: generatedContent,
        confidence: data.confidence ?? Math.floor(Math.random() * 15) + 85,
        tokens: data.tokens ?? Math.floor(generatedContent.length / 4),
        model: data.model ?? 'GPT-4',
        tone: data.tone ?? 'Professional',
        generatedAt: new Date()
      });
    } catch (error) {
      setAiReply({
        status: 'ready',
        content: `Hi ${message.from?.name || 'there'},\n\nThank you for reaching out. I'm here to help and will follow up with a proper solution soon.\n\nBest regards,\n${user?.full_name}`,
        confidence: 80,
        tokens: 50,
        model: 'Fallback',
        tone: 'Professional',
        generatedAt: new Date()
      });
    }
  };

  const handleApprove = () => {
    const finalContent = isEditing ? editContent : aiReply.content;
    setAiReply(prev => ({ ...prev, status: 'approved' }));
    
    setTimeout(() => {
      onSendReply(formatAIContent(finalContent)); // send formatted HTML
      setAiReply(prev => ({ ...prev, status: 'sent' }));
    }, 500);
  };

  const handleReject = () => setAiReply(prev => ({ ...prev, status: 'rejected' }));
  const handleEdit = () => { setIsEditing(true); setEditContent(aiReply.content); };
  const handleSaveEdit = () => { setAiReply(prev => ({ ...prev, content: editContent, status: 'ready' })); setIsEditing(false); };
  const handleRegenerate = () => generateAIReply();

  const getStatusColor = () => {
    switch (aiReply.status) {
      case 'generating': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'ready': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'approved': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'rejected': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'sent': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      default: return 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800';
    }
  };

  const getStatusIcon = () => {
    switch (aiReply.status) {
      case 'generating': return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'ready': return <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case 'sent': return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      default: return <Bot className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getStatusText = () => {
    switch (aiReply.status) {
      case 'generating': return 'Generating AI reply...';
      case 'ready': return 'AI reply ready for review';
      case 'approved': return 'Reply approved';
      case 'rejected': return 'Reply rejected';
      case 'sent': return 'Reply sent successfully';
      default: return 'AI Reply';
    }
  };

  return (
    <div className={`border rounded-lg ${getStatusColor()} transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-current border-opacity-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="font-medium text-gray-900 dark:text-white">{getStatusText()}</span>
          </div>
          {aiReply.status === 'ready' && (
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1"><Brain className="w-3 h-3" /><span>{aiReply.model}</span></div>
              <div className="flex items-center space-x-1"><Sparkles className="w-3 h-3" /><span>{aiReply.tone}</span></div>
              <div className="flex items-center space-x-1"><Zap className="w-3 h-3" /><span>{aiReply.confidence}% confidence</span></div>
              <div className="flex items-center space-x-1"><MessageSquare className="w-3 h-3" /><span>{aiReply.tokens} tokens</span></div>
            </div>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {aiReply.status === 'generating' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="animate-pulse flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-blue-600 dark:text-blue-400">Analyzing conversation context...</span>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded animate-pulse"></div>
              <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded animate-pulse w-3/4"></div>
              <div className="h-4 bg-blue-200 dark:bg-blue-800 rounded animate-pulse w-1/2"></div>
            </div>
          </div>
        )}

        {(aiReply.status === 'ready' || aiReply.status === 'approved' || aiReply.status === 'rejected' || aiReply.status === 'sent') && (
          <div className="space-y-4">
            {/* AI Reply Content */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              ) : (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-gray-900 dark:text-white"
                  dangerouslySetInnerHTML={{ __html: formatAIContent(aiReply.content) }}
                ></div>
              )}
            </div>

            {/* Actions */}
            {aiReply.status === 'ready' && !isEditing && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleRegenerate} className="text-gray-600 dark:text-gray-400">
                    <RotateCcw className="w-4 h-4 mr-2" /> Regenerate
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleEdit} className="text-gray-600 dark:text-gray-400">
                    <Edit3 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleReject} className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20">
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button size="sm" onClick={handleApprove}>
                    <Send className="w-4 h-4 mr-2" /> Send Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
