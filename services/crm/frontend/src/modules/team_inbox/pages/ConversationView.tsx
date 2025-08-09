import React, { useState, useEffect } from 'react';
import { Conversation, Contact } from '../types';
import { MessageBubble } from './MessageBubble';
import { ComposeMessage } from './ComposeMessage';
import { ConversationHeader } from './ConversationHeader';
import { InternalDiscussion } from './InternalDiscussion';

interface ConversationViewProps {
  conversation: Conversation | null;
  onContactSelect: (contact: Contact | null) => void;
  onReply: (emailData: any) => void; 
}

export function ConversationView({ conversation, onContactSelect, onReply }: ConversationViewProps) {
  const [activeTab, setActiveTab] = useState<'messages' | 'internal'>('messages');
  const [showCompose, setShowCompose] = useState(false);
  const [currentConversation, setCurrentConversation] = useState(conversation);


  const handleReply = (emailData: any) => {
    onReply(emailData);
    setShowCompose(false);
    setCurrentConversation(emailData.conversation);
  };


  useEffect(() => {
    setCurrentConversation(conversation);
    
  }, [conversation]);

  if (!currentConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-gray-400">📬</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
          <p className="text-gray-500">Select a conversation from the list to view messages</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <ConversationHeader
        conversation={currentConversation}
        onContactSelect={onContactSelect}
        onReply={() => setShowCompose(true)}
      />

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('messages')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'messages'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Messages ({currentConversation.messages.length})
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'internal'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Internal Discussion
          </button>
        </nav>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'messages' ? (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentConversation.messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
            </div>

            {showCompose && (
              <div className="border-t border-gray-200 p-4">
                <ComposeMessage
                  conversation={currentConversation}
                  onSend={(emailData) => handleReply(emailData)}
                  onCancel={() => setShowCompose(false)}
                />
              </div>
            )}
          </div>
        ) : (
          <InternalDiscussion conversation={currentConversation} />
        )}
      </div>
    </div>
  );
}