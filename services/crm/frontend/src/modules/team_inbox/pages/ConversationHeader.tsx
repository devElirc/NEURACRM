import React from 'react';
import { Conversation, Contact } from '../types';
import { 
  Reply, 
  Forward, 
  Archive, 
  Trash2, 
  Clock, 
  UserCheck, 
  Tag, 
  MoreHorizontal,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ConversationHeaderProps {
  conversation: Conversation;
  onContactSelect: (contact: Contact | null) => void;
  onReply: () => void;
}

export function ConversationHeader({ conversation, onContactSelect, onReply }: ConversationHeaderProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-semibold text-gray-900">{conversation.subject}</h1>
            {conversation.priority !== 'low' && (
              <AlertTriangle className={`h-5 w-5 ${getPriorityColor(conversation.priority)}`} />
            )}
            {getStatusIcon(conversation.status)}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onReply}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </button>
            
            <div className="flex items-center border border-gray-300 rounded-md">
              <button className="p-2 hover:bg-gray-50 transition-colors">
                <Forward className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-50 transition-colors border-l border-gray-300">
                <Archive className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-50 transition-colors border-l border-gray-300">
                <Trash2 className="h-4 w-4 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-50 transition-colors border-l border-gray-300">
                <Clock className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <button className="p-2 hover:bg-gray-50 border border-gray-300 rounded-md transition-colors">
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {conversation.assignedTo ? `Assigned to ${conversation.assignedTo}` : 'Unassigned'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {conversation.participants.length} participant{conversation.participants.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex flex-wrap gap-1">
              {conversation.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            
            <button className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              <Tag className="h-3 w-3 mr-1" />
              Add tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}