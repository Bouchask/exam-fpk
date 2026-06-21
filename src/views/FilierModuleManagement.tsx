import { useState, useEffect, useCallback } from "react";
import { Plus, MoreVertical, Save, RefreshCcw, Edit, BookOpen, Layers } from "lucide-react";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { cn } from "../utils/cn";
import { filierService, moduleService, departmentService } from "../services";
import type { Filier, Module, Department } from "../types";

export const FilierModuleManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState<"filieres" | "modules">("filieres");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [filierForm, setFilierForm] = useState({
    name: '',
    code: '',
    department_id: 0,
    max_modules: 7,
    description: '',
    is_active: true,
  });
  const [moduleForm, setModuleForm] = useState({
    name: '',
    code: '',
    filier_id: 0,
    credits: 3,
    hours: 45,
    description: '',
    is_active: true,
  });

  // Data state
  const [filieres, setFilieres] = useState<Filier[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFilier, setSelectedFilier] = useState<Filier | null>(null);

  // Fetch data
  const fetchFilieres = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await filierService.getAll(1, 50);
      if (response.success && response.data) {
        setFilieres(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch filieres:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchModules = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await moduleService.getAll(1, 50);
      if (response.success && response.data) {
        setModules(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch modules:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await departmentService.getAll(1, 50);
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFilieres();
    fetchModules();
    fetchDepartments();
  }, [fetchFilieres, fetchModules, fetchDepartments]);

  // Form handlers
  const handleFilierSubmit = async () => {
    if (!filierForm.name.trim()) {
      setError('Please enter a filier name');
      return;
    }
    if (!filierForm.department_id) {
      setError('Please select a department');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await filierService.create({
        name: filierForm.name,
        code: filierForm.code,
        department_id: filierForm.department_id,
        max_modules: filierForm.max_modules,
        description: filierForm.description,
        is_active: filierForm.is_active,
      });

      if (response.success) {
        setSuccess('Filier created successfully!');
        setFilierForm({ name: '', code: '', department_id: 0, max_modules: 7, description: '', is_active: true });
        setIsModalOpen(false);
        fetchFilieres();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create filier');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModuleSubmit = async () => {
    if (!moduleForm.name.trim()) {
      setError('Please enter a module name');
      return;
    }
    if (!moduleForm.filier_id) {
      setError('Please select a filier');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check if filier has reached max modules
      const filier = filieres.find(f => f.id === moduleForm.filier_id);
      if (filier) {
        const moduleCount = modules.filter(m => m.filier_id === moduleForm.filier_id).length;
        if (moduleCount >= (filier.max_modules || 7)) {
          setError(`Filier has reached maximum of ${filier.max_modules || 7} modules`);
          setIsLoading(false);
          return;
        }
      }

      const response = await moduleService.create({
        name: moduleForm.name,
        code: moduleForm.code,
        filier_id: moduleForm.filier_id,
        credits: moduleForm.credits,
        hours: moduleForm.hours,
        description: moduleForm.description,
        is_active: moduleForm.is_active,
      });

      if (response.success) {
        setSuccess('Module created successfully!');
        setModuleForm({ name: '', code: '', filier_id: 0, credits: 3, hours: 45, description: '', is_active: true });
        setIsModalOpen(false);
        fetchModules();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create module');
    } finally {
      setIsLoading(false);
    }
  };

  // DataTable columns
  const filierColumns = [
    { header: "NAME", accessor: "name" as const, className: "font-black tracking-tight" },
    { header: "CODE", accessor: "code" as const, className: "text-[10px] font-bold" },
    { 
      header: "DEPARTMENT", 
      accessor: (f: Filier) => f.department_name || 'N/A',
      className: "text-[10px] font-bold"
    },
    { 
      header: "MODULES", 
      accessor: (f: Filier) => <span className="font-bold text-app-primary">{f.module_count || 0}/{(f.max_modules || 7)}</span>,
      className: "text-center"
    },
    { 
      header: "STATUS", 
      accessor: (f: Filier) => f.is_active ? <span className="text-[9px] font-black px-2 py-1 bg-green-100 text-green-800 uppercase">ACTIVE</span> : <span className="text-[9px] font-black px-2 py-1 bg-stone-100 text-stone-500 uppercase">INACTIVE</span>,
      className: "text-center"
    },
    { 
      header: "ACTION", 
      accessor: (f: Filier) => (
        <div className="flex gap-2 justify-end">
          <button 
            onClick={(e) => { e.stopPropagation(); handleEditFilier(f); }}
            className="p-1 text-stone-500 hover:text-app-primary transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedFilier(f); setActiveSubTab('modules'); }}
            className="p-1 text-stone-500 hover:text-app-primary transition-colors"
            title="View Modules"
          >
            <BookOpen className="w-4 h-4" />
          </button>
        </div>
      ), 
      className: "text-right w-20"
    }
  ];

  const moduleColumns = [
    { header: "NAME", accessor: "name" as const, className: "font-black tracking-tight" },
    { header: "CODE", accessor: "code" as const, className: "text-[10px] font-bold" },
    { 
      header: "FILIER", 
      accessor: (m: Module) => m.filier_name || 'N/A',
      className: "text-[10px] font-bold"
    },
    { 
      header: "CREDITS", 
      accessor: (m: Module) => <span className="font-bold text-app-primary">{m.credits || 3}</span>,
      className: "text-center"
    },
    { 
      header: "HOURS", 
      accessor: (m: Module) => <span className="font-bold">{m.hours || 45}</span>,
      className: "text-center"
    },
    { 
      header: "STATUS", 
      accessor: (m: Module) => m.is_active ? <span className="text-[9px] font-black px-2 py-1 bg-green-100 text-green-800 uppercase">ACTIVE</span> : <span className="text-[9px] font-black px-2 py-1 bg-stone-100 text-stone-500 uppercase">INACTIVE</span>,
      className: "text-center"
    },
    { 
      header: "ACTION", 
      accessor: () => <button className="p-1 hover:text-app-primary"><MoreVertical className="w-4 h-4" /></button>, 
      className: "text-right w-12"
    }
  ];

  // Edit handler
  const handleEditFilier = (filier: Filier) => {
    setFilierForm({
      name: filier.name,
      code: filier.code || '',
      department_id: filier.department_id || 0,
      max_modules: filier.max_modules || 7,
      description: filier.description || '',
      is_active: filier.is_active || true,
    });
    setIsModalOpen(true);
  };

  // Filter modules by filier
  const filteredModules = selectedFilier ? modules.filter(m => m.filier_id === selectedFilier.id) : modules;

  // Render forms
  const renderForm = () => {
    if (activeSubTab === 'filieres') {
      return (
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleFilierSubmit(); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Filier Name *</label>
              <input 
                type="text" 
                value={filierForm.name}
                onChange={(e) => setFilierForm({...filierForm, name: e.target.value})}
                placeholder="E.G. COMPUTER SCIENCE"
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Code</label>
              <input 
                type="text" 
                value={filierForm.code}
                onChange={(e) => setFilierForm({...filierForm, code: e.target.value})}
                placeholder="E.G. CS"
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Department *</label>
            <select 
              value={filierForm.department_id}
              onChange={(e) => setFilierForm({...filierForm, department_id: parseInt(e.target.value)})}
              className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
              required
            >
              <option value="0">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Max Modules</label>
              <input 
                type="number" 
                value={filierForm.max_modules}
                onChange={(e) => setFilierForm({...filierForm, max_modules: parseInt(e.target.value) || 7})}
                min="1"
                max="20"
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Active</label>
              <select 
                value={filierForm.is_active ? 'true' : 'false'}
                onChange={(e) => setFilierForm({...filierForm, is_active: e.target.value === 'true'})}
                className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Description</label>
            <textarea 
              value={filierForm.description}
              onChange={(e) => setFilierForm({...filierForm, description: e.target.value})}
              placeholder="Brief description of the field of study..."
              rows={3}
              className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all resize-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-app-fg text-white py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-app-primary transition-all disabled:opacity-50"
          >
            {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> SAVE FILIER</>}
          </button>
        </form>
      );
    }
    
    // Module form
    return (
      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleModuleSubmit(); }}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Module Name *</label>
            <input 
              type="text" 
              value={moduleForm.name}
              onChange={(e) => setModuleForm({...moduleForm, name: e.target.value})}
              placeholder="E.G. PROGRAMMING"
              className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Code</label>
            <input 
              type="text" 
              value={moduleForm.code}
              onChange={(e) => setModuleForm({...moduleForm, code: e.target.value})}
              placeholder="E.G. PROG101"
              className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Filier *</label>
          <select 
            value={moduleForm.filier_id}
            onChange={(e) => setModuleForm({...moduleForm, filier_id: parseInt(e.target.value)})}
            className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
            required
          >
            <option value="0">Select Filier</option>
            {filieres.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.module_count || 0}/{(f.max_modules || 7)} modules)</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Credits</label>
            <input 
              type="number" 
              value={moduleForm.credits}
              onChange={(e) => setModuleForm({...moduleForm, credits: parseInt(e.target.value) || 3})}
              min="1"
              max="10"
              className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Hours</label>
            <input 
              type="number" 
              value={moduleForm.hours}
              onChange={(e) => setModuleForm({...moduleForm, hours: parseInt(e.target.value) || 45})}
              min="15"
              max="200"
              className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Description</label>
          <textarea 
            value={moduleForm.description}
            onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
            placeholder="Brief description of the module..."
            rows={3}
            className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all resize-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Active</label>
          <select 
            value={moduleForm.is_active ? 'true' : 'false'}
            onChange={(e) => setModuleForm({...moduleForm, is_active: e.target.value === 'true'})}
            className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-app-fg text-white py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-app-primary transition-all disabled:opacity-50"
        >
          {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> SAVE MODULE</>}
        </button>
      </form>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-stone-100 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-app-fg uppercase">Filier & Module Management</h1>
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em] mt-2 italic">Organize academic structure</p>
        </div>
        <button 
          onClick={() => {
            setActiveSubTab(activeSubTab === 'filieres' ? 'filieres' : 'modules');
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-3 bg-app-primary text-white px-8 py-4 rounded-none font-black uppercase tracking-[0.2em] text-xs hover:bg-app-fg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add {activeSubTab === 'filieres' ? 'Filier' : 'Module'}
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-stone-100 p-1 rounded-none border border-stone-200 w-fit">
        {(['filieres', 'modules'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveSubTab(tab);
              if (tab === 'filieres') {
                setSelectedFilier(null);
              }
            }}
            className={cn(
              "px-6 py-3 rounded-none text-[10px] font-black uppercase tracking-[0.15em] transition-all",
              activeSubTab === tab ? "bg-white text-app-fg border border-stone-200" : "text-stone-400 hover:text-app-fg"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Filieres Tab */}
      {activeSubTab === 'filieres' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          {selectedFilier ? (
            <div>
              <button 
                onClick={() => setSelectedFilier(null)}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-app-primary hover:text-app-fg mb-4"
              >
                <Layers className="w-4 h-4" /> BACK TO ALL FILIERES
              </button>
              <div className="bg-white border border-stone-200 p-8">
                <h2 className="text-lg font-black tracking-tight text-app-fg uppercase mb-6">{selectedFilier.name} Modules ({filteredModules.length}/{(selectedFilier.max_modules || 7)})</h2>
                <DataTable columns={moduleColumns} data={filteredModules} emptyMessage="No modules found for this filier." />
              </div>
            </div>
          ) : (
            <DataTable columns={filierColumns} data={filieres} emptyMessage="No filieres found. Create one to get started." />
          )}
        </div>
      )}

      {/* Modules Tab */}
      {activeSubTab === 'modules' && !selectedFilier && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <DataTable columns={moduleColumns} data={modules} emptyMessage="No modules found. Create one to get started." />
        </div>
      )}

      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
          setSuccess(null);
        }}
        title={`Add ${activeSubTab === 'filieres' ? 'Filier' : 'Module'}`}
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

export default FilierModuleManagement;
