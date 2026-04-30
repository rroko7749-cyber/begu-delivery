import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const PromoVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Анимация появления логотипа
  const logoScale = spring({
    frame,
    fps,
    config: {
      damping: 100,
    },
  });

  // Анимация текста
  const textOpacity = interpolate(
    frame,
    [30, 60],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Анимация фона
  const bgColor = interpolate(
    frame,
    [0, 150],
    [0, 1],
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `hsl(${bgColor * 200}, 70%, 50%)`,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Логотип */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          fontSize: 120,
          fontWeight: 'bold',
          color: 'white',
          textShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        🏃 БегуДоставка
      </div>

      {/* Слоган */}
      <div
        style={{
          opacity: textOpacity,
          fontSize: 40,
          color: 'white',
          marginTop: 40,
          textAlign: 'center',
        }}
      >
        Доставка на скорости света
      </div>

      {/* Преимущества */}
      {frame > 90 && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            display: 'flex',
            gap: 60,
            opacity: interpolate(frame, [90, 120], [0, 1]),
          }}
        >
          <Feature icon="⚡" text="Быстро" />
          <Feature icon="💰" text="Выгодно" />
          <Feature icon="🔒" text="Надёжно" />
        </div>
      )}
    </AbsoluteFill>
  );
};

const Feature = ({ icon, text }) => (
  <div style={{ textAlign: 'center', color: 'white' }}>
    <div style={{ fontSize: 60 }}>{icon}</div>
    <div style={{ fontSize: 24, marginTop: 10 }}>{text}</div>
  </div>
);
