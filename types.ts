
export type Level = 'gentle' | 'warming' | 'intimate';
export type Mode = 'truth' | 'dare';
export type Role = 'top' | 'bottom';

export interface Player {
  name: string;
  role: Role | null;
}

export interface Players {
  player1: Player;
  player2: Player;
}

export interface LevelDetail {
  name: string;
  className: string;
  flatClassName: string;
  borderColor: string;
  shadowColor: string;
}

export const LEVEL_DETAILS: Record<Level, LevelDetail> = {
  gentle: {
    name: '温和',
    className: 'from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700',
    flatClassName: 'bg-indigo-600 hover:bg-indigo-500',
    borderColor: 'border-indigo-400/50',
    shadowColor: 'shadow-indigo-500/40'
  },
  warming: {
    name: '进阶',
    className: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
    flatClassName: 'bg-orange-600 hover:bg-orange-500',
    borderColor: 'border-orange-500/50',
    shadowColor: 'shadow-orange-500/40'
  },
  intimate: {
    name: '情趣',
    className: 'from-rose-500 to-fuchsia-600 hover:from-rose-600 hover:to-fuchsia-700',
    flatClassName: 'bg-rose-600 hover:bg-rose-500',
    borderColor: 'border-rose-500/50',
    shadowColor: 'shadow-rose-500/40'
  }
};
