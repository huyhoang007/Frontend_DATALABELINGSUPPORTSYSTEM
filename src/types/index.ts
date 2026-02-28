// User types
export interface User {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  status: string;
  role: Role;
  createdAt: string;
}

export interface Role {
  roleId: number;
  roleName: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  roleId: number;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  username: string;
  role: string;
}

// Project types (for future use)
export interface Project {
  projectId: number;
  projectName: string;
  description: string;
  status: string;
  createdBy: User;
  createdAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}