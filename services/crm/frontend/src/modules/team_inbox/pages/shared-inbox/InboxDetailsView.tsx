import React, { useState } from 'react';
import { SharedInbox } from '../../types';
import { Eye, Users, Mail, Settings } from 'lucide-react';
import { Button } from '../../pages/ui/Button';
import OverviewTab from './tabs/OverviewTab';
import MembersTab from './tabs/MembersTab';
import { ChannelsTab } from './tabs/ChannelsTab'; // Changed to named import
import SettingsTab from './tabs/SettingsTab';
import { useEffect } from 'react';
interface InboxDetailsViewProps {
  inbox: SharedInbox;
  onBack: () => void;
  onClose: () => void;
}

export function InboxDetailsView({ inbox, onBack, onClose }: InboxDetailsViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'channels' | 'settings'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'channels', label: 'Channels', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  localStorage.setItem("selected_inbox_name", JSON.stringify(inbox.name));
  localStorage.setItem("selected_inbox_id", JSON.stringify(inbox.id));



  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{inbox.name}</h2>
            {inbox.description && (
              <p className="text-gray-600 dark:text-gray-400">{inbox.description}</p>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        {activeTab === 'overview' && <OverviewTab inbox={inbox} />}
        {activeTab === 'members' && <MembersTab inbox={inbox} />}
        {activeTab === 'channels' && <ChannelsTab inbox={inbox} />}
        {activeTab === 'settings' && <SettingsTab inbox={inbox} />}
      </div>
    </div>
  );
}