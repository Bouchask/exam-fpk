import { useState } from "react";
import { 
  Play, 
  CheckCircle2, 
  RefreshCcw, 
  ShieldAlert,
  Info,
  Cpu,
} from "lucide-react";
import { cn } from "../utils/cn";

const steps = [
  { id: 1, name: "DEPT FILTER", description: "Departmental alignment check" },
  { id: 2, name: "QUOTA VALID", description: "Semester limit validation" },
  { id: 3, name: "CONFLICT RES", description: "Room/Time overlap solving" },
  { id: 4, name: "FINAL ALLOC", description: "Record generation" },
];

export const AssignmentEngine = () => {
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [activeStep, setActiveStep] = useState(0);

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
