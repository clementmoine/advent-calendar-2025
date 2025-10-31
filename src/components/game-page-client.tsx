'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import GameViewer from '@/components/game-viewer';
import { GameComponent, GameMetadata } from '@/lib/games';

interface GamePageClientProps {
  gameId: string;
  gameMetadata: GameMetadata;
  GameComponent: GameComponent;
  gameData: {
    day: number;
    dailyWord: string;
    unlocked: boolean;
    gameType: string;
    gameMetadata: GameMetadata;
  };
}

export default function GamePageClient({
  gameId,
  gameMetadata,
  GameComponent,
  gameData,
}: GamePageClientProps) {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);

  const handleExit = () => {
    router.push('/');
  };

  const handleReset = () => {
    // Force component reset by changing the React key
    setResetKey(prev => prev + 1);
  };

  return (
    <div className='p-4'>
      <GameViewer
        key={resetKey}
        gameId={gameId}
        gameMetadata={gameMetadata}
        GameComponent={GameComponent}
        onExit={handleExit}
        onReset={handleReset}
        gameData={gameData}
        isLoading={false}
      />
    </div>
  );
}
