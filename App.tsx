
import React, { useState, useCallback, useEffect } from 'react';
import type { Level, Players } from './types';
import { LEVEL_DETAILS } from './types';
import GameScreen from './components/GameScreen';
import PlayerSetup from './components/PlayerSetup';
import DynamicBackground from './components/DynamicBackground';
import ChallengeEditor from './components/ChallengeEditor';
import { AnimatePresence, motion } from 'framer-motion';

const CURRENT_VERSION = 'v0.9';

const ChangelogModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-gray-900 border border-purple-500/30 rounded-2xl max-w-md w-full p-6 md:p-8 shadow-[0_0_40px_rgba(168,85,247,0.2)] relative overflow-hidden"
      >
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white tracking-wide flex items-center gap-2">
              <span className="text-2xl">✨</span> 
              <span>版本更新</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30">
                {CURRENT_VERSION}
              </span>
            </h2>
          </div>
          
          <div className="space-y-6 text-white/80">
            
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h3 className="text-purple-300 font-bold mb-2 flex items-center gap-2">
                🃏 灵动交互 (UI Polish)
              </h3>
              <ul className="text-sm space-y-2 list-disc list-inside text-gray-300">
                <li><span className="text-white font-medium">独立悬浮</span>：卡牌不再僵硬，每张牌都有自己的呼吸节奏。</li>
                <li><span className="text-white font-medium">视差拖拽</span>：左右拖动时，体验真实的扇形物理手感。</li>
                <li><span className="text-white font-medium">触碰反馈</span>：点击或悬停时，卡牌会灵动响应。</li>
              </ul>
            </div>

            <div className="p-2">
              <h3 className="text-pink-300 font-bold mb-2 flex items-center gap-2 text-sm uppercase tracking-wider opacity-80">
                🤖 近期回顾 (v0.5)
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                引入了 <strong>AI 智能发牌</strong>，当卡牌耗尽时，可以根据你们的喜好即时生成新挑战。
              </p>
            </div>

          </div>

          <button 
            onClick={onClose}
            className="w-full mt-8 py-3 bg-white text-black font-bold text-lg rounded-xl hover:bg-gray-200 transition-colors shadow-lg"
          >
            开始体验
          </button>
        </div>
      </motion.div>
    </div>
  );
};

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
    <div className="text-center text-white p-4 animate-fade-in flex flex-col items-center">
      <div className="relative mb-12 mt-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-br from-white via-pink-100 to-purple-200 drop-shadow-sm">
            真心话大冒险
          </h1>
          <div className="absolute -bottom-6 right-0 md:-bottom-8 md:-right-4 transform -rotate-6">
              <span className="font-handwriting text-3xl md:text-5xl text-pink-400 font-bold tracking-wide" style={{ textShadow: '0 2px 10px rgba(244, 114, 182, 0.4)' }}>
                  with love
              </span>
          </div>
          <div className="absolute -top-4 -right-8 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg transform rotate-12 border border-white/20">
              {CURRENT_VERSION}
          </div>
      </div>

      <p className="text-lg md:text-xl text-white/80 mb-12">选择一个级别，开始心跳之旅</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
        {(Object.keys(LEVEL_DETAILS) as Level[]).map((levelKey) => {
          const level = LEVEL_DETAILS[levelKey];
          return (
            <button
              key={levelKey}
              onClick={() => onSelectLevel(levelKey)}
              className={`p-8 rounded-2xl transition-all duration-300 ease-in-out text-white font-bold hover:scale-105 transform ${level.flatClassName}`}
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
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
      // Check version on mount
      const lastSeenVersion = localStorage.getItem('app_version');
      if (lastSeenVersion !== CURRENT_VERSION) {
          setShowChangelog(true);
      }
      
      // Update document title dynamically just in case
      document.title = `真心话大冒险 with love ${CURRENT_VERSION}`;
  }, []);

  const handleCloseChangelog = () => {
      localStorage.setItem('app_version', CURRENT_VERSION);
      setShowChangelog(false);
  };

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
        {showChangelog && <ChangelogModal onClose={handleCloseChangelog} />}
      </AnimatePresence>

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

      <footer onClick={handleFooterClick} className="absolute bottom-4 text-white/40 text-sm font-sans cursor-pointer select-none flex gap-2">
        <p>Created with love</p>
        <span className="opacity-50">• {CURRENT_VERSION}</span>
      </footer>
    </main>
  );
}
