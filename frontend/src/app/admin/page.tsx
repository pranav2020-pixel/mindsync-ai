"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users, UserCheck, Activity, TrendingUp, Flame, BookOpen, Heart,
  CheckCircle2, MessageSquare, ShieldCheck, RefreshCw, Search,
  Sparkles, Calendar, Mail, ShieldAlert, ArrowLeft, BarChart3, Award
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import Link from "next/link";
import api from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface AdminMetrics {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalJournals: number;
  totalMoodLogs: number;
  totalHabitsCompleted: number;
  totalChatMessages: number;
  totalAssessments: number;
}

interface TimelineItem {
  date: string;
  label: string;
  newUsers: number;
}

interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  authProvider: string;
  createdAt: string;
  _count: {
    journals: number;
    moodLogs: number;
    habits: number;
    chatMessages: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAnalytics = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await api.get("/admin/analytics");
      if (res.data?.success && res.data?.data) {
        setMetrics(res.data.data.metrics);
        setTimeline(res.data.data.timeline || []);
        setRecentUsers(res.data.data.recentUsers || []);
        if (isManual) toast.success("Analytics refreshed!");
      }
    } catch (err: any) {
      console.error("[Admin] Analytics fetch failed:", err);
      toast.error(err.response?.data?.message || "Failed to load admin analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      setLoading(false);
      return;
    }
    fetchAnalytics();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-white/10 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 glass-card rounded-2xl" />
          ))}
        </div>
        <div className="h-72 glass-card rounded-2xl" />
      </div>
    );
  }

  // Unauthorized view (Keep it hidden from regular users)
  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-xl font-bold mb-2">Access Restricted</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          This portal is reserved for MindSync AI creators and system administrators.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-all shadow-md"
        >
          <ArrowLeft size={16} /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const filteredUsers = recentUsers.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.authProvider?.toLowerCase().includes(q)
    );
  });

  const verifiedPercent = metrics?.totalUsers
    ? Math.round((metrics.verifiedUsers / metrics.totalUsers) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
            <ShieldCheck size={14} /> Creator Admin Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Analytics & Growth</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time telemetry on MindSync AI user acquisition, daily active users, and engagement.
          </p>
        </div>

        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-card text-xs font-semibold text-primary-400 hover:text-primary-300 hover:border-primary-500/40 transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          <span>{refreshing ? "Refreshing..." : "Sync Live Data"}</span>
        </button>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-primary-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Registered</span>
            <div className="w-10 h-10 rounded-xl bg-primary-500/15 text-primary-400 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight">{metrics?.totalUsers ?? 0}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-emerald-400 font-semibold">{metrics?.verifiedUsers ?? 0} verified</span>
            <span>({verifiedPercent}%)</span>
          </div>
        </motion.div>

        {/* Daily Active Users (DAU) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Daily Active (DAU)</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Flame size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-emerald-400">{metrics?.dailyActiveUsers ?? 0}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Active in the past 24 hours
          </p>
        </motion.div>

        {/* Weekly Active Users (WAU) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Weekly Active (WAU)</span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Activity size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-cyan-300">{metrics?.weeklyActiveUsers ?? 0}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Active within the last 7 days
          </p>
        </motion.div>

        {/* Monthly Active Users (MAU) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-violet-500/40 transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Active (MAU)</span>
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-400 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-3xl font-extrabold tracking-tight text-violet-300">{metrics?.monthlyActiveUsers ?? 0}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Active within the last 30 days
          </p>
        </motion.div>
      </div>

      {/* Engagement Pulse Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-pink-500/15 text-pink-400">
            <Heart size={18} />
          </div>
          <div>
            <div className="text-lg font-bold">{metrics?.totalMoodLogs ?? 0}</div>
            <div className="text-[11px] text-muted-foreground">Mood Check-ins</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-500/15 text-indigo-400">
            <BookOpen size={18} />
          </div>
          <div>
            <div className="text-lg font-bold">{metrics?.totalJournals ?? 0}</div>
            <div className="text-[11px] text-muted-foreground">Journals Written</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-lg font-bold">{metrics?.totalHabitsCompleted ?? 0}</div>
            <div className="text-[11px] text-muted-foreground">Habits Completed</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/15 text-amber-400">
            <MessageSquare size={18} />
          </div>
          <div>
            <div className="text-lg font-bold">{metrics?.totalChatMessages ?? 0}</div>
            <div className="text-[11px] text-muted-foreground">AI Chats</div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-lg bg-purple-500/15 text-purple-400">
            <Award size={18} />
          </div>
          <div>
            <div className="text-lg font-bold">{metrics?.totalAssessments ?? 0}</div>
            <div className="text-[11px] text-muted-foreground">Assessments</div>
          </div>
        </div>
      </div>

      {/* 14-Day New User Growth Chart */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <BarChart3 size={18} className="text-primary-400" />
              14-Day User Signups Trend
            </h2>
            <p className="text-xs text-muted-foreground">New accounts registered per day</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                allowDecimals={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  color: "#f8fafc",
                }}
              />
              <Area
                type="monotone"
                dataKey="newUsers"
                name="New Users"
                stroke="#6366f1"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#userGrowthGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Registered Users Table */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <Users size={18} className="text-primary-400" />
              Registered Users Directory
            </h2>
            <p className="text-xs text-muted-foreground">Showing the latest {recentUsers.length} accounts</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search user or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white placeholder-muted-foreground focus:outline-none focus:border-primary-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground">
                <th className="pb-3 font-semibold">User</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold text-center">Activity Logs</th>
                <th className="pb-3 font-semibold text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No users matching "{searchQuery}"
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const totalLogs =
                    (u._count?.journals || 0) +
                    (u._count?.moodLogs || 0) +
                    (u._count?.habits || 0) +
                    (u._count?.chatMessages || 0);

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-3 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[11px] shadow-sm uppercase">
                            {u.name?.charAt(0) || "U"}
                          </div>
                          <span className="truncate max-w-[130px] sm:max-w-none">{u.name}</span>
                        </div>
                      </td>

                      <td className="py-3 pr-3 text-muted-foreground font-mono text-[11px]">
                        {u.email}
                      </td>

                      <td className="py-3 pr-3">
                        {u.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium text-[10px]">
                            <UserCheck size={11} /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium text-[10px]">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 pr-3">
                        {u.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold text-[10px] border border-purple-500/30">
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">USER</span>
                        )}
                      </td>

                      <td className="py-3 pr-3 text-center">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md font-semibold text-[11px]",
                          totalLogs > 0 ? "bg-primary-500/15 text-primary-300" : "text-muted-foreground"
                        )}>
                          {totalLogs} logs
                        </span>
                      </td>

                      <td className="py-3 text-right text-muted-foreground whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
