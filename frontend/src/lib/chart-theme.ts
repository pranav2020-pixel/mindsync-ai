"use client";

import { useTheme } from "@/components/layout/theme-provider";

export function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return {
    isDark,
    gridStroke: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    axisStroke: isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(100, 116, 139, 0.5)",
    axisTick: {
      fill: isDark ? "#94a3b8" : "#475569",
      fontSize: 12,
    },
    radarGrid: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.12)",
    radarAngleTick: {
      fill: isDark ? "#cbd5e1" : "#334155",
      fontSize: 12,
      fontWeight: 500,
    },
    tooltipStyle: {
      backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.98)",
      border: isDark ? "1px solid rgba(255, 255, 255, 0.15)" : "1px solid rgba(0, 0, 0, 0.1)",
      borderRadius: "12px",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      color: isDark ? "#f8fafc" : "#0f172a",
    },
  };
}
