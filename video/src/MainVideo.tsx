import React from 'react';
import { AbsoluteFill, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { HookScene } from './scenes/HookScene';
import { DashboardScene } from './scenes/DashboardScene';
import { JournalScene } from './scenes/JournalScene';
import { ClinicalScene } from './scenes/ClinicalScene';
import { OutroScene } from './scenes/OutroScene';
import { KineticCaptions } from './components/KineticCaptions';

export const MainVideo: React.FC<{ appUrl: string }> = ({ appUrl }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#03050e', overflow: 'hidden' }}>
      {/* Background Radial Aurora */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse at 50% 35%, #0f1f45 0%, #060a18 55%, #010207 100%)',
        }}
      />

      {/* WhisperX Style Animated Kinetic Subtitles */}
      <KineticCaptions />

      {/* Scene 1: The Hook (0 - 150 frames = 0-5s) */}
      <Sequence from={0} durationInFrames={150}>
        <HookScene />
      </Sequence>

      {/* Scene 2: The Dashboard & Analytics (150 - 300 frames = 5-10s) */}
      <Sequence from={150} durationInFrames={150}>
        <DashboardScene />
      </Sequence>

      {/* Scene 3: Encrypted AI Journal (300 - 450 frames = 10-15s) */}
      <Sequence from={300} durationInFrames={150}>
        <JournalScene />
      </Sequence>

      {/* Scene 4: Clinical Screenings GAD-7 & PHQ-9 (450 - 600 frames = 15-20s) */}
      <Sequence from={450} durationInFrames={150}>
        <ClinicalScene />
      </Sequence>

      {/* Scene 5: Multi-OS Lineup & CTA (600 - 720 frames = 20-24s) */}
      <Sequence from={600} durationInFrames={120}>
        <OutroScene appUrl={appUrl} />
      </Sequence>
    </AbsoluteFill>
  );
};
