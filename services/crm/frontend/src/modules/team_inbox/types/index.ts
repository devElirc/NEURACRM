export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string; // Personal user email for identification
  workEmail: string; // Work email for sending/receiving
  avatar?: string;
  role: 'admin' | 'agent' | 'viewer';
  tenantId: string;
  isActive: boolean;
  lastSeen: Date;
  timezone: string;
  signature?: string;
  createdAt: Date;
}

export interface Tenant {
  id: string;
  name: string; // Company name
  domain: string; // Company domain
  subdomain: string; // teaminbox subdomain
  plan: 'free' | 'pro' | 'enterprise';
  settings: TenantSettings;
  createdAt: Date;
  ownerId: string;
}

export interface TenantSettings {
  allowedDomains: string[];
  emailIntegration: EmailIntegration;
  branding: {
    logo?: string;
    primaryColor: string;
    companyName: string;
  };
  security: {
    requireTwoFactor: boolean;
    allowedIpRanges?: string[];
    sessionTimeout: number;
  };
}

export interface EmailIntegration {
  provider: 'gmail' | 'outlook' | 'imap' | 'exchange';
  isConnected: boolean;
  settings: {
    imapHost?: string;
    imapPort?: number;
    smtpHost?: string;
    smtpPort?: number;
    username?: string;
    useSSL: boolean;
  };
  lastSync?: Date;
}

export interface EmailAccount {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  provider: 'gmail' | 'outlook' | 'imap' | 'exchange';
  isConnected: boolean;
  isPrimary: boolean;
  settings: {
    signature?: string;
    autoReply?: {
      enabled: boolean;
      message: string;
    };
  };
  lastSync?: Date;
}

export interface Message {
  id: string;
  threadId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  subject: string;
  content: string;
  htmlContent?: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  isDraft: boolean;
  messageId: string; // Email message ID
  inReplyTo?: string;
  references?: string[];
  attachments?: Attachment[];
  internalNotes?: InternalNote[];
  labels: Label[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: 'incoming' | 'outgoing' | 'internal';
}

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface Conversation {
  id: string;
  threadId: string; // Email thread ID
  subject: string;
  messages: Message[];
  participants: EmailAddress[];
  tags: Tag[];
  assignedTo?: string;
  assignedBy?: string;
  assignedAt?: Date;
  status: 'open' | 'closed' | 'pending' | 'spam';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  lastActivity: Date;
  lastMessage: Message;
  snoozed?: boolean;
  snoozeUntil?: Date;
  channel: 'email' | 'chat' | 'social' | 'phone';
  contactId?: string;
  companyId?: string;
  // tenantId: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  sharedInboxId?: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  contentId?: string; // For inline attachments
  isInline: boolean;
}

export interface InternalNote {
  id: string;
  conversationId: string;
  author: User;
  content: string;
  timestamp: Date;
  mentions?: User[];
  isPrivate: boolean;
  attachments?: Attachment[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  shared: boolean;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  type: 'system' | 'custom';
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  companyId?: string;
  tenantId: string;
  lastContactDate: Date;
  totalConversations: number;
  averageResponseTime: string;
  tags: Tag[];
  customFields: Record<string, any>;
  socialProfiles?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  contacts: Contact[];
  totalConversations: number;
  avgResponseTime: string;
  tenantId: string;
  customFields: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  totalConversations: number;
  openConversations: number;
  avgResponseTime: string;
  slaBreaches: number;
  responseRate: number;
  volumeByTag: Record<string, number>;
  volumeByUser: Record<string, number>;
  volumeByHour: Record<string, number>;
  volumeByDay: Record<string, number>;
  satisfactionScore: number;
  firstResponseTime: string;
  resolutionTime: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  isShared: boolean;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowTrigger {
  type: 'email_received' | 'email_sent' | 'conversation_created' | 'conversation_assigned';
  conditions: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: any;
}

export interface WorkflowAction {
  type: 'assign' | 'add_tag' | 'send_email' | 'create_note' | 'set_priority' | 'archive';
  parameters: Record<string, any>;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'assignment' | 'new_message' | 'sla_breach' | 'workflow';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export interface SLAPolicy {
  id: string;
  name: string;
  description: string;
  conditions: SLACondition[];
  targets: SLATarget[];
  isActive: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SLACondition {
  field: string;
  operator: string;
  value: any;
}

export interface SLATarget {
  metric: 'first_response' | 'resolution';
  timeframe: number; // in minutes
  businessHoursOnly: boolean;
}

export interface BusinessHours {
  tenantId: string;
  timezone: string;
  schedule: {
    [key: string]: {
      isWorkingDay: boolean;
      startTime: string;
      endTime: string;
    };
  };
  holidays: Date[];
}

export interface Integration {
  id: string;
  name: string;
  type: 'email' | 'crm' | 'helpdesk' | 'chat' | 'social';
  provider: string;
  isConnected: boolean;
  settings: Record<string, any>;
  tenantId: string;
  connectedBy: string;
  connectedAt: Date;
  lastSync?: Date;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface EmailChannel {
  id: string;
  name: string;
  email: string;
  provider: 'gmail' | 'outlook' | 'custom';
  status: 'connected' | 'disconnected';
  imapHost?: string;
  imapPort?: string;
  smtpHost?: string;
  smtpPort?: string;
  username?: string;
  oauthToken?: string;
  createdAt?: string; // Optional timestamp
}

export interface ChannelSettings {
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
  useSSL?: boolean;
  oauthToken?: string;
  refreshToken?: string;
}

export interface SharedInboxSettings {
  autoAssignment: boolean;
  signature?: string;
  notifications: NotificationSettings;
  workingHours?: WorkingHours;
}

export interface NotificationSettings {
  newMessage: boolean;
  assignment: boolean;
  mention: boolean;
  email: boolean;
  desktop: boolean;
}

export interface WorkingHours {
  enabled: boolean;
  timezone: string;
  schedule: {
    [key: string]: { start: string; end: string; enabled: boolean };
  };
}

// Shared Inbox types
export interface SharedInbox {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  channels: EmailChannel[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  settings: SharedInboxSettings;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'member';
  avatar?: string;
  permissions: Permission[];
  addedAt: Date;
}

export interface Permission {
  action: 'read' | 'reply' | 'assign' | 'admin';
  granted: boolean;
}