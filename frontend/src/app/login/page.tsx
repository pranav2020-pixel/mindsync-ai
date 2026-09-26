"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2, KeyRound, ArrowRight, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const { login, loginWithGoogle, sendEmailOtp, verifyEmailOtp } = useAuth();
  
  // Auth mode: "PASSWORD" or "OTP"
  const [authMode, setAuthMode] = useState<"PASSWORD" | "OTP">("PASSWORD");
  
  // Password login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP login state
  const [otpStep, setOtpStep] = useState<"REQUEST" | "VERIFY">("REQUEST");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Timer for resend code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@gmail.com)");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await login(cleanEmail, password);
      toast.success("Welcome back!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = otpEmail.trim().toLowerCase();
    if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
      setError("Please enter a valid email address with a domain (e.g. name@gmail.com)");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await sendEmailOtp(cleanEmail, "Sign In");
      setOtpStep("VERIFY");
      setCountdown(60);
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      toast.success(res.message || "Verification code sent to your email!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = otpEmail.trim().toLowerCase();
    const cleanCode = otpCode.trim();

    if (!cleanCode || cleanCode.length < 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await verifyEmailOtp(cleanEmail, cleanCode);
      toast.success("Authenticated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid or expired verification code");
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
      toast.success("Signed in with Google!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to authenticate with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google Sign-In failed or was cancelled. Please try again or use email login.");
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
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sign in to continue your wellness journey</p>
        </div>

        {/* Google Sign-In Button */}
        <div className="mb-6">
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              shape="pill"
              size="large"
              text="continue_with"
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
            Or with email
          </span>
        </div>

        {/* Auth Method Tabs */}
        <div className="grid grid-cols-2 p-1 mb-5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => { setAuthMode("PASSWORD"); setError(""); }}
            className={`py-2 rounded-lg transition-all ${
              authMode === "PASSWORD"
                ? "bg-primary-600 text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode("OTP"); setError(""); }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              authMode === "OTP"
                ? "bg-primary-600 text-white shadow-sm font-semibold"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Sparkles size={13} className="text-accent-indigo" />
            Email OTP
          </button>
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

        {/* Mode 1: Password Form */}
        {authMode === "PASSWORD" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-12 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                  placeholder="••••••••"
                  required
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
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In with Password"}
            </button>
          </form>
        ) : (
          /* Mode 2: Email OTP Form */
          <div>
            {otpStep === "REQUEST" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block text-muted-foreground">
                    Enter your Gmail / Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                    <input
                      type="email"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500 transition-colors"
                      placeholder="you@gmail.com"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    We&apos;ll send a 6-digit One-Time Password to your inbox for passwordless login.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-wellness-focus text-white font-medium hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 text-sm"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      6-Digit Code sent to <strong className="text-white">{otpEmail}</strong>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setOtpStep("REQUEST"); setError(""); }}
                      className="text-xs text-primary-400 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-center text-lg tracking-widest font-mono outline-none focus:border-primary-500 transition-colors"
                      placeholder="000000"
                      autoFocus
                      required
                    />
                  </div>
                </div>

                {/* Dev Code Autofill Banner (Only in local development) */}
                {process.env.NODE_ENV === "development" && devCode && (
                  <div
                    onClick={() => setOtpCode(devCode)}
                    className="p-2.5 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-300 text-xs flex items-center justify-between cursor-pointer hover:bg-primary-500/20 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-primary-400" />
                      <span>Dev Preview Code: <strong>{devCode}</strong></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-primary-400">Click to fill</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-wellness-focus text-white font-medium hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 text-sm"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "Verify & Sign In"}
                </button>

                <div className="text-center pt-1">
                  {countdown > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Resend code in {countdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-xs text-primary-400 hover:underline flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw size={12} />
                      <span>Resend verification code</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary-400 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
