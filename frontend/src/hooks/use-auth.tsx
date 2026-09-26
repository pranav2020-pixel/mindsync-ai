"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { GoogleOAuthProvider } from "@react-oauth/google";
import api from "@/lib/api";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  sendEmailOtp: (email: string, purpose?: string) => Promise<{ success: boolean; message: string; devCode?: string }>;
  verifyEmailOtp: (email: string, code: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (token) {
      api.get("/auth/me")
        .then((res: { data: { data: User } }) => setUser(res.data.data))
        .catch(() => {
          Cookies.remove("accessToken");
          Cookies.remove("refreshToken");
          setUser(null);
          if (pathname !== "/login" && pathname !== "/register" && pathname !== "/forgot-password") {
            router.push("/login");
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      if (pathname !== "/login" && pathname !== "/register" && pathname !== "/forgot-password") {
        router.push("/login");
      }
    }
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, refreshToken, user } = res.data.data;
    Cookies.set("accessToken", accessToken, { path: "/", expires: 7 });
    Cookies.set("refreshToken", refreshToken, { path: "/", expires: 30 });
    setUser(user);
    router.push("/");
  };

  const loginWithGoogle = async (credential: string) => {
    const res = await api.post("/auth/google", { credential });
    const { accessToken, refreshToken, user } = res.data.data;
    Cookies.set("accessToken", accessToken, { path: "/", expires: 7 });
    Cookies.set("refreshToken", refreshToken, { path: "/", expires: 30 });
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
    Cookies.set("accessToken", accessToken, { path: "/", expires: 7 });
    Cookies.set("refreshToken", refreshToken, { path: "/", expires: 30 });
    setUser(user);
    router.push("/");
  };

  const register = async (data: any) => {
    const res = await api.post("/auth/register", data);
    const { accessToken, refreshToken, user } = res.data.data;
    Cookies.set("accessToken", accessToken, { path: "/", expires: 7 });
    Cookies.set("refreshToken", refreshToken, { path: "/", expires: 30 });
    setUser(user);
    router.push("/");
  };

  const logout = () => {
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
    setUser(null);
    router.push("/login");
  };

  return (
    <GoogleOAuthProvider clientId={googleClientId || "mindsync-google-client-id"}>
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
