import React from 'react';
import { formatDistanceToNow } from '../utils/dateUtils';
import { Conversation } from '../types';
import { Paperclip, User, Clock, AlertTriangle } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({ 
  conversations, 
  selectedConversation, 
  onSelectConversation 
}: ConversationListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return '📧';
      case 'chat': return '💬';
      case 'social': return '🔗';
      case 'phone': return '📞';
      default: return '📧';
    }
  };

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <div className="text-sm text-gray-500">{conversations.length} total</div>
        </div>
        
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const isSelected = selectedConversation?.id === conversation.id;
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          const hasAttachments = lastMessage?.attachments && lastMessage.attachments.length > 0;
          const hasUnreadMessages = conversation.messages.some(msg => !msg.isRead);

          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="text-lg">{getChannelIcon(conversation.channel)}</span>
                  {conversation.priority !== 'low' && (
                    <AlertTriangle className={`h-4 w-4 ${getPriorityColor(conversation.priority)}`} />
                  )}
                  <h3 className={`text-sm font-medium truncate ${
                    hasUnreadMessages ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {conversation.subject}
                  </h3>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  {conversation.snoozed && <Clock className="h-3 w-3 text-orange-500" />}
                  {hasAttachments && <Paperclip className="h-3 w-3 text-gray-400" />}
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {conversation.assignedTo ? (
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{conversation.assignedTo}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-orange-500">Unassigned</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(conversation.lastActivity)}
                </span>
              </div>

              {lastMessage && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {lastMessage.content.substring(0, 120)}...
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {conversation.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag.id}
                      className={`inline-block px-2 py-1 text-xs rounded-full text-white`}
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {conversation.tags.length > 2 && (
                    <span className="text-xs text-gray-500">+{conversation.tags.length - 2}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    conversation.status === 'open' ? 'bg-green-400' :
                    conversation.status === 'pending' ? 'bg-yellow-400' : 'bg-gray-400'
                  }`} />
                  {hasUnreadMessages && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}