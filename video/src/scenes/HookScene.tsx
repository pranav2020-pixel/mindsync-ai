import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneMockup } from '../components/PhoneMockup';

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleProgress = spring({ frame, fps, config: { damping: 12 } });
  const rotY = interpolate(frame, [0, 150], [25, 8]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 140px' }}>
      {/* Kinetic Big Title */}
      <div style={{ maxWidth: 700, transform: `translateY(${(1 - titleProgress) * 40}px)`, opacity: titleProgress }}>
        <div style={{ display: 'inline-block', padding: '8px 18px', background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 30, color: '#38bdf8', fontWeight: 800, fontSize: 16, marginBottom: 20 }}>
          ⚡ MINDSYNC AI &bull; NEXT-GEN RESILIENCE
        </div>
        <h1 style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.05, color: '#fff', letterSpacing: -2, margin: 0 }}>
          STOP SCATTERED<br />
          <span style={{ color: '#38bdf8', textShadow: '0 0 40px rgba(56,189,248,0.5)' }}>THOUGHTS.</span>
        </h1>
        <p style={{ fontSize: 24, color: '#94a3b8', marginTop: 20, fontWeight: 500 }}>
          Your private cognitive companion on iOS, Android & Desktop.
        </p>
      </div>

      {/* 3D Floating Phone */}
      <PhoneMockup title="MindSync AI" badge="Live PWA" rotationY={rotY} scale={1.05}>
        <div style={{ padding: 18, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 20 }}>
          <div style={{ fontSize: 13, color: '#38bdf8', fontWeight: 700 }}>✨ AI REFLECTION</div>
          <div style={{ fontSize: 16, color: '#fff', fontWeight: 600, marginTop: 8 }}>
            "Breaking through mental fatigue and regaining clarity."
          </div>
          <div style={{ fontSize: 12, color: '#38bdf8', marginTop: 8 }}>Sentiment: Focused 94%</div>
        </div>
        <div style={{ padding: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 16, color: '#cbd5e1', fontSize: 14, display: 'flex', justifyContent: 'space-between' }}>
          <span>🧘 Daily Mindfulness</span>
          <span style={{ color: '#10b981', fontWeight: 700 }}>✓ Done</span>
        </div>
      </PhoneMockup>
    </div>
  );
};
