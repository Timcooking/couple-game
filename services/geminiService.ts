
import type { Level, Mode, Players } from '../types';

export interface Challenge {
    text: string;
    mode: Mode;
}

const STORAGE_KEY = 'couples_truth_dare_challenges';

export const getChallenges = (): Record<Level, Record<Mode, string[]>> => {
    if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse stored challenges", e);
            }
        }
    }
    return defaultChallenges;
};

export const saveChallenges = (challenges: Record<Level, Record<Mode, string[]>>) => {
     if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
     }
};

export const resetChallenges = (): Record<Level, Record<Mode, string[]>> => {
     if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY);
     }
    return defaultChallenges;
};

// --- Recommendation System Logic ---

// Simple stop words list for Chinese and generic terms
const STOP_WORDS = new Set([
    '你', '我', '他', '她', '它', '的', '了', '在', '是', '就', '都', '和', '去', 
    'player1', 'player2', 'topplayer', 'bottomplayer', 'time', '或者', '如果', '一个', '一次'
]);

const extractKeywords = (text: string): string[] => {
    // Remove placeholders like {{player1}} and [TIME:30]
    const cleanText = text.replace(/\{\{.*?\}\}/g, '').replace(/\[TIME:\d+\]/g, '');
    
    // Split by non-word characters (punctuation, spaces)
    // This is a naive tokenizer for mixed CN/EN
    const tokens = cleanText.split(/[，。！？、\s,.!?～"“:：]+/);
    
    return tokens.filter(t => t.length > 1 && !STOP_WORDS.has(t.toLowerCase()));
};

export const reorderDeckBasedOnFeedback = (
    currentDeck: Challenge[], 
    targetChallengeText: string, 
    feedback: 'like' | 'dislike',
    currentPlayerName?: string
): Challenge[] => {
    if (currentDeck.length === 0) return [];

    const keywords = extractKeywords(targetChallengeText);
    if (keywords.length === 0) return currentDeck;

    const weightModifier = feedback === 'like' ? 1 : -1;

    // We attach a temporary score to each card in the remaining deck
    const scoredDeck = currentDeck.map(card => {
        let score = 0;
        
        // INDEPENDENCE LOGIC:
        // Only adjust the score if the card is meant for the current player (starts with their name).
        // If the card is meant for the other player (or someone else), we treat it neutrally (score 0 + noise).
        // This ensures Player A's likes don't reorder Player B's queue based on keywords.
        const appliesToPlayer = currentPlayerName ? card.text.startsWith(currentPlayerName) : true;

        if (appliesToPlayer) {
            // Unused variable removed here to fix build
            keywords.forEach(kw => {
                if (card.text.includes(kw)) {
                    score += weightModifier * 10; // Base weight for a match
                }
            });
        }

        // Add randomness (Noise) to prevent deterministic ordering
        // The noise is between 0 and 5. This ensures that a strong signal (>10) 
        // will likely outweigh the noise, but equal scores are shuffled.
        const noise = Math.random() * 5;
        
        return { card, score: score + noise };
    });

    // Sort by score descending (higher score first)
    scoredDeck.sort((a, b) => b.score - a.score);

    return scoredDeck.map(item => item.card);
};

// --- End Recommendation Logic ---

// FIX: Added missing getPersonalizedDeck function to personalize and shuffle challenges.
export const getPersonalizedDeck = (level: Level, players: Players, mode: Mode): Challenge[] => {
    const allChallenges = getChallenges();
    const challengesForLevel = allChallenges?.[level]?.[mode];

    if (!challengesForLevel || !Array.isArray(challengesForLevel)) {
        return [];
    }

    const { player1, player2 } = players;
    const topPlayer = player1.role === 'top' ? player1 : player2;
    const bottomPlayer = player1.role === 'bottom' ? player1 : player2;

    // Filter out any non-string values (like nulls from sparse arrays) before processing
    const personalizedTexts = challengesForLevel
        .filter(text => typeof text === 'string')
        .map(text => {
            return text
                .replace(/{{player1}}/g, player1.name)
                .replace(/{{player2}}/g, player2.name)
                .replace(/{{topPlayer}}/g, topPlayer.name)
                .replace(/{{bottomPlayer}}/g, bottomPlayer.name);
    });

    const deck: Challenge[] = personalizedTexts.map(text => ({ text, mode }));

    // Shuffle the deck (Fisher-Yates shuffle)
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
};


export const defaultChallenges: Record<Level, Record<Mode, string[]>> = {
  gentle: {
    truth: [
      "{{player1}}，你最欣赏 {{player2}} 身上的哪个特质？",
      "我们第一次见面时，你对我的第一印象是什么？",
      "分享一件你觉得我们之间最浪漫的小事。",
      "如果可以用一个词来形容我们的关系，会是什么？",
      "{{player2}}，你手机里存的 {{player1}} 最好看的一张照片是哪张？",
      "你最想和我一起去哪个地方旅行？",
      "你认为我的哪一点最吸引你？",
      "狡猾的挑战：在接下来的三轮中，你都只能选择大冒险。",
    ],
    dare: [
      "抱着 {{player1}} 转三圈。",
      "五分钟内，一起为对方挑一件情趣用品（眼罩，口球等...）并分享为什么。",
      "{{player1}}，你必须对{{player2}}做一次为时30秒的表白。[TIME:30]",
      "{{player1}}，认真地问{{player2}}，你能不能轻轻咬他的耳朵。[TIME:15]",
      "{{player1}}，轻柔地抚摸{{player2}}的头发，然后抓住他的脖子亲吻。[TIME:15]",
      "相互拥抱并说出对方的三个优点。",
      "{{topPlayer}}，把{{bottomPlayer}}按在墙上，轻声对他说出你的欲望。",
      "{{player1}}，抚摸{{player2}}的脸，直视他的眼睛，告诉他你认为他有多帅。",
      "{{player1}}，吸吮{{player2}}的一根手指。",
      "{{player1}}，你现在是一个情场高手。你有30秒来撩{{player2}}。然后交换再来一次。[TIME:30]",
      "{{player1}}，拿起一杯酒，让{{player2}}喝一口，然后温柔地舔他的嘴唇。",
      "{{topPlayer}}，接下来十分钟，你都要用“宝宝”来结束你说的所有的话。",
      "{{bottomPlayer}}，接下来十分钟，你都要用“老公”来结束你说的所有的话。",
    ],
  },
  warming: {
    truth: [
      "{{topPlayer}}，你什么时候觉得 {{bottomPlayer}} 最性感？",
      "{{bottomPlayer}}，你最想在 {{topPlayer}} 身上实现的幻想是什么？",
      "{{topPlayer}}，你去过情趣用品店么？如果没去过，你想和{{bottomPlayer}}去吗？",
      "你有没有因为我而吃过醋？是因为什么事？",
      "{{bottomPlayer}}，猜 {{topPlayer}} 上一次自己解决是什么时候。如果猜对了 {{bottomPlayer}} 可以指定 {{topPlayer}} 下次自己解决的时间。",
      "如果{{bottomPlayer}}把你捆绑在床上，会让你性奋吗？",
      "{{topPlayer}}, {{bottomPlayer}}立刻就能做的，并能让你性奋不已的事情是什么？",
      "你理想中的完美前戏是怎样的？",
      "你有没有在和某个人说话的时候意外兴奋过？",
      "{{topPlayer}}，如果 {{bottomPlayer}} 今晚回家时，打了乳钉，你会怎样反应？",
      "狡猾的挑战：在接下来的三轮中，你都只能选择大冒险。",
    ],
    dare: [
      "{{topPlayer}}，用嘴喂 {{bottomPlayer}} 吃一样东西。",
      "{{player1}}，坐在椅子上，身体放松。让{{player2}}蒙上你的眼睛，并亲吻你身上他想吻的任何部位！",
      "{{topPlayer}}，亲吻 {{bottomPlayer}} 身体上一个Ta之前没被亲过的地方。",
      "{{player1}}，只用舌头在{{player2}}的下腹上画图。他要猜你画的是什么。",
      "用你的嘴唇在对方身体上留下一个吻痕。",
      "{{topPlayer}}，命令 {{bottomPlayer}} 做一件让ta害羞但又兴奋的事情。",
      "[TIME:600]接下来十分钟，{{bottomPlayer}} 必须称呼 {{topPlayer}} 为“主人”或自定义的尊称。",
      "{{topPlayer}}，把{{bottomPlayer}}按在门上。你们要在1分钟内激吻并相互爱抚。[TIME:60]",
      "{{topPlayer}}，接下来十分钟，你都要用“老婆”来结束你说的所有的话。",
      "{{topPlayer}}将{{bottomPlayer}}按在墙上，抚摸对方的脸或者下巴，直视对方的眼睛，对着{{bottomPlayer}}说出一段情话。",
      "{{bottomPlayer}}跪在地上，{{topPlayer}}抚摸着他的头，直视对方的眼睛，{{topPlayer}}指定一段话让{{bottomPlayer}}读出来。",
    ],
  },
  intimate: {
    truth: [
      "{{player1}}，你觉得{{player2}}全身哪个部位最敏感？",
      "{{player1}}，你最喜欢的做爱姿势是哪个？",
      "{{player1}}，分享一个你不敢告诉{{player2}}的性幻想。",
      "{{player1}}，上次做爱时你脑子里在想什么？",
      "{{player1}}，你觉得{{player2}}穿什么（或不穿）最让你受不了？",
      "{{player1}}，你希望能尝试什么新的玩法或玩具？",
      "{{player1}}，给{{player2}}的床上表现打个分，并说明理由（情趣向）。",
      "{{player1}}，你最喜欢{{player2}}亲吻你哪里？",
    ],
    dare: [
      "{{player1}}，蒙上{{player2}}的眼睛，用冰块游走ta全身。[TIME:60]",
      "{{bottomPlayer}}背过双手，{{topPlayer}} 咬住 {{bottomPlayer}} 的乳头，询问一件你很想知道的问题。",
      "{{topPlayer}}背过双手，{{bottomPlayer}} 咬住 {{topPlayer}} 的下体，询问一件你很想知道的问题。",
      "{{player1}}，帮{{player2}}脱掉一件贴身衣物（如果有的话）。",
      "{{player1}}，用嘴唇和舌头侍奉{{player2}}的大腿内侧30秒。[TIME:30]",
      "{{player1}}，躺下，让{{player2}}在你身上做十个俯卧撑，每次都要亲到你。",
      "{{player1}}，给{{player2}}全身涂抹润滑液或精油。",
      "{{player1}}，只用嘴，解开{{player2}}的皮带或扣子。",
      "{{player1}}，亲吻{{player2}}的私密部位附近（边缘挑逗）。",
    ]
  }
};
