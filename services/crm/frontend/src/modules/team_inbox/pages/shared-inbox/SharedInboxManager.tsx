import React, { useState, useEffect } from 'react';
import { SharedInbox, TeamMember, EmailChannel } from '../../types';
import { mockSharedInboxes, mockTeamMembers, mockEmailChannels } from '../../data/mockData';
import {
  Plus,
  Users,
  Mail,
  Settings,
  Trash2,
  Edit,
  Eye,
  UserPlus,
  AtSign,
  Globe
} from 'lucide-react';
import { Button } from '../../pages/ui/Button';

interface SharedInboxManagerProps {
  onClose: () => void;
  onCreateInbox?: (inbox: Partial<SharedInbox>) => void;
}

interface EmailChannelFormData {
  provider: 'gmail' | 'outlook' | 'custom';
  email: string;
  imapHost?: string;
  imapPort?: string;
  smtpHost?: string;
  smtpPort?: string;
  username?: string;
  password?: string;
}

export function SharedInboxManager({ onClose, onCreateInbox }: SharedInboxManagerProps) {
  const [sharedInboxes, setSharedInboxes] = useState<SharedInbox[]>(mockSharedInboxes);
  const [selectedInbox, setSelectedInbox] = useState<SharedInbox | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'channels' | 'settings'>('overview');

  const handleCreateInbox = (inboxData: Partial<SharedInbox>) => {
    const newInbox: SharedInbox = {
      id: Date.now().toString(),
      name: inboxData.name || '',
      description: inboxData.description,
      members: inboxData.members || [],
      channels: inboxData.channels || [],
      createdBy: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      settings: {
        autoAssignment: false,
        notifications: {
          newMessage: true,
          assignment: true,
          mention: true,
          email: true,
          desktop: true
        }
      }
    };

    setSharedInboxes(prev => [...prev, newInbox]);
    setShowCreateForm(false);
    onCreateInbox?.(newInbox);
  };

  if (showCreateForm) {
    return <CreateInboxForm onSubmit={handleCreateInbox} onCancel={() => setShowCreateForm(false)} />;
  }

  if (selectedInbox) {
    return (
      <InboxDetailsView
        inbox={selectedInbox}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onBack={() => setSelectedInbox(null)}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shared Inboxes</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage team inboxes and email channels
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Inbox
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        {sharedInboxes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No shared inboxes yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Get started by creating your first shared inbox for team collaboration
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Inbox
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sharedInboxes.map((inbox) => (
              <div
                key={inbox.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedInbox(inbox)}
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
                      {inbox.members.length} member{inbox.members.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex -space-x-2">
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
                    </div>
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
                    <span>Created {inbox.createdAt.toLocaleDateString()}</span>
                    <Button size="sm" variant="ghost">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateInboxForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: Partial<SharedInbox>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedMembers: [] as string[],
    selectedChannels: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const members = mockTeamMembers.filter(member =>
      formData.selectedMembers.includes(member.id)
    );

    const channels = mockEmailChannels.filter(channel =>
      formData.selectedChannels.includes(channel.id)
    );

    onSubmit({
      name: formData.name,
      description: formData.description,
      members,
      channels
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-2xl w-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create Shared Inbox</h2>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Inbox Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Support Team, Sales Inbox"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the purpose of this inbox"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Team Members
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3">
            {mockTeamMembers.map((member) => (
              <label key={member.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.selectedMembers.includes(member.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        selectedMembers: [...prev.selectedMembers, member.id]
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        selectedMembers: prev.selectedMembers.filter(id => id !== member.id)
                      }));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <span className="text-sm text-gray-900 dark:text-white">{member.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({member.email})</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!formData.name}>
            Create Inbox
          </Button>
        </div>
      </form>
    </div>
  );
}

function InboxDetailsView({
  inbox,
  activeTab,
  onTabChange,
  onBack,
  onClose
}: {
  inbox: SharedInbox;
  activeTab: string;
  onTabChange: (tab: 'overview' | 'members' | 'channels' | 'settings') => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'channels', label: 'Channels', icon: Mail },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

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
                onClick={() => onTabChange(tab.id as any)}
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

function OverviewTab({ inbox }: { inbox: SharedInbox }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {inbox.members.length}
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

function MembersTab({ inbox }: { inbox: SharedInbox }) {
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

function ChannelsTab({ inbox }: { inbox: SharedInbox }) {
  const [showAddChannelForm, setShowAddChannelForm] = useState(false);
  const [channels, setChannels] = useState<EmailChannel[]>(inbox.channels);

  const handleAddChannel = (channelData: EmailChannelFormData) => {
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
      oauthToken: channelData.provider !== 'custom' ? 'mock-oauth-token' : undefined
    };

    setChannels(prev => [...prev, newChannel]);
    setShowAddChannelForm(false);
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

function AddChannelForm({
  onSubmit,
  onCancel
}: {
  onSubmit: (data: EmailChannelFormData) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<EmailChannelFormData>({
    provider: 'gmail',
    email: '' // will be filled automatically after login
  });
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  // Configuration for OAuth
  const OAUTH_CONFIG = {
    gmail: {
      clientId: '757122969965-h4i287jiv8n5d6jbaergafq3ddki132e.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
    },
    outlook: {
      clientId: 'YOUR_OUTLOOK_CLIENT_ID',
      scope: 'https://graph.microsoft.com/Mail.Read',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
    }
  };

  const handleProviderChange = (provider: 'gmail' | 'outlook' | 'custom') => {
    setFormData(prev => ({
      ...prev,
      provider,
      imapHost: '',
      imapPort: '',
      smtpHost: '',
      smtpPort: '',
      username: '',
      password: ''
    }));
  };

  // Listen for popup message from backend callback
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.status === "google_connected") {
        setConnectionStatus("Connected successfully!");
        setFormData(prev => ({ ...prev, email: event.data.email }));

        // Submit to parent
        onSubmit({
          ...formData,
          email: event.data.email
        });
      } else if (event.data === "google_failed") {
        setConnectionStatus("Connection failed");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [formData, onSubmit]);

  const handleOAuthConnect = async (provider: 'gmail' | 'outlook') => {
    setConnectionStatus('Connecting...');

    const config = OAUTH_CONFIG[provider];
    const redirectUri = 'http://127.0.0.1:8000/api/inbox/auth/google/callback';

    const authUrl = `${config.authUrl}?` + new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scope,
      access_type: 'offline',
      prompt: 'consent'
    });

    // Open popup window
    window.open(authUrl, '_blank', 'width=600,height=700');
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectionStatus('Testing connection...');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConnectionStatus('Connected successfully');
      onSubmit(formData);
    } catch (error) {
      setConnectionStatus('Connection failed');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg w-full">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Email Channel</h2>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Provider
          </label>
          <div className="flex space-x-4">
            {[
              { id: 'gmail', label: 'Gmail', icon: Globe },
              { id: 'outlook', label: 'Outlook', icon: Globe },
              { id: 'custom', label: 'Custom (IMAP/SMTP)', icon: Globe }
            ].map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleProviderChange(option.id as any)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  formData.provider === option.id
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <option.icon className="w-4 h-4 inline-block mr-2" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Only show IMAP/SMTP inputs if "Custom" is selected */}
        {formData.provider === 'custom' && (
          <div className="space-y-4">
            {/* ... same custom fields as before ... */}
          </div>
        )}

        {connectionStatus && (
          <div
            className={`text-sm ${
              connectionStatus.includes('success')
                ? 'text-green-600 dark:text-green-400'
                : connectionStatus.includes('failed')
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {connectionStatus}
          </div>
        )}

        <div className="flex items-center justify-end space-x-3">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          {formData.provider === 'custom' ? (
            <Button
              type="button"
              onClick={handleCustomSubmit}
              disabled={!formData.imapHost || !formData.smtpHost || !formData.username || !formData.password}
            >
              Connect
            </Button>
          ) : (
            <Button type="button" onClick={() => handleOAuthConnect(formData.provider)}>
              Connect with {formData.provider === 'gmail' ? 'Google' : 'Microsoft'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ inbox }: { inbox: SharedInbox }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">General Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Auto Assignment</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically assign new messages to team members
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={inbox.settings.autoAssignment}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h3>
        <div className="space-y-4">
          {Object.entries(inbox.settings.notifications).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={value}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Email Signature</h3>
        <textarea
          defaultValue={inbox.settings.signature}
          placeholder="Add your team's email signature..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
        />
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button>Save Settings</Button>
      </div>
    </div>
  );
}