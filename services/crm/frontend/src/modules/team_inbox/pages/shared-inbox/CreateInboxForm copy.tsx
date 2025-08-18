import React, { useState } from 'react';
import { SharedInbox } from '../../types';
import { Button } from '../../pages/ui/Button';
import { mockTeamMembers, mockChannels } from '../../data/mockData';

interface CreateInboxFormProps {
  onSubmit: (data: Partial<SharedInbox>) => void;
  onCancel: () => void;
}

export function CreateInboxForm({ onSubmit, onCancel }: CreateInboxFormProps) {
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

    const channels = mockChannels.filter(channel =>
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