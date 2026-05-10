import React, { useState } from "react";
import { Plus, Search, Filter, Download, MoreVertical } from "lucide-react";
import { DataTable } from "../components/ui/DataTable";
import { cn } from "../utils/cn";

const professors = [
  { id: 1, name: "Dr. Sarah Connor", dept: "Computer Science", guards: 1 },
  { id: 2, name: "Pr. John Doe", dept: "Mathematics", guards: 3 },
  { id: 3, name: "Dr. Elena Gilbert", dept: "Physics", guards: 4 },
  { id: 4, name: "Pr. Marcus Aurelius", dept: "Philosophy", guards: 0 },
  { id: 5, name: "Dr. Alan Turing", dept: "Computer Science", guards: 2 },
];

const exams = [
  { id: 1, module: "Linear Algebra", date: "2026-05-12", time: "09:00", type: "Final", room: "Amphi A" },
  { id: 2, module: "Data Structures", date: "2026-05-12", time: "14:00", type: "Midterm", room: "Lab 201" },
  { id: 3, module: "Quantum Physics", date: "2026-05-13", time: "10:00", type: "Final", room: "Amphi B" },
];

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<"professors" | "exams" | "salles">("professors");

  const professorColumns = [
    { header: "Name", accessor: "name" as const },
    { header: "Department", accessor: "dept" as const },
    { 
      header: "Quota Status", 
      accessor: (p: typeof professors[0]) => (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-800 rounded-full w-24 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                p.guards === 4 ? "bg-red-500" : p.guards >= 3 ? "bg-yellow-500" : "bg-teal-500"
              )}
              style={{ width: `${(p.guards / 4) * 100}%` }}
            />
          </div>
          <span className={cn(
            "text-xs font-bold px-2 py-0.5 rounded",
            p.guards === 4 ? "bg-red-500/10 text-red-500" : 
            p.guards >= 3 ? "bg-yellow-500/10 text-yellow-500" : 
            "bg-teal-500/10 text-teal-500"
          )}>
            {p.guards}/4
          </span>
        </div>
      )
    },
    {
      header: "Actions",
      accessor: () => (
        <button className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-500">
          <MoreVertical className="w-4 h-4" />
        </button>
      ),
      className: "text-right w-12"
    }
  ];

  const examColumns = [
    { header: "Module", accessor: "module" as const },
    { header: "Date", accessor: "date" as const },
    { header: "Time", accessor: "time" as const },
    { 
      header: "Type", 
      accessor: (e: typeof exams[0]) => (
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-800 border border-border">
          {e.type}
        </span>
      ) 
    },
    { header: "Room", accessor: "room" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Data Management Hub</h1>
          <p className="text-slate-400">Manage your faculty, exam schedule, and physical assets.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-bold hover:opacity-90 transition-all">
          <Plus className="w-5 h-5" />
          Add New Resource
        </button>
      </div>

      <div className="flex items-center gap-2 p-1 bg-slate-900/50 border border-border rounded-xl w-fit">
        {(["professors", "exams", "salles"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize",
              activeTab === tab 
                ? "bg-slate-800 text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder={`Search ${activeTab}...`}
            className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {activeTab === "professors" && (
        <DataTable columns={professorColumns} data={professors} />
      )}
      
      {activeTab === "exams" && (
        <DataTable columns={examColumns} data={exams} />
      )}

      {activeTab === "salles" && (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-card border border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white">No Salles Configured</h3>
          <p className="text-slate-500 mt-2 max-w-xs mx-auto">
            You haven't added any classrooms yet. Start by creating your first exam room.
          </p>
          <button className="mt-6 flex items-center gap-2 text-primary font-bold hover:underline">
            <Plus className="w-4 h-4" />
            Create First Salle
          </button>
        </div>
      )}
    </div>
  );
};
