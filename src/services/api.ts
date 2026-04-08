import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

// LEGACY SERVICE LAYER:
// Newer screens mostly use src/api/* together with src/api/apiClient.js.
// This file is still used by some manager error/policy screens, so do not remove yet.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<string> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
};

// Users API (for admin)
export const usersAPI = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  getUserById: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Projects API (for future implementation)
export const projectsAPI = {
  getAllProjects: async () => {
    const response = await api.get('/projects');
    return response.data;
  },

  createProject: async (data: any) => {
    const response = await api.post('/projects', data);
    return response.data;
  },

  updateProject: async (id: number, data: any) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  deleteProject: async (id: number) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
};

// Policies API (Error Types)
export const policiesAPI = {
  getAll: async (page = 0, size = 100) => {
    const response = await api.get('/policies', { params: { page, size } });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/policies/${id}`);
    return response.data;
  },

  create: async (data: { errorName: string; description?: string; errorLevel?: string }) => {
    const response = await api.post('/policies', data);
    return response.data;
  },

  update: async (id: number, data: { errorName?: string; description?: string; errorLevel?: string }) => {
    const response = await api.put(`/policies/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await api.delete(`/policies/${id}`);
    return response.data;
  },

  getByProject: async (projectId: number) => {
    const response = await api.get(`/policies/project/${projectId}`);
    return response.data;
  },

  assignToProject: async (projectId: number, policyId: number) => {
    const response = await api.post('/policies/assign', null, {
      params: { projectId, policyId },
    });
    return response.data;
  },

  removeFromProject: async (projectId: number, policyId: number) => {
    const response = await api.delete('/policies/remove', {
      params: { projectId, policyId },
    });
    return response.data;
  },

  getByErrorLevel: async (errorLevel: string, page = 0, size = 20) => {
    const response = await api.get(`/policies/error-level/${errorLevel}`, {
      params: { page, size },
    });
    return response.data;
  },
};

export default api;
