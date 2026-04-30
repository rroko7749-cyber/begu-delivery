import { registerRoot } from 'remotion';
import { PromoVideo } from './compositions/PromoVideo';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);
