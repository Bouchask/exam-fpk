// Department Service for FPK Exam Guard

import api, { getErrorMessage, useMockData } from './api';
import type {
  Department,
  ApiResponse,
  PaginatedResponse,
} from '../types';
import { mockDepartments, mockProfessors, mockExams, createSuccessResponse, createPaginatedResponse } from './mockData';

const DEPARTMENT_ENDPOINTS = {
  LIST: '/departments',
  DETAIL: (id: number) => `/departments/${id}`,
  CREATE: '/departments',
  UPDATE: (id: number) => `/departments/${id}`,
  DELETE: (id: number) => `/departments/${id}`,
  PROFESSORS: (id: number) => `/departments/${id}/professors`,
  EXAMS: (id: number) => `/departments/${id}/exams`,
  STATS: '/departments/stats',
};

export const departmentService = {
  /**
   * Get all departments
   */
  async getAll(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Department>> {
    if (useMockData) {
      return createPaginatedResponse<Department>(mockDepartments, page, perPage, mockDepartments.length);
    }
    try {
      const response = await api.get<PaginatedResponse<Department>>(DEPARTMENT_ENDPOINTS.LIST, {
        params: { page, per_page: perPage },
      });
      return response.data;
    } catch (error) {
      console.warn('Backend not available for departments list, using mock data');
      return createPaginatedResponse<Department>(mockDepartments, page, perPage, mockDepartments.length);
    }
  },

  /**
   * Get a single department by ID
   */
  async getById(id: number): Promise<ApiResponse<Department>> {
    try {
      const response = await api.get<ApiResponse<Department>>(DEPARTMENT_ENDPOINTS.DETAIL(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Create a new department
   */
  async create(departmentData: {
    name: string;
    code?: string;
    head_id?: number;
    staff_count?: number;
  }): Promise<ApiResponse<Department>> {
    try {
      const response = await api.post<ApiResponse<Department>>(
        DEPARTMENT_ENDPOINTS.CREATE,
        departmentData
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Update a department
   */
  async update(id: number, departmentData: Partial<Department>): Promise<ApiResponse<Department>> {
    try {
      const response = await api.put<ApiResponse<Department>>(
        DEPARTMENT_ENDPOINTS.UPDATE(id),
        departmentData
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Delete a department
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete<ApiResponse<null>>(DEPARTMENT_ENDPOINTS.DELETE(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get all professors in a department
   */
  async getProfessors(departmentId: number): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get<ApiResponse<any[]>>(DEPARTMENT_ENDPOINTS.PROFESSORS(departmentId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get all exams in a department
   */
  async getExams(departmentId: number): Promise<ApiResponse<any[]>> {
    try {
      const response = await api.get<ApiResponse<any[]>>(DEPARTMENT_ENDPOINTS.EXAMS(departmentId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get department statistics
   */
  async getStats(): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(DEPARTMENT_ENDPOINTS.STATS);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },
};

export default departmentService;
