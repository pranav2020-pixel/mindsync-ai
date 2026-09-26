"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Loader2, Sparkles } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "react-hot-toast";

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register({
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
      });
      toast.success("Account created successfully!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      setError("Google authentication response was incomplete.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle(credentialResponse.credential);
      toast.success("Account created with Google!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to register with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-Up failed or was cancelled. Please try again.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl"
      >
        {/* Header branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-500/25">
            <img src="/logo.png" alt="MindSync AI" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="text-muted-foreground mt-1 text-sm">Start your AI-powered wellness journey</p>
        </div>

        {/* Google Sign-Up Button */}
        <div className="mb-6">
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="pill"
              size="large"
              text="signup_with"
              width="360"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative px-3 bg-slate-900/90 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Or with email & password
          </span>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 mb-4 rounded-xl bg-wellness-stress/10 border border-wellness-stress/20 text-wellness-stress text-xs text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                placeholder="Your name"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-white px-1.5 py-0.5 rounded transition-colors"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-wellness-focus text-white font-medium hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 text-sm"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-400 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
