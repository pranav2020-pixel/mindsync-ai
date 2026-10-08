"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AppTheme = "dark" | "light" | "green";

interface ThemeContextType {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("dark");

  const applyThemeToDOM = (t: AppTheme) => {
    const root = document.documentElement;
    root.classList.remove("dark", "green");
    if (t === "dark") {
      root.classList.add("dark");
    } else if (t === "green") {
      root.classList.add("dark", "green");
    }
  };

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as AppTheme) || "dark";
    if (saved === "light" || saved === "dark" || saved === "green") {
      setThemeState(saved);
      applyThemeToDOM(saved);
    } else {
      setThemeState("dark");
      applyThemeToDOM("dark");
    }
  }, []);

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    localStorage.setItem("theme", t);
    applyThemeToDOM(t);
  };

  const toggleTheme = () => {
    // Cycle: dark -> green -> light -> dark
    let next: AppTheme = "dark";
    if (theme === "dark") next = "green";
    else if (theme === "green") next = "light";
    else next = "dark";

    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

