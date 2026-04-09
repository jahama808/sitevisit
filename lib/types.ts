export type UserRole = 'admin' | 'manager' | 'requester' | 'designer' | 'sales';
export type Island = 'Oahu' | 'Maui' | 'Kauai' | 'Hawaii';
export type RequestStatus = 'received' | 'scheduled' | 'completed';
export type DeliveryStatus = 'in_progress' | 'sent';
export type VisitStatus = 'new' | 'assigned' | 'scheduled' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface DesignerProfile {
  id: number;
  user_id: string;
  island_preferences: Island[];
  additional_preferences: string;
  active: boolean;
}

export interface SiteVisitRequest {
  id: number;
  property_name: string;
  island: Island;
  property_address: string;
  building_count: number | null;
  floor_count: number | null;
  internet_connections: number | null;
  property_contact_name: string;
  property_contact_phone: string;
  date_requested: string | null;
  date_performed: string | null;
  date_completed: string | null;
  preferred_start: string;
  preferred_end: string | null;
  detailed_description: string;
  scope_fiber_enablement_pathing: boolean;
  scope_common_area_requirements: boolean;
  notes: string;
  install_plan_url: string;
  attachment_path: string | null;
  submitted_by: string;
  assigned_designer: string | null;
  assigned_by: string | null;
  status: VisitStatus;
  request_status: RequestStatus;
  wiring_plan_status: DeliveryStatus;
  costs_status: DeliveryStatus;
  admin_override: boolean;
  created_at: string;
  updated_at: string;
  submitted_by_profile?: Profile;
  assigned_designer_profile?: Profile;
}

export interface VisitChangeEvent {
  id: number;
  event_type: string;
  visit_id: number;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface ApiToken {
  id: number;
  name: string;
  token: string;
  active: boolean;
  created_at: string;
}
