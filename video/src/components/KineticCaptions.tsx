import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Word {
  text: string;
  startFrame: number;
  endFrame: number;
}

const WORDS: Word[] = [
  { text: "Tired", startFrame: 10, endFrame: 30 },
  { text: "of", startFrame: 30, endFrame: 45 },
  { text: "scattered", startFrame: 45, endFrame: 70 },
  { text: "thoughts?", startFrame: 70, endFrame: 110 },
  
  { text: "Meet", startFrame: 150, endFrame: 175 },
  { text: "MindSync", startFrame: 175, endFrame: 210 },
  { text: "AI.", startFrame: 210, endFrame: 260 },

  { text: "Encrypted", startFrame: 300, endFrame: 330 },
  { text: "reflections", startFrame: 330, endFrame: 370 },
  { text: "and", startFrame: 370, endFrame: 395 },
  { text: "clarity.", startFrame: 395, endFrame: 440 },

  { text: "Clinical", startFrame: 450, endFrame: 480 },
  { text: "wellness", startFrame: 480, endFrame: 520 },
  { text: "screening.", startFrame: 520, endFrame: 580 },

  { text: "Install", startFrame: 600, endFrame: 625 },
  { text: "on", startFrame: 625, endFrame: 645 },
  { text: "iOS", startFrame: 645, endFrame: 665 },
  { text: "&", startFrame: 665, endFrame: 680 },
  { text: "Android.", startFrame: 680, endFrame: 710 },
];

export const KineticCaptions: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
        zIndex: 50,
      }}
    >
      {WORDS.map((w, idx) => {
        const isActive = frame >= w.startFrame && frame <= w.endFrame;
        const isPast = frame > w.endFrame;

        // Only show words around current frame
        if (frame < w.startFrame - 15 || frame > w.endFrame + 30) return null;

        return (
          <span
            key={idx}
            style={{
              fontSize: isActive ? 48 : 40,
              fontWeight: 900,
              fontFamily: 'sans-serif',
              textTransform: 'uppercase',
              letterSpacing: -1,
              color: isActive ? '#38bdf8' : isPast ? '#ffffff' : '#64748b',
              transform: isActive ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
              transition: 'all 0.1s ease-out',
              textShadow: isActive ? '0 0 25px rgba(56,189,248,0.8)' : 'none',
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
