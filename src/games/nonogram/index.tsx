'use client';

import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GameProps, getDifficultyFromDay } from '@/lib/games';

type Difficulty = 'easy' | 'medium' | 'hard';
type CellState = 'empty' | 'filled' | 'marked';

function getGridSizeForDifficulty(d: Difficulty): number {
  if (d === 'easy') return 5;
  if (d === 'medium') return 8;
  return 10;
}

// Deterministic RNG
function createRNG(seed: string): () => number {
  const xfnv1a = (str: string) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
    }
    return h >>> 0;
  };
  const mulberry32 = (a: number) => {
    return () => {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  return mulberry32(xfnv1a(seed));
}

// Generate random puzzle solution
function generatePuzzleSolution(size: number, rng: () => number): boolean[][] {
  const solution = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  
  // Fill with random pattern (about 40-60% filled)
  const fillRate = 0.4 + rng() * 0.2;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      solution[r][c] = rng() < fillRate;
    }
  }
  
  // Apply some smoothing to make patterns more interesting
  for (let i = 0; i < size * 2; i++) {
    const r = Math.floor(rng() * size);
    const c = Math.floor(rng() * size);
    if (r > 0 && c > 0 && r < size - 1 && c < size - 1) {
      const neighbors = [
        solution[r - 1][c],
        solution[r + 1][c],
        solution[r][c - 1],
        solution[r][c + 1],
      ];
      const filledCount = neighbors.filter(Boolean).length;
      if (filledCount >= 3) solution[r][c] = true;
      if (filledCount <= 1) solution[r][c] = false;
    }
  }
  
  return solution;
}

// Calculate clues for a row/column
function calculateClues(line: boolean[]): number[] {
  const clues: number[] = [];
  let currentGroup = 0;
  
  for (const cell of line) {
    if (cell) {
      currentGroup++;
    } else {
      if (currentGroup > 0) {
        clues.push(currentGroup);
        currentGroup = 0;
      }
    }
  }
  
  if (currentGroup > 0) {
    clues.push(currentGroup);
  }
  
  return clues; // Return empty array if no filled cells
}

const Nonogram = memo(function Nonogram({
  onWin,
  gameData,
}: GameProps) {
  const day = gameData?.day || 1;
  const difficulty: Difficulty = getDifficultyFromDay(day);
  const size = getGridSizeForDifficulty(difficulty);

  // Generate puzzle deterministically
  const { solution, rowClues, colClues } = useMemo(() => {
    const seedString = `nonogram-${day}-${difficulty}-${size}`;
    const rng = createRNG(seedString);
    const sol = generatePuzzleSolution(size, rng);
    
    const rowCls = sol.map(row => calculateClues(row));
    const colCls: number[][] = [];
    for (let c = 0; c < size; c++) {
      const col = sol.map(row => row[c]);
      colCls.push(calculateClues(col));
    }
    
    return { solution: sol, rowClues: rowCls, colClues: colCls };
  }, [day, difficulty, size]);

  const [grid, setGrid] = useState<CellState[][]>(() =>
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => 'empty')
    )
  );
  const [isWon, setIsWon] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragState, setDragState] = useState<'filled' | 'marked' | null>(null);

  // Verify solution consistency on mount (debug only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Recalculate clues from solution to verify consistency
      const verifyRowClues = solution.map(row => calculateClues(row));
      const verifyColClues: number[][] = [];
      for (let c = 0; c < size; c++) {
        const col = solution.map(row => row[c]);
        verifyColClues.push(calculateClues(col));
      }
      
      // Log for debugging
      console.log('🔍 Nonogram debug:', {
        size,
        solution: solution.map(row => row.map(c => c ? 'X' : '.').join('')),
        rowClues,
        verifyRowClues,
        colClues,
        verifyColClues,
      });
      
      // Check if calculated clues match stored clues
      const rowMatch = rowClues.every((clues, i) => 
        JSON.stringify(clues) === JSON.stringify(verifyRowClues[i])
      );
      const colMatch = colClues.every((clues, i) => 
        JSON.stringify(clues) === JSON.stringify(verifyColClues[i])
      );
      
      if (!rowMatch || !colMatch) {
        console.error('⚠️ Nonogram solution mismatch!', {
          rowClues,
          verifyRowClues,
          colClues,
          verifyColClues,
          solution: solution.map(row => row.map(c => c ? 'X' : '.').join('')),
        });
      }
    }
  }, [solution, rowClues, colClues, size]);

  // Check if puzzle is solved
  const checkWin = useCallback(() => {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const shouldBeFilled = solution[r][c];
        const isFilled = grid[r][c] === 'filled';
        if (shouldBeFilled !== isFilled) return false;
      }
    }
    return true;
  }, [grid, solution, size]);

  // Detect win and reveal solution
  useEffect(() => {
    if (!isWon && checkWin()) {
      // Marquer le puzzle comme terminé
      setIsWon(true);

      // Colorier les cases qui font partie de la solution
      // sans effacer ce que le joueur a déjà bien rempli
      setGrid(prev =>
        prev.map((row, r) =>
          row.map((cell, c) =>
            solution[r][c] ? 'filled' : cell
          )
        )
      );
    }
  }, [grid, isWon, checkWin, solution]);

  // Trigger win callback after revealing the solution
  useEffect(() => {
    if (isWon && onWin) {
      const timeout = setTimeout(() => {
        onWin();
      }, 1200);

      return () => clearTimeout(timeout);
    }
  }, [isWon, onWin]);

  const handleCellClick = useCallback(
    (r: number, c: number, isRightClick = false) => {
      if (isWon) return;

      setGrid(prev => {
        const next = prev.map(row => row.slice());
        const current = next[r][c];

        if (isRightClick) {
          next[r][c] = current === 'marked' ? 'empty' : 'marked';
        } else {
          if (current === 'filled') {
            next[r][c] = 'empty';
          } else {
            next[r][c] = 'filled';
          }
        }

        return next;
      });
    },
    [isWon]
  );

  const handleCellMouseDown = useCallback(
    (r: number, c: number, e: React.MouseEvent) => {
      if (isWon) return;
      e.preventDefault();
      const isRightClick = e.button === 2 || e.ctrlKey || e.metaKey;
      const newState = isRightClick ? 'marked' : 'filled';
      setIsDragging(true);
      setDragState(newState);
      handleCellClick(r, c, isRightClick);
    },
    [isWon, handleCellClick]
  );

  const handleCellMouseEnter = useCallback(
    (r: number, c: number) => {
      if (!isDragging || !dragState || isWon) return;
      setGrid(prev => {
        const next = prev.map(row => row.slice());
        next[r][c] = dragState === 'marked' ? 'marked' : 'filled';
        return next;
      });
    },
    [isDragging, dragState, isWon]
  );

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setDragState(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', e => e.preventDefault());
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', e => e.preventDefault());
    };
  }, []);

  // Hint integration: reveal one correct cell
  useEffect(() => {
    const el = document.querySelector('[data-game-component]');
    if (!el) return;

    const revealOneCell = () => {
      if (isWon) return;
      // Find a cell that should be filled but isn't yet
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (solution[r][c] && grid[r][c] !== 'filled') {
            setGrid(prev => {
              const next = prev.map(row => row.slice());
              next[r][c] = 'filled';
              return next;
            });
            return;
          }
        }
      }
    };

    const handleAuto = () => {
      revealOneCell();
    };

    const handleQuery = (evt: Event) => {
      const e = evt as CustomEvent<{ type: 'auto'; available?: boolean }>;
      if (!e.detail || e.detail.type !== 'auto') return;
      let available = false;
      if (!isWon) {
        outer: for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (solution[r][c] && grid[r][c] !== 'filled') {
              available = true;
              break outer;
            }
          }
        }
      }
      e.detail.available = available;
    };

    el.addEventListener('nonogram-auto-cell', handleAuto);
    el.addEventListener('nonogram-query-available', handleQuery);

    return () => {
      el.removeEventListener('nonogram-auto-cell', handleAuto);
      el.removeEventListener('nonogram-query-available', handleQuery);
    };
  }, [grid, isWon, size, solution]);

  // Calculate max clues, but handle empty arrays properly
  const maxRowClues = Math.max(
    ...rowClues.map(c => c.length),
    1
  );
  const maxColClues = Math.max(
    ...colClues.map(c => c.length),
    1
  );

  return (
    <div className='flex flex-col gap-4 items-center' data-game-component>
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col gap-1'>
            {/* Top section: corner spacer + column clues */}
            <div className='flex gap-1 items-start'>
              {/* Top-left corner spacer */}
              <div
                style={{
                  width: `${maxRowClues * 32 + (maxRowClues - 1) * 4}px`,
                  height: `${maxColClues * 32 + (maxColClues - 1) * 4}px`,
                  flexShrink: 0,
                }}
              />

              {/* Column clues - one column per grid column */}
              {colClues.map((clues, col) => (
                <div
                  key={`col-clues-${col}`}
                  className='flex flex-col gap-1'
                  style={{ width: '32px' }}
                >
                  {Array.from({ length: maxColClues }, (_, idx) => {
                    // Display clues from top to bottom: first clue at top
                    // If we have maxColClues=3 and clues=[2,1], we want: empty, 2, 1
                    // So clueIdx should be: idx - (maxColClues - clues.length)
                    const clueIdx = idx - (maxColClues - clues.length);
                    const clue = clueIdx >= 0 && clueIdx < clues.length ? clues[clueIdx] : null;
                    return (
                      <div
                        key={`col-${col}-${idx}`}
                        className='w-8 h-8 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-300'
                      >
                        {clue !== null ? clue : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Grid rows: row clues + cells */}
            {grid.map((row, r) => (
              <div key={`row-${r}`} className='flex gap-1 items-start'>
                {/* Row clues - aligned left to right */}
                <div className='flex gap-1'>
                  {Array.from({ length: maxRowClues }, (_, idx) => {
                    const clues = rowClues[r] || [];
                    // Align clues to the right (left-padding with empty cells)
                    // If maxRowClues=3 and clues=[1,2], we want: '', '', '1', '2'
                    // So: idx=0 -> empty, idx=1 -> empty, idx=2 -> clues[0]=1, idx=3 -> clues[1]=2
                    // But we only have maxRowClues items, so: idx=0 -> empty, idx=1 -> clues[0]=1, idx=2 -> clues[1]=2
                    const padding = maxRowClues - clues.length;
                    const clueIdx = idx - padding;
                    const clue = clueIdx >= 0 && clueIdx < clues.length ? clues[clueIdx] : null;
                    return (
                      <div
                        key={`row-${r}-clue-${idx}`}
                        className='w-8 h-8 flex items-center justify-center text-sm font-semibold text-slate-700 dark:text-slate-300'
                      >
                        {clue !== null ? clue : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Grid cells */}
                <div className='flex gap-1'>
                  {row.map((cell, c) => (
                    <button
                      key={`cell-${r}-${c}`}
                      onMouseDown={e => handleCellMouseDown(r, c, e)}
                      onMouseEnter={() => handleCellMouseEnter(r, c)}
                      onContextMenu={e => {
                        e.preventDefault();
                        handleCellClick(r, c, true);
                      }}
                      disabled={isWon}
                      className={cn(
                        'w-8 h-8 rounded border-2 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60',
                        cell === 'filled'
                          ? isWon
                            ? 'bg-emerald-500 border-emerald-600 dark:bg-emerald-600 dark:border-emerald-400'
                            : 'bg-slate-900 dark:bg-slate-100 border-slate-700 dark:border-slate-300'
                          : cell === 'marked'
                            ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                      )}
                      aria-label={`Cell ${r + 1}-${c + 1}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default Nonogram;
