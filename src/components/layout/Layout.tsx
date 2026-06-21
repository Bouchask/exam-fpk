import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { User } from "../../types";

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  user: User | null;
  userRole: "admin" | "professor";
}

export const Layout = ({ children, activeView, user, userRole }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-app-bg text-app-fg">
      <Sidebar activeView={activeView} userRole={userRole} />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} userRole={userRole} />
        <main className="p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
