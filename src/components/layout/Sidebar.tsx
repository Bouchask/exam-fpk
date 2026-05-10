import React from "react";
import { 
  LayoutDashboard, 
  DoorOpen, 
  FileText, 
  Users, 
  Building2, 
  Cpu, 
  UserCircle 
} from "lucide-react";
import { cn } from "../../utils/cn";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "#dashboard" },
  { icon: DoorOpen, label: "Salles", href: "#salles" },
  { icon: FileText, label: "Exams", href: "#exams" },
  { icon: Users, label: "Staff", href: "#staff" },
  { icon: Building2, label: "Departments", href: "#departments" },
  { icon: Cpu, label: "Assignment Engine", href: "#engine", active: true },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <Cpu className="w-8 h-8" />
          <span>ExamGuard</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
              item.active 
                ? "bg-primary/10 text-primary" 
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 text-slate-400">
          <UserCircle className="w-5 h-5" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200">Admin Panel</span>
            <span className="text-xs">Scolarité</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
