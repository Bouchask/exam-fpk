// Module (Course) Service for FPK Exam Guard

import api, { getErrorMessage, useMockData } from './api';
import type {
  Module,
  ApiResponse,
  PaginatedResponse,
} from '../types';
import { mockModules, createPaginatedResponse } from './mockData';

const MODULE_ENDPOINTS = {
  LIST: '/modules',
  DETAIL: (id: number) => `/modules/${id}`,
  CREATE: '/modules',
  UPDATE: (id: number) => `/modules/${id}`,
  DELETE: (id: number) => `/modules/${id}`,
  BY_FILIER: (filierId: number) => `/modules/filier/${filierId}`,
  BY_PROFESSOR: (professorId: number) => `/modules/professor/${professorId}`,
};

export const moduleService = {
  /**
   * Get all modules
   */
  async getAll(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Module>> {
    if (useMockData) {
      return createPaginatedResponse<Module>(mockModules, page, perPage, mockModules.length);
    }
    try {
      const response = await api.get<PaginatedResponse<Module>>(MODULE_ENDPOINTS.LIST, {
        params: { page, per_page: perPage },
      });
      return response.data;
    } catch (error) {
      console.warn('Backend not available for modules list, using mock data');
      return createPaginatedResponse<Module>(mockModules, page, perPage, mockModules.length);
    }
  },

  /**
   * Get a single module by ID
   */
  async getById(id: number): Promise<ApiResponse<Module>> {
    try {
      const response = await api.get<ApiResponse<Module>>(MODULE_ENDPOINTS.DETAIL(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get modules by filier
   */
  async getByFilier(filierId: number): Promise<ApiResponse<Module[]>> {
    try {
      const response = await api.get<ApiResponse<Module[]>>(MODULE_ENDPOINTS.BY_FILIER(filierId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get modules by professor
   */
  async getByProfessor(professorId: number): Promise<ApiResponse<Module[]>> {
    try {
      const response = await api.get<ApiResponse<Module[]>>(MODULE_ENDPOINTS.BY_PROFESSOR(professorId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Create a new module
   */
  async create(moduleData: {
    name: string;
    code?: string;
    filier_id: number;
    professor_id: number;
    hours?: number;
    description?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<Module>> {
    try {
      const response = await api.post<ApiResponse<Module>>(MODULE_ENDPOINTS.CREATE, moduleData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Update a module
   */
  async update(id: number, moduleData: Partial<Module>): Promise<ApiResponse<Module>> {
    try {
      const response = await api.put<ApiResponse<Module>>(
        MODULE_ENDPOINTS.UPDATE(id),
        moduleData
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Delete a module
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete<ApiResponse<null>>(MODULE_ENDPOINTS.DELETE(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },
};

export default moduleService;
