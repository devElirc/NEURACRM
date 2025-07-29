import React, { useState } from 'react';
import { Message } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { 
  Paperclip, 
  Download, 
  Reply, 
  Forward, 
  MoreVertical,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);

  const isIncoming = !message.from.includes('@yourcompany.com');

  return (
    <div 
      className={`group relative ${isIncoming ? 'ml-0 mr-12' : 'ml-12 mr-0'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex ${isIncoming ? 'flex-row' : 'flex-row-reverse'} items-start space-x-3`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
          isIncoming ? 'bg-gray-500' : 'bg-blue-500'
        }`}>
          {message.from.charAt(0).toUpperCase()}
        </div>

        <div className={`flex-1 min-w-0 ${isIncoming ? 'ml-3' : 'mr-3'}`}>
          <div className={`bg-white border rounded-lg shadow-sm p-4 ${
            isIncoming ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="font-medium text-gray-900">{message.from}</span>
                <span className="text-sm text-gray-500 ml-2">
                  to {message.to.join(', ')}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatDateTime(message.timestamp)}
              </span>
            </div>

            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 mb-0 whitespace-pre-wrap">{message.content}</p>
            </div>

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="space-y-2">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-md">
                      <Paperclip className="h-4 w-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{attachment.size}</p>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {message.internalNotes && message.internalNotes.length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => setShowInternalNotes(!showInternalNotes)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <MessageSquare className="h-3 w-3" />
                <span>{message.internalNotes.length} internal note{message.internalNotes.length !== 1 ? 's' : ''}</span>
              </button>
              
              {showInternalNotes && (
                <div className="mt-2 space-y-2">
                  {message.internalNotes.map((note) => (
                    <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{note.author}</span>
                        <span className="text-xs text-gray-500">{formatDateTime(note.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {showActions && (
            <div className={`absolute top-2 ${isIncoming ? 'right-2' : 'left-2'} flex items-center space-x-1 bg-white shadow-md rounded-md border`}>
              <button className="p-1 hover:bg-gray-50 transition-colors">
                <Reply className="h-3 w-3 text-gray-500" />
              </button>
              <button className="p-1 hover:bg-gray-50 transition-colors">
                <Forward className="h-3 w-3 text-gray-500" />
              </button>
              <button className="p-1 hover:bg-gray-50 transition-colors">
                <MessageSquare className="h-3 w-3 text-gray-500" />
              </button>
              <button className="p-1 hover:bg-gray-50 transition-colors">
                <ExternalLink className="h-3 w-3 text-gray-500" />
              </button>
              <button className="p-1 hover:bg-gray-50 transition-colors">
                <MoreVertical className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}