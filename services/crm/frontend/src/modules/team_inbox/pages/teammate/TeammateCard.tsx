import React from 'react';
import { MoreHorizontal, Mail, Calendar, Clock, Inbox } from 'lucide-react';
import { Teammate, TeamInbox } from '../types/teammate';

interface TeammateCardProps {
  teammate: Teammate;
  teamInboxes: TeamInbox[];
  onEdit: (teammate: Teammate) => void;
  onRemove: (id: string) => void;
}

const TeammateCard: React.FC<TeammateCardProps> = ({ teammate, teamInboxes, onEdit, onRemove }) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Agent':
        return 'bg-blue-100 text-blue-800';
      case 'Viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'Active' ? 'bg-green-500' : 'bg-gray-400';
  };

  const getAssignedInboxes = () => {
    return teamInboxes.filter(inbox => teammate.teamInboxes.includes(inbox.id));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="relative">
            <img
              src={teammate.avatar}
              alt={teammate.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(
                teammate.status
              )}`}
            />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">{teammate.name}</h3>
            <div className="flex items-center text-gray-600 mt-1">
              <Mail className="w-4 h-4 mr-2" />
              <span className="text-sm">{teammate.email}</span>
            </div>
            <div className="flex items-center space-x-4 mt-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                  teammate.role
                )}`}
              >
                {teammate.role}
              </span>
              <span className="text-xs text-gray-500 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                Last seen {teammate.lastSeen}
              </span>
            </div>
            <div className="flex items-center text-xs text-gray-500 mt-2">
              <Calendar className="w-3 h-3 mr-1" />
              Joined {teammate.joinedDate}
            </div>
            
            {/* Team Inboxes */}
            <div className="mt-3">
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <Inbox className="w-3 h-3 mr-1" />
                Team Inboxes ({getAssignedInboxes().length})
              </div>
              <div className="flex flex-wrap gap-1">
                {getAssignedInboxes().map(inbox => (
                  <span
                    key={inbox.id}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${inbox.color}`}
                  >
                    {inbox.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="relative group">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
            <button
              onClick={() => onEdit(teammate)}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
            >
              Edit teammate
            </button>
            <button
              onClick={() => onRemove(teammate.id)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
            >
              Remove teammate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeammateCard;