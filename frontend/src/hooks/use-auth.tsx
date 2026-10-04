"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { GoogleOAuthProvider } from "@react-oauth/google";
import api from "@/lib/api";
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  setStoredTokens,
  clearStoredTokens,
} from "@/lib/auth-storage";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  sendEmailOtp: (email: string, purpose?: string) => Promise<{ success: boolean; message: string; devCode?: string }>;
  verifyEmailOtp: (email: string, code: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "663226411128-bts6nkunj6fl5nogo87i06j8eic6o956.apps.googleusercontent.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initial persistent authentication check (runs on app mount / cold open)
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const accessToken = getStoredAccessToken();
      const refreshToken = getStoredRefreshToken();

      // If neither token is present, user is not logged in
      if (!accessToken && !refreshToken) {
        if (isMounted) {
          setUser(null);
          setLoading(false);
          if (pathname !== "/login" && pathname !== "/register" && pathname !== "/forgot-password") {
            router.push("/login");
          }
        }
        return;
      }

      try {
        // Fetch current user profile.
        // If accessToken is expired, api.ts interceptor uses refreshToken to silently regenerate tokens seamlessly
        const res = await api.get("/auth/me");
        if (isMounted) {
          setUser(res.data.data);
        }
      } catch (err) {
        console.warn("[MindSync Auth] Session restoration failed:", err);
        if (isMounted) {
          clearStoredTokens();
          setUser(null);
          if (pathname !== "/login" && pathname !== "/register" && pathname !== "/forgot-password") {
            router.push("/login");
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Route protection after initial auth resolution
  useEffect(() => {
    if (loading) return;
    const isPublicAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";
    if (!user && !isPublicAuthRoute) {
      router.push("/login");
    } else if (user && (pathname === "/login" || pathname === "/register")) {
      router.push("/");
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, refreshToken, user } = res.data.data;
    setStoredTokens(accessToken, refreshToken);
    setUser(user);
    router.push("/");
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await api.post("/auth/google", { credential });
    const { accessToken, refreshToken, user } = res.data.data;
    setStoredTokens(accessToken, refreshToken);
    setUser(user);
    router.push("/");
  };

  const sendEmailOtp = async (email: string, purpose: string = "Sign In") => {
    const res = await api.post("/auth/otp/send", { email, purpose });
    return res.data;
  };

  const verifyEmailOtp = async (email: string, code: string) => {
    const res = await api.post("/auth/otp/verify", { email, code });
    const { accessToken, refreshToken, user } = res.data.data;
    setStoredTokens(accessToken, refreshToken);
    setUser(user);
    router.push("/");
  };

  const register = async (data: any) => {
    const res = await api.post("/auth/register", data);
    if (res.data?.data?.accessToken) {
      const { accessToken, refreshToken, user } = res.data.data;
      setStoredTokens(accessToken, refreshToken);
      setUser(user);
      router.push("/");
    }
    return res.data;
  };

  const logout = () => {
    clearStoredTokens();
    setUser(null);
    router.push("/login");
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthContext.Provider value={{ user, login, loginWithGoogle, sendEmailOtp, verifyEmailOtp, logout, register, loading }}>
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
