import { DataTable } from "../components/ui/DataTable";
import { Download, FileText } from "lucide-react";

const historyData = [
  { id: 1, module: "DATABASE MANAGEMENT", date: "JAN 12, 2026", time: "09:00 - 11:00", room: "SALLE B12", type: "FINAL" },
  { id: 2, module: "WEB TECHNOLOGIES", date: "JAN 15, 2026", time: "14:00 - 16:00", room: "AMPHI A", type: "FINAL" },
  { id: 3, module: "OPERATING SYSTEMS", date: "DEC 20, 2025", time: "09:00 - 11:00", room: "LAB 201", type: "MIDTERM" },
];

export const ProfessorHistory = () => {
  const columns = [
    { header: "MODULE", accessor: "module" as const, className: "font-black tracking-tight" },
    { header: "DATE", accessor: "date" as const },
    { header: "TYPE", accessor: (item: typeof historyData[0]) => <span className="text-[9px] font-black border border-stone-200 px-2 py-1 bg-stone-50 uppercase">{item.type}</span> },
    { header: "ROOM", accessor: "room" as const },
    { 
      header: "REPORT", 
      accessor: () => (
        <button className="flex items-center gap-2 text-[10px] font-black text-app-primary hover:underline">
          <Download className="w-3 h-3" /> PDF
        </button>
      ) 
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="border-l-8 border-app-primary pl-6 py-2">
        <h1 className="text-3xl font-black tracking-tighter text-app-fg uppercase">Assignment History</h1>
        <p className="text-xs font-bold text-stone-500 uppercase tracking-[0.2em] mt-2">Historical Duty Archive • 2025-2026</p>
      </div>

      <div className="bg-stone-50 border border-stone-200 p-8 flex justify-between items-center">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-app-fg text-white flex items-center justify-center">
               <FileText className="w-6 h-6" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-stone-400">Total Duties Recorded</p>
               <p className="text-xl font-black text-app-fg">12 SESSIONS</p>
            </div>
         </div>
         <button className="bg-app-fg text-white px-8 py-3 font-black uppercase tracking-widest text-[10px] hover:bg-app-primary transition-all">
            EXPORT FULL TRANSCRIPT
         </button>
      </div>

      <DataTable columns={columns} data={historyData} />
    </div>
  );
};
