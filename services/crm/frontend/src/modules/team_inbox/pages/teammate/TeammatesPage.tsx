import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserPlus, Search, Users, Settings, Filter } from 'lucide-react';
import TeammateCard from './TeammateCard';
import AddTeammateModal from './AddTeammateModal';
import EditTeammateModal from './EditTeammateModal';
import ConfirmationModal from './ConfirmationModal'

import { mockTeammates, mockTeamInboxes } from '../../data/mockData';
import { Teammate, NewTeammate } from '../../types/teammate';
import { SharedInbox } from '../../types';
import { useAuth } from '../../../../auth/AuthProvider';


type TeammatesPageProps = {
  sharedInboxes: SharedInbox[];
};


const TeammatesPage: React.FC<TeammatesPageProps> = ({ sharedInboxes }) => {
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeammate, setEditingTeammate] = useState<Teammate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const { user, tokens, tenant } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    isLoading: false
  });


  useEffect(() => {
    if (!tenant?.id || !tokens) return;

    const fetchTeammates = async () => {
      setLoading(true);
      try {
        console.log("Fetching teammates for tenant:", tenant.id);
        const res = await fetch(`http://localhost:8000/api/inbox/teammates/?tenant_id=${tenant.id}`, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error("Failed response:", res.status, res.statusText);
          throw new Error("Failed to fetch teammates");
        }

        const data = await res.json().catch(err => {
          console.error("Failed to parse JSON:", err);
          return [];
        });

        console.log("Raw data from backend:", data);

        const formatted: Teammate[] = (data.results || []).map((item: any) => ({
          id: item.id,
          firstName: item.firstName || "",
          lastName: item.lastName || "",
          fullName: item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim(),
          email: item.email,
          role: item.role as 'Admin' | 'Agent' | 'Viewer',
          avatar: item.avatar || "https://placehold.co/64x64",
          status: item.status || "Inactive",  // backend already sends "Active"/"Inactive"
          lastSeen: item.lastSeen || "Offline",
          joinedDate: item.joinedDate || "",
          teamInboxes: item.teamInboxes || [],
        }));


        console.log("Formatted teammates:", formatted);
        setTeammates(formatted);
      } catch (err) {
        console.error("❌ Failed to fetch teammates", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeammates();
  }, [tenant, tokens]);


  const handleAddTeammate = async (newTeammateData: NewTeammate, sendInvite: boolean) => {
    try {
      const payload = {
        ...newTeammateData,
        tenant_id: tenant?.id,
        sendInvite,  // 👈 pass invite flag to backend
        avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400`,
        status: 'Active',
        lastSeen: 'Just now',
        joinedDate: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      };

      console.log("👉 Sending teammate to API:", payload);

      const response = await fetch('http://localhost:8000/api/inbox/teammates/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }

      const savedTeammate: Teammate = await response.json();
      console.log("✅ API returned:", savedTeammate);

      setTeammates((prev) => [savedTeammate, ...prev]);
    } catch (error) {
      console.error('❌ Failed to add teammate:', error);
      alert('Failed to add teammate. Check console for details.');
    }
  };



  const handleEditTeammate = (teammate: Teammate) => {
    setEditingTeammate(teammate);
    setIsEditModalOpen(true);
  };

  const handleSaveTeammate = async (updatedTeammate: Teammate) => {
    try {
      console.log("👉 Sending update to API:", updatedTeammate);

      const response = await fetch(
        `http://localhost:8000/api/inbox/teammates/${updatedTeammate.id}/`,
        {
          method: 'PATCH', // PATCH for partial updates, PUT for full replacement
          headers: {
            Authorization: `Bearer ${tokens?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...updatedTeammate,
            tenant_id: tenant?.id,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${errorText}`);
      }

      const savedTeammate: Teammate = await response.json();
      console.log("✅ API returned updated teammate:", savedTeammate);

      // Update local state with server response
      setTeammates((prev) =>
        prev.map((teammate) =>
          teammate.id === savedTeammate.id ? savedTeammate : teammate
        )
      );

      setEditingTeammate(null);
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("❌ Failed to update teammate:", error);
      alert("Failed to update teammate. Check console for details.");
    }
  };


  // --- remove teammate flow ---
  const handleRemoveTeammate = (id: string) => {
    console.log("🟡 handleRemoveTeammate called with id:", id);

    const teammate = teammates.find(t => t.id === id);
    if (!teammate) {
      console.warn("⚠️ No teammate found with id:", id);
      return;
    }

    console.log("🟡 Opening confirmation modal for teammate:", teammate);

    setConfirmModal({
      isOpen: true,
      title: 'Remove Teammate',
      message: `Are you sure you want to remove ${teammate.fullName || teammate.email} from your team? 
              This action cannot be undone and they will lose access to all team inboxes.`,
      onConfirm: () => confirmRemoveTeammate(id),
      isLoading: false
    });
  };

  const confirmRemoveTeammate = async (id: string) => {
    console.log("🟡 confirmRemoveTeammate triggered for id:", id);

    setConfirmModal(prev => ({ ...prev, isLoading: true }));

    try {
      console.log("👉 Sending DELETE request to API:", `http://localhost:8000/api/inbox/teammates/${id}/`);

      const response = await fetch(`http://localhost:8000/api/inbox/teammates/${id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log("📡 API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API responded with error:", errorText);
        throw new Error(`API error: ${errorText}`);
      }

      console.log("✅ API DELETE success. Removing teammate from state...");

      // Update local state
      setTeammates(prev => {
        const updated = prev.filter(teammate => teammate.id !== id);
        console.log("🟢 Updated teammates list:", updated);
        return updated;
      });

      // Close modal
      console.log("🟢 Closing modal after success");
      setConfirmModal(prev => ({ ...prev, isOpen: false, isLoading: false }));
    } catch (error) {
      console.error("❌ Failed to delete teammate:", error);

      alert("Failed to remove teammate. Check console for details.");

      // Reset loading state, but keep modal open so user can retry or cancel
      setConfirmModal(prev => ({ ...prev, isLoading: false }));
    }
  };


  const filteredTeammates = teammates.filter((teammate) => {
    console.log("teammates", teammates);

    const fullName =
      `${teammate.firstName || ''} ${teammate.lastName || ''}`.trim().toLowerCase();

    const email = teammate.email?.toLowerCase() || '';

    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || teammate.role === filterRole;

    return matchesSearch && matchesRole;
  });


  const activeTeammates = teammates.filter(t => t.status === 'Active').length;
  const totalTeammates = teammates.length;

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                <p className="text-gray-600">Manage your team members and their permissions</p>
              </div>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Teammate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Teammates</p>
                <p className="text-3xl font-bold text-gray-900">{totalTeammates}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-3xl font-bold text-green-600">{activeTeammates}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admin Users</p>
                <p className="text-3xl font-bold text-purple-600">
                  {teammates.filter(t => t.role === 'Admin').length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search teammates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Agent">Agent</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teammates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTeammates.map(teammate => (
            <TeammateCard
              key={teammate.id}
              teammate={teammate}
              teamInboxes={sharedInboxes}
              onEdit={handleEditTeammate}
              onRemove={handleRemoveTeammate}
            />
          ))}
        </div>

        {filteredTeammates.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teammates found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddTeammateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddTeammate}
        teamInboxes={sharedInboxes}
      />

      <EditTeammateModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTeammate}
        teammate={editingTeammate}
        teamInboxes={sharedInboxes}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Remove Teammate"
        type="danger"
        isLoading={confirmModal.isLoading}
      />
    </div>
  );
};

export default TeammatesPage;