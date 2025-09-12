import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from "uuid";
import { useAuth } from '../../../auth/AuthProvider';
import { Conversation, Contact, Message, Comment, Attachment, EmailAddress } from '../types';
import { MessageItem } from './MessageItem';
import { Teammate } from '../types/teammate';
import { EmailComposer } from './EmailComposer';
import { InlineReplyComposer } from './InlineReplyComposer';
import { getApiBaseUrl } from '../../../utils/tenant'

import {
  Mail,
  Tag,
  Clock,
  UserCheck,
  Archive,
  Trash2,
  MoreHorizontal,
  Star,
  Send,
  Plus,
  ChevronDown
} from 'lucide-react';
import { Button } from './ui/Button';

interface ConversationViewProps {
  conversation: Conversation | null;
  onContactSelect?: (contact: Contact) => void;
  onSendEmail: (emailData: any) => void;
  onUpdateConversation: (conversation: Conversation) => void;
  teammates: Teammate[];
}

export function ConversationView({
  conversation,
  onContactSelect,
  onSendEmail,
  onUpdateConversation,
  teammates
}: ConversationViewProps) {
  const { user, tokens } = useAuth();
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Comment[]>([]);
  const [showNewMessageComposer, setShowNewMessageComposer] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  const [showForwardComposer, setShowForwardComposer] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch comments for all messages
  useEffect(() => {
    if (!conversation) return;

// Define the shape of your backend response for comments
interface CommentResponse {
  id: string;
  message: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  created_at: string;
  attachments?: {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    isInline?: boolean;
  }[];
  mentions?: string[];
}

const fetchAllComments = async () => {
  try {
    const allComments: Comment[] = [];

    for (const message of conversation.messages) {
      const res = await fetch(
        `${getApiBaseUrl()}/api/inbox/comments/?message=${message.id}`,
        {
          headers: {
            Authorization: `Bearer ${tokens?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        console.error("❌ Failed to fetch comments for message", message.id);
        continue;
      }

      const data = await res.json();

      // Map backend response → frontend Comment[]
      const mappedComments: Comment[] = (data.results as CommentResponse[] || []).map(
        (c) => ({
          id: c.id,
          messageId: c.message,
          author: {
            id: c.user.id,
            name: c.user.full_name,
            email: c.user.email,
            avatar:
              c.user.avatar ||
              "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop&crop=face",
          },
          content: c.content,
          timestamp: new Date(c.created_at), // string → Date
          attachments: (c.attachments || []).map((a) => ({
            id: a.id,
            name: a.name,
            size: a.size,
            type: a.type,
            url: a.url,
            isInline: a.isInline ?? false, // fallback
          })),
          mentions: c.mentions || [],
          isInternal: true, // Adjust if backend differentiates
        })
      );

      allComments.push(...mappedComments);
    }

    setComments(allComments);
  } catch (error) {
    console.error("❌ Error fetching comments:", error);
  }
};


    fetchAllComments();
  }, [conversation, tokens]);



  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAssignDropdown(false);
      }
    }

    if (showAssignDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAssignDropdown]);


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

const handleReply = async (
  messageId: string,
  content: string,
  isReplyAll: boolean = false
) => {
  const message = conversation.messages.find(m => m.id === messageId);
  if (!message) {
    return;
  }

  // ✅ Ensure currentUser has a valid email string
  if (!user?.email) {
    console.error("❌ Cannot reply: current user has no email address.");
    return;
  }

  const currentUser: EmailAddress = {
    email: user.email,
    name: user.full_name ?? user.email.split("@")[0],
  };

  // Build recipients
  let toRecipients = isReplyAll
    ? [message.from, ...message.to, ...(message.cc || [])]
    : [message.from];

  // Remove duplicates + current user
  const unique = (list: typeof toRecipients) =>
    list.filter(
      (r, i, arr) =>
        r.email !== currentUser.email &&
        arr.findIndex(x => x.email === r.email) === i
    );

  toRecipients = unique(toRecipients);

  let ccRecipients = isReplyAll
    ? message.to.filter(t => t.email !== currentUser.email)
    : [];
  ccRecipients = unique(ccRecipients);

  const newMessage: Message = {
    id: uuidv4(),
    threadId: conversation.threadId || uuidv4(),
    messageId: "msg-" + Date.now(),
    from: currentUser,
    to: toRecipients,
    cc: ccRecipients,
    subject: `Re: ${conversation.subject}`,
    content,
    timestamp: new Date(),
    isRead: true,
    isStarred: false,
    isDraft: false,
    attachments: [],
    comments: [],
    labels: [],
    priority: "normal",
    source: "outgoing",
    inReplyTo: messageId,
  };

  const updatedConversation = {
    ...conversation,
    messages: [...conversation.messages, newMessage],
    lastMessage: newMessage,
    lastActivity: new Date(),
    updatedAt: new Date(),
  };

  // Optimistically update UI immediately
  onUpdateConversation(updatedConversation);

  // Build payload for API
  const payload = {
    threadId: newMessage.threadId,
    from_: currentUser,
    to: toRecipients.map(t => ({
      email: t.email,
      name: t.name || t.email.split("@")[0],
    })),
    cc: ccRecipients.map(t => ({
      email: t.email,
      name: t.name || t.email.split("@")[0],
    })),
    bcc: [],
    subject: newMessage.subject,
    content,
    htmlContent: content,
    timestamp: newMessage.timestamp.toISOString(),
    isRead: true,
    isStarred: false,
    isDraft: false,
    messageId: newMessage.messageId,
    references: [message.messageId],
    priority: "normal",
    source: "outgoing",
    in_reply_to: messageId,
  };

  try {
    const res = await fetch(`${getApiBaseUrl()}/api/inbox/messages/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokens?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("❌ Failed to send reply:", err);
    } else {
      const data = await res.json();
      if (data?.conversation) {
        onUpdateConversation(data.conversation);
      }
    }
  } catch (err) {
    console.error("🚨 Network error while sending reply:", err);
  }
};


  const handleNewMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      threadId: conversation.threadId,
      messageId: 'msg-' + Date.now(),
      from: { email: 'user@company.com', name: 'Current User' },
      to: conversation.participants.filter(p => p.email !== 'user@company.com'),
      subject: conversation.subject,
      content,
      timestamp: new Date(),
      isRead: true,
      isStarred: false,
      isDraft: false,
      attachments: [],
      comments: [],
      labels: [],
      priority: 'normal',
      source: 'outgoing'
    };

    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, newMessage],
      lastMessage: newMessage,
      lastActivity: new Date(),
      updatedAt: new Date()
    };

    onUpdateConversation(updatedConversation);
    setShowNewMessageComposer(false);
  };

  const handleForward = (message: Message) => {

    console.log("message:", message);
    setForwardMessage(message);
    setShowForwardComposer(true);
  };

  const handleSendForward = (emailData: any) => {
    if (forwardMessage) {
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
        htmlContent: `${emailData.htmlContent}<br><br>${forwardContent.replace(/\n/g, '<br>')}`,
        attachments: forwardMessage.attachments || []
      };

      onSendEmail(forwardData);
      setShowForwardComposer(false);
      setForwardMessage(null);
    }
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
        id: user?.id ?? `unknown-${Date.now()}`,
        name: user?.full_name ?? 'Unknown User',
        email: user?.email ?? 'unknown@example.com',
        avatar:
          // user?.avatar ??
          'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=32&h=32&fit=crop&crop=face',
      },
      content,
      timestamp: new Date(),
      attachments:
        attachments?.map((file) => ({
          id: `temp-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          isInline: false, // ✅ required by Attachment
        })) || [],
      mentions: mentions || [],
      isInternal: true,
    };

    setComments((prev) => [...prev, tempComment]);

    const res = await fetch('${getApiBaseUrl()}/api/inbox/comments/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: messageId,
        content,
        mentions,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      throw new Error(errorData?.detail || 'Failed to add comment');
    }

    const data = await res.json();
    setComments((prev) =>
      prev.map((c) => (c.id === tempComment.id ? { ...c, ...data } : c))
    );
    return data;
  } catch (error) {
    console.error('💥 Failed to add comment:', error);
    throw error;
  }
};



  const handleAssign = async (memberId: string) => {
    if (!conversation) return;
    setIsAssigning(true);

    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/inbox/conversations/${conversation.id}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.access_token}`
          },
          body: JSON.stringify({ assigned_to: memberId })
        }
      );
      if (!res.ok) throw new Error("Failed to assign");
      const updated = await res.json();
      onUpdateConversation(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setShowAssignDropdown(false);
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!conversation) return;
    setIsAssigning(true);

    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/inbox/conversations/${conversation.id}/`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.access_token}`
          },
          body: JSON.stringify({ assigned_to: null })
        }
      );
      if (!res.ok) throw new Error("Failed to unassign");
      const updated = await res.json();
      onUpdateConversation(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setShowAssignDropdown(false);
      setIsAssigning(false);
    }
  };


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
            <div className="relative" ref={dropdownRef}>
              <Button
                size="sm"
                variant={conversation.assignedTo ? "outline" : "primary"}
                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                disabled={isAssigning}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {conversation.assignedTo ? `Assigned to ${conversation.assignedTo}` : "Assign"}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>

              {showAssignDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                      Assign to team member
                    </div>
                    {teammates.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => handleAssign(member.fullName)}
                        disabled={isAssigning}
                        className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      >
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.fullName}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              {member.fullName.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {member.fullName}
                          </div>
                        </div>
                        {conversation.assignedTo === member.fullName && (
                          // <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    ))}
                    {conversation.assignedTo && (
                      <>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                        <button
                          onClick={handleUnassign}
                          disabled={isAssigning}
                          className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors text-red-600 dark:text-red-400"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span className="text-sm">Unassign</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Tag className="w-4 h-4 mr-2" />
              Tag
            </Button>
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Snooze
            </Button>
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNewMessageComposer(!showNewMessageComposer)}
            >
              <Send className="w-4 h-4 mr-2" />
              New Message
            </Button> */}
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
            conversationId={conversation.id}
            message={message}
            conversationMessages={conversation.messages}
            isExpanded={expandedMessages.has(message.id)}
            isLastMessage={index === conversation.messages.length - 1}
            onToggleExpansion={handleToggleExpansion}
            onReply={handleReply}
            onForward={handleForward}
            onAddComment={handleAddComment}
            comments={comments}
            onSendEmail={onSendEmail}
            teammates={teammates}
          />
        ))}


        {/* New Message Composer */}
        {showNewMessageComposer && (
          <div className="mt-4">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
              <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    New message in this conversation
                  </span>
                </div>
              </div>
              <div className="p-3">
                <InlineReplyComposer
                  onSend={handleNewMessage}
                  onCancel={() => setShowNewMessageComposer(false)}
                  placeholder="Send a new message in this conversation..."
                />
              </div>
            </div>
          </div>
        )}
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