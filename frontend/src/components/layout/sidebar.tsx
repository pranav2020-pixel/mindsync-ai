"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Heart, CheckCircle2, Zap,
  ClipboardList, MessageCircle, BarChart3, Brain, X, Flame, Settings, Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";

const icons: Record<string, any> = {
  LayoutDashboard, BookOpen, Heart, CheckCircle2, Zap,
  ClipboardList, MessageCircle, BarChart3, Brain, Settings
};

const navItems = [
  { name: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { name: "Journal", href: "/journal", icon: "BookOpen" },
  { name: "Mood", href: "/mood", icon: "Heart" },
  { name: "Habits", href: "/habits", icon: "CheckCircle2" },
  { name: "Productivity", href: "/productivity", icon: "Zap" },
  { name: "Assessments", href: "/assessments", icon: "ClipboardList" },
  { name: "AI Chat", href: "/chat", icon: "MessageCircle" },
  { name: "Analytics", href: "/analytics", icon: "BarChart3" },
  { name: "Settings", href: "/settings", icon: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [streak, setStreak] = useState<number>(user?.streak || 0);

  useEffect(() => {
    if (user?.streak !== undefined) {
      setStreak(user.streak);
    }
  }, [user?.streak]);

  useEffect(() => {
    const handleOpen = () => setMobileOpen(true);
    const handleClose = () => setMobileOpen(false);
    const handleToggle = () => setMobileOpen((prev) => !prev);

    window.addEventListener("open-mobile-sidebar", handleOpen);
    window.addEventListener("close-mobile-sidebar", handleClose);
    window.addEventListener("toggle-mobile-sidebar", handleToggle);

    return () => {
      window.removeEventListener("open-mobile-sidebar", handleOpen);
      window.removeEventListener("close-mobile-sidebar", handleClose);
      window.removeEventListener("toggle-mobile-sidebar", handleToggle);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setStreak(0);
      return;
    }
    const fetchStreak = async () => {
      try {
        const res = await api.get("/auth/streak");
        if (res.data?.data?.streak !== undefined) {
          setStreak(res.data.data.streak);
        }
      } catch {
        // Ignore fetch errors
      }
    };
    fetchStreak();
  }, [user, pathname]);

  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setMobileOpen(false);
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-72 lg:w-64 glass border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out",
          mobileOpen
            ? "translate-x-0 shadow-2xl pointer-events-auto visible"
            : "-translate-x-full lg:translate-x-0 pointer-events-none lg:pointer-events-auto invisible lg:visible"
        )}
      >
        {/* Header Branding with Mobile Close Button */}
        <div className="p-5 flex items-center justify-between border-b border-white/5 lg:border-none">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center shadow-md">
              <img src="/logo.png" alt="MindSync AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gradient leading-tight">MindSync</h1>
              <p className="text-xs text-muted-foreground">AI Wellness</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMobileOpen(false);
            }}
            className="lg:hidden p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all shadow-md"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = icons[item.icon];
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary-500/15 text-primary-400 border border-primary-500/30 shadow-sm"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon size={18} className={isActive ? "text-primary-400" : "text-muted-foreground"} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Install App Button & Streak Widget Card */}
        <div className="p-4 pb-safe border-t border-white/5 lg:border-none space-y-3">
          <button
            onClick={() => {
              setMobileOpen(false);
              if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("trigger-pwa-install"));
              }
            }}
            className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/25 transition-all shadow-sm active:scale-95"
          >
            <Download size={15} />
            <span>Install MindSync App</span>
          </button>

          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Flame size={14} className={streak > 0 ? "text-amber-400 fill-amber-400/20" : "text-muted-foreground"} />
                Daily Streak
              </p>
              <span className="text-xs font-bold text-primary-400">
                {streak} {streak === 1 ? "day" : "days"}
              </span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 via-amber-400 to-wellness-calm rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(streak > 0 ? 8 : 0, (streak / 30) * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-right">
              {streak >= 30 ? "Milestone reached! 🏆" : `${30 - streak}d to 30-day goal`}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
