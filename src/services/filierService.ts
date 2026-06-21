// Filier (Field of Study) Service for FPK Exam Guard

import api, { getErrorMessage, useMockData } from './api';
import type {
  Filier,
  ApiResponse,
  PaginatedResponse,
} from '../types';
import { mockFilieres, createPaginatedResponse } from './mockData';

const FILIER_ENDPOINTS = {
  LIST: '/filieres',
  DETAIL: (id: number) => `/filieres/${id}`,
  CREATE: '/filieres',
  UPDATE: (id: number) => `/filieres/${id}`,
  DELETE: (id: number) => `/filieres/${id}`,
  BY_DEPARTMENT: (departmentId: number) => `/filieres/department/${departmentId}`,
  MODULES: (id: number) => `/filieres/${id}/modules`,
  PROFESSORS: (id: number) => `/filieres/${id}/professors`,
};

export const filierService = {
  /**
   * Get all filieres
   */
  async getAll(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Filier>> {
    if (useMockData) {
      return createPaginatedResponse<Filier>(mockFilieres, page, perPage, mockFilieres.length);
    }
    try {
      const response = await api.get<PaginatedResponse<Filier>>(FILIER_ENDPOINTS.LIST, {
        params: { page, per_page: perPage },
      });
      return response.data;
    } catch (error) {
      console.warn('Backend not available for filieres list, using mock data');
      return createPaginatedResponse<Filier>(mockFilieres, page, perPage, mockFilieres.length);
    }
  },

  /**
   * Get a single filier by ID
   */
  async getById(id: number): Promise<ApiResponse<Filier>> {
    try {
      const response = await api.get<ApiResponse<Filier>>(FILIER_ENDPOINTS.DETAIL(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get filieres by department
   */
  async getByDepartment(departmentId: number): Promise<ApiResponse<Filier[]>> {
    try {
      const response = await api.get<ApiResponse<Filier[]>>(FILIER_ENDPOINTS.BY_DEPARTMENT(departmentId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Create a new filier
   */
  async create(filierData: {
    name: string;
    code?: string;
    department_id: number;
    max_modules?: number;
    description?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<Filier>> {
    try {
      const response = await api.post<ApiResponse<Filier>>(FILIER_ENDPOINTS.CREATE, filierData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Update a filier
   */
  async update(id: number, filierData: Partial<Filier>): Promise<ApiResponse<Filier>> {
    try {
      const response = await api.put<ApiResponse<Filier>>(
        FILIER_ENDPOINTS.UPDATE(id),
        filierData
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Delete a filier
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete<ApiResponse<null>>(FILIER_ENDPOINTS.DELETE(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get modules for a filier
   */
  async getModules(filierId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(FILIER_ENDPOINTS.MODULES(filierId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get professors for a filier
   */
  async getProfessors(filierId: number): Promise<ApiResponse<any>> {
    try {
      const response = await api.get<ApiResponse<any>>(FILIER_ENDPOINTS.PROFESSORS(filierId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },
};

export default filierService;
