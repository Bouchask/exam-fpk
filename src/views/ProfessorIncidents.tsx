import React from "react";
import { DataTable } from "../components/ui/DataTable";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "../utils/cn";

const incidentData = [
  { id: 1, type: "SCHEDULE CONFLICT", date: "MAY 10, 2026", exam: "MACHINE LEARNING", status: "UNDER REVIEW" },
  { id: 2, type: "ROOM Mismatch", date: "JAN 12, 2026", exam: "DATABASE MGMT", status: "RESOLVED" },
];

export const ProfessorIncidents = () => {
  const columns = [
    { header: "INCIDENT TYPE", accessor: "type" as const, className: "font-black tracking-tight" },
    { header: "REPORTED ON", accessor: "date" as const },
    { header: "RELATED EXAM", accessor: "exam" as const, className: "text-[10px] font-bold" },
    { 
      header: "STATUS", 
      accessor: (item: typeof incidentData[0]) => (
        <span className={cn(
          "text-[8px] font-black px-3 py-1 uppercase tracking-widest",
          item.status === 'UNDER REVIEW' ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-400 border border-stone-200"
        )}>
          {item.status}
        </span>
      ) 
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="border-l-8 border-red-600 pl-6 py-2">
        <h1 className="text-3xl font-black tracking-tighter text-app-fg uppercase">Incident Logs</h1>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] mt-2">Administrative Exception Tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-stone-900 p-8 flex items-center gap-6">
            <div className="w-14 h-14 bg-red-600 flex items-center justify-center shrink-0">
               <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Active Exceptions</p>
               <p className="text-2xl font-black text-white">01 PENDING</p>
            </div>
         </div>
         <div className="bg-white border border-stone-200 p-8 flex items-center gap-6">
            <div className="w-14 h-14 bg-stone-100 flex items-center justify-center shrink-0">
               <Clock className="w-8 h-8 text-stone-400" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-stone-400 tracking-widest">Avg. Response Time</p>
               <p className="text-2xl font-black text-app-fg uppercase">24 Hours</p>
            </div>
         </div>
      </div>

      <DataTable columns={columns} data={incidentData} />
    </div>
  );
};
