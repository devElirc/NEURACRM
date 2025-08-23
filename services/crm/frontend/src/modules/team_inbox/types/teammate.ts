export interface Teammate {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'Agent' | 'Viewer';
  avatar: string;
  status: 'Active' | 'Inactive';
  lastSeen: string;
  joinedDate: string;
  teamInboxes: string[];
}

export interface NewTeammate {
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'Agent' | 'Viewer';
  teamInboxes: string[];
}

export interface TeamInbox {
  id: string;
  name: string;
  description: string;
  color: string;
}