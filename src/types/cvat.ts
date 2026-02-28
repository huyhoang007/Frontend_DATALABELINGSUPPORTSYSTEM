// Core User Types
export interface User {
  user_id: number;
  username: string;
  password?: string;
  full_name: string;
  email: string;
  status: 'active' | 'inactive';
  role_id: number;
  created_at: string;
  role?: Role;
}

export interface Role {
  role_id: number;
  role_name: 'admin' | 'manager' | 'annotator' | 'reviewer';
}

// Project & Dataset Types
export interface Project {
  project_id: number;
  name: string;
  data_type: 'image' | 'text' | 'video' | 'audio';
  status: 'active' | 'completed' | 'paused';
  manager_id: number;
  manager?: User;
  datasets?: DataSet[];
  policies?: Policy[];
}

export interface DataSet {
  dataset_id: number;
  project_id: number;
  name: string;
  created_at: string;
  project?: Project;
  data_items?: DataItem[];
  label_rules?: LabelRule[];
}

export interface DataItem {
  item_id: number;
  dataset_id: number;
  file_url: string;
  width?: number;
  height?: number;
  dataset?: DataSet;
}

// Labeling Types
export interface Label {
  label_id: number;
  label_name: string;
  color_code: string;
}

export interface LabelRule {
  rule_id: number;
  name: string;
  rule_content: string;
  labels?: Label[];
  datasets?: DataSet[];
}

// Assignment & Reviewing Types
export interface Assignment {
  assignment_id: number;
  project_id: number;
  dataset_id: number;
  annotator_id: number;
  reviewer_id: number;
  status: 'pending' | 'in_progress' | 'completed' | 'reviewed';
  project?: Project;
  dataset?: DataSet;
  annotator?: User;
  reviewer?: User;
}

export interface Reviewing {
  reviewing_id: number;
  assignment_id: number;
  annotator_id: number;
  label_id: number;
  geometry: string; // JSON string for annotation coordinates
  status: 'pending' | 'approved' | 'rejected';
  is_improved: boolean;
  reviewer_id: number;
  assignment?: Assignment;
  annotator?: User;
  reviewer?: User;
  label?: Label;
  policies?: Policy[];
}

// Policy & Quality Control Types
export interface Policy {
  policy_id: number;
  error_name: string;
  description: string;
  projects?: Project[];
  reviews?: Reviewing[];
}

// Activity Logging
export interface ActivityLog {
  activity_id: number;
  user_id: number;
  action: string;
  target: string;
  created_at: string;
  user?: User;
}

// Relationship Types
export interface DataSetLabelRule {
  dataset_id: number;
  rule_id: number;
}

export interface LabelRuleLabel {
  rule_id: number;
  label_id: number;
}

export interface DataSetReviewing {
  dataset_id: number;
  reviewing_id: number;
  added_at: string;
}

export interface ProjectPolicy {
  project_id: number;
  policy_id: number;
  created_at: string;
}

export interface PolicyReviewing {
  policy_id: number;
  reviewing_id: number;
  comment?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Dashboard Statistics
export interface DashboardStats {
  total_users: number;
  active_projects: number;
  completed_tasks: number;
  total_datasets: number;
  pending_reviews: number;
  quality_score: number;
}

// Form Types for Creating/Updating
export interface CreateUserRequest {
  username: string;
  password: string;
  full_name: string;
  email: string;
  role_id: number;
}

export interface CreateProjectRequest {
  name: string;
  data_type: 'image' | 'text' | 'video' | 'audio';
  manager_id: number;
}

export interface CreateDataSetRequest {
  project_id: number;
  name: string;
}

export interface CreateLabelRequest {
  label_name: string;
  color_code: string;
}

export interface CreateAssignmentRequest {
  project_id: number;
  dataset_id: number;
  annotator_id: number;
  reviewer_id: number;
}

// Filter & Search Types
export interface UserFilter {
  role_id?: number;
  status?: 'active' | 'inactive';
  search?: string;
}

export interface ProjectFilter {
  status?: 'active' | 'completed' | 'paused';
  manager_id?: number;
  data_type?: string;
}

export interface AssignmentFilter {
  status?: string;
  annotator_id?: number;
  reviewer_id?: number;
  project_id?: number;
}