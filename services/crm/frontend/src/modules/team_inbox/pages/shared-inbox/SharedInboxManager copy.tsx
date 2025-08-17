import React, { useState, useEffect } from 'react';
import { SharedInbox } from '../../types';
import { Plus, Users } from 'lucide-react';
import { Button } from '../../pages/ui/Button';
import { CreateInboxForm } from './CreateInboxForm';
import { InboxDetailsView } from './InboxDetailsView';
import { InboxCard } from './InboxCard';
import { mockSharedInboxes } from '../../data/mockData';
import { useAuth } from '../../../../auth/AuthProvider';

interface SharedInboxManagerProps {
  onClose: () => void;
  onCreateInbox?: (inbox: Partial<SharedInbox>) => void;
}

export function SharedInboxManager({ onClose, onCreateInbox }: SharedInboxManagerProps) {
  const [sharedInboxes, setSharedInboxes] = useState<SharedInbox[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInbox, setSelectedInbox] = useState<SharedInbox | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { user, tokens, tenant } = useAuth();



  useEffect(() => {
    if (!tenant?.id || !tokens) return;

    const fetchInboxes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/api/inbox/inboxes/sharedinbox/`, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Failed to fetch inboxes');
        const data = await res.json();

        // Convert string dates to Date objects if needed
        const inboxes: SharedInbox[] = data.map((inbox: any) => ({
          ...inbox,
          createdAt: new Date(inbox.createdAt),
          updatedAt: new Date(inbox.updatedAt),
        }));

        setSharedInboxes(inboxes);
      } catch (err) {
        console.error('❌ Failed to fetch inboxes', err);
        setSharedInboxes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInboxes();
  }, [tenant, tokens]);


  const handleCreateInbox = async (inboxData: Partial<SharedInbox>) => {
    if (!tenant?.id || !tokens) return;

    try {
      const payload = {
        name: inboxData.name,
        description: inboxData.description,
        channels: inboxData.channels, // optional array of identifiers
        tenantId: tenant.id,          // if backend requires tenant context
      };

      const response = await fetch('http://localhost:8000/api/inbox/inboxes/sharedinbox/', {  // note plural 'inboxes' to match router
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to create inbox');

      const data = await response.json();  // parse JSON

      const newInbox: SharedInbox = {
        ...data,
        members: inboxData.members || [],  // front-end only
        createdBy: user?.id || '1',        // from user context
        settings: inboxData.settings || {
          autoAssignment: false,
          notifications: {
            newMessage: true,
            assignment: true,
            mention: true,
            email: true,
            desktop: true,
          },
        },
      };

      setSharedInboxes(prev => [...prev, newInbox]);
      setShowCreateForm(false);
      onCreateInbox?.(newInbox);

    } catch (err) {
      console.error('❌ Failed to create inbox', err);
      // optional: show toast notification to user
    }
  };


  if (showCreateForm) {
    return <CreateInboxForm onSubmit={handleCreateInbox} onCancel={() => setShowCreateForm(false)} />;
  }

  if (selectedInbox) {
    return (
      <InboxDetailsView
        inbox={selectedInbox}
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
        {loading ? (
          <p>Loading inboxes...</p>
        ) : sharedInboxes.length === 0 ? (
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
              <InboxCard
                key={inbox.id}
                inbox={inbox}
                onSelect={() => setSelectedInbox(inbox)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}