"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Mail, KeyRound, Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"REQUEST" | "RESET">("REQUEST");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");
    setDevCode(null);

    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await api.post("/auth/forgot-password", { email: cleanEmail });
      setSuccessMessage(res.data.message || "A 6-digit verification code has been sent to your email.");
      if (res.data.devCode) {
        setDevCode(res.data.devCode);
        setCode(res.data.devCode);
      }
      toast.success("Verification code sent!");
      setStep("RESET");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/reset-password", {
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });
      toast.success(res.data.message || "Password reset successfully!");
      setSuccessMessage("Your password has been successfully updated. You can now sign in.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to reset password. Please verify the code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-2xl p-8"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-wellness-focus flex items-center justify-center mx-auto mb-4">
            <Brain className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {step === "REQUEST"
              ? "Enter your registered email to receive a verification code"
              : "Enter the 6-digit code and choose a new password"}
          </p>
        </div>

        {step === "REQUEST" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 px-0.5">
                <button
                  type="button"
                  onClick={() => setEmail("demo@mindsync.ai")}
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Fill demo account (<span className="underline">demo@mindsync.ai</span>)
                </button>
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-wellness-stress text-center">
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-wellness-focus text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {successMessage && (
              <div className="p-3 bg-primary-500/10 border border-primary-500/20 rounded-xl text-xs text-primary-300">
                {successMessage}
              </div>
            )}

            {devCode && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 text-center">
                <strong>Quick Test Code:</strong> <span className="font-mono text-sm tracking-widest">{devCode}</span>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1.5 block">6-Digit Code</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono tracking-widest outline-none focus:border-primary-500"
                  placeholder="123456"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-3 text-sm outline-none focus:border-primary-500"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-white px-1 py-0.5 rounded"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary-500"
                  placeholder="Re-enter new password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-wellness-stress text-center">
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-wellness-focus text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Save New Password"}
            </button>

            <button
              type="button"
              onClick={() => { setStep("REQUEST"); setError(""); }}
              className="w-full text-xs text-muted-foreground hover:text-white text-center pt-2"
            >
              ← Change email or resend code
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-primary-400 hover:underline">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
