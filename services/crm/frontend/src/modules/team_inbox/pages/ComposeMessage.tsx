import React, { useState } from 'react';
import { Conversation } from '../types';
import { Send, Paperclip, Image, Smile, AtSign, X, Sparkles, RefreshCw, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useAuth } from '../../../auth/AuthProvider';
import { getApiBaseUrl } from '../../../utils/tenant'

interface ComposeMessageProps {
  conversation: Conversation;
  onSend: (emailData: any) => void;
  onCancel: () => void;
}

export function ComposeMessage({ conversation, onSend, onCancel }: ComposeMessageProps) {
  const [message, setMessage] = useState('');
  const [to, setTo] = useState(conversation.participants.map(p => p.email).join(', '));
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const { user, tokens } = useAuth();
  const [isSending, setIsSending] = useState(false);

  // AI reply state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiReply, setAiReply] = useState<string>('');

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);

    try {
      const threadId = conversation.threadId;

      const payload = {
        threadId,
        from_: { email: user?.email || 'devhiroshi77@gmail.com', name: user?.full_name || "hiroshi" },
        to: to.split(',').map(email => ({ email: email.trim(), name: email.trim().split('@')[0] })),
        cc: cc ? cc.split(',').map(email => ({ email: email.trim(), name: email.trim().split('@')[0] })) : [],
        bcc: bcc ? bcc.split(',').map(email => ({ email: email.trim(), name: email.trim().split('@')[0] })) : [],
        subject: conversation.subject || '(No Subject)',
        content: message,
        htmlContent: `<p>${message}</p>`,
        timestamp: new Date().toISOString(),
        isRead: true,
        isStarred: false,
        isDraft: false,
        messageId: 'msg-' + Date.now(),
        references: [],
        priority: 'normal',
        source: 'outgoing',
      };

      const res = await fetch(`${getApiBaseUrl()}/api/inbox/messages/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(await res.json());
        return;
      }

      const data = await res.json();
      setMessage('');
      setAiReply('');
      onSend(data);

    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSending(false);
    }
  };

const handleGenerateAIReply = async () => {
  if (!conversation?.id) return;

  setIsGeneratingAI(true);

  try {
    // Call backend AI endpoint
    const res = await fetch(`${getApiBaseUrl()}/api/inbox/ai-reply/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_id: conversation.id,
        settings: { tone: 'professional', length: 'medium' },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('AI reply error:', err);
      return;
    }

    const data = await res.json();

    // Auto-fill compose box
    setAiReply(data.content);
    setMessage(data.content);

  } catch (error) {
    console.error('Failed to generate AI reply:', error);
  } finally {
    setIsGeneratingAI(false);
  }
};


  const handleCopyAIReply = () => {
    navigator.clipboard.writeText(aiReply);
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Reply</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input type="text" value={to} onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
        </div>

        {showCcBcc && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
              <input type="text" value={cc} onChange={(e) => setCc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BCC</label>
              <input type="text" value={bcc} onChange={(e) => setBcc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500" />
            </div>
          </>
        )}

        {!showCcBcc && (
          <button onClick={() => setShowCcBcc(true)} className="text-sm text-blue-600 hover:text-blue-800">
            Add CC/BCC
          </button>
        )}

        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="absolute bottom-2 right-2 flex space-x-2">
            <button
              onClick={handleGenerateAIReply}
              disabled={isGeneratingAI}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isGeneratingAI ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isGeneratingAI ? 'Generating...' : 'AI Reply'}</span>
            </button>
          </div>
        </div>

        {/* AI Preview */}
        {aiReply && (
          <div className="border border-purple-200 rounded-lg p-3 bg-purple-50">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-purple-900">AI Suggested Reply</span>
              </div>
              <div className="flex space-x-2">
                <button onClick={handleCopyAIReply} className="p-1 hover:bg-purple-200 rounded" title="Copy">
                  <Copy className="w-4 h-4 text-purple-600" />
                </button>
                <button onClick={() => setAiReply('')} className="p-1 hover:bg-purple-200 rounded" title="Dismiss">
                  <X className="w-4 h-4 text-purple-600" />
                </button>
              </div>
            </div>
            <p className="text-gray-900 whitespace-pre-wrap">{aiReply}</p>
            <div className="flex items-center space-x-2 mt-2">
              <button className="flex items-center text-xs text-purple-600 hover:text-purple-800">
                <ThumbsUp className="w-3 h-3 mr-1" /> Good
              </button>
              <button className="flex items-center text-xs text-purple-600 hover:text-purple-800">
                <ThumbsDown className="w-3 h-3 mr-1" /> Needs Work
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 hover:text-gray-600"><Paperclip className="h-4 w-4" /></button>
          <button className="p-2 text-gray-400 hover:text-gray-600"><Image className="h-4 w-4" /></button>
          <button className="p-2 text-gray-400 hover:text-gray-600"><Smile className="h-4 w-4" /></button>
          <button className="p-2 text-gray-400 hover:text-gray-600"><AtSign className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center space-x-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSend} disabled={!message.trim() || isSending}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {isSending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
