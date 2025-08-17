import React from 'react';
import { SharedInbox } from '../../types';
import { Users, Mail, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '../../pages/ui/Button';


interface InboxCardProps {
  inbox: SharedInbox;
  onSelect: () => void;
}

export function InboxCard({ inbox, onSelect }: InboxCardProps) {


  return (
    <div
      className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => {
        onSelect();
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex items-center space-x-1">
          <button className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {inbox.name}
      </h3>

      {inbox.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          {inbox.description}
        </p>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Users className="w-4 h-4 mr-2" />
            {/* {inbox.members.length} member{inbox.members.length !== 1 ? 's' : ''} */}
          </div>
          {/* <div className="flex -space-x-2">
            {inbox.members.slice(0, 3).map((member) => (
              <div
                key={member.id}
                className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center"
                title={member.name}
              >
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    {member.name.charAt(0)}
                  </span>
                )}
              </div>
            ))}
            {inbox.members.length > 3 && (
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  +{inbox.members.length - 3}
                </span>
              </div>
            )}
          </div> */}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Mail className="w-4 h-4 mr-2" />
            {inbox.channels.length} channel{inbox.channels.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center space-x-1">
            {inbox.channels.slice(0, 2).map((channel) => (
              <span
                key={channel.id}
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${channel.status === 'connected'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}
              >
                {channel.provider}
              </span>
            ))}
            {inbox.channels.length > 2 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{inbox.channels.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Created {inbox.createdAt ? new Date(inbox.createdAt).toLocaleDateString() : "—"}
          </span>

          <Button size="sm" variant="ghost">
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
        </div>
      </div>
    </div>
  );
}