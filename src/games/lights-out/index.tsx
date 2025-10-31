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

function createEmptyBoard(size: number) {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
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

  // Important: start with a deterministic board for SSR to avoid hydration mismatches
  const [board, setBoard] = useState<boolean[][]>(() => createEmptyBoard(size));
  const [isWon, setIsWon] = useState(false);
  const [ready, setReady] = useState(false);

  // Solve using row-chasing: try all first-row click patterns (2^size)
  // Return minimal sequence of clicks as ordered pairs (row-major order)
  const solveShortest = useCallback(
    (b: boolean[][]): { r: number; c: number }[] | null => {
      const n = size;
      if (!b || b.length !== n) return null;

      const cloneBoard = (src: boolean[][]) => src.map(row => row.slice());
      const applyClick = (bb: boolean[][], r: number, c: number) => {
        toggleAt(bb, r, c);
      };

      let bestSolution: { r: number; c: number }[] | null = null;

      const totalMasks = 1 << n; // first row patterns
      for (let mask = 0; mask < totalMasks; mask++) {
        const bb = cloneBoard(b);
        const clicks: { r: number; c: number }[] = [];

        // Apply first row pattern
        for (let c = 0; c < n; c++) {
          if ((mask >> c) & 1) {
            applyClick(bb, 0, c);
            clicks.push({ r: 0, c });
          }
        }

        // For each subsequent row, click where the cell above is on
        for (let r = 1; r < n; r++) {
          for (let c = 0; c < n; c++) {
            if (bb[r - 1][c]) {
              applyClick(bb, r, c);
              clicks.push({ r, c });
            }
          }
        }

        // Check last row all off
        let ok = true;
        for (let c = 0; c < n; c++) if (bb[n - 1][c]) ok = false;

        if (ok) {
          if (bestSolution === null || clicks.length < bestSolution.length) {
            bestSolution = clicks;
          }
        }
      }

      return bestSolution;
    },
    [size]
  );

  const findBestMove = useCallback((): { r: number; c: number } | null => {
    if (!ready || !board || board.length !== size) return null;
    const sol = solveShortest(board);
    if (!sol || sol.length === 0) return null;
    // Next move in the shortest path
    return sol[0] ?? null;
  }, [board, size, solveShortest, ready]);

  useEffect(() => {
    // Generate a random, solvable board on the client after hydration
    setBoard(createRandomBoard(size));
    setIsWon(false);
    setReady(true);
  }, [size]);

  const allOff = useMemo(
    () => board.every(row => row.every(cell => !cell)),
    [board]
  );

  useEffect(() => {
    if (!ready) return;
    if (allOff && !isWon) {
      setIsWon(true);
      onWin?.();
    }
  }, [allOff, isWon, onWin, ready]);

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

  // Hint integration: auto-move and availability
  useEffect(() => {
    const el = document.querySelector('[data-game-component]');
    if (!el) return;
    const handleAuto = () => {
      if (isWon) return;
      const move = findBestMove();
      if (move) handleCellClick(move.r, move.c);
    };
    const handleQuery = (evt: Event) => {
      const e = evt as CustomEvent<{ type: 'auto'; available?: boolean }>;
      if (!e.detail || e.detail.type !== 'auto') return;
      const move = findBestMove();
      e.detail.available = Boolean(move);
    };
    el.addEventListener('lightsout-auto-move', handleAuto);
    el.addEventListener('lightsout-query-available', handleQuery);
    return () => {
      el.removeEventListener('lightsout-auto-move', handleAuto);
      el.removeEventListener('lightsout-query-available', handleQuery);
    };
  }, [findBestMove, handleCellClick, isWon]);

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
