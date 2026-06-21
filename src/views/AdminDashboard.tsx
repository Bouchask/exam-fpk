import { useState, useEffect, useCallback } from "react";
import { Plus, Users, Calendar, DoorOpen, Target, Layers, Save, RefreshCcw, Edit, Trash2 } from "lucide-react";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { cn } from "../utils/cn";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { professorService, examService, departmentService, salleService, moduleService, filierService, authService, dashboardService, useMockData } from "../services";
import type { DashboardOverview } from "../types";

interface AdminDashboardProps {
  forcedTab?: "overview" | "professors" | "exams" | "salles" | "departments" | "filieres" | "modules";
}

// Centralized page actions configuration
const pageActions = {
  overview: null,
  professors: { 
    label: "Add Professor", 
    icon: Plus,
    action: (setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>) => () => setIsModalOpen(true)
  },
  exams: { 
    label: "Add Exam", 
    icon: Plus,
    action: (setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>) => () => setIsModalOpen(true)
  },
  salles: { 
    label: "Add Salle", 
    icon: Plus,
    action: (setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>) => () => setIsModalOpen(true)
  },
  departments: { 
    label: "Add Department", 
    icon: Plus,
    action: (setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>) => () => setIsModalOpen(true)
  },
  filieres: { 
    label: "Add Filiere", 
    icon: Plus,
    action: (setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>) => () => setIsModalOpen(true)
  },
  modules: { 
    label: "Add Module", 
    icon: Plus,
    action: (setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>) => () => setIsModalOpen(true)
  }
};

// Header Action Component
const HeaderAction = ({ activeTab, setIsModalOpen }: { 
  activeTab: string; 
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>> 
}) => {
  const actionConfig = pageActions[activeTab as keyof typeof pageActions];
  
  if (!actionConfig) {
    return null;
  }
  
  const Icon = actionConfig.icon;
  const handleClick = actionConfig.action(setIsModalOpen);
  
  return (
    <button 
      onClick={handleClick}
      className="flex items-center justify-center gap-3 bg-app-primary text-white px-8 py-4 rounded-none font-black uppercase tracking-[0.2em] text-xs hover:bg-app-fg transition-all"
    >
      <Icon className="w-4 h-4" />
      {actionConfig.label}
    </button>
  );
};

export const AdminDashboard = ({ forcedTab }: AdminDashboardProps) => {
  // Derive activeTab from URL hash as single source of truth
  const getCurrentTab = (): "overview" | "professors" | "exams" | "salles" | "departments" | "filieres" | "modules" => {
    const hash = window.location.hash.replace("#", "");
    const routeToTab: Record<string, "overview" | "professors" | "exams" | "salles" | "departments" | "filieres" | "modules"> = {
      "": "overview",
      "dashboard": "overview",
      "professors": "professors",
      "exams": "exams",
      "salles": "salles",
      "departments": "departments",
      "filieres": "filieres",
      "modules": "modules"
    };
    return routeToTab[hash] || forcedTab || "overview";
  };

  const [activeTab, setActiveTab] = useState<"overview" | "professors" | "exams" | "salles" | "departments" | "filieres" | "modules">(getCurrentTab());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGuardsModalOpen, setIsGuardsModalOpen] = useState(false);
  const [isAssignGuardModalOpen, setIsAssignGuardModalOpen] = useState(false);
  const [isReplaceGuardModalOpen, setIsReplaceGuardModalOpen] = useState(false);
  const [isRemoveConfirmModalOpen, setIsRemoveConfirmModalOpen] = useState(false);
  const [selectedExamGuards, setSelectedExamGuards] = useState<{
    id: number; 
    module: string;
    module_id: number;
    date: string;
    time: string;
    room: string;
    guards: Array<{name: string; department: string; id: number}>;
    guardCount: number;
    associatedProfessor: {name: string; id: number | null};
    associatedProfessors: Array<{name: string; id: number; department: string}>;
    moduleProfessorDept: string;
    salle_id?: number;
    department_id?: number;
  } | null>(null);
  const [availableProfessors, setAvailableProfessors] = useState<Array<{
    id: number;
    name: string;
    department: string;
    department_id?: number;
    completed_guards: number;
    max_guards: number;
    is_quota_full: boolean;
    is_selected: boolean;
    is_associated: boolean;
  }>>([]);
  const [selectedProfessorIds, setSelectedProfessorIds] = useState<number[]>([]);
  const [guardToRemove, setGuardToRemove] = useState<{id: number; name: string; index: number} | null>(null);
  const [guardToReplace, setGuardToReplace] = useState<{id: number; name: string; index: number} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [professorForm, setProfessorForm] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: '',
    institutional_grade: 'PR',
    department: 'Computer Science',
  });
  const [examForm, setExamForm] = useState({
    module_id: '',
    module: '',
    date: '',
    start_time: '',
    end_time: '',
    salle_id: '',
    salle: 'Amphi A',
    exam_type: 'NORMAL',
    department_id: '',
    department_name: '',
    notes: '',
  });
  const [availableExamTypes, setAvailableExamTypes] = useState<string[]>(['NORMAL', 'RATTRAPAGE']);
  const [resourceForm, setResourceForm] = useState({
    name: '',
    code: '',
    capacity: '',
    type: 'SALLE',
    floor: '1',
    building: 'Main',
  });

  // Data state
  const [professors, setProfessors] = useState<{ id: number; name: string; dept: string; guards: number; user?: any }[]>([]);
  const [exams, setExams] = useState<{ id: number; module: string; module_id?: number; date: string; time: string; type: string; room: string; salle_id?: number; department_id?: number; guards?: any[]; guardCount?: number; associatedProfessor?: any; associatedProfessors?: any[]; moduleProfessorDept?: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string; head: string; staff: number; code?: string }[]>([]);
  const [salles, setSalles] = useState<{ id: number; name: string; code: string; capacity: number; type: string; floor: string; building: string; is_active: boolean }[]>([]);
  const [modules, setModules] = useState<{ id: number; name: string; code?: string; filier_id?: number; department_id?: number; professor_id?: number; department_name?: string; is_active?: boolean }[]>([]);
  const [filieres, setFilieres] = useState<{ id: number; name: string; department_id?: number; department_name?: string; professors?: any[] }[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [editingSalle, setEditingSalle] = useState<{ id: number; name: string; code: string; capacity: number; type: string; floor: string; building: string } | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<{ id: number; name: string; code?: string; head_id?: number; staff_count?: number } | null>(null);
  const [editingExam, setEditingExam] = useState<{ id: number; module_id: string; module: string; date: string; start_time: string; end_time: string; salle_id: string; salle: string; exam_type: string; department_id: string; department_name: string; notes: string } | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<{ id: number; username?: string; email?: string; first_name?: string; last_name?: string; name?: string; institutional_grade?: string; department?: string; dept?: string; department_id?: number; user?: any } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'salle' | 'professor' | 'department' | 'exam' | null>(null);

  // Fetch available exam types when module_id changes
  useEffect(() => {
    if (!examForm.module_id) {
      setAvailableExamTypes(['NORMAL', 'RATTRAPAGE']);
      return;
    }

    const fetchExamTypes = async () => {
      try {
        // Use mock data fallback if backend is unavailable
        if (useMockData) {
          const selectedModule = modules.find(m => m.id === parseInt(examForm.module_id));
          if (selectedModule) {
            const existingExams = exams.filter(e => e.module === selectedModule.name);
            const existingTypes = existingExams.map(e => e.type);
            const availableTypes = ['NORMAL', 'RATTRAPAGE'].filter(t => !existingTypes.includes(t));
            setAvailableExamTypes(availableTypes);

            // Auto-set exam_type if current one is not available
            if (availableTypes.length > 0 && !availableTypes.includes(examForm.exam_type)) {
              setExamForm(prev => ({
                ...prev,
                exam_type: availableTypes[0]
              }));
            }
          }
          return;
        }

        // Fetch from backend
        const moduleExamsResponse = await examService.getByModule(parseInt(examForm.module_id));
        if (moduleExamsResponse.success && moduleExamsResponse.data) {
          const existingTypes = moduleExamsResponse.data.map((ex: any) => ex.exam_type);
          const availableTypes = ['NORMAL', 'RATTRAPAGE'].filter(t => !existingTypes.includes(t));
          setAvailableExamTypes(availableTypes);

          // Auto-set exam_type if current one is not available
          if (availableTypes.length > 0 && !availableTypes.includes(examForm.exam_type)) {
            setExamForm(prev => ({
              ...prev,
              exam_type: availableTypes[0]
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching exam types for module:', err);
        // Fallback: try using all exams
        try {
          const allExamsResponse = await examService.getAll();
          if (allExamsResponse.success && allExamsResponse.data) {
            const existingTypes = allExamsResponse.data
              .filter((ex: any) => ex.module_id === parseInt(examForm.module_id))
              .map((ex: any) => ex.exam_type);
            const availableTypes = ['NORMAL', 'RATTRAPAGE'].filter(t => !existingTypes.includes(t));
            setAvailableExamTypes(availableTypes);

            if (availableTypes.length > 0 && !availableTypes.includes(examForm.exam_type)) {
              setExamForm(prev => ({
                ...prev,
                exam_type: availableTypes[0]
              }));
            }
          }
        } catch (fallbackErr) {
          console.error('Error fetching all exams for fallback:', fallbackErr);
          // If all else fails, keep both types available
          setAvailableExamTypes(['NORMAL', 'RATTRAPAGE']);
        }
      }
    };

    fetchExamTypes();
  }, [examForm.module_id, modules, exams, useMockData]);

  // Sync activeTab with URL hash - single source of truth
  useEffect(() => {
    const handleHashChange = () => {
      const newTab = getCurrentTab();
      if (newTab !== activeTab) {
        setActiveTab(newTab);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initialize on mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [forcedTab, activeTab]);

  // Load professor form data when selectedProfessor changes
  useEffect(() => {
    if (selectedProfessor) {
      const user = selectedProfessor.user || {} as any;
      const nameParts = (selectedProfessor.name || selectedProfessor.first_name || '').split(' ');
      setProfessorForm({
        username: user.username || selectedProfessor.username || nameParts.join(' '),
        password: '', // Do NOT display current password
        email: user.email || selectedProfessor.email || '',
        first_name: user.first_name || nameParts[0] || '',
        last_name: user.last_name || nameParts.slice(1).join(' ') || '',
        institutional_grade: user.institutional_grade || selectedProfessor.institutional_grade || 'PR',
        department: selectedProfessor.dept || selectedProfessor.department || 'Computer Science',
      });
    } else {
      // Reset form when not editing
      setProfessorForm({
        username: '',
        password: '',
        email: '',
        first_name: '',
        last_name: '',
        institutional_grade: 'PR',
        department: 'Computer Science'
      });
    }
  }, [selectedProfessor]);
  
  // Chart data - will be populated from real data
  const [quotaData, setQuotaData] = useState<Array<{ name: string; value: number; color: string }>>([
    { name: '0 Guards', value: 12, color: '#d7ccc8' },
    { name: '1-2 Guards', value: 25, color: '#8d6e63' },
    { name: '3 Guards', value: 8, color: '#4e342e' },
    { name: 'Maxed (4)', value: 3, color: '#1a1210' },
  ]);
  
  const [deptData, setDeptData] = useState<Array<{ name: string; value: number; color: string }>>([
    { name: 'CS', value: 45, color: '#4e342e' },
    { name: 'MATH', value: 25, color: '#1a1210' },
    { name: 'PHYSICS', value: 20, color: '#8d6e63' },
    { name: 'OTHERS', value: 10, color: '#d7ccc8' },
  ]);

  // Fetch data on tab change
  useEffect(() => {
    if (forcedTab) setActiveTab(forcedTab);
  }, [forcedTab]);

  // Fetch functions
  const fetchProfessors = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await professorService.getAll(1, 50);
      if (response.success && response.data) {
        setProfessors(response.data.map(p => ({
          id: p.id,
          name: p.name || p.user?.full_name || 'Unknown',
          dept: p.department || 'Unknown',
          guards: p.completed_guards || 0,
          user: p.user,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch professors:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchExams = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await examService.getAll();
      if (response.success && response.data) {
        // Fetch modules to get associated professor
        const modulesResponse = await moduleService.getAll();
        const allModules = modulesResponse.success && modulesResponse.data ? modulesResponse.data : [];
        
        // Fetch all professors for department info
        const professorsResponse = await professorService.getAll();
        const allProfessors = professorsResponse.success && professorsResponse.data ? professorsResponse.data : [];
        
        // Fetch filieres to get professors for each module's filier
        const filieresResponse = await filierService.getAll(1, 100);
        const allFilieres = filieresResponse.success && filieresResponse.data ? filieresResponse.data : [];
        
        // Fetch assignments for each exam to get professor guards
        const examsWithGuards = await Promise.all(response.data.map(async (e) => {
          try {
            const assignmentsResponse = await examService.getAssignments(e.id);
            const assignments = assignmentsResponse.success && assignmentsResponse.data 
              ? assignmentsResponse.data 
              : [];
            
            // Get guards with department info
            const guards = assignments.map((a: any) => ({
              name: a.professor || a.professor_name || 'Unknown',
              department: a.professor_department || 'Unknown',
              id: a.professor_id
            }));
            
            // Get associated professors from backend response (now includes associated_professors)
            // Use the associated_professors from backend if available, otherwise build from module_obj
            let associatedProfessors: Array<{name: string; id: number; department: string}> = [];
            
            // Method 1: Use associated_professors from backend response (new field)
            if (e.associated_professors && Array.isArray(e.associated_professors) && e.associated_professors.length > 0) {
              associatedProfessors = e.associated_professors.map((p: any) => ({
                name: p.name || 'Unknown',
                id: p.id,
                department: p.department || 'Unknown'
              }));
            }
            // Method 2: Try to get from module_obj.professor
            else if (e.module_obj && (e.module_obj as any).professor) {
              const prof: any = (e.module_obj as any).professor;
              associatedProfessors = [{
                name: prof.name || (e.module_obj as any).professor_name || 'Unknown',
                id: prof.id || (e.module_obj as any).professor_id,
                department: prof.department || 'Unknown'
              }];
            }
            // Method 3: Try to get from module's filier
            else if (e.module_obj?.filier_id) {
              const filier = allFilieres.find((f: any) => f.id === e.module_obj!.filier_id);
              if (filier && filier.professors && Array.isArray(filier.professors) && filier.professors.length > 0) {
                associatedProfessors = filier.professors.map((p: any) => ({
                  name: p.name || 'Unknown',
                  id: p.id,
                  department: p.department || 'Unknown'
                }));
              }
            }
            // Method 4: Try to find module by module_id from all modules
            else if (e.module_id) {
              const module = allModules.find((m: any) => m.id === e.module_id);
              if (module) {
                // Check if module has professor_id
                if (module.professor_id) {
                  const prof = allProfessors.find((p: any) => p.id === module.professor_id);
                  if (prof) {
                    associatedProfessors = [{
                      name: prof.name || 'Unknown',
                      id: prof.id,
                      department: prof.department || 'Unknown'
                    }];
                  }
                }
                // Check if module has filier with professors
                else if (module.filier_id) {
                  const filier = allFilieres.find((f: any) => f.id === module.filier_id);
                  if (filier && filier.professors && Array.isArray(filier.professors) && filier.professors.length > 0) {
                    associatedProfessors = filier.professors.map((p: any) => ({
                      name: p.name || 'Unknown',
                      id: p.id,
                      department: p.department || 'Unknown'
                    }));
                  }
                }
              }
            }
            
            // Get associated professor for backward compatibility
            const associatedProfessor = associatedProfessors.length > 0 ? {
              name: associatedProfessors[0].name,
              id: associatedProfessors[0].id
            } : { name: 'Not Assigned', id: null };
            
            // Find professor department
            const profDept = associatedProfessor.id 
              ? allProfessors.find((p: any) => p.id === associatedProfessor.id)?.department 
              : null;
            
            // Use guards_count from backend if available, otherwise use guards.length
            const guardCount = e.guards_count !== undefined ? e.guards_count : guards.length;
            
            return {
              id: e.id,
              module: e.module || 'Unknown',
              module_id: e.module_id,
              date: e.date,
              time: `${e.start_time} - ${e.end_time}`,
              type: e.exam_type,
              room: typeof e.salle === 'string' ? e.salle : e.salle?.name || 'Unknown',
              salle_id: e.salle_id,
              guards: guards,
              guardCount: guardCount,
              associatedProfessor: associatedProfessor,
              associatedProfessors: associatedProfessors,
              moduleProfessorDept: profDept || 'Unknown'
            };
          } catch (err) {
            console.error(`Failed to fetch assignments for exam ${e.id}:`, err);
            return {
              id: e.id,
              module: e.module || 'Unknown',
              module_id: e.module_id,
              date: e.date,
              time: `${e.start_time} - ${e.end_time}`,
              type: e.exam_type,
              room: typeof e.salle === 'string' ? e.salle : e.salle?.name || 'Unknown',
              salle_id: e.salle_id,
              guards: [],
              guardCount: 0,
              associatedProfessor: { name: 'Not Assigned', id: null },
              associatedProfessors: [],
              moduleProfessorDept: 'Unknown'
            };
          }
        }));
        setExams(examsWithGuards);
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await departmentService.getAll(1, 50);
      if (response.success && response.data) {
        setDepartments(response.data.map(d => ({
          id: d.id,
          name: d.name,
          head: d.head_name || 'Unknown',
          staff: d.staff_count || 0,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSalles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await salleService.getAll(1, 50);
      if (response.success && response.data) {
        setSalles(response.data.map(s => ({
          id: s.id,
          name: s.name,
          code: s.code || '',
          capacity: s.capacity || 0,
          type: s.type || '',
          floor: s.floor || '',
          building: s.building || '',
          is_active: s.is_active,
        })));
      }
    } catch (err) {
      console.error('Failed to fetch salles:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFilieresAndModules = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch filieres first
      const filieresResponse = await filierService.getAll(1, 50);
      const filieresData = filieresResponse.success && filieresResponse.data 
        ? filieresResponse.data.map(f => ({
            id: f.id,
            name: f.name,
            department_id: f.department_id,
            department_name: f.department_name,
          }))
        : [];
      setFilieres(filieresData);
      
      // Fetch modules
      const modulesResponse = await moduleService.getAll(1, 50);
      if (modulesResponse.success && modulesResponse.data) {
        const modulesData = modulesResponse.data.map(m => {
          const filier = filieresData.find(f => f.id === m.filier_id);
          return {
            id: m.id,
            name: m.name,
            code: m.code || '',
            filier_id: m.filier_id,
            filier_name: m.filier_name,
            professor_id: m.professor_id,
            department_id: filier?.department_id,
            department_name: filier?.department_name,
          };
        });
        setModules(modulesData);
      }
    } catch (err) {
      console.error('Failed to fetch filieres and modules:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch dashboard overview data
  const fetchDashboardOverview = useCallback(async () => {
    try {
      setIsDashboardLoading(true);
      const response = await dashboardService.getOverview();
      if (response.success && response.data) {
        setDashboardData(response.data);
        
        // Transform quota distribution data for chart
        const quotaDistribution = response.data.quota_distribution;
        if (quotaDistribution) {
          const newQuotaData = [
            { name: '0 Guards', value: quotaDistribution['0_guards'] || 0, color: '#d7ccc8' },
            { name: '1-2 Guards', value: quotaDistribution['1_2_guards'] || 0, color: '#8d6e63' },
            { name: '3 Guards', value: quotaDistribution['3_guards'] || 0, color: '#4e342e' },
            { name: 'Maxed (4)', value: quotaDistribution['maxed_4'] || 0, color: '#1a1210' },
          ].filter(item => item.value > 0);
          
          // If no data, use defaults
          if (newQuotaData.length === 0) {
            setQuotaData([
              { name: '0 Guards', value: 12, color: '#d7ccc8' },
              { name: '1-2 Guards', value: 25, color: '#8d6e63' },
              { name: '3 Guards', value: 8, color: '#4e342e' },
              { name: 'Maxed (4)', value: 3, color: '#1a1210' },
            ]);
          } else {
            setQuotaData(newQuotaData);
          }
        }
        
        // Transform department exam load data for chart
        const deptExamLoad = response.data.department_exam_load || [];
        if (deptExamLoad.length > 0) {
          const colors = ['#4e342e', '#1a1210', '#8d6e63', '#d7ccc8', '#5d4037', '#795548'];
          const newDeptData = deptExamLoad.map((dept, index) => ({
            name: dept.name,
            value: dept.value,
            color: colors[index % colors.length],
          }));
          setDeptData(newDeptData);
        } else {
          // Use default data if no department data is available
          setDeptData([
            { name: 'CS', value: 45, color: '#4e342e' },
            { name: 'MATH', value: 25, color: '#1a1210' },
            { name: 'PHYSICS', value: 20, color: '#8d6e63' },
            { name: 'OTHERS', value: 10, color: '#d7ccc8' },
          ]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard overview:', err);
      // Fall back to fetching individual counts
      try {
        const [profResponse, examResponse, salleResponse] = await Promise.all([
          professorService.getAll(1, 1000),
          examService.getAll(),
          salleService.getAll(1, 1000),
        ]);
        
        setDashboardData({
          stats: {
            active_professors: profResponse.data?.length || 0,
            scheduled_exams: examResponse.data?.length || 0,
            total_salles: salleResponse.data?.length || 0,
            allocation_rate: '0%',
          },
          quota_distribution: {},
          department_exam_load: [],
          upcoming_exams: [],
          recent_assignments: [],
        });
      } catch (fallbackErr) {
        console.error('Failed to fetch fallback data:', fallbackErr);
      }
    } finally {
      setIsDashboardLoading(false);
    }
  }, []);

  // Fetch data on tab change (must be after all fetch functions are defined)
  useEffect(() => {
    if (activeTab === "professors") fetchProfessors();
    if (activeTab === "exams") {
      fetchExams();
      fetchFilieresAndModules();
      fetchSalles();
      fetchDepartments();
    }
    if (activeTab === "departments") fetchDepartments();
    if (activeTab === "salles") fetchSalles();
    if (activeTab === "filieres" || activeTab === "modules") fetchFilieresAndModules();
    if (activeTab === "overview") fetchDashboardOverview();
  }, [activeTab, fetchDashboardOverview, fetchProfessors, fetchExams, fetchDepartments, fetchSalles, fetchFilieresAndModules]);

  // Initial fetch for overview when component mounts
  useEffect(() => {
    if (forcedTab === "overview" || activeTab === "overview") {
      fetchDashboardOverview();
    }
  }, [forcedTab, activeTab, fetchDashboardOverview]);

  // Form submit handlers
  const handleProfessorSubmit = async () => {
    // Validate required fields - for edit, password is optional
    if (!professorForm.username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (!professorForm.first_name.trim()) {
      setError('Please enter a first name');
      return;
    }
    if (!professorForm.last_name.trim()) {
      setError('Please enter a last name');
      return;
    }
    // For create, email and password are required; for edit, they're optional
    if (!selectedProfessor && !professorForm.email.trim()) {
      setError('Please enter an email');
      return;
    }
    
    if (!selectedProfessor && !professorForm.password.trim()) {
      setError('Please enter a password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      if (useMockData) {
        if (selectedProfessor) {
          // Update existing professor - update both professor and user data
          setProfessors(prev => prev.map(p => 
            p.id === selectedProfessor.id 
              ? {
                  ...p,
                  name: `${professorForm.first_name} ${professorForm.last_name}`,
                  dept: professorForm.department,
                  user: {
                    ...p.user,
                    username: professorForm.username || p.user?.username || '',
                    first_name: professorForm.first_name || p.user?.first_name || '',
                    last_name: professorForm.last_name || p.user?.last_name || '',
                    email: professorForm.email || p.user?.email || '',
                    institutional_grade: professorForm.institutional_grade || p.user?.institutional_grade || 'PR',
                  },
                }
              : p
          ));
          setSuccess('Professor updated successfully!');
        } else {
          // Add new professor
          setProfessors(prev => [
            ...prev,
            {
              id: prev.length + 1,
              name: `${professorForm.first_name} ${professorForm.last_name}`,
              dept: professorForm.department,
              guards: 0,
            }
          ]);
          setSuccess('Professor added successfully!');
        }
        
        // Reset form and close modal
        setProfessorForm({
          username: '',
          password: '',
          email: '',
          first_name: '',
          last_name: '',
          institutional_grade: 'PR',
          department: 'Computer Science'
        });
        setSelectedProfessor(null);
        setIsModalOpen(false);
        return;
      }

      // Real API call - get department ID first
      const deptResponse = await departmentService.getAll(1, 50);
      let dept = deptResponse.data?.find((d: any) => d.name === professorForm.department);
      
      // If editing and no department found by name, try to use the existing professor's department_id
      if (!dept && selectedProfessor?.department_id) {
        dept = deptResponse.data?.find((d: any) => d.id === selectedProfessor.department_id);
      }
      
      if (!dept) {
        setError('Department not found');
        return;
      }
      
      if (selectedProfessor) {
        // Update existing professor - only send fields that backend accepts
        const updateData: Partial<import('../types').Professor> = {
          department_id: dept.id,
          max_guards: 4,
          academic_title: professorForm.institutional_grade,
        };
        
        try {
          // Build user update object
          const userUpdate: any = {
            first_name: professorForm.first_name,
            last_name: professorForm.last_name,
            institutional_grade: professorForm.institutional_grade,
          };
          
          // Only include email and username if they were provided
          if (professorForm.email) {
            userUpdate.email = professorForm.email;
          }
          if (professorForm.username) {
            userUpdate.username = professorForm.username;
          }
          if (professorForm.password) {
            userUpdate.password = professorForm.password;
          }
          
          // Update user information first (if user exists)
          if (selectedProfessor.user?.id) {
            console.log('Updating user:', selectedProfessor.user.id, userUpdate);
            const userUpdateResponse = await authService.updateUser(selectedProfessor.user.id, userUpdate);
            console.log('User update response:', userUpdateResponse);
            if (!userUpdateResponse.success) {
              setError(userUpdateResponse.message || 'Failed to update user information.');
              return;
            }
          }
          
          // Update professor information
          console.log('Updating professor:', selectedProfessor.id, updateData);
          const updateResponse = await professorService.update(selectedProfessor.id, updateData);
          console.log('Professor update response:', updateResponse);
          
          if (updateResponse.success) {
            setSuccess('Professor updated successfully!');
            setProfessorForm({
              username: '',
              password: '',
              email: '',
              first_name: '',
              last_name: '',
              institutional_grade: 'PR',
              department: 'Computer Science'
            });
            setSelectedProfessor(null);
            setIsModalOpen(false);
            fetchProfessors();
          } else {
            setError(updateResponse.message || 'Failed to update professor. Please try again.');
          }
        } catch (err) {
          console.error('Error updating professor:', err);
          setError('Failed to update professor. Please try again.');
        }
      } else {
        // Create new professor using register endpoint
        const registerResponse = await authService.register({
          username: professorForm.username,
          password: professorForm.password,
          email: professorForm.email,
          first_name: professorForm.first_name,
          last_name: professorForm.last_name,
          role: 'professor',
          institutional_grade: professorForm.institutional_grade,
          department_id: dept.id
        });
        
        if (registerResponse.success) {
          setSuccess('Professor added successfully!');
          setProfessorForm({
            username: '',
            password: '',
            email: '',
            first_name: '',
            last_name: '',
            institutional_grade: 'PR',
            department: 'Computer Science'
          });
          setSelectedProfessor(null);
          setIsModalOpen(false);
          fetchProfessors();
        } else {
          setError(registerResponse.message || 'Failed to add professor');
        }
      }
    } catch (err) {
      setError(selectedProfessor ? 'Failed to update professor. Please try again.' : 'Failed to add professor. Please try again.');
      console.error(selectedProfessor ? 'Error updating professor:' : 'Error adding professor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkRoomAvailability = async (salleId: number, date: string, startTime: string, endTime: string, excludeExamId?: number): Promise<boolean> => {
    try {
      const examsInRoom = await examService.getBySalle(salleId);
      if (!examsInRoom.success || !examsInRoom.data) return true;
      
      for (const exam of examsInRoom.data) {
        if (excludeExamId && exam.id === excludeExamId) continue;
        
        if (exam.date !== date) continue;
        
        if (exam.start_time && exam.end_time) {
          const existingStart = exam.start_time;
          const existingEnd = exam.end_time;
          
          if (startTime < existingEnd && endTime > existingStart) {
            return false;
          }
        }
      }
      return true;
    } catch (err) {
      console.error('Error checking room availability:', err);
      return true;
    }
  };

  const handleExamSubmit = async () => {
    if (!examForm.module_id) {
      setError('Please select a module');
      return;
    }
    
    if (!examForm.date) {
      setError('Please select a date');
      return;
    }
    
    if (!examForm.start_time) {
      setError('Please select a start time');
      return;
    }
    
    if (!examForm.end_time) {
      setError('Please select an end time');
      return;
    }
    
    if (examForm.start_time >= examForm.end_time) {
      setError('End time must be after start time');
      return;
    }
    
    if (!examForm.salle_id) {
      setError('Please select a room');
      return;
    }
    
    if (!examForm.department_id) {
      setError('Department is automatically set based on the selected module. Please select a module first.');
      return;
    }
    
    // Check if there are available exam types for this module
    if (availableExamTypes.length === 0) {
      setError('No available exam types for this module. Both NORMAL and RATTRAPAGE exams already exist. Delete one to create a new exam.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if an exam with the same module and type already exists
      if (useMockData) {
        // For mock data, check existing exams
        const existingExam = exams.find(e => 
          e.module === examForm.module && 
          e.type === examForm.exam_type
        );
        if (existingExam) {
          setError(`An exam for ${examForm.module} with type ${examForm.exam_type} already exists. Only one ${examForm.exam_type} exam per module is allowed.`);
          setIsLoading(false);
          return;
        }
      } else {
        // For real API, fetch exams by module to check
        const moduleExamsResponse = await examService.getByModule(parseInt(examForm.module_id));
        if (moduleExamsResponse.success && moduleExamsResponse.data) {
          const existingExam = moduleExamsResponse.data.find((e: any) => 
            e.module_id === parseInt(examForm.module_id) && 
            e.exam_type === examForm.exam_type
          );
          if (existingExam) {
            setError(`An exam for ${examForm.module} with type ${examForm.exam_type} already exists. Only one ${examForm.exam_type} exam per module is allowed.`);
            setIsLoading(false);
            return;
          }
        }
      }

      const salleId = parseInt(examForm.salle_id);
      const date = examForm.date;
      const startTime = examForm.start_time;
      const endTime = examForm.end_time;
      
      const isAvailable = await checkRoomAvailability(salleId, date, startTime, endTime);
      if (!isAvailable) {
        setError('This room is not available at the selected time. Please choose a different room or time.');
        setIsLoading(false);
        return;
      }

      if (useMockData) {
        setExams(prev => [
          ...prev,
          {
            id: prev.length + 1,
            module: examForm.module,
            date: examForm.date,
            time: `${examForm.start_time} - ${examForm.end_time}`,
            type: examForm.exam_type,
            room: examForm.salle,
          }
        ]);
        setSuccess('Exam scheduled successfully!');
        setExamForm({
          module_id: '',
          module: '',
          date: '',
          start_time: '',
          end_time: '',
          salle_id: '',
          salle: '',
          exam_type: 'NORMAL',
          department_id: '',
          department_name: '',
          notes: '',
        });
        setIsModalOpen(false);
        return;
      }

      // Real API call
      await examService.create({
        module: examForm.module,
        module_id: parseInt(examForm.module_id) || 0,
        module_code: modules.find(m => m.id === parseInt(examForm.module_id))?.code || '',
        exam_type: examForm.exam_type,
        date: examForm.date,
        start_time: examForm.start_time,
        end_time: examForm.end_time,
        salle_id: salleId,
        department_id: parseInt(examForm.department_id),
        academic_year: '2025-2026',
        semester: 'S2',
        status: 'SCHEDULED',
        notes: examForm.notes || '',
      });
      
      setSuccess('Exam scheduled successfully!');
      setExamForm({
        module_id: '',
        module: '',
        date: '',
        start_time: '',
        end_time: '',
        salle_id: '',
        salle: '',
        exam_type: 'NORMAL',
        department_id: '',
        department_name: '',
        notes: '',
      });
      setIsModalOpen(false);
      fetchExams();
    } catch (err) {
      setError('Failed to schedule exam. Please try again.');
      console.error('Error adding exam:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResourceSubmit = async () => {
    if (!resourceForm.name.trim()) {
      setError('Please enter a resource name');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (useMockData) {
        if (activeTab === "salles") {
          if (editingSalle) {
            setSalles(prev => prev.map(s => 
              s.id === editingSalle.id 
                ? {
                    ...s,
                    name: resourceForm.name,
                    code: resourceForm.code || resourceForm.name.split(' ')[0],
                    capacity: parseInt(resourceForm.capacity) || 50,
                    type: resourceForm.type || 'SALLE',
                    floor: resourceForm.floor || '1',
                    building: resourceForm.building || 'Main',
                  }
                : s
            ));
            setSuccess('Salle updated successfully!');
          } else {
            setSalles(prev => [
              ...prev,
              {
                id: prev.length + 1,
                name: resourceForm.name,
                code: resourceForm.code || resourceForm.name.split(' ')[0],
                capacity: parseInt(resourceForm.capacity) || 50,
                type: resourceForm.type || 'SALLE',
                floor: resourceForm.floor || '1',
                building: resourceForm.building || 'Main',
                is_active: true,
              }
            ]);
            setSuccess('Salle added successfully!');
          }
        } else if (activeTab === "departments") {
          if (editingDepartment) {
            setDepartments(prev => prev.map(d => 
              d.id === editingDepartment.id 
                ? {
                    ...d,
                    name: resourceForm.name,
                    code: resourceForm.code || resourceForm.name.substring(0, 4).toUpperCase(),
                  }
                : d
            ));
            setSuccess('Department updated successfully!');
          } else {
            setDepartments(prev => [
              ...prev,
              {
                id: prev.length + 1,
                name: resourceForm.name,
                head: 'Admin',
                staff: 0,
              }
            ]);
            setSuccess('Department added successfully!');
          }
        }
        
        setResourceForm({ name: '', code: '', capacity: '', type: 'SALLE', floor: '1', building: 'Main' });
        setEditingSalle(null);
        setEditingDepartment(null);
        setIsModalOpen(false);
        return;
      }

      // Real API call
      if (activeTab === "salles") {
        if (editingSalle) {
          await salleService.update(editingSalle.id, {
            name: resourceForm.name,
            code: resourceForm.code || resourceForm.name.split(' ')[0],
            capacity: parseInt(resourceForm.capacity) || 0,
            type: resourceForm.type || 'SALLE',
            floor: resourceForm.floor || '1',
            building: resourceForm.building || 'Main',
          });
          setSuccess('Salle updated successfully!');
        } else {
          await salleService.create({
            name: resourceForm.name,
            code: resourceForm.code || resourceForm.name.split(' ')[0],
            capacity: parseInt(resourceForm.capacity) || 0,
            type: resourceForm.type || 'SALLE',
            floor: resourceForm.floor || '1',
            building: resourceForm.building || 'Main',
            is_active: true,
          });
          setSuccess('Salle added successfully!');
        }
        fetchSalles();
      } else if (activeTab === "departments") {
        if (editingDepartment) {
          await departmentService.update(editingDepartment.id, {
            name: resourceForm.name,
            code: resourceForm.code || resourceForm.name.substring(0, 4).toUpperCase(),
          });
          setSuccess('Department updated successfully!');
        } else {
          await departmentService.create({
            name: resourceForm.name,
            code: resourceForm.code || resourceForm.name.substring(0, 4).toUpperCase(),
            staff_count: 0,
          });
          setSuccess('Department added successfully!');
        }
        fetchDepartments();
      }
      
      setResourceForm({ name: '', code: '', capacity: '', type: 'SALLE', floor: '1', building: 'Main' });
      setEditingSalle(null);
      setEditingDepartment(null);
      setIsModalOpen(false);
    } catch (err) {
      setError('Failed to save resource. Please try again.');
      console.error('Error saving resource:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSalle = (salle: typeof salles[0]) => {
    setEditingSalle(salle);
    setResourceForm({
      name: salle.name,
      code: salle.code || '',
      capacity: salle.capacity?.toString() || '',
      type: salle.type || 'SALLE',
      floor: salle.floor || '1',
      building: salle.building || 'Main',
    });
    setIsModalOpen(true);
  };

  const handleDeleteSalle = async (salleId: number) => {
    try {
      setIsLoading(true);
      if (useMockData) {
        setSalles(prev => prev.filter(s => s.id !== salleId));
      } else {
        await salleService.delete(salleId);
        fetchSalles();
      }
      setSuccess('Salle deleted successfully!');
      setDeleteConfirmId(null);
    } catch (err) {
      setError('Failed to delete salle. Please try again.');
      console.error('Error deleting salle:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditDepartment = (department: typeof departments[0]) => {
    setEditingDepartment(department);
    setResourceForm({
      name: department.name,
      code: department.code || '',
      capacity: '',
      type: 'SALLE',
      floor: '1',
      building: 'Main',
    });
    setIsModalOpen(true);
  };

  const handleDeleteDepartment = async (departmentId: number) => {
    try {
      setIsLoading(true);
      if (useMockData) {
        setDepartments(prev => prev.filter(d => d.id !== departmentId));
      } else {
        await departmentService.delete(departmentId);
        fetchDepartments();
      }
      setSuccess('Department deleted successfully!');
      setDeleteConfirmId(null);
    } catch (err) {
      setError('Failed to delete department. Please try again.');
      console.error('Error deleting department:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfessor = (professor: typeof professors[0]) => {
    // Set selected professor to trigger useEffect
    setSelectedProfessor(professor);
    setIsModalOpen(true);
  };

  const handleDeleteProfessor = async (professorId: number) => {
    try {
      setIsLoading(true);
      if (useMockData) {
        setProfessors(prev => prev.filter(p => p.id !== professorId));
      } else {
        await professorService.delete(professorId);
        fetchProfessors();
      }
      setSuccess('Professor deleted successfully!');
      setDeleteConfirmId(null);
    } catch (err) {
      setError('Failed to delete professor. Please try again.');
      console.error('Error deleting professor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Exam handlers
  const showExamGuards = (exam: typeof exams[0]) => {
    // Find the exam's module to get department info
    const examModule = modules.find(m => m.id === exam.module_id) as any;
    let deptId = exam.department_id;
    let salleId = exam.salle_id;
    
    // Try to get department from module's filier if not directly on exam
    if (!deptId && examModule?.filier_id) {
      const filier = filieres.find(f => f.id === examModule.filier_id);
      deptId = filier?.department_id;
    }
    
    // Try to get salle_id if not available
    if (!salleId && exam.room) {
      const salle = salles.find(s => s.name === exam.room);
      salleId = salle?.id;
    }
    
    setSelectedExamGuards({
      id: exam.id,
      module: exam.module || 'Unknown',
      module_id: exam.module_id || 0,
      date: exam.date,
      time: exam.time,
      room: exam.room,
      guards: exam.guards || [],
      guardCount: exam.guardCount || 0,
      associatedProfessor: exam.associatedProfessor || { name: 'Not Assigned', id: null },
      associatedProfessors: exam.associatedProfessors || [],
      moduleProfessorDept: exam.moduleProfessorDept || 'Unknown',
      salle_id: salleId,
      department_id: deptId
    });
    setIsGuardsModalOpen(true);
  };

  // Assign Guard handlers
  const openAssignGuardModal = async () => {
    if (!selectedExamGuards) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all professors with their quota status
      const professorsResponse = await professorService.getAll(1, 100);
      const allProfessors = professorsResponse.success && professorsResponse.data 
        ? professorsResponse.data 
        : [];
      
      // Get all modules to find the current exam's module
      const modulesResponse = await moduleService.getAll(1, 100);
      const allModules = modulesResponse.success && modulesResponse.data 
        ? modulesResponse.data 
        : [];
      
      // Get all filieres
      const filieresResponse = await filierService.getAll(1, 100);
      const allFilieres = filieresResponse.success && filieresResponse.data 
        ? filieresResponse.data 
        : [];
      
      // Get all departments
      const deptsResponse = await departmentService.getAll(1, 50);
      const allDepartments = deptsResponse.success && deptsResponse.data 
        ? deptsResponse.data 
        : [];
      
      // Find the current exam's module
      const examModule = allModules.find(m => m.id === selectedExamGuards.module_id) as any;
      
      // Determine the target department (module's department or exam's department)
      let targetDeptId = selectedExamGuards.department_id;
      if (!targetDeptId && examModule?.filier_id) {
        const filier = allFilieres.find(f => f.id === examModule.filier_id);
        targetDeptId = filier?.department_id;
      }
      if (!targetDeptId && examModule?.department_id) {
        targetDeptId = examModule.department_id;
      }
      
      // Get associated professor IDs for auto-selection
      const associatedProfessorIds = new Set<number>(
        selectedExamGuards.associatedProfessors.map(p => p.id)
      );
      if (selectedExamGuards.associatedProfessor?.id) {
        associatedProfessorIds.add(selectedExamGuards.associatedProfessor.id);
      }
      
      // Get already assigned guard IDs to exclude
      const assignedGuardIds = new Set<number>(
        selectedExamGuards.guards.map(g => g.id)
      );
      
      // Filter available professors:
      // 1. Not already assigned as guard to this exam
      // 2. Have quota available (completed_guards < max_guards, typically 4)
      // 3. Prefer same department as module's department
      const availableProfList = allProfessors
        .filter(p => !assignedGuardIds.has(p.id))
        .filter(p => !p.is_quota_full)
        .map(prof => {
          const dept = allDepartments.find(d => d.id === prof.department_id);
          return {
            id: prof.id,
            name: prof.name || (prof.user ? `${prof.user.first_name} ${prof.user.last_name}` : 'Unknown'),
            department: prof.department || dept?.name || 'Unknown',
            department_id: prof.department_id,
            completed_guards: prof.completed_guards || 0,
            max_guards: prof.max_guards || 4,
            is_quota_full: prof.is_quota_full || false,
            is_selected: associatedProfessorIds.has(prof.id),
            is_associated: associatedProfessorIds.has(prof.id)
          };
        })
        .sort((a, b) => {
          // Sort by: associated first, then same department, then name
          if (a.is_associated !== b.is_associated) return a.is_associated ? -1 : 1;
          if (a.department_id === targetDeptId && b.department_id !== targetDeptId) return -1;
          if (a.department_id !== targetDeptId && b.department_id === targetDeptId) return 1;
          return a.name.localeCompare(b.name);
        });
      
      setAvailableProfessors(availableProfList);
      
      // Auto-select associated professors (max 4 for auto-assignment)
      const autoSelectIds = Array.from(associatedProfessorIds)
        .filter(id => availableProfList.some(p => p.id === id))
        .slice(0, 4); // Max 4 for auto-selection
      
      setSelectedProfessorIds(autoSelectIds);
      
      setIsAssignGuardModalOpen(true);
      
    } catch (err) {
      console.error('Error loading available professors:', err);
      setError('Failed to load available professors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfessorSelection = (professorId: number) => {
    setSelectedProfessorIds(prev => {
      if (prev.includes(professorId)) {
        return prev.filter(id => id !== professorId);
      } else {
        // Limit to 4 guards per exam (or more if needed, but check quota)
        if (prev.length >= 4) {
          return prev; // Don't allow more than 4 guards per exam for now
        }
        return [...prev, professorId];
      }
    });
  };

  const handleSelectAllAssociated = () => {
    if (!selectedExamGuards) return;
    
    const associatedProfessorIds = new Set<number>(
      selectedExamGuards.associatedProfessors.map(p => p.id)
    );
    if (selectedExamGuards.associatedProfessor?.id) {
      associatedProfessorIds.add(selectedExamGuards.associatedProfessor.id);
    }
    
    // Filter to only available professors and limit to 4
    const availableAssociatedIds = Array.from(associatedProfessorIds)
      .filter(id => availableProfessors.some(p => p.id === id && !p.is_quota_full))
      .slice(0, 4);
    
    setSelectedProfessorIds(availableAssociatedIds);
  };

  // Auto-assignment logic based on user requirements
  const handleAutoAssign = () => {
    if (!selectedExamGuards) return;
    
    // Get all available professors from same department as module's filier
    const examModule = modules.find(m => m.id === selectedExamGuards.module_id) as any;
    let targetDeptId = selectedExamGuards.department_id;
    
    if (!targetDeptId && examModule?.filier_id) {
      const filier = filieres.find(f => f.id === examModule.filier_id);
      targetDeptId = filier?.department_id;
    }
    if (!targetDeptId && examModule?.department_id) {
      targetDeptId = examModule.department_id;
    }
    
    // Get associated professor IDs (module professor + filier professors)
    const associatedProfessorIds = new Set<number>(
      selectedExamGuards.associatedProfessors.map(p => p.id)
    );
    if (selectedExamGuards.associatedProfessor?.id) {
      associatedProfessorIds.add(selectedExamGuards.associatedProfessor.id);
    }
    
    // Filter available professors:
    // 1. From same department as module
    // 2. Not already assigned
    // 3. Have quota available
    const deptProfessors = availableProfessors.filter(p => 
      p.department_id === targetDeptId && !p.is_quota_full
    );
    
    const associatedAndAvailable = deptProfessors.filter(p => 
      associatedProfessorIds.has(p.id)
    );
    
    // User's logic (as per request):
    // "normal is 3 prof and prof of module (4 in total) normal"
    // "but if min 3 professor is not problem accepte"
    // "but if superieur 3 not" (if > 3, not acceptable for auto)
    // "but if inferieur is normal" (if < 3, normal)
    // 
    // Interpretation:
    // - ≤3 associated professors: NORMAL - auto-assign all
    // - 4 associated professors (3 + module prof): NORMAL - auto-assign all
    // - >4 associated professors: NOT acceptable - manual selection required
    // - <3 associated professors: NORMAL - auto-assign all
    
    const associatedCount = associatedAndAvailable.length;
    let professorsToSelect: number[] = [];
    
    if (associatedCount > 4) {
      // More than 4 associated professors - NOT acceptable for auto
      setError(`Cannot auto-assign: ${associatedCount} associated professors found. Maximum 4 guards per exam. Please select manually.`);
      return;
    }
    
    if (associatedCount <= 4) {
      // NORMAL case: 1, 2, 3, or 4 associated professors - assign all
      professorsToSelect = associatedAndAvailable.map(p => p.id);
    }
    
    // If we have room for more guards (less than 4 total), 
    // also try to add other professors from same department
    const currentTotal = selectedExamGuards.guardCount + professorsToSelect.length;
    if (currentTotal < 4) {
      const remainingSlots = 4 - currentTotal;
      const otherDeptProfessors = deptProfessors.filter(p => 
        !associatedProfessorIds.has(p.id) && 
        !professorsToSelect.includes(p.id)
      );
      
      const additionalProfessors = otherDeptProfessors.slice(0, remainingSlots);
      professorsToSelect = [...professorsToSelect, ...additionalProfessors.map(p => p.id)];
    }
    
    // Final check: don't exceed 4 guards total for this exam
    const totalAfter = selectedExamGuards.guardCount + professorsToSelect.length;
    if (totalAfter > 4) {
      professorsToSelect = professorsToSelect.slice(0, 4 - selectedExamGuards.guardCount);
    }
    
    setSelectedProfessorIds(professorsToSelect);
    
    // Show success message with case analysis
    const caseDescription = associatedCount <= 3 
      ? "≤3 associated professors: NORMAL case"
      : associatedCount === 4 
        ? "4 associated professors: NORMAL case (3 + module prof)"
        : "Manual selection required";
    
    if (professorsToSelect.length > 0) {
      setSuccess(`✓ Auto-selected ${professorsToSelect.length} professor(s). ${caseDescription}`);
    } else {
      setError('No available professors to auto-assign.');
    }
  };

  const handleAssignGuards = async () => {
    if (!selectedExamGuards || selectedProfessorIds.length === 0) {
      setError('Please select at least one professor to assign as guard.');
      return;
    }
    
    // Check if any selected professor is at quota limit
    const quotaFullProfessors = availableProfessors
      .filter(p => selectedProfessorIds.includes(p.id) && p.is_quota_full);
    
    if (quotaFullProfessors.length > 0) {
      setError(`${quotaFullProfessors.map(p => p.name).join(', ')} have reached their guard quota (4). Cannot assign.`);
      return;
    }
    
    // Check if we're trying to assign more than 4 guards total
    const totalGuardsAfter = selectedExamGuards.guardCount + selectedProfessorIds.length;
    if (totalGuardsAfter > 4) {
      setError(`Cannot assign more than 4 guards total to an exam. Currently: ${selectedExamGuards.guardCount}, Selected: ${selectedProfessorIds.length}`);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Assign each selected professor
      const assignments: any[] = [];
      for (const profId of selectedProfessorIds) {
        if (useMockData) {
          // Update local state for mock data
          const prof = availableProfessors.find(p => p.id === profId);
          if (prof) {
            assignments.push({
              id: Date.now() + profId,
              professor_id: profId,
              professor: prof.name,
              professor_department: prof.department,
              exam_id: selectedExamGuards.id,
              exam_module: selectedExamGuards.module,
              exam_date: selectedExamGuards.date,
              exam_time: selectedExamGuards.time,
              exam_room: selectedExamGuards.room,
              status: 'CONFIRMED',
              assignment_date: new Date().toISOString()
            });
          }
        } else {
          // Real API call
          const response = await examService.assignProfessor(
            selectedExamGuards.id,
            profId,
            `Auto-assigned as guard for ${selectedExamGuards.module}`
          );
          if (response.success) {
            assignments.push(response.data);
          } else {
            console.error(`Failed to assign professor ${profId}:`, response.message);
          }
        }
      }
      
      if (useMockData) {
        // Update local exams state
        setExams(prev => prev.map(exam => {
          if (exam.id === selectedExamGuards.id) {
            const newGuards = [...(exam.guards || []), ...assignments.map(a => ({
              name: a.professor,
              department: a.professor_department,
              id: a.professor_id
            }))];
            return {
              ...exam,
              guards: newGuards,
              guardCount: newGuards.length
            };
          }
          return exam;
        }));
        
        // Update selectedExamGuards to reflect new assignments
        setSelectedExamGuards(prev => prev ? {
          ...prev,
          guards: [...(prev.guards || []), ...assignments.map(a => ({
            name: a.professor,
            department: a.professor_department,
            id: a.professor_id
          }))],
          guardCount: (prev.guardCount || 0) + assignments.length
        } : null);
      }
      
      setSuccess(`${assignments.length} guard(s) assigned successfully!`);
      setIsAssignGuardModalOpen(false);
      setSelectedProfessorIds([]);
      
      // Refresh exam data
      if (!useMockData) {
        await refreshExamGuards();
      }
      
    } catch (err) {
      console.error('Error assigning guards:', err);
      setError('Failed to assign guards. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Remove Guard functionality
  const handleRemoveGuard = async () => {
    if (!guardToRemove || !selectedExamGuards) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (useMockData) {
        // Update local state for mock data
        setExams(prev => prev.map(exam => {
          if (exam.id === selectedExamGuards.id) {
            const newGuards = exam.guards?.filter(g => g.id !== guardToRemove.id) || [];
            return {
              ...exam,
              guards: newGuards,
              guardCount: newGuards.length
            };
          }
          return exam;
        }));
        
        // Update selectedExamGuards
        setSelectedExamGuards(prev => prev ? {
          ...prev,
          guards: prev.guards.filter(g => g.id !== guardToRemove.id),
          guardCount: prev.guardCount - 1
        } : null);
        
        setSuccess(`Guard ${guardToRemove.name} removed successfully!`);
      } else {
        // Real API call
        const response = await examService.unassignProfessor(
          selectedExamGuards.id,
          guardToRemove.id
        );
        
        if (response.success) {
          setSuccess(`Guard ${guardToRemove.name} removed successfully!`);
          // Refresh data
          await refreshExamGuards();
        } else {
          setError(response.message || 'Failed to remove guard.');
        }
      }
      
      // Close confirmation modal
      setIsRemoveConfirmModalOpen(false);
      setGuardToRemove(null);
      
    } catch (err) {
      console.error('Error removing guard:', err);
      setError('Failed to remove guard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openRemoveConfirm = (guard: {id: number; name: string}, index: number) => {
    setGuardToRemove({...guard, index});
    setIsRemoveConfirmModalOpen(true);
  };

  // Refresh the guards for the currently selected exam
  const refreshExamGuards = useCallback(async () => {
    if (!selectedExamGuards) return;
    
    try {
      // Fetch fresh exam data with assignments
      const examResponse = await examService.getById(selectedExamGuards.id);
      if (examResponse.success && examResponse.data) {
        const freshExam = examResponse.data;
        
        // Fetch assignments for this exam
        const assignmentsResponse = await examService.getAssignments(selectedExamGuards.id);
        const assignments: any[] = assignmentsResponse.success && assignmentsResponse.data 
          ? assignmentsResponse.data 
          : [];
        
        // Get all professors for department info
        const professorsResponse = await professorService.getAll(1, 100);
        const allProfessors = professorsResponse.success && professorsResponse.data 
          ? professorsResponse.data 
          : [];
        
        // Get all filieres and modules for associated professors
        const filieresResponse = await filierService.getAll(1, 100);
        const allFilieres = filieresResponse.success && filieresResponse.data 
          ? filieresResponse.data 
          : [];
        
        // Get all modules
        const modulesResponse = await moduleService.getAll(1, 100);
        const allModules = modulesResponse.success && modulesResponse.data 
          ? modulesResponse.data 
          : [];
        
        // Get all departments
        const deptsResponse = await departmentService.getAll(1, 50);
        const allDepartments = deptsResponse.success && deptsResponse.data 
          ? deptsResponse.data 
          : [];
        
        // Build associated professors from module
        const examModule = allModules.find(m => m.id === freshExam.module_id) as any;
        let associatedProfessors: Array<{name: string; id: number; department: string}> = [];
        
        if (freshExam.associated_professors && Array.isArray(freshExam.associated_professors) && freshExam.associated_professors.length > 0) {
          associatedProfessors = freshExam.associated_professors.map((p: any) => ({
            name: p.name || 'Unknown',
            id: p.id,
            department: p.department || 'Unknown'
          }));
        } else if (examModule?.professor_id) {
          const prof = allProfessors.find((p: any) => p.id === examModule.professor_id);
          if (prof) {
            associatedProfessors = [{
              name: prof.name || prof.user?.full_name || 'Unknown',
              id: prof.id,
              department: prof.department || allDepartments.find((d: any) => d.id === prof.department_id)?.name || 'Unknown'
            }];
          }
        } else if (examModule?.filier_id) {
          const filier = allFilieres.find(f => f.id === examModule.filier_id);
          if (filier && filier.professors) {
            associatedProfessors = filier.professors.map((p: any) => ({
              name: p.name || p.user?.full_name || 'Unknown',
              id: p.id,
              department: p.department || allDepartments.find((d: any) => d.id === p.department_id)?.name || 'Unknown'
            }));
          }
        }
        
        // Build associated professor (first one for backward compatibility)
        const associatedProfessor = associatedProfessors.length > 0 ? {
          name: associatedProfessors[0].name,
          id: associatedProfessors[0].id
        } : { name: 'Not Assigned', id: null };
        
        // Get module professor department
        let moduleProfessorDept = 'Unknown';
        if (examModule?.professor_id) {
          const prof = allProfessors.find((p: any) => p.id === examModule.professor_id);
          moduleProfessorDept = prof?.department || allDepartments.find((d: any) => d.id === prof?.department_id)?.name || 'Unknown';
        }
        
        // Build guards list from assignments
        const guards = assignments.map((a: any) => ({
          name: a.professor || a.professor_name || 'Unknown',
          department: a.professor_department || 'Unknown',
          id: a.professor_id
        }));
        
        // Update the selected exam guards
        setSelectedExamGuards({
          id: freshExam.id,
          module: freshExam.module || 'Unknown',
          module_id: freshExam.module_id || 0,
          date: freshExam.date,
          time: `${freshExam.start_time} - ${freshExam.end_time}`,
          room: typeof freshExam.salle === 'string' ? freshExam.salle : freshExam.salle?.name || 'Unknown',
          salle_id: freshExam.salle_id,
          department_id: freshExam.department_id,
          guards: guards,
          guardCount: guards.length,
          associatedProfessor: associatedProfessor,
          associatedProfessors: associatedProfessors,
          moduleProfessorDept: moduleProfessorDept
        });
        
        // Also update the exams list
        setExams(prev => prev.map(exam => 
          exam.id === freshExam.id 
            ? {
                ...exam,
                guards: guards,
                guardCount: guards.length,
                associatedProfessor: associatedProfessor,
                associatedProfessors: associatedProfessors,
                moduleProfessorDept: moduleProfessorDept
              }
            : exam
        ));
        
      }
    } catch (err) {
      console.error('Error refreshing exam guards:', err);
      // Fallback: just fetch all exams
      await fetchExams();
    }
  }, [selectedExamGuards, fetchExams, professorService, examService, moduleService, filierService, departmentService]);

  // Replace Guard functionality
  const openReplaceGuardModal = async (guard: {id: number; name: string}, index: number) => {
    setGuardToReplace({...guard, index});
    
    // Open the assign modal but with the guard to replace pre-selected for removal
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all professors with their quota status
      const professorsResponse = await professorService.getAll(1, 100);
      const allProfessors = professorsResponse.success && professorsResponse.data 
        ? professorsResponse.data 
        : [];
      
      // Get all modules to find the current exam's module
      const modulesResponse = await moduleService.getAll(1, 100);
      const allModules = modulesResponse.success && modulesResponse.data 
        ? modulesResponse.data 
        : [];
      
      // Get all filieres
      const filieresResponse = await filierService.getAll(1, 100);
      const allFilieres = filieresResponse.success && filieresResponse.data 
        ? filieresResponse.data 
        : [];
      
      // Get all departments
      const deptsResponse = await departmentService.getAll(1, 50);
      const allDepartments = deptsResponse.success && deptsResponse.data 
        ? deptsResponse.data 
        : [];
      
      // Find the current exam's module
      const examModule = allModules.find(m => m.id === selectedExamGuards?.module_id) as any;
      
      // Determine the target department
      let targetDeptId = selectedExamGuards?.department_id;
      if (!targetDeptId && examModule?.filier_id) {
        const filier = allFilieres.find(f => f.id === examModule.filier_id);
        targetDeptId = filier?.department_id;
      }
      if (!targetDeptId && examModule?.department_id) {
        targetDeptId = examModule.department_id;
      }
      
      // Get associated professor IDs for auto-selection
      const associatedProfessorIds = new Set<number>(
        selectedExamGuards?.associatedProfessors?.map(p => p.id) || []
      );
      if (selectedExamGuards?.associatedProfessor?.id) {
        associatedProfessorIds.add(selectedExamGuards.associatedProfessor.id);
      }
      
      // Get already assigned guard IDs to exclude (except the one being replaced)
      const assignedGuardIds = new Set<number>(
        selectedExamGuards?.guards?.map(g => g.id) || []
      );
      // Remove the guard being replaced from the exclusion set
      assignedGuardIds.delete(guard.id);
      
      // Filter available professors:
      // 1. Not already assigned as guard to this exam (except the one being replaced)
      // 2. Have quota available (completed_guards < max_guards, typically 4)
      // 3. Prefer same department as module's department
      const availableProfList = allProfessors
        .filter(p => !assignedGuardIds.has(p.id))
        .filter(p => !p.is_quota_full)
        .map(prof => {
          const dept = allDepartments.find(d => d.id === prof.department_id);
          return {
            id: prof.id,
            name: prof.name || (prof.user ? `${prof.user.first_name} ${prof.user.last_name}` : 'Unknown'),
            department: prof.department || dept?.name || 'Unknown',
            department_id: prof.department_id,
            completed_guards: prof.completed_guards || 0,
            max_guards: prof.max_guards || 4,
            is_quota_full: prof.is_quota_full || false,
            is_selected: false,
            is_associated: associatedProfessorIds.has(prof.id)
          };
        })
        .sort((a, b) => {
          // Sort by: associated first, then same department, then name
          if (a.is_associated !== b.is_associated) return a.is_associated ? -1 : 1;
          if (a.department_id === targetDeptId && b.department_id !== targetDeptId) return -1;
          if (a.department_id !== targetDeptId && b.department_id === targetDeptId) return 1;
          return a.name.localeCompare(b.name);
        });
      
      setAvailableProfessors(availableProfList);
      setSelectedProfessorIds([]); // Start fresh for replace
      setIsReplaceGuardModalOpen(true);
      
    } catch (err) {
      console.error('Error loading available professors for replace:', err);
      setError('Failed to load available professors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceGuard = async () => {
    if (!guardToReplace || !selectedExamGuards || selectedProfessorIds.length === 0) {
      setError('Please select a professor to replace the current guard.');
      return;
    }
    
    // Can only replace with one professor at a time
    const newProfessorId = selectedProfessorIds[0];
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, unassign the old guard
      if (useMockData) {
        // Update local state for mock data - remove old, add new
        setExams(prev => prev.map(exam => {
          if (exam.id === selectedExamGuards.id) {
            const newGuards = exam.guards?.filter(g => g.id !== guardToReplace.id) || [];
            const newProfessor = availableProfessors.find(p => p.id === newProfessorId);
            if (newProfessor) {
              newGuards.push({
                name: newProfessor.name,
                department: newProfessor.department,
                id: newProfessor.id
              });
            }
            return {
              ...exam,
              guards: newGuards,
              guardCount: newGuards.length
            };
          }
          return exam;
        }));
        
        // Update selectedExamGuards
        const newProfessor = availableProfessors.find(p => p.id === newProfessorId);
        setSelectedExamGuards(prev => prev ? {
          ...prev,
          guards: prev.guards
            .filter(g => g.id !== guardToReplace.id)
            .concat(newProfessor ? [{
              name: newProfessor.name,
              department: newProfessor.department,
              id: newProfessor.id
            }] : []),
          guardCount: prev.guardCount
        } : null);
        
        setSuccess(`Guard replaced: ${guardToReplace.name} → ${newProfessor?.name || 'New Professor'}`);
      } else {
        // Real API calls
        // Step 1: Unassign old guard
        const unassignResponse = await examService.unassignProfessor(
          selectedExamGuards.id,
          guardToReplace.id
        );
        
        if (!unassignResponse.success) {
          setError(unassignResponse.message || 'Failed to remove old guard.');
          return;
        }
        
        // Step 2: Assign new guard
        const assignResponse = await examService.assignProfessor(
          selectedExamGuards.id,
          newProfessorId,
          `Replacement for ${guardToReplace.name}`
        );
        
        if (assignResponse.success) {
          setSuccess(`Guard replaced: ${guardToReplace.name} → ${availableProfessors.find(p => p.id === newProfessorId)?.name || 'New Professor'}`);
          // Refresh data
          await refreshExamGuards();
        } else {
          setError(assignResponse.message || 'Failed to assign new guard.');
        }
      }
      
      // Close modals
      setIsReplaceGuardModalOpen(false);
      setGuardToReplace(null);
      setSelectedProfessorIds([]);
      
    } catch (err) {
      console.error('Error replacing guard:', err);
      setError('Failed to replace guard. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditExam = (exam: typeof exams[0]) => {
    // Try to find module by module_id first, then by name
    let selectedModule = modules.find(m => m.id === exam.module_id);
    if (!selectedModule) {
      selectedModule = modules.find(m => m.name === exam.module);
    }
    
    let deptId = '';
    let deptName = '';
    
    if (selectedModule) {
      deptId = selectedModule.department_id?.toString() || '';
      if (!deptId && selectedModule.filier_id) {
        const filier = filieres.find(f => f.id === selectedModule.filier_id);
        deptId = filier?.department_id?.toString() || '';
      }
      if (deptId) {
        deptName = departments.find(d => d.id.toString() === deptId)?.name || 'Unknown';
      } else {
        deptName = 'Unknown';
      }
    }
    
    // Set the exam data for editing
    const examToEdit = {
      id: exam.id,
      module_id: exam.module_id?.toString() || selectedModule?.id?.toString() || '',
      module: exam.module,
      date: exam.date,
      start_time: exam.time?.split(' - ')[0] || '',
      end_time: exam.time?.split(' - ')[1] || '',
      salle_id: salles.find(s => s.name === exam.room)?.id?.toString() || '',
      salle: exam.room,
      exam_type: exam.type,
      department_id: deptId,
      department_name: deptName,
      notes: '',
    };
    setEditingExam(examToEdit);
    setExamForm(examToEdit);
    
    // Fetch available exam types for this module (excluding current exam)
    if (useMockData) {
      const existingExams = exams.filter(e => e.module === exam.module && e.id !== exam.id);
      const existingTypes = existingExams.map(e => e.type);
      const availableTypes = ['NORMAL', 'RATTRAPAGE'].filter(t => !existingTypes.includes(t));
      setAvailableExamTypes(availableTypes);
    } else {
      // For real API, we'll fetch in the module selection
      setAvailableExamTypes(['NORMAL', 'RATTRAPAGE']);
    }
    
    setIsModalOpen(true);
  };

  const handleDeleteExam = async (examId: number) => {
    try {
      setIsLoading(true);
      if (useMockData) {
        setExams(prev => prev.filter(e => e.id !== examId));
      } else {
        await examService.delete(examId);
        fetchExams();
        fetchFilieresAndModules(); // Refresh to update available types
      }
      setSuccess('Exam deleted successfully!');
      setDeleteConfirmId(null);
      setDeleteConfirmType(null);
    } catch (err) {
      setError('Failed to delete exam. Please try again.');
      console.error('Error deleting exam:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateExam = async () => {
    if (!editingExam) return;
    
    // Use the same validation as create
    if (!examForm.module_id) {
      setError('Please select a module');
      return;
    }
    
    if (!examForm.date) {
      setError('Please select a date');
      return;
    }
    
    if (!examForm.start_time) {
      setError('Please select a start time');
      return;
    }
    
    if (!examForm.end_time) {
      setError('Please select an end time');
      return;
    }
    
    if (examForm.start_time >= examForm.end_time) {
      setError('End time must be after start time');
      return;
    }
    
    if (!examForm.salle_id) {
      setError('Please select a room');
      return;
    }
    
    if (!examForm.department_id) {
      setError('Department is automatically set based on the selected module. Please select a module first.');
      return;
    }
    
    if (availableExamTypes.length === 0) {
      setError('No available exam types for this module.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const salleId = parseInt(examForm.salle_id);
      const date = examForm.date;
      const startTime = examForm.start_time;
      const endTime = examForm.end_time;
      
      // Check room availability (exclude current exam from check)
      const isAvailable = await checkRoomAvailability(salleId, date, startTime, endTime, editingExam.id);
      if (!isAvailable) {
        setError('This room is not available at the selected time. Please choose a different room or time.');
        setIsLoading(false);
        return;
      }

      if (useMockData) {
        setExams(prev => prev.map(e => 
          e.id === editingExam.id 
            ? {
                ...e,
                module: examForm.module,
                date: examForm.date,
                time: `${examForm.start_time} - ${examForm.end_time}`,
                type: examForm.exam_type,
                room: examForm.salle,
              }
            : e
        ));
        setSuccess('Exam updated successfully!');
        setExamForm({
          module_id: '',
          module: '',
          date: '',
          start_time: '',
          end_time: '',
          salle_id: '',
          salle: '',
          exam_type: 'NORMAL',
          department_id: '',
          department_name: '',
          notes: '',
        });
        setEditingExam(null);
        setAvailableExamTypes(['NORMAL', 'RATTRAPAGE']);
        setIsModalOpen(false);
        return;
      }

      // Real API call - update exam
      await examService.update(editingExam.id, {
        module: examForm.module,
        module_id: parseInt(examForm.module_id) || 0,
        module_code: modules.find(m => m.id === parseInt(examForm.module_id))?.code || '',
        exam_type: examForm.exam_type,
        date: examForm.date,
        start_time: examForm.start_time,
        end_time: examForm.end_time,
        salle_id: salleId,
        department_id: parseInt(examForm.department_id),
        academic_year: '2025-2026',
        semester: 'S2',
        status: 'SCHEDULED',
        notes: examForm.notes || '',
      });
      
      setSuccess('Exam updated successfully!');
      setExamForm({
        module_id: '',
        module: '',
        date: '',
        start_time: '',
        end_time: '',
        salle_id: '',
        salle: '',
        exam_type: 'NORMAL',
        department_id: '',
        department_name: '',
        notes: '',
      });
      setEditingExam(null);
      setAvailableExamTypes(['NORMAL', 'RATTRAPAGE']);
      setIsModalOpen(false);
      fetchExams();
    } catch (err) {
      setError('Failed to update exam. Please try again.');
      console.error('Error updating exam:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    switch (activeTab) {
      case "professors":
        handleProfessorSubmit();
        break;
      case "exams":
        if (editingExam) {
          handleUpdateExam();
        } else {
          handleExamSubmit();
        }
        break;
      case "salles":
      case "departments":
        handleResourceSubmit();
        break;
      default:
        handleResourceSubmit();
    }
  };

  const professorColumns = [
    { header: "USERNAME", accessor: (p: typeof professors[0]) => p.user?.username || p.name || '', className: "font-black tracking-tight" },
    { header: "EMAIL", accessor: (p: typeof professors[0]) => p.user?.email || '', className: "text-[10px] font-bold" },
    { header: "NAME", accessor: (p: typeof professors[0]) => p.user ? `${p.user.first_name} ${p.user.last_name}` : p.name, className: "font-black tracking-tight" },
    { header: "DEPARTMENT", accessor: "dept" as const, className: "text-[10px] font-bold" },
    { 
      header: "QUOTA STATUS", 
      accessor: (p: typeof professors[0]) => (
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-stone-100 rounded-none w-32 overflow-hidden border border-stone-200">
            <div className={cn("h-full transition-all duration-500", p.guards === 4 ? "bg-red-800" : p.guards >= 3 ? "bg-app-accent" : "bg-app-primary")} style={{ width: `${(p.guards / 4) * 100}%` }} />
          </div>
          <span className={cn("text-[10px] font-black px-2 py-0.5", p.guards === 4 ? "text-red-800" : "text-app-fg")}>{p.guards}/04</span>
        </div>
      )
    },
    { 
      header: "ACTION", 
      accessor: (professor: typeof professors[0]) => (
        <div className="flex gap-2 justify-end">
          <button 
            onClick={(e) => { e.stopPropagation(); handleEditProfessor(professor); }}
            className="p-1 text-stone-500 hover:text-app-primary transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(professor.id); }}
            className="p-1 text-stone-500 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "text-right w-20"
    }
  ];

  const examColumns = [
    { header: "MODULE", accessor: "module" as const, className: "font-black tracking-tight" },
    { header: "DATE", accessor: "date" as const },
    { header: "TIME", accessor: "time" as const },
    { header: "TYPE", accessor: (e: typeof exams[0]) => <span className="text-[9px] font-black px-2 py-1 bg-stone-100 border border-stone-200 uppercase tracking-widest">{e.type}</span> },
    { header: "ROOM", accessor: "room" as const },
    { 
      header: "GUARDS", 
      accessor: (e: typeof exams[0]) => (
        <div className="flex items-center gap-2">
          {(e.guardCount || 0) > 0 ? (
            <>
              <span 
                className="text-[9px] font-black px-2 py-1 bg-green-100 border border-green-200 text-green-800 uppercase tracking-widest cursor-pointer hover:bg-green-200 transition-colors"
                onClick={(ev) => { ev.stopPropagation(); showExamGuards(e); }}
                title="View Assigned Guards"
              >
                {e.guardCount || 0} Guard{(e.guardCount || 0) > 1 ? 's' : ''}
              </span>
              <button 
                onClick={(ev) => { ev.stopPropagation(); showExamGuards(e); }}
                className="p-1 text-stone-500 hover:text-app-primary transition-colors"
                title="View Guards"
              >
                <Users className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {e.associatedProfessors && e.associatedProfessors.length > 0 ? (
                <span 
                  className="text-[9px] font-black px-2 py-1 bg-yellow-100 border border-yellow-200 text-yellow-800 uppercase tracking-widest cursor-pointer hover:bg-yellow-200 transition-colors"
                  onClick={(ev) => { ev.stopPropagation(); showExamGuards(e); }}
                  title={`Associated Professors: ${e.associatedProfessors.map(p => p.name).join(', ')}`}
                >
                  {e.associatedProfessors.length === 1 ? (
                    <>
                      {e.associatedProfessors[0].name}
                    </>
                  ) : (
                    <>
                      {e.associatedProfessors.length > 2 ? (
                        <>
                          {e.associatedProfessors.slice(0, 2).map(p => p.name).join(', ')}
                          {` +${e.associatedProfessors.length - 2} more`}
                        </>
                      ) : (
                        e.associatedProfessors.map(p => p.name).join(', ')
                      )}
                    </>
                  )}
                </span>
              ) : (
                <span 
                  className="text-[9px] font-black px-2 py-1 bg-stone-100 border border-stone-200 text-stone-500 uppercase tracking-widest cursor-pointer hover:bg-stone-200 transition-colors"
                  onClick={(ev) => { ev.stopPropagation(); showExamGuards(e); }}
                  title="No professor is currently associated with this module"
                >
                  No Prof Assigned
                </span>
              )}
            </>
          )}
        </div>
      ),
      className: "text-center w-32"
    },
    { 
      header: "ACTION", 
      accessor: (exam: typeof exams[0]) => (
        <div className="flex gap-2 justify-end">
          <button 
            onClick={(e) => { e.stopPropagation(); handleEditExam(exam); }}
            className="p-1 text-stone-500 hover:text-app-primary transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(exam.id); setDeleteConfirmType('exam'); }}
            className="p-1 text-stone-500 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: "text-right w-20"
    }
  ];

  const deptColumns = [
    { header: "DEPT NAME", accessor: "name" as const, className: "font-black tracking-tight" },
    { header: "HEAD OF DEPT", accessor: "head" as const, className: "text-[10px] font-bold" },
    { header: "STAFF COUNT", accessor: (d: typeof departments[0]) => <span className="font-bold text-app-primary">{d.staff} PROF.</span> },
    { 
      header: "ACTION", 
      accessor: (dept: typeof departments[0]) => (
        <div className="flex gap-2 justify-end">
          <button 
            onClick={(e) => { e.stopPropagation(); handleEditDepartment(dept); }}
            className="p-1 text-stone-500 hover:text-app-primary transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(dept.id); }}
            className="p-1 text-stone-500 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ), 
      className: "text-right w-20"
    }
  ];

  const salleColumns = [
    { header: "NAME", accessor: "name" as const, className: "font-black tracking-tight" },
    { header: "CODE", accessor: "code" as const, className: "text-[10px] font-bold" },
    { header: "CAPACITY", accessor: "capacity" as const, className: "font-bold text-app-primary" },
    { header: "TYPE", accessor: "type" as const },
    { header: "BUILDING", accessor: "building" as const },
    { 
      header: "ACTION", 
      accessor: (salle: typeof salles[0]) => (
        <div className="flex gap-2 justify-end">
          <button 
            onClick={(e) => { e.stopPropagation(); handleEditSalle(salle); }}
            className="p-1 text-stone-500 hover:text-app-primary transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(salle.id); }}
            className="p-1 text-stone-500 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ), 
      className: "text-right w-20"
    }
  ];

  const renderForm = () => {
    switch (activeTab) {
      case "professors":
        return (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Username</label>
              <input 
                type="text" 
                value={professorForm.username}
                onChange={(e) => setProfessorForm({...professorForm, username: e.target.value})}
                placeholder="e.g., jturing" 
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">First Name</label>
                <input 
                  type="text" 
                  value={professorForm.first_name}
                  onChange={(e) => setProfessorForm({...professorForm, first_name: e.target.value})}
                  placeholder="e.g., Alan" 
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Last Name</label>
                <input 
                  type="text" 
                  value={professorForm.last_name}
                  onChange={(e) => setProfessorForm({...professorForm, last_name: e.target.value})}
                  placeholder="e.g., Turing" 
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Email</label>
              <input 
                type="email" 
                value={professorForm.email}
                onChange={(e) => setProfessorForm({...professorForm, email: e.target.value})}
                placeholder="e.g., alan.turing@fpk.edu" 
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                required={!selectedProfessor}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Password{selectedProfessor ? ' (keep empty to unchanged)' : '*'}</label>
              <input 
                type="password" 
                value={professorForm.password}
                onChange={(e) => setProfessorForm({...professorForm, password: e.target.value})}
                required={!selectedProfessor}
                placeholder={selectedProfessor ? "Leave empty to keep current password" : "Enter password"}
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Grade</label>
                <select 
                  value={professorForm.institutional_grade}
                  onChange={(e) => setProfessorForm({...professorForm, institutional_grade: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                >
                  <option value="PR">PROFESSOR</option>
                  <option value="DR">DOCTOR</option>
                  <option value="MA">MASTER</option>
                  <option value="ST">STUDENT</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Department</label>
                <select 
                  value={professorForm.department}
                  onChange={(e) => setProfessorForm({...professorForm, department: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                >
                  <option value="Computer Science">COMPUTER SCIENCE</option>
                  <option value="Mathematics">MATHEMATICS</option>
                  <option value="Physics">PHYSICS</option>
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-app-fg text-white py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-app-primary transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {selectedProfessor ? 'UPDATE PROFESSOR' : 'REGISTER STAFF'}</>}
            </button>
          </form>
        );
      case "exams":
        return (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Module / Subject</label>
              <select 
                value={examForm.module_id}
                onChange={(e) => {
                  const selectedModule = modules.find(m => m.id === parseInt(e.target.value));
                  let deptId = '';
                  let deptName = '';
                  
                  if (selectedModule) {
                    // Try to get department_id from module (set in fetchFilieresAndModules)
                    deptId = selectedModule.department_id?.toString() || '';
                    deptName = selectedModule.department_name || '';
                    
                    // If module doesn't have department info, try to get it from filier
                    if (!deptId && selectedModule.filier_id) {
                      const filier = filieres.find(f => f.id === selectedModule.filier_id);
                      deptId = filier?.department_id?.toString() || '';
                      deptName = filier?.department_name || '';
                    }
                    
                    // Fallback: look up department name from departments list
                    if (deptId && !deptName) {
                      deptName = departments.find(d => d.id.toString() === deptId)?.name || 'Unknown';
                    }
                    
                    if (!deptName) {
                      deptName = 'Unknown';
                    }
                  }
                  
                  // Update form with module selection (synchronous)
                  setExamForm({
                    ...examForm,
                    module_id: e.target.value,
                    module: selectedModule ? selectedModule.name : '',
                    department_id: deptId,
                    department_name: deptName,
                  });
                }}
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                required
              >
                <option value="">Select a Module</option>
                {modules.filter(m => m.is_active !== false).map(module => (
                  <option key={module.id} value={module.id.toString()}>{module.name} {module.code && `- ${module.code}`}</option>
                ))}
              </select>
            </div>
            {examForm.module_id && (
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Department</label>
                <input 
                  type="text"
                  value={examForm.department_name || 'Select a module first'}
                  readOnly
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase text-stone-500 cursor-not-allowed"
                />
                <p className="text-[10px] text-stone-400">* Automatically selected based on module's filiere</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Date</label>
                <input 
                  type="date" 
                  value={examForm.date}
                  onChange={(e) => setExamForm({...examForm, date: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Exam Type</label>
                <select 
                  value={examForm.exam_type}
                  onChange={(e) => setExamForm({...examForm, exam_type: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                  required
                  disabled={availableExamTypes.length === 0}
                >
                  {availableExamTypes.length === 0 ? (
                    <option value="">NO AVAILABLE TYPES - Both NORMAL and RATTRAPAGE exams already exist for this module</option>
                  ) : (
                    availableExamTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'RATTRAPAGE' ? 'RATTRAPAGE (Makeup)' : type}
                      </option>
                    ))
                  )}
                </select>
                {availableExamTypes.length === 0 && (
                  <p className="text-[10px] text-red-500 font-bold">⚠️ Both exam types already exist for this module. Delete one to create a new exam.</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Start Time</label>
                <input 
                  type="time" 
                  value={examForm.start_time}
                  onChange={(e) => setExamForm({...examForm, start_time: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">End Time</label>
                <input 
                  type="time" 
                  value={examForm.end_time}
                  onChange={(e) => setExamForm({...examForm, end_time: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Exam Room (Salle)</label>
                <select 
                  value={examForm.salle_id}
                  onChange={(e) => {
                    const selectedSalle = salles.find(s => s.id === parseInt(e.target.value));
                    setExamForm({
                      ...examForm,
                      salle_id: e.target.value,
                      salle: selectedSalle ? selectedSalle.name : '',
                    });
                  }}
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                  required
                >
                  <option value="">Select a Room</option>
                  {salles.filter(s => s.is_active).map(salle => (
                    <option key={salle.id} value={salle.id.toString()}>{salle.name} ({salle.code}) - {salle.type} {salle.capacity > 0 && `- Cap: ${salle.capacity}`}</option>
                  ))}
                </select>
              </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Notes</label>
              <textarea 
                value={examForm.notes || ''}
                onChange={(e) => setExamForm({...examForm, notes: e.target.value})}
                placeholder="Additional notes about this exam..."
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                rows={3}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-app-fg text-white py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-app-primary transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {editingExam ? 'UPDATE EXAM' : 'SCHEDULE EXAM'}</>}
            </button>
          </form>
        );
      default:
        return (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {activeTab === "salles" ? (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Salle Name</label>
                  <input 
                    type="text" 
                    value={resourceForm.name}
                    onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                    placeholder="E.G. AMPHI A" 
                    className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Salle Code</label>
                  <input 
                    type="text" 
                    value={resourceForm.code}
                    onChange={(e) => setResourceForm({...resourceForm, code: e.target.value})}
                    placeholder="E.G. A" 
                    className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Capacity</label>
                    <input 
                      type="number" 
                      value={resourceForm.capacity}
                      onChange={(e) => setResourceForm({...resourceForm, capacity: e.target.value})}
                      placeholder="E.G. 50" 
                      className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Type</label>
                    <select 
                      value={resourceForm.type}
                      onChange={(e) => setResourceForm({...resourceForm, type: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                      required
                    >
                      <option value="SALLE">SALLE</option>
                      <option value="AMPHI">AMPHI</option>
                      <option value="LAB">LAB</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Floor</label>
                    <input 
                      type="text" 
                      value={resourceForm.floor}
                      onChange={(e) => setResourceForm({...resourceForm, floor: e.target.value})}
                      placeholder="E.G. 1" 
                      className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Building</label>
                    <input 
                      type="text" 
                      value={resourceForm.building}
                      onChange={(e) => setResourceForm({...resourceForm, building: e.target.value})}
                      placeholder="E.G. MAIN" 
                      className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Department Name</label>
                  <input 
                    type="text" 
                    value={resourceForm.name}
                    onChange={(e) => setResourceForm({...resourceForm, name: e.target.value})}
                    placeholder="E.G. COMPUTER SCIENCE" 
                    className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Department Code</label>
                  <input 
                    type="text" 
                    value={resourceForm.code}
                    onChange={(e) => setResourceForm({...resourceForm, code: e.target.value})}
                    placeholder="E.G. CS" 
                    className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                  />
                </div>
              </>
            )}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-app-fg text-white py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-app-primary transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {activeTab === "salles" ? (editingSalle ? "UPDATE SALLE" : "SAVE SALLE") : (editingDepartment ? "UPDATE DEPARTMENT" : "SAVE DEPARTMENT")}</>}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-stone-100 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-app-fg uppercase">Control Center</h1>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] mt-2 italic">Institutional Data & Analytics</p>
        </div>
        <HeaderAction activeTab={activeTab} setIsModalOpen={setIsModalOpen} />
      </div>

      <div className="flex bg-stone-100 p-1 rounded-none border border-stone-200 w-fit">
        {(["overview", "professors", "exams", "salles", "departments", "filieres", "modules"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              const route = tab === "overview" ? "dashboard" : tab;
              window.location.hash = route;
            }}
            className={cn(
              "px-6 py-3 rounded-none text-[10px] font-black uppercase tracking-[0.15em] transition-all",
              activeTab === tab ? "bg-white text-app-fg border border-stone-200" : "text-stone-400 hover:text-app-fg"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black tracking-tighter text-app-fg uppercase">Dashboard Overview</h2>
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-1">Real-time institutional analytics</p>
            </div>
            <button 
              onClick={fetchDashboardOverview}
              disabled={isDashboardLoading}
              className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-4 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-stone-100 transition-all disabled:opacity-50"
            >
              <RefreshCcw className={`w-3 h-3 ${isDashboardLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
          {isDashboardLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-stone-200">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-8 bg-white border-r border-stone-200 last:border-r-0">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Loading...</p>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-app-primary"></div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-4">
                    <h3 className="text-3xl font-black text-app-fg opacity-50">-</h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-stone-200">
              {[
                { 
                  label: "Active Professors", 
                  value: dashboardData?.stats?.active_professors?.toString() || "0", 
                  icon: Users, 
                  trend: "+2",
                  subtitle: "Total staff"
                },
                { 
                  label: "Scheduled Exams", 
                  value: dashboardData?.stats?.scheduled_exams?.toString() || "0", 
                  icon: Calendar, 
                  trend: "+12%",
                  subtitle: "Upcoming"
                },
                { 
                  label: "Total Salles", 
                  value: dashboardData?.stats?.total_salles?.toString() || "0", 
                  icon: DoorOpen, 
                  trend: "0",
                  subtitle: "Rooms available"
                },
                { 
                  label: "Allocation Rate", 
                  value: dashboardData?.stats?.allocation_rate || "0%", 
                  icon: Target, 
                  trend: "STABLE",
                  subtitle: "Assignment rate"
                },
              ].map((stat, i) => (
                <div key={i} className="p-8 bg-white border-r border-stone-200 last:border-r-0 hover:bg-stone-50 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{stat.label}</p>
                      <p className="text-[8px] text-stone-300 uppercase tracking-widest mt-1">{stat.subtitle}</p>
                    </div>
                    <div className="p-1.5 bg-stone-100 rounded-sm border border-stone-200">
                      <stat.icon className="w-4 h-4 text-app-primary" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-4">
                     <h3 className="text-3xl font-black text-app-fg">{stat.value}</h3>
                     <span className={`text-[9px] font-black uppercase ${stat.trend.includes('+') ? 'text-green-600' : stat.trend.includes('%') ? 'text-green-600' : 'text-stone-400'}`}>
                       {stat.trend}
                     </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Staff Quota Distribution Chart - Donut with Center Label */}
            <div className="bg-white border border-stone-200 p-6 min-h-[550px]">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-app-fg mb-6">Staff Quota Distribution</h4>
              {isDashboardLoading ? (
                <div className="h-[500px] w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-primary"></div>
                </div>
              ) : quotaData.length === 0 ? (
                <div className="h-[500px] w-full flex items-center justify-center">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">No quota data available</p>
                </div>
              ) : (
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={500}>
                    <PieChart>
                      <Pie 
                        data={quotaData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="55%" 
                        outerRadius="85%"
                        dataKey="value" 
                        stroke="none"
                        label={false}
                        nameKey="name"
                      >
                        {quotaData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        <text 
                          x="50%" y="45%" textAnchor="middle" dominantBaseline="middle"
                          className="text-[16px] font-black fill-stone-800"
                        >
                          Total Staff
                        </text>
                        <text 
                          x="50%" y="57%" textAnchor="middle" dominantBaseline="middle"
                          className="text-[28px] font-black fill-app-primary"
                        >
                          {quotaData.reduce((sum, item) => sum + item.value, 0)}
                        </text>
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1a1210', 
                          border: 'none', 
                          color: '#fff', 
                          fontSize: '12px', 
                          fontWeight: '900',
                          padding: '16px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        itemStyle={{ padding: 0, margin: 0 }}
                        formatter={(value, name) => {
                          const total = quotaData.reduce((sum, item) => sum + item.value, 0);
                          const percentage = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0;
                          return (
                            <div className="space-y-1">
                              <div className="text-white font-black text-[11px] uppercase">{name}</div>
                              <div className="text-stone-300 text-[10px]">
                                {value} professors ({percentage}%)
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        align="center" 
                        layout="horizontal"
                        wrapperStyle={{
                          paddingTop: '30px', 
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          maxHeight: '120px',
                          width: '100%'
                        }}
                        iconType="circle"
                        iconSize={10}
                        formatter={(value) => (
                          <span 
                            className="text-[11px] font-black uppercase tracking-wider text-stone-700 cursor-pointer hover:text-app-primary transition-colors whitespace-nowrap px-2"
                            style={{ display: 'inline-block' }}
                          >
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Departmental Exam Load Chart - Pie with Labels */}
            <div className="bg-white border border-stone-200 p-6 min-h-[550px]">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-app-fg mb-6">Departmental Exam Load</h4>
              {isDashboardLoading ? (
                <div className="h-[500px] w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-primary"></div>
                </div>
              ) : deptData.length === 0 ? (
                <div className="h-[500px] w-full flex items-center justify-center">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">No department data available</p>
                </div>
              ) : (
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={400} minHeight={500}>
                    <PieChart>
                      <Pie 
                        data={deptData} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius="80%"
                        dataKey="value" 
                        stroke="#fff" 
                        strokeWidth={2}
                        label={({ name, percent }) => {
                          // Only show labels for larger slices to avoid overlap
                          if (percent && percent > 0.12) {
                            // Truncate long names for display on chart
                            const displayName = name && name.length > 15 ? `${name.substring(0, 12)}...` : name;
                            return displayName;
                          }
                          return '';
                        }}
                        nameKey="name"
                      >
                        {deptData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1a1210', 
                          border: 'none', 
                          color: '#fff', 
                          fontSize: '12px', 
                          fontWeight: '900',
                          padding: '16px',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        itemStyle={{ padding: 0, margin: 0 }}
                        formatter={(value, name) => {
                          const total = deptData.reduce((sum, item) => sum + item.value, 0);
                          const percentage = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0;
                          return (
                            <div className="space-y-1">
                              <div className="text-white font-black text-[11px] uppercase">{name}</div>
                              <div className="text-stone-300 text-[10px]">
                                {value} exams ({percentage}%)
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        align="center" 
                        layout="horizontal"
                        wrapperStyle={{
                          paddingTop: '30px', 
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          maxHeight: '120px',
                          width: '100%'
                        }}
                        iconType="circle"
                        iconSize={10}
                        formatter={(value, entry) => (
                          <div className="flex flex-col items-center min-w-[120px] px-2">
                            <span 
                              className="text-[10px] font-black uppercase tracking-wider text-stone-700 whitespace-nowrap"
                            >
                              {value}
                            </span>
                            <span className="text-[9px] text-stone-400">
                              {(entry.payload as any)?.value || 0} exams
                            </span>
                          </div>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Exams Section */}
          {dashboardData?.upcoming_exams && dashboardData.upcoming_exams.length > 0 && (
            <div className="bg-white border border-stone-200 p-10">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-app-fg mb-8">Upcoming Exams</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-bold uppercase">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-3 text-stone-400">Module</th>
                      <th className="text-left py-3 text-stone-400">Date</th>
                      <th className="text-left py-3 text-stone-400">Time</th>
                      <th className="text-left py-3 text-stone-400">Room</th>
                      <th className="text-left py-3 text-stone-400">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.upcoming_exams.slice(0, 5).map((exam) => (
                      <tr key={exam.id} className="border-b border-stone-100">
                        <td className="py-3 text-app-fg">{exam.module}</td>
                        <td className="py-3 text-stone-500">{exam.date}</td>
                        <td className="py-3 text-stone-500">{exam.start_time} - {exam.end_time}</td>
                        <td className="py-3 text-stone-500">{typeof exam.salle === 'string' ? exam.salle : exam.salle?.name || 'N/A'}</td>
                        <td className="py-3 text-stone-500">{typeof exam.department === 'string' ? exam.department : exam.department?.name || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Assignments Section */}
          {dashboardData?.recent_assignments && dashboardData.recent_assignments.length > 0 && (
            <div className="bg-white border border-stone-200 p-10">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-app-fg mb-8">Recent Assignments</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-bold uppercase">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-3 text-stone-400">Professor</th>
                      <th className="text-left py-3 text-stone-400">Exam</th>
                      <th className="text-left py-3 text-stone-400">Date</th>
                      <th className="text-left py-3 text-stone-400">Room</th>
                      <th className="text-left py-3 text-stone-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recent_assignments.slice(0, 5).map((assignment) => (
                      <tr key={assignment.id} className="border-b border-stone-100">
                        <td className="py-3 text-app-fg">{assignment.professor || 'N/A'}</td>
                        <td className="py-3 text-stone-500">{assignment.exam_module || 'N/A'}</td>
                        <td className="py-3 text-stone-500">{assignment.exam_date || 'N/A'}</td>
                        <td className="py-3 text-stone-500">{assignment.exam_room || 'N/A'}</td>
                        <td className="py-3"><span className={`px-2 py-1 rounded text-[9px] font-black ${assignment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : assignment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-stone-100 text-stone-500'}`}>{assignment.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "professors" && <DataTable columns={professorColumns} data={professors} />}
      {activeTab === "exams" && <DataTable columns={examColumns} data={exams} />}
      {activeTab === "departments" && <DataTable columns={deptColumns} data={departments} />}
      {activeTab === "salles" && <DataTable columns={salleColumns} data={salles} />}

      {activeTab === "salles" && (
        <div className="py-32 flex flex-col items-center justify-center text-center bg-white border border-stone-200">
          <Layers className="w-10 h-10 text-stone-300 mb-8" />
          <h3 className="text-xl font-black text-app-fg uppercase tracking-widest">Database Empty</h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-10 border-2 border-app-primary text-app-primary px-8 py-3 font-black uppercase tracking-[0.2em] text-xs hover:bg-app-primary hover:text-white transition-all"
          >
            Initialize Salles
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => { setDeleteConfirmId(null); setDeleteConfirmType(null); }}
        title="Confirm Delete"
      >
        <div className="p-4">
          <p className="text-sm font-medium text-stone-600 mb-6">
            Are you sure you want to delete this {deleteConfirmType === 'exam' ? 'Exam' : activeTab === "professors" ? "Professor" : activeTab === "departments" ? "Department" : "Salle"}? This action cannot be undone.
          </p>
          <div className="flex gap-4 justify-end">
            <button
              onClick={() => { setDeleteConfirmId(null); setDeleteConfirmType(null); }}
              className="px-4 py-2 bg-stone-100 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-wider hover:bg-stone-200 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (deleteConfirmId) {
                  if (deleteConfirmType === 'exam') {
                    handleDeleteExam(deleteConfirmId);
                  } else if (activeTab === "professors") {
                    handleDeleteProfessor(deleteConfirmId);
                  } else if (activeTab === "departments") {
                    handleDeleteDepartment(deleteConfirmId);
                  } else {
                    handleDeleteSalle(deleteConfirmId);
                  }
                }
              }}
              disabled={isLoading}
              className="px-4 py-2 bg-red-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Exam Guards Modal */}
      <Modal
        isOpen={isGuardsModalOpen}
        onClose={() => setIsGuardsModalOpen(false)}
        title={(selectedExamGuards?.guardCount || 0) > 0 ? `Guards for ${selectedExamGuards?.module || 'Exam'}` : `Associated Professors for ${selectedExamGuards?.module || 'Module'}`}
      >
        <div className="p-4">
          {selectedExamGuards ? (
            <>
              {/* Exam Information */}
              <div className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-3">Exam Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Module:</span>
                    <span className="text-sm font-bold text-app-fg uppercase tracking-wider">{selectedExamGuards.module}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Professor:</span>
                    <span className="text-sm font-bold text-app-fg uppercase tracking-wider">
                      {selectedExamGuards.associatedProfessors && selectedExamGuards.associatedProfessors.length > 0 ? (
                        selectedExamGuards.associatedProfessors.length > 2 ? (
                          <>
                            {selectedExamGuards.associatedProfessors.slice(0, 2).map(p => p.name).join(', ')}
                            {` +${selectedExamGuards.associatedProfessors.length - 2} more`}
                          </>
                        ) : (
                          selectedExamGuards.associatedProfessors.map(p => p.name).join(', ')
                        )
                      ) : (
                        selectedExamGuards.associatedProfessor?.name || 'Not Assigned'
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Date:</span>
                    <span className="text-sm font-bold text-app-fg uppercase tracking-wider">{selectedExamGuards.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Room:</span>
                    <span className="text-sm font-bold text-app-fg uppercase tracking-wider">{selectedExamGuards.room}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Time:</span>
                    <span className="text-sm font-bold text-app-fg uppercase tracking-wider">{selectedExamGuards.time}</span>
                  </div>
                </div>
              </div>

              {selectedExamGuards.guardCount > 0 ? (
                <>
                  {/* Assigned Guards */}
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-green-800 mb-2">
                      Assigned Guards ({selectedExamGuards.guardCount})
                    </h4>
                    <div className="space-y-3">
                      {selectedExamGuards.guards.map((guard, index) => (
                        <div 
                          key={guard.id || index}
                          className="flex items-center justify-between p-3 bg-white border border-stone-100 rounded group"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-app-fg uppercase tracking-wider">
                              Prof {guard.name}
                            </span>
                            <span className="text-[10px] text-stone-400 uppercase tracking-widest">
                              Dept: {guard.department}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">
                              Guard #{index + 1}
                            </span>
                            <button
                              onClick={() => openReplaceGuardModal(guard, index)}
                              className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title={`Replace ${guard.name}`}
                            >
                              <RefreshCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRemoveConfirm(guard, index)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                              title={`Remove ${guard.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Actions for Guards Assigned */}
                  <div className="flex gap-2 mb-4">
                    <button 
                      onClick={openAssignGuardModal}
                      className="flex-1 px-3 py-2 bg-app-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-app-fg transition-all disabled:opacity-50"
                      disabled={isLoading || selectedExamGuards.guardCount >= 4}
                      title="Add more guards to this exam (max 4 total)"
                    >
                      Add More Guard
                    </button>
                    <button 
                      className="flex-1 px-3 py-2 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-50 cursor-not-allowed"
                      disabled={selectedExamGuards.guardCount === 0}
                      title="Click the trash icon on a guard card to remove"
                    >
                      Remove Guard
                    </button>
                    <button 
                      className="flex-1 px-3 py-2 bg-yellow-500 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-yellow-600 transition-all disabled:opacity-50 cursor-not-allowed"
                      disabled={selectedExamGuards.guardCount === 0}
                      title="Click the refresh icon on a guard card to replace"
                    >
                      Replace Guard
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* No Guards Assigned - Show Associated Professors */}
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-800 mb-2">
                      No guards assigned yet
                    </h4>
                    <p className="text-sm text-stone-600 mb-3">
                      Associated Professors for this module:
                    </p>
                    
                    {selectedExamGuards.associatedProfessors && selectedExamGuards.associatedProfessors.length > 0 ? (
                      <div className="space-y-3">
                        {selectedExamGuards.associatedProfessors.map((prof, index) => (
                          <div 
                            key={prof.id || index}
                            className="flex items-center justify-between p-3 bg-white border border-stone-100 rounded"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-app-fg uppercase tracking-wider">
                                Dr {prof.name}
                              </span>
                              <span className="text-[10px] text-stone-400 uppercase tracking-widest">
                                Dept: {prof.department}
                              </span>
                            </div>
                            <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">
                              Professor #{index + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone-500 text-center py-2">
                        No professor is currently associated with this module.
                      </p>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <div className="mb-4">
                    <button 
                      onClick={openAssignGuardModal}
                      className="w-full px-4 py-3 bg-app-primary text-white text-sm font-bold uppercase tracking-wider hover:bg-app-fg transition-all disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Loading...' : 'Assign Guards'}
                    </button>
                  </div>
                </>
              )}
            </>
          ) : null}
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setIsGuardsModalOpen(false)}
              className="px-4 py-2 bg-stone-400 text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-500 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Guard Modal */}
      <Modal
        isOpen={isAssignGuardModalOpen}
        onClose={() => {
          setIsAssignGuardModalOpen(false);
          setSelectedProfessorIds([]);
          setError(null);
        }}
        title={`Assign Guards to ${selectedExamGuards?.module || 'Exam'}`}
      >
        <div className="p-4 space-y-4">
          {selectedExamGuards && (
            <>
              {/* Exam Info Summary */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Module:</span>
                    <div className="font-bold text-app-fg uppercase tracking-wider">{selectedExamGuards.module}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Date:</span>
                    <div className="font-bold text-app-fg uppercase tracking-wider">{selectedExamGuards.date}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Time:</span>
                    <div className="font-bold text-app-fg uppercase tracking-wider">{selectedExamGuards.time}</div>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Room:</span>
                    <div className="font-bold text-app-fg uppercase tracking-wider">{selectedExamGuards.room}</div>
                  </div>
                </div>
                
                {/* Current guards info */}
                {selectedExamGuards.guardCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-stone-200">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Current Guards:</span>
                    <div className="font-bold text-app-fg uppercase tracking-wider">
                      {selectedExamGuards.guardCount} guard{selectedExamGuards.guardCount > 1 ? 's' : ''} assigned
                    </div>
                  </div>
                )}
                
                {/* Associated professors info */}
                {selectedExamGuards.associatedProfessors && selectedExamGuards.associatedProfessors.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">Associated Professors:</span>
                    <div className="font-bold text-app-primary uppercase tracking-wider text-xs">
                      {selectedExamGuards.associatedProfessors.map(p => p.name).join(', ')}
                    </div>
                  </div>
                )}
              </div>

              {/* Quota Warning */}
              {selectedExamGuards.guardCount >= 4 && (
                <div className="p-3 bg-yellow-100 border border-yellow-300 rounded">
                  <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider">
                    ⚠️ This exam already has {selectedExamGuards.guardCount} guards assigned. 
                    Maximum of 4 guards per exam.
                  </p>
                </div>
              )}

              {/* Auto-Assignment Logic Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                  📋 AUTO-ASSIGNMENT LOGIC:
                </p>
                <ul className="text-[10px] text-blue-700 mt-2 space-y-1">
                  <li>• Max 4 guards per professor (quota limit)</li>
                  <li>• Prefers professors from same department as module</li>
                  <li>• Prioritizes associated professors (module + filier)</li>
                  <li>• ≤4 associated professors: ALL auto-selected</li>
                  <li>• &gt;4 associated professors: Manual selection required</li>
                  <li>• Max 4 guards total per exam</li>
                </ul>
              </div>

              {/* Available Professors List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-app-fg">
                    Available Professors ({availableProfessors.length})
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAutoAssign}
                      className="text-[10px] font-bold uppercase tracking-wider text-green-600 hover:underline flex items-center gap-1"
                      title="Auto-select professors based on module association and department"
                    >
                      <span>⚡ Auto-Assign</span>
                    </button>
                    <button
                      onClick={handleSelectAllAssociated}
                      className="text-[10px] font-bold uppercase tracking-wider text-app-primary hover:underline"
                    >
                      Select All Associated
                    </button>
                  </div>
                </div>
                
                {availableProfessors.length === 0 ? (
                  <p className="text-sm text-stone-500 text-center py-4">
                    No available professors found. All professors may have reached their quota limit (4 guards max).
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto border border-stone-100 rounded">
                    {availableProfessors.map((prof) => {
                      // Determine if this professor is from the target department
                      const examModule = modules.find(m => m.id === selectedExamGuards?.module_id) as any;
                      let targetDeptId = selectedExamGuards?.department_id;
                      
                      if (!targetDeptId && examModule?.filier_id) {
                        const filier = filieres.find(f => f.id === examModule.filier_id);
                        targetDeptId = filier?.department_id;
                      }
                      if (!targetDeptId && examModule?.department_id) {
                        targetDeptId = examModule.department_id;
                      }
                      
                      const isFromTargetDept = prof.department_id === targetDeptId;
                      const quotaPercentage = ((prof.completed_guards || 0) / (prof.max_guards || 4)) * 100;
                      
                      return (
                        <div
                          key={prof.id}
                          onClick={() => handleProfessorSelection(prof.id)}
                          className={`p-3 border-b border-stone-100 last:border-b-0 cursor-pointer transition-all ${
                            selectedProfessorIds.includes(prof.id) 
                              ? 'bg-app-primary text-white' 
                              : 'bg-white hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold uppercase tracking-wider">
                                  {prof.name}
                                </span>
                                {prof.is_associated && (
                                  <span 
                                    className="text-[8px] px-1.5 py-0.5 bg-yellow-400 text-yellow-900 font-black uppercase tracking-wider rounded"
                                    title="Associated with this module"
                                  >
                                    ASSOCIATED
                                  </span>
                                )}
                                {isFromTargetDept && !prof.is_associated && (
                                  <span 
                                    className="text-[8px] px-1.5 py-0.5 bg-blue-400 text-blue-900 font-black uppercase tracking-wider rounded"
                                    title="From same department as module"
                                  >
                                    SAME DEPT
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] text-stone-500 uppercase tracking-wider">
                                  {prof.department}
                                </span>
                                <span className="text-[10px] text-stone-500 uppercase tracking-wider">
                                  Quota: {prof.completed_guards}/{prof.max_guards}
                                </span>
                                <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden ml-2">
                                  <div 
                                    className={`h-full transition-all ${quotaPercentage > 80 ? 'bg-red-500' : quotaPercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                    style={{ width: `${quotaPercentage}%` }}
                                    title={`Quota: ${prof.completed_guards}/${prof.max_guards} (${Math.round(quotaPercentage)}%)`}
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedProfessorIds.includes(prof.id) && (
                                <span className="text-green-400">✓ Selected</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selection Summary */}
              {selectedProfessorIds.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-green-800">
                        Selected: {selectedProfessorIds.length} professor{selectedProfessorIds.length > 1 ? 's' : ''}
                      </span>
                      <div className="text-xs text-green-700 mt-1">
                        {selectedProfessorIds.map(id => {
                          const prof = availableProfessors.find(p => p.id === id);
                          return prof ? prof.name : '';
                        }).filter(Boolean).join(', ')}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-800">
                      {selectedProfessorIds.length}
                    </span>
                  </div>
                  
                  {/* Auto-assignment logic feedback */}
                  {selectedProfessorIds.length <= 4 && (
                    <p className="text-[10px] text-green-700 mt-2">
                      ✓ Ready for assignment. Total guards after assignment: {selectedExamGuards.guardCount + selectedProfessorIds.length}/4
                    </p>
                  )}
                  {selectedProfessorIds.length > 4 && (
                    <p className="text-[10px] text-red-700 mt-2">
                      ✗ Cannot assign more than 4 guards to an exam
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-stone-200">
                <button
                  onClick={async () => {
                    await handleAutoAssign();
                    await handleAssignGuards();
                  }}
                  disabled={isLoading || (availableProfessors.length === 0 && selectedProfessorIds.length === 0)}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Auto-select and assign guards in one click"
                >
                  {isLoading ? 'Processing...' : '⚡ OK (Auto-Assign & Assign)'}
                </button>
                
                <button
                  onClick={handleAssignGuards}
                  disabled={selectedProfessorIds.length === 0 || selectedProfessorIds.length > 4 || isLoading}
                  className="flex-1 px-4 py-3 bg-green-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Assigning...' : `Assign ${selectedProfessorIds.length} Guard${selectedProfessorIds.length > 1 ? 's' : ''}`}
                </button>
                
                <button
                  onClick={() => {
                    setIsAssignGuardModalOpen(false);
                    setSelectedProfessorIds([]);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-3 bg-stone-400 text-white text-sm font-bold uppercase tracking-wider hover:bg-stone-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider">{error}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Remove Guard Confirmation Modal */}
      <Modal
        isOpen={isRemoveConfirmModalOpen}
        onClose={() => {
          setIsRemoveConfirmModalOpen(false);
          setGuardToRemove(null);
          setError(null);
        }}
        title="Confirm Remove Guard"
      >
        <div className="p-4">
          {guardToRemove && (
            <>
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-stone-700 mb-4">
                  Are you sure you want to remove 
                  <span className="font-bold text-app-fg uppercase">{guardToRemove.name}</span> 
                  as a guard from the exam 
                  <span className="font-bold text-app-fg uppercase">{selectedExamGuards?.module}</span>?
                </p>
                <p className="text-xs text-stone-500">
                  This action cannot be undone. The professor's quota will be decremented.
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleRemoveGuard}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-red-500 text-white text-sm font-bold uppercase tracking-wider hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Removing...' : 'Yes, Remove Guard'}
                </button>
                <button
                  onClick={() => {
                    setIsRemoveConfirmModalOpen(false);
                    setGuardToRemove(null);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-3 bg-stone-400 text-white text-sm font-bold uppercase tracking-wider hover:bg-stone-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Replace Guard Modal */}
      <Modal
        isOpen={isReplaceGuardModalOpen}
        onClose={() => {
          setIsReplaceGuardModalOpen(false);
          setGuardToReplace(null);
          setSelectedProfessorIds([]);
          setError(null);
        }}
        title={`Replace Guard: ${guardToReplace?.name || 'Select Guard'}`}
      >
        <div className="p-4 space-y-4">
          {guardToReplace && selectedExamGuards && (
            <>
              {/* Current Guard Info */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-yellow-800 mb-1">
                      Current Guard to Replace
                    </p>
                    <p className="text-sm font-bold text-app-fg uppercase tracking-wider">
                      Prof {guardToReplace.name}
                    </p>
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider">
                      Dept: {(guardToReplace as any).department || selectedExamGuards.moduleProfessorDept}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">
                    Guard #{guardToReplace.index + 1}
                  </span>
                </div>
              </div>

              {/* Exam Info */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-2">
                  Exam: {selectedExamGuards.module}
                </p>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Date: {selectedExamGuards.date} | Time: {selectedExamGuards.time} | Room: {selectedExamGuards.room}
                </p>
              </div>

              {/* Available Professors List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-app-fg">
                    Select Replacement Professor ({availableProfessors.length} available)
                  </h4>
                </div>
                
                {availableProfessors.length === 0 ? (
                  <p className="text-sm text-stone-500 text-center py-4">
                    No available professors found. All professors may have reached their quota limit (4 guards max).
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto border border-stone-100 rounded">
                    {availableProfessors.map((prof) => (
                      <div
                        key={prof.id}
                        onClick={() => {
                          // Single selection for replace
                          if (selectedProfessorIds.includes(prof.id)) {
                            setSelectedProfessorIds([]);
                          } else {
                            setSelectedProfessorIds([prof.id]);
                          }
                        }}
                        className={`p-3 border-b border-stone-100 last:border-b-0 cursor-pointer transition-all ${
                          selectedProfessorIds.includes(prof.id) 
                            ? 'bg-app-primary text-white' 
                            : 'bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold uppercase tracking-wider">
                                {prof.name}
                              </span>
                              {prof.is_associated && (
                                <span 
                                  className="text-[8px] px-1.5 py-0.5 bg-yellow-400 text-yellow-900 font-black uppercase tracking-wider rounded"
                                  title="Associated with this module"
                                >
                                  ASSOCIATED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-[10px] text-stone-500 uppercase tracking-wider">
                                {prof.department}
                              </span>
                              <span className="text-[10px] text-stone-500 uppercase tracking-wider">
                                Quota: {prof.completed_guards}/{prof.max_guards}
                              </span>
                              <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden ml-2">
                                <div 
                                  className={`h-full transition-all ${((prof.completed_guards || 0) / (prof.max_guards || 4)) * 100 > 80 ? 'bg-red-500' : ((prof.completed_guards || 0) / (prof.max_guards || 4)) * 100 > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  style={{ width: `${((prof.completed_guards || 0) / (prof.max_guards || 4)) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedProfessorIds.includes(prof.id) && (
                              <span className="text-green-400">✓ Selected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selection Summary */}
              {selectedProfessorIds.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-800">
                        New Guard Selected
                      </span>
                      <div className="text-xs text-blue-700 mt-1">
                        {selectedProfessorIds.map(id => {
                          const prof = availableProfessors.find(p => p.id === id);
                          return prof ? prof.name : '';
                        }).filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-blue-700 mt-2">
                    ⚡ Replacement: {guardToReplace.name} → {availableProfessors.find(p => p.id === selectedProfessorIds[0])?.name || 'New Professor'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-stone-200">
                <button
                  onClick={handleReplaceGuard}
                  disabled={selectedProfessorIds.length === 0 || isLoading}
                  className="flex-1 px-4 py-3 bg-yellow-600 text-white text-sm font-bold uppercase tracking-wider hover:bg-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Replacing...' : 'Replace Guard'}
                </button>
                
                <button
                  onClick={() => {
                    setIsReplaceGuardModalOpen(false);
                    setGuardToReplace(null);
                    setSelectedProfessorIds([]);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-3 bg-stone-400 text-white text-sm font-bold uppercase tracking-wider hover:bg-stone-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded">
              <p className="text-xs font-bold text-red-800 uppercase tracking-wider">{error}</p>
            </div>
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
          setSuccess(null);
          setEditingSalle(null);
          setEditingDepartment(null);
          setEditingExam(null);
          setSelectedProfessor(null);
          setProfessorForm({
            username: '',
            password: '',
            email: '',
            first_name: '',
            last_name: '',
            institutional_grade: 'PR',
            department: 'Computer Science'
          });
        }}
        title={activeTab === "professors" ? (selectedProfessor ? 'EDIT PROFESSOR' : 'ADD PROFESSOR') : activeTab === "exams" && editingExam ? 'UPDATE EXAM' : `${editingSalle ? 'Edit' : 'Add'} ${activeTab === "overview" ? "Resource" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
      >
        {renderForm()}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-800 text-xs font-bold uppercase tracking-wider">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 text-green-800 text-xs font-bold uppercase tracking-wider">
            {success}
          </div>
        )}
      </Modal>
    </div>
  );
};
