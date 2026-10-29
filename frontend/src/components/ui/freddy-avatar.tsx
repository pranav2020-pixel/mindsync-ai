"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FreddyAvatarProps {
  size?: number;
  className?: string;
  showAura?: boolean;
  pulse?: boolean;
  title?: string;
}

/**
 * Freddy AI Companion Avatar.
 * Precision vector rendition of Freddy (`avatar-4fe2d1bd-cf46-4e5e-a62d-d6b60be519ed`).
 * Features warm terracotta-coral 3D rounded-cube body, spherical ears, top crest,
 * glowing white pill eyes, and optional soft aura.
 */
export const FreddyAvatar: React.FC<FreddyAvatarProps> = ({
  size = 32,
  className,
  showAura = false,
  pulse = false,
  title = "Freddy - AI Wellness Coach",
}) => {
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center shrink-0 select-none",
        pulse && "animate-pulse",
        className
      )}
      style={{ width: size, height: size }}
      title={title}
      aria-label={title}
    >
      {showAura && (
        <span
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/25 to-purple-500/20 blur-sm -z-10 scale-125"
          aria-hidden="true"
        />
      )}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <radialGradient id="freddyEarL" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffd5c2" />
            <stop offset="55%" stopColor="#e6855c" />
            <stop offset="100%" stopColor="#b8532a" />
          </radialGradient>
          <radialGradient id="freddyEarR" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#ffd5c2" />
            <stop offset="55%" stopColor="#e6855c" />
            <stop offset="100%" stopColor="#b8532a" />
          </radialGradient>
          <radialGradient id="freddyCrest" cx="40%" cy="25%" r="70%">
            <stop offset="0%" stopColor="#ffe0d2" />
            <stop offset="58%" stopColor="#e6855c" />
            <stop offset="100%" stopColor="#b54d24" />
          </radialGradient>
          <radialGradient id="freddyBody" cx="32%" cy="24%" r="75%">
            <stop offset="0%" stopColor="#ffd8c7" />
            <stop offset="28%" stopColor="#f59e7a" />
            <stop offset="62%" stopColor="#e6855c" />
            <stop offset="88%" stopColor="#b8532a" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
          <filter id="freddyEyeGlow" x="-50%" y="-30%" width="200%" height="160%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#ffffff" floodOpacity="0.95" />
            <feDropShadow dx="0" dy="1.5" stdDeviation="1" floodColor="#7c2d12" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Left Ear */}
        <circle cx="23" cy="31" r="13.5" fill="url(#freddyEarL)" />

        {/* Right Ear */}
        <circle cx="77" cy="31" r="13.5" fill="url(#freddyEarR)" />

        {/* Top Crest */}
        <rect x="41" y="11" width="18" height="23" rx="9" fill="url(#freddyCrest)" />

        {/* Primary Rounded Cube Body */}
        <rect x="14" y="24" width="72" height="64" rx="25" fill="url(#freddyBody)" />

        {/* Top Highlight Glint */}
        <ellipse cx="50" cy="28" rx="24" ry="3.5" fill="#ffffff" opacity="0.38" />

        {/* Glowing Pill Eyes */}
        <rect x="36" y="44" width="9" height="22" rx="4.5" fill="#ffffff" filter="url(#freddyEyeGlow)" />
        <rect x="55" y="44" width="9" height="22" rx="4.5" fill="#ffffff" filter="url(#freddyEyeGlow)" />

        {/* Friendly Cheeks */}
        <circle cx="26" cy="62" r="3.5" fill="#ffaa8a" opacity="0.45" />
        <circle cx="74" cy="62" r="3.5" fill="#ffaa8a" opacity="0.45" />
      </svg>
    </div>
  );
};
export default FreddyAvatar;
