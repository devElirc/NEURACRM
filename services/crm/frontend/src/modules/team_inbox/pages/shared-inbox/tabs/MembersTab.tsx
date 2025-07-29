import React from 'react';
import { SharedInbox } from '../../../types';
import { UserPlus, Settings } from 'lucide-react';
import { Button } from '../../../pages/ui/Button';

interface MembersTabProps {
  inbox: SharedInbox;
}

export default function MembersTab({ inbox }: MembersTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Members</h3>
        <Button size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      <div className="space-y-4">
        {inbox.members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center space-x-4">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {member.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{member.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{member.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${member.role === 'admin'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                {member.role}
              </span>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}