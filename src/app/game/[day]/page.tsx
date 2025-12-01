import {
  GAMES_CONFIG,
  getGameTypeForBusinessDay,
  getActualDifficulty,
  getBusinessDayIndex,
} from '@/lib/games';
import GamePageClient from '@/components/game-page-client';
import { getDailyWord } from '@/lib/server-utils';
import LockedDayMessage from '@/components/locked-day-message';
import DisabledDayMessage from '@/components/disabled-day-message';
import GameSelector from '@/components/game-selector';

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
    args?: string;
  };
  dailyWord: string;
}

async function getGameData(day: number, selectedGame?: string): Promise<GameData> {
  // Retrieve the daily word server-side (secure)
  const dailyWord = await getDailyWord(day);

  // Determine game type based on the day (shared logic)
  // If a game is selected via query param and DAY_X_GAME is "all", use it
  const baseGameType = getGameTypeForBusinessDay(day);
  let gameType = baseGameType;
  
  // If base game type is "all", we need a selected game
  if (baseGameType === 'all') {
    if (selectedGame && Object.keys(GAMES_CONFIG).includes(selectedGame)) {
      gameType = selectedGame;
    } else {
      // No valid game selected, will show selector
      gameType = 'all';
    }
  }
  
  // If gameType is still "all", we can't get game config yet
  if (gameType === 'all') {
    throw new Error('Game selector needed');
  }
  
  const gameConfig = GAMES_CONFIG[gameType];
  
  // Use the day-based difficulty, not the game's default difficulty
  const dayDifficulty = getActualDifficulty('dynamic', day, gameType);

  return {
    day,
    unlocked: true,
    gameType,
    gameMetadata: {
      id: gameConfig.metadata.id,
      name: gameConfig.metadata.name,
      description: gameConfig.metadata.description,
      difficulty: dayDifficulty,
      estimatedTime: gameConfig.metadata.estimatedTime,
      instructions: gameConfig.metadata.instructions,
      args: process.env[`DAY_${day}_ARGS`],
    },
    dailyWord,
  };
}

interface GamePageProps {
  params: Promise<{ day: string }>;
  searchParams: Promise<{ game?: string }>;
}

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const { day: dayParam } = await params;
  const { game: selectedGame } = await searchParams;
  const day = parseInt(dayParam, 10);

  if (isNaN(day) || day < 1 || day > 25) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center text-red-500'>
          <p>Jour invalide: {dayParam}</p>
        </div>
      </div>
    );
  }

  // Check if day is disabled first (days that will never be available)
  const disabledLabel = process.env[`DAY_${day}_DISABLED`];
  if (disabledLabel) {
    return <DisabledDayMessage day={day} disabledLabel={disabledLabel} />;
  }

  // Check if the day is unlocked (only in production)
  const isDevelopment = process.env.NODE_ENV === 'development';
  if (!isDevelopment) {
    const today = new Date();
    const businessDayIndex = getBusinessDayIndex(today);
    if (day > businessDayIndex) {
      const daysRemaining = day - businessDayIndex;
      return <LockedDayMessage daysRemaining={daysRemaining} day={day} />;
    }
  }

  // Check if we need to show the game selector
  const baseGameType = getGameTypeForBusinessDay(day);
  if (baseGameType === 'all' && !selectedGame) {
    // Calculate the difficulty for the day (used for all games)
    const dayDifficulty = getActualDifficulty('dynamic', day);
    return <GameSelector day={day} difficulty={dayDifficulty} />;
  }

  try {
    // Retrieve game data server-side (secure)
    const gameData = await getGameData(day, selectedGame || undefined);

    // Dynamically load the game component
    const gameConfig = GAMES_CONFIG[gameData.gameType];
    const GameComponentModule = await gameConfig.component();
    const GameComponent = GameComponentModule.default;

    return (
      <GamePageClient
        gameId={gameData.gameType}
        gameMetadata={gameData.gameMetadata}
        GameComponent={GameComponent}
        gameData={{
          day: gameData.day,
          dailyWord: gameData.dailyWord,
          unlocked: gameData.unlocked,
          gameType: gameData.gameType,
          gameMetadata: gameData.gameMetadata,
        }}
      />
    );
  } catch (error) {
    // If error is "Game selector needed", show selector
    if (error instanceof Error && error.message === 'Game selector needed') {
      const dayDifficulty = getActualDifficulty('dynamic', day);
      return <GameSelector day={day} difficulty={dayDifficulty} />;
    }
    
    console.error('Error loading game:', error);
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center text-red-500'>
          <p>
            Erreur lors du chargement du jeu:{' '}
            {error instanceof Error ? error.message : 'Erreur inconnue'}
          </p>
        </div>
      </div>
    );
  }
}
