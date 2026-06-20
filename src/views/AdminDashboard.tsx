import { useState, useEffect, useCallback } from "react";
import { Plus, Users, Calendar, DoorOpen, Target, Layers, MoreVertical, Save, RefreshCcw } from "lucide-react";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { cn } from "../utils/cn";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { professorService, examService, departmentService, salleService, authService, dashboardService, useMockData } from "../services";
import type { Professor, Exam, Department, Salle, DashboardOverview } from "../types";

interface AdminDashboardProps {
  forcedTab?: "overview" | "professors" | "exams" | "salles" | "departments";
}

export const AdminDashboard = ({ forcedTab }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "professors" | "exams" | "salles" | "departments">(forcedTab || "overview");
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
    module: '',
    date: '',
    time: '',
    salle: 'Amphi A',
  });
  const [resourceForm, setResourceForm] = useState({
    name: '',
    code: '',
    capacity: '',
    type: 'SALLE',
    floor: '1',
    building: 'Main',
  });

  // Data state
  const [professors, setProfessors] = useState<{ id: number; name: string; dept: string; guards: number }[]>([]);
  const [exams, setExams] = useState<{ id: number; module: string; date: string; time: string; type: string; room: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: number; name: string; head: string; staff: number }[]>([]);
  const [salles, setSalles] = useState<{ id: number; name: string; code: string; capacity: number; type: string; floor: string; building: string; is_active: boolean }[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardOverview | null>(null);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  
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
    if (activeTab === "exams") fetchExams();
    if (activeTab === "departments") fetchDepartments();
    if (activeTab === "salles") fetchSalles();
    if (activeTab === "overview") fetchDashboardOverview();
  }, [activeTab, fetchDashboardOverview, fetchProfessors, fetchExams, fetchDepartments, fetchSalles]);

  // Initial fetch for overview when component mounts
  useEffect(() => {
    if (forcedTab === "overview" || activeTab === "overview") {
      fetchDashboardOverview();
    }
  }, [forcedTab, activeTab, fetchDashboardOverview]);

  // Form submit handlers
  const handleProfessorSubmit = async () => {
    // Validate all required fields
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
    if (!professorForm.email.trim()) {
      setError('Please enter an email');
      return;
    }
    if (!professorForm.password.trim()) {
      setError('Please enter a password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      if (useMockData) {
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
        setProfessorForm({
          username: '',
          password: '',
          email: '',
          first_name: '',
          last_name: '',
          institutional_grade: 'PR',
          department: 'Computer Science'
        });
        setIsModalOpen(false);
        return;
      }

      // Real API call - get department ID first
      const deptResponse = await departmentService.getAll(1, 50);
      const dept = deptResponse.data?.find((d: any) => d.name === professorForm.department);
      
      if (!dept) {
        setError('Department not found');
        return;
      }
      
      // Call register endpoint to create user + professor profile
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
        setIsModalOpen(false);
        fetchProfessors();
      } else {
        setError(registerResponse.message || 'Failed to add professor');
      }
    } catch (err) {
      setError('Failed to add professor. Please try again.');
      console.error('Error adding professor:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExamSubmit = async () => {
    if (!examForm.module.trim()) {
      setError('Please enter a module name');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (useMockData) {
        setExams(prev => [
          ...prev,
          {
            id: prev.length + 1,
            module: examForm.module,
            date: examForm.date,
            time: examForm.time,
            type: 'FINAL',
            room: examForm.salle,
          }
        ]);
        setSuccess('Exam scheduled successfully!');
        setExamForm({ module: '', date: '', time: '', salle: 'Amphi A' });
        setIsModalOpen(false);
        return;
      }

      // Real API call
      const salleId = examForm.salle === 'Amphi A' ? 1 : examForm.salle === 'Amphi B' ? 2 : examForm.salle === 'SALLE B12' ? 3 : 4;
      await examService.create({
        module: examForm.module,
        module_code: examForm.module.split(' ')[0],
        exam_type: 'FINAL',
        date: examForm.date,
        start_time: examForm.time.split('-')[0]?.trim() || '09:00',
        end_time: examForm.time.split('-')[1]?.trim() || '11:00',
        salle_id: salleId,
        department_id: 2, // Default to Computer Science
        academic_year: '2025-2026',
        semester: 'S2',
      } as any);
      
      setSuccess('Exam scheduled successfully!');
      setExamForm({ module: '', date: '', time: '', salle: 'Amphi A' });
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
        } else if (activeTab === "departments") {
          setDepartments(prev => [
            ...prev,
            {
              id: prev.length + 1,
              name: resourceForm.name,
              head: 'Admin',
              staff: 0,
            }
          ]);
        }
        
        setSuccess('Resource added successfully!');
        setResourceForm({ name: '', code: '', capacity: '', type: 'SALLE', floor: '1', building: 'Main' });
        setIsModalOpen(false);
        return;
      }

      // Real API call
      if (activeTab === "salles") {
        await salleService.create({
          name: resourceForm.name,
          code: resourceForm.code || resourceForm.name.split(' ')[0],
          capacity: parseInt(resourceForm.capacity) || 0,
          type: resourceForm.type || 'SALLE',
          floor: resourceForm.floor || '1',
          building: resourceForm.building || 'Main',
          is_active: true,
        });
        fetchSalles();
      } else if (activeTab === "departments") {
        await departmentService.create({
          name: resourceForm.name,
          staff_count: 0,
        });
        fetchDepartments();
      }
      
      setSuccess('Resource added successfully!');
      setResourceForm({ name: '' });
      setIsModalOpen(false);
    } catch (err) {
      setError('Failed to add resource. Please try again.');
      console.error('Error adding resource:', err);
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
        handleExamSubmit();
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
    { header: "NAME", accessor: "name" as const, className: "font-black tracking-tight" },
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
    { header: "ACTION", accessor: () => <button className="p-1 hover:text-app-primary"><MoreVertical className="w-4 h-4" /></button>, className: "text-right w-12" }
  ];

  const examColumns = [
    { header: "MODULE", accessor: "module" as const, className: "font-black tracking-tight" },
    { header: "DATE", accessor: "date" as const },
    { header: "TIME", accessor: "time" as const },
    { header: "TYPE", accessor: (e: typeof exams[0]) => <span className="text-[9px] font-black px-2 py-1 bg-stone-100 border border-stone-200 uppercase tracking-widest">{e.type}</span> },
    { header: "ROOM", accessor: "room" as const },
    { header: "ACTION", accessor: () => <button className="p-1 hover:text-app-primary"><MoreVertical className="w-4 h-4" /></button>, className: "text-right w-12" }
  ];

  const deptColumns = [
    { header: "DEPT NAME", accessor: "name" as const, className: "font-black tracking-tight" },
    { header: "HEAD OF DEPT", accessor: "head" as const, className: "text-[10px] font-bold" },
    { header: "STAFF COUNT", accessor: (d: typeof departments[0]) => <span className="font-bold text-app-primary">{d.staff} PROF.</span> },
    { header: "ACTION", accessor: () => <button className="p-1 hover:text-app-primary"><MoreVertical className="w-4 h-4" /></button>, className: "text-right w-12" }
  ];

  const salleColumns = [
    { header: "NAME", accessor: "name" as const, className: "font-black tracking-tight" },
    { header: "CODE", accessor: "code" as const, className: "text-[10px] font-bold" },
    { header: "CAPACITY", accessor: "capacity" as const, className: "font-bold text-app-primary" },
    { header: "TYPE", accessor: "type" as const },
    { header: "BUILDING", accessor: "building" as const },
    { header: "ACTION", accessor: () => <button className="p-1 hover:text-app-primary"><MoreVertical className="w-4 h-4" /></button>, className: "text-right w-12" }
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
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Password</label>
              <input 
                type="password" 
                value={professorForm.password}
                onChange={(e) => setProfessorForm({...professorForm, password: e.target.value})}
                placeholder="Enter password" 
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                required
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
              {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> REGISTER STAFF</>}
            </button>
          </form>
        );
      case "exams":
        return (
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Module / Subject</label>
              <input 
                type="text" 
                value={examForm.module}
                onChange={(e) => setExamForm({...examForm, module: e.target.value})}
                placeholder="E.G. QUANTUM COMPUTING" 
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Date</label>
                <input 
                  type="date" 
                  value={examForm.date}
                  onChange={(e) => setExamForm({...examForm, date: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Time</label>
                <input 
                  type="time" 
                  value={examForm.time}
                  onChange={(e) => setExamForm({...examForm, time: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Assigned Exam Room (Salle)</label>
              <select 
                value={examForm.salle}
                onChange={(e) => setExamForm({...examForm, salle: e.target.value})}
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
              >
                <option>AMPHI A</option>
                <option>AMPHI B</option>
                <option>SALLE B12</option>
                <option>LAB 201</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-app-fg text-white py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-app-primary transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> SCHEDULE EXAM</>}
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
              </>
            )}
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-app-fg text-white py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-app-primary transition-all disabled:opacity-50"
            >
              {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> SAVE {activeTab === "salles" ? "SALLE" : "DEPARTMENT"}</>}
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
                  <ResponsiveContainer width="100%" height="100%">
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
                  <ResponsiveContainer width="100%" height="100%">
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
          setSuccess(null);
        }}
        title={`Add ${activeTab === "overview" ? "Resource" : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
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
