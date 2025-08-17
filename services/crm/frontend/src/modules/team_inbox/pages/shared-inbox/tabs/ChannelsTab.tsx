import React, { useState } from 'react';
import { SharedInbox, EmailChannel } from '../../../types';
import { Plus, Mail, Settings } from 'lucide-react';
import { Button } from '../../../pages/ui/Button';
import AddChannelForm from './AddChannelForm';

interface EmailChannelFormData {
  provider: 'gmail' | 'outlook' | 'custom';
  email: string;
  imapHost?: string;
  imapPort?: string;
  smtpHost?: string;
  smtpPort?: string;
  username?: string;
  password?: string;
  connectionTime?: string;
}

interface ChannelsTabProps {
  inbox: SharedInbox;
}

export function ChannelsTab({ inbox }: ChannelsTabProps) {
  const [showAddChannelForm, setShowAddChannelForm] = useState(false);
  const [channels, setChannels] = useState<EmailChannel[]>(inbox.channels);
  console.log("channels--", channels);

  const handleAddChannel = (channelData: EmailChannelFormData) => {
    console.log("🔍 Handling channel addition:", channelData);
    setShowAddChannelForm(false); // Cancel/Close AddChannelForm first
    setTimeout(() => { // Ensure form is closed before alert
      alert(`✅ Channel added successfully! Email: ${channelData.email}`); // Show alert next
      const newChannel: EmailChannel = {
        id: Date.now().toString(),
        name: channelData.email,
        email: channelData.email,
        provider: channelData.provider,
        status: 'connected',
        imapHost: channelData.imapHost,
        imapPort: channelData.imapPort,
        smtpHost: channelData.smtpHost,
        smtpPort: channelData.smtpPort,
        username: channelData.username,
        oauthToken: channelData.provider !== 'custom' ? 'mock-oauth-token' : undefined,
        createdAt: channelData.connectionTime || new Date().toISOString() // e.g., "2025-07-29T14:01:00.000Z"
      };
      setChannels(prev => {
        const updatedChannels = [...prev, newChannel];
        console.log("🔧 Updated channels:", updatedChannels);
        return updatedChannels;
      }); // Add channel last
    }, 0);
  };

  if (showAddChannelForm) {
    return <AddChannelForm onSubmit={handleAddChannel} onCancel={() => setShowAddChannelForm(false)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Channels</h3>
        <Button size="sm" onClick={() => setShowAddChannelForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Channel
        </Button>
      </div>

      <div className="space-y-4">
        {channels.map((channel) => (
          <div key={channel.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${channel.status === 'connected'
                  ? 'bg-green-100 dark:bg-green-900'
                  : 'bg-red-100 dark:bg-red-900'
                }`}>
                <Mail className={`w-5 h-5 ${channel.status === 'connected'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                  }`} />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{channel.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{channel.email}</p>
                {channel.createdAt && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Added: {new Date(channel.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${channel.status === 'connected'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                {channel.status}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                {channel.provider}
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