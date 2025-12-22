
import React from 'react';
import type { Level } from '../types';

interface DynamicBackgroundProps {
  level: Level;
}

const backgroundColors: Record<Level, string> = {
  gentle: '#0f172a', // Slate 900 (Deep mysterious blue/black)
  warming: '#431407', // Deep Orange/Brown
  intimate: '#4a044e' // Deep Fuchsia/Purple
};

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ level }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        backgroundColor: backgroundColors[level],
        transition: 'background-color 1.5s ease-in-out'
      }}
    />
  );
};

export default DynamicBackground;
