// Professor Service for FPK Exam Guard

import api, { getErrorMessage, useMockData } from './api';
import axios from 'axios';
import type {
  Professor,
  ApiResponse,
  PaginatedResponse,
} from '../types';
import { 
  mockProfessors, 
  createPaginatedResponse,
  createSuccessResponse 
} from './mockData';

const PROFESSOR_ENDPOINTS = {
  LIST: '/professors',
  DETAIL: (id: number) => `/professors/${id}`,
  CREATE: '/professors',
  UPDATE: (id: number) => `/professors/${id}`,
  DELETE: (id: number) => `/professors/${id}`,
  ASSIGNMENTS: (id: number) => `/professors/${id}/assignments`,
  QUOTA: (id: number) => `/professors/${id}/quota`,
  QUOTA_RESET: (id: number) => `/professors/${id}/quota/reset`,
  MY_ASSIGNMENTS: '/professors/me/assignments',
};

export const professorService = {
  /**
   * Get all professors
   */
  async getAll(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Professor>> {
    if (useMockData) {
      return createPaginatedResponse<Professor>(mockProfessors, page, perPage, mockProfessors.length);
    }
    try {
      const response = await api.get<PaginatedResponse<Professor>>(PROFESSOR_ENDPOINTS.LIST, {
        params: { page, per_page: perPage },
      });
      return response.data;
    } catch (error) {
      console.warn('Backend not available for professors list, using mock data');
      // Don't use mock data for auth errors (401/403) - let them propagate
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          throw new Error(getErrorMessage(error));
        }
      }
      return createPaginatedResponse<Professor>(mockProfessors, page, perPage, mockProfessors.length);
    }
  },

  /**
   * Get a single professor by ID
   */
  async getById(id: number): Promise<ApiResponse<Professor>> {
    if (useMockData) {
      const professor = mockProfessors.find(p => p.id === id);
      if (professor) {
        return createSuccessResponse(professor);
      }
      throw new Error('Professor not found');
    }
    try {
      const response = await api.get<ApiResponse<Professor>>(PROFESSOR_ENDPOINTS.DETAIL(id));
      return response.data;
    } catch (error) {
      console.warn('Backend not available for professor by ID, using mock data');
      const professor = mockProfessors.find(p => p.id === id);
      if (professor) {
        return createSuccessResponse(professor);
      }
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Create a new professor
   */
  async create(professorData: {
    username: string;
    password: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'professor';
    institutional_grade?: string;
    department_id?: number;
    academic_title?: string;
    max_guards?: number;
  }): Promise<ApiResponse<Professor>> {
    try {
      const response = await api.post<ApiResponse<Professor>>(PROFESSOR_ENDPOINTS.CREATE, professorData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Update a professor
   */
  async update(id: number, professorData: Partial<Professor>): Promise<ApiResponse<Professor>> {
    try {
      const response = await api.put<ApiResponse<Professor>>(
        PROFESSOR_ENDPOINTS.UPDATE(id),
        professorData
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Delete a professor
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete<ApiResponse<null>>(PROFESSOR_ENDPOINTS.DELETE(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get professor's assignments
   */
  async getAssignments(professorId: number): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get<ApiResponse<any[]>>(PROFESSOR_ENDPOINTS.ASSIGNMENTS(professorId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get professor's quota information
   */
  async getQuota(professorId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(PROFESSOR_ENDPOINTS.QUOTA(professorId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Reset professor's quota
   */
  async resetQuota(professorId: number): Promise<ApiResponse<null>> {
    try {
      const response = await api.post<ApiResponse<null>>(PROFESSOR_ENDPOINTS.QUOTA_RESET(professorId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get current user's assignments (for professors)
   */
  async getMyAssignments(): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get<ApiResponse<any[]>>(PROFESSOR_ENDPOINTS.MY_ASSIGNMENTS);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get professors by department
   */
  async getByDepartment(departmentId: number): Promise<ApiResponse<Professor[]>> {
    try {
      const response = await api.get<ApiResponse<Professor[]>>(
        `${PROFESSOR_ENDPOINTS.LIST}?department_id=${departmentId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },
};

export default professorService;
