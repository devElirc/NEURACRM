import React, { useState } from 'react';
import { UserPlus, Search, Users, Settings, Filter } from 'lucide-react';
import TeammateCard from './TeammateCard';
import AddTeammateModal from './AddTeammateModal';
import EditTeammateModal from './EditTeammateModal';
import { mockTeammates, mockTeamInboxes } from '../../data/mockData';
import { Teammate, NewTeammate } from '../../types/teammate';

const TeammatesPage: React.FC = () => {
  const [teammates, setTeammates] = useState<Teammate[]>(mockTeammates);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeammate, setEditingTeammate] = useState<Teammate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const handleAddTeammate = (newTeammateData: NewTeammate) => {
    const newTeammate: Teammate = {
      id: Math.random().toString(36).substr(2, 9),
      ...newTeammateData,
      avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400`,
      status: 'Active',
      lastSeen: 'Just now',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    
    setTeammates(prev => [newTeammate, ...prev]);
  };

  const handleEditTeammate = (teammate: Teammate) => {
    setEditingTeammate(teammate);
    setIsEditModalOpen(true);
  };

  const handleSaveTeammate = (updatedTeammate: Teammate) => {
    setTeammates(prev => 
      prev.map(teammate => 
        teammate.id === updatedTeammate.id ? updatedTeammate : teammate
      )
    );
    setEditingTeammate(null);
  };

  const handleRemoveTeammate = (id: string) => {
    if (window.confirm('Are you sure you want to remove this teammate?')) {
      setTeammates(prev => prev.filter(teammate => teammate.id !== id));
    }
  };

  const filteredTeammates = teammates.filter(teammate => {
    const matchesSearch = teammate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         teammate.email.toLowerCase().includes(searchQuery.toLowerCase());
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
              teamInboxes={mockTeamInboxes}
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
        teamInboxes={mockTeamInboxes}
      />

      <EditTeammateModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveTeammate}
        teammate={editingTeammate}
        teamInboxes={mockTeamInboxes}
      />
    </div>
  );
};

export default TeammatesPage;