import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthProvider';
import { Conversation, Contact, Message, Comment } from '../types';
import { MessageItem } from './MessageItem';
import { EmailComposer } from './EmailComposer';
import {
  User,
  Mail,
  Phone,
  Building,
  Tag,
  Clock,
  UserCheck,
  Archive,
  Trash2,
  MoreHorizontal,
  Star,
  ChevronRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/Button';

interface ConversationViewProps {
  conversation: Conversation | null;
  onContactSelect?: (contact: Contact) => void;
  onSendEmail: (emailData: any) => void;
}

export function ConversationView({
  conversation,
  onContactSelect,
  onSendEmail
}: ConversationViewProps) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Comment[]>([]);
  const [showForwardComposer, setShowForwardComposer] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const { user, tokens, tenant } = useAuth();

  useEffect(() => {
  if (!conversation) return;

  const fetchAllComments = async () => {
    try {
      const allComments: Comment[] = [];

      for (const message of conversation.messages) {
        const res = await fetch(
          `http://localhost:8000/api/inbox/comments/?message=${message.id}`,
          {
            headers: {
              Authorization: `Bearer ${tokens?.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!res.ok) {
          console.error('❌ Failed to fetch comments for message', message.id);
          continue;
        }

        const data = await res.json();

        // Map backend response to frontend Comment interface
        const mappedComments: Comment[] = (data.results || []).map(c => ({
          id: c.id,
          messageId: c.message,
          author: {
            id: c.user.id,
            name: c.user.full_name,
            email: c.user.email,
            avatar: c.user.avatar || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop&crop=face'
          },
          content: c.content,
          timestamp: new Date(c.created_at),
          attachments: [],
          mentions: [],
          isInternal: true,
        }));

        allComments.push(...mappedComments);
      }

      setComments(allComments);
    } catch (error) {
      console.error('💥 Error fetching comments:', error);
    }
  };

  fetchAllComments();
}, [conversation, tokens]);


  const handleToggleExpansion = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const handleReply = (messageId: string, content: string) => {
    const replyData = {
      to: [conversation!.lastMessage.from.email],
      cc: [],
      bcc: [],
      subject: `Re: ${conversation!.subject}`,
      content,
      htmlContent: content,
      attachments: [],
      isReply: true,
      threadId: conversation!.threadId,
      sharedInboxId: conversation!.sharedInboxId
    };

    onSendEmail(replyData);
  };

  const handleForward = (message: Message) => {
    setForwardMessage(message);
    setShowForwardComposer(true);
  };

  const handleSendForward = (emailData: any) => {
    if (!forwardMessage) return;

    const forwardContent = `
---------- Forwarded message ----------
From: ${forwardMessage.from.name} <${forwardMessage.from.email}>
Date: ${forwardMessage.timestamp.toLocaleString()}
Subject: ${forwardMessage.subject}
To: ${forwardMessage.to.map(t => `${t.name} <${t.email}>`).join(', ')}

${forwardMessage.content}
    `;

    const forwardData = {
      ...emailData,
      subject: `Fwd: ${forwardMessage.subject}`,
      content: `${emailData.content}\n\n${forwardContent}`,
      htmlContent: `${emailData.htmlContent}<br><br>${forwardContent.replace(/\n/g, '<br>')}`
    };

    onSendEmail(forwardData);
    setShowForwardComposer(false);
    setForwardMessage(null);
  };

  const handleAddComment = async (
    messageId: string,
    content: string,
    attachments?: File[],
    mentions?: string[]
  ) => {
    try {
      const tempComment: Comment = {
        id: `temp-${Date.now()}`,
        messageId,
        author: {
          id: user?.id,
          name: user?.full_name,
          email: user?.email,
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop&crop=face'
        },
        content,
        timestamp: new Date(),
        attachments: attachments?.map(file => ({
          id: `temp-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file)
        })) || [],
        mentions: mentions || [],
        isInternal: true
      };

      setComments(prev => [...prev, tempComment]);

      const res = await fetch("http://localhost:8000/api/inbox/comments/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageId, content })
      });

      if (!res.ok) {
        const errorData = await res.json();
        setComments(prev => prev.filter(c => c.id !== tempComment.id));
        throw new Error(errorData?.detail || "Failed to add comment");
      }

      const data = await res.json();
      setComments(prev => prev.map(c => c.id === tempComment.id ? { ...c, ...data } : c));
      return data;

    } catch (error) {
      console.error("💥 Failed to add comment:", error);
      throw error;
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 transition-colors">
        <div className="text-center">
          <Mail className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No conversation selected
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Choose a conversation from the list to view messages
          </p>
        </div>
      </div>
    );
  }

  const lastMessageIndex = conversation.messages.length - 1;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 transition-colors">
      {/* Header */}

      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                {(conversation.lastMessage.from.name || conversation.lastMessage.from.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {conversation.subject}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <span>
                  {conversation.participants.map(p => p.name || p.email).join(', ')}
                </span>
                <span>•</span>
                <span>{conversation.messages.length} message{conversation.messages.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${conversation.status === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
              conversation.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
              }`}>
              {conversation.status}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${conversation.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
              conversation.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                conversation.priority === 'low' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
              }`}>
              {conversation.priority}
            </span>
            {conversation.assignedTo && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                <UserCheck className="w-3 h-3 mr-1" />
                {conversation.assignedTo}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button size="sm">
              <UserCheck className="w-4 h-4 mr-2" />
              Assign
            </Button>
            <Button variant="outline" size="sm">
              <Tag className="w-4 h-4 mr-2" />
              Tag
            </Button>
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Snooze
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Star className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Archive className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversation.messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isExpanded={expandedMessages.has(message.id)}
            isLastMessage={index === lastMessageIndex}
            onToggleExpansion={handleToggleExpansion}
            onReply={handleReply}
            onForward={handleForward}
            onAddComment={handleAddComment}
            comments={comments.filter(c => c.messageId === message.id)} // ✅ only comments for this message
          />
        ))}
      </div>

      {/* Forward Composer Modal */}
      {showForwardComposer && forwardMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <EmailComposer
              onSend={handleSendForward}
              onCancel={() => {
                setShowForwardComposer(false);
                setForwardMessage(null);
              }}
              forwardMessage={forwardMessage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
