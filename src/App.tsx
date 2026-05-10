import React, { useState, useEffect } from "react";
import { Layout } from "./components/layout/Layout";
import { AdminDashboard } from "./views/AdminDashboard";
import { AssignmentEngine } from "./views/AssignmentEngine";
import { ProfessorPortal } from "./views/ProfessorPortal";

function App() {
  const [currentView, setCurrentView] = useState("engine");

  // Simple hash-based routing for demo purposes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setCurrentView(hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <AdminDashboard />;
      case "engine":
        return <AssignmentEngine />;
      case "staff":
      case "professors":
        return <AdminDashboard />; // Reusing dashboard for staff demo
      case "portal":
        return <ProfessorPortal />;
      default:
        return <AssignmentEngine />;
    }
  };

  return (
    <Layout>
      <div className="mb-4 flex items-center gap-4 border-b border-border pb-4 md:hidden">
        <select 
          value={currentView} 
          onChange={(e) => setCurrentView(e.target.value)}
          className="bg-slate-900 border border-border rounded px-2 py-1 text-sm"
        >
          <option value="dashboard">Admin Dashboard</option>
          <option value="engine">Assignment Engine</option>
          <option value="portal">Professor Portal</option>
        </select>
      </div>
      {renderView()}
      
      {/* Demo Floating Switcher for easy testing */}
      <div className="fixed bottom-6 right-6 flex gap-2 bg-slate-900/80 backdrop-blur border border-border p-2 rounded-full shadow-2xl z-50">
        <button 
          onClick={() => window.location.hash = "dashboard"}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${currentView === 'dashboard' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-800'}`}
        >
          Admin
        </button>
        <button 
          onClick={() => window.location.hash = "engine"}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${currentView === 'engine' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-800'}`}
        >
          Engine
        </button>
        <button 
          onClick={() => window.location.hash = "portal"}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${currentView === 'portal' ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-800'}`}
        >
          Professor
        </button>
      </div>
    </Layout>
  );
}

export default App;
