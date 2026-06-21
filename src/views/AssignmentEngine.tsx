import { useState, useEffect, useCallback } from "react";
import { 
  Play, 
  CheckCircle2, 
  RefreshCcw, 
  ShieldAlert,
  Info,
  Cpu,
  Users,
  Target,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { cn } from "../utils/cn";
import { professorService, examService, moduleService, assignmentService, useMockData } from "../services";
import type { Professor, Exam, Module, Assignment } from "../types";

const steps = [
  { id: 1, name: "DEPT FILTER", description: "Departmental alignment check" },
  { id: 2, name: "QUOTA VALID", description: "Semester limit validation" },
  { id: 3, name: "CONFLICT RES", description: "Room/Time overlap solving" },
  { id: 4, name: "FINAL ALLOC", description: "Record generation" },
];

export const AssignmentEngine = () => {
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Professor quota management
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [expandedProfessor, setExpandedProfessor] = useState<number | null>(null);
  const [showQuotaConfig, setShowQuotaConfig] = useState(false);
  const [configMaxGuards, setConfigMaxGuards] = useState<number>(4);
  const [editingProfessorId, setEditingProfessorId] = useState<number | null>(null);
  const [tempMaxGuards, setTempMaxGuards] = useState<number>(4);
  
  // Configure max guards per professor
  const MAX_GUARDS_DEFAULT = 4;

  // Fetch all data for quota management
  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch professors, exams, modules, and assignments in parallel
      const [profResponse, examResponse, moduleResponse, assignmentResponse] = await Promise.all([
        professorService.getAll(1, 1000),
        examService.getAll(),
        moduleService.getAll(1, 1000),
        assignmentService.getAll({ page: 1, per_page: 1000 }),
      ]);
      
      setProfessors(profResponse.data || []);
      setExams(examResponse.data || []);
      setModules(moduleResponse.data || []);
      setAssignments(assignmentResponse.data || []);
      
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load professor quota data. Using mock data.');
      // Fallback to mock data
      setProfessors([]);
      setExams([]);
      setModules([]);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate statistics
  const getProfessorStats = (professorId: number) => {
    const professor = professors.find(p => p.id === professorId);
    const profAssignments = assignments.filter(a => a.professor_id === professorId);
    const assignedExams = exams.filter(e => 
      profAssignments.some(a => a.exam_id === e.id)
    );
    
    // Get modules taught by this professor
    const profModules = modules.filter(m => m.professor_id === professorId);
    
    // Use professor's individual max_guards if available, otherwise use global config
    const maxGuards = professor?.max_guards || configMaxGuards;
    
    return {
      totalGuards: profAssignments.length,
      maxGuards: maxGuards,
      isQuotaFull: profAssignments.length >= maxGuards,
      quotaRemaining: Math.max(0, maxGuards - profAssignments.length),
      assignedExams,
      modules: profModules,
      assignments: profAssignments,
      professor,
    };
  };

  // Get professors by department
  const getProfessorsByDepartment = () => {
    const deptMap = new Map<string, Professor[]>();
    professors.forEach(prof => {
      const dept = prof.department || 'Unknown';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, []);
      }
      deptMap.get(dept)?.push(prof);
    });
    return deptMap;
  };

  // Calculate overall statistics
  const getOverallStats = () => {
    const totalAssignments = assignments.length;
    const totalProfessors = professors.length;
    const totalExams = exams.length;
    
    const professorsAtQuota = professors.filter(p => {
      const stats = getProfessorStats(p.id);
      return stats.isQuotaFull;
    }).length;
    
    const totalQuotaUsed = assignments.length;
    // Calculate total quota available using each professor's individual max_guards
    const totalQuotaAvailable = professors.reduce((sum, p) => sum + (p.max_guards || configMaxGuards), 0);
    const allocationRate = totalQuotaAvailable > 0 
      ? (totalQuotaUsed / totalQuotaAvailable) * 100 
      : 0;
    
    return {
      totalAssignments,
      totalProfessors,
      totalExams,
      professorsAtQuota,
      allocationRate: allocationRate.toFixed(1) + '%',
      quotaUsed: totalQuotaUsed,
      quotaAvailable: totalQuotaAvailable,
    };
  };

  // Load data on mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle editing professor's max_guards
  const handleEditProfessorGuards = (professorId: number, currentMaxGuards: number) => {
    setEditingProfessorId(professorId);
    setTempMaxGuards(currentMaxGuards);
  };

  const handleSaveProfessorGuards = async (professorId: number) => {
    try {
      // Update locally first for immediate feedback
      setProfessors(prev => prev.map(p => 
        p.id === professorId ? { ...p, max_guards: tempMaxGuards } : p
      ));
      
      // Try to update on backend
      try {
        await professorService.update(professorId, { max_guards: tempMaxGuards });
      } catch (backendError) {
        console.warn('Failed to update professor max_guards on backend:', backendError);
        // Keep the local update even if backend fails
      }
      
      setEditingProfessorId(null);
    } catch (error) {
      console.error('Error updating professor guards:', error);
      // Reset and show error
      setEditingProfessorId(null);
      setError('Failed to update professor quota. Please try again.');
    }
  };

  const handleCancelProfessorGuards = () => {
    setEditingProfessorId(null);
  };

  const startAssignment = () => {
    setStatus("running");
    let step = 0;
    const interval = setInterval(() => {
      if (step < steps.length) {
        setActiveStep(step + 1);
        step++;
      } else {
        clearInterval(interval);
        setStatus("completed");
      }
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="border-l-8 border-app-primary pl-6 py-2">
        <h1 className="text-3xl font-black tracking-tighter text-app-fg uppercase">Assignment Engine</h1>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] mt-2">Automated Invigilation Logistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-app-border">
        <div className="md:col-span-2 bg-white p-10 flex flex-col justify-between border-r border-app-border">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-100 text-app-fg text-[10px] font-black uppercase tracking-widest border border-stone-200">
              <Cpu className="w-3 h-3" />
              ALGORITHM CORE V2.4
            </div>
            <h2 className="text-2xl font-black text-app-fg uppercase tracking-tight">Run Random Allocation</h2>
            <p className="text-sm text-stone-500 leading-relaxed max-w-xl font-medium">
              Triggering this process will synchronize all scheduled exams for Semester 2, 2026. 
              Eligible professors will be assigned based on departmental expertise and 4-guard quotas.
            </p>
          </div>

          <div className="mt-10 flex items-center gap-4">
            <button 
              onClick={startAssignment}
              disabled={status === "running"}
              className="flex items-center gap-3 bg-app-fg text-white px-10 py-4 rounded-none font-black uppercase tracking-[0.2em] text-xs hover:bg-app-primary transition-all disabled:opacity-50"
            >
              {status === "running" ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {status === "running" ? "PROCESSING..." : "EXECUTE ALLOCATION"}
            </button>
            <button className="flex items-center gap-2 bg-white border border-stone-200 text-stone-600 px-6 py-4 rounded-none font-black uppercase tracking-[0.2em] text-xs hover:bg-stone-50 transition-all">
              SIMULATE
            </button>
          </div>
        </div>

        <div className="bg-stone-50 p-10 space-y-8">
          <h3 className="font-black text-app-fg uppercase text-xs tracking-widest border-b border-stone-200 pb-4">Engine Parameters</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-stone-500">Pending Exams</span>
              <span className="text-app-primary">124 UNITS</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-stone-500">Available Staff</span>
              <span className="text-app-primary">48 PERS.</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-stone-500">Semester</span>
              <span className="text-app-fg">S2-2026</span>
            </div>
          </div>
          <div className="pt-4">
            <div className="flex items-start gap-3 p-4 bg-white border border-stone-200 text-[10px] font-bold text-stone-500 leading-normal uppercase">
              <Info className="w-4 h-4 shrink-0 text-app-primary" />
              <p>Randomization is enforced to ensure equitable distribution across all departments.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Professor Quota Management Section */}
      <div className="bg-white border border-app-border">
        <div className="p-10 border-b border-stone-100 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-black text-app-fg uppercase tracking-widest flex items-center gap-3">
              <div className="w-1 h-4 bg-app-primary"></div>
              Professor Guard Quota Management
            </h3>
            <p className="text-xs text-stone-500 mt-2 uppercase tracking-widest">
              Track and manage professor exam guard assignments with configurable quotas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuotaConfig(!showQuotaConfig)}
              className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-200 text-app-fg text-xs font-bold uppercase tracking-wider hover:bg-stone-100 transition-all"
            >
              <Settings className="w-3 h-3" />
              Configure
            </button>
            <button
              onClick={fetchAllData}
              disabled={isLoading}
              className="p-2 bg-stone-50 border border-stone-200 text-app-fg hover:bg-stone-100 transition-all disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Configuration Panel */}
        {showQuotaConfig && (
          <div className="p-6 bg-stone-50 border-b border-stone-100">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-xs font-black uppercase tracking-widest text-stone-600 mb-4">
                  Quota Configuration
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
                      Max Guards Per Professor
                    </label>
                    <input
                      type="number"
                      value={configMaxGuards}
                      onChange={(e) => setConfigMaxGuards(Math.max(1, parseInt(e.target.value) || 4))}
                      min={1}
                      max={10}
                      className="w-20 px-3 py-2 border border-stone-200 text-xs font-bold text-center"
                    />
                    <button
                      onClick={() => setConfigMaxGuards(MAX_GUARDS_DEFAULT)}
                      className="text-[10px] font-bold uppercase tracking-widest text-app-primary hover:underline"
                    >
                      Reset to Default ({MAX_GUARDS_DEFAULT})
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowQuotaConfig(false)}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Overall Statistics */}
        {isLoading ? (
          <div className="p-10 text-center">
            <RefreshCcw className="w-8 h-8 animate-spin mx-auto text-app-primary" />
            <p className="text-xs text-stone-500 mt-2 uppercase tracking-widest">Loading quota data...</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b border-stone-100">
              {[
                {
                  label: 'Total Professors',
                  value: getOverallStats().totalProfessors,
                  icon: Users,
                  color: 'text-app-fg',
                },
                {
                  label: 'Total Assignments',
                  value: getOverallStats().totalAssignments,
                  icon: Target,
                  color: 'text-app-primary',
                },
                {
                  label: 'Professors at Quota',
                  value: getOverallStats().professorsAtQuota,
                  icon: ShieldAlert,
                  color: getOverallStats().professorsAtQuota > 0 ? 'text-red-500' : 'text-green-500',
                },
                {
                  label: 'Allocation Rate',
                  value: getOverallStats().allocationRate,
                  icon: BarChart3,
                  color: 'text-app-fg',
                },
              ].map((stat, i) => (
                <div key={i} className="p-6 border-r border-stone-100 last:border-r-0">
                  <div className="flex items-center gap-3">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-black text-app-fg">{stat.value}</p>
                      <p className="text-[9px] text-stone-500 uppercase tracking-widest mt-1">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Professor List with Quota Status */}
            <div className="p-0">
              <div className="px-6 py-4 bg-stone-50 border-b border-stone-100 flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Professor Guard Status
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Max: {configMaxGuards} Guards
                </span>
              </div>
              
              {professors.length === 0 ? (
                <div className="p-10 text-center text-stone-500">
                  <p className="text-xs uppercase tracking-widest">No professors found</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-50">
                  {professors.map((prof) => {
                    const stats = getProfessorStats(prof.id);
                    return (
                      <div key={prof.id} className="p-0">
                        <div 
                          className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-stone-50 transition-colors"
                          onClick={() => setExpandedProfessor(expandedProfessor === prof.id ? null : prof.id)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black uppercase tracking-widest text-app-fg">
                                  {prof.name}
                                </span>
                                {stats.isQuotaFull && (
                                  <span className="text-[8px] font-black px-2 py-0.5 bg-red-100 text-red-600 uppercase tracking-widest border border-red-200">
                                    Quota Full
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-[9px] text-stone-500 uppercase tracking-widest">
                                  {prof.department || 'Unknown'}
                                </span>
                                <span className="text-[9px] text-stone-400">|</span>
                                {editingProfessorId === prof.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      value={tempMaxGuards}
                                      onChange={(e) => setTempMaxGuards(Math.max(1, parseInt(e.target.value) || 1))}
                                      min={1}
                                      max={20}
                                      className="w-16 px-2 py-1 border border-stone-200 text-[9px] font-bold text-center"
                                    />
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleSaveProfessorGuards(prof.id); }}
                                      className="text-[8px] font-bold uppercase tracking-widest text-green-600 hover:text-green-800"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleCancelProfessorGuards(); }}
                                      className="text-[8px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-700"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span 
                                      className={`text-[9px] font-bold uppercase tracking-widest ${stats.isQuotaFull ? 'text-red-500' : 'text-green-600'}`}
                                      onClick={(e) => { e.stopPropagation(); handleEditProfessorGuards(prof.id, stats.maxGuards); }}
                                      title="Click to edit max guards"
                                      style={{ cursor: 'pointer' }}
                                    >
                                      {stats.totalGuards}/{stats.maxGuards} Guards
                                    </span>
                                    {stats.quotaRemaining > 0 && !stats.isQuotaFull && (
                                      <span className="text-[8px] font-bold px-2 py-0.5 bg-green-100 text-green-700 uppercase tracking-widest border border-green-200">
                                        +{stats.quotaRemaining} Available
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {stats.isQuotaFull ? (
                              <ShieldAlert className="w-4 h-4 text-red-500" />
                            ) : stats.totalGuards > 0 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Target className="w-4 h-4 text-stone-400" />
                            )}
                            {expandedProfessor === prof.id ? (
                              <ChevronUp className="w-4 h-4 text-stone-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-stone-400" />
                            )}
                          </div>
                        </div>
                        
                        {/* Expanded details */}
                        {expandedProfessor === prof.id && (
                          <div className="px-6 pb-4 bg-stone-50/50">
                            {stats.modules.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2">
                                  Associated Modules ({stats.modules.length})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {stats.modules.map(module => (
                                    <span 
                                      key={module.id}
                                      className="text-[9px] font-bold px-3 py-1 bg-white border border-stone-200 uppercase tracking-widest"
                                    >
                                      {module.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {stats.assignedExams.length > 0 ? (
                              <div>
                                <h5 className="text-[9px] font-black uppercase tracking-widest text-stone-500 mb-2">
                                  Assigned Exams ({stats.assignedExams.length})
                                </h5>
                                <div className="space-y-2">
                                  {stats.assignedExams.map(exam => {
                                    const assignment = stats.assignments.find(a => a.exam_id === exam.id);
                                    return (
                                      <div 
                                        key={exam.id} 
                                        className="flex items-center justify-between p-3 bg-white border border-stone-100"
                                      >
                                        <div>
                                          <p className="text-[10px] font-black uppercase tracking-widest text-app-fg">
                                            {exam.module}
                                          </p>
                                          <p className="text-[9px] text-stone-500 mt-1">
                                            {exam.date} | {exam.time || `${exam.start_time} - ${exam.end_time}`} | {exam.salle?.name || exam.room}
                                          </p>
                                        </div>
                                        <span className={`text-[8px] font-black px-2 py-1 uppercase tracking-widest border ${exam.exam_type === 'RATTRAPAGE' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                                          {exam.exam_type}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-[9px] text-stone-500 uppercase tracking-widest">
                                  No exams assigned yet
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-white border border-app-border p-10">
        <h3 className="text-sm font-black mb-10 text-app-fg uppercase tracking-widest flex items-center gap-3">
          <div className="w-1 h-4 bg-app-primary"></div>
          Allocation Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-stone-100">
          {steps.map((step, index) => {
            const isCompleted = activeStep > index + 1 || status === "completed";
            const isActive = activeStep === index + 1 || (status === "running" && activeStep === index);
            
            return (
              <div key={step.id} className={cn(
                "p-6 border-r border-stone-100 last:border-r-0 transition-colors",
                isActive ? "bg-stone-50" : "bg-white"
              )}>
                <div className="flex flex-col gap-4">
                  <div className={cn(
                    "w-8 h-8 flex items-center justify-center font-black text-xs transition-all duration-500",
                    isCompleted ? "bg-app-primary text-white" :
                    isActive ? "bg-app-fg text-white animate-pulse" :
                    "bg-stone-100 text-stone-400"
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                  </div>
                  <div>
                    <h4 className={cn(
                      "font-black text-[10px] uppercase tracking-widest",
                      isActive || isCompleted ? "text-app-fg" : "text-stone-400"
                    )}>{step.name}</h4>
                    <p className="text-[9px] text-stone-400 mt-1 uppercase font-bold">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {status === "completed" && (
        <div className="animate-in slide-in-from-bottom-4 duration-500 bg-stone-900 text-white p-10 flex items-start gap-8">
          <div className="w-16 h-16 bg-red-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <h3 className="text-xl font-black uppercase tracking-tighter">Exceptions Detected</h3>
              <span className="text-[10px] font-black bg-red-600 px-3 py-1 tracking-widest">2 CRITICAL ISSUES</span>
            </div>
            <p className="text-stone-400 mt-4 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
              Manual intervention required for the following modules due to quota exhaustion:
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-800 p-6 flex justify-between items-center border-l-4 border-red-600">
                <div>
                  <p className="font-black text-xs uppercase tracking-widest">Machine Learning</p>
                  <p className="text-[9px] text-stone-500 mt-1 uppercase font-bold tracking-widest">Room B12 • May 15</p>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white transition-colors">Resolve</button>
              </div>
              <div className="bg-stone-800 p-6 flex justify-between items-center border-l-4 border-red-600">
                <div>
                  <p className="font-black text-xs uppercase tracking-widest">Distributed Systems</p>
                  <p className="text-[9px] text-stone-500 mt-1 uppercase font-bold tracking-widest">Room A04 • May 18</p>
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white transition-colors">Resolve</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
