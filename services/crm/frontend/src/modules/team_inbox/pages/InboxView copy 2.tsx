import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../../auth/AuthProvider';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import { ContactPanel } from './ContactPanel';
import { EmailComposer } from './EmailComposer';
import { Sidebar } from './Sidebar';
import { SharedInboxManager } from './shared-inbox/SharedInboxManager';
import { Conversation, Contact, Message, SharedInbox } from '../types';
import { mockSharedInboxes } from '../data/mockData';
import toast, { Toaster } from 'react-hot-toast';

import { Plus, RefreshCw, Settings, Filter } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';


interface EmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  content: string;
  htmlContent: string;
  attachments: File[];
  isReply: boolean;
  threadId?: string;
}

export function InboxView() {
  const { user, tokens, tenant } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showSharedInboxManager, setShowSharedInboxManager] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState('inbox');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sharedInboxes, setSharedInboxes] = useState<SharedInbox[]>(mockSharedInboxes);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const ws = useRef<WebSocket | null>(null);
  const hasConnected = useRef(false);

  useEffect(() => {
    if (!tenant?.id) return;
    if (hasConnected.current) return;

    hasConnected.current = true;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const backendHost = 'localhost:8000';
    const wsUrl = `${protocol}://${backendHost}/ws/inbox/?tenant=${tenant.id}`;

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('✅ WebSocket connected:', wsUrl);
      setTimeout(() => {
        ws.current?.send(JSON.stringify({ message: 'Hello from frontend!' }));
      }, 100);
    };

    ws.current.onclose = (event) => {
      console.warn(`❌ WebSocket disconnected (code: ${event.code})`);
    };

    ws.current.onerror = (error) => {
      console.error('⚠️ WebSocket error:', error);
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 New WebSocket message:', data);

        if (data.type === 'new_conversation' && data.message?.conversation) {
          const conv = data.message.conversation;

          setConversations((prev) => {
            const exists = prev.find((c) => c.id === conv.id);
            if (exists) return prev;

            toast.success(`🆕 New conversation: ${conv.subject}`, { duration: 5000 });
            return [conv, ...prev];
          });
        } else if (data.type === 'new_message' && data.message) {
          const msg = data.message;

          // Update this conversation in the UI
          setConversations(prev =>
            prev.map(conv =>
              conv.threadId === data.message.threadId
                ? {
                  ...conv,
                  messages: [...conv.messages, data.message],
                  lastMessage: data.message,
                  lastActivity: new Date(data.message.timestamp),
                  updatedAt: new Date(data.message.timestamp),
                }
                : conv
            )
          );

          setConversations((prev) => {
            const updated = prev.map((conv) => {
              if (conv.id === msg.conversationId) {
                const alreadyExists = conv.messages?.some((m) => m.id === msg.id);
                if (alreadyExists) return conv;

                return {
                  ...conv,
                  messages: [...(conv.messages || []), msg],
                  lastMessage: msg,
                  lastActivity: new Date(msg.timestamp),
                };
              }
              return conv;
            });

            toast(`✉️ New message from ${msg.from?.email || 'someone'}`, { duration: 5000 });
            return updated;
          });
        } else {
          console.log('ℹ️ Unhandled message type:', data.type);
        }
      } catch (err) {
        console.error('❌ Failed to parse WebSocket message:', err, event.data);
      }
    };

    return () => {
      console.log('🔌 Closing WebSocket connection');
      ws.current?.close();
      hasConnected.current = false; // allow reconnect on tenant change
    };
  }, [tenant?.id]);

  useEffect(() => {
    if (!tenant?.id || !tokens) return;

    async function fetchConversations() {
      try {
        const res = await fetch(
          `http://localhost:8000/api/inbox/conversations/?tenantId=${tenant.id}`,
          {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!res.ok) throw new Error('Failed to fetch conversations');
        const data = await res.json();
        setConversations(Array.isArray(data.results) ? data.results : []);
      } catch (err) {
        console.error(err);
        setConversations([]);
      }
    }

    fetchConversations();
  }, [tenant, tokens]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      switch (sidebarFilter) {
        case 'unassigned':
          return !conv.assignedTo;
        case 'assigned-to-me':
          return conv.assignedTo === user?.full_name;
        case 'snoozed':
          return conv.snoozed;
        case 'sent':
          return conv.messages.some((msg) => msg.from.email === user?.email);
        case 'archived':
          return conv.isArchived;
        default:
          return !conv.isArchived;
      }
    });
  }, [conversations, sidebarFilter, user?.email, user?.full_name]);


  const handleSendEmail = async (emailData: EmailData) => {
    try {
      const isNewConversation = !emailData.threadId;
      const threadId = emailData.threadId || uuidv4();

      const payload = {
        threadId,
        from_: { email: user?.email || '', name: `${user?.full_name}` },
        to: emailData.to.map(email => ({ email, name: email.split('@')[0] })),
        cc: emailData.cc.map(email => ({ email, name: email.split('@')[0] })),
        bcc: emailData.bcc.map(email => ({ email, name: email.split('@')[0] })),
        subject: emailData.subject,
        content: emailData.content,
        htmlContent: emailData.htmlContent,
        timestamp: new Date().toISOString(),
        isRead: true,
        isStarred: false,
        isDraft: false,
        messageId: 'msg-' + Date.now(),
        references: [],
        priority: 'normal',
        source: 'outgoing'
      };


      const res = await fetch('http://localhost:8000/api/inbox/messages/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error(await res.json());
        return;
      }

      const data = await res.json(); // Expecting backend to return { message, conversation }

      console.log('Message + conversation from backend:', data);

      if (isNewConversation) {
        // Backend should return the full conversation here
        setConversations(prev => [data.conversation, ...prev]);
      } else {
        // Append message to existing conversation
        setConversations(prev =>
          prev.map(conv =>
            conv.threadId === threadId
              ? {
                ...conv,
                messages: [...conv.messages, data.message],
                lastMessage: data.message,
                lastActivity: new Date(data.message.timestamp),
                updatedAt: new Date(data.message.timestamp)
              }
              : conv
          )
        );
      }

      setShowComposer(false);
    } catch (error) {
      console.error('Failed to send email:', error);
    }
  };



  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };


  const handleReply = (data: any) => {

    // Update this conversation in the UI
    setConversations(prev =>
      prev.map(conv =>
        conv.threadId === data.message.threadId
          ? {
            ...conv,
            messages: [...conv.messages, data.message],
            lastMessage: data.message,
            lastActivity: new Date(data.message.timestamp),
            updatedAt: new Date(data.message.timestamp),
          }
          : conv
      )
    );
  };

  const handleCreateSharedInbox = (inboxData: Partial<SharedInbox>) => {
    // Add shared inbox creation logic here
  };

  const sharedInboxesWithCounts = useMemo(() => {
    return sharedInboxes.map((inbox) => ({
      id: inbox.id,
      name: inbox.name,
      unreadCount: conversations.filter(
        (conv) =>
          conv.sharedInboxId === inbox.id &&
          conv.messages.some((msg) => !msg.isRead)
      ).length,
    }));
  }, [sharedInboxes, conversations]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Toaster position="top-right" />
      <Sidebar
        activeFilter={sidebarFilter}
        onFilterChange={setSidebarFilter}
        currentView="inbox"
        onViewChange={() => { }}
        onCreateInbox={() => setShowSharedInboxManager(true)}
        sharedInboxes={sharedInboxesWithCounts}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {sidebarFilter.charAt(0).toUpperCase() + sidebarFilter.slice(1).replace('-', ' ')}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" title="Filter">
                  <Filter className="h-4 w-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" title="Settings">
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
              </div>
              <button
                onClick={() => setShowComposer(true)}
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Compose
              </button>
            </div>

            <div className="mt-3">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
          </div>

          <ConversationList
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        </div>

        <div className="flex-1 flex">
          <ConversationView
            conversation={selectedConversation}
            onContactSelect={setSelectedContact}
            onReply={(emailData) => handleReply(emailData)}


          />
          {/* <ContactPanel contact={selectedContact} /> */}
        </div>
      </div>

      {showComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <EmailComposer
              onSend={handleSendEmail}
              onCancel={() => setShowComposer(false)}
            />
          </div>
        </div>
      )}

      {showSharedInboxManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <SharedInboxManager
            onClose={() => setShowSharedInboxManager(false)}
            onCreateInbox={handleCreateSharedInbox}
          />
        </div>
      )}
    </div>
  );
}
