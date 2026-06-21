// Assignment Service for FPK Exam Guard

import api, { getErrorMessage, useMockData } from './api';
import type {
  Assignment,
  AssignmentHistory,
  Incident,
  CreateIncidentRequest,
  ApiResponse,
  PaginatedResponse,
  AssignmentFilterParams,
} from '../types';
import { 
  mockAssignments, 
  createPaginatedResponse 
} from './mockData';

const ASSIGNMENT_ENDPOINTS = {
  LIST: '/assignments',
  DETAIL: (id: number) => `/assignments/${id}`,
  UPDATE: (id: number) => `/assignments/${id}`,
  DELETE: (id: number) => `/assignments/${id}`,
  COMPLETE: (id: number) => `/assignments/${id}/complete`,
  INCIDENTS: (id: number) => `/assignments/${id}/incidents`,
  UPCOMING: '/assignments/my/upcoming',
  HISTORY: '/assignments/my/history',
  NEXT: '/assignments/my/next',
};

export const assignmentService = {
  /**
   * Get all assignments
   */
  async getAll(params?: AssignmentFilterParams): Promise<PaginatedResponse<Assignment>> {
    if (useMockData) {
      return createPaginatedResponse<Assignment>(
        mockAssignments, 
        params?.page || 1, 
        params?.per_page || 10, 
        mockAssignments.length
      );
    }
    try {
      const response = await api.get<PaginatedResponse<Assignment>>(ASSIGNMENT_ENDPOINTS.LIST, { params });
      return response.data;
    } catch (error) {
      console.warn('Backend not available for assignments list, using mock data');
      return createPaginatedResponse<Assignment>(
        mockAssignments, 
        params?.page || 1, 
        params?.per_page || 10, 
        mockAssignments.length
      );
    }
  },

  /**
   * Get a single assignment by ID
   */
  async getById(id: number): Promise<ApiResponse<Assignment>> {
    try {
      const response = await api.get<ApiResponse<Assignment>>(ASSIGNMENT_ENDPOINTS.DETAIL(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Update an assignment
   */
  async update(id: number, assignmentData: Partial<Assignment>): Promise<ApiResponse<Assignment>> {
    try {
      const response = await api.put<ApiResponse<Assignment>>(
        ASSIGNMENT_ENDPOINTS.UPDATE(id),
        assignmentData
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Delete an assignment
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete<ApiResponse<null>>(ASSIGNMENT_ENDPOINTS.DELETE(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Mark an assignment as completed
   */
  async complete(id: number): Promise<ApiResponse<{ assignment: Assignment; history: AssignmentHistory }>> {
    try {
      const response = await api.post<ApiResponse<{ assignment: Assignment; history: AssignmentHistory }>>(
        ASSIGNMENT_ENDPOINTS.COMPLETE(id)
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get incidents for an assignment
   */
  async getIncidents(assignmentId: number): Promise<ApiResponse<Incident[]>> {
    try {
      const response = await api.get<ApiResponse<Incident[]>>(ASSIGNMENT_ENDPOINTS.INCIDENTS(assignmentId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Create an incident for an assignment
   */
  async createIncident(assignmentId: number, incidentData: CreateIncidentRequest): Promise<ApiResponse<Incident>> {
    try {
      const response = await api.post<ApiResponse<Incident>>(
        ASSIGNMENT_ENDPOINTS.INCIDENTS(assignmentId),
        incidentData
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get current user's upcoming assignments
   */
  async getMyUpcoming(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Assignment>> {
    try {
      const response = await api.get<PaginatedResponse<Assignment>>(
        ASSIGNMENT_ENDPOINTS.UPCOMING,
        { params: { page, per_page: perPage } }
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get current user's assignment history
   */
  async getMyHistory(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<AssignmentHistory>> {
    try {
      const response = await api.get<PaginatedResponse<AssignmentHistory>>(
        ASSIGNMENT_ENDPOINTS.HISTORY,
        { params: { page, per_page: perPage } }
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get current user's next assignment
   */
  async getMyNext(): Promise<ApiResponse<Assignment | null>> {
    try {
      const response = await api.get<ApiResponse<Assignment | null>>(ASSIGNMENT_ENDPOINTS.NEXT);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get assignments by professor
   */
  async getByProfessor(professorId: number): Promise<ApiResponse<Assignment[]>> {
    try {
      const response = await api.get<ApiResponse<Assignment[]>>(
        `${ASSIGNMENT_ENDPOINTS.LIST}?professor_id=${professorId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get assignments by exam
   */
  async getByExam(examId: number): Promise<ApiResponse<Assignment[]>> {
    try {
      const response = await api.get<ApiResponse<Assignment[]>>(
        `${ASSIGNMENT_ENDPOINTS.LIST}?exam_id=${examId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },
};

export default assignmentService;
