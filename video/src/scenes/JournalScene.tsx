import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneMockup } from '../components/PhoneMockup';

export const JournalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardPop = spring({ frame, fps, config: { damping: 10 } });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80 }}>
      <PhoneMockup title="Private AI Journal" badge="Encrypted" rotationY={-12} scale={1.1}>
        <div style={{ padding: 18, background: 'rgba(14,165,233,0.15)', borderRadius: 20, border: '1px solid rgba(14,165,233,0.3)' }}>
          <div style={{ fontSize: 12, color: '#38bdf8', fontWeight: 700 }}>🔒 ZERO-KNOWLEDGE ENCRYPTION</div>
          <p style={{ color: '#fff', fontSize: 15, fontWeight: 500, lineHeight: 1.4, margin: '8px 0 0 0' }}>
            "Today I prioritized mindfulness and achieved deep cognitive focus."
          </p>
        </div>
      </PhoneMockup>

      {/* Floating 3D Badge */}
      <div
        style={{
          width: 380,
          background: 'rgba(13,22,45,0.9)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24,
          border: '1px solid rgba(56,189,248,0.4)',
          padding: 28,
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(14,165,233,0.3)',
          transform: `translateZ(80px) scale(${cardPop})`,
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🛡️</div>
        <h3 style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: 0 }}>AES-256 Client Encryption</h3>
        <p style={{ color: '#94a3b8', fontSize: 15, marginTop: 8 }}>
          Your mental wellness reflections are completely private. Only you hold the decryption key.
        </p>
      </div>
    </div>
  );
};
