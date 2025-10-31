'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import {
  Gift,
  Lock,
  Loader2,
  LockKeyhole,
  TreePine,
  Bed,
  Check,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GameViewer from '@/components/game-viewer';
import { GameComponent, GameMetadata } from '@/lib/games';
import { useGameProgress } from '@/hooks/useGameProgress';
import { motion } from 'framer-motion';

interface CalendarData {
  currentDay: number;
  totalDays: number;
  availableDays: number;
  games: Record<
    number,
    {
      id: string;
      name: string;
      description: string;
      difficulty: 'easy' | 'medium' | 'hard';
      estimatedTime: string;
      instructions: string[];
    }
  >;
  message: string;
}

interface GameData {
  day: number;
  unlocked: boolean;
  gameType: string;
  gameMetadata: {
    id: string;
    name: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    instructions: string[];
  };
  dailyWord: string;
}

async function fetchCalendarData(): Promise<CalendarData> {
  const response = await fetch('/api/calendar');
  if (!response.ok) {
    throw new Error('Erreur lors du chargement du calendrier');
  }
  return response.json();
}

async function fetchGameData(day: number): Promise<GameData> {
  const response = await fetch(`/api/game/${day}`);
  if (!response.ok) {
    throw new Error('Erreur lors du chargement du jeu');
  }
  return response.json();
}

export default function AdventCalendar() {
  const router = useRouter();
  const { checkDayCompleted, getWord } = useGameProgress();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [currentGame, setCurrentGame] = useState<{
    gameType: string;
    GameComponent: GameComponent;
    gameMetadata: GameMetadata;
    gameData: {
      day: number;
      dailyWord: string;
    };
  } | null>(null);

  const { data: calendarData, error } = useQuery({
    queryKey: ['calendar'],
    queryFn: async () => {
      const data = await fetchCalendarData();
      // Add small delay to ensure animation is visible
      await new Promise(resolve => setTimeout(resolve, 500));
      return data;
    },
  });

  // Keep animation state separate from loading state
  const [showAnimation, setShowAnimation] = useState(true);

  // Hide animation after the full animation duration (0.5s delay + animation time)
  useEffect(() => {
    if (calendarData) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000); // 0.5s delay + 1.5s animation
      return () => clearTimeout(timer);
    }
  }, [calendarData]);

  // Relaunch the animation when coming back to the home page
  useEffect(() => {
    // Détecter si on revient d'une page de jeu (pas de currentGame et pas de showWordSlate)
    if (!currentGame && calendarData) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [currentGame, calendarData]);

  const handleDayClick = useCallback(
    (day: number) => {
      if (day <= calendarData!.availableDays) {
        // Navigate to dedicated game page
        router.push(`/game/${day}`);
      }
    },
    [calendarData, router]
  );

  // Routes are handled by dedicated pages

  useQuery({
    queryKey: ['game', selectedDay],
    queryFn: () => fetchGameData(selectedDay!),
    enabled: !!selectedDay,
  });

  const handleExitGame = useCallback(() => {
    setCurrentGame(null);
    setSelectedDay(null);
    router.push('/');
  }, [router]);

  const isWeekend = useCallback((day: number) => {
    const date = new Date(new Date().getFullYear(), 11, day);
    return date.getDay() === 0 || date.getDay() === 6;
  }, []);

  // Render a single calendar card with animation
  const renderCalendarCard = useCallback(
    (day: number, index: number, isAnimated: boolean = false) => {
      const isUnlocked =
        isAnimated || day <= (calendarData?.availableDays || 0);
      const isSelected = selectedDay === day;
      const gameInfoRaw = calendarData?.games?.[day];
      const gameInfo = (gameInfoRaw || {
        name: `Jeu ${day}`,
      }) as {
        name: string;
        hasEnvWord?: boolean;
        disabledLabel?: string | null;
      };
      const isCompleted = !isAnimated && checkDayCompleted(day);
      const isDisabled = !!gameInfo.disabledLabel || !gameInfo.hasEnvWord;
      const canClick = !isAnimated && !isDisabled;

      // Determine card styling
      let cardClasses = 'w-full h-full overflow-hidden ';
      if (!canClick) {
        cardClasses += 'cursor-not-allowed ';
      } else {
        cardClasses += 'cursor-pointer ';
      }

      if (isUnlocked) {
        if (isDisabled) {
          cardClasses +=
            'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-60';
        } else {
          cardClasses +=
            'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/40';
        }
      } else {
        cardClasses +=
          'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50';
      }

      if (isSelected) {
        cardClasses += ' ring-2 ring-emerald-500 dark:ring-emerald-400';
      }

      // Render icon/content
      const renderContent = () => {
        if (!isUnlocked) {
          return (
            <div className='size-8 mx-auto text-slate-600 dark:text-slate-300'>
              <Lock className='size-8 mx-auto text-slate-400 dark:text-slate-500' />
            </div>
          );
        }

        if (isCompleted) {
          return (
            <div className='size-8 mx-auto text-emerald-600 dark:text-emerald-400'>
              <Check className='mx-auto md:size-8 size-6' />
            </div>
          );
        }

        if (gameInfo.disabledLabel) {
          const Icon =
            day === 25 ? TreePine : isWeekend(day) ? Bed : LockKeyhole;
          return (
            <div className='size-8 mx-auto text-slate-600 dark:text-slate-300'>
              <Icon className='mx-auto md:size-8 size-6' />
            </div>
          );
        }

        if (gameInfo.hasEnvWord) {
          const Icon = day === 25 ? TreePine : Gift;
          return (
            <div className='size-8 mx-auto text-emerald-600 dark:text-emerald-400'>
              <Icon className='mx-auto md:size-8 size-6' />
            </div>
          );
        }

        return (
          <div className='size-8 mx-auto text-slate-600 dark:text-slate-300'>
            <Loader2 className='mx-auto md:size-8 size-6 animate-spin' />
          </div>
        );
      };

      const cardContent = (
        <Card
          className={cardClasses}
          onClick={canClick ? () => handleDayClick(day) : undefined}
        >
          <CardContent className='px-3 py-2 text-center h-full flex flex-col justify-center overflow-hidden'>
            <div className='font-bold mb-2 text-slate-900 dark:text-slate-100 overflow-hidden md:text-3xl text-lg'>
              {day}
            </div>

            {renderContent()}

            {isUnlocked && (
              <div className='mt-2 text-xs text-slate-600 dark:text-slate-300 h-4 items-center justify-center text-ellipsis overflow-hidden whitespace-nowrap w-full'>
                {isAnimated ? (
                  <Loader2 className='size-3 animate-spin mx-auto' />
                ) : (
                  gameInfo.disabledLabel || gameInfo.name
                )}
              </div>
            )}
          </CardContent>
        </Card>
      );

      return (
        <motion.div
          key={day}
          className='overflow-hidden size-32'
          initial={{ opacity: 0, scale: 0.8, y: -50, rotateX: -90 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.5,
            delay: index * (0.015 + index * 0.0008),
            ease: [0.25, 0.46, 0.45, 0.94],
            type: 'spring',
            stiffness: 120 + index * 8,
            damping: 12 - index * 0.15,
          }}
        >
          {cardContent}
        </motion.div>
      );
    },
    [
      calendarData,
      selectedDay,
      checkDayCompleted,
      getWord,
      handleDayClick,
      isWeekend,
    ]
  );

  const renderWeeks = useCallback(() => {
    const year = new Date().getFullYear();
    const start = new Date(year, 11, 1); // Dec 1
    const startDay = start.getDay(); // 0=Sun..6=Sat
    const leading = (startDay + 6) % 7; // shift so Mon=0
    const totalCells = leading + 25;
    const rows = Math.ceil(totalCells / 7);
    const cells: (number | null)[] = Array.from(
      { length: totalCells },
      (_, i) => {
        const day = i - leading + 1;
        return day >= 1 && day <= 25 ? day : null;
      }
    );
    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let r = 0; r < rows; r++) {
      weeks.push(cells.slice(r * 7, r * 7 + 7));
    }

    return weeks.map((week, wi) => (
      <div key={wi} className='grid grid-cols-7 gap-4 '>
        {week.map((day, di) => (
          <div key={`${wi}-${di}`} className='flex items-center justify-center'>
            {day ? (
              renderCalendarCard(day, day - 1, showAnimation)
            ) : (
              <div className='size-32 border border-transparent overflow-hidden' />
            )}
          </div>
        ))}
      </div>
    ));
  }, [renderCalendarCard, showAnimation]);

  // Si un jeu est en cours, afficher le GameViewer
  if (currentGame) {
    return (
      <GameViewer
        gameId={currentGame.gameType}
        gameMetadata={currentGame.gameMetadata}
        GameComponent={currentGame.GameComponent}
        onExit={handleExitGame}
        gameData={{
          day: currentGame.gameData.day,
          dailyWord: currentGame.gameData.dailyWord,
          unlocked: true,
          gameType: currentGame.gameType,
          gameMetadata: currentGame.gameMetadata,
        }}
      />
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center text-red-500'>
          <p>Erreur: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-center min-h-[calc(100vh-200px)]'>
      <div className='text-center'>
        {/* Calendar Grid Monday-Sunday */}
        <div className='flex flex-col gap-3'>
          {/* Weekday headers */}
          <div className='grid grid-cols-7 gap-4 text-xs font-medium text-slate-600 dark:text-slate-300'>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, idx) => (
              <div
                key={`weekday-${idx}`}
                className='h-5 flex items-center justify-center'
              >
                {label}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {renderWeeks()}
        </div>
      </div>
    </div>
  );
}
