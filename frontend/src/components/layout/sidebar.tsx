"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Heart, CheckCircle2, Zap,
  ClipboardList, MessageCircle, BarChart3, Brain, Menu, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const icons: Record<string, any> = {
  LayoutDashboard, BookOpen, Heart, CheckCircle2, Zap,
  ClipboardList, MessageCircle, BarChart3, Brain
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
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass rounded-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 h-screen w-64 glass border-r border-white/10 flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "transition-transform duration-300"
        )}
      >
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-wellness-focus flex items-center justify-center">
              <Brain className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl text-gradient">MindSync</h1>
              <p className="text-xs text-muted-foreground">AI Wellness</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = icons[item.icon];
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary-500/10 text-primary-400 border border-primary-500/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">Daily Streak</p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-primary-500 to-wellness-calm rounded-full" />
              </div>
              <span className="text-sm font-bold">12</span>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
