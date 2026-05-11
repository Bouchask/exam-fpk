import React from "react";
import { cn } from "../../utils/cn";
import { UserCircle } from "lucide-react";

const adminMenuItems = [
  { id: "dashboard", label: "Control Center", href: "#dashboard" },
  { id: "salles", label: "Salles", href: "#salles" },
  { id: "exams", label: "Exams", href: "#exams" },
  { id: "staff", label: "Staff", href: "#staff" },
  { id: "departments", label: "Departments", href: "#departments" },
  { id: "engine", label: "Assignment Engine", href: "#engine" },
];

const professorMenuItems = [
  { id: "portal", label: "Duty Portal", href: "#portal" },
  { id: "history", label: "Assignment History", href: "#history" },
  { id: "incidents", label: "Incident Logs", href: "#incidents" },
];

interface SidebarProps {
  activeView: string;
  userRole: "admin" | "professor";
}

export const Sidebar = ({ activeView, userRole }: SidebarProps) => {
  const menuItems = userRole === "admin" ? adminMenuItems : professorMenuItems;

  return (
    <aside className="w-64 border-r border-app-border bg-white hidden md:flex flex-col h-screen sticky top-0 z-20">
      <div className="p-6 border-b border-app-border">
        <div className="flex items-center gap-3 font-bold text-xl text-app-primary">
          <img 
            src="/fpk.jpeg" 
            alt="FPK Logo" 
            className="h-10 w-auto object-contain"
          />
          <span className="tracking-tight text-app-fg uppercase text-sm font-black">FPK Guard</span>
        </div>
      </div>
      
      <nav className="flex-1 px-0 space-y-0 mt-4">
        <p className="px-6 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-4">
          {userRole === "admin" ? "Management" : "Faculty Portal"}
        </p>
        {menuItems.map((item) => {
          const isActive = activeView === item.id || (item.id === 'staff' && activeView === 'professors');
          
          return (
            <a
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-6 py-3.5 transition-all duration-150 border-l-4",
                isActive 
                  ? "bg-stone-100 text-app-primary border-app-primary font-bold" 
                  : "text-stone-500 hover:bg-stone-50 hover:text-app-fg border-transparent font-medium"
              )}
            >
              <span className="text-sm uppercase tracking-wider">{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="p-6 bg-app-fg text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-app-primary flex items-center justify-center text-white">
            <UserCircle className="w-6 h-6" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-black uppercase tracking-wider truncate">
              {userRole === "admin" ? "Admin System" : "Professor"}
            </span>
            <span className="text-[10px] text-stone-400 uppercase">
              {userRole === "admin" ? "Scolarité Dept" : "Faculty Account"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
