'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SimonProps {
  onWin: () => void;
  onLose: () => void;
  onClose: () => void;
}

const COLORS = [
  // Row 1: R (left), J/Y (right)
  {
    id: 'red',
    letter: 'R',
    emoji: '🔴',
    bg: 'bg-red-600',
    hover: 'hover:bg-red-600',
    light: 'bg-red-200 dark:bg-red-900/30',
    ring: 'ring-red-400',
    focusRing: 'focus:ring-red-500',
  },
  {
    id: 'yellow',
    letter: 'J/Y',
    emoji: '🟡',
    bg: 'bg-yellow-600',
    hover: 'hover:bg-yellow-600',
    light: 'bg-yellow-200 dark:bg-yellow-900/30',
    ring: 'ring-yellow-400',
    focusRing: 'focus:ring-yellow-500',
  },
  // Row 2: V/G (left), B (right)
  {
    id: 'green',
    letter: 'V/G',
    emoji: '🟢',
    bg: 'bg-green-600',
    hover: 'hover:bg-green-600',
    light: 'bg-green-200 dark:bg-green-900/30',
    ring: 'ring-green-400',
    focusRing: 'focus:ring-green-500',
  },
  {
    id: 'blue',
    letter: 'B',
    emoji: '🔵',
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-600',
    light: 'bg-blue-200 dark:bg-blue-900/30',
    ring: 'ring-blue-400',
    focusRing: 'focus:ring-blue-500',
  },
];

const config = {
  speed: 800, // Sequence display speed
  delay: 500, // Delay between colors
  maxLevel: 10, // Maximum level
};

export default function Simon({ onWin, onClose }: SimonProps) {
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerSequence, setPlayerSequence] = useState<string[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [pressedColor, setPressedColor] = useState<string | null>(null);

  const onWinRef = useRef(onWin);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onWinRef.current = onWin;
    onCloseRef.current = onClose;
  }, [onWin, onClose]);

  const generateSequence = useCallback(() => {
    const newSequence = Array.from(
      { length: currentLevel },
      () => COLORS[Math.floor(Math.random() * COLORS.length)].id
    );
    setSequence(newSequence);
    return newSequence;
  }, [currentLevel]);

  const playSequence = useCallback(async (seq: string[]) => {
    setIsPlaying(true);
    setIsPlayerTurn(false);
    setIsAnimating(true);

    for (let i = 0; i < seq.length; i++) {
      setActiveColor(seq[i]);
      await new Promise(resolve => setTimeout(resolve, config.speed));
      setActiveColor(null);
      if (i < seq.length - 1) {
        await new Promise(resolve => setTimeout(resolve, config.delay));
      }
    }

    setIsAnimating(false);
    setIsPlaying(false);
    setIsPlayerTurn(true);
    setPlayerSequence([]);
  }, []);

  const startNewLevel = useCallback(() => {
    const newSequence = generateSequence();
    playSequence(newSequence);
  }, [generateSequence, playSequence]);

  const reset = useCallback(() => {
    setSequence([]);
    setPlayerSequence([]);
    setCurrentLevel(1);
    setIsPlaying(false);
    setIsPlayerTurn(false);
    setIsAnimating(false);
    setActiveColor(null);
    setPressedColor(null);
  }, []);

  const handleColorClick = useCallback(
    (colorId: string) => {
      if (!isPlayerTurn || isAnimating) return;

      // Light up the pressed button
      setPressedColor(colorId);
      setTimeout(() => setPressedColor(null), 200);

      const newPlayerSequence = [...playerSequence, colorId];
      setPlayerSequence(newPlayerSequence);

      // Check if sequence is correct
      const expectedSequence = sequence.slice(0, newPlayerSequence.length);
      const isCorrect = newPlayerSequence.every(
        (color, index) => color === expectedSequence[index]
      );

      if (!isCorrect) {
        // Wrong sequence - reset to level 0
        setTimeout(() => {
          setCurrentLevel(1);
          setSequence([]);
          setPlayerSequence([]);
          setIsPlaying(false);
          setIsPlayerTurn(false);
          setIsAnimating(false);
          setActiveColor(null);
        }, 1000);
        return;
      }

      if (newPlayerSequence.length === sequence.length) {
        // Correct full sequence - award coins
        setTimeout(() => {
          onWinRef.current();
        }, 100);

        if (currentLevel >= config.maxLevel) {
          // Victoire finale - reset au niveau 1
          setTimeout(() => {
            setCurrentLevel(1);
            setSequence([]);
            setPlayerSequence([]);
            setIsPlaying(false);
            setIsPlayerTurn(false);
            setIsAnimating(false);
            setActiveColor(null);
          }, 1000);
          return;
        }

        // Passer au niveau suivant
        setTimeout(() => {
          setCurrentLevel(prev => prev + 1);
          startNewLevel();
        }, 1000);
      }
    },
    [
      isPlayerTurn,
      isAnimating,
      playerSequence,
      sequence,
      currentLevel,
      startNewLevel,
    ]
  );

  // Keyboard shortcuts: R (rouge), B (bleu), V/G (vert), J/Y (jaune)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isPlayerTurn || isAnimating || isPlaying) return;
      const k = e.key.toLowerCase();
      let color: string | null = null;
      if (k === 'r') color = 'red';
      else if (k === 'b') color = 'blue';
      else if (k === 'g' || k === 'v') color = 'green';
      else if (k === 'y' || k === 'j') color = 'yellow';
      if (color) {
        e.preventDefault();
        handleColorClick(color);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPlayerTurn, isAnimating, isPlaying, handleColorClick]);

  // Start the game
  useEffect(() => {
    if (sequence.length === 0) {
      startNewLevel();
    }
  }, [sequence.length, startNewLevel]);

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2'>
            🎵 Simon
          </DialogTitle>
          <DialogDescription>
            Gagnez 1 pièce à chaque séquence réussie.
          </DialogDescription>
        </DialogHeader>

        <div>
          {/* Grille Simon */}
          <div className='grid grid-cols-2 gap-2 w-full max-w-[200px] mx-auto'>
            {COLORS.map(color => (
              <motion.div
                key={color.id}
                className='aspect-square w-full'
                whileTap={isPlayerTurn && !isPlaying ? { scale: 0.95 } : {}}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <Button
                  onClick={() => handleColorClick(color.id)}
                  disabled={!isPlayerTurn || isAnimating || isPlaying}
                  aria-pressed={
                    activeColor === color.id || pressedColor === color.id
                  }
                  aria-label={`Bouton ${color.id}`}
                  className={`h-full w-full p-0 border border-slate-300 dark:border-slate-600 focus:outline-none focus:ring-2 ${color.focusRing} disabled:opacity-90 flex items-center justify-center ${
                    activeColor === color.id || pressedColor === color.id
                      ? `${color.bg} text-white ring-2 ${color.ring}`
                      : `${color.light} text-slate-700 dark:text-slate-300 hover:${color.hover}`
                  }`}
                >
                  <div
                    className='relative w-10 h-10 rounded-full inline-flex items-center justify-center'
                    aria-hidden='true'
                  >
                    <div
                      className={
                        activeColor === color.id || pressedColor === color.id
                          ? 'absolute inset-0 rounded-full bg-white'
                          : `absolute inset-0 rounded-full ${color.bg} opacity-80`
                      }
                    />
                    <span
                      className={
                        activeColor === color.id || pressedColor === color.id
                          ? 'relative z-10 text-slate-900 font-bold'
                          : 'relative z-10 text-white font-bold'
                      }
                    >
                      {color.letter}
                    </span>
                  </div>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={reset} variant='outline' size='sm'>
            Recommencer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
