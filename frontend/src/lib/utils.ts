import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
export function formatRelativeTime(date: string | Date): string {
  const now = new Date(); const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(date);
}
export function getMoodColor(mood: number): string {
  if (mood >= 8) return "text-wellness-calm bg-wellness-calm/10";
  if (mood >= 6) return "text-primary-500 bg-primary-500/10";
  if (mood >= 4) return "text-wellness-energy bg-wellness-energy/10";
  if (mood >= 2) return "text-wellness-stress bg-wellness-stress/10";
  return "text-red-600 bg-red-600/10";
}
export function getStressColor(stress: number): string {
  if (stress <= 3) return "text-wellness-calm";
  if (stress <= 6) return "text-wellness-energy";
  return "text-wellness-stress";
}
