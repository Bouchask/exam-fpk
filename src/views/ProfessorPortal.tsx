import React, { useState } from "react";
import { Calendar, Clock, MapPin, BookOpen, GraduationCap, CheckCircle, Bell, ArrowRight, Download, History, Settings, Save, AlertCircle, FileSignature } from "lucide-react";
import { cn } from "../utils/cn";
import { Modal } from "../components/ui/Modal";

const personalExams = [
  { id: 1, module: "MACHINE LEARNING", date: "MAY 15, 2026", time: "09:00 - 11:00", room: "SALLE B12", status: "CONFIRMED" },
  { id: 2, module: "NEURAL NETWORKS", date: "MAY 20, 2026", time: "14:00 - 16:00", room: "AMPHI C", status: "PENDING" },
  { id: 3, module: "ALGORITHMS", date: "MAY 22, 2026", time: "09:00 - 11:00", room: "LAB 104", status: "CONFIRMED" },
];

export const ProfessorPortal = () => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<typeof personalExams[0] | null>(null);

  const completedGuards = 2;
  const totalQuota = 4;

  const handleOpenIncident = (exam: typeof personalExams[0]) => {
    setSelectedExam(exam);
    setIsIncidentModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-6 animate-in fade-in duration-500">
      {/* Institutional Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-4 border-app-fg pb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <span className="bg-app-primary text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest">Faculty Member</span>
             <span className="text-stone-300 text-[10px] font-black uppercase tracking-widest">S2-2026 SESSION</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-app-fg uppercase leading-none">DR. SARAH CONNOR</h1>
          <p className="text-xs font-bold text-stone-500 mt-4 uppercase tracking-[0.3em]">Department of Computer Science • Institutional Grade: PR</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsProfileModalOpen(true)}
             className="bg-stone-100 p-4 border border-stone-200 hover:bg-stone-200 transition-colors group"
             title="Profile Settings"
           >
              <Settings className="w-5 h-5 text-app-fg group-hover:rotate-90 transition-transform" />
           </button>
           <div className="h-16 w-16 bg-app-fg text-white flex items-center justify-center font-black text-xl">
             SC
           </div>
        </div>
      </div>

      {/* KPI Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-stone-200">
        <div className="p-10 bg-white border-r border-stone-200">
           <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Current Quota</p>
           <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-app-fg leading-none">02</span>
              <span className="text-xl font-black text-stone-300 leading-none">/ 04</span>
           </div>
           <div className="mt-8 h-2 w-full bg-stone-100 rounded-none overflow-hidden">
              <div className="h-full bg-app-primary transition-all duration-1000" style={{ width: '50%' }} />
           </div>
        </div>
        <div className="p-10 bg-white border-r border-stone-200">
           <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Next Duty</p>
           <h3 className="text-xl font-black text-app-fg uppercase tracking-tight">MAY 15, 2026</h3>
           <p className="text-[10px] font-bold text-app-primary uppercase mt-2">Machine Learning • Room B12</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Schedule Column */}
        <div className="lg:col-span-2 space-y-8">
           <h3 className="text-sm font-black flex items-center gap-4 text-app-fg uppercase tracking-[0.2em]">
             <div className="w-2 h-6 bg-app-primary"></div>
             Active Assignments
           </h3>

           <div className="space-y-0 border border-stone-200">
             {personalExams.map((exam) => (
               <div key={exam.id} className="group bg-white border-b border-stone-100 last:border-b-0 p-8 hover:bg-stone-50 transition-colors duration-150">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                       <div className="w-16 h-16 bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 group-hover:bg-app-fg group-hover:text-white transition-all">
                          <BookOpen className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="font-black text-lg text-app-fg uppercase tracking-tight leading-tight">{exam.module}</h4>
                          <div className="flex flex-wrap items-center gap-6 mt-3">
                             <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                <Clock className="w-3.5 h-3.5 text-app-primary" />
                                {exam.time}
                             </div>
                             <div className="flex items-center gap-2 text-[10px] font-black text-stone-400 uppercase tracking-widest">
                                <MapPin className="w-3.5 h-3.5 text-app-primary" />
                                {exam.room}
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-10 md:border-l border-stone-200 md:pl-10">
                       <div className="text-left md:text-right">
                          <p className="text-xs font-black text-app-fg uppercase tracking-widest">{exam.date}</p>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 mt-1 inline-block tracking-widest",
                            exam.status === 'CONFIRMED' ? "bg-stone-900 text-white" : "border border-stone-200 text-stone-400"
                          )}>{exam.status}</span>
                       </div>
                       <button 
                         onClick={() => handleOpenIncident(exam)}
                         className="px-6 py-3 border-2 border-app-fg text-app-fg font-black uppercase tracking-widest text-[10px] hover:bg-app-fg hover:text-white transition-all"
                       >
                          LOGS
                       </button>
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>

        {/* Sidebar Utilities */}
        <div className="space-y-10">
           {/* Bulletin Board */}
           <div className="bg-app-fg p-10 text-white">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-8 border-b border-stone-800 pb-4">Faculty Bulletins</h4>
              <div className="space-y-8">
                 <div className="space-y-3">
                    <p className="text-[10px] font-black text-app-primary uppercase tracking-widest">May 11, 2026</p>
                    <p className="text-xs font-bold leading-relaxed text-stone-300">New invigilation guidelines for Final Exams published. Please review the updated protocol.</p>
                    <button className="flex items-center gap-2 text-[9px] font-black text-white hover:text-app-primary transition-colors uppercase tracking-widest">Read More <ArrowRight className="w-3 h-3" /></button>
                 </div>
              </div>
           </div>

           {/* Quick Actions */}
           <div className="space-y-4">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6">Service Portal</h4>
              <button className="w-full flex items-center justify-between p-6 bg-white border border-stone-200 hover:border-app-primary transition-all group">
                 <div className="flex items-center gap-4">
                    <Download className="w-5 h-5 text-stone-400 group-hover:text-app-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Download Official PDF</span>
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
                 <input type="text" defaultValue="DR. SARAH CONNOR" className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all" />
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
                    <select className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all">
                       <option>COMPUTER SCIENCE</option>
                       <option>MATHEMATICS</option>
                       <option>PHYSICS</option>
                    </select>
                 </div>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Institutional Email</label>
                 <input type="email" defaultValue="s.connor@fpk.ac.ma" className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold focus:outline-none focus:border-app-primary transition-all" />
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
              <Save className="w-4 h-4" /> UPDATE CREDENTIALS
           </button>
        </form>
      </Modal>

      {/* Incident / Swap Request Modal */}
      <Modal isOpen={isIncidentModalOpen} onClose={() => setIsIncidentModalOpen(false)} title="Duty Report / Incident Log">
        <form className="space-y-6">
           {selectedExam && (
             <div className="p-4 bg-stone-900 text-white mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-app-primary">Active Context</p>
                <p className="text-xs font-bold uppercase tracking-tight">{selectedExam.module} • {selectedExam.room}</p>
             </div>
           )}
           <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Reporting Category</label>
              <select className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all">
                 <option>SCHEDULE CONFLICT</option>
                 <option>ROOM UNAVAILABILITY</option>
                 <option>EMERGENCY LEAVE</option>
                 <option>OTHER INCIDENT</option>
              </select>
           </div>
           <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Formal Explanation</label>
              <textarea rows={4} placeholder="PROVIDE DETAILED LOG FOR SCOLARITÉ REVIEW..." className="w-full bg-stone-50 border border-stone-200 p-4 text-xs font-bold uppercase focus:outline-none focus:border-app-primary transition-all resize-none" />
           </div>
           <div className="p-4 bg-stone-100 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-app-primary shrink-0" />
              <p className="text-[9px] font-bold text-stone-500 uppercase leading-relaxed">
                 Reporting an incident triggers a manual review by the administration. You will be notified once a decision is reached.
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
