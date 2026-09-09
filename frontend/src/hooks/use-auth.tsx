"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/lib/api";
import { User } from "@/types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          if (pathname !== "/login" && pathname !== "/register") {
            router.push("/login");
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      if (pathname !== "/login" && pathname !== "/register") {
        router.push("/login");
      }
    }
  }, [pathname, router]);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, refreshToken, user } = res.data.data;
    Cookies.set("accessToken", accessToken);
    Cookies.set("refreshToken", refreshToken);
    setUser(user);
    router.push("/");
  };

  const register = async (data: any) => {
    const res = await api.post("/auth/register", data);
    const { accessToken, refreshToken, user } = res.data.data;
    Cookies.set("accessToken", accessToken);
    Cookies.set("refreshToken", refreshToken);
    setUser(user);
    router.push("/");
  };

  const logout = () => {
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
