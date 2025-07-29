import React from 'react';
import { Contact } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import { 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  MessageCircle, 
  Clock,
  ExternalLink,
  Edit,
  Plus
} from 'lucide-react';

interface ContactPanelProps {
  contact: Contact | null;
}

export function ContactPanel({ contact }: ContactPanelProps) {
  if (!contact) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contact selected</h3>
          <p className="text-gray-500 text-sm">Contact information will appear here when you select a conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
          <button className="text-gray-400 hover:text-gray-600 transition-colors">
            <Edit className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-medium">
              {contact.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">{contact.name}</h3>
          <p className="text-gray-500">{contact.email}</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-600">{contact.email}</p>
            </div>
          </div>

          {contact.phone && (
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-sm text-gray-600">{contact.phone}</p>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Last Contact</p>
              <p className="text-sm text-gray-600">{formatDateTime(contact.lastContactDate)}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Stats</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-gray-600">Conversations</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-1">{contact.totalConversations}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-green-500" />
                <span className="text-xs text-gray-600">Avg Response</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-1">{contact.averageResponseTime}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900">Tags</h4>
            <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1">
              <Plus className="h-3 w-3" />
              <span>Add</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {contact.tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Company Info</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Building className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">Acme Corporation</p>
                <p className="text-sm text-gray-600">acme.com</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Industry</p>
                <p className="font-medium text-gray-900">Technology</p>
              </div>
              <div>
                <p className="text-gray-600">Size</p>
                <p className="font-medium text-gray-900">50-200</p>
              </div>
            </div>
            <button className="mt-3 text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1">
              <ExternalLink className="h-3 w-3" />
              <span>View company profile</span>
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
            Start New Conversation
          </button>
        </div>
      </div>
    </div>
  );
}