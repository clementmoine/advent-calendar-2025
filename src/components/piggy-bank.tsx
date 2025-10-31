'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Coins, Lock, Play } from 'lucide-react';
import { usePiggyBank } from '@/contexts/piggy-bank-context';
import Memory from '@/mini-games/memory';
import TicTacToe from '@/mini-games/tic-tac-toe';
import ShifumiMini from '@/mini-games/shifumi';
import Simon from '@/mini-games/simon';
import Tetris from '@/mini-games/tetris';
import FlappyBird from '@/mini-games/flappy-bird';
import SlotMachine from '@/mini-games/slot-machine';

interface MiniGame {
  id: string;
  name: string;
  description: string;
  reward: number; // Number of coins earned
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
  completed: boolean;
  unlocked: boolean;
}

const MINI_GAMES: MiniGame[] = [
  // Easy
  {
    id: 'shifumi',
    name: 'Shifumi',
    description: 'Pierre, papier, ciseaux',
    reward: 1,
    difficulty: 'easy',
    icon: '✊',
    completed: false,
    unlocked: true,
  },
  {
    id: 'tic-tac-toe',
    name: 'Morpion',
    description: "Battez l'ordinateur",
    reward: 1,
    difficulty: 'easy',
    icon: '⭕',
    completed: false,
    unlocked: true,
  },
  // Easy
  {
    id: 'simon',
    name: 'Simon',
    description: 'Répétez la séquence',
    reward: 1,
    difficulty: 'easy',
    icon: '🎵',
    completed: false,
    unlocked: true,
  },
  // Medium
  {
    id: 'memory',
    name: 'Memory',
    description: 'Retrouvez les paires',
    reward: 3,
    difficulty: 'medium',
    icon: '🧠',
    completed: false,
    unlocked: true,
  },
  // Hard
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Empilez les blocs',
    reward: 1,
    difficulty: 'hard',
    icon: '🧩',
    completed: false,
    unlocked: true,
  },
  {
    id: 'flappy-bird',
    name: 'Flappy Bird',
    description: 'Évitez les obstacles',
    reward: 1,
    difficulty: 'medium',
    icon: '🐦',
    completed: false,
    unlocked: true,
  },
  {
    id: 'slot-machine',
    name: 'Machine à sous',
    description: 'Alignez 3 symboles identiques',
    reward: 20,
    difficulty: 'easy',
    icon: '🎰',
    completed: false,
    unlocked: true,
  },
];

interface PiggyBankProps {
  onClose: () => void;
}

export default function PiggyBank({ onClose }: PiggyBankProps) {
  const { coins, addCoins } = usePiggyBank();
  const [miniGames] = useState<MiniGame[]>(
    [...MINI_GAMES].sort((a, b) => {
      if (b.reward !== a.reward) return b.reward - a.reward; // higher reward first
      // stable tie-breakers
      const difficultyOrder = { easy: 0, medium: 1, hard: 2 } as const;
      const diff =
        difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    })
  );
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // Load data from localStorage
  useEffect(() => {
    // No longer need to load completed states
  }, []);

  // No longer need to save completed states

  const playMiniGame = (gameId: string) => {
    setSelectedGame(gameId);
  };

  const completeMiniGame = (gameId: string) => {
    const game = miniGames.find(g => g.id === gameId);
    if (!game) return;

    // Don't mark as completed, just add coins
    addCoins(game.reward);
    // Let user close manually to see animation
  };

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4 justify-between w-full'>
              <div>
                <DialogTitle className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                  Tirelire
                </DialogTitle>
                <p className='text-slate-600 dark:text-slate-400 text-sm'>
                  Jouez aux mini-jeux pour gagner des pièces et vous aider dans
                  les jeux du calendrier.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className='flex flex-col overflow-y-auto max-h-[calc(90vh-120px)] gap-4'>
          <div className='flex gap-4 items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg'>
            <Coins className='h-6 w-6 text-yellow-600 dark:text-yellow-400' />

            <div className='flex flex-col'>
              <span className='text-xs text-yellow-700 dark:text-yellow-300'>
                Solde actuel
              </span>
              <span className='text-xl font-bold text-yellow-700 dark:text-yellow-300'>
                {coins}
              </span>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {miniGames.map(game => (
              <Card
                key={game.id}
                className={`transition-all duration-200 ${
                  game.unlocked
                    ? 'hover:shadow-md cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => game.unlocked && playMiniGame(game.id)}
              >
                <CardContent className='p-6'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='text-4xl'>{game.icon}</div>
                    {!game.unlocked && (
                      <Lock className='h-5 w-5 text-slate-400' />
                    )}
                  </div>

                  <h3 className='font-semibold text-slate-900 dark:text-slate-100 mb-2'>
                    {game.name}
                  </h3>

                  <p className='text-sm text-slate-600 dark:text-slate-400 mb-4'>
                    {game.description}
                  </p>

                  <div className='flex items-center justify-between mb-4'>
                    <Badge
                      variant={
                        game.difficulty === 'easy'
                          ? 'default'
                          : game.difficulty === 'medium'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {game.difficulty === 'easy'
                        ? 'Facile'
                        : game.difficulty === 'medium'
                          ? 'Moyen'
                          : 'Difficile'}
                    </Badge>

                    <div className='flex items-center gap-1 text-yellow-600 dark:text-yellow-400'>
                      <Coins className='h-4 w-4' />
                      <span className='font-medium'>{game.reward}</span>
                    </div>
                  </div>

                  {game.unlocked && (
                    <Button
                      size='sm'
                      className='w-full'
                      onClick={e => {
                        e.stopPropagation();
                        playMiniGame(game.id);
                      }}
                    >
                      <Play className='h-4 w-4 mr-2' />
                      Jouer
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mini-game Modals */}
        {selectedGame === 'tic-tac-toe' && (
          <TicTacToe
            onWin={() => {
              completeMiniGame('tic-tac-toe');
              // Let user close manually
            }}
            onLose={() => {
              // Let user close manually
            }}
            onClose={() => setSelectedGame(null)}
          />
        )}

        {selectedGame === 'memory' && (
          <Memory
            onWin={() => {
              completeMiniGame('memory');
              // Let user close manually
            }}
            onLose={() => {
              // Let user close manually
            }}
            onClose={() => setSelectedGame(null)}
          />
        )}

        {selectedGame === 'shifumi' && (
          <ShifumiMini
            onWin={() => {
              completeMiniGame('shifumi');
              // Let user close manually
            }}
            onLose={() => {
              // Let user close manually
            }}
            onClose={() => setSelectedGame(null)}
          />
        )}

        {selectedGame === 'simon' && (
          <Simon
            onWin={() => {
              completeMiniGame('simon');
              // Let user close manually
            }}
            onLose={() => {
              // Let user close manually
            }}
            onClose={() => setSelectedGame(null)}
          />
        )}

        {selectedGame === 'tetris' && (
          <Tetris
            onWin={() => {
              completeMiniGame('tetris');
              // Let user close manually
            }}
            onLose={() => {
              // Let user close manually
            }}
            onClose={() => setSelectedGame(null)}
          />
        )}

        {selectedGame === 'slot-machine' && (
          <SlotMachine
            onWin={() => {
              completeMiniGame('slot-machine');
            }}
            onLose={() => {
              // Let user close manually
            }}
            onClose={() => setSelectedGame(null)}
          />
        )}

        {selectedGame === 'flappy-bird' && (
          <FlappyBird
            onWin={() => {
              completeMiniGame('flappy-bird');
            }}
            onLose={() => {
              // Let user close manually
            }}
            onClose={() => setSelectedGame(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
