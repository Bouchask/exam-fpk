import { useState, useEffect, useCallback } from "react";
import { Plus, Users, Calendar, DoorOpen, Target, Layers, MoreVertical, Save, RefreshCcw, Edit, Trash2 } from "lucide-react";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { cn } from "../utils/cn";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { professorService, examService, departmentService, salleService, moduleService, filierService, authService, dashboardService, useMockData } from "../services";
import type { Professor, Exam, Department, Salle, DashboardOverview } from "../types";

interface AdminDashboardProps {
  forcedTab?: "overview" | "professors" | "exams" | "salles" | "departments" | "filieres" | "modules";
}

export const AdminDashboard = ({ forcedTab }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "professors" | "exams" | "salles" | "departments" | "filieres" | "modules">(forcedTab || "overview");
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [exams, setExams] = useState<{ id: number; module: string; date: string; time: string; type: string; room: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string; head: string; staff: number }[]>([]);
  const [salles, setSalles] = useState<{ id: number; name: string; code: string; capacity: number; type: string; floor: string; building: string; is_active: boolean }[]>([]);
  const [modules, setModules] = useState<{ id: number; name: string; code?: string; filier_id?: number; department_id?: number; professor_id?: number }[]>([]);
  const [filieres, setFilieres] = useState<{ id: number; name: string; department_id?: number }[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [editingSalle, setEditingSalle] = useState<{ id: number; name: string; code: string; capacity: number; type: string; floor: string; building: string } | null>(null);
  const [editingDepartment, setEditingDepartment] = useState<{ id: number; name: string; code?: string; head_id?: number; staff_count?: number } | null>(null);
  const [editingExam, setEditingExam] = useState<{ id: number; module_id: string; module: string; date: string; start_time: string; end_time: string; salle_id: string; salle: string; exam_type: string; department_id: string; department_name: string; notes: string } | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<{ id: number; username?: string; email?: string; first_name?: string; last_name?: string; institutional_grade?: string; department?: string; user?: any } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmType, setDeleteConfirmType] = useState<'salle' | 'professor' | 'department' | 'exam' | null>(null);
  
  // Load professor form data when selectedProfessor changes
  useEffect(() => {
    if (selectedProfessor) {
      const user = selectedProfessor.user || {} as any;
      const nameParts = selectedProfessor.name.split(' ');
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
        setExams(response.data.map(e => ({
          id: e.id,
          module: e.module,
          date: e.date,
          time: `${e.start_time} - ${e.end_time}`,
          type: e.exam_type,
          room: typeof e.salle === 'string' ? e.salle : e.salle?.name || 'Unknown',
        })));
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
  const handleEditExam = (exam: typeof exams[0]) => {
    const selectedModule = modules.find(m => m.name === exam.module);
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
      module_id: selectedModule?.id?.toString() || '',
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
                onChange={async (e) => {
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
                  
                  // Fetch existing exams for this module to determine available types
                  let availableTypes = ['NORMAL', 'RATTRAPAGE'];
                  if (selectedModule) {
                    if (useMockData) {
                      const existingExams = exams.filter(e => e.module === selectedModule.name);
                      const existingTypes = existingExams.map(e => e.type);
                      availableTypes = ['NORMAL', 'RATTRAPAGE'].filter(t => !existingTypes.includes(t));
                    } else {
                      try {
                        const moduleExamsResponse = await examService.getByModule(parseInt(e.target.value));
                        if (moduleExamsResponse.success && moduleExamsResponse.data) {
                          const existingTypes = moduleExamsResponse.data.map((ex: any) => ex.exam_type);
                          availableTypes = ['NORMAL', 'RATTRAPAGE'].filter(t => !existingTypes.includes(t));
                        }
                      } catch (err) {
                        console.error('Error fetching module exams:', err);
                        // Fallback: use all exams and filter by module
                        try {
                          const allExamsResponse = await examService.getAll();
                          if (allExamsResponse.success && allExamsResponse.data) {
                            const existingTypes = allExamsResponse.data
                              .filter((ex: any) => ex.module_id === parseInt(e.target.value))
                              .map((ex: any) => ex.exam_type);
                            availableTypes = ['NORMAL', 'RATTRAPAGE'].filter(t => !existingTypes.includes(t));
                          }
                        } catch (fallbackErr) {
                          console.error('Error fetching all exams for fallback:', fallbackErr);
                          // If all else fails, keep both types available
                        }
                      }
                    }
                  }
                  
                  // Set first available type as default, or keep current if it's still available
                  let defaultType = examForm.exam_type;
                  if (availableTypes.length > 0) {
                    if (!availableTypes.includes(examForm.exam_type)) {
                      defaultType = availableTypes[0];
                    }
                  } else {
                    defaultType = 'NORMAL';
                  }
                  
                  setAvailableExamTypes(availableTypes);
                  setExamForm({
                    ...examForm,
                    module_id: e.target.value,
                    module: selectedModule ? selectedModule.name : '',
                    department_id: deptId,
                    department_name: deptName,
                    exam_type: defaultType,
                  });
                }}
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                required
              >
                <option value="">Select a Module</option>
                {modules.filter(m => m.is_active !== false).map(module => (
                  <option key={module.id} value={module.id}>{module.name} {module.code && `- ${module.code}`}</option>
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
                    <option key={salle.id} value={salle.id}>{salle.name} ({salle.code}) - {salle.type} {salle.capacity > 0 && `- Cap: ${salle.capacity}`}</option>
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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-3 bg-app-primary text-white px-8 py-4 rounded-none font-black uppercase tracking-[0.2em] text-xs hover:bg-app-fg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Resource
        </button>
      </div>

      <div className="flex bg-stone-100 p-1 rounded-none border border-stone-200 w-fit">
        {(["overview", "professors", "exams", "salles", "departments"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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
                  trend: "+2" 
                },
                { 
                  label: "Scheduled Exams", 
                  value: dashboardData?.stats?.scheduled_exams?.toString() || "0", 
                  icon: Calendar, 
                  trend: "+12%" 
                },
                { 
                  label: "Total Salles", 
                  value: dashboardData?.stats?.total_salles?.toString() || "0", 
                  icon: DoorOpen, 
                  trend: "0" 
                },
                { 
                  label: "Allocation Rate", 
                  value: dashboardData?.stats?.allocation_rate || "0%", 
                  icon: Target, 
                  trend: "STABLE" 
                },
              ].map((stat, i) => (
                <div key={i} className="p-8 bg-white border-r border-stone-200 last:border-r-0">
                  <div className="flex justify-between items-start">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{stat.label}</p>
                    <stat.icon className="w-4 h-4 text-app-primary" />
                  </div>
                  <div className="mt-4 flex items-baseline gap-4">
                     <h3 className="text-3xl font-black text-app-fg">{stat.value}</h3>
                     <span className="text-[9px] font-black text-stone-300 uppercase">{stat.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-stone-200 p-10">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-app-fg mb-10">Staff Quota Distribution</h4>
              {isDashboardLoading ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-primary"></div>
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie 
                        data={quotaData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={80} 
                        outerRadius={120} 
                        dataKey="value" 
                        stroke="none"
                        label={({ name, percent }) => percent > 0.05 ? name : ''}
                      >
                        {quotaData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1210', border: 'none', color: '#fff', fontSize: '10px', fontWeight: '900' }} />
                      <Legend verticalAlign="bottom" align="center" iconType="rect" formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-2">{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-white border border-stone-200 p-10">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-app-fg mb-10">Departmental Exam Load</h4>
              {isDashboardLoading ? (
                <div className="h-[300px] w-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-primary"></div>
                </div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie 
                        data={deptData} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={120} 
                        dataKey="value" 
                        stroke="#fff" 
                        strokeWidth={2}
                        label={({ name, percent }) => percent > 0.05 ? name : ''}
                      >
                        {deptData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1a1210', border: 'none', color: '#fff', fontSize: '10px', fontWeight: '900' }} />
                      <Legend verticalAlign="bottom" align="center" iconType="rect" formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-2">{value}</span>} />
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
                        <td className="py-3 text-stone-500">{exam.department || 'N/A'}</td>
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
