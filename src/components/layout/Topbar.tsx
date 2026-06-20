import { Search, Bell, Settings } from "lucide-react";
import type { User } from "../../types";

interface TopbarProps {
  user: User | null;
  userRole: "admin" | "professor";
}

export const Topbar = ({ user, userRole }: TopbarProps) => {
  // Get user initials for avatar
  const getInitials = () => {
    if (user && user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return userRole === "admin" ? "AD" : "PR";
  };

  // Get user display name
  const getDisplayName = () => {
    if (user && user.full_name) {
      return user.full_name;
    }
    return userRole === "admin" ? "Administrator" : "Professor";
  };

  // Get department name
  const getDepartmentName = () => {
    if (user && user.institutional_grade) {
      return user.institutional_grade;
    }
    return userRole === "admin" ? "Scolarité Dept" : "Faculty";
  };

  return (
    <header className="h-16 border-b border-app-border bg-white sticky top-0 z-10 flex items-center justify-between px-8">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-app-primary transition-colors" />
          <input 
            type="text" 
            placeholder="SYSTEM SEARCH..."
            className="w-full bg-stone-50 border border-stone-200 rounded-none py-2 pl-10 pr-4 text-xs font-bold text-app-fg placeholder:text-stone-400 focus:outline-none focus:border-app-primary transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className="p-3 text-stone-400 hover:text-app-primary transition-all">
          <Bell className="w-4 h-4" />
        </button>
        <button className="p-3 text-stone-400 hover:text-app-primary transition-all">
          <Settings className="w-4 h-4" />
        </button>
        <div className="h-16 w-px bg-stone-100 mx-2"></div>
        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-tighter text-app-fg leading-none">
              {getDisplayName()}
            </p>
            <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-1">
              {getDepartmentName()}
            </p>
          </div>
          <div className="h-10 w-10 bg-app-fg text-white flex items-center justify-center font-black text-xs">
            {getInitials()}
          </div>
        </div>
      </div>
    </header>
  );
};
