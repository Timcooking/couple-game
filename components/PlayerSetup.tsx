
import React, { useState, useMemo } from 'react';
import type { Player, Players, Role } from '../types';

interface PlayerSetupProps {
  onStartGame: (players: Players) => void;
}

const RoleSelector: React.FC<{
  selectedRole: Role | null;
  onSelect: (role: Role) => void;
}> = ({ selectedRole, onSelect }) => {
  return (
    <div className="flex gap-4">
      <button
        onClick={() => onSelect('top')}
        className={`px-6 py-2 rounded-lg border-2 transition-colors duration-300 ${
          selectedRole === 'top'
            ? 'bg-rose-500 border-rose-400 text-white'
            : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
        }`}
      >
        Top
      </button>
      <button
        onClick={() => onSelect('bottom')}
        className={`px-6 py-2 rounded-lg border-2 transition-colors duration-300 ${
          selectedRole === 'bottom'
            ? 'bg-sky-500 border-sky-400 text-white'
            : 'bg-white/10 border-white/20 text-white/70 hover:bg-white/20'
        }`}
      >
        Bottom
      </button>
    </div>
  );
};

const PlayerEditor: React.FC<{
  player: Player;
  onUpdate: (player: Player) => void;
  playerLabel: string;
}> = ({ player, onUpdate, playerLabel }) => {
  const handleRoleSelect = (role: Role) => {
    onUpdate({ ...player, role });
  };
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...player, name: e.target.value });
  };

  return (
    <div className="w-full bg-black/30 p-6 rounded-2xl flex flex-col gap-4 items-center">
      <label className="text-2xl font-semibold text-white/90">{playerLabel}</label>
      <input
        type="text"
        value={player.name}
        onChange={handleNameChange}
        placeholder="输入你的名字"
        className="w-full bg-transparent border-b-2 border-white/30 focus:border-purple-400 text-center text-xl text-white p-2 outline-none transition-colors"
      />
      <RoleSelector selectedRole={player.role} onSelect={handleRoleSelect} />
    </div>
  );
};

export default function PlayerSetup({ onStartGame }: PlayerSetupProps) {
    const [players, setPlayers] = useState<Players>({
        player1: { name: '', role: null },
        player2: { name: '', role: null }
    });

    const handlePlayerUpdate = (playerNumber: 'player1' | 'player2', updatedPlayer: Player) => {
        const otherPlayerNumber = playerNumber === 'player1' ? 'player2' : 'player1';
        const oppositeRole: Role | null = updatedPlayer.role ? (updatedPlayer.role === 'top' ? 'bottom' : 'top') : null;

        setPlayers(prev => ({
            ...prev,
            [playerNumber]: updatedPlayer,
            // Automatically set the other player's role to the opposite
            [otherPlayerNumber]: { ...prev[otherPlayerNumber], role: oppositeRole }
        }));
    };

    const isReady = useMemo(() => {
        return (
            players.player1.name.trim() !== '' &&
            players.player2.name.trim() !== '' &&
            players.player1.role !== null &&
            players.player2.role !== null &&
            players.player1.role !== players.player2.role
        );
    }, [players]);

    return (
        <div className="flex flex-col items-center justify-center w-full text-white animate-fade-in font-sans">
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-wider">玩家设置</h1>
                <p className="text-lg md:text-xl text-white/80">输入你们的名字并选择角色</p>
            </div>

            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <PlayerEditor
                    player={players.player1}
                    onUpdate={(p) => handlePlayerUpdate('player1', p)}
                    playerLabel="玩家一"
                />
                <PlayerEditor
                    player={players.player2}
                    onUpdate={(p) => handlePlayerUpdate('player2', p)}
                    playerLabel="玩家二"
                />
            </div>
            
            <button
                onClick={() => onStartGame(players)}
                disabled={!isReady}
                className="mt-12 px-12 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xl rounded-xl transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
                开始游戏
            </button>
        </div>
    );
}
