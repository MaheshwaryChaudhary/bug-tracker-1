export type TicketStatus = 'todo' | 'in_progress' | 'done';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type AppRole = 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  project_id: string;
  role: AppRole;
  created_at: string;
}

export interface Ticket {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  assignee_id: string | null;
  created_by: string | null;
  due_date: string | null;
  labels: string[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  project_id: string | null;
  ticket_id: string | null;
  created_at: string;
}

export interface ProjectInvitation {
  id: string;
  project_id: string;
  email: string;
  invited_by: string;
  role: AppRole;
  status: InvitationStatus;
  created_at: string;
}

// Extended types with relations
export interface TicketWithAssignee extends Ticket {
  assignee?: Profile | null;
  creator?: Profile | null;
}

export interface ProjectWithRole extends Project {
  role?: AppRole;
  ticket_count?: number;
}

export interface UserRoleWithProfile extends UserRole {
  profile?: Profile;
}

export interface ProjectInvitationWithProject extends ProjectInvitation {
  project?: Project;
}
