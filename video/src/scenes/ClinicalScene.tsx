import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PhoneMockup } from '../components/PhoneMockup';

export const ClinicalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scoreAnim = spring({ frame: frame - 20, fps, config: { damping: 12 } });

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 80 }}>
      <div style={{ maxWidth: 450 }}>
        <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(168,85,247,0.2)', borderRadius: 20, color: '#c084fc', fontWeight: 800, fontSize: 14, marginBottom: 16 }}>
          🩺 EVIDENCE-BASED SCREENING
        </div>
        <h2 style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: 0 }}>
          Standardized<br />Clinical Tests.
        </h2>
        <p style={{ color: '#94a3b8', fontSize: 18, marginTop: 14 }}>
          Validated depression (PHQ-9), anxiety (GAD-7), and stress (PSS) assessments with instant clinical severity scoring.
        </p>
      </div>

      <PhoneMockup title="GAD-7 Assessment" badge="Score: 4/21" rotationY={14} scale={1.1}>
        <div style={{ padding: 18, background: 'rgba(168,85,247,0.15)', borderRadius: 20, border: '1px solid rgba(168,85,247,0.3)' }}>
          <div style={{ fontSize: 12, color: '#c084fc', fontWeight: 700 }}>CLINICAL ANXIETY INVENTORY</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Mild (Normal)</span>
            <span style={{ color: '#34d399', fontWeight: 800, fontSize: 18 }}>Safe</span>
          </div>
          <div style={{ height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 10, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${scoreAnim * 24}%`, background: '#34d399', borderRadius: 10 }} />
          </div>
        </div>
      </PhoneMockup>
    </div>
  );
};
