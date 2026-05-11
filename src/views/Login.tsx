import React, { useState } from "react";
import { User, Lock, ArrowRight, Building2, ShieldCheck, RefreshCcw } from "lucide-react";

interface LoginProps {
  onLogin: (role: "admin" | "professor") => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      if (email === "admin" && password === "admin") {
        onLogin("admin");
      } else if (email === "prof" && password === "prof") {
        onLogin("professor");
      } else {
        setError("Invalid credentials. Use 'admin/admin' or 'prof/prof'.");
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-app-fg flex items-center justify-center p-0 font-sans">
      <div className="max-w-md w-full bg-white border-t-8 border-app-primary">
        <div className="p-12">
          {/* Logo Section */}
          <div className="mb-10">
             <img 
               src="/fpk.jpeg" 
               alt="FPK Logo" 
               className="h-16 w-auto object-contain"
             />
             <div className="mt-6 border-b-2 border-app-fg w-12"></div>
          </div>

          <div className="mb-10">
            <h1 className="text-2xl font-black text-app-fg uppercase tracking-tighter">System Access</h1>
            <p className="text-xs text-stone-500 mt-2 font-bold uppercase tracking-widest">Faculty of Khouribga</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-app-fg uppercase tracking-widest">Identification</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="USERNAME"
                  className="w-full bg-stone-100 border-b-2 border-stone-200 rounded-none py-4 px-0 text-app-fg font-bold placeholder:text-stone-400 focus:outline-none focus:border-app-primary transition-all text-sm indent-4"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-app-fg uppercase tracking-widest">Security Code</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-100 border-b-2 border-stone-200 rounded-none py-4 px-0 text-app-fg font-bold placeholder:text-stone-400 focus:outline-none focus:border-app-primary transition-all text-sm indent-4"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-900 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-app-fg text-white py-5 rounded-none font-black uppercase tracking-[0.3em] text-xs hover:bg-app-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCcw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Authenticate
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-stone-50 p-6 flex justify-between items-center border-t border-stone-200">
           <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">USMS 2026</span>
           <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest underline cursor-pointer">Support</span>
        </div>
      </div>
    </div>
  );
};
