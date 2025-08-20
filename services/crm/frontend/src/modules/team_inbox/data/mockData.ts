import { Conversation, Contact, Tag, Message, Attachment, InternalNote, SharedInbox, TeamMember, Channel, } from '../types';

import { Teammate, TeamInbox } from '../types/teammate';

export const mockTeamInboxes: TeamInbox[] = [
  {
    id: '1',
    name: 'General Support',
    description: 'Main customer support inbox',
    color: 'bg-blue-500'
  },
  {
    id: '2',
    name: 'Sales Inquiries',
    description: 'Sales and pre-sales questions',
    color: 'bg-green-500'
  },
  {
    id: '3',
    name: 'Technical Support',
    description: 'Technical issues and bug reports',
    color: 'bg-purple-500'
  },
  {
    id: '4',
    name: 'Billing',
    description: 'Payment and billing related queries',
    color: 'bg-orange-500'
  },
  {
    id: '5',
    name: 'Product Feedback',
    description: 'Feature requests and product feedback',
    color: 'bg-pink-500'
  }
];

export const mockTeammates: Teammate[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    role: 'Admin',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'Active',
    lastSeen: '2 minutes ago',
    joinedDate: 'Jan 15, 2024',
    teamInboxes: ['1', '2', '3']
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael@company.com',
    role: 'Agent',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'Active',
    lastSeen: '1 hour ago',
    joinedDate: 'Feb 3, 2024',
    teamInboxes: ['1', '3']
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily@company.com',
    role: 'Agent',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'Active',
    lastSeen: '30 minutes ago',
    joinedDate: 'Jan 28, 2024',
    teamInboxes: ['2', '4']
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david@company.com',
    role: 'Viewer',
    avatar: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'Inactive',
    lastSeen: '2 days ago',
    joinedDate: 'Mar 10, 2024',
    teamInboxes: ['1']
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa@company.com',
    role: 'Agent',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'Active',
    lastSeen: '5 minutes ago',
    joinedDate: 'Feb 20, 2024',
    teamInboxes: ['1', '2', '5']
  },
  {
    id: '6',
    name: 'James Wilson',
    email: 'james@company.com',
    role: 'Admin',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    status: 'Active',
    lastSeen: '1 hour ago',
    joinedDate: 'Jan 5, 2024',
    teamInboxes: ['1', '2', '3', '4', '5']
  }
];

export const mockTags: Tag[] = [
  { id: '1', name: 'Billing', color: '#3B82F6', shared: true },
  { id: '2', name: 'Support', color: '#10B981', shared: true },
  { id: '3', name: 'Sales', color: '#8B5CF6', shared: true },
  { id: '4', name: 'Urgent', color: '#EF4444', shared: true },
  { id: '5', name: 'Follow-up', color: '#F59E0B', shared: true },
];
// Mock team members
export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    email: 'john@company.com',
    name: 'John Doe',
    role: 'admin',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    permissions: ['read', 'reply', 'assign', 'admin'].map(action => ({ action: action as any, granted: true })),
    addedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    email: 'sarah@company.com',
    name: 'Sarah Smith',
    role: 'member',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
    permissions: ['read', 'reply', 'assign'].map(action => ({ action: action as any, granted: true })),
    addedAt: new Date('2024-01-20')
  },
  {
    id: '3',
    email: 'mike@company.com',
    name: 'Mike Johnson',
    role: 'member',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100',
    permissions: ['read', 'reply'].map(action => ({ action: action as any, granted: true })),
    addedAt: new Date('2024-02-01')
  }
];

// Mock email channels
export const mockChannels: Channel[] = [
  {
    id: '1',
    name: 'Support Email',
    email: 'support@company.com',
    provider: 'gmail',
    status: 'connected',
    settings: {
      oauthToken: 'mock-oauth-token',
      refreshToken: 'mock-refresh-token'
    },
    createdAt: new Date('2024-01-10'),
    lastSync: new Date()
  },
  {
    id: '2',
    name: 'Sales Email',
    email: 'sales@company.com',
    provider: 'outlook',
    status: 'connected',
    settings: {
      oauthToken: 'mock-oauth-token',
      refreshToken: 'mock-refresh-token'
    },
    createdAt: new Date('2024-01-12'),
    lastSync: new Date()
  },
  {
    id: '3',
    name: 'Info Email',
    email: 'info@company.com',
    provider: 'imap',
    status: 'connected',
    settings: {
      imapHost: 'imap.company.com',
      imapPort: 993,
      smtpHost: 'smtp.company.com',
      smtpPort: 587,
      useSSL: true
    },
    createdAt: new Date('2024-01-15'),
    lastSync: new Date()
  }
];

// Mock shared inboxes
export const mockSharedInboxes: SharedInbox[] = [
  {
    id: '1',
    name: 'Support Team',
    description: 'Customer support and technical assistance',
    members: mockTeamMembers,
    channels: [mockChannels[0], mockChannels[2]],
    createdBy: '1',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date(),
    settings: {
      autoAssignment: true,
      signature: 'Best regards,\nSupport Team\nAcme Corp',
      notifications: {
        newMessage: true,
        assignment: true,
        mention: true,
        email: true,
        desktop: true
      },
      workingHours: {
        enabled: true,
        timezone: 'America/New_York',
        schedule: {
          monday: { start: '09:00', end: '17:00', enabled: true },
          tuesday: { start: '09:00', end: '17:00', enabled: true },
          wednesday: { start: '09:00', end: '17:00', enabled: true },
          thursday: { start: '09:00', end: '17:00', enabled: true },
          friday: { start: '09:00', end: '17:00', enabled: true },
          saturday: { start: '10:00', end: '14:00', enabled: false },
          sunday: { start: '10:00', end: '14:00', enabled: false }
        }
      }
    }
  },
  {
    id: '2',
    name: 'Sales Team',
    description: 'Sales inquiries and lead management',
    members: mockTeamMembers.slice(0, 2),
    channels: [mockChannels[1]],
    createdBy: '1',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date(),
    settings: {
      autoAssignment: false,
      signature: 'Best regards,\nSales Team\nAcme Corp',
      notifications: {
        newMessage: true,
        assignment: true,
        mention: true,
        email: false,
        desktop: true
      }
    }
  }
];

export const mockAttachments: Attachment[] = [
  {
    id: '1',
    name: 'invoice-2024-001.pdf',
    size: '2.1 MB',
    type: 'application/pdf',
    url: '/attachments/invoice-2024-001.pdf',
  },
  {
    id: '2',
    name: 'screenshot.png',
    size: '456 KB',
    type: 'image/png',
    url: '/attachments/screenshot.png',
  },
];

export const mockInternalNotes: InternalNote[] = [
  {
    id: '1',
    author: 'Sarah Johnson',
    content: 'Customer is having issues with their billing integration. Escalated to billing team.',
    timestamp: new Date('2024-01-15T10:30:00'),
    mentions: ['@billing-team'],
  },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    from: 'john.customer@acme.com',
    to: ['support@yourcompany.com'],
    subject: 'Billing Integration Issue',
    content: 'Hi there,\n\nI\'m having trouble with our billing integration. The API seems to be returning 500 errors consistently since yesterday. Can you please help me resolve this issue?\n\nThis is affecting our production environment, so any urgent assistance would be greatly appreciated.\n\nBest regards,\nJohn',
    timestamp: new Date('2024-01-15T09:15:00'),
    isRead: true,
    attachments: [mockAttachments[1]],
    internalNotes: [mockInternalNotes[0]],
  },
  {
    id: '2',
    from: 'sarah.support@yourcompany.com',
    to: ['john.customer@acme.com'],
    cc: ['billing@yourcompany.com'],
    subject: 'Re: Billing Integration Issue',
    content: 'Hi John,\n\nThank you for reaching out. I\'ve escalated this issue to our billing team and they\'re looking into it right away.\n\nI\'ve also attached our latest API documentation that includes some troubleshooting steps you can try in the meantime.\n\nWe\'ll have an update for you within the next 2 hours.\n\nBest regards,\nSarah Johnson\nCustomer Success Team',
    timestamp: new Date('2024-01-15T10:45:00'),
    isRead: true,
    attachments: [mockAttachments[0]],
  },
  {
    id: '3',
    from: 'john.customer@acme.com',
    to: ['sarah.support@yourcompany.com'],
    subject: 'Re: Billing Integration Issue',
    content: 'Hi Sarah,\n\nThanks for the quick response! I tried the troubleshooting steps and they helped identify the issue. It looks like there was a configuration problem on our end.\n\nEverything is working now. Really appreciate the fast support!\n\nBest,\nJohn',
    timestamp: new Date('2024-01-15T16:20:00'),
    isRead: false,
  },
];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    subject: 'Billing Integration Issue',
    messages: mockMessages,
    participants: ['john.customer@acme.com', 'sarah.support@yourcompany.com'],
    tags: [mockTags[0], mockTags[3]],
    assignedTo: 'Sarah Johnson',
    status: 'open',
    priority: 'high',
    lastActivity: new Date('2024-01-15T16:20:00'),
    channel: 'email',
    contactId: '1',
    companyId: '1',
    sharedInboxId: '1',
  },
  {
    id: '2',
    subject: 'Feature Request: Dark Mode',
    messages: [
      {
        id: '4',
        from: 'jane.doe@example.com',
        to: ['feedback@yourcompany.com'],
        subject: 'Feature Request: Dark Mode',
        content: 'Hello,\n\nWould it be possible to add a dark mode to your application? Many of us work late hours and it would be much easier on the eyes.\n\nThanks!',
        timestamp: new Date('2024-01-14T14:30:00'),
        isRead: true,
      },
    ],
    participants: ['jane.doe@example.com'],
    tags: [mockTags[2]],
    assignedTo: 'Mike Chen',
    status: 'pending',
    priority: 'medium',
    lastActivity: new Date('2024-01-14T14:30:00'),
    channel: 'email',
    contactId: '2',
  },
  {
    id: '3',
    subject: 'Account Verification Problem',
    messages: [
      {
        id: '5',
        from: 'bob.smith@company.com',
        to: ['support@yourcompany.com'],
        subject: 'Account Verification Problem',
        content: 'I\'ve been trying to verify my account for the past 3 days but I\'m not receiving the verification email. Can you please help?',
        timestamp: new Date('2024-01-13T11:15:00'),
        isRead: false,
      },
    ],
    participants: ['bob.smith@company.com'],
    tags: [mockTags[1]],
    status: 'open',
    priority: 'urgent',
    lastActivity: new Date('2024-01-13T11:15:00'),
    snoozed: true,
    snoozeUntil: new Date('2024-01-16T09:00:00'),
    channel: 'email',
    contactId: '3',
  },
];

export const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'John Customer',
    email: 'john.customer@acme.com',
    phone: '+1 (555) 123-4567',
    companyId: '1',
    lastContactDate: new Date('2024-01-15T16:20:00'),
    totalConversations: 12,
    averageResponseTime: '2h 15m',
    tags: [mockTags[0], mockTags[3]],
  },
  {
    id: '2',
    name: 'Jane Doe',
    email: 'jane.doe@example.com',
    lastContactDate: new Date('2024-01-14T14:30:00'),
    totalConversations: 3,
    averageResponseTime: '4h 30m',
    tags: [mockTags[2]],
  },
  {
    id: '3',
    name: 'Bob Smith',
    email: 'bob.smith@company.com',
    phone: '+1 (555) 987-6543',
    lastContactDate: new Date('2024-01-13T11:15:00'),
    totalConversations: 8,
    averageResponseTime: '1h 45m',
    tags: [mockTags[1], mockTags[4]],
  },
];