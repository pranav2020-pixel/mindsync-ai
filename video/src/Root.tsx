import React from 'react';
import { Composition } from 'remotion';
import { MainVideo } from './MainVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MindSyncPromo"
      component={MainVideo}
      durationInFrames={720} // 24 seconds at 30 fps
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        appUrl: 'mindsync-ai-six.vercel.app',
      }}
    />
  );
};
