'use client';

import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Keyboard from '@/components/keyboard';
import { GameProps, getDifficultyFromDay } from '@/lib/games';
import { cn } from '@/lib/utils';

// Sudoku generator
class SudokuGenerator {
  private static readonly SIZE = 9;
  private static readonly BOX_SIZE = 3;

  // Generate a full valid grid
  static generateCompleteGrid(): number[][] {
    const grid: number[][] = Array(this.SIZE)
      .fill(null)
      .map(() => Array(this.SIZE).fill(0));
    this.fillGrid(grid);
    return grid;
  }

  // Recursively fill the grid
  private static fillGrid(grid: number[][]): boolean {
    for (let row = 0; row < this.SIZE; row++) {
      for (let col = 0; col < this.SIZE; col++) {
        if (grid[row][col] === 0) {
          const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

          for (const num of numbers) {
            if (this.isValidPlacement(grid, row, col, num)) {
              grid[row][col] = num;

              if (this.fillGrid(grid)) {
                return true;
              }

              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  // Check whether a placement is valid
  private static isValidPlacement(
    grid: number[][],
    row: number,
    col: number,
    num: number
  ): boolean {
    // Check row
    for (let x = 0; x < this.SIZE; x++) {
      if (grid[row][x] === num) return false;
    }

    // Check column
    for (let x = 0; x < this.SIZE; x++) {
      if (grid[x][col] === num) return false;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / this.BOX_SIZE) * this.BOX_SIZE;
    const boxCol = Math.floor(col / this.BOX_SIZE) * this.BOX_SIZE;

    for (let i = 0; i < this.BOX_SIZE; i++) {
      for (let j = 0; j < this.BOX_SIZE; j++) {
        if (grid[boxRow + i][boxCol + j] === num) return false;
      }
    }

    return true;
  }

  // Shuffle an array
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Generate a puzzle grid by removing numbers according to difficulty
  static generateGameGrid(difficulty: 'easy' | 'medium' | 'hard'): {
    grid: number[][];
    solution: number[][];
  } {
    const solution = this.generateCompleteGrid();
    const grid = solution.map(row => [...row]);

    // Number of cells to empty by difficulty
    const cellsToRemove = {
      easy: 35, // ~43% de cellules vides
      medium: 45, // ~56% de cellules vides
      hard: 55, // ~68% de cellules vides
    };

    const cells = [];
    for (let row = 0; row < this.SIZE; row++) {
      for (let col = 0; col < this.SIZE; col++) {
        cells.push({ row, col });
      }
    }

    // Shuffle and remove cells
    const shuffledCells = this.shuffleArray(cells);
    for (let i = 0; i < cellsToRemove[difficulty]; i++) {
      const { row, col } = shuffledCells[i];
      grid[row][col] = 0;
    }

    return { grid, solution };
  }
}

type Difficulty = 'easy' | 'medium' | 'hard';

const SudokuGame = memo(function SudokuGame({
  onWin,
  onLose,
  gameData,
}: GameProps) {
  const day = gameData?.day || 1;
  const [difficulty] = useState<Difficulty>(getDifficultyFromDay(day));
  const [sudokuData, setSudokuData] = useState<{
    grid: number[][];
    solution: number[][];
  } | null>(null);
  const [initialGrid, setInitialGrid] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [, setWon] = useState(false);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Generate grid on mount
  useEffect(() => {
    const generated = SudokuGenerator.generateGameGrid(difficulty);
    setSudokuData(generated);
    setInitialGrid(generated.grid.map(row => [...row]));
  }, [difficulty]);

  const grid = useMemo(() => sudokuData?.grid || [], [sudokuData]);

  const isInitialCell = useCallback(
    (row: number, col: number) => {
      // A cell is "initial" if it was filled in the generated grid
      return (
        initialGrid.length > 0 &&
        initialGrid[row] &&
        initialGrid[row][col] !== 0
      );
    },
    [initialGrid]
  );

  // Check grid matches solution exactly
  const isGridSolved = useCallback(
    (currentGrid: number[][]) => {
      if (!sudokuData) return false;
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (currentGrid[r][c] !== sudokuData.solution[r][c]) return false;
        }
      }
      return true;
    },
    [sudokuData]
  );

  // Check whether a cell is in conflict
  const isCellInConflict = (row: number, col: number) => {
    const cellValue = grid[row][col];
    if (cellValue === 0) return false;

    // Check row
    for (let x = 0; x < 9; x++) {
      if (x !== col && grid[row][x] === cellValue) return true;
    }

    // Check column
    for (let x = 0; x < 9; x++) {
      if (x !== row && grid[x][col] === cellValue) return true;
    }

    // Check 3x3 box
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const checkRow = boxRow + i;
        const checkCol = boxCol + j;
        if (
          (checkRow !== row || checkCol !== col) &&
          grid[checkRow][checkCol] === cellValue
        ) {
          return true;
        }
      }
    }

    return false;
  };

  const handleCellClick = (row: number, col: number) => {
    if (isInitialCell(row, col) || gameOver) return;
    setSelectedCell({ row, col });
  };

  const handleNumberClick = useCallback(
    (num: number) => {
      if (!selectedCell || gameOver || num === 0 || !sudokuData) return;

      const newGrid = grid.map(row => [...row]);
      newGrid[selectedCell.row][selectedCell.col] = num;
      setSudokuData({ ...sudokuData, grid: newGrid });

      // Check whether the grid is complete and correct
      if (isGridComplete(newGrid) && isGridSolved(newGrid)) {
        setWon(true);
        setGameOver(true);
        onWin?.();
      }
    },
    [selectedCell, gameOver, sudokuData, grid, onWin, isGridSolved]
  );

  const handleClearCell = useCallback(() => {
    if (!selectedCell || gameOver || !sudokuData) return;

    const newGrid = grid.map(row => [...row]);
    newGrid[selectedCell.row][selectedCell.col] = 0;
    setSudokuData({ ...sudokuData, grid: newGrid });
  }, [gameOver, selectedCell, grid, sudokuData]);

  const isGridComplete = (currentGrid: number[][]) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (currentGrid[row][col] === 0) return false;
      }
    }
    return true;
  };

  // Debug event handling
  useEffect(() => {
    const handleDebugWin = () => {
      if (!gameOver) {
        setWon(true);
        setGameOver(true);
        onWin?.();
      }
    };

    const handleDebugGameOver = () => {
      if (!gameOver) {
        setWon(false);
        setGameOver(true);
        onLose?.();
      }
    };

    const gameElement = document.querySelector('[data-game-component]');
    if (gameElement) {
      gameElement.addEventListener('debug-win', handleDebugWin);
      gameElement.addEventListener('debug-gameover', handleDebugGameOver);

      return () => {
        gameElement.removeEventListener('debug-win', handleDebugWin);
        gameElement.removeEventListener('debug-gameover', handleDebugGameOver);
      };
    }
  }, [gameOver, onWin, onLose]);

  // Hint: play next correct move from the solution
  useEffect(() => {
    const el = document.querySelector('[data-game-component]');
    if (!el) return;
    const handleAuto = () => {
      if (gameOver || !sudokuData) return;
      // Pick a random empty cell and fill with solution
      const empties: { r: number; c: number }[] = [];
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (sudokuData.grid[r][c] === 0) empties.push({ r, c });
        }
      }
      if (empties.length === 0) return;
      const { r, c } = empties[Math.floor(Math.random() * empties.length)];
      const val = sudokuData.solution[r][c];
      const newGrid = sudokuData.grid.map(row => [...row]);
      newGrid[r][c] = val;
      // Apply update
      setSudokuData({ ...sudokuData, grid: newGrid });
      // If this solves the grid, trigger win immediately
      if (isGridComplete(newGrid) && isGridSolved(newGrid)) {
        setWon(true);
        setGameOver(true);
        onWin?.();
      }
    };
    const handleQuery = (evt: Event) => {
      const e = evt as CustomEvent<{ type: 'auto'; available?: boolean }>;
      if (!e.detail || e.detail.type !== 'auto') return;
      const available =
        !!sudokuData &&
        sudokuData.grid.some(row => row.includes(0)) &&
        !gameOver;
      e.detail.available = available;
    };
    el.addEventListener('sudoku-auto-move', handleAuto);
    el.addEventListener('sudoku-query-available', handleQuery);
    return () => {
      el.removeEventListener('sudoku-auto-move', handleAuto);
      el.removeEventListener('sudoku-query-available', handleQuery);
    };
  }, [sudokuData, gameOver, isGridSolved, onWin]);

  // Gestion des touches clavier physique
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;

      const key = e.key;

      // Add key to the pressed set
      setPressedKeys(prev => new Set(prev).add(key));

      if (key === 'Enter') {
        // Pas d'action sur Enter pour le Sudoku
        return;
      } else if (key === 'Backspace' || key === 'Delete') {
        handleClearCell();
      } else if (key.match(/[1-9]/)) {
        handleNumberClick(parseInt(key, 10));
      } else if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)
      ) {
        if (selectedCell) {
          e.preventDefault();

          // Fonction pour trouver la prochaine cellule modifiable dans une direction
          const findNextModifiableCell = (
            startRow: number,
            startCol: number,
            direction: string
          ) => {
            let currentRow = startRow;
            let currentCol = startCol;
            const maxAttempts = 9; // Max 9 attempts to avoid infinite loops
            let attempts = 0;

            while (attempts < maxAttempts) {
              switch (direction) {
                case 'ArrowUp':
                  currentRow = Math.max(0, currentRow - 1);
                  break;
                case 'ArrowDown':
                  currentRow = Math.min(8, currentRow + 1);
                  break;
                case 'ArrowLeft':
                  currentCol = Math.max(0, currentCol - 1);
                  break;
                case 'ArrowRight':
                  currentCol = Math.min(8, currentCol + 1);
                  break;
              }

              // Stop if we found a modifiable cell
              if (!isInitialCell(currentRow, currentCol)) {
                return { row: currentRow, col: currentCol };
              }

              // Stop if we hit the edge and the cell is protected
              if (
                (direction === 'ArrowUp' && currentRow === 0) ||
                (direction === 'ArrowDown' && currentRow === 8) ||
                (direction === 'ArrowLeft' && currentCol === 0) ||
                (direction === 'ArrowRight' && currentCol === 8)
              ) {
                break;
              }

              attempts++;
            }

            return null; // No modifiable cell found
          };

          const nextCell = findNextModifiableCell(
            selectedCell.row,
            selectedCell.col,
            key
          );
          if (nextCell) {
            setSelectedCell(nextCell);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;

      // Remove key from the pressed set
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    gameOver,
    selectedCell,
    handleNumberClick,
    grid,
    handleClearCell,
    isInitialCell,
  ]);

  // Show a loader while generating
  if (!sudokuData) {
    return (
      <div className='max-w-md mx-auto space-y-6'>
        <div className='flex justify-center items-center h-64'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4'></div>
            <p className='text-slate-600 dark:text-slate-300'>
              Génération du Sudoku...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex items-center justify-center'>
      {/* Game Content */}
      <div
        className={cn(
          'flex w-full flex-row flex-wrap gap-6 items-center justify-center',
          gameOver ? 'opacity-50 pointer-events-none' : ''
        )}
      >
        {/* Grille de Sudoku */}
        <div className='flex justify-center'>
          <Card>
            <CardContent className='p-3'>
              <div className='grid grid-cols-3 gap-1.5'>
                {/* Create nine 3x3 boxes */}
                {Array.from({ length: 9 }).map((_, boxIndex) => {
                  const boxRow = Math.floor(boxIndex / 3);
                  const boxCol = boxIndex % 3;
                  const isBoxSelected =
                    selectedCell &&
                    Math.floor(selectedCell.row / 3) === boxRow &&
                    Math.floor(selectedCell.col / 3) === boxCol;

                  return (
                    <div
                      key={boxIndex}
                      className={`grid grid-cols-3 gap-1.5 p-1 rounded-lg transition-all duration-200 ${
                        isBoxSelected
                          ? 'outline outline-2 outline-emerald-500 dark:outline-emerald-600'
                          : ''
                      }`}
                    >
                      {Array.from({ length: 9 }).map((_, cellIndex) => {
                        const row = boxRow * 3 + Math.floor(cellIndex / 3);
                        const col = boxCol * 3 + (cellIndex % 3);
                        const cell = grid[row][col];
                        const isInitial = isInitialCell(row, col);
                        const isSelected =
                          selectedCell?.row === row &&
                          selectedCell?.col === col;
                        const isInSameRow =
                          selectedCell && selectedCell.row === row;
                        const isInSameCol =
                          selectedCell && selectedCell.col === col;
                        const isInConflict = isCellInConflict(row, col);

                        return (
                          <button
                            key={`${row}-${col}`}
                            className={`w-10 h-10 text-sm font-bold rounded-lg transition-all duration-200 ${
                              isInitial
                                ? 'bg-slate-600 dark:bg-slate-500 text-white font-bold'
                                : isSelected
                                  ? isInConflict
                                    ? 'bg-red-500 text-white shadow-lg scale-105'
                                    : 'bg-emerald-600 text-white shadow-lg scale-105'
                                  : (isInSameRow || isInSameCol) && selectedCell
                                    ? isInConflict
                                      ? 'bg-red-100 dark:bg-red-600/50 text-red-900 dark:text-red-100 outline outline-1 outline-red-300 dark:outline-red-500'
                                      : 'bg-emerald-100 dark:bg-emerald-700/40 text-emerald-900 dark:text-emerald-100 outline outline-1 outline-emerald-300 dark:outline-emerald-500'
                                    : isInConflict
                                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700'
                                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                            }`}
                            onClick={() => handleCellClick(row, col)}
                          >
                            {cell || ''}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
        <Keyboard
          variant='numeric'
          disabled={!selectedCell || gameOver}
          pressedKeys={pressedKeys}
          onBackspace={handleClearCell}
          onKey={key => {
            if (/^[1-9]$/.test(key)) {
              handleNumberClick(parseInt(key, 10));
            }
          }}
        />
      </div>
    </div>
  );
});

export default SudokuGame;
