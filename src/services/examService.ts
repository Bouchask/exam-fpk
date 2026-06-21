// Exam Service for FPK Exam Guard

import api, { getErrorMessage, useMockData } from './api';
import type {
  Exam,
  Assignment,
  CreateExamRequest,
  ApiResponse,
  PaginatedResponse,
  ExamFilterParams,
} from '../types';
import { mockExams, createPaginatedResponse, createSuccessResponse } from './mockData';

const EXAM_ENDPOINTS = {
  LIST: '/exams',
  DETAIL: (id: number) => `/exams/${id}`,
  CREATE: '/exams',
  UPDATE: (id: number) => `/exams/${id}`,
  DELETE: (id: number) => `/exams/${id}`,
  ASSIGN: (id: number) => `/exams/${id}/assign`,
  ASSIGNMENTS: (id: number) => `/exams/${id}/assignments`,
  UNASSIGN: (examId: number, professorId: number) => `/exams/${examId}/unassign/${professorId}`,
  UPCOMING: '/exams/upcoming',
  BY_MODULE: (moduleId: number) => `/exams/module/${moduleId}`,
};

export const examService = {
  /**
   * Get all exams
   */
  async getAll(params?: ExamFilterParams): Promise<PaginatedResponse<Exam>> {
    if (useMockData) {
      return createPaginatedResponse<Exam>(mockExams, params?.page || 1, params?.per_page || 10, mockExams.length);
    }
    try {
      const response = await api.get<PaginatedResponse<Exam>>(EXAM_ENDPOINTS.LIST, { params });
      return response.data;
    } catch (error) {
      console.warn('Backend not available for exams list, using mock data');
      return createPaginatedResponse<Exam>(mockExams, params?.page || 1, params?.per_page || 10, mockExams.length);
    }
  },

  /**
   * Get a single exam by ID
   */
  async getById(id: number): Promise<ApiResponse<Exam>> {
    if (useMockData) {
      const exam = mockExams.find(e => e.id === id);
      if (exam) return createSuccessResponse(exam);
      throw new Error('Exam not found');
    }
    try {
      const response = await api.get<ApiResponse<Exam>>(EXAM_ENDPOINTS.DETAIL(id));
      return response.data;
    } catch (error) {
      console.warn('Backend not available for exam by ID, using mock data');
      const exam = mockExams.find(e => e.id === id);
      if (exam) return createSuccessResponse(exam);
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Create a new exam
   */
  async create(examData: CreateExamRequest): Promise<ApiResponse<Exam>> {
    try {
      const response = await api.post<ApiResponse<Exam>>(EXAM_ENDPOINTS.CREATE, examData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Update an exam
   */
  async update(id: number, examData: Partial<CreateExamRequest>): Promise<ApiResponse<Exam>> {
    try {
      const response = await api.put<ApiResponse<Exam>>(EXAM_ENDPOINTS.UPDATE(id), examData);
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Delete an exam
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    try {
      const response = await api.delete<ApiResponse<null>>(EXAM_ENDPOINTS.DELETE(id));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Assign a professor to an exam
   */
  async assignProfessor(examId: number, professorId: number, notes?: string): Promise<ApiResponse<Assignment>> {
    try {
      const response = await api.post<ApiResponse<Assignment>>(EXAM_ENDPOINTS.ASSIGN(examId), {
        professor_id: professorId,
        notes: notes || '',
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get all assignments for an exam
   */
  async getAssignments(examId: number): Promise<ApiResponse<Assignment[]>> {
    try {
      const response = await api.get<ApiResponse<Assignment[]>>(EXAM_ENDPOINTS.ASSIGNMENTS(examId));
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Unassign a professor from an exam
   */
  async unassignProfessor(examId: number, professorId: number): Promise<ApiResponse<null>> {
    try {
      const response = await api.post<ApiResponse<null>>(
        EXAM_ENDPOINTS.UNASSIGN(examId, professorId)
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get upcoming exams
   */
  async getUpcoming(page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Exam>> {
    try {
      const response = await api.get<PaginatedResponse<Exam>>(EXAM_ENDPOINTS.UPCOMING, {
        params: { page, per_page: perPage },
      });
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get exams by department
   */
  async getByDepartment(departmentId: number): Promise<ApiResponse<Exam[]>> {
    try {
      const response = await api.get<ApiResponse<Exam[]>>(
        `${EXAM_ENDPOINTS.LIST}?department_id=${departmentId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get exams by salle
   */
  async getBySalle(salleId: number): Promise<ApiResponse<Exam[]>> {
    try {
      const response = await api.get<ApiResponse<Exam[]>>(
        `${EXAM_ENDPOINTS.LIST}?salle_id=${salleId}`
      );
      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error as Error));
    }
  },

  /**
   * Get exams by module
   */
  async getByModule(moduleId: number): Promise<ApiResponse<Exam[]>> {
    if (useMockData) {
      const exams = mockExams.filter(e => e.module_id === moduleId);
      return createSuccessResponse(exams);
    }
    try {
      const response = await api.get<ApiResponse<Exam[]>>(EXAM_ENDPOINTS.BY_MODULE(moduleId));
      return response.data;
    } catch (error) {
      console.warn('Backend endpoint not available for exams by module, using filter on all exams');
      // Fallback: get all exams and filter by module_id
      const allExams = await examService.getAll();
      const filteredExams = allExams.data?.filter(e => e.module_id === moduleId) || [];
      return createSuccessResponse(filteredExams);
    }
  },
};

export default examService;
