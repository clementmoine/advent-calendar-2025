'use client';

import {
  useState,
  Suspense,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Trophy, Clock, Target, Info } from 'lucide-react';
import { GameComponent, GameMetadata, getDifficultyFromDay } from '@/lib/games';
import { useGameProgress } from '@/hooks/useGameProgress';
import RestartButton from '@/components/ui/restart-button';
import GameEndModal from '@/components/game-end-modal';
import type { ComponentType } from 'react';
import HintDropdown from '@/components/ui/hint-dropdown';
import { usePiggyBank } from '@/contexts/piggy-bank-context';

interface GameViewerProps {
  gameId: string;
  gameMetadata: GameMetadata;
  GameComponent: GameComponent;
  onExit: () => void;
  onReset?: () => void;
  gameData?: {
    day: number;
    dailyWord?: string;
    unlocked: boolean;
    gameType: string;
    gameMetadata: GameMetadata;
  };
  isLoading?: boolean;
}

const GameViewer = memo(function GameViewer({
  gameId,
  gameMetadata,
  GameComponent,
  onExit,
  onReset,
  gameData,
  isLoading = false,
}: GameViewerProps) {
  const router = useRouter();
  const [RulesComponent, setRulesComponent] = useState<ComponentType | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [unlockedWord, setUnlockedWord] = useState<string | undefined>(
    undefined
  );
  const [modalReady, setModalReady] = useState(false);

  // Detect if any modal is open
  useEffect(() => {
    const checkModal = () => {
      const modal = document.querySelector('[role="dialog"]');
      setIsModalOpen(modal !== null);
    };

    // Vérifier immédiatement
    checkModal();

    // Observer les changements dans le DOM
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  // Try loading an optional per-game Rules component
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import(`@/games/${gameId}/rules`);
        if (!cancelled) {
          setRulesComponent(() => mod.default || mod.Rules || null);
        }
      } catch {
        setRulesComponent(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  const { completeDay } = useGameProgress();
  usePiggyBank();
  type TusmoQueryDetail = {
    type: 'absent' | 'present' | 'correct';
    available: boolean;
  };
  const tusmoAvailable = useCallback(
    (kind: 'absent' | 'present' | 'correct') => {
      if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
      }
      const el = document.querySelector('[data-game-component]');
      if (!el) return false;
      const detail: TusmoQueryDetail = { type: kind, available: false };
      el.dispatchEvent(
        new CustomEvent<TusmoQueryDetail>('tusmo-query-available', {
          detail,
          bubbles: true,
        })
      );
      return Boolean(detail.available);
    },
    []
  );

  type G2048QueryDetail = { type: 'undo' | 'auto'; available: boolean };
  const game2048Available = useCallback((kind: 'undo' | 'auto') => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    const el = document.querySelector('[data-game-component]');
    if (!el) return false;
    const detail: G2048QueryDetail = { type: kind, available: false };
    el.dispatchEvent(
      new CustomEvent<G2048QueryDetail>('2048-query-available', {
        detail,
        bubbles: true,
      })
    );
    return Boolean(detail.available);
  }, []);

  type LightsOutQueryDetail = { type: 'auto'; available: boolean };
  const lightsOutAvailable = useCallback((kind: 'auto') => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    const el = document.querySelector('[data-game-component]');
    if (!el) return false;
    const detail: LightsOutQueryDetail = { type: kind, available: false };
    el.dispatchEvent(
      new CustomEvent<LightsOutQueryDetail>('lightsout-query-available', {
        detail,
        bubbles: true,
      })
    );
    return Boolean(detail.available);
  }, []);

  type MotsMelesQueryDetail = { type: 'reveal'; available: boolean };
  const motsMelesAvailable = useCallback((kind: 'reveal') => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    const el = document.querySelector('[data-game-component]');
    if (!el) return false;
    const detail: MotsMelesQueryDetail = { type: kind, available: false };
    el.dispatchEvent(
      new CustomEvent<MotsMelesQueryDetail>('motsmeles-query-available', {
        detail,
        bubbles: true,
      })
    );
    return Boolean(detail.available);
  }, []);

  type SudokuQueryDetail = { type: 'auto'; available: boolean };
  const sudokuAvailable = useCallback((kind: 'auto') => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false;
    }
    const el = document.querySelector('[data-game-component]');
    if (!el) return false;
    const detail: SudokuQueryDetail = { type: kind, available: false };
    el.dispatchEvent(
      new CustomEvent<SudokuQueryDetail>('sudoku-query-available', {
        detail,
        bubbles: true,
      })
    );
    return Boolean(detail.available);
  }, []);

  // Win callback
  const handleWin = useCallback(() => {
    console.log('🎉 Game won:', { gameId, day: gameData?.day });
    setWon(true);
    setGameOver(true);

    // Le mot est déjà disponible depuis le SSR, on l'affiche immédiatement
    if (gameData?.day && gameData?.dailyWord) {
      console.log('🔓 Unlocking word immediately:', gameData.dailyWord);
      completeDay(gameData.day, gameData.dailyWord, 1);
      setUnlockedWord(gameData.dailyWord);
    }
  }, [gameId, gameData?.day, gameData?.dailyWord, completeDay]);

  // Lose callback
  const handleLose = useCallback(() => {
    console.log('💀 Game lost:', { gameId, day: gameData?.day });
    setWon(false);
    setGameOver(true);
  }, [gameId, gameData?.day]);

  const handleExit = useCallback(() => {
    onExit();
    router.push('/');
  }, [onExit, router]);

  const handleReset = useCallback(() => {
    setGameOver(false);
    setWon(false);
    setUnlockedWord(undefined);
    setModalReady(false);
    onReset?.();
  }, [onReset]);

  // Delay modal display slightly to avoid immediate Enter key activating actions
  useEffect(() => {
    if (gameOver) {
      const t = setTimeout(() => setModalReady(true), 250);
      return () => clearTimeout(t);
    } else {
      setModalReady(false);
    }
  }, [gameOver]);

  // Use config data if available; otherwise fallback to metadata
  const displayConfig = useMemo(
    () => ({
      name: gameMetadata.name,
      description: gameMetadata.description,
      difficulty:
        gameMetadata.difficulty === 'dynamic'
          ? getDifficultyFromDay(gameData?.day || 1)
          : gameMetadata.difficulty,
      estimatedTime: gameMetadata.estimatedTime,
      objective: 'Terminer le jeu',
      logo: '🎮',
      instructions: gameMetadata.instructions,
    }),
    [gameMetadata, gameData?.day]
  );

  return (
    <div className='space-y-6'>
      {/* Game Header */}
      <div className='flex items-center justify-between md:flex-row flex-col gap-2'>
        <div className='flex items-center gap-3'>
          <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
            {gameData
              ? `Jour ${gameData.day} - ${displayConfig.name}`
              : displayConfig.name}
          </h1>

          {(gameId === 'sudoku' ||
            gameId === '2048' ||
            gameId === 'shifumi' ||
            gameId === 'mots-meles' ||
            gameId === 'lights-out') &&
            gameData &&
            (() => {
              const dynamicDifficulty = displayConfig.difficulty;

              return (
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    dynamicDifficulty === 'easy'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                      : dynamicDifficulty === 'medium'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                  }`}
                >
                  {dynamicDifficulty === 'easy'
                    ? 'Facile'
                    : dynamicDifficulty === 'medium'
                      ? 'Moyen'
                      : 'Difficile'}
                </span>
              );
            })()}
          {gameId === 'tusmo' && gameData?.dailyWord && (
            <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'>
              {gameData.dailyWord.length} lettres
            </span>
          )}
          {gameId === '2048' &&
            gameData &&
            (() => {
              // Compute target based on difficulty
              const getTargetFromDifficulty = (difficulty: string): number => {
                if (difficulty === 'easy') return 64;
                if (difficulty === 'medium') return 256;
                return 1024;
              };
              const target = getTargetFromDifficulty(displayConfig.difficulty);

              return (
                <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'>
                  Objectif {target}
                </span>
              );
            })()}
          {gameId === 'shifumi' &&
            gameData &&
            (() => {
              // Compute rounds-to-win based on difficulty
              const getRoundsToWinFromDifficulty = (
                difficulty: string
              ): number => {
                if (difficulty === 'easy') return 1;
                if (difficulty === 'medium') return 2;
                return 3;
              };
              const roundsToWin = getRoundsToWinFromDifficulty(
                displayConfig.difficulty
              );

              return (
                <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'>
                  {roundsToWin} manche{roundsToWin > 1 ? 's' : ''}
                </span>
              );
            })()}
        </div>

        {/* Action Buttons */}
        <div className='flex items-center gap-2'>
          {/* Hints dropdown */}
          {gameData && (
            <HintDropdown
              disabled={isLoading || isModalOpen}
              options={[
                {
                  id: 'solve',
                  label: 'Résoudre le jeu',
                  cost: 200,
                  action: () => {
                    const el = document.querySelector('[data-game-component]');
                    if (el) {
                      el.dispatchEvent(
                        new Event('debug-win', { bubbles: true })
                      );
                    }
                    // Fallback: resolve at viewer level
                    handleWin();
                  },
                },
                ...(gameId === 'tusmo'
                  ? [
                      {
                        id: 'tusmo-absent',
                        label: 'Dévoiler une lettre absente',
                        cost: 10,
                        can: () => tusmoAvailable('absent'),
                        disabled: !tusmoAvailable('absent'),
                        action: () => {
                          const el = document.querySelector(
                            '[data-game-component]'
                          );
                          el?.dispatchEvent(
                            new Event('tusmo-hint-absent', { bubbles: true })
                          );
                        },
                      },
                    ]
                  : []),
                ...(gameId === '2048'
                  ? [
                      {
                        id: '2048-auto',
                        label: 'Jouer le prochain coup',
                        cost: 10,
                        disabled: !game2048Available('auto'),
                        can: () => game2048Available('auto'),
                        action: () => {
                          const el = document.querySelector(
                            '[data-game-component]'
                          );
                          el?.dispatchEvent(
                            new Event('2048-auto-move', { bubbles: true })
                          );
                        },
                      },
                    ]
                  : []),
                ...(gameId === 'sudoku'
                  ? [
                      {
                        id: 'sudoku-auto',
                        label: 'Dévoiler un chiffre',
                        cost: 10,
                        disabled: !sudokuAvailable('auto'),
                        can: () => sudokuAvailable('auto'),
                        action: () => {
                          const el = document.querySelector(
                            '[data-game-component]'
                          );
                          el?.dispatchEvent(
                            new Event('sudoku-auto-move', { bubbles: true })
                          );
                        },
                      },
                    ]
                  : []),
                ...(gameId === 'lights-out'
                  ? [
                      {
                        id: 'lightsout-auto',
                        label: 'Jouer le prochain coup',
                        cost: 10,
                        disabled: !lightsOutAvailable('auto'),
                        can: () => lightsOutAvailable('auto'),
                        action: () => {
                          const el = document.querySelector(
                            '[data-game-component]'
                          );
                          el?.dispatchEvent(
                            new Event('lightsout-auto-move', { bubbles: true })
                          );
                        },
                      },
                    ]
                  : []),
                ...(gameId === 'mots-meles'
                  ? [
                      {
                        id: 'motsmeles-reveal',
                        label: 'Dévoiler un mot',
                        cost: 15,
                        disabled: !motsMelesAvailable('reveal'),
                        can: () => motsMelesAvailable('reveal'),
                        action: () => {
                          const el = document.querySelector(
                            '[data-game-component]'
                          );
                          el?.dispatchEvent(
                            new Event('motsmeles-reveal-word', {
                              bubbles: true,
                            })
                          );
                        },
                      },
                    ]
                  : []),
              ]}
            />
          )}
          {onReset && (
            <RestartButton
              onRestart={onReset}
              variant='icon-only'
              disabled={isLoading || isModalOpen}
            />
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                title='Règles du jeu'
                data-rules-button
              >
                <Info className='size-4' />
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle className='text-center'>Règles du jeu</DialogTitle>
              </DialogHeader>
              <div className='flex flex-col gap-4'>
                <p className='text-slate-600 dark:text-slate-300 mb-4'>
                  {displayConfig.description}
                </p>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                  <div className='text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
                    <Target className='size-6 mx-auto mb-2 text-emerald-600 dark:text-emerald-400' />
                    <p className='font-semibold text-slate-900 dark:text-slate-100'>
                      Difficulté
                    </p>
                    <p className='text-sm text-slate-600 dark:text-slate-300 capitalize'>
                      {displayConfig.difficulty}
                    </p>
                  </div>
                  <div className='text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                    <Clock className='size-6 mx-auto mb-2 text-green-600 dark:text-green-400' />
                    <p className='font-semibold text-slate-900 dark:text-slate-100'>
                      Durée
                    </p>
                    <p className='text-sm text-slate-600 dark:text-slate-300'>
                      {displayConfig.estimatedTime}
                    </p>
                  </div>
                  <div className='text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg'>
                    <Trophy className='size-6 mx-auto mb-2 text-purple-600 dark:text-purple-400' />
                    <p className='font-semibold text-slate-900 dark:text-slate-100'>
                      Objectif
                    </p>
                    <p className='text-sm text-slate-600 dark:text-slate-300'>
                      {displayConfig.objective}
                    </p>
                  </div>
                </div>

                {RulesComponent ? (
                  <Suspense
                    fallback={
                      <div className='text-center text-slate-500 dark:text-slate-400'>
                        Chargement des règles...
                      </div>
                    }
                  >
                    <RulesComponent />
                  </Suspense>
                ) : (
                  <>
                    <div className='space-y-2'>
                      <h3 className='font-semibold text-slate-900 dark:text-slate-100'>
                        📋 Instructions :
                      </h3>
                      <ul className='list-disc space-y-1 text-slate-600 dark:text-slate-300 ml-4'>
                        {displayConfig.instructions.map(
                          (instruction, index) => (
                            <li key={index}>{instruction}</li>
                          )
                        )}
                      </ul>
                    </div>
                  </>
                )}

                <div className='space-y-2 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700'>
                  <h3 className='font-semibold text-slate-900 dark:text-slate-100'>
                    💡 Besoin d&apos;aide ?
                  </h3>
                  <p className='text-sm text-slate-600 dark:text-slate-300'>
                    Si vous êtes bloqué(e), utilisez le bouton{' '}
                    <span className='font-semibold text-amber-600 dark:text-amber-400'>
                      &quot;Besoin d&apos;aide&quot;
                    </span>{' '}
                    pour obtenir des indices en utilisant vos pièces de la
                    tirelire. Vous pouvez gagner plus de pièces en jouant aux
                    mini-jeux !
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Game Component in Card */}
      <Card className='bg-gradient-card border-slate-200 dark:border-slate-700 shadow-lg'>
        <CardContent className='p-6'>
          <Suspense
            fallback={
              <div className='flex items-center justify-center h-96'>
                <div className='text-center'>
                  <div className='spinner size-12 border-emerald-600 mx-auto mb-4'></div>
                  <p className='text-slate-600 dark:text-slate-400'>
                    Chargement du jeu...
                  </p>
                </div>
              </div>
            }
          >
            {isLoading ? (
              <div className='flex items-center justify-center h-96'>
                <div className='text-center'>
                  <div className='spinner size-12 border-emerald-600 mx-auto mb-4'></div>
                  <p className='text-slate-600 dark:text-slate-400'>
                    Chargement du jeu...
                  </p>
                </div>
              </div>
            ) : (
              <div data-game-component>
                <GameComponent
                  onWin={handleWin}
                  onLose={handleLose}
                  onExit={handleExit}
                  onReset={handleReset}
                  gameData={gameData}
                />
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>

      {/* Game End Modal (delayed to avoid immediate Enter activation) */}
      {gameOver && modalReady && (
        <GameEndModal
          won={won}
          onRestart={handleReset}
          onExit={handleExit}
          unlockedWord={unlockedWord}
        />
      )}
    </div>
  );
});

export default GameViewer;
