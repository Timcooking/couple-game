
import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { getPersonalizedDeck, reorderDeckBasedOnFeedback, type Challenge } from '../services/geminiService';
import type { Level, Players, Mode } from '../types';
import { LEVEL_DETAILS } from '../types';
import ChallengeCard from './ChallengeCard';
import HeartIcon from './icons/HeartIcon';
import FireIcon from './icons/FireIcon';
import HistoryIcon from './icons/HistoryIcon';
import RefreshIcon from './icons/RefreshIcon';


interface GameScreenProps {
  level: Level;
  onBack: () => void;
  players: Players;
  onChangeLevel: (newLevel: Level) => void;
}

interface HistoryItem {
  round: number;
  player: string;
  mode: Mode;
  text: string;
  level: Level;
  timestamp: string;
}

interface PenaltyState {
    mode?: Mode;
    customText?: string;
    sourcePlayerName: string;
}

const parseChallenge = (rawText: string): { text: string; duration: number | null } => {
    const timerMatch = rawText.match(/\[TIME:(\d+)\]/);
    if (timerMatch) {
        const duration = parseInt(timerMatch[1], 10);
        const text = rawText.replace(/\[TIME:(\d+)\]/, '').trim();
        return { text, duration };
    }
    return { text: rawText, duration: null };
};

const findSuitableCardIndex = (deck: Challenge[], otherPlayerName: string): number => {
    // Find first card that doesn't start with other player's name
    const idx = deck.findIndex(card => !card.text.trim().startsWith(otherPlayerName));
    return idx === -1 ? 0 : idx; 
};

const GameScreen: React.FC<GameScreenProps> = ({ level, onBack, players, onChangeLevel }) => {
  const [truthDeck, setTruthDeck] = useState(() => getPersonalizedDeck(level, players, 'truth'));
  const [dareDeck, setDareDeck] = useState(() => getPersonalizedDeck(level, players, 'dare'));
  const [turn, setTurn] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState<{ mode: Mode; text: string; duration: number | null } | null>(null);
  const [isSelecting, setIsSelecting] = useState<Mode | null>(null);
  const [showLevelUpPrompt, setShowLevelUpPrompt] = useState(false);
  const [promptShown, setPromptShown] = useState(false);
  
  // Reward System State
  const [playerCompletedCounts, setPlayerCompletedCounts] = useState<Record<string, number>>({
      [players.player1.name]: 0,
      [players.player2.name]: 0
  });
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [activePenalty, setActivePenalty] = useState<PenaltyState | null>(null);
  const [customInputText, setCustomInputText] = useState('');

  // Reroll state
  const [hasRerolled, setHasRerolled] = useState(false);

  // Feedback state
  const [feedbackGiven, setFeedbackGiven] = useState<'like' | 'dislike' | null>(null);
  
  // New features state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLevelMenu, setShowLevelMenu] = useState(false);

  // Get current level style details
  const { borderColor } = LEVEL_DETAILS[level];

  // Animation values for the fan
  const x = useMotionValue(0);
  // Map drag x to rotation: dragging 200px rotates 30 degrees
  const rotateInput = useTransform(x, [-200, 200], [-30, 30]);
  const rotate = useSpring(rotateInput, { stiffness: 400, damping: 30 });


  useEffect(() => {
    // Turn 10 (5 rounds each): Show optional prompt.
    if (level === 'gentle' && turn === 10 && !promptShown) {
      setShowLevelUpPrompt(true);
      setPromptShown(true); 
    }
    
    // Turn 12 (6 rounds each): Force upgrade if still on gentle.
    if (level === 'gentle' && turn === 12) {
      onChangeLevel('warming');
    }
  }, [turn, level, promptShown, onChangeLevel]);

  const currentPlayer = useMemo(() => (turn % 2 === 0 ? players.player1 : players.player2), [turn, players]);
  const nextPlayer = useMemo(() => (turn % 2 === 0 ? players.player2 : players.player1), [turn, players]);

  // Determine if there is an active penalty for the CURRENT turn
  useEffect(() => {
      if (activePenalty && !currentChallenge && !isSelecting) {
          // If custom text, set it immediately
          if (activePenalty.customText) {
             const timerMatch = activePenalty.customText.match(/\[TIME:(\d+)\]/);
             let duration = null;
             let text = activePenalty.customText;
             if (timerMatch) {
                 duration = parseInt(timerMatch[1], 10);
                 text = activePenalty.customText.replace(/\[TIME:(\d+)\]/, '').trim();
             }
             
             // Small delay for effect
             setTimeout(() => {
                 setCurrentChallenge({ mode: activePenalty.mode || 'dare', text, duration });
             }, 500);
          } else if (activePenalty.mode) {
              // If forced mode, automatically select that mode
              selectChallenge(activePenalty.mode, true);
          }
      }
  }, [activePenalty, turn]);


  const selectChallenge = (mode: Mode, isForced = false) => {
    // Prevent selection during animation
    if ((isSelecting || currentChallenge) && !isForced) return;
    
    setIsSelecting(mode);
    setFeedbackGiven(null);
    setHasRerolled(false); // Reset reroll chance

    setTimeout(() => {
        let deck = mode === 'truth' ? truthDeck : dareDeck;
        
        // Auto-refill if empty
        if (deck.length === 0) {
            deck = getPersonalizedDeck(level, players, mode);
        }
        
        if (deck.length === 0) {
             setIsSelecting(null); 
             return;
        }

        const otherPlayer = turn % 2 === 0 ? players.player2 : players.player1;
        
        // Find a card suitable for the current player (one that doesn't start with the other player's name)
        const selectedIndex = findSuitableCardIndex(deck, otherPlayer.name);
        const drawnCard = deck[selectedIndex];
        
        // Remove the selected card from the deck immediately
        const newDeck = [...deck];
        newDeck.splice(selectedIndex, 1);
        
        if (mode === 'truth') setTruthDeck(newDeck);
        else setDareDeck(newDeck);
        
        const { text, duration } = parseChallenge(drawnCard.text);
        setCurrentChallenge({ mode: drawnCard.mode, text, duration });
    }, 600); // Slightly longer for the exit animation
  };

  const handleReroll = () => {
    if (!currentChallenge || currentChallenge.mode !== 'dare' || hasRerolled) return;

    // dareDeck acts as the draw pile (remaining cards)
    let deck = dareDeck;
    if (deck.length === 0) return; 

    const otherPlayer = turn % 2 === 0 ? players.player2 : players.player1;
    const nextIndex = findSuitableCardIndex(deck, otherPlayer.name);
    const nextCard = deck[nextIndex];

    const newDeck = [...deck];
    newDeck.splice(nextIndex, 1);
    
    setDareDeck(newDeck);

    const { text, duration } = parseChallenge(nextCard.text);
    setCurrentChallenge({ mode: nextCard.mode, text, duration });
    setHasRerolled(true);
    setFeedbackGiven(null); // Reset feedback for the new card
  };

  const handleFeedback = (type: 'like' | 'dislike') => {
      if (!currentChallenge || feedbackGiven) return;
      setFeedbackGiven(type);
      
      // We reorder the REMAINING deck (draw pile)
      const deck = currentChallenge.mode === 'truth' ? truthDeck : dareDeck;
      // Pass the current player's name so we only reorder THEIR cards
      const reordered = reorderDeckBasedOnFeedback(deck, currentChallenge.text, type, currentPlayer.name);
      
      if (currentChallenge.mode === 'truth') setTruthDeck(reordered);
      else setDareDeck(reordered);
  };

  const proceedToNextTurn = () => {
    setTurn(t => t + 1);
    setCurrentChallenge(null);
    setIsSelecting(null);
    setFeedbackGiven(null);
    setHasRerolled(false);
    
    // Clear penalty if it was active for this turn
    if (activePenalty) {
        setActivePenalty(null);
    }
  };

  const handleRewardSelection = (selection: { mode?: Mode; customText?: string }) => {
      setActivePenalty({
          mode: selection.mode,
          customText: selection.customText,
          sourcePlayerName: currentPlayer.name
      });
      setShowRewardModal(false);
      setCustomInputText('');
      proceedToNextTurn();
  };

  const nextTurn = () => {
    if (!currentChallenge) return;

    // Record History
    setHistory(prev => [{
        round: Math.floor(turn / 2) + 1,
        player: currentPlayer.name,
        mode: currentChallenge.mode,
        text: currentChallenge.text,
        level: level,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }, ...prev]);

    // Update completed count for current player
    const newCount = (playerCompletedCounts[currentPlayer.name] || 0) + 1;
    setPlayerCompletedCounts(prev => ({
        ...prev,
        [currentPlayer.name]: newCount
    }));

    // Check for Reward Trigger
    // Trigger every 3rd completion (3, 6, 9, 12...)
    if (newCount > 0 && newCount % 3 === 0) {
        setShowRewardModal(true);
        // Do not proceed to next turn yet, wait for modal choice
    } else {
        proceedToNextTurn();
    }
  };

  useEffect(() => {
    setTruthDeck(getPersonalizedDeck(level, players, 'truth'));
    setDareDeck(getPersonalizedDeck(level, players, 'dare'));
  }, [level, players]);

  // Determine reward tier
  const currentStreak = playerCompletedCounts[currentPlayer.name] || 0;
  // Tier 2 happens on the 12th completion and every 3rd completion after that (12, 15, 18...)
  const isTier2Reward = currentStreak >= 12;

  return (
    <div className="flex flex-col items-center w-full h-[100dvh] text-white font-sans animate-fade-in overflow-hidden touch-none relative">
      
      {/* Top Bar - Absolute */}
      <div className="absolute top-0 left-0 w-full p-3 md:p-5 z-30 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
            <button
            onClick={onBack}
            className="text-white/60 hover:text-white transition-colors duration-300 text-base md:text-lg font-sans flex items-center gap-1 bg-black/20 p-2 rounded-lg backdrop-blur-sm"
            >
            <span>&larr;</span> 返回
            </button>
            <button
                onClick={() => setShowHistory(true)}
                className="text-white/60 hover:text-white transition-colors duration-300 p-2 rounded-full hover:bg-white/10 bg-black/20 backdrop-blur-sm"
                title="历史记录"
            >
                <HistoryIcon className="w-5 h-5 md:w-6 md:h-6" />
            </button>
        </div>

        <div className="relative pointer-events-auto">
            <button 
                onClick={() => setShowLevelMenu(!showLevelMenu)}
                className="group flex flex-col items-end text-right transition-opacity hover:opacity-100 opacity-90 bg-black/20 p-2 rounded-lg backdrop-blur-sm"
            >
                <h2 className="text-[10px] md:text-xs font-bold text-white/60 uppercase tracking-wider mb-0.5 group-hover:text-white/80">
                    当前级别
                </h2>
                <div className="flex items-center gap-2">
                    <span className={`text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${LEVEL_DETAILS[level].className.replace(/hover:.*? /g, '')}`}>
                        {LEVEL_DETAILS[level].name}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 md:w-5 md:h-5 text-white/50 transition-transform duration-300 ${showLevelMenu ? 'rotate-180' : ''}`}>
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                </div>
            </button>

            <AnimatePresence>
                {showLevelMenu && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-40 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden py-1 z-40"
                    >
                        {(Object.keys(LEVEL_DETAILS) as Level[]).map((lvl) => (
                            <button
                                key={lvl}
                                onClick={() => {
                                    onChangeLevel(lvl);
                                    setShowLevelMenu(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between
                                    ${level === lvl ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                {LEVEL_DETAILS[lvl].name}
                                {level === lvl && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
         </div>
      </div>

      {/* Main Flex Column */}
      <div className="flex flex-col w-full h-full pt-20 pb-2 px-4">
        
        {/* Info Area: Round & Player */}
        <div className="shrink-0 flex flex-col items-center justify-center mb-4 z-20">
             <div className="text-white/50 font-serif tracking-widest text-xs md:text-sm">
                第 <span className="text-white font-bold text-base md:text-xl mx-1">{Math.floor(turn / 2) + 1}</span> 回合
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white/90 mt-1">
                轮到 <span className="text-yellow-300">{currentPlayer.name}</span>
            </h2>
            {activePenalty && !currentChallenge && (
                <div className="mt-2 px-3 py-1 bg-red-900/50 border border-red-500/30 rounded-full animate-pulse">
                    <span className="text-xs md:text-sm text-red-200">
                        ⚠️ 被 <span className="font-bold">{activePenalty.sourcePlayerName}</span> 强制指定中
                    </span>
                </div>
            )}
        </div>

        {/* Game Content Area (Flex Grow) */}
        <div className="flex-1 w-full flex items-center justify-center relative perspective-[1200px] min-h-0">
             <AnimatePresence mode="wait">
                {!currentChallenge && !isSelecting ? (
                <motion.div
                    key="drawing"
                    className="w-full h-full flex flex-col items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Rotatable Fan Container - Hide if penalty active */}
                    {!activePenalty && (
                        <motion.div 
                            className="relative w-full h-48 md:h-80 flex items-center justify-center"
                            style={{ x, rotate }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.1}
                        >
                            {Array.from({ length: 9 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className={`absolute w-40 h-52 md:w-64 md:h-80 bg-black/40 border-2 ${borderColor} rounded-2xl shadow-lg flex items-center justify-center backdrop-blur-sm transition-colors duration-1000`}
                                style={{ 
                                originX: '50%', 
                                originY: '200%', // Pivot point lower
                                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
                                backgroundSize: '10px 10px',
                                }}
                                initial={{
                                rotate: (i - 4) * 10,
                                y: Math.abs(i - 4) * 5,
                                }}
                                animate={{
                                    rotate: (i - 4) * 10,
                                    y: Math.abs(i - 4) * 5,
                                    scale: [1, 1.02, 1],
                                }}
                                transition={{
                                    scale: {
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: i * 0.1
                                    }
                                }}
                            />
                            ))}
                        </motion.div>
                    )}

                    {/* Static Buttons below the fan */}
                    {!activePenalty ? (
                        <motion.div 
                            className="flex gap-4 md:gap-8 relative z-10 mt-8 md:mt-16"
                        >
                            <button
                                onClick={() => selectChallenge('truth')}
                                className={`group flex flex-col items-center gap-1 md:gap-2 px-6 py-3 md:px-10 md:py-4 bg-black/40 hover:bg-black/60 text-white font-bold text-lg md:text-xl rounded-xl border-2 ${borderColor} transition-all duration-300 ease-in-out backdrop-blur-sm`}
                            >
                                <HeartIcon className="w-6 h-6 md:w-8 md:h-8 text-pink-400/60 group-hover:text-pink-400 transition-colors" />
                                真心话
                            </button>
                            <button
                                onClick={() => selectChallenge('dare')}
                                className={`group flex flex-col items-center gap-1 md:gap-2 px-6 py-3 md:px-10 md:py-4 bg-black/40 hover:bg-black/60 text-white font-bold text-lg md:text-xl rounded-xl border-2 ${borderColor} transition-all duration-300 ease-in-out backdrop-blur-sm`}
                            >
                                <FireIcon className="w-6 h-6 md:w-8 md:h-8 text-purple-400/60 group-hover:text-purple-400 transition-colors" />
                                大冒险
                            </button>
                        </motion.div>
                    ) : (
                         <motion.div 
                            className="flex flex-col items-center justify-center gap-4 relative z-10"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <div className="text-xl text-red-300 font-bold mb-4">等待审判降临...</div>
                             <div className="w-16 h-16 border-4 border-t-red-500 border-white/20 rounded-full animate-spin"></div>
                        </motion.div>
                    )}
                </motion.div>
                ) : null }

                {isSelecting && !currentChallenge && (
                <motion.div
                    key="shuffling"
                    className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                    <div className="relative w-full h-64 flex items-center justify-center">
                        {/* Rapid shuffle animation */}
                        {Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className={`absolute w-40 h-52 md:w-64 md:h-80 bg-black/50 border-2 ${borderColor} rounded-2xl shadow-lg`}
                            initial={{ scale: 0.8, x: 0, opacity: 0 }}
                            animate={{ 
                                scale: [0.8, 1, 1.1, 0.5],
                                x: [0, (i % 2 === 0 ? 100 : -100), 0],
                                opacity: [0, 1, 0],
                                rotate: [0, (i % 2 === 0 ? 10 : -10), 0]
                            }}
                            transition={{ 
                                duration: 0.6, 
                                times: [0, 0.2, 0.5, 1],
                                ease: "easeInOut" 
                            }}
                        />
                        ))}
                    </div>
                </motion.div>
                )}

                {currentChallenge ? (
                    <motion.div
                        key="card"
                        initial={{ opacity: 0, scale: 0.5, rotateY: 180 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        exit={{ opacity: 0, scale: 0.8, y: -50 }}
                        className="w-full max-w-xs md:max-w-sm h-auto aspect-[3/4] max-h-full relative z-10"
                    >
                        <div className="relative w-full h-full">
                            <ChallengeCard
                                challenge={currentChallenge.text}
                                mode={currentChallenge.mode}
                                level={level}
                                duration={currentChallenge.duration}
                                onFeedback={handleFeedback}
                                feedbackGiven={feedbackGiven}
                            />
                            
                            {/* Reroll Button (Top Right) - Only for Dare AND if NOT a penalty card */}
                            {currentChallenge.mode === 'dare' && !hasRerolled && !activePenalty && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileTap={{ rotate: 180 }}
                                    onClick={handleReroll}
                                    className="absolute -top-3 -right-3 p-3 bg-gray-800 border-2 border-white/20 rounded-full text-white shadow-lg hover:bg-gray-700 z-30"
                                    title="换一张 (仅限一次)"
                                >
                                    <RefreshIcon className="w-5 h-5" />
                                </motion.button>
                            )}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>

        {/* Footer Area */}
        <div className="shrink-0 h-16 w-full max-w-md flex flex-col justify-end items-center z-20 mt-2">
             <AnimatePresence>
                {currentChallenge && (
                    <motion.div
                        key="next"
                        className="w-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <button
                            onClick={nextTurn}
                            className="w-full py-3 px-6 bg-purple-700/80 hover:bg-purple-700 border border-purple-500/50 rounded-xl transition-all duration-300 ease-in-out text-lg md:text-xl font-semibold shadow-lg shadow-purple-900/50"
                        >
                            下一轮
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>

      {/* Reward Selection Modal */}
      <AnimatePresence>
          {showRewardModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
              >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-gray-900 w-full max-w-md p-6 rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)] relative"
                  >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-bold px-4 py-1 rounded-full text-sm shadow-lg">
                          🎉 {isTier2Reward ? "终极奖励解锁" : "连胜奖励解锁"}
                      </div>
                      
                      <h3 className="text-2xl font-bold text-center text-white mb-2 mt-2">
                          {currentPlayer.name}, 你获得了支配权!
                      </h3>
                      <p className="text-white/60 text-center mb-6 text-sm">
                          {isTier2Reward 
                            ? `你已完成${currentStreak}次挑战！现在你可以完全自定义对方的命运。` 
                            : `你已完成${currentStreak}次挑战！指定 ${nextPlayer.name} 下一轮必须做什么。`}
                      </p>

                      <div className="space-y-4">
                          <button
                            onClick={() => handleRewardSelection({ mode: 'truth' })}
                            className="w-full py-4 rounded-xl bg-pink-900/40 border border-pink-500/50 hover:bg-pink-800/40 hover:border-pink-400 transition-all flex items-center justify-center gap-3 group"
                          >
                              <HeartIcon className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />
                              <div className="text-left">
                                  <div className="font-bold text-pink-200">强制真心话</div>
                                  <div className="text-xs text-pink-400/60">从题库随机抽取</div>
                              </div>
                          </button>
                          
                          <button
                            onClick={() => handleRewardSelection({ mode: 'dare' })}
                            className="w-full py-4 rounded-xl bg-purple-900/40 border border-purple-500/50 hover:bg-purple-800/40 hover:border-purple-400 transition-all flex items-center justify-center gap-3 group"
                          >
                              <FireIcon className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                              <div className="text-left">
                                  <div className="font-bold text-purple-200">强制大冒险</div>
                                  <div className="text-xs text-purple-400/60">从题库随机抽取</div>
                              </div>
                          </button>

                          {isTier2Reward && (
                              <div className="pt-4 border-t border-white/10">
                                  <label className="block text-xs font-bold text-yellow-500 mb-2 uppercase tracking-wide">
                                      或者自定义惩罚
                                  </label>
                                  <textarea
                                    value={customInputText}
                                    onChange={(e) => setCustomInputText(e.target.value)}
                                    placeholder="输入你想让对方做的任何事..."
                                    className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-white placeholder-white/30 focus:border-yellow-500 outline-none mb-3 min-h-[80px]"
                                  />
                                  <button
                                    onClick={() => handleRewardSelection({ customText: customInputText, mode: 'dare' })}
                                    disabled={!customInputText.trim()}
                                    className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                      执行自定义惩罚
                                  </button>
                              </div>
                          )}
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* Level Up Prompt Modal */}
      <AnimatePresence>
        {showLevelUpPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border-2 border-purple-500/50 rounded-2xl shadow-xl text-center p-8 max-w-sm w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-4">气氛越来越热了...</h3>
              <p className="text-white/80 mb-8">
                {turn >= 10 ? "准备好进入下一阶段了吗？" : "准备好进入下一阶段了吗？"}
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    onChangeLevel('warming');
                    setShowLevelUpPrompt(false);
                  }}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all duration-300 bg-gradient-to-r ${LEVEL_DETAILS['warming'].className.replace(/hover:.*? /g, '')}`}
                >
                  进入 {LEVEL_DETAILS['warming'].name}
                </button>
                <button
                  onClick={() => setShowLevelUpPrompt(false)}
                  className="w-full py-3 rounded-lg font-bold text-white/70 bg-white/10 hover:bg-white/20 transition-colors"
                >
                  继续 {LEVEL_DETAILS['gentle'].name}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-50 flex items-center justify-end"
                onClick={() => setShowHistory(false)}
            >
                <motion.div 
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="w-full max-w-md h-full bg-gray-900 border-l border-white/10 shadow-2xl overflow-hidden flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gray-900">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            <HistoryIcon className="w-6 h-6 text-purple-400"/>
                            历史记录
                        </h3>
                        <button onClick={() => setShowHistory(false)} className="text-white/50 hover:text-white p-2 text-2xl">
                            &times;
                        </button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {history.length === 0 ? (
                            <div className="text-center text-white/40 mt-10">暂无记录</div>
                        ) : (
                            history.map((item, index) => (
                                <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white/70">
                                                R{item.round}
                                            </span>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                                                item.level === 'gentle' ? 'border-green-500/50 text-green-400' :
                                                item.level === 'warming' ? 'border-orange-500/50 text-orange-400' :
                                                'border-red-500/50 text-red-400'
                                            }`}>
                                                {LEVEL_DETAILS[item.level].name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-white/30 font-mono">{item.timestamp}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 flex-shrink-0 ${item.mode === 'truth' ? 'text-pink-400' : 'text-purple-400'}`}>
                                            {item.mode === 'truth' ? <HeartIcon className="w-5 h-5"/> : <FireIcon className="w-5 h-5"/>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white/90 mb-1">{item.player}</p>
                                            <p className="text-sm text-white/70 leading-relaxed">{item.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default GameScreen;
