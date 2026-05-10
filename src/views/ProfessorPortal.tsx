import React from "react";
import { Calendar, Clock, MapPin, BookOpen, GraduationCap, CheckCircle } from "lucide-react";

const personalExams = [
  { id: 1, module: "Machine Learning", date: "May 15, 2026", time: "09:00 - 11:00", room: "Salle B12", status: "Upcoming" },
  { id: 2, module: "Neural Networks", date: "May 20, 2026", time: "14:00 - 16:00", room: "Amphi C", status: "Upcoming" },
];

export const ProfessorPortal = () => {
  const completedGuards = 2;
  const totalQuota = 4;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back, Dr. Connor</h1>
          <p className="text-slate-400">Computer Science Department • Semester 2, 2026</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-teal-500/20 border border-teal-500/50 flex items-center justify-center text-teal-500">
          <GraduationCap className="w-6 h-6" />
        </div>
      </div>

      {/* Quota Card */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-primary/5">
        <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Semester Quota Status</h2>
            <p className="text-sm text-slate-500">Track your mandatory invigilation requirements.</p>
          </div>
          <div className="text-right">
            <span className="text-4xl font-bold text-teal-400">{completedGuards}</span>
            <span className="text-xl text-slate-600 font-medium"> / {totalQuota}</span>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Guards Completed</p>
          </div>
        </div>
        <div className="p-8 bg-slate-900/30">
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 transition-all duration-1000 ease-out"
              style={{ width: `${(completedGuards / totalQuota) * 100}%` }}
            />
          </div>
          <div className="mt-6 flex items-start gap-3 text-sm text-slate-400 leading-relaxed bg-slate-900/50 p-4 rounded-xl border border-border">
            <CheckCircle className="w-5 h-5 text-teal-500 shrink-0" />
            <p>You have completed <span className="text-slate-200 font-bold">50%</span> of your mandatory guards for this semester. Great job maintaining departmental balance!</p>
          </div>
        </div>
      </div>

      {/* Timeline / Schedule */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Upcoming Invigilations
        </h3>

        <div className="space-y-4">
          {personalExams.map((exam) => (
            <div 
              key={exam.id}
              className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-default"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-border flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-slate-100">{exam.module}</h4>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {exam.time}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {exam.room}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-200">{exam.date}</p>
                    <p className="text-xs text-slate-500 font-medium">Invigilation Role</p>
                  </div>
                  <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-bold transition-colors">
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}

          {personalExams.length === 0 && (
            <div className="py-12 text-center bg-slate-900/20 border border-dashed border-border rounded-2xl">
              <p className="text-slate-500 italic">No upcoming assignments found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
