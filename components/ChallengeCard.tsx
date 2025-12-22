
import React from 'react';
import type { Mode, Level } from '../types';
import { LEVEL_DETAILS } from '../types';
import HeartIcon from './icons/HeartIcon';
import FireIcon from './icons/FireIcon';
import Timer from './Timer';

interface ChallengeCardProps {
  challenge: string;
  mode: Mode;
  level: Level;
  duration?: number | null;
  onFeedback?: (type: 'like' | 'dislike') => void;
  feedbackGiven?: 'like' | 'dislike' | null;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
    challenge, 
    mode, 
    level,
    duration,
    onFeedback,
    feedbackGiven
}) => {
  const Icon = mode === 'truth' ? HeartIcon : FireIcon;
  const colorClass = mode === 'truth' ? 'text-pink-300' : 'text-purple-300';
  const { borderColor, shadowColor } = LEVEL_DETAILS[level];
  
  return (
    <div
      className={`w-full h-full bg-black/60 backdrop-blur-md rounded-3xl flex flex-col p-4 md:p-6 text-center border-4 ${borderColor} ${shadowColor} shadow-2xl transition-all duration-1000 relative overflow-hidden`}
    >
        {/* Main Content Area - Flexible height to push footer down */}
        <div className="flex-1 flex flex-col items-center justify-center w-full overflow-y-auto">
            <div className={`mb-2 md:mb-4 ${colorClass} flex-shrink-0`}>
                <Icon className="w-10 h-10 md:w-12 md:h-12" />
            </div>
            <p className="text-lg md:text-2xl font-semibold leading-relaxed text-white select-none px-2">
                {challenge}
            </p>
        </div>

        {/* Footer Area: Timer and Feedback */}
        <div className="w-full flex flex-col items-center gap-3 md:gap-4 mt-2 md:mt-4 relative z-10 flex-shrink-0">
            {duration && (
                <div className="scale-90 origin-bottom">
                    <Timer duration={duration} />
                </div>
            )}
            
            {onFeedback && (
                <div className="flex items-center gap-4 w-full justify-center">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onFeedback('dislike'); }}
                        disabled={!!feedbackGiven}
                        className={`group flex items-center justify-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 border ${
                            feedbackGiven === 'dislike' 
                            ? 'bg-red-500/20 border-red-500/50 text-red-200' 
                            : feedbackGiven
                                ? 'opacity-30 border-transparent text-gray-500 cursor-not-allowed'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/30'
                        }`}
                        title="减少此类卡牌出现的频率"
                    >
                        <span className={`transform transition-transform ${feedbackGiven === 'dislike' ? 'scale-110' : 'group-hover:scale-110'}`}>💔</span> 
                        <span>不太行</span>
                    </button>

                    <button 
                        onClick={(e) => { e.stopPropagation(); onFeedback('like'); }}
                        disabled={!!feedbackGiven}
                        className={`group flex items-center justify-center gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 border ${
                            feedbackGiven === 'like' 
                            ? 'bg-green-500/20 border-green-500/50 text-green-200' 
                            : feedbackGiven
                                ? 'opacity-30 border-transparent text-gray-500 cursor-not-allowed'
                                : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white hover:border-white/30'
                        }`}
                        title="增加此类卡牌出现的频率"
                    >
                        <span className={`transform transition-transform ${feedbackGiven === 'like' ? 'scale-110' : 'group-hover:scale-110'}`}>❤️</span> 
                        <span>喜欢</span>
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default ChallengeCard;
