import React, { useState } from 'react';
import { Conversation } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { Send, AtSign, Presentation as Mention } from 'lucide-react';

interface InternalDiscussionProps {
  conversation: Conversation;
}

export function InternalDiscussion({ conversation }: InternalDiscussionProps) {
  const [newNote, setNewNote] = useState('');

  // Mock internal notes data
  const internalNotes = [
    {
      id: '1',
      author: 'Sarah Johnson',
      content: 'This customer has been having issues with their billing. I\'ve escalated to the billing team.',
      timestamp: new Date('2024-01-15T10:30:00'),
      mentions: ['@billing-team'],
    },
    {
      id: '2',
      author: 'Mike Chen',
      content: '@sarah Thanks for the escalation. I\'ll take a look at their account and get back to them by EOD.',
      timestamp: new Date('2024-01-15T11:15:00'),
      mentions: ['@sarah'],
    },
    {
      id: '3',
      author: 'Sarah Johnson',
      content: 'Customer confirmed the billing issue is resolved. Marking as closed.',
      timestamp: new Date('2024-01-15T16:45:00'),
      mentions: [],
    },
  ];

  const handleSendNote = () => {
    if (newNote.trim()) {
      // Here you would typically send the note to your backend
      console.log('Sending internal note:', newNote);
      setNewNote('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {internalNotes.map((note) => (
          <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {note.author.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <span className="font-medium text-gray-900">{note.author}</span>
              </div>
              <span className="text-xs text-gray-500">{formatDateTime(note.timestamp)}</span>
            </div>
            
            <p className="text-gray-700 leading-relaxed">{note.content}</p>
            
            {note.mentions.length > 0 && (
              <div className="mt-2 flex items-center space-x-1">
                <Mention className="h-3 w-3 text-blue-500" />
                <div className="flex flex-wrap gap-1">
                  {note.mentions.map((mention, index) => (
                    <span key={index} className="text-xs text-blue-600 bg-blue-100 px-1 rounded">
                      {mention}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {internalNotes.length === 0 && (
          <div className="text-center py-12">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mention className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No internal discussion yet</h3>
            <p className="text-gray-500">Start a private conversation with your team about this case.</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add an internal note... Use @username to mention teammates"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          <button
            onClick={handleSendNote}
            disabled={!newNote.trim()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </button>
        </div>
        
        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <AtSign className="h-3 w-3" />
            <span>Mention teammates</span>
          </div>
          <span>Only visible to your team</span>
        </div>
      </div>
    </div>
  );
}