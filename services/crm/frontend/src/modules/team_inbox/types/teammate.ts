export interface Teammate {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Agent' | 'Viewer';
  avatar: string;
  status: 'Active' | 'Inactive';
  lastSeen: string;
  joinedDate: string;
  teamInboxes: string[];
}

export interface NewTeammate {
  name: string;
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