'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameProps, getDifficultyFromDay } from '@/lib/games';

type Difficulty = 'easy' | 'medium' | 'hard';

function getGridSizeForDifficulty(d: Difficulty): number {
  if (d === 'easy') return 3;
  if (d === 'medium') return 5;
  return 7;
}

function createRandomBoard(size: number, rng: () => number = Math.random) {
  const board = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  // Apply a number of random toggles to ensure solvable randomness
  const toggles = size * size;
  for (let i = 0; i < toggles; i++) {
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    toggleAt(board, r, c);
  }
  return board;
}

function toggleAt(board: boolean[][], row: number, col: number) {
  const size = board.length;
  const flip = (r: number, c: number) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    board[r][c] = !board[r][c];
  };
  flip(row, col);
  flip(row - 1, col);
  flip(row + 1, col);
  flip(row, col - 1);
  flip(row, col + 1);
}

const LightsOut = memo(function LightsOut({ onWin, gameData }: GameProps) {
  const day = gameData?.day || 1;
  const difficulty: Difficulty = getDifficultyFromDay(day);
  const size = getGridSizeForDifficulty(difficulty);

  const [board, setBoard] = useState<boolean[][]>(() =>
    createRandomBoard(size)
  );
  const [isWon, setIsWon] = useState(false);

  useEffect(() => {
    // When reset signal changes, regenerate
    // caller triggers via key change; also expose a button locally
  }, [size]);

  const allOff = useMemo(
    () => board.every(row => row.every(cell => !cell)),
    [board]
  );

  useEffect(() => {
    if (allOff && !isWon) {
      setIsWon(true);
      onWin?.();
    }
  }, [allOff, isWon, onWin]);

  const handleCellClick = useCallback(
    (r: number, c: number) => {
      if (isWon) return;
      setBoard(prev => {
        const next = prev.map(row => row.slice());
        toggleAt(next, r, c);
        return next;
      });
    },
    [isWon]
  );

  return (
    <div className='flex flex-col gap-4 items-center'>
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col gap-3 items-center'>
            <div
              className='grid'
              style={{
                gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                gap: '8px',
              }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => (
                  <button
                    key={`${r}-${c}`}
                    onClick={() => handleCellClick(r, c)}
                    disabled={isWon}
                    className={cn(
                      'w-12 h-12 rounded-md border-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60 flex items-center justify-center',
                      cell
                        ? 'bg-amber-200 hover:bg-amber-300 border-amber-400 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/40 dark:border-yellow-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                    aria-label={`Cell ${r + 1}-${c + 1}`}
                    aria-pressed={cell}
                  >
                    {cell ? (
                      <Sun
                        className={cn(
                          'size-4',
                          'text-amber-600 dark:text-yellow-300'
                        )}
                        aria-hidden='true'
                      />
                    ) : (
                      <Moon
                        className={cn(
                          'size-4',
                          'text-slate-500 dark:text-slate-400'
                        )}
                        aria-hidden='true'
                      />
                    )}
                    <span className='sr-only'>
                      {cell ? 'Allumée' : 'Éteinte'}
                    </span>
                  </button>
                ))
              )}
            </div>
            {/* Restart button handled globally by GameViewer */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default LightsOut;
