
import React, { useState, useCallback } from 'react';
import type { Level, Players } from './types';
import { LEVEL_DETAILS } from './types';
import GameScreen from './components/GameScreen';
import PlayerSetup from './components/PlayerSetup';
import DynamicBackground from './components/DynamicBackground';
import ChallengeEditor from './components/ChallengeEditor';
import { AnimatePresence, motion } from 'framer-motion';

const InstructionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center tracking-wider">
          🎮 游戏玩法说明
        </h2>
        
        <div className="space-y-6 text-white/80 leading-relaxed text-sm md:text-base">
          <div>
            <h3 className="text-purple-400 font-bold text-lg mb-2">基本规则</h3>
            <p>两人轮流进行回合，每回合可选择 <span className="text-pink-300 font-bold">真心话</span> 或 <span className="text-purple-300 font-bold">大冒险</span>。题目会根据你们的 <span className="text-yellow-300">Top/Bottom</span> 角色自动调整，请代入角色享受过程。</p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/5">
            <h3 className="text-yellow-400 font-bold text-lg mb-2 flex items-center gap-2">
              <span>🏆</span> 奖励机制 (新!)
            </h3>
            <ul className="space-y-3 list-disc list-inside marker:text-yellow-500">
              <li>
                <span className="text-white font-semibold">连胜奖励：</span>
                每当一方完成 <span className="font-bold text-white">3轮</span> 挑战，下一回合将获得<span className="text-yellow-300">支配权</span>。
              </li>
              <li>
                <span className="text-white font-semibold">初级支配：</span>
                强制指定对方下一轮必须选择真心话还是大冒险。
              </li>
              <li>
                <span className="text-white font-semibold">终极支配 (第12轮)：</span>
                你可以<span className="text-red-400 font-bold">完全自定义</span>对方的挑战内容，或者指定任意模式！
              </li>
            </ul>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-8 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-purple-900/40"
        >
          我明白了，开始游戏
        </button>
      </motion.div>
    </div>
  );
};

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
  const [showInstructions, setShowInstructions] = useState(false);

  const handleGameStart = (newPlayers: Players) => {
    setPlayers(newPlayers);
    setShowInstructions(true); // Show instructions first
  };

  const handleInstructionsClose = () => {
    setShowInstructions(false);
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
      
      <AnimatePresence>
        {showInstructions && <InstructionModal onClose={handleInstructionsClose} />}
      </AnimatePresence>

      <div className="w-full max-w-5xl mx-auto">
        {gameState === 'setup' && !showInstructions && <PlayerSetup onStartGame={handleGameStart} />}
        {gameState === 'levelSelect' && <LevelSelector onSelectLevel={handleLevelSelect} />}
        {gameState === 'game' && players && selectedLevel && (
            <GameScreen level={selectedLevel} onBack={handleBackToLevelSelect} players={players} onChangeLevel={handleChangeLevel} />
        )}
      </div>

       {gameState !== 'setup' && !showInstructions && (
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
