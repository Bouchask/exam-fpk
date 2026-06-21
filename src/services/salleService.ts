// Salle (Room) Service for FPK Exam Guard

import api, { getErrorMessage, useMockData } from './api';
import type {
  Salle,
  Exam,
  ApiResponse,
  PaginatedResponse,
} from '../types';
import { mockSalles, createPaginatedResponse } from './mockData';

const SALLE_ENDPOINTS = {
  LIST: '/salles',
  DETAIL: (id: number) => `/salles/${id}`,
  CREATE: '/salles',
  UPDATE: (id: number) => `/salles/${id}`,
  DELETE: (id: number) => `/salles/${id}`,
  EXAMS: (id: number) => `/salles/${id}/exams`,
  TYPES: '/salles/types',
  BUILDINGS: '/salles/buildings',
};

export const salleService = {
  /**
   * Get all salles (rooms)
   */
  async getAll(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Salle>> {
    if (useMockData) {
      return createPaginatedResponse<Salle>(mockSalles, page, perPage, mockSalles.length);
    }
    try {
      const response = await api.get<PaginatedResponse<Salle>>(SALLE_ENDPOINTS.LIST, {
        params: { page, per_page: perPage },
      });
      return response.data;
    } catch (error) {
      console.warn('Backend not available for salles list, using mock data');
      return createPaginatedResponse<Salle>(mockSalles, page, perPage, mockSalles.length);
    }
  },

  /**
   * Get a single salle by ID
   */
  async getById(id: number): Promise<ApiResponse<Salle>> {
    try {
      const response = await api.get<ApiResponse<Salle>>(SALLE_ENDPOINTS.DETAIL(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Create a new salle
   */
  async create(salleData: {
    name: string;
    code: string;
    capacity?: number;
    type?: string;
    floor?: string;
    building?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<Salle>> {
    try {
      const response = await api.post<ApiResponse<Salle>>(SALLE_ENDPOINTS.CREATE, salleData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Update a salle
   */
  async update(id: number, salleData: Partial<Salle>): Promise<ApiResponse<Salle>> {
    try {
      const response = await api.put<ApiResponse<Salle>>(
        SALLE_ENDPOINTS.UPDATE(id),
        salleData
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Delete a salle
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete<ApiResponse<null>>(SALLE_ENDPOINTS.DELETE(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get all exams in a salle
   */
  async getExams(salleId: number): Promise<ApiResponse<Exam[]>> {
    try {
      const response = await api.get<ApiResponse<Exam[]>>(SALLE_ENDPOINTS.EXAMS(salleId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get all salle types
   */
  async getTypes(): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.get<ApiResponse<string[]>>(SALLE_ENDPOINTS.TYPES);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get all building names
   */
  async getBuildings(): Promise<ApiResponse<string[]>> {
    try {
      const response = await api.get<ApiResponse<string[]>>(SALLE_ENDPOINTS.BUILDINGS);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get active salles only
   */
  async getActive(): Promise<ApiResponse<Salle[]>> {
    try {
      const response = await api.get<ApiResponse<Salle[]>>(
        `${SALLE_ENDPOINTS.LIST}?is_active=true`
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },
};

export default salleService;
