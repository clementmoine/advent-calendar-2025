'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useInputLock } from '@/hooks/useSingleFire';
import { useSingleFire } from '@/hooks/useSingleFire';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Keyboard from '@/components/keyboard';

type Choice = 'pierre' | 'papier' | 'ciseaux';

const CHOICE_EMOJIS = {
  pierre: '✊',
  papier: '✋',
  ciseaux: '✌️',
} as const;

interface GameState {
  playerScore: number;
  computerScore: number;
  playerChoice: Choice | null;
  computerChoice: Choice | null;
  lastResult: 'win' | 'lose' | 'tie' | null;
  isRevealing: boolean;
  gameOver: boolean;
  phase: 'idle' | 'choosing' | 'shi' | 'fu' | 'reveal' | 'result';
}

interface ShifumiProps {
  onWin: () => void;
  onLose: () => void;
  onClose: () => void;
}

const config = {
  roundsToWin: 2,
  shiDelay: 500,
  fuDelay: 500,
  revealDelay: 200,
};

// Chant variants per round (rotates each round)
const CHANTS: [string, string, string][] = [
  ['SHI', 'FU', 'MI'],
  ['JAN', 'KEN', 'PON'],
  ['PIERRE', 'FEUILLE', 'CISEAUX'],
  ['ROCK', 'PAPER', 'SCISSORS'],
];

export default function Shifumi({ onWin, onLose, onClose }: ShifumiProps) {
  const { tryLock, release } = useInputLock();
  const { fire: awardOnce, reset: resetAward } = useSingleFire();
  const [gameState, setGameState] = useState<GameState>({
    playerScore: 0,
    computerScore: 0,
    playerChoice: null,
    computerChoice: null,
    lastResult: null,
    isRevealing: false,
    gameOver: false,
    phase: 'idle',
  });
  const [chantLabels, setChantLabels] = useState<[string, string, string]>(
    CHANTS[0]
  );
  const chantIndexRef = useRef(0);

  const determineWinner = useCallback(
    (player: Choice, computer: Choice): 'win' | 'lose' | 'tie' => {
      if (player === computer) return 'tie';
      if (
        (player === 'pierre' && computer === 'ciseaux') ||
        (player === 'papier' && computer === 'pierre') ||
        (player === 'ciseaux' && computer === 'papier')
      ) {
        return 'win';
      }
      return 'lose';
    },
    []
  );

  // Track consecutive player losses to apply a mild pity bias
  const lossStreakRef = useRef(0);

  const chooseComputerChoice = useCallback((player: Choice): Choice => {
    // Desired outcome probabilities
    // Baseline: 45% win, 20% tie, 35% lose (for the player)
    // If player lost ≥3 in a row: 55% win, 20% tie, 25% lose (mild pity)
    const streak = lossStreakRef.current;
    const pWin = streak >= 3 ? 0.55 : 0.45; // player wins
    const pTie = 0.2; // tie

    const r = Math.random();
    let outcome: 'win' | 'tie' | 'lose';
    if (r < pWin) outcome = 'win';
    else if (r < pWin + pTie) outcome = 'tie';
    else outcome = 'lose';

    // Map desired outcome to computer choice
    const beats: Record<Choice, Choice> = {
      pierre: 'ciseaux',
      papier: 'pierre',
      ciseaux: 'papier',
    };
    const losesTo: Record<Choice, Choice> = {
      pierre: 'papier',
      papier: 'ciseaux',
      ciseaux: 'pierre',
    };
    if (outcome === 'win') {
      // player should beat computer → computer picks what player beats
      return beats[player];
    }
    if (outcome === 'lose') {
      // computer should beat player → computer picks what beats player
      return losesTo[player];
    }
    return player; // tie
  }, []);

  const handleChoice = useCallback(
    (choice: Choice) => {
      // Prevent duplicate triggers (e.g., click + keydown in the same frame)
      if (gameState.phase !== 'idle') return;
      if (!tryLock()) return;
      // reset one-shot award at the start of a round
      resetAward();

      const computerChoice: Choice = chooseComputerChoice(choice);

      // Rotate chant labels for this round
      setChantLabels(CHANTS[chantIndexRef.current]);
      chantIndexRef.current = (chantIndexRef.current + 1) % CHANTS.length;

      setGameState(prev => ({
        ...prev,
        playerChoice: choice,
        computerChoice,
        phase: 'choosing',
      }));

      // Animation SHI
      setTimeout(() => {
        console.log('Animation SHI');
        setGameState(prev => ({ ...prev, phase: 'shi' }));
      }, 100);

      // Animation FU
      setTimeout(() => {
        console.log('Animation FU');
        setGameState(prev => ({ ...prev, phase: 'fu' }));
      }, 100 + config.shiDelay);

      // Reveal
      setTimeout(
        () => {
          console.log('Animation REVEAL');
          setGameState(prev => ({ ...prev, phase: 'reveal' }));
        },
        100 + config.shiDelay + config.fuDelay
      );

      // Result
      setTimeout(
        () => {
          const result = determineWinner(choice, computerChoice);
          setGameState(prev => {
            const newState: GameState = {
              ...prev,
              lastResult: result,
              phase: 'result',
            };

            if (result === 'win') {
              newState.playerScore = prev.playerScore + 1;
              awardOnce(onWin);
              lossStreakRef.current = 0;
            } else if (result === 'lose') {
              newState.computerScore = prev.computerScore + 1;
              lossStreakRef.current = Math.min(10, lossStreakRef.current + 1);
            }

            // Check if game is over
            if (
              newState.playerScore >= config.roundsToWin ||
              newState.computerScore >= config.roundsToWin
            ) {
              newState.gameOver = true;
              if (newState.computerScore >= config.roundsToWin) {
                onLose();
              }
            }

            return newState;
          });
        },
        config.shiDelay + config.fuDelay + config.revealDelay
      );

      // Return to idle after a delay
      setTimeout(
        () => {
          setGameState(prev => ({
            ...prev,
            phase: 'idle',
            playerChoice: null,
            computerChoice: null,
            lastResult: null,
          }));
          release();
          resetAward();
        },
        config.shiDelay + config.fuDelay + config.revealDelay + 2000
      );
    },
    [
      gameState.phase,
      determineWinner,
      chooseComputerChoice,
      onWin,
      onLose,
      tryLock,
      resetAward,
      awardOnce,
      release,
    ]
  );

  // Pressed keys (for unified keyboard feedback)
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      setPressedKeys(prev => new Set(prev).add(e.key));
      if (gameState.phase !== 'idle') return;

      const map: Record<string, Choice> = {
        '1': 'pierre',
        '&': 'pierre',
        a: 'pierre',
        A: 'pierre',
        ArrowLeft: 'pierre',
        '2': 'papier',
        é: 'papier',
        É: 'papier',
        z: 'papier',
        Z: 'papier',
        ArrowUp: 'papier',
        '3': 'ciseaux',
        '"': 'ciseaux',
        e: 'ciseaux',
        E: 'ciseaux',
        ArrowRight: 'ciseaux',
      };
      const choice = map[e.key as keyof typeof map];
      if (choice) {
        e.preventDefault();
        handleChoice(choice);
      }
    };
    const up = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key);
        return next;
      });
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [gameState.phase, handleChoice]);

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>✊ Shifumi</DialogTitle>

          <DialogDescription>
            Gagnez 1 pièce par manche gagnée.
          </DialogDescription>
        </DialogHeader>

        <div>
          {/* Scores */}
          <div className='flex justify-center gap-4'>
            <div className='flex flex-col flex-1 items-center justify-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
              <span className='text-xs text-blue-700 dark:text-blue-300'>
                Vous
              </span>
              <motion.div
                className={`text-xl font-bold ${
                  gameState.phase === 'result' && gameState.lastResult === 'win'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-blue-700 dark:text-blue-300'
                }`}
                animate={
                  gameState.phase === 'result' && gameState.lastResult === 'win'
                    ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                    : {}
                }
                transition={{ duration: 0.5, repeat: 2 }}
              >
                {gameState.playerScore}
              </motion.div>
            </div>

            <div className='flex flex-col flex-1 items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg'>
              <span className='text-xs text-red-700 dark:text-red-300'>
                Ordinateur
              </span>
              <motion.div
                className={`text-xl font-bold ${
                  gameState.phase === 'result' &&
                  gameState.lastResult === 'lose'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-700 dark:text-red-300'
                }`}
                animate={
                  gameState.phase === 'result' &&
                  gameState.lastResult === 'lose'
                    ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                    : {}
                }
                transition={{ duration: 0.5, repeat: 2 }}
              >
                {gameState.computerScore}
              </motion.div>
            </div>
          </div>

          {/* Zone de jeu */}
          <div className='relative h-32'>
            <div className='absolute inset-0 flex items-center justify-center gap-48'>
              {/* Main du joueur */}
              <motion.div
                className='text-6xl'
                animate={
                  gameState.phase === 'reveal' && gameState.playerChoice
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : gameState.phase === 'result' &&
                        gameState.lastResult === 'win'
                      ? {
                          x: 50,
                          rotate: 15,
                          scale: 1.2,
                        }
                      : gameState.phase === 'result' &&
                          gameState.lastResult === 'tie'
                        ? {
                            x: 20,
                            rotate: 10,
                            scale: 1.1,
                          }
                        : {}
                }
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence mode='wait'>
                  {(gameState.phase === 'reveal' ||
                    gameState.phase === 'result') &&
                  gameState.playerChoice ? (
                    <motion.div
                      key='player-choice'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0 }}
                    >
                      {CHOICE_EMOJIS[gameState.playerChoice]}
                    </motion.div>
                  ) : (
                    <motion.div
                      key='fist'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0 }}
                    >
                      🤜
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Animation SHI FU MI au centre */}
              <div className='absolute inset-0 w-full h-full flex items-center justify-center'>
                <AnimatePresence>
                  {gameState.phase === 'shi' && (
                    <motion.div
                      key='shi'
                      initial={{ opacity: 0, scale: 1, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1, y: 10 }}
                      className='absolute text-3xl md:text-4xl font-bold text-slate-700 dark:text-slate-300'
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    >
                      {chantLabels[0]}
                    </motion.div>
                  )}
                  {gameState.phase === 'fu' && (
                    <motion.div
                      key='fu'
                      initial={{ opacity: 0, scale: 1, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1, y: 10 }}
                      className='absolute text-3xl md:text-4xl font-bold text-slate-700 dark:text-slate-300'
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    >
                      {chantLabels[1]}
                    </motion.div>
                  )}
                  {gameState.phase === 'reveal' && (
                    <motion.div
                      key='mi'
                      initial={{ opacity: 0, scale: 1, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 1, y: 10 }}
                      className='absolute text-3xl md:text-4xl font-bold text-slate-700 dark:text-slate-300'
                      transition={{
                        duration: 0.2,
                        ease: [0.4, 0, 0.2, 1],
                      }}
                    >
                      {chantLabels[2]}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Main de l'ordinateur */}
              <motion.div
                className='text-6xl'
                animate={
                  gameState.phase === 'reveal' && gameState.computerChoice
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : gameState.phase === 'result' &&
                        gameState.lastResult === 'lose'
                      ? {
                          x: -50,
                          rotate: -15,
                          scale: 1.2,
                        }
                      : gameState.phase === 'result' &&
                          gameState.lastResult === 'tie'
                        ? {
                            x: -20,
                            rotate: -10,
                            scale: 1.1,
                          }
                        : {}
                }
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence mode='wait'>
                  {(gameState.phase === 'reveal' ||
                    gameState.phase === 'result') &&
                  gameState.computerChoice ? (
                    <motion.div
                      key='computer-choice'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0 }}
                    >
                      {CHOICE_EMOJIS[gameState.computerChoice]}
                    </motion.div>
                  ) : (
                    <motion.div
                      key='fist'
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0 }}
                    >
                      🤛
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Keyboard choices */}
          <div className='flex justify-center'>
            <div className='w-[360px]'>
              <Keyboard
                variant='custom'
                rows={[
                  [
                    CHOICE_EMOJIS.pierre,
                    CHOICE_EMOJIS.papier,
                    CHOICE_EMOJIS.ciseaux,
                  ],
                ]}
                aliases={{
                  [CHOICE_EMOJIS.pierre]: ['1', '&', 'a', 'A', 'ArrowLeft'],
                  [CHOICE_EMOJIS.papier]: ['2', 'é', 'É', 'z', 'Z', 'ArrowUp'],
                  [CHOICE_EMOJIS.ciseaux]: ['3', '"', 'e', 'E', 'ArrowRight'],
                }}
                pressedKeys={pressedKeys}
                disabled={gameState.phase !== 'idle'}
                onKey={key => {
                  const choiceMap: Record<string, Choice> = {
                    [CHOICE_EMOJIS.pierre]: 'pierre',
                    [CHOICE_EMOJIS.papier]: 'papier',
                    [CHOICE_EMOJIS.ciseaux]: 'ciseaux',
                  };
                  const choice = choiceMap[key];
                  if (choice) handleChoice(choice);
                }}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
