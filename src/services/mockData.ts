// Mock data fallback for when backend is not available
// This allows the frontend to work even without a running backend

import type {
  Professor,
  Exam,
  Department,
  Salle,
  Assignment,
  Incident,
  AssignmentHistory,
  User,
  DashboardOverview,
  ApiResponse,
  PaginatedResponse,
} from '../types';

// Extend User type to include password for mock data
type UserWithPassword = User & { password: string };

// ============================================
// Mock Users (with passwords for authentication)
// ============================================

// Internal mock users with passwords
const mockUsersWithPassword: UserWithPassword[] = [
  {
    id: 1,
    username: 'admin',
    password: 'admin',
    email: 'admin@fpk.edu',
    first_name: 'Admin',
    last_name: 'System',
    full_name: 'Admin System',
    role: 'admin',
    institutional_grade: 'ADMIN',
    department_id: 1,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    username: 'prof',
    password: 'prof',
    email: 'prof@fpk.edu',
    first_name: 'Sarah',
    last_name: 'Connor',
    full_name: 'Sarah Connor',
    role: 'professor',
    institutional_grade: 'PR',
    department_id: 2,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Export users without passwords
export const mockUsers: User[] = mockUsersWithPassword.map(
  ({ password, ...user }) => user
);

// Export function to find user with password for authentication
export function findMockUser(username: string, password: string): User | null {
  const user = mockUsersWithPassword.find(
    u => u.username === username && u.password === password
  );
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

// Export function to find user by username only (for token refresh simulation)
export function findMockUserByUsername(username: string): User | null {
  const user = mockUsersWithPassword.find(u => u.username === username);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

// ============================================
// Mock Professors
// ============================================

export const mockProfessors: Professor[] = [
  {
    id: 1,
    user_id: 1,
    name: 'Admin System',
    department_id: 1,
    department: 'Scolarite',
    max_guards: 4,
    completed_guards: 0,
    quota_status: '0/4',
    quota_percentage: 0,
    is_quota_full: false,
    academic_title: 'ADMIN',
    created_at: new Date().toISOString(),
    user: mockUsers[0],
  },
  {
    id: 2,
    user_id: 2,
    name: 'Sarah Connor',
    department_id: 2,
    department: 'Computer Science',
    max_guards: 4,
    completed_guards: 2,
    quota_status: '2/4',
    quota_percentage: 50,
    is_quota_full: false,
    academic_title: 'DR',
    created_at: new Date().toISOString(),
    user: mockUsers[1],
  },
  {
    id: 3,
    user_id: 3,
    name: 'John Doe',
    department_id: 3,
    department: 'Mathematics',
    max_guards: 4,
    completed_guards: 3,
    quota_status: '3/4',
    quota_percentage: 75,
    is_quota_full: false,
    academic_title: 'PR',
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    user_id: 4,
    name: 'Elena Gilbert',
    department_id: 4,
    department: 'Physics',
    max_guards: 4,
    completed_guards: 4,
    quota_status: '4/4',
    quota_percentage: 100,
    is_quota_full: true,
    academic_title: 'DR',
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    user_id: 5,
    name: 'Marcus Aurelius',
    department_id: 5,
    department: 'Philosophy',
    max_guards: 4,
    completed_guards: 0,
    quota_status: '0/4',
    quota_percentage: 0,
    is_quota_full: false,
    academic_title: 'PR',
    created_at: new Date().toISOString(),
  },
];

// ============================================
// Mock Departments
// ============================================

export const mockDepartments: Department[] = [
  {
    id: 1,
    name: 'Scolarite',
    head_id: 1,
    head_name: 'Admin System',
    staff_count: 1,
    code: 'ADMIN',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Computer Science',
    head_id: 2,
    head_name: 'Sarah Connor',
    staff_count: 18,
    code: 'CS',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Mathematics',
    head_id: 3,
    head_name: 'John Doe',
    staff_count: 12,
    code: 'MATH',
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Physics',
    head_id: 4,
    head_name: 'Elena Gilbert',
    staff_count: 10,
    code: 'PHYSICS',
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Philosophy',
    head_id: 5,
    head_name: 'Marcus Aurelius',
    staff_count: 8,
    code: 'PHIL',
    created_at: new Date().toISOString(),
  },
];

// ============================================
// Mock Filieres (Fields of Study)
// ============================================

export const mockFilieres: Filier[] = [
  {
    id: 1,
    name: 'Computer Science',
    code: 'CS',
    department_id: 2,
    max_modules: 7,
    description: 'Computer Science and Engineering',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Information Technology',
    code: 'IT',
    department_id: 2,
    max_modules: 7,
    description: 'Information Technology and Systems',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Applied Mathematics',
    code: 'AM',
    department_id: 3,
    max_modules: 7,
    description: 'Applied Mathematics for Engineering',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Theoretical Physics',
    code: 'TP',
    department_id: 4,
    max_modules: 7,
    description: 'Theoretical and Experimental Physics',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// ============================================
// Mock Modules (Courses)
// ============================================

export const mockModules: Module[] = [
  // Computer Science Filier (ID: 1)
  {
    id: 1,
    name: 'Programming Fundamentals',
    code: 'CS101',
    filier_id: 1,
    credits: 4,
    hours: 60,
    description: 'Introduction to programming concepts',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Data Structures',
    code: 'CS102',
    filier_id: 1,
    credits: 4,
    hours: 60,
    description: 'Fundamental data structures and algorithms',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'Algorithms',
    code: 'CS103',
    filier_id: 1,
    credits: 4,
    hours: 60,
    description: 'Algorithm design and analysis',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    name: 'Database Systems',
    code: 'CS104',
    filier_id: 1,
    credits: 3,
    hours: 45,
    description: 'Relational database design and SQL',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    name: 'Web Development',
    code: 'CS105',
    filier_id: 1,
    credits: 3,
    hours: 45,
    description: 'Modern web development technologies',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 6,
    name: 'Operating Systems',
    code: 'CS106',
    filier_id: 1,
    credits: 4,
    hours: 60,
    description: 'Operating system principles',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 7,
    name: 'Network Security',
    code: 'CS107',
    filier_id: 1,
    credits: 3,
    hours: 45,
    description: 'Computer network security fundamentals',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  // Information Technology Filier (ID: 2)
  {
    id: 8,
    name: 'IT Infrastructure',
    code: 'IT101',
    filier_id: 2,
    credits: 4,
    hours: 60,
    description: 'IT infrastructure management',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 9,
    name: 'Cloud Computing',
    code: 'IT102',
    filier_id: 2,
    credits: 3,
    hours: 45,
    description: 'Cloud platforms and services',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// ============================================
// Mock Salles (Rooms)
// ============================================

export const mockSalles: Salle[] = [
  { id: 1, name: 'Amphi A', code: 'A', capacity: 200, type: 'AMPHI', floor: '1', building: 'Main', is_active: true, created_at: new Date().toISOString() },
  { id: 2, name: 'Amphi B', code: 'B', capacity: 150, type: 'AMPHI', floor: '1', building: 'Main', is_active: true, created_at: new Date().toISOString() },
  { id: 3, name: 'Salle B12', code: 'B12', capacity: 50, type: 'SALLE', floor: '2', building: 'Building B', is_active: true, created_at: new Date().toISOString() },
  { id: 4, name: 'Lab 201', code: 'L201', capacity: 30, type: 'LAB', floor: '2', building: 'Science', is_active: true, created_at: new Date().toISOString() },
  { id: 5, name: 'Lab 104', code: 'L104', capacity: 25, type: 'LAB', floor: '1', building: 'Science', is_active: true, created_at: new Date().toISOString() },
  { id: 6, name: 'Amphi C', code: 'C', capacity: 100, type: 'AMPHI', floor: '2', building: 'Main', is_active: true, created_at: new Date().toISOString() },
];

// ============================================
// Mock Exams
// ============================================

export const mockExams: Exam[] = [
  {
    id: 1,
    module: 'LINEAR ALGEBRA',
    module_code: 'MATH101',
    exam_type: 'FINAL',
    date: '2026-05-12',
    start_time: '09:00',
    end_time: '11:00',
    duration_minutes: 120,
    salle_id: 1,
    salle: 'Amphi A',
    department_id: 3,
    department: 'Mathematics',
    academic_year: '2025-2026',
    semester: 'S2',
    status: 'SCHEDULED',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    module: 'DATA STRUCTURES',
    module_code: 'CS201',
    exam_type: 'MIDTERM',
    date: '2026-05-12',
    start_time: '14:00',
    end_time: '16:00',
    duration_minutes: 120,
    salle_id: 4,
    salle: 'Lab 201',
    department_id: 2,
    department: 'Computer Science',
    academic_year: '2025-2026',
    semester: 'S2',
    status: 'SCHEDULED',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    module: 'QUANTUM PHYSICS',
    module_code: 'PHYS401',
    exam_type: 'FINAL',
    date: '2026-05-13',
    start_time: '10:00',
    end_time: '12:00',
    duration_minutes: 120,
    salle_id: 2,
    salle: 'Amphi B',
    department_id: 4,
    department: 'Physics',
    academic_year: '2025-2026',
    semester: 'S2',
    status: 'SCHEDULED',
    created_at: new Date().toISOString(),
  },
];

// ============================================
// Mock Assignments
// ============================================

export const mockAssignments: Assignment[] = [
  {
    id: 1,
    professor_id: 2,
    professor: 'Sarah Connor',
    professor_department: 'Computer Science',
    exam_id: 2,
    exam_module: 'DATA STRUCTURES',
    exam_date: '2026-05-12',
    exam_time: '14:00 - 16:00',
    exam_room: 'Lab 201',
    status: 'CONFIRMED',
    assignment_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    professor_id: 3,
    professor: 'John Doe',
    professor_department: 'Mathematics',
    exam_id: 1,
    exam_module: 'LINEAR ALGEBRA',
    exam_date: '2026-05-12',
    exam_time: '09:00 - 11:00',
    exam_room: 'Amphi A',
    status: 'CONFIRMED',
    assignment_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    professor_id: 4,
    professor: 'Elena Gilbert',
    professor_department: 'Physics',
    exam_id: 3,
    exam_module: 'QUANTUM PHYSICS',
    exam_date: '2026-05-13',
    exam_time: '10:00 - 12:00',
    exam_room: 'Amphi B',
    status: 'CONFIRMED',
    assignment_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

// ============================================
// Mock Incidents
// ============================================

export const mockIncidents: Incident[] = [
  {
    id: 1,
    professor_id: 2,
    professor: 'Sarah Connor',
    assignment_id: 1,
    incident_type: 'SCHEDULE CONFLICT',
    description: 'Conflict with another exam on the same day',
    status: 'UNDER REVIEW',
    reported_date: new Date().toISOString(),
    severity: 'MEDIUM',
    related_exam_id: 2,
    related_exam: 'DATA STRUCTURES',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    professor_id: 3,
    professor: 'John Doe',
    assignment_id: 2,
    incident_type: 'ROOM MISMATCH',
    description: 'Room capacity is insufficient',
    status: 'RESOLVED',
    reported_date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    severity: 'LOW',
    related_exam_id: 1,
    related_exam: 'LINEAR ALGEBRA',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// ============================================
// Mock Assignment History
// ============================================

export const mockAssignmentHistory: AssignmentHistory[] = [
  {
    id: 1,
    assignment_id: 1,
    professor_id: 2,
    professor: 'Sarah Connor',
    exam_id: 2,
    exam_module: 'DATABASE MANAGEMENT',
    exam_date: '2026-01-12',
    exam_type: 'FINAL',
    completion_date: '2026-01-12T16:00:00',
    status: 'COMPLETED',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    assignment_id: 2,
    professor_id: 2,
    professor: 'Sarah Connor',
    exam_id: 3,
    exam_module: 'WEB TECHNOLOGIES',
    exam_date: '2026-01-15',
    exam_type: 'FINAL',
    completion_date: '2026-01-15T16:00:00',
    status: 'COMPLETED',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    assignment_id: 3,
    professor_id: 2,
    professor: 'Sarah Connor',
    exam_id: 4,
    exam_module: 'OPERATING SYSTEMS',
    exam_date: '2025-12-20',
    exam_type: 'MIDTERM',
    completion_date: '2025-12-20T11:00:00',
    status: 'COMPLETED',
    created_at: new Date().toISOString(),
  },
];

// ============================================
// Mock Dashboard Overview
// ============================================

export const mockDashboardOverview: DashboardOverview = {
  stats: {
    active_professors: 48,
    scheduled_exams: 124,
    total_salles: 18,
    allocation_rate: '82%',
  },
  quota_distribution: {
    '0_guards': 12,
    '1_2_guards': 25,
    '3_guards': 8,
    maxed_4: 3,
  },
  department_exam_load: [
    { name: 'CS', value: 45 },
    { name: 'MATH', value: 25 },
    { name: 'PHYSICS', value: 20 },
    { name: 'OTHERS', value: 10 },
  ],
  upcoming_exams: mockExams,
  recent_assignments: mockAssignments,
};

// ============================================
// Helper to create successful API response
// ============================================

export function createSuccessResponse<T>(data: T, message: string = 'Success'): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

// ============================================
// Helper to create paginated response
// ============================================

export function createPaginatedResponse<T>(
  data: T[],
  page: number = 1,
  perPage: number = 10,
  total: number = data.length
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.ceil(total / perPage),
    },
  };
}

export default {
  mockUsers,
  mockProfessors,
  mockDepartments,
  mockSalles,
  mockExams,
  mockAssignments,
  mockIncidents,
  mockAssignmentHistory,
  mockDashboardOverview,
  createSuccessResponse,
  createPaginatedResponse,
};
