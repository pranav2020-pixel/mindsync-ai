import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const OutroScene: React.FC<{ appUrl: string }> = ({ appUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* MindSync Logo */}
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: 32,
          background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 25px 60px rgba(14,165,233,0.5)',
          transform: `scale(${scale})`,
          marginBottom: 28,
        }}
      >
        <svg style={{ width: 56, height: 56, color: '#fff' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
          <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
          <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
        </svg>
      </div>

      <h1 style={{ fontSize: 64, fontWeight: 900, color: '#fff', letterSpacing: -2, margin: 0 }}>
        MindSync AI
      </h1>
      <p style={{ fontSize: 24, color: '#94a3b8', marginTop: 12 }}>
        Install on iOS, Android & Desktop in 1-Tap.
      </p>

      <div style={{ marginTop: 36, padding: '16px 40px', background: 'linear-gradient(90deg, #0ea5e9, #8b5cf6)', borderRadius: 24, color: '#fff', fontSize: 24, fontWeight: 800, boxShadow: '0 15px 40px rgba(14,165,233,0.4)' }}>
        {appUrl}
      </div>
    </div>
  );
};
