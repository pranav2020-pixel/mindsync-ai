import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const PhoneMockup: React.FC<{
  title: string;
  badge: string;
  children: React.ReactNode;
  rotationY?: number;
  rotationX?: number;
  scale?: number;
}> = ({ title, badge, children, rotationY = 12, rotationX = 4, scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  return (
    <div
      style={{
        transform: `perspective(1200px) rotateY(${rotationY}deg) rotateX(${rotationX}deg) scale(${entrance * scale})`,
        transformStyle: 'preserve-3d',
        width: 320,
        height: 640,
        background: '#090d18',
        borderRadius: 48,
        border: '4px solid #334155',
        boxShadow: '0 30px 60px -15px rgba(0,0,0,0.8), 0 0 30px rgba(14,165,233,0.3)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Dynamic Island */}
      <div
        style={{
          width: 90,
          height: 24,
          background: '#000',
          borderRadius: 20,
          margin: '0 auto 12px auto',
        }}
      />
      {/* Screen Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, color: '#fff' }}>{title}</span>
        <span style={{ color: '#38bdf8', fontWeight: 600 }}>{badge}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  );
};
