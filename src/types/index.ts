// API Response Types for FPK Exam Guard Backend

// ============================================
// Authentication Types
// ============================================

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'professor';
  institutional_grade: string;
  department_id?: number;
  digital_signature?: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    user: User;
    professor_quota?: {
      quota: string;
      completed_guards: number;
      max_guards: number;
    };
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'professor';
  institutional_grade?: string;
  department_id?: number;
  academic_title?: string;
  max_guards?: number;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// ============================================
// Professor Types
// ============================================

export interface Professor {
  id: number;
  user_id: number;
  name?: string;
  department_id?: number;
  department?: string;
  max_guards: number;
  completed_guards: number;
  quota_status: string;
  quota_percentage: number;
  is_quota_full: boolean;
  academic_title?: string;
  created_at: string;
  user?: User;
}

// ============================================
// Department Types
// ============================================

export interface Department {
  id: number;
  name: string;
  head_id?: number;
  head_name?: string;
  staff_count: number;
  code?: string;
  created_at: string;
}

// ============================================
// Salle (Room) Types
// ============================================

export interface Salle {
  id: number;
  name: string;
  code: string;
  capacity?: number;
  type?: string;
  floor?: string;
  building?: string;
  is_active: boolean;
  created_at: string;
}

// ============================================
// Filier (Field of Study) Types
// ============================================

export interface Filier {
  id: number;
  name: string;
  code?: string;
  department_id?: number;
  department_name?: string;
  max_modules?: number;
  description?: string;
  is_active?: boolean;
  module_count?: number;
  created_at?: string;
}

// ============================================
// Module (Course) Types
// ============================================

export interface Module {
  id: number;
  name: string;
  code?: string;
  filier_id?: number;
  filier_name?: string;
  professor_id?: number;
  professor_name?: string;
  hours?: number;
  description?: string;
  is_active?: boolean;
  created_at?: string;
}

// ============================================
// Exam Types
// ============================================

export interface Exam {
  id: number;
  module_id?: number;
  module?: string;
  module_code?: string;
  module_obj?: Module;
  exam_type: string; // 'NORMAL' or 'RATTRAPAGE'
  filier_id?: number;
  filier?: string;
  date: string;
  time?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  salle_id?: number;
  salle?: string | Salle;
  department_id?: number;
  department?: string | Department;
  academic_year?: string;
  semester?: string;
  status: string;
  notes?: string;
  created_at: string;
  assignments?: Assignment[];
}

export interface CreateExamRequest {
  module: string;
  module_code?: string;
  exam_type: string;
  date: string;
  start_time: string;
  end_time: string;
  salle_id: number;
  department_id: number;
  academic_year?: string;
  semester?: string;
  status?: string;
  notes?: string;
}

// ============================================
// Assignment Types
// ============================================

export interface Assignment {
  id: number;
  professor_id: number;
  professor?: string;
  professor_department?: string;
  exam_id: number;
  exam_module?: string;
  exam_date?: string;
  exam_time?: string;
  exam_room?: string;
  status: string;
  assignment_date: string;
  notes?: string;
  created_at: string;
  incidents?: Incident[];
}

// ============================================
// Incident Types
// ============================================

export interface Incident {
  id: number;
  professor_id?: number;
  professor?: string;
  assignment_id?: number;
  incident_type: string;
  description: string;
  status: string;
  reported_date: string;
  resolved_date?: string;
  resolved_by?: number;
  resolution_notes?: string;
  severity: string;
  related_exam_id?: number;
  related_exam?: string;
  created_at: string;
}

export interface CreateIncidentRequest {
  incident_type: string;
  description: string;
  severity?: string;
}

// ============================================
// Assignment History Types
// ============================================

export interface AssignmentHistory {
  id: number;
  assignment_id: number;
  professor_id: number;
  professor?: string;
  exam_id: number;
  exam_module?: string;
  exam_date?: string;
  exam_type?: string;
  completion_date: string;
  status: string;
  report_path?: string;
  notes?: string;
  created_at: string;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardOverview {
  stats: {
    active_professors: number;
    scheduled_exams: number;
    total_salles: number;
    allocation_rate: string;
  };
  quota_distribution: {
    '0_guards'?: number;
    '1_2_guards'?: number;
    '3_guards'?: number;
    maxed_4?: number;
  };
  department_exam_load: Array<{ name: string; value: number }>;
  upcoming_exams: Exam[];
  recent_assignments: Assignment[];
}

export interface AdminStats {
  department_stats: Array<{
    department: string;
    professors: number;
    exams: number;
    assignments: number;
  }>;
  exam_type_distribution: Record<string, number>;
  salle_type_distribution: Record<string, number>;
}

export interface ProfessorStats {
  completed_assignments: number;
  upcoming_assignments: number;
  incident_stats: {
    total: number;
    resolved: number;
    pending: number;
  };
}

export interface ProfessorDashboardOverview {
  professor: {
    id: number;
    name: string;
    department: string;
    institutional_grade: string;
  };
  quota: {
    status: string;
    percentage: number;
    is_full: boolean;
  };
  next_duty?: Assignment;
  active_assignments_count: number;
  active_assignments: Assignment[];
  recent_incidents: Incident[];
  system_status: string;
}

// ============================================
// Calendar Types
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

// ============================================
// Notification Types
// ============================================

export interface Notification {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}

// ============================================
// API Response Wrapper Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
}

// ============================================
// Filter/Query Types
// ============================================

export interface PaginationParams {
  page?: number;
  per_page?: number;
}

export interface ExamFilterParams extends PaginationParams {
  date_from?: string;
  date_to?: string;
  salle_id?: number;
  department_id?: number;
  exam_type?: string;
  status?: string;
}

export interface AssignmentFilterParams extends PaginationParams {
  status?: string;
  professor_id?: number;
  exam_id?: number;
}

export interface IncidentFilterParams extends PaginationParams {
  status?: string;
  severity?: string;
  professor_id?: number;
}
