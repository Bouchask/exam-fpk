import React, { useState } from "react";
import { 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCcw, 
  ArrowRight,
  ShieldAlert,
  Info
} from "lucide-react";
import { cn } from "../utils/cn";

const steps = [
  { id: 1, name: "Dept Filtering", description: "Matching professors with their departments" },
  { id: 2, name: "Quota Validation", description: "Checking semester limit (max 4)" },
  { id: 3, name: "Conflict Resolution", description: "Solving time & room overlaps" },
  { id: 4, name: "Final Allocation", description: "Generating schedule records" },
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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Assignment Engine</h1>
        <p className="text-slate-400">Automate invigilation (Garde) schedules based on departmental alignment and quotas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trigger Card */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Cpu className="w-3 h-3" />
              Algorithm v2.4
            </div>
            <h2 className="text-2xl font-semibold">Run Random Allocation</h2>
            <p className="text-slate-400 leading-relaxed">
              This process will analyze all scheduled exams for the Semester 2, 2026, 
              and assign eligible professors while strictly respecting the maximum 4-guards quota 
              and departmental expertise rules.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <button 
              onClick={startAssignment}
              disabled={status === "running"}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {status === "running" ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {status === "running" ? "Processing..." : "Trigger Assignment"}
            </button>
            <button className="flex items-center gap-2 border border-border px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
              Simulation Mode
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="bg-slate-900/50 border border-border rounded-2xl p-6 space-y-6">
          <h3 className="font-semibold text-slate-300">Engine Parameters</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Pending Exams</span>
              <span className="font-mono text-primary">124</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Available Staff</span>
              <span className="font-mono text-primary">48</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Target Semester</span>
              <span className="font-medium">S2-2026</span>
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 text-blue-400 text-xs">
              <Info className="w-4 h-4 shrink-0" />
              <p>Assignments are randomized each run to ensure fairness across all departments.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="bg-card border border-border rounded-2xl p-8">
        <h3 className="text-lg font-semibold mb-8">Allocation Phases</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => {
            const isCompleted = activeStep > index + 1 || status === "completed";
            const isActive = activeStep === index + 1 || (status === "running" && activeStep === index);
            
            return (
              <div key={step.id} className="relative z-10">
                <div className="flex flex-col gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                    isCompleted ? "bg-primary border-primary text-primary-foreground" :
                    isActive ? "border-primary text-primary animate-pulse" :
                    "border-border text-slate-600"
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : step.id}
                  </div>
                  <div>
                    <h4 className={cn(
                      "font-semibold text-sm",
                      isActive || isCompleted ? "text-slate-100" : "text-slate-500"
                    )}>{step.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflict Resolution Warning */}
      {status === "completed" && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 flex items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-orange-400">Conflict Resolution Required</h3>
              <span className="text-xs font-bold bg-orange-500/20 text-orange-500 px-2 py-1 rounded">2 Issues</span>
            </div>
            <p className="text-slate-400 mt-1 text-sm">
              The algorithm couldn't find enough eligible professors for the following exams due to department mismatches:
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-border p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Machine Learning Final</p>
                  <p className="text-xs text-slate-500">May 15 - Salle B12</p>
                </div>
                <button className="text-xs font-bold text-primary hover:underline">Manual Fix</button>
              </div>
              <div className="bg-slate-900 border border-border p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">Distributed Systems</p>
                  <p className="text-xs text-slate-500">May 18 - Salle A04</p>
                </div>
                <button className="text-xs font-bold text-primary hover:underline">Manual Fix</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add missing Cpu import at top
import { Cpu } from "lucide-react";
