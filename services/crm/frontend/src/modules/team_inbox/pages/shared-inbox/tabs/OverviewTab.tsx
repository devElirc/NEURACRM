import React from 'react';
import { SharedInbox } from '../../../types';
import { Users, Mail, AtSign } from 'lucide-react';

interface OverviewTabProps {
  inbox: SharedInbox;
}

export default function OverviewTab({ inbox }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {/* {inbox.members.length} */}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Team Members</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <Mail className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {inbox.channels.length}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Email Channels</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <AtSign className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {inbox.channels.filter(c => c.status === 'connected').length}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">Connected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-900 dark:text-white">
              support@company.com channel connected successfully
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-900 dark:text-white">
              Sarah Smith added to the team
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}