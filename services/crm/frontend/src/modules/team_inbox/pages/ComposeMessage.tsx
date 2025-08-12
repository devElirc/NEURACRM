import React, { useState } from 'react';
import { Conversation } from '../types';
import { Send, Paperclip, Image, Smile, AtSign, X } from 'lucide-react';
import { useAuth } from '../../../auth/AuthProvider';

interface ComposeMessageProps {
  conversation: Conversation;
  onSend: (emailData: any) => void;
  onCancel: () => void;
}

export function ComposeMessage({ conversation, onSend, onCancel }: ComposeMessageProps) {
  const [message, setMessage] = useState('');
  const [to, setTo] = useState(
    conversation.participants.map(p => p.email).join(', ')
  );

  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const { user, tokens, tenant } = useAuth();
  const [isSending, setIsSending] = useState(false);



  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);

    try {
      const threadId = conversation.threadId; // reply stays in same thread

      const payload = {
        threadId,
        // from_: { email: user?.email || '', name: `${user?.full_name}` },
        from_: { email: 'devhiroshi77@gmail.com', name: "hiroshi" },
        to: to.split(',').map(email => ({
          email: email.trim(),
          name: email.trim().split('@')[0],
        })),
        cc: cc
          ? cc.split(',').map(email => ({
            email: email.trim(),
            name: email.trim().split('@')[0],
          }))
          : [],
        bcc: bcc
          ? bcc.split(',').map(email => ({
            email: email.trim(),
            name: email.trim().split('@')[0],
          }))
          : [],
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

      const res = await fetch('http://localhost:8000/api/inbox/messages/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(await res.json());
        return;
      }

      const data = await res.json(); // Expecting backend to return { message, conversation }

      // Clear the input and close composer
      setMessage('');
      onSend(data);

    } catch (error) {
      console.error('Failed to send reply:', error);
    }
    finally {
      setIsSending(false);
    }
  };


  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Reply</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {showCcBcc && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CC</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BCC</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        {!showCcBcc && (
          <button
            onClick={() => setShowCcBcc(true)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Add CC/BCC
          </button>
        )}

        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Paperclip className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Image className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Smile className="h-4 w-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <AtSign className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}