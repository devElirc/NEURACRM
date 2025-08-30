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
  Clock,
  AlertCircle,
  Sparkles,
  Brain,
  MessageSquare,
  Eye,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  X
} from 'lucide-react';
import { Button } from './ui/Button';

interface AIReplyPanelProps {
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

export function AIReplyPanel({ message, onSendReply, onClose }: AIReplyPanelProps) {
  const { user } = useAuth();
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
    generateAIReply();
  }, [message.id]);

  const generateAIReply = async () => {
    setAiReply(prev => ({ ...prev, status: 'generating' }));

    // Simulate AI generation with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Generate contextual reply based on conversation
    const currentMessage = message;
    let generatedContent = '';

    if (currentMessage.content.toLowerCase().includes('password') || currentMessage.content.toLowerCase().includes('login')) {
      generatedContent = `Hi ${currentMessage.from.name || 'there'},

Thank you for reaching out about your account access issue. I understand how frustrating login problems can be, and I'm here to help you resolve this quickly.

I've sent a password reset link to your registered email address. Please check your inbox (and spam folder) for an email from us with the subject "Reset Your Password".

Here are the steps to reset your password:
1. Click the reset link in the email
2. Create a new strong password
3. Try logging in with your new credentials

If you don't receive the email within 10 minutes or continue to experience issues, please let me know and I'll escalate this to our technical team for immediate assistance.

Best regards,
${user?.full_name}
Support Team`;
    } else if (currentMessage.content.toLowerCase().includes('pricing') || currentMessage.content.toLowerCase().includes('cost')) {
      generatedContent = `Hello ${currentMessage.from.name || 'there'},

Thank you for your interest in our services! I'd be happy to provide you with detailed pricing information.

Based on your inquiry, I believe our Professional plan would be a great fit for your needs. Here's what's included:

• All core features with advanced analytics
• Priority customer support
• Custom integrations available
• 99.9% uptime guarantee

I'd love to schedule a brief 15-minute call to understand your specific requirements and provide you with a customized quote. This way, I can ensure you get the best value for your investment.

Would you be available for a quick call this week? I have openings on Tuesday and Thursday afternoon.

Looking forward to helping you get started!

Best regards,
${user?.full_name}
Sales Team`;
    } else {
      generatedContent = `Hi ${currentMessage.from.name || 'there'},

Thank you for reaching out to us. I've received your message and I'm here to help.

I understand your concern and I want to make sure we address this properly. Let me look into this for you and get back to you with a comprehensive solution.

In the meantime, if you have any urgent questions or need immediate assistance, please don't hesitate to reach out to me directly.

I'll follow up with you within the next 24 hours with an update.

Best regards,
${user?.full_name}
Customer Success Team`;
    }

    setAiReply({
      status: 'ready',
      content: generatedContent,
      confidence: Math.floor(Math.random() * 15) + 85, // 85-99%
      tokens: Math.floor(generatedContent.length / 4), // Rough token estimate
      model: 'GPT-4',
      tone: 'Professional',
      generatedAt: new Date()
    });
  };

  const handleApprove = () => {
    const finalContent = isEditing ? editContent : aiReply.content;
    setAiReply(prev => ({ ...prev, status: 'approved' }));
    
    // Send the reply
    setTimeout(() => {
      onSendReply(finalContent);
      setAiReply(prev => ({ ...prev, status: 'sent' }));
    }, 500);
  };

  const handleReject = () => {
    setAiReply(prev => ({ ...prev, status: 'rejected' }));
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(aiReply.content);
  };

  const handleSaveEdit = () => {
    setAiReply(prev => ({ ...prev, content: editContent, status: 'ready' }));
    setIsEditing(false);
  };

  const handleRegenerate = () => {
    generateAIReply();
  };

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
            <span className="font-medium text-gray-900 dark:text-white">
              {getStatusText()}
            </span>
          </div>
          {aiReply.status === 'ready' && (
            <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Brain className="w-3 h-3" />
                <span>{aiReply.model}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>{aiReply.tone}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>{aiReply.confidence}% confidence</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="w-3 h-3" />
                <span>{aiReply.tokens} tokens</span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
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
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Analyzing conversation context...
              </span>
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
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  />
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-gray-900 dark:text-white">
                    {aiReply.content}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {aiReply.status === 'ready' && !isEditing && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerate}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900/20"
                  >
                    <ThumbsDown className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button size="sm" onClick={handleApprove}>
                    <Send className="w-4 h-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            )}

            {aiReply.status === 'approved' && (
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Sending reply...</span>
                </div>
              </div>
            )}

            {aiReply.status === 'sent' && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Reply sent successfully</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {aiReply.generatedAt && `Sent ${new Date().toLocaleTimeString()}`}
                </span>
              </div>
            )}

            {aiReply.status === 'rejected' && (
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Reply rejected</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRegenerate}
                  className="text-blue-600 dark:text-blue-400"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {aiReply.status === 'ready' && (
        <div className="px-4 pb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">AI Reply Guidelines</p>
                <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                  <li>• Review the response for accuracy and tone</li>
                  <li>• Edit if needed to match your brand voice</li>
                  <li>• Ensure all customer questions are addressed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}