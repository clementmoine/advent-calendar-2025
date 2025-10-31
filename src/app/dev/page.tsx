'use client';

import { useState, useEffect } from 'react';
import { GAMES_CONFIG } from '@/lib/games';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GameComponent, GameMetadata } from '@/lib/games';

interface DevGameData {
  day: number;
  unlocked: boolean;
  gameType: string;
  gameMetadata: GameMetadata;
  dailyWord: string;
}

// Test data for development
const createTestGameData = (gameType: string, day: number): DevGameData => ({
  day,
  unlocked: true,
  gameType,
  gameMetadata: GAMES_CONFIG[gameType].metadata,
  dailyWord: 'TEST',
});

export default function DevPage() {
  const [gameComponents, setGameComponents] = useState<
    Record<string, GameComponent>
  >({});
  const [loading, setLoading] = useState(true);

  // Load all game components
  useEffect(() => {
    const loadGames = async () => {
      const components: Record<string, GameComponent> = {};

      for (const [gameId, config] of Object.entries(GAMES_CONFIG)) {
        try {
          const loadedModule = await config.component();
          components[gameId] = loadedModule.default;
        } catch (error) {
          console.error(`Failed to load ${gameId}:`, error);
        }
      }

      setGameComponents(components);
      setLoading(false);
    };

    loadGames();
  }, []);

  const handleWin = (gameId: string) => {
    console.log(`🎉 ${gameId} won!`);
  };

  const handleLose = (gameId: string) => {
    console.log(`💀 ${gameId} lost!`);
  };

  const handleReset = (gameId: string) => {
    console.log(`🔄 ${gameId} reset!`);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='spinner size-12 border-emerald-600 mx-auto mb-4'></div>
          <p className='text-slate-600 dark:text-slate-400'>
            Chargement des jeux...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-900 p-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2'>
            🛠️ Vue Développement - Tous les Jeux
          </h1>
          <p className='text-slate-600 dark:text-slate-400'>
            Comparaison côte à côte de tous les jeux pour harmoniser l&apos;UI
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6'>
          {Object.entries(GAMES_CONFIG).map(([gameId, config]) => {
            const GameComponent = gameComponents[gameId];
            const gameData = createTestGameData(gameId, 1);

            if (!GameComponent) {
              return (
                <Card
                  key={gameId}
                  className='border-red-200 dark:border-red-800'
                >
                  <CardHeader>
                    <CardTitle className='text-red-600 dark:text-red-400'>
                      ❌ {config.metadata.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-red-500'>Erreur de chargement</p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={gameId} className='h-fit'>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    <span className='text-2xl'>
                      {gameId === 'tusmo'
                        ? '🔤'
                        : gameId === 'sudoku'
                          ? '🔢'
                          : gameId === '2048'
                            ? '🎯'
                            : gameId === 'shifumi'
                              ? '✊'
                              : '🎮'}
                    </span>
                    {config.metadata.name}
                  </CardTitle>
                  <div className='flex flex-wrap gap-1'>
                    <Badge
                      variant={
                        config.metadata.difficulty === 'easy'
                          ? 'default'
                          : config.metadata.difficulty === 'medium'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {config.metadata.difficulty === 'easy'
                        ? 'Facile'
                        : config.metadata.difficulty === 'medium'
                          ? 'Moyen'
                          : 'Difficile'}
                    </Badge>
                    <Badge variant='outline'>
                      {config.metadata.estimatedTime}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className='pt-0'>
                  <Card>
                    <CardContent className='p-4'>
                      <GameComponent
                        onWin={() => handleWin(gameId)}
                        onLose={() => handleLose(gameId)}
                        onReset={() => handleReset(gameId)}
                        gameData={gameData}
                      />
                    </CardContent>
                  </Card>

                  <div className='mt-4 flex flex-col gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleWin(gameId)}
                      className='w-full'
                    >
                      🎉 Simuler Win
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleLose(gameId)}
                      className='w-full'
                    >
                      💀 Simuler Lose
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleReset(gameId)}
                      className='w-full'
                    >
                      🔄 Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className='mt-8 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'>
          <CardContent className='p-4'>
            <h3 className='font-semibold text-amber-800 dark:text-amber-200 mb-2'>
              💡 Conseils pour l&apos;harmonisation
            </h3>
            <ul className='text-sm text-amber-700 dark:text-amber-300 flex flex-col gap-1 list-disc list-inside'>
              <li>
                Vérifiez que tous les jeux ont le même container (bg-slate-100,
                border, rounded-xl)
              </li>
              <li>
                Assurez-vous que les claviers ont la même hauteur (h-12) et
                espacement (gap-2)
              </li>
              <li>
                Vérifiez que les animations sont cohérentes (whileTap, spring
                transition)
              </li>
              <li>Comparez les couleurs et les bordures entre les jeux</li>
              <li>
                Testez la responsivité sur différentes tailles d&apos;écran
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
