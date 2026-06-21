import { useState, useEffect, useCallback } from "react";
import { Clock, MapPin, BookOpen, ArrowRight, Download, History, Settings, Save, AlertCircle, FileSignature, Mail, Lock, Eye, EyeOff, ChevronDown } from "lucide-react";
import { cn } from "../utils/cn";
import { Modal } from "../components/ui/Modal";
import { professorService } from "../services/professorService";
import { moduleService } from "../services/moduleService";
import { examService } from "../services/examService";
import { assignmentService } from "../services/assignmentService";
import { authService } from "../services/authService";
import type { Module, Exam, Assignment, Professor } from "../types";
import type { User } from "../types";

interface ProfessorDashboardData {
  professor: Professor | null;
  user: User | null;
  allProfessors: Professor[];
  modules: Module[];
  exams: Exam[];
  allExams: Exam[];
  guardAssignments: Assignment[];
  isLoading: boolean;
  error: string | null;
}

export const ProfessorPortal = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<ProfessorDashboardData>({
    professor: null,
    user: null,
    allProfessors: [],
    modules: [],
    exams: [],
    allExams: [],
    guardAssignments: [],
    isLoading: true,
    error: null
  });
  
  // Form states for settings
  const [emailForm, setEmailForm] = useState({ email: '', currentPassword: '' });
  const [passwordForm, setPasswordForm] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  const fetchProfessorData = useCallback(async () => {
    setDashboardData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Get current user
      const currentUser = authService.getStoredUser();
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Get professor by user_id
      const professorResponse = await professorService.getAll(1, 100);
      const allProfessors: Professor[] = professorResponse.success && professorResponse.data 
        ? (Array.isArray(professorResponse.data) ? professorResponse.data : (professorResponse.data as any).data || []) 
        : [];
      const professor = allProfessors.find((p: any) => p.user_id === currentUser.id || p.id === currentUser.id) || null;
      
      // Get all professors for reference
      const allProfessorsList: Professor[] = allProfessors;
      
      // Get all exams with full details
      const allExamsResponse = await examService.getAll();
      const allExams: Exam[] = allExamsResponse.success && allExamsResponse.data 
        ? (Array.isArray(allExamsResponse.data) ? allExamsResponse.data : (allExamsResponse.data as any).data || []) 
        : [];
      
      // Get all modules
      const allModulesResponse = await moduleService.getAll(1, 100);
      const allModules: Module[] = allModulesResponse.success && allModulesResponse.data
        ? (Array.isArray(allModulesResponse.data) ? allModulesResponse.data : (allModulesResponse.data as any).data || [])
        : [];
      
      // Get modules taught by this professor (direct assignment)
      const directModules: Module[] = allModules.filter(m => m.professor_id === currentUser.id);
      
      // Get exams where this professor is associated (via associated_professors or module professor)
      const examsWithProfessor: Exam[] = allExams.filter(e => 
        e.associated_professors?.some((p: any) => p.id === currentUser.id) || 
        (e.module_obj as any)?.professor_id === currentUser.id ||
        e.module_id && allModules.some(m => m.id === e.module_id && m.professor_id === currentUser.id)
      );
      
      // Get modules from exams where professor is associated
      const examModuleIds = new Set<number>();
      examsWithProfessor.forEach(e => {
        if (e.module_id) examModuleIds.add(e.module_id);
        if (e.module_obj?.id) examModuleIds.add(e.module_obj.id);
      });
      
      const associatedModules: Module[] = allModules.filter(m => examModuleIds.has(m.id));
      
      // Combine modules from both sources and remove duplicates
      const moduleIds = new Set<number>();
      const combinedModules: Module[] = [...directModules, ...associatedModules]
        .filter(m => {
          if (m.id && !moduleIds.has(m.id)) {
            moduleIds.add(m.id);
            return true;
          }
          return false;
        });
      
      // Get exams for these modules (all exams, not just those with professor)
      let exams: Exam[] = [];
      for (const module of combinedModules) {
        if (module.id) {
          const examResponse = await examService.getByModule(module.id);
          if (examResponse.success && examResponse.data) {
            const examData: Exam[] = Array.isArray(examResponse.data) 
              ? examResponse.data 
              : ((examResponse.data as any).data || []);
            exams = [...exams, ...examData];
          }
        }
      }
      
      // Get assignments where this professor is a guard
      const assignmentsResponse = await assignmentService.getByProfessor(currentUser.id);
      const guardAssignments: Assignment[] = assignmentsResponse.success && assignmentsResponse.data
        ? (Array.isArray(assignmentsResponse.data) ? assignmentsResponse.data : (assignmentsResponse.data as any).data || []) 
        : [];
      
      setDashboardData({
        professor,
        user: currentUser,
        allProfessors: allProfessorsList,
        modules: combinedModules,
        exams,
        allExams,
        guardAssignments,
        isLoading: false,
        error: null
      });
      
    } catch (error) {
      console.error('Error fetching professor data:', error);
      setDashboardData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load professor data. Please refresh the page.'
      }));
    }
  }, []);

  useEffect(() => {
    fetchProfessorData();
  }, [fetchProfessorData]);

  const handleOpenIncident = (exam: Exam) => {
    setSelectedExam(exam);
    setIsIncidentModalOpen(true);
  };

  const toggleModuleExpand = (moduleId: number) => {
    setExpandedModule(prev => prev === moduleId ? null : moduleId);
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);
    
    if (!emailForm.email) {
      setSettingsError('Please enter your new email address.');
      return;
    }
    
    if (!emailForm.currentPassword) {
      setSettingsError('Please enter your current password for verification.');
      return;
    }
    
    try {
      // Call update user API
      const user = authService.getStoredUser();
      if (!user) {
        setSettingsError('User not authenticated.');
        return;
      }
      
      const response = await authService.updateUser(user.id, { email: emailForm.email });
      if (response.success) {
        // Also update local storage
        const updatedUser = { ...user, email: emailForm.email };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setSettingsSuccess('Email updated successfully!');
        setEmailForm({ email: '', currentPassword: '' });
        // Refresh data
        await fetchProfessorData();
      } else {
        setSettingsError(response.message || 'Failed to update email.');
      }
    } catch (error: any) {
      setSettingsError(error.message || 'Failed to update email. Please try again.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsError(null);
    setSettingsSuccess(null);
    
    if (!passwordForm.currentPassword) {
      setSettingsError('Please enter your current password.');
      return;
    }
    
    if (!passwordForm.newPassword) {
      setSettingsError('Please enter a new password.');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSettingsError('New passwords do not match.');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setSettingsError('Password must be at least 6 characters long.');
      return;
    }
    
    try {
      const response = await authService.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });
      
      if (response.success) {
        setSettingsSuccess('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setSettingsError(response.message || 'Failed to change password.');
      }
    } catch (error: any) {
      setSettingsError(error.message || 'Failed to change password. Please try again.');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = '/#login';
  };

  // Get exams for a specific module
  const getExamsForModule = (moduleId: number): Exam[] => {
    return dashboardData.exams.filter(e => e.module_id === moduleId);
  };

  // Get exam by ID
  const getExamById = (examId: number): Exam | undefined => {
    return dashboardData.exams.find(e => e.id === examId);
  };

  // Calculate quota percentage
  const getQuotaPercentage = (): number => {
    if (dashboardData.professor) {
      return (dashboardData.professor.completed_guards / dashboardData.professor.max_guards) * 100;
    }
    return 0;
  };

  if (dashboardData.isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-10 py-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-app-fg pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-app-primary text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">Loading...</span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-app-fg uppercase leading-none">Loading Professor Data...</h1>
          </div>
        </div>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-primary mx-auto"></div>
          <p className="mt-4 text-stone-500">Fetching your data...</p>
        </div>
      </div>
    );
  }

  if (dashboardData.error) {
    return (
      <div className="max-w-6xl mx-auto space-y-10 py-6 animate-in fade-in duration-500">
        <div className="bg-red-50 border border-red-200 p-6 text-center">
          <p className="text-red-600 font-bold">{dashboardData.error}</p>
          <button onClick={fetchProfessorData} className="mt-4 px-4 py-2 bg-app-primary text-white text-sm">Retry</button>
        </div>
      </div>
    );
  }

  const user = dashboardData.user;
  const professor = dashboardData.professor;

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-app-fg pb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-app-primary text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">Faculty Member</span>
            <span className="text-stone-300 text-[10px] font-black uppercase tracking-widest">S2-2026 SESSION</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-app-fg uppercase leading-none">
            {user ? `${professor?.academic_title || user.institutional_grade || 'DR.'} ${user.full_name || `${user.first_name} ${user.last_name}`}` : 'PROFESSOR'}
          </h1>
          <p className="text-xs font-bold text-stone-500 mt-4 uppercase tracking-[0.3em]">
            {professor?.department || 'Computer Science Department'} • Institutional Grade: {user?.institutional_grade || 'PR'}
          </p>
          <p className="text-[9px] font-bold text-stone-400 mt-2 uppercase tracking-widest">
            {user?.email}
          </p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setIsSettingsModalOpen(true)} className="bg-stone-100 p-4 border border-stone-200 hover:bg-stone-200 transition-colors group">
            <Settings className="w-5 h-5 text-app-fg group-hover:rotate-90 transition-transform" />
          </button>
          <button onClick={handleLogout} className="bg-stone-100 p-4 border border-stone-200 hover:bg-red-100 transition-colors group">
            <span className="text-xs font-black uppercase text-red-500">Logout</span>
          </button>
          <div className="h-16 w-16 bg-app-fg text-white flex items-center justify-center font-black text-xl">
            {user ? user.full_name.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2) : 'SC'}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-stone-200">
        <div className="p-10 bg-white border-r border-stone-200">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Current Quota</p>
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-black text-app-fg leading-none">
              {professor ? String(professor.completed_guards).padStart(2, '0') : '00'}
            </span>
            <span className="text-xl font-black text-stone-300 leading-none">
              / {professor ? String(professor.max_guards).padStart(2, '0') : '04'}
            </span>
          </div>
          <div className="mt-8 h-2 w-full bg-stone-100 rounded-none overflow-hidden">
            <div 
              className="h-full bg-app-primary transition-all duration-1000" 
              style={{ width: `${getQuotaPercentage()}%` }} 
            />
          </div>
          <p className="text-[9px] font-black text-stone-500 mt-4 uppercase tracking-widest">
            Guard Assignments: {professor?.quota_status || 'ACTIVE'}
          </p>
        </div>
        <div className="p-10 bg-white border-r border-stone-200">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Modules Taught</p>
          <h3 className="text-xl font-black text-app-fg uppercase tracking-tight">{dashboardData.modules.length}</h3>
          <p className="text-[10px] font-bold text-app-primary uppercase mt-2">{dashboardData.modules.map(m => m.code).join(' • ')}</p>
        </div>
        <div className="p-10 bg-stone-50">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">System Status</p>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-600"></div>
            <span className="text-xs font-black text-app-fg uppercase tracking-widest">SCHEDULE SYNCED</span>
          </div>
          <p className="text-[9px] font-bold text-stone-500 uppercase mt-4 leading-relaxed italic">
            Your profile is in full compliance with departmental regulations.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column - Modules and Exams */}
        <div className="lg:col-span-2 space-y-8">
          {/* My Modules Section */}
          <div>
            <h3 className="text-sm font-black flex items-center gap-4 text-app-fg uppercase tracking-[0.2em] mb-6">
              <div className="w-2 h-6 bg-app-primary"></div>
              My Teaching Modules
            </h3>
            
            <div className="space-y-0 border border-stone-200 shadow-none">
              {dashboardData.modules.length > 0 ? (
                dashboardData.modules.map((module) => {
                  const moduleExams = getExamsForModule(module.id);
                  const isExpanded = expandedModule === module.id;
                  
                  // Only show modules that have a name or id
                  if (!module.name && !module.id) return null;
                  
                  return (
                    <div key={module.id} className="bg-white border-b border-stone-100 last:border-b-0">
                      <button
                        onClick={() => toggleModuleExpand(module.id)}
                        className="w-full p-8 text-left flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-stone-50 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-8">
                          <div className="w-16 h-16 bg-app-primary bg-opacity-10 border border-app-primary flex items-center justify-center text-app-primary">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-lg text-app-fg uppercase tracking-tight leading-tight">
                                {module.name || 'Unnamed Module'} {module.code && `(${module.code})`}
                              </h4>
                              {module.professor_id === dashboardData.user?.id && (
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 font-black uppercase tracking-wider">YOU</span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2">
                              {module.filier_name || 'Not specified'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-app-primary bg-app-primary bg-opacity-10 px-3 py-1 uppercase tracking-wider">
                            {moduleExams.length} Exam{moduleExams.length !== 1 ? 's' : ''}
                          </span>
                          <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="bg-stone-50 p-6 border-t border-stone-100">
                          <h5 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-4">Module Exams</h5>
                          {moduleExams.length > 0 ? (
                            <div className="space-y-4">
                              {moduleExams.map((exam) => (
                                <div key={exam.id} className="flex items-center justify-between p-4 bg-white border border-stone-100">
                                  <div>
                                    <p className="font-black text-sm text-app-fg uppercase tracking-tight">
                                      {exam.exam_type || 'NORMAL'} EXAM
                                    </p>
                                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mt-1">
                                      {exam.date || 'TBD'}
                                    </p>
                                    {exam.associated_professors && exam.associated_professors.length > 0 && (
                                      <p className="text-[8px] font-bold text-app-primary uppercase tracking-wider mt-1">
                                        Associated: {exam.associated_professors.map((p: any) => p.name || `Prof #${p.id}`).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[10px] font-black text-app-fg uppercase tracking-wider">
                                      {exam.time || exam.start_time && exam.end_time ? `${exam.start_time} - ${exam.end_time}` : 'TBD'}
                                    </p>
                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-wider mt-1">
                                      {typeof exam.salle === 'string' ? exam.salle : exam.salle?.name || 'TBD'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">No exams scheduled for this module</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-12 text-center border-b border-stone-100">
                  <p className="text-stone-400 font-bold">No modules assigned to you</p>
                  <p className="text-[10px] text-stone-500 mt-2">Your teaching modules will appear here once assigned.</p>
                </div>
              )}
            </div>
          </div>

          {/* Active Assignments Section */}
          <div>
            <h3 className="text-sm font-black flex items-center gap-4 text-app-fg uppercase tracking-[0.2em]">
              <div className="w-2 h-6 bg-app-primary"></div>
              Active Guard Assignments
            </h3>

            <div className="space-y-0 border border-stone-200 shadow-none mt-6">
              {dashboardData.guardAssignments.length > 0 ? (
                dashboardData.guardAssignments.map((assignment) => {
                  const exam = getExamById(assignment.exam_id);
                  const module = dashboardData.modules.find(m => m.id === exam?.module_id);
                  
                  return (
                    <div key={assignment.id} className="group bg-white border-b border-stone-100 last:border-b-0 p-8 hover:bg-stone-50 transition-colors duration-150">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-center gap-8">
                          <div className="w-16 h-16 bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 group-hover:bg-app-fg group-hover:text-white transition-all">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-black text-lg text-app-fg uppercase tracking-tight leading-tight">
                              {assignment.exam_module || exam?.module || module?.name || 'Unknown Module'}
                            </h4>
                            {module && (
                              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">
                                {module.code} • {module.filier_name}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-6 mt-3">
                              <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5 text-app-primary" />
                                {assignment.exam_time || exam?.time || `${exam?.start_time} - ${exam?.end_time}`}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                <MapPin className="w-3.5 h-3.5 text-app-primary" />
                                {assignment.exam_room || (typeof exam?.salle === 'string' ? exam?.salle : exam?.salle?.name) || 'TBD'}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-10 md:border-l border-stone-200 md:pl-10">
                          <div className="text-left md:text-right">
                            <p className="text-xs font-black text-app-fg uppercase tracking-widest">{assignment.exam_date || exam?.date || 'TBD'}</p>
                            <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 mt-1 inline-block tracking-widest", 
                              assignment.status === 'CONFIRMED' ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-400"
                            )}>
                              {assignment.status}
                            </span>
                          </div>
                          {exam && (
                            <button onClick={() => handleOpenIncident(exam)} className="px-6 py-3 border-2 border-app-fg text-app-fg font-black uppercase tracking-widest text-[10px] hover:bg-app-fg hover:text-white transition-all">
                              LOGS
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-12 text-center">
                  <p className="text-stone-400 font-bold">No guard assignments found</p>
                  <p className="text-[10px] text-stone-500 mt-2">You have not been assigned as a guard to any exams yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-10">
          <div className="bg-app-fg p-10 text-white">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 border-b border-stone-800 pb-4">Faculty Bulletins</h4>
            <div className="space-y-8">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-app-primary uppercase tracking-widest">May 11, 2026</p>
                <p className="text-xs font-bold leading-relaxed text-stone-300">New invigilation guidelines for Final Exams published. Please review the updated protocol.</p>
                <button className="flex items-center gap-2 text-[9px] font-black text-white hover:text-app-primary transition-colors uppercase tracking-widest">
                  Read More <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Service Portal</h4>
            <button className="w-full flex items-center justify-between p-6 bg-white border border-stone-200 hover:border-app-primary transition-all group">
              <div className="flex items-center gap-4">
                <Download className="w-5 h-5 text-stone-400 group-hover:text-app-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Download Official PDF</span>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-200" />
            </button>
            <button className="w-full flex items-center justify-between p-6 bg-white border border-stone-200 hover:border-app-primary transition-all group">
              <div className="flex items-center gap-4">
                <History className="w-5 h-5 text-stone-400 group-hover:text-app-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Past Assignments</span>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-200" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Settings Modal */}
      <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Faculty Profile Settings">
        <form className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Full Academic Name</label>
              <input 
                type="text" 
                defaultValue={user ? `${professor?.academic_title || user.institutional_grade || 'DR.'} ${user.full_name || `${user.first_name} ${user.last_name}`}` : ''} 
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Institutional Grade</label>
                <select className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all">
                  <option>PR (PROFESSEUR)</option>
                  <option>PES (ENSEIGNANT)</option>
                  <option>PH (HABILITÉ)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Department</label>
                <input 
                  type="text" 
                  defaultValue={professor?.department || 'Computer Science'} 
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Digital Signature Reference</label>
              <div className="border-2 border-dashed border-stone-200 p-8 flex flex-col items-center bg-stone-50">
                <FileSignature className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest text-center">Upload signature for official reports</p>
              </div>
            </div>
          </div>
          <button type="button" className="w-full bg-app-fg text-white py-5 font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:bg-app-primary transition-all">
            <Save className="w-4 h-4" /> UPDATE PROFILE
          </button>
        </form>
      </Modal>

      {/* Settings Modal - Email & Password */}
      <Modal isOpen={isSettingsModalOpen} onClose={() => {
        setIsSettingsModalOpen(false);
        setSettingsError(null);
        setSettingsSuccess(null);
      }} title="Account Settings">
        <div className="space-y-8">
          {/* Email Change Section */}
          <div className="border border-stone-200 p-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-app-fg mb-6 flex items-center gap-2">
              <Mail className="w-4 h-4" /> Change Email
            </h3>
            <form onSubmit={handleEmailChange} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Current Email</label>
                <input 
                  type="text" 
                  value={user?.email || ''}
                  readOnly
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">New Email</label>
                <input 
                  type="email" 
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({...emailForm, email: e.target.value})}
                  placeholder="Enter new email address"
                  className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Current Password (for verification)</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm({...emailForm, currentPassword: e.target.value})}
                    placeholder="Enter current password"
                    className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-app-primary"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {settingsError && (
                <p className="text-red-500 text-[10px] font-bold">{settingsError}</p>
              )}
              {settingsSuccess && (
                <p className="text-green-600 text-[10px] font-bold">{settingsSuccess}</p>
              )}
              <button type="submit" className="w-full bg-app-primary text-white py-4 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-app-fg transition-all">
                <Save className="w-4 h-4" /> Update Email
              </button>
            </form>
          </div>

          {/* Password Change Section */}
          <div className="border border-stone-200 p-6">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-app-fg mb-6 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Change Password
            </h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Current Password</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    placeholder="Enter current password"
                    className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all pr-10"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-app-primary"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      placeholder="Enter new password"
                      className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all pr-10"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-app-primary"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      placeholder="Confirm new password"
                      className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all pr-10"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-app-primary"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              {passwordForm.newPassword && passwordForm.newPassword.length < 6 && (
                <p className="text-red-500 text-[10px] font-bold">Password must be at least 6 characters</p>
              )}
              <button type="submit" className="w-full bg-app-primary text-white py-4 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-app-fg transition-all">
                <Save className="w-4 h-4" /> Change Password
              </button>
            </form>
          </div>
        </div>
      </Modal>

      {/* Incident Log Modal */}
      <Modal isOpen={isIncidentModalOpen} onClose={() => setIsIncidentModalOpen(false)} title="Duty Report / Incident Log">
        <form className="space-y-6">
          {selectedExam && (
            <div className="p-4 bg-stone-900 text-white mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-app-primary">Active Context</p>
              <p className="text-xs font-bold uppercase tracking-tight">{selectedExam.module} • {typeof selectedExam.salle === 'string' ? selectedExam.salle : selectedExam.salle?.name || 'Unknown'}</p>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Formal Explanation</label>
            <textarea 
              rows={4} 
              placeholder="PROVIDE DETAILED LOG FOR SCOLARITÉ REVIEW..." 
              className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all resize-none"
            />
          </div>
          <div className="p-4 bg-stone-100 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-app-primary shrink-0" />
            <p className="text-[9px] font-bold text-stone-500 uppercase leading-relaxed">
              Reporting an incident triggers a manual review by the administration.
            </p>
          </div>
          <button type="button" className="w-full bg-app-primary text-white py-5 font-black uppercase tracking-[0.3em] text-xs flex items-center justify-center gap-3 hover:bg-app-fg transition-all">
            <Save className="w-4 h-4" /> SUBMIT LOG
          </button>
        </form>
      </Modal>
    </div>
  );
};
