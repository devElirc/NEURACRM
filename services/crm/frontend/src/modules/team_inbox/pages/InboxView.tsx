import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../../auth/AuthProvider';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import { EmailComposer } from './EmailComposer';
import TeammatesPage from './teammate/TeammatesPage';
import { Sidebar } from './Sidebar';
import { SharedInboxManager } from './shared-inbox/SharedInboxManager';
import { Conversation, Contact, SharedInbox } from '../types';
import { Teammate } from '../types/teammate';

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
  // const [sharedInboxes, setSharedInboxes] = useState<SharedInbox[]>(mockSharedInboxes);
  const [sharedInboxes, setSharedInboxes] = useState<SharedInbox[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [teammember, setTeammember] = useState<Teammate[]>([]);

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

        // --- Handle new conversation ---
        if (data.type === 'new_conversation' && data.message?.conversation) {
          const conv = data.message.conversation;

          setConversations((prev) => {
            const exists = prev.find((c) => c.id === conv.id);
            if (exists) return prev;

            toast.success(`🆕 New conversation: ${conv.subject}`, { duration: 5000 });
            return [conv, ...prev];
          });

          // --- Handle new message ---
        } else if (data.type === 'new_message' && data.message?.message && data.message?.conversation) {
          const msg = data.message.message;

          handleReplys(data);

          toast.success(`✉️ New message from ${msg.from?.email || 'someone'}`, { duration: 5000 });

        } 
      } catch (err) {
        console.error('❌ Failed to parse WebSocket message:', err, event.data);
      }
    };

    return () => {
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
              Authorization: `Bearer ${tokens?.access_token}`,
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



  useEffect(() => {
    if (!tenant?.id || !tokens) return;

    const fetchInboxes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/inbox/inboxes/sharedinbox/`, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Failed to fetch inboxes');
        const data = await res.json();

        // Convert string dates to Date objects if needed
        const inboxes: SharedInbox[] = data.map((inbox: any) => ({
          ...inbox,
          createdAt: new Date(inbox.createdAt),
          updatedAt: new Date(inbox.updatedAt),
        }));

        setSharedInboxes(inboxes);
      } catch (err) {
        console.error('❌ Failed to fetch inboxes', err);
        setSharedInboxes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInboxes();
  }, [tenant, tokens]);



    useEffect(() => {
      if (!tenant?.id || !tokens) return;
  
      const fetchTeammates = async () => {
        setLoading(true);
        try {
          console.log("Fetching teammates for tenant:", tenant.id);
          const res = await fetch(`http://localhost:8000/api/inbox/teammates/?tenant_id=${tenant.id}`, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "Content-Type": "application/json",
            },
          });
  
          if (!res.ok) {
            console.error("Failed response:", res.status, res.statusText);
            throw new Error("Failed to fetch teammates");
          }
  
          const data = await res.json().catch(err => {
            console.error("Failed to parse JSON:", err);
            return [];
          });
  
          const formatted: Teammate[] = (data.results || []).map((item: any) => ({
            id: item.id,
            firstName: item.firstName || "",
            lastName: item.lastName || "",
            fullName: item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim(),
            email: item.email,
            role: item.role as 'Admin' | 'Agent' | 'Viewer',
            avatar: item.avatar || "https://placehold.co/64x64",
            status: item.status || "Inactive",  // backend already sends "Active"/"Inactive"
            lastSeen: item.lastSeen || "Offline",
            joinedDate: item.joinedDate || "",
            teamInboxes: item.teamInboxes || [],
          }));
  
  
          setTeammember(formatted);
        } catch (err) {
          console.error("❌ Failed to fetch teammates", err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchTeammates();
    }, [tenant, tokens]);
  
  

  const menuCounts = useMemo(() => {
    return {
      inbox: conversations.filter((c) => !c.isArchived).length,
      "teammates": teammember.length,
      unassigned: conversations.filter((c) => !c.assignedTo).length,
      "assigned-to-me": conversations.filter(
        (c) => c.assignedTo === user?.full_name
      ).length,
      snoozed: conversations.filter((c) => c.snoozed).length,
      sent: conversations.filter((c) =>
        c.messages.some((m) => m.from.email === user?.email)
      ).length,
      archived: conversations.filter((c) => c.isArchived).length,
    };
  }, [conversations, user?.email, user?.full_name]);


  

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
      const threadId = emailData.threadId || uuidv4();

      const payload = {
        threadId,
        // from_: { email: user?.email || '', name: `${user?.full_name}` },
        from_: { email: 'devhiroshi77@gmail.com', name: `${user?.full_name}` },
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
          Authorization: `Bearer ${tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error(await res.json());
        return;
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


  const handleReplys = (data: any) => {

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
        onViewChange={() => {}}
        onCreateInbox={() => setShowSharedInboxManager(true)}
        sharedInboxes={sharedInboxesWithCounts}
        menuCounts={menuCounts}
      />

      {/*  Only show TeammatesPage when filter is "Teammates" */}
      {sidebarFilter === 'teammates' ? (
        <TeammatesPage
          sharedInboxes={sharedInboxes}
          teammember={teammember}
        />
      ) : (
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


          
        {/* Main Content Area */}
        <div className="flex-1 flex">
          <ConversationView
            conversation={selectedConversation}
            onContactSelect={setSelectedContact}
            onSendEmail={handleSendEmail}
            onUpdateConversation={(updatedConversation) => {
              setConversations(prev => 
                prev.map(conv => 
                  conv.id === updatedConversation.id ? updatedConversation : conv
                )
              );
              setSelectedConversation(updatedConversation);
            }}
          />
        </div>
        </div>
      )}

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
            sharedInboxes={sharedInboxes}
          />
        </div>
      )}
    </div>
  );

}
