import axios from 'axios';
import { AuthResponse, LoginRequest, RegisterRequest } from '../types';

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
  const token = localStorage.getItem('token');
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

export default api;