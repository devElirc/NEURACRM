// import React, { useState, useEffect } from 'react';
// import { useAuth } from '../../../auth/AuthProvider'
// import { ConversationList } from './ConversationList';
// import { ConversationView } from './ConversationView';
// import { ContactPanel } from './ContactPanel';
// import { EmailComposer } from './EmailComposer';
// import { Sidebar } from './Sidebar';
// import { SharedInboxManager } from './shared-inbox/SharedInboxManager';
// import { Conversation, Contact, Message, SharedInbox } from '../types';
// import { mockConversations, mockContacts, mockSharedInboxes } from '../data/mockData';
// import { Plus, RefreshCw, Settings, Filter } from 'lucide-react';

// interface EmailData {
//   to: string[];
//   cc: string[];
//   bcc: string[];
//   subject: string;
//   content: string;
//   htmlContent: string;
//   attachments: File[];
//   isReply: boolean;
//   threadId?: string;
// }


// export function InboxView() {
//   const { user, tenant } = useAuth();
//   const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
//   const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
//   const [showComposer, setShowComposer] = useState(false);
//   const [showSharedInboxManager, setShowSharedInboxManager] = useState(false);

//   const [sidebarFilter, setSidebarFilter] = useState('inbox');
//   const [conversations, setConversations] = useState<Conversation[]>(mockConversations);

//   const [sharedInboxes, setSharedInboxes] = useState<SharedInbox[]>(mockSharedInboxes);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Simulate real-time email sync
//   useEffect(() => {
//     const interval = setInterval(() => {
//       // Simulate receiving new emails
//       if (Math.random() > 0.8) {
//         const newMessage: Message = {
//           id: Date.now().toString(),
//           threadId: 'thread-' + Date.now(),
//           from: { email: 'customer@example.com', name: 'New Customer' },
//           to: [{ email: user?.email || '', name: user?.full_name }],
//           subject: 'New inquiry about your services',
//           content: 'Hi, I\'m interested in learning more about your services. Could you please provide more information?',
//           timestamp: new Date(),
//           isRead: false,
//           isStarred: false,
//           isDraft: false,
//           messageId: 'msg-' + Date.now(),
//           attachments: [],
//           internalNotes: [],
//           labels: [],
//           priority: 'normal',
//           source: 'incoming'
//         };

//         const newConversation: Conversation = {
//           id: Date.now().toString(),
//           threadId: newMessage.threadId,
//           subject: newMessage.subject,
//           messages: [newMessage],
//           participants: [newMessage.from, newMessage.to[0]],
//           tags: [],
//           status: 'open',
//           priority: 'normal',
//           lastActivity: new Date(),
//           lastMessage: newMessage,
//           channel: 'email',
//           // tenantId: tenant?.id || '',
//           isArchived: false,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         };

//         setConversations(prev => [newConversation, ...prev]);
//       }
//     }, 30000); // Check every 30 seconds

//     return () => clearInterval(interval);
//   }, [user, tenant]);

//   // Filter conversations based on sidebar selection
//   const filteredConversations = conversations.filter(conv => {
//     switch (sidebarFilter) {
//       case 'unassigned':
//         return !conv.assignedTo;
//       case 'assigned-to-me':
//         return conv.assignedTo === user?.full_name;
//       case 'snoozed':
//         return conv.snoozed;
//       case 'sent':
//         return conv.messages.some(msg => msg.from.email === user?.email);
//       case 'archived':
//         return conv.isArchived;
//       default:
//         return !conv.isArchived;
//     }
//   });

//   const handleSendEmail = async (emailData: EmailData) => {
//     const token = localStorage.getItem('auth_tokens');
//     let accessToken = '';

//     if (token) {
//       try {
//         const parsedToken = JSON.parse(token);
//         accessToken = parsedToken.access_token;
//       } catch (e) {
//         console.error("Failed to parse token from localStorage:", e);
//       }
//     }

//     if (!accessToken) {
//       console.error("No access token found. User might not be logged in.");
//       return;
//     }


//     try {
//       const newMessage: Message = {
//         id: Date.now().toString(),
//         threadId: emailData.threadId || 'thread-' + Date.now(),
//         from: { email: user?.email || '', name: user?.full_name },
//         to: emailData.to.map(email => ({ email, name: email.split('@')[0] })),
//         cc: emailData.cc.map(email => ({ email, name: email.split('@')[0] })),
//         bcc: emailData.bcc.map(email => ({ email, name: email.split('@')[0] })),
//         subject: emailData.subject,
//         content: emailData.content,
//         htmlContent: emailData.htmlContent,
//         timestamp: new Date(),
//         isRead: true,
//         isStarred: false,
//         isDraft: false,
//         messageId: 'msg-' + Date.now(),
//         attachments: [],  // You can update this if you want to keep track locally
//         internalNotes: [],
//         labels: [],
//         priority: 'normal',
//         source: 'outgoing'
//       };

//       // Prepare form data to send to backend
//       const formData = new FormData();
//       formData.append('to', JSON.stringify(emailData.to));
//       formData.append('cc', JSON.stringify(emailData.cc));
//       formData.append('bcc', JSON.stringify(emailData.bcc));
//       formData.append('subject', emailData.subject);
//       formData.append('plain_body', emailData.content);
//       formData.append('html_body', emailData.htmlContent);
//       formData.append('thread_id', emailData.threadId || '');

//       // Append attachments if any
//       emailData.attachments.forEach(file => {
//         formData.append('attachments', file);
//       });

//       // Send request to your Django backend
//       const response = await fetch('http://127.0.0.1:8000/api/inbox/messages/send_message/', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${accessToken}`,
//         },
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error(`Failed to send email: ${response.statusText}`);
//       }

//       // If backend call successful, update local state as before
//       if (emailData.isReply && emailData.threadId && selectedConversation) {
//         setConversations(prev =>
//           prev.map(conv =>
//             conv.threadId === emailData.threadId
//               ? {
//                 ...conv,
//                 messages: [...conv.messages, newMessage],
//                 lastMessage: newMessage,
//                 lastActivity: new Date(),
//                 updatedAt: new Date()
//               }
//               : conv
//           )
//         );
//       } else {
//         const newConversation: Conversation = {
//           id: Date.now().toString(),
//           threadId: newMessage.threadId,
//           subject: emailData.subject,
//           messages: [newMessage],
//           participants: [newMessage.from, ...newMessage.to],
//           tags: [],
//           status: 'open',
//           priority: 'normal',
//           lastActivity: new Date(),
//           lastMessage: newMessage,
//           channel: 'email',
//           // tenantId: tenant?.id || '',
//           isArchived: false,
//           createdAt: new Date(),
//           updatedAt: new Date()
//         };

//         setConversations(prev => [newConversation, ...prev]);
//       }

//       setShowComposer(false);
//     } catch (error) {
//       console.error('Failed to send email:', error);
//     }
//   };



//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     // Simulate API call to refresh emails
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     setIsRefreshing(false);
//   };

//   const handleCreateSharedInbox = (inboxData: Partial<SharedInbox>) => {
//     const newInbox: SharedInbox = {
//       ...inboxData as SharedInbox,
//       id: Date.now().toString(),
//       createdBy: user?.id || '',
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };

//     setSharedInboxes(prev => [...prev, newInbox]);
//   };

//   const sharedInboxesWithCounts = sharedInboxes.map(inbox => ({
//     id: inbox.id,
//     name: inbox.name,
//     unreadCount: conversations.filter(conv =>
//       conv.sharedInboxId === inbox.id &&
//       conv.messages.some(msg => !msg.isRead)
//     ).length
//   }));


//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
//       <Sidebar
//         activeFilter={sidebarFilter}
//         onFilterChange={setSidebarFilter}
//         currentView="inbox"
//         onViewChange={() => { }}
//         onCreateInbox={() => setShowSharedInboxManager(true)}
//         sharedInboxes={sharedInboxesWithCounts}

//       />

//       <div className="flex-1 flex overflow-hidden">
//         {/* Conversation List */}
//         <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors">
//           <div className="p-4 border-b border-gray-200 dark:border-gray-700">
//             <div className="flex items-center justify-between mb-3">
//               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
//                 {sidebarFilter.charAt(0).toUpperCase() + sidebarFilter.slice(1).replace('-', ' ')}
//               </h2>
//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={handleRefresh}
//                   disabled={isRefreshing}
//                   className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
//                   title="Refresh"
//                 >
//                   <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
//                 </button>
//                 <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" title="Filter">
//                   <Filter className="h-4 w-4" />
//                 </button>
//                 <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors" title="Settings">
//                   <Settings className="h-4 w-4" />
//                 </button>
//               </div>
//             </div>

//             <div className="flex items-center justify-between">
//               <div className="text-sm text-gray-500 dark:text-gray-400">
//                 {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
//               </div>
//               <button
//                 onClick={() => setShowComposer(true)}
//                 className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
//               >
//                 <Plus className="h-4 w-4 mr-1" />
//                 Compose
//               </button>
//             </div>

//             <div className="mt-3">
//               <input
//                 type="text"
//                 placeholder="Search conversations..."
//                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
//               />
//             </div>
//           </div>

//           <ConversationList
//             conversations={filteredConversations}
//             selectedConversation={selectedConversation}
//             onSelectConversation={setSelectedConversation}
//           />
//         </div>

//         {/* Main Content Area */}
//         <div className="flex-1 flex">
//           <ConversationView
//             conversation={selectedConversation}
//             onContactSelect={setSelectedContact}
//           />

//           {/* <ContactPanel
//             contact={selectedContact}
//           /> */}
//         </div>
//       </div>

//       {/* Email Composer Modal */}
//       {showComposer && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
//             <EmailComposer
//               onSend={handleSendEmail}
//               onCancel={() => setShowComposer(false)}
//             />
//           </div>
//         </div>
//       )}

//       {/* Shared Inbox Manager Modal */}
//       {showSharedInboxManager && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <SharedInboxManager
//             onClose={() => setShowSharedInboxManager(false)}
//             onCreateInbox={handleCreateSharedInbox}
//           />
//         </div>
//       )}

//     </div>
//   );

// }










import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../auth/AuthProvider';
import { ConversationList } from './ConversationList';
import { ConversationView } from './ConversationView';
import { ContactPanel } from './ContactPanel';
import { EmailComposer } from './EmailComposer';
import { Sidebar } from './Sidebar';
import { SharedInboxManager } from './shared-inbox/SharedInboxManager';
import { Conversation, Contact, Message, SharedInbox } from '../types';
import { mockConversations, mockContacts, mockSharedInboxes } from '../data/mockData';
import { Plus, RefreshCw, Settings, Filter } from 'lucide-react';

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
  const { user, tenant } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [showSharedInboxManager, setShowSharedInboxManager] = useState(false);

  const [sidebarFilter, setSidebarFilter] = useState('inbox');
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);

  const [sharedInboxes, setSharedInboxes] = useState<SharedInbox[]>(mockSharedInboxes);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // WebSocket reference
  const ws = useRef<WebSocket | null>(null);

  // WebSocket connection & message handling
  // useEffect(() => {
  //   console.log("tenant", tenant?.id);
  //   if (!tenant?.id) return;

  //   const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  //   const backendHost = "localhost:8000";
  //   // const wsUrl = `${protocol}://${window.location.host}/ws/inbox/${tenant.id}/`;
  //   const wsUrl = `${protocol}://${backendHost}/ws/inbox/?schema=${tenant?.id}`;

  //   ws.current = new WebSocket(wsUrl);

  //   ws.current.onopen = () => {
  //     console.log('WebSocket connected');
  //   };

  //   ws.current.onclose = () => {
  //     console.log('WebSocket disconnected');
  //   };

  //   ws.current.onerror = (error) => {
  //     console.error('WebSocket error', error);
  //   };

  //   ws.current.onmessage = (event) => {
  //     try {
  //       const data = JSON.parse(event.data);

  //       console.log('WebSocket new message:', data);

  //       // Build Message object
  //       const newMsg: Message = {
  //         id: data.id,
  //         threadId: data.threadId || data.id,
  //         from: { email: data.sender, name: data.sender },
  //         to: [{ email: user?.email || '', name: user?.full_name }],
  //         subject: data.subject,
  //         content: data.body,
  //         timestamp: new Date(),
  //         isRead: false,
  //         isStarred: false,
  //         isDraft: false,
  //         messageId: data.id,
  //         attachments: [],
  //         internalNotes: [],
  //         labels: [],
  //         priority: 'normal',
  //         source: 'incoming',
  //       };

  //       // Check if conversation exists
  //       const existingConv = conversations.find(conv => conv.threadId === newMsg.threadId);

  //       if (existingConv) {
  //         // Append to existing conversation
  //         setConversations(prev =>
  //           prev.map(conv =>
  //             conv.threadId === newMsg.threadId
  //               ? {
  //                 ...conv,
  //                 messages: [...conv.messages, newMsg],
  //                 lastMessage: newMsg,
  //                 lastActivity: new Date(),
  //                 updatedAt: new Date(),
  //               }
  //               : conv
  //           )
  //         );
  //       } else {
  //         // Add new conversation
  //         const newConversation: Conversation = {
  //           id: Date.now().toString(),
  //           threadId: newMsg.threadId,
  //           subject: newMsg.subject,
  //           messages: [newMsg],
  //           participants: [newMsg.from, ...newMsg.to],
  //           tags: [],
  //           status: 'open',
  //           priority: 'normal',
  //           lastActivity: new Date(),
  //           lastMessage: newMsg,
  //           channel: 'email',
  //           isArchived: false,
  //           createdAt: new Date(),
  //           updatedAt: new Date(),
  //         };

  //         setConversations(prev => [newConversation, ...prev]);
  //       }
  //     } catch (err) {
  //       console.error('Failed to parse WebSocket message:', err);
  //     }
  //   };

  //   return () => {
  //     ws.current?.close();
  //   };
  // }, [tenant?.id, user?.email, user?.full_name, conversations]);

useEffect(() => {
  console.log("tenant", tenant?.id);
  if (!tenant?.id) return;

  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const backendHost = "localhost:8000";
  // For testing: no tenant schema filtering for now
  const wsUrl = `${protocol}://${backendHost}/ws/inbox/`;

  // Initialize websocket
  ws.current = new WebSocket(wsUrl);

  // Connection opened
  ws.current.onopen = () => {
    console.log('✅ WebSocket connected:', wsUrl);
    // Send test message after connecting
    ws.current?.send(JSON.stringify({ message: "Hello from frontend!" }));
  };

  // Connection closed
  ws.current.onclose = (event) => {
    console.log(`❌ WebSocket disconnected (code: ${event.code})`);
  };

  // Error
  ws.current.onerror = (error) => {
    console.error('⚠️ WebSocket error:', error);
  };

  // Incoming message
  ws.current.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('📩 New WebSocket message:', data);
      // For testing, just alert or log
      alert(`New message: ${data.message}`);
    } catch (err) {
      console.error('❌ Failed to parse WebSocket message:', err, event.data);
    }
  };

  // Cleanup on unmount
  return () => {
    console.log('🔌 Closing WebSocket');
    ws.current?.close();
  };
}, [tenant?.id]);




  // Simulate real-time email sync (optional fallback)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const newMessage: Message = {
          id: Date.now().toString(),
          threadId: 'thread-' + Date.now(),
          from: { email: 'customer@example.com', name: 'New Customer' },
          to: [{ email: user?.email || '', name: user?.full_name }],
          subject: 'New inquiry about your services',
          content: 'Hi, I\'m interested in learning more about your services. Could you please provide more information?',
          timestamp: new Date(),
          isRead: false,
          isStarred: false,
          isDraft: false,
          messageId: 'msg-' + Date.now(),
          attachments: [],
          internalNotes: [],
          labels: [],
          priority: 'normal',
          source: 'incoming'
        };

        const newConversation: Conversation = {
          id: Date.now().toString(),
          threadId: newMessage.threadId,
          subject: newMessage.subject,
          messages: [newMessage],
          participants: [newMessage.from, newMessage.to[0]],
          tags: [],
          status: 'open',
          priority: 'normal',
          lastActivity: new Date(),
          lastMessage: newMessage,
          channel: 'email',
          isArchived: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        setConversations(prev => [newConversation, ...prev]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, tenant]);

  // Filter conversations based on sidebarFilter
  const filteredConversations = conversations.filter(conv => {
    switch (sidebarFilter) {
      case 'unassigned':
        return !conv.assignedTo;
      case 'assigned-to-me':
        return conv.assignedTo === user?.full_name;
      case 'snoozed':
        return conv.snoozed;
      case 'sent':
        return conv.messages.some(msg => msg.from.email === user?.email);
      case 'archived':
        return conv.isArchived;
      default:
        return !conv.isArchived;
    }
  });

  const handleSendEmail = async (emailData: EmailData) => {
    // ... your existing handleSendEmail implementation unchanged ...
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleCreateSharedInbox = (inboxData: Partial<SharedInbox>) => {
    // ... unchanged ...
  };

  const sharedInboxesWithCounts = sharedInboxes.map(inbox => ({
    id: inbox.id,
    name: inbox.name,
    unreadCount: conversations.filter(conv =>
      conv.sharedInboxId === inbox.id &&
      conv.messages.some(msg => !msg.isRead)
    ).length
  }));

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
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
