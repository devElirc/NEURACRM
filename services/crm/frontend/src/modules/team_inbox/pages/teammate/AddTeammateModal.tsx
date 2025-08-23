import React, { useState, useEffect } from 'react';
import { X, UserPlus, Send, CheckCircle } from 'lucide-react';
import { NewTeammate } from '../../types/teammate';
import { SharedInbox } from '../../types';

interface AddTeammateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (teammate: NewTeammate, sendInvite: boolean) => void;
  teamInboxes: SharedInbox[];
}

const AddTeammateModal: React.FC<AddTeammateModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  teamInboxes,
}) => {
  const [formData, setFormData] = useState<NewTeammate>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Agent',
    teamInboxes: [],
  });

  const [errors, setErrors] = useState<Partial<NewTeammate>>({});
  const [sendInvite, setSendInvite] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);


  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'Agent',
      teamInboxes: [],
    });
    setErrors({});
    setSendInvite(true);
  };

  const handleChange = (field: keyof NewTeammate, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleInboxToggle = (inboxId: string) => {
    const updatedInboxes = formData.teamInboxes.includes(inboxId)
      ? formData.teamInboxes.filter((id) => id !== inboxId)
      : [...formData.teamInboxes, inboxId];
    handleChange('teamInboxes', updatedInboxes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Partial<NewTeammate> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (formData.teamInboxes.length === 0) newErrors.teamInboxes = 'At least one team inbox must be selected';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Call parent onAdd
    onAdd(formData, sendInvite);

    if (sendInvite) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        onClose();
      }, 1000);
    } else {
      resetForm();
      onClose();
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 w-full max-w-md mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Invitation Sent!</h2>
          <p className="text-gray-600">
            We've sent an invitation to <strong>{formData.email}</strong>. They'll receive an email with instructions to join your team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add New Teammate</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName || ''}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.firstName ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Enter first name"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName || ''}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.lastName ? 'border-red-300' : 'border-gray-300'}`}
                placeholder="Enter last name"
              />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
              placeholder="teammate@company.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Agent">Agent</option>
              <option value="Admin">Admin</option>
              <option value="Viewer">Viewer</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === 'Admin' && 'Full access to all features and settings'}
              {formData.role === 'Agent' && 'Can manage conversations and reply to customers'}
              {formData.role === 'Viewer' && 'Read-only access to conversations'}
            </p>
          </div>

          {/* Team Inboxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Team Inboxes</label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {teamInboxes.map((inbox) => (
                <label key={inbox.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.teamInboxes.includes(inbox.id)}
                    onChange={() => handleInboxToggle(inbox.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex items-center space-x-2 flex-1">
                    <div className={`w-3 h-3 rounded-full bg-purple-500`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inbox.name}</p>
                      <p className="text-xs text-gray-500">{inbox.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.teamInboxes && <p className="text-red-500 text-xs mt-1">{errors.teamInboxes}</p>}
          </div>

          {/* Send Invite */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <input
              type="checkbox"
              id="sendInvite"
              checked={sendInvite}
              onChange={(e) => setSendInvite(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="sendInvite" className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Send invitation email to teammate</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Add Teammate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeammateModal;

