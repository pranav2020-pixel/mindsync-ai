import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, config: { damping: 14 } });
  const graphProgress = interpolate(frame, [15, 90], [0, 320], { extrapolateRight: 'clamp' });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 100px' }}>
      <div
        style={{
          width: 1080,
          background: '#090e1c',
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 40px 80px -20px rgba(0,0,0,0.9), 0 0 50px rgba(14,165,233,0.3)',
          padding: 36,
          transform: `scale(${0.9 + entrance * 0.1}) translateY(${(1 - entrance) * 50}px)`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 14, color: '#38bdf8', fontWeight: 800 }}>ANALYTICS & BIOMETRICS</div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0 }}>Weekly Cognitive Vector</h2>
          </div>
          <div style={{ padding: '8px 20px', background: 'rgba(16,185,129,0.2)', color: '#34d399', borderRadius: 20, fontWeight: 800, fontSize: 16 }}>
            🔥 14-Day Streak Active
          </div>
        </div>

        {/* Dynamic Vector Curve */}
        <div style={{ height: 160, background: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 20, position: 'relative', overflow: 'hidden' }}>
          <svg style={{ width: '100%', height: '100%', overflow: 'visible' }} viewBox="0 0 320 60">
            <defs>
              <linearGradient id="remotionG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M 0 45 Q 40 25, 80 35 T 160 18 T 240 25 T 320 6 L 320 60 L 0 60 Z" fill="url(#remotionG)" />
            <path d="M 0 45 Q 40 25, 80 35 T 160 18 T 240 25 T 320 6" fill="none" stroke="#38bdf8" strokeWidth="4" strokeDasharray="320" strokeDashoffset={320 - graphProgress} />
          </svg>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 24 }}>
          <div style={{ padding: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Average Clarity</div>
            <div style={{ color: '#38bdf8', fontSize: 24, fontWeight: 900 }}>94.2% Optimum</div>
          </div>
          <div style={{ padding: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Clinical Screening</div>
            <div style={{ color: '#34d399', fontSize: 24, fontWeight: 900 }}>GAD-7 Normal</div>
          </div>
          <div style={{ padding: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 16 }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Privacy Security</div>
            <div style={{ color: '#a78bfa', fontSize: 24, fontWeight: 900 }}>AES-256 E2E</div>
          </div>
        </div>
      </div>
    </div>
  );
};
