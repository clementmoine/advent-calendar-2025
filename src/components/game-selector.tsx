'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Gamepad2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { GAMES_CONFIG, type KnownGameId } from '@/lib/games';
import { Badge } from '@/components/ui/badge';

interface GameSelectorProps {
  day: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export default function GameSelector({ day, difficulty }: GameSelectorProps) {
  const router = useRouter();
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
    // Navigate to game page with selected game as query param
    router.push(`/game/${day}?game=${gameId}`);
  };

  // All games use the day-based difficulty, not their own difficulty
  const games = Object.entries(GAMES_CONFIG).map(([id, config]) => ({
    id: id as KnownGameId,
    name: config.metadata.name,
    description: config.metadata.description,
    difficulty: difficulty, // Use the day-based difficulty for all games
    estimatedTime: config.metadata.estimatedTime,
  }));

  const getDifficultyColor = (diff: 'easy' | 'medium' | 'hard') => {
    switch (diff) {
      case 'easy':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200';
    }
  };

  const getDifficultyLabel = (diff: 'easy' | 'medium' | 'hard') => {
    switch (diff) {
      case 'easy':
        return 'Facile';
      case 'medium':
        return 'Moyen';
      case 'hard':
        return 'Difficile';
      default:
        return diff;
    }
  };

  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 p-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='w-full max-w-6xl mx-auto'
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='text-center mb-8'
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className='mb-6 flex justify-center'
          >
            <div className='relative'>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                  ease: 'easeInOut',
                }}
                className='absolute inset-0 bg-emerald-200/30 dark:bg-emerald-800/30 rounded-full blur-2xl'
              />
              <div className='relative bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800/50 dark:to-emerald-700/50 p-6 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-700'>
                <Gamepad2 className='size-16 text-emerald-600 dark:text-emerald-400' />
              </div>
            </div>
          </motion.div>

          <h1 className='text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3'>
            Jour {day} - Choisissez votre jeu
          </h1>
          <p className='text-lg text-slate-600 dark:text-slate-300 mb-4'>
            Sélectionnez le jeu que vous souhaitez jouer aujourd'hui
          </p>
          <div className='flex items-center justify-center gap-2'>
            <Badge className={getDifficultyColor(difficulty)}>
              Difficulté: {getDifficultyLabel(difficulty)}
            </Badge>
          </div>
        </motion.div>

        {/* Games Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
        >
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className='h-full w-full flex'
            >
              <Card
                className={`group cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] hover:border-emerald-300 dark:hover:border-emerald-700 flex flex-col h-full w-full ${
                  selectedGame === game.id
                    ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 border-emerald-300 dark:border-emerald-700'
                    : ''
                }`}
                onClick={() => handleGameSelect(game.id)}
              >
                <CardHeader>
                  <CardTitle className='text-xl group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors'>
                    {game.name}
                  </CardTitle>
                  <CardDescription className='mt-2'>
                    {game.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex-1 flex flex-col justify-end'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-slate-500 dark:text-slate-400'>
                      ⏱ {game.estimatedTime}
                    </span>
                    <span className='text-sm text-emerald-600 dark:text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity'>
                      Cliquer pour jouer →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
