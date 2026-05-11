import { useState, useEffect } from "react";
import { Plus, Users, Calendar, DoorOpen, Target, Layers, MoreVertical, Save } from "lucide-react";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { cn } from "../utils/cn";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const professors = [
  { id: 1, name: "DR. SARAH CONNOR", dept: "COMPUTER SCIENCE", guards: 1 },
  { id: 2, name: "PR. JOHN DOE", dept: "MATHEMATICS", guards: 3 },
  { id: 3, name: "DR. ELENA GILBERT", dept: "PHYSICS", guards: 4 },
  { id: 4, name: "PR. MARCUS AURELIUS", dept: "PHILOSOPHY", guards: 0 },
  { id: 5, name: "DR. ALAN TURING", dept: "COMPUTER SCIENCE", guards: 2 },
];

const exams = [
  { id: 1, module: "LINEAR ALGEBRA", date: "2026-05-12", time: "09:00", type: "FINAL", room: "AMPHI A" },
  { id: 2, module: "DATA STRUCTURES", date: "2026-05-12", time: "14:00", type: "MIDTERM", room: "LAB 201" },
  { id: 3, module: "QUANTUM PHYSICS", date: "2026-05-13", time: "10:00", type: "FINAL", room: "AMPHI B" },
];

const departments = [
  { id: 1, name: "COMPUTER SCIENCE", head: "DR. ALAN TURING", staff: 18 },
  { id: 2, name: "MATHEMATICS", head: "PR. JOHN DOE", staff: 12 },
  { id: 3, name: "PHYSICS", head: "DR. ELENA GILBERT", staff: 10 },
  { id: 4, name: "PHILOSOPHY", head: "PR. MARCUS AURELIUS", staff: 8 },
];

const quotaData = [
  { name: '0 Guards', value: 12, color: '#d7ccc8' },
  { name: '1-2 Guards', value: 25, color: '#8d6e63' },
  { name: '3 Guards', value: 8, color: '#4e342e' },
  { name: 'Maxed (4)', value: 3, color: '#1a1210' },
];

const deptData = [
  { name: 'CS', value: 45, color: '#4e342e' },
  { name: 'MATH', value: 25, color: '#1a1210' },
  { name: 'PHYSICS', value: 20, color: '#8d6e63' },
  { name: 'OTHERS', value: 10, color: '#d7ccc8' },
];

interface AdminDashboardProps {
  forcedTab?: "overview" | "professors" | "exams" | "salles" | "departments";
}

export const AdminDashboard = ({ forcedTab }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<"overview" | "professors" | "exams" | "salles" | "departments">(forcedTab || "overview");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (forcedTab) setActiveTab(forcedTab);
  }, [forcedTab]);

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

  const renderForm = () => {
    switch (activeTab) {
      case "professors":
        return (
          <form className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Full Academic Name</label>
              <input type="text" placeholder="E.G. DR. ALAN TURING" className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Assigned Department</label>
              <select className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all">
                <option>COMPUTER SCIENCE</option>
                <option>MATHEMATICS</option>
                <option>PHYSICS</option>
              </select>
            </div>
            <button type="button" className="w-full bg-app-fg text-white py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-app-primary transition-all">
              <Save className="w-4 h-4" /> REGISTER STAFF
            </button>
          </form>
        );
      case "exams":
        return (
          <form className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Module / Subject</label>
              <input type="text" placeholder="E.G. QUANTUM COMPUTING" className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Date</label>
                <input type="date" className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Time</label>
                <input type="time" className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Assigned Exam Room (Salle)</label>
              <select className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all">
                <option>AMPHI A</option>
                <option>AMPHI B</option>
                <option>SALLE B12</option>
                <option>LAB 201</option>
              </select>
            </div>
            <button type="button" className="w-full bg-app-fg text-white py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-app-primary transition-all">
              <Save className="w-4 h-4" /> SCHEDULE EXAM
            </button>
          </form>
        );
      default:
        return (
          <form className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Reference Name</label>
              <input type="text" placeholder="ENTER RESOURCE NAME" className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all" />
            </div>
            <button type="button" className="w-full bg-app-fg text-white py-4 font-black uppercase tracking-widest text-xs hover:bg-app-primary transition-all">
              SAVE RESOURCE
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-stone-200">
            {[
              { label: "Active Professors", value: "48", icon: Users, trend: "+2" },
              { label: "Scheduled Exams", value: "124", icon: Calendar, trend: "+12%" },
              { label: "Total Salles", value: "18", icon: DoorOpen, trend: "0" },
              { label: "Allocation Rate", value: "82%", icon: Target, trend: "STABLE" },
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border border-stone-200 p-10">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-app-fg mb-10">Staff Quota Distribution</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={quotaData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} dataKey="value" stroke="none">
                      {quotaData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1210', border: 'none', color: '#fff', fontSize: '10px', fontWeight: '900' }} />
                    <Legend verticalAlign="bottom" align="center" iconType="rect" formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-2">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-stone-200 p-10">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-app-fg mb-10">Departmental Exam Load</h4>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptData} cx="50%" cy="50%" outerRadius={120} dataKey="value" stroke="#fff" strokeWidth={2}>
                      {deptData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1210', border: 'none', color: '#fff', fontSize: '10px', fontWeight: '900' }} />
                    <Legend verticalAlign="bottom" align="center" iconType="rect" formatter={(value) => <span className="text-[10px] font-black uppercase tracking-widest text-stone-500 ml-2">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "professors" && <DataTable columns={professorColumns} data={professors} />}
      {activeTab === "exams" && <DataTable columns={examColumns} data={exams} />}
      {activeTab === "departments" && <DataTable columns={deptColumns} data={departments} />}

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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Register New ${activeTab.slice(0, -1)}`}>
        {renderForm()}
      </Modal>
    </div>
  );
};
