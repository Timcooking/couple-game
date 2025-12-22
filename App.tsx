
import React, { useState, useCallback } from 'react';
import type { Level, Players } from './types';
import { LEVEL_DETAILS } from './types';
import GameScreen from './components/GameScreen';
import PlayerSetup from './components/PlayerSetup';
import DynamicBackground from './components/DynamicBackground';
import ChallengeEditor from './components/ChallengeEditor';

const LevelSelector: React.FC<{ onSelectLevel: (level: Level) => void }> = ({ onSelectLevel }) => {
  return (
    <div className="text-center text-white p-4 animate-fade-in">
      <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-wider">情侣真心话大冒险</h1>
      <p className="text-lg md:text-xl text-white/80 mb-12">选择一个级别，开始心跳之旅</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {(Object.keys(LEVEL_DETAILS) as Level[]).map((levelKey) => {
          const level = LEVEL_DETAILS[levelKey];
          return (
            <button
              key={levelKey}
              onClick={() => onSelectLevel(levelKey)}
              className={`p-8 rounded-2xl transition-colors duration-300 ease-in-out text-white font-bold ${level.flatClassName}`}
            >
              <h2 className="text-2xl">{level.name}</h2>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<'setup' | 'levelSelect' | 'game'>('setup');
  const [players, setPlayers] = useState<Players | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [editorVisible, setEditorVisible] = useState(false);
  const [footerClicks, setFooterClicks] = useState(0);

  const handleGameStart = (newPlayers: Players) => {
    setPlayers(newPlayers);
    setGameState('levelSelect');
  };

  const handleLevelSelect = (level: Level) => {
    setSelectedLevel(level);
    setGameState('game');
  };

  const handleChangeLevel = (newLevel: Level) => {
    setSelectedLevel(newLevel);
  };

  const handleBackToLevelSelect = () => {
    setGameState('levelSelect');
    setSelectedLevel(null);
  };

  const handleReset = () => {
      setGameState('setup');
      setPlayers(null);
      setSelectedLevel(null);
  };

  const handleFooterClick = useCallback(() => {
    const newClicks = footerClicks + 1;
    setFooterClicks(newClicks);
    if (newClicks >= 5) {
      setEditorVisible(true);
      setFooterClicks(0); // Reset after opening
    }
  }, [footerClicks]);


  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <DynamicBackground level={selectedLevel ?? 'gentle'} />
      {editorVisible && <ChallengeEditor onClose={() => setEditorVisible(false)} />}
      <div className="w-full max-w-5xl mx-auto">
        {gameState === 'setup' && <PlayerSetup onStartGame={handleGameStart} />}
        {gameState === 'levelSelect' && <LevelSelector onSelectLevel={handleLevelSelect} />}
        {gameState === 'game' && players && selectedLevel && (
            <GameScreen level={selectedLevel} onBack={handleBackToLevelSelect} players={players} onChangeLevel={handleChangeLevel} />
        )}
      </div>

       {gameState !== 'setup' && (
         <button 
          onClick={handleReset} 
          className="absolute top-4 left-4 text-white/50 hover:text-white transition-colors text-sm font-sans z-30"
          aria-label="Reset Game"
        >
           重置游戏
         </button>
       )}

      <footer onClick={handleFooterClick} className="absolute bottom-4 text-white/40 text-sm font-sans cursor-pointer select-none">
        <p>Created with love</p>
      </footer>
    </main>
  );
}