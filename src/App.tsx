import { useState, useEffect } from "react";
import { Layout } from "./components/layout/Layout";
import { AdminDashboard } from "./views/AdminDashboard";
import { AssignmentEngine } from "./views/AssignmentEngine";
import { ProfessorPortal } from "./views/ProfessorPortal";
import { ProfessorHistory } from "./views/ProfessorHistory";
import { ProfessorIncidents } from "./views/ProfessorIncidents";
import { Login } from "./views/Login";

function App() {
  const [userRole, setUserRole] = useState<"admin" | "professor" | null>(null);
  const [currentView, setCurrentView] = useState("dashboard");

  const handleLogin = (role: "admin" | "professor") => {
    setUserRole(role);
    if (role === "admin") {
      setCurrentView("dashboard");
      window.location.hash = "dashboard";
    } else {
      setCurrentView("portal");
      window.location.hash = "portal";
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    window.location.hash = "";
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && userRole) setCurrentView(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [userRole]);

  if (!userRole) {
    return <Login onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      // ADMIN VIEWS
      case "dashboard":
        return <AdminDashboard forcedTab="overview" />;
      case "salles":
        return <AdminDashboard forcedTab="salles" />;
      case "exams":
        return <AdminDashboard forcedTab="exams" />;
      case "staff":
      case "professors":
        return <AdminDashboard forcedTab="professors" />;
      case "departments":
        return <AdminDashboard forcedTab="departments" />;
      case "engine":
        return <AssignmentEngine />;
      
      // PROFESSOR VIEWS
      case "portal":
        return <ProfessorPortal />;
      case "history":
        return <ProfessorHistory />;
      case "incidents":
        return <ProfessorIncidents />;
      
      default:
        return userRole === "admin" ? <AdminDashboard forcedTab="overview" /> : <ProfessorPortal />;
    }
  };

  return (
    <Layout activeView={currentView} userRole={userRole}>
      <div className="mb-8 flex items-center justify-between border-b-2 border-stone-100 pb-6 md:hidden">
        <select 
          value={currentView} 
          onChange={(e) => setCurrentView(e.target.value)}
          className="bg-stone-50 border border-stone-200 rounded-none px-4 py-2 text-[10px] font-black uppercase tracking-widest text-app-fg focus:outline-none focus:border-app-primary"
        >
          {userRole === "admin" ? (
            <>
              <option value="dashboard">ADMIN DASHBOARD</option>
              <option value="salles">SALLES</option>
              <option value="exams">EXAMS</option>
              <option value="staff">STAFF</option>
              <option value="departments">DEPARTMENTS</option>
              <option value="engine">ASSIGNMENT ENGINE</option>
            </>
          ) : (
            <>
              <option value="portal">DUTY PORTAL</option>
              <option value="history">ASSIGNMENT HISTORY</option>
              <option value="incidents">INCIDENT LOGS</option>
            </>
          )}
        </select>
        <button 
          onClick={handleLogout}
          className="text-[10px] font-black text-red-800 uppercase tracking-widest underline"
        >
          SIGN OUT
        </button>
      </div>
      
      {renderView()}
      
      {/* Sharp Demo Action Bar */}
      <div className="fixed bottom-6 right-6 flex gap-0 bg-app-fg border-2 border-stone-800 p-0 shadow-none z-50">
        {userRole === "admin" && (
          <>
            <button 
              onClick={() => window.location.hash = "dashboard"}
              className={`px-6 py-2 rounded-none text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'dashboard' ? 'bg-app-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}
            >
              ADMIN
            </button>
            <button 
              onClick={() => window.location.hash = "engine"}
              className={`px-6 py-2 rounded-none text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'engine' ? 'bg-app-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}
            >
              ENGINE
            </button>
          </>
        )}
        {userRole === "professor" && (
          <button 
            onClick={() => window.location.hash = "portal"}
            className={`px-6 py-2 rounded-none text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'portal' ? 'bg-app-primary text-white' : 'text-stone-400 hover:bg-stone-800'}`}
          >
            PORTAL
          </button>
        )}
        <div className="w-px bg-stone-800"></div>
        <button 
          onClick={handleLogout}
          className="px-6 py-2 rounded-none text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-950 transition-all"
        >
          EXIT
        </button>
      </div>
    </Layout>
  );
}

export default App;
