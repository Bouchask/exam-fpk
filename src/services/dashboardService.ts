// Dashboard Service for FPK Exam Guard

import api, { getErrorMessage, useMockData } from './api';
import axios from 'axios';
import type {
  DashboardOverview,
  AdminStats,
  ProfessorDashboardOverview,
  CalendarEvent,
  ApiResponse,
  Exam,
  Incident,
  Assignment,
} from '../types';
import { 
  mockDashboardOverview, 
  mockExams,
  mockAssignments,
  mockIncidents,
  createSuccessResponse 
} from './mockData';

const DASHBOARD_ENDPOINTS = {
  OVERVIEW: '/dashboard/overview',
  STATS: '/dashboard/stats',
  EXAM_CALENDAR: '/dashboard/exam-calendar',
  NOTIFICATIONS: '/dashboard/notifications',
};

export const dashboardService = {
  /**
   * Get dashboard overview (role-specific)
   */
  async getOverview(): Promise<ApiResponse<DashboardOverview>> {
    if (useMockData) {
      return createSuccessResponse(mockDashboardOverview);
    }
    try {
      const response = await api.get<ApiResponse<DashboardOverview>>(DASHBOARD_ENDPOINTS.OVERVIEW);
      return response.data;
    } catch (error) {
      console.warn('Backend not available for dashboard overview, using mock data');
      // Don't use mock data for auth errors (401/403) - let them propagate
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          throw new Error(getErrorMessage(error));
        }
      }
      return createSuccessResponse(mockDashboardOverview);
    }
  },

  /**
   * Get detailed statistics (role-specific)
   */
  async getStats(): Promise<ApiResponse<AdminStats | any>> {
    if (useMockData) {
      return createSuccessResponse({
        total_professors: 48,
        total_exams: 124,
        allocation_rate: '82%',
        average_quota_usage: '65%',
      });
    }
    try {
      const response = await api.get<ApiResponse<AdminStats>>(DASHBOARD_ENDPOINTS.STATS);
      return response.data;
    } catch (error) {
      console.warn('Backend not available for stats, using mock data');
      return createSuccessResponse({
        total_professors: 48,
        total_exams: 124,
        allocation_rate: '82%',
        average_quota_usage: '65%',
      });
    }
  },

  /**
   * Get exam calendar data
   */
  async getExamCalendar(startDate?: string, endDate?: string): Promise<ApiResponse<CalendarEvent[]>> {
    if (useMockData) {
      const calendarEvents = mockExams.map(exam => ({
        id: exam.id,
        title: exam.module || 'Exam',
        start: new Date(`${exam.date}T${exam.start_time}`).toISOString(),
        end: new Date(`${exam.date}T${exam.end_time}`).toISOString(),
        allDay: false,
      }));
      return createSuccessResponse(calendarEvents);
    }
    try {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await api.get<ApiResponse<CalendarEvent[]>>(DASHBOARD_ENDPOINTS.EXAM_CALENDAR, { params });
      return response.data;
    } catch (error) {
      console.warn('Backend not available for exam calendar, using mock data');
      const calendarEvents = mockExams.map(exam => ({
        id: exam.id,
        title: exam.module || 'Exam',
        start: new Date(`${exam.date}T${exam.start_time}`).toISOString(),
        end: new Date(`${exam.date}T${exam.end_time}`).toISOString(),
        allDay: false,
      }));
      return createSuccessResponse(calendarEvents);
    }
  },

  /**
   * Get user notifications
   */
  async getNotifications(): Promise<ApiResponse<{
    incidents?: Incident[];
    upcoming_assignments?: Assignment[];
    pending_incidents?: Incident[];
    exams_without_professors?: Exam[];
  }>> {
    if (useMockData) {
      return createSuccessResponse({
        incidents: mockIncidents,
        upcoming_assignments: mockAssignments,
        pending_incidents: [],
        exams_without_professors: [],
      });
    }
    try {
      const response = await api.get(DASHBOARD_ENDPOINTS.NOTIFICATIONS);
      return response.data;
    } catch (error) {
      console.warn('Backend not available for notifications, using mock data');
      return createSuccessResponse({
        incidents: mockIncidents,
        upcoming_assignments: mockAssignments,
        pending_incidents: [],
        exams_without_professors: [],
      });
    }
  },

  /**
   * Get professor-specific dashboard overview
   */
  async getProfessorOverview(): Promise<ApiResponse<ProfessorDashboardOverview>> {
    if (useMockData) {
      return createSuccessResponse({
        professor: {
          id: 2,
          name: 'Sarah Connor',
          department: 'Computer Science',
          institutional_grade: 'PR',
        },
        quota: {
          status: '2/4',
          percentage: 50,
          is_full: false,
        },
        next_duty: mockAssignments[0],
        active_assignments_count: mockAssignments.length,
        active_assignments: mockAssignments,
      } as ProfessorDashboardOverview);
    }
    try {
      const response = await api.get<ApiResponse<ProfessorDashboardOverview>>(DASHBOARD_ENDPOINTS.OVERVIEW);
      return response.data;
    } catch (error) {
      console.warn('Backend not available for professor overview, using mock data');
      return createSuccessResponse({
        professor: {
          id: 2,
          name: 'Sarah Connor',
          department: 'Computer Science',
          institutional_grade: 'PR',
        },
        quota: {
          status: '2/4',
          percentage: 50,
          is_full: false,
        },
        next_duty: mockAssignments[0],
        active_assignments_count: mockAssignments.length,
        active_assignments: mockAssignments,
      } as ProfessorDashboardOverview);
    }
  },

  /**
   * Get professor statistics
   */
  async getProfessorStats(): Promise<ApiResponse<any>> {
    if (useMockData) {
      return createSuccessResponse({
        total_assignments: 5,
        completed_assignments: 2,
        pending_assignments: 3,
        incidents_reported: 2,
        quota_usage: '50%',
      });
    }
    try {
      // This will call the same endpoint but return professor-specific data
      const response = await api.get<ApiResponse<any>>(DASHBOARD_ENDPOINTS.STATS);
      return response.data;
    } catch (error) {
      console.warn('Backend not available for professor stats, using mock data');
      return createSuccessResponse({
        total_assignments: 5,
        completed_assignments: 2,
        pending_assignments: 3,
        incidents_reported: 2,
        quota_usage: '50%',
      });
    }
  },
};

export default dashboardService;
