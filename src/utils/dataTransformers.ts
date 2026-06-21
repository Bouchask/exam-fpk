// Data transformers to convert backend API responses to frontend format

import type { Professor, Exam, Assignment, Incident, Department, Salle, AssignmentHistory } from '../types';

// Type aliases for backend types
type BackendProfessor = Professor;
type BackendExam = Exam;
type BackendAssignment = Assignment;
type BackendIncident = Incident;
type BackendDepartment = Department;
type BackendSalle = Salle;
type BackendAssignmentHistory = AssignmentHistory;

// ============================================
// Professor Transformers
// ============================================

export interface FrontendProfessor {
  id: number;
  name: string;
  dept: string;
  guards: number;
}

export function transformProfessor(professor: BackendProfessor): FrontendProfessor {
  return {
    id: professor.id,
    name: professor.user?.full_name || professor.name || 'Unknown',
    dept: professor.department || 'Unknown',
    guards: professor.completed_guards,
  };
}

export function transformProfessors(professors: BackendProfessor[]): FrontendProfessor[] {
  return professors.map(transformProfessor);
}

// ============================================
// Exam Transformers
// ============================================

export interface FrontendExam {
  id: number;
  module: string;
  date: string;
  time: string;
  type: string;
  room: string;
}

export function transformExam(exam: BackendExam): FrontendExam {
  const salle = exam.salle as Salle | string;
  const room = typeof salle === 'string' ? salle : salle?.name || 'N/A';
  return {
    id: exam.id,
    module: exam.module,
    date: exam.date || 'N/A',
    time: exam.start_time || 'N/A',
    type: exam.exam_type,
    room,
  };
}

export function transformExams(exams: BackendExam[]): FrontendExam[] {
  return exams.map(transformExam);
}

// ============================================
// Department Transformers
// ============================================

export interface FrontendDepartment {
  id: number;
  name: string;
  head: string;
  staff: number;
}

export function transformDepartment(dept: BackendDepartment): FrontendDepartment {
  return {
    id: dept.id,
    name: dept.name,
    head: dept.head_name || 'N/A',
    staff: dept.staff_count,
  };
}

export function transformDepartments(departments: BackendDepartment[]): FrontendDepartment[] {
  return departments.map(transformDepartment);
}

// ============================================
// Salle Transformers
// ============================================

export interface FrontendSalle {
  id: number;
  name: string;
  code: string;
  capacity: number;
  type: string;
  floor: string;
  building: string;
  is_active: boolean;
}

export function transformSalle(salle: BackendSalle): FrontendSalle {
  return {
    id: salle.id,
    name: salle.name,
    code: salle.code || '',
    capacity: salle.capacity || 0,
    type: salle.type || '',
    floor: salle.floor || '',
    building: salle.building || '',
    is_active: salle.is_active,
  };
}

export function transformSalles(salles: BackendSalle[]): FrontendSalle[] {
  return salles.map(transformSalle);
}

// ============================================
// Assignment Transformers
// ============================================

export interface FrontendAssignment {
  id: number;
  module: string;
  date: string;
  time: string;
  room: string;
  status: string;
}

export function transformAssignment(assignment: BackendAssignment): FrontendAssignment {
  return {
    id: assignment.id,
    module: assignment.exam_module || 'Unknown',
    date: assignment.exam_date || 'N/A',
    time: assignment.exam_time || 'N/A',
    room: assignment.exam_room || 'N/A',
    status: assignment.status,
  };
}

export function transformAssignments(assignments: BackendAssignment[]): FrontendAssignment[] {
  return assignments.map(transformAssignment);
}

// ============================================
// Incident Transformers
// ============================================

export interface FrontendIncident {
  id: number;
  type: string;
  date: string;
  exam: string;
  status: string;
}

export function transformIncident(incident: BackendIncident): FrontendIncident {
  return {
    id: incident.id,
    type: incident.incident_type,
    date: new Date(incident.reported_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    exam: incident.related_exam || 'N/A',
    status: incident.status,
  };
}

export function transformIncidents(incidents: BackendIncident[]): FrontendIncident[] {
  return incidents.map(transformIncident);
}

// ============================================
// Assignment History Transformers
// ============================================

export interface FrontendAssignmentHistory {
  id: number;
  module: string;
  date: string;
  time: string;
  room: string;
  type: string;
}

export function transformAssignmentHistory(history: BackendAssignmentHistory): FrontendAssignmentHistory {
  return {
    id: history.id,
    module: history.exam_module || 'Unknown',
    date: history.exam_date || 'N/A',
    time: 'N/A', // Time not in history
    room: 'N/A', // Room not in history
    type: history.exam_type || 'N/A',
  };
}

export function transformAssignmentHistories(histories: BackendAssignmentHistory[]): FrontendAssignmentHistory[] {
  return histories.map(transformAssignmentHistory);
}

// ============================================
// Dashboard Data Transformers
// ============================================

export interface StatCard {
  label: string;
  value: string;
  icon: any;
  trend: string;
}

export interface QuotaData {
  name: string;
  value: number;
  color: string;
}

export interface DeptExamLoadData {
  name: string;
  value: number;
  color: string;
}

// Transform backend dashboard overview to frontend stat cards
export function transformStatsToCards(stats: any): StatCard[] {
  return [
    {
      label: 'Active Professors',
      value: stats.active_professors?.toString() || '0',
      icon: undefined, // Will be set in component
      trend: '+2',
    },
    {
      label: 'Scheduled Exams',
      value: stats.scheduled_exams?.toString() || '0',
      icon: undefined,
      trend: '+12%',
    },
    {
      label: 'Total Salles',
      value: stats.total_salles?.toString() || '0',
      icon: undefined,
      trend: '0',
    },
    {
      label: 'Allocation Rate',
      value: stats.allocation_rate || '0%',
      icon: undefined,
      trend: 'STABLE',
    },
  ];
}

// Transform quota distribution to chart data
export function transformQuotaDistribution(quotaDist: any): QuotaData[] {
  return [
    { name: '0 Guards', value: quotaDist['0_guards'] || 0, color: '#d7ccc8' },
    { name: '1-2 Guards', value: quotaDist['1_2_guards'] || 0, color: '#8d6e63' },
    { name: '3 Guards', value: quotaDist['3_guards'] || 0, color: '#4e342e' },
    { name: 'Maxed (4)', value: quotaDist['maxed_4'] || 0, color: '#1a1210' },
  ];
}

// Transform department exam load to chart data
export function transformDeptExamLoad(deptLoad: any): DeptExamLoadData[] {
  const colors = ['#4e342e', '#1a1210', '#8d6e63', '#d7ccc8'];
  return deptLoad.map((item: any, index: number) => ({
    name: item.name,
    value: item.value,
    color: colors[index % colors.length],
  }));
}

// ============================================
// Personal Exam Transformers (for Professor Portal)
// ============================================

export interface PersonalExam {
  id: number;
  module: string;
  date: string;
  time: string;
  room: string;
  status: string;
}

export function transformToPersonalExam(assignment: BackendAssignment): PersonalExam {
  return {
    id: assignment.id,
    module: assignment.exam_module || 'Unknown',
    date: assignment.exam_date || 'N/A',
    time: assignment.exam_time || 'N/A',
    room: assignment.exam_room || 'N/A',
    status: assignment.status,
  };
}

export function transformToPersonalExams(assignments: BackendAssignment[]): PersonalExam[] {
  return assignments.map(transformToPersonalExam);
}

// ============================================
// Calendar Event Transformers
// ============================================

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  room?: string;
  type?: string;
  professors?: string[];
  department?: string;
}

export function transformToCalendarEvent(exam: BackendExam): CalendarEvent {
  const startDate = new Date(`${exam.date}T${exam.start_time}`);
  const endDate = new Date(`${exam.date}T${exam.end_time}`);
  
  const salle = exam.salle as Salle | string;
  const salleName = typeof salle === 'string' ? salle : salle?.name || 'N/A';
  const dept = exam.department as Department | string;
  const deptName = typeof dept === 'string' ? dept : dept?.name || 'N/A';
  
  return {
    id: exam.id,
    title: exam.module,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
    room: salleName,
    type: exam.exam_type,
    professors: [], // Will be populated with assignment data
    department: deptName,
  };
}

export function transformToCalendarEvents(exams: BackendExam[]): CalendarEvent[] {
  return exams.map(transformToCalendarEvent);
}

export default {
  transformProfessor,
  transformProfessors,
  transformExam,
  transformExams,
  transformDepartment,
  transformDepartments,
  transformSalle,
  transformSalles,
  transformAssignment,
  transformAssignments,
  transformIncident,
  transformIncidents,
  transformAssignmentHistory,
  transformAssignmentHistories,
  transformStatsToCards,
  transformQuotaDistribution,
  transformDeptExamLoad,
  transformToPersonalExam,
  transformToPersonalExams,
  transformToCalendarEvent,
  transformToCalendarEvents,
};
