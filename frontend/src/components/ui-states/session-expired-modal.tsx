"use client";

import React, { useEffect, useState } from "react";
import { LogIn, Clock, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function SessionExpiredModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleSessionExpired = () => {
      setIsOpen(true);
    };

    window.addEventListener("mindsync:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("mindsync:session-expired", handleSessionExpired);
    };
  }, []);

  if (!isOpen) return null;

  const handleReLogin = () => {
    setIsOpen(false);
    router.push("/login");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card text-card-foreground border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
          <Clock size={28} />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground">Session Expired</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your secure login session has timed out due to inactivity or token renewal limits. Please log in again to continue your mental wellness journey.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-xs text-muted-foreground flex items-center gap-2 text-left">
          <AlertCircle size={16} className="text-amber-500 shrink-0" />
          <span>Your local drafts and encrypted reflections have been securely preserved.</span>
        </div>

        <button
          onClick={handleReLogin}
          className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <LogIn size={18} />
          Log In Again
        </button>
      </div>
    </div>
  );
}
