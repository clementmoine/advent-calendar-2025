import {
  GAMES_CONFIG,
  getGameTypeForBusinessDay,
  getActualDifficulty,
} from '@/lib/games';
import GamePageClient from '@/components/game-page-client';
import { getDailyWord } from '@/lib/server-utils';

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

async function getGameData(day: number): Promise<GameData> {
  // Retrieve the daily word server-side (secure)
  const dailyWord = await getDailyWord(day);

  // Determine game type based on the day (shared logic)
  const gameType = getGameTypeForBusinessDay(day);
  const gameConfig = GAMES_CONFIG[gameType];

  return {
    day,
    unlocked: true,
    gameType,
    gameMetadata: {
      id: gameConfig.metadata.id,
      name: gameConfig.metadata.name,
      description: gameConfig.metadata.description,
      difficulty: getActualDifficulty(gameConfig.metadata.difficulty, day),
      estimatedTime: gameConfig.metadata.estimatedTime,
      instructions: gameConfig.metadata.instructions,
    },
    dailyWord,
  };
}

interface GamePageProps {
  params: Promise<{ day: string }>;
}

export default async function GamePage({ params }: GamePageProps) {
  const { day: dayParam } = await params;
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

  try {
    // Retrieve game data server-side (secure)
    const gameData = await getGameData(day);

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
