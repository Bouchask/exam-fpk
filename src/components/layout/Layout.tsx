import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  userRole: "admin" | "professor";
}

export const Layout = ({ children, activeView, userRole }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-app-bg text-app-fg">
      <Sidebar activeView={activeView} userRole={userRole} />
      <div className="flex-1 flex flex-col">
        <Topbar userRole={userRole} />
        <main className="p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
