"use client";

import { useTheme } from "@/components/layout/theme-provider";

export function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === "green";

  return {
    isDark,
    gridStroke: isDark
      ? theme === "green" ? "rgba(34, 197, 94, 0.12)" : "rgba(255, 255, 255, 0.08)"
      : theme === "green-light" ? "rgba(16, 185, 129, 0.12)" : "rgba(0, 0, 0, 0.08)",
    axisStroke: isDark
      ? theme === "green" ? "rgba(142, 191, 164, 0.4)" : "rgba(255, 255, 255, 0.35)"
      : theme === "green-light" ? "rgba(5, 150, 105, 0.4)" : "rgba(100, 116, 139, 0.5)",
    axisTick: {
      fill: isDark
        ? theme === "green" ? "#8ebfa4" : "#94a3b8"
        : theme === "green-light" ? "#065f46" : "#475569",
      fontSize: 12,
    },
    radarGrid: isDark
      ? theme === "green" ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.15)"
      : theme === "green-light" ? "rgba(16, 185, 129, 0.2)" : "rgba(0, 0, 0, 0.12)",
    radarAngleTick: {
      fill: isDark
        ? theme === "green" ? "#edfcf2" : "#cbd5e1"
        : theme === "green-light" ? "#064e3b" : "#334155",
      fontSize: 12,
      fontWeight: 500,
    },
    tooltipStyle: {
      backgroundColor: theme === "green"
        ? "rgba(9, 26, 16, 0.95)"
        : theme === "green-light"
        ? "rgba(245, 253, 248, 0.96)"
        : isDark
        ? "rgba(15, 23, 42, 0.95)"
        : "rgba(255, 255, 255, 0.98)",
      border: theme === "green"
        ? "1px solid rgba(34, 197, 94, 0.3)"
        : theme === "green-light"
        ? "1px solid rgba(16, 185, 129, 0.3)"
        : isDark
        ? "1px solid rgba(255, 255, 255, 0.15)"
        : "1px solid rgba(0, 0, 0, 0.1)",
      borderRadius: "12px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      color: theme === "green"
        ? "#edfcf2"
        : theme === "green-light"
        ? "#064e3b"
        : isDark
        ? "#f8fafc"
        : "#0f172a",
    },
  };
}
