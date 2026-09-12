"use client";

import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "./theme-provider";
import { Sun, Moon, Bell, LogOut, User, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <header className="h-16 glass border-b border-white/10 flex items-center justify-between px-6 sticky top-0 z-30">
      <div />

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="p-2 rounded-lg hover:bg-white/5 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-wellness-stress rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-3 pl-3 pr-1 py-1 rounded-full hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-wellness-focus flex items-center justify-center text-sm font-bold">
              {user?.name?.[0] || "U"}
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 top-12 w-56 glass-card rounded-xl p-2 shadow-2xl"
              >
                <div className="px-3 py-2 border-b border-white/10 mb-1">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setShowProfile(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Settings size={16} /> Account Settings
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-wellness-stress hover:bg-wellness-stress/10 rounded-lg transition-colors"
                >
                  <LogOut size={16} /> Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
