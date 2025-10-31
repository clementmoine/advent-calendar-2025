'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, memo, useCallback } from 'react';

import Keyboard from '@/components/keyboard';
import { Card, CardContent } from '@/components/ui/card';

import { cn } from '@/lib/utils';
import { GameProps, getDifficultyFromDay } from '@/lib/games';

type Difficulty = 'easy' | 'medium' | 'hard';

// Grid configuration per difficulty
const GRID_CONFIG = {
  easy: { size: 3, target: 64 }, // 3x3, atteindre 64
  medium: { size: 4, target: 256 }, // 4x4, atteindre 256
  hard: { size: 5, target: 1024 }, // 5x5, atteindre 1024
};

const Game2048 = memo(function Game2048({
  onWin,
  onLose,
  gameData,
}: GameProps) {
  const day = gameData?.day || 1;
  const [difficulty] = useState<Difficulty>(getDifficultyFromDay(day));
  const [grid, setGrid] = useState<number[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [newTiles, setNewTiles] = useState<Set<string>>(new Set());
  const [mergedTiles, setMergedTiles] = useState<Set<string>>(new Set());
  const [initialTiles, setInitialTiles] = useState<Set<string>>(new Set());
  const [pendingNewTiles, setPendingNewTiles] = useState<Set<string>>(
    new Set()
  );
  const [tileAnimationKeys, setTileAnimationKeys] = useState<
    Map<string, number>
  >(new Map());
  const [keyboardLayout, setKeyboardLayout] = useState<'qwerty' | 'azerty'>(
    'qwerty'
  );
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const config = GRID_CONFIG[difficulty];
  const target = config.target;

  // Add a random tile (2 or 4)
  const addRandomTile = useCallback(
    (currentGrid: number[][]) => {
      const emptyCells: { row: number; col: number }[] = [];

      for (let row = 0; row < config.size; row++) {
        for (let col = 0; col < config.size; col++) {
          if (currentGrid[row][col] === 0) {
            emptyCells.push({ row, col });
          }
        }
      }

      if (emptyCells.length > 0) {
        const randomCell =
          emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        currentGrid[randomCell.row][randomCell.col] = value;

        const tileKey = `${randomCell.row}-${randomCell.col}`;

        // Return the animation key
        return tileKey;
      }
      return null;
    },
    [config.size]
  );

  // Detect keyboard layout
  useEffect(() => {
    const detectKeyboardLayout = () => {
      // Heuristic based on browser language
      const language = navigator.language || navigator.languages?.[0] || 'en';
      const isFrench = language.startsWith('fr');
      setKeyboardLayout(isFrench ? 'azerty' : 'qwerty');
    };

    detectKeyboardLayout();
  }, []);

  // Initialiser la grille
  useEffect(() => {
    const newGrid = Array(config.size)
      .fill(null)
      .map(() => Array(config.size).fill(0));
    const tileKey1 = addRandomTile(newGrid);
    const tileKey2 = addRandomTile(newGrid);
    setGrid(newGrid);
    setGameOver(false);
    setWon(false);
    setInitialTiles(new Set());
    setPendingNewTiles(new Set());

    // Animer les tuiles initiales
    if (tileKey1) {
      setNewTiles(prev => new Set(prev).add(tileKey1));
      setTimeout(() => {
        setNewTiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(tileKey1);
          return newSet;
        });
      }, 400);
    }
    if (tileKey2) {
      setNewTiles(prev => new Set(prev).add(tileKey2));
      setTimeout(() => {
        setNewTiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(tileKey2);
          return newSet;
        });
      }, 400);
    }
  }, [difficulty, addRandomTile, config.size]);

  // Synchroniser l'animation des nouvelles tuiles avec le changement de grid
  useEffect(() => {
    if (pendingNewTiles.size > 0) {
      console.log(
        '🎬 Déclenchement animation nouvelles tuiles:',
        Array.from(pendingNewTiles)
      );

      // Increment animation key to force re-render
      setTileAnimationKeys(prev => {
        const newMap = new Map(prev);
        pendingNewTiles.forEach(tileKey => {
          newMap.set(tileKey, (newMap.get(tileKey) || 0) + 1);
        });
        return newMap;
      });

      // Trigger animation for pending tiles
      setNewTiles(prev => {
        const newSet = new Set(prev);
        pendingNewTiles.forEach(tileKey => newSet.add(tileKey));
        console.log(
          '🎬 Nouvelles tuiles ajoutées à newTiles:',
          Array.from(newSet)
        );
        return newSet;
      });

      // Cleanup after animation
      setTimeout(() => {
        setNewTiles(prev => {
          const newSet = new Set(prev);
          pendingNewTiles.forEach(tileKey => newSet.delete(tileKey));
          console.log(
            '🎬 Nouvelles tuiles supprimées de newTiles:',
            Array.from(newSet)
          );
          return newSet;
        });
        setPendingNewTiles(new Set());
      }, 400);
    }
  }, [pendingNewTiles]);

  // Check if the game is over
  const checkGameOver = useCallback(
    (currentGrid: number[][]) => {
      // Check for empty cells
      for (let row = 0; row < config.size; row++) {
        for (let col = 0; col < config.size; col++) {
          if (currentGrid[row][col] === 0) return false;
        }
      }

      // Check for possible moves
      for (let row = 0; row < config.size; row++) {
        for (let col = 0; col < config.size; col++) {
          const current = currentGrid[row][col];
          // Check adjacent cells
          if (
            (row > 0 && currentGrid[row - 1][col] === current) ||
            (row < config.size - 1 && currentGrid[row + 1][col] === current) ||
            (col > 0 && currentGrid[row][col - 1] === current) ||
            (col < config.size - 1 && currentGrid[row][col + 1] === current)
          ) {
            return false;
          }
        }
      }

      return true;
    },
    [config.size]
  );

  // Check if target is reached
  const checkWin = useCallback(
    (currentGrid: number[][]) => {
      console.log('🎯 checkWin called, target:', target);
      for (let row = 0; row < config.size; row++) {
        for (let col = 0; col < config.size; col++) {
          if (currentGrid[row][col] === target) {
            console.log(
              '🏆 WIN DETECTED! Found target',
              target,
              'at',
              row,
              col
            );
            return true;
          }
        }
      }
      console.log('❌ No win detected');
      return false;
    },
    [config.size, target]
  );

  // Move tiles left
  const moveLeft = useCallback(
    (currentGrid: number[][]) => {
      const newGrid = currentGrid.map(row => [...row]);
      let moved = false;
      const newMergedTiles = new Set<string>();

      for (let row = 0; row < config.size; row++) {
        const filteredRow = newGrid[row].filter(cell => cell !== 0);
        const mergedRow = [];
        let i = 0;

        while (i < filteredRow.length) {
          if (
            i < filteredRow.length - 1 &&
            filteredRow[i] === filteredRow[i + 1]
          ) {
            const mergedValue = filteredRow[i] * 2;
            mergedRow.push(mergedValue);

            // Mark this tile as merged
            const colIndex = mergedRow.length - 1;
            newMergedTiles.add(`${row}-${colIndex}`);

            i += 2;
          } else {
            mergedRow.push(filteredRow[i]);
            i++;
          }
        }

        while (mergedRow.length < config.size) {
          mergedRow.push(0);
        }

        if (JSON.stringify(newGrid[row]) !== JSON.stringify(mergedRow)) {
          moved = true;
        }
        newGrid[row] = mergedRow;
      }

      // Animer les fusions
      if (moved && newMergedTiles.size > 0) {
        setMergedTiles(newMergedTiles);
        setTimeout(() => {
          setMergedTiles(new Set());
        }, 200);
      }

      return { grid: newGrid, moved };
    },
    [config.size]
  );

  // Move tiles right
  const moveRight = useCallback(
    (currentGrid: number[][]) => {
      const newGrid = currentGrid.map(row => [...row]);
      let moved = false;
      const newMergedTiles = new Set<string>();

      for (let row = 0; row < config.size; row++) {
        const filteredRow = newGrid[row].filter(cell => cell !== 0);
        const mergedRow = [];
        let i = filteredRow.length - 1;

        while (i >= 0) {
          if (i > 0 && filteredRow[i] === filteredRow[i - 1]) {
            const mergedValue = filteredRow[i] * 2;
            mergedRow.unshift(mergedValue);

            // Mark this tile as merged
            const colIndex = config.size - mergedRow.length;
            newMergedTiles.add(`${row}-${colIndex}`);

            i -= 2;
          } else {
            mergedRow.unshift(filteredRow[i]);
            i--;
          }
        }

        while (mergedRow.length < config.size) {
          mergedRow.unshift(0);
        }

        if (JSON.stringify(newGrid[row]) !== JSON.stringify(mergedRow)) {
          moved = true;
        }
        newGrid[row] = mergedRow;
      }

      // Animer les fusions
      if (moved && newMergedTiles.size > 0) {
        setMergedTiles(newMergedTiles);
        setTimeout(() => {
          setMergedTiles(new Set());
        }, 200);
      }

      return { grid: newGrid, moved };
    },
    [config.size]
  );

  // Move tiles up
  const moveUp = useCallback(
    (currentGrid: number[][]) => {
      const newGrid = currentGrid.map(row => [...row]);
      let moved = false;
      const newMergedTiles = new Set<string>();

      for (let col = 0; col < config.size; col++) {
        const column = [];
        for (let row = 0; row < config.size; row++) {
          if (newGrid[row][col] !== 0) {
            column.push(newGrid[row][col]);
          }
        }

        const mergedColumn = [];
        let i = 0;

        while (i < column.length) {
          if (i < column.length - 1 && column[i] === column[i + 1]) {
            const mergedValue = column[i] * 2;
            mergedColumn.push(mergedValue);

            // Mark this tile as merged
            const rowIndex = mergedColumn.length - 1;
            newMergedTiles.add(`${rowIndex}-${col}`);

            i += 2;
          } else {
            mergedColumn.push(column[i]);
            i++;
          }
        }

        while (mergedColumn.length < config.size) {
          mergedColumn.push(0);
        }

        for (let row = 0; row < config.size; row++) {
          if (newGrid[row][col] !== mergedColumn[row]) {
            moved = true;
          }
          newGrid[row][col] = mergedColumn[row];
        }
      }

      // Animer les fusions
      if (moved && newMergedTiles.size > 0) {
        setMergedTiles(newMergedTiles);
        setTimeout(() => {
          setMergedTiles(new Set());
        }, 200);
      }

      return { grid: newGrid, moved };
    },
    [config.size]
  );

  // Move tiles down
  const moveDown = useCallback(
    (currentGrid: number[][]) => {
      const newGrid = currentGrid.map(row => [...row]);
      let moved = false;
      const newMergedTiles = new Set<string>();

      for (let col = 0; col < config.size; col++) {
        const column = [];
        for (let row = 0; row < config.size; row++) {
          if (newGrid[row][col] !== 0) {
            column.push(newGrid[row][col]);
          }
        }

        const mergedColumn = [];
        let i = column.length - 1;

        while (i >= 0) {
          if (i > 0 && column[i] === column[i - 1]) {
            const mergedValue = column[i] * 2;
            mergedColumn.unshift(mergedValue);

            // Mark this tile as merged
            const rowIndex = config.size - mergedColumn.length;
            newMergedTiles.add(`${rowIndex}-${col}`);

            i -= 2;
          } else {
            mergedColumn.unshift(column[i]);
            i--;
          }
        }

        while (mergedColumn.length < config.size) {
          mergedColumn.unshift(0);
        }

        for (let row = 0; row < config.size; row++) {
          if (newGrid[row][col] !== mergedColumn[row]) {
            moved = true;
          }
          newGrid[row][col] = mergedColumn[row];
        }
      }

      // Animer les fusions
      if (moved && newMergedTiles.size > 0) {
        setMergedTiles(newMergedTiles);
        setTimeout(() => {
          setMergedTiles(new Set());
        }, 200);
      }

      return { grid: newGrid, moved };
    },
    [config.size]
  );

  // Handle moves
  const handleMove = useCallback(
    (direction: 'left' | 'right' | 'up' | 'down') => {
      if (gameOver) return;

      let result;
      switch (direction) {
        case 'left':
          result = moveLeft(grid);
          break;
        case 'right':
          result = moveRight(grid);
          break;
        case 'up':
          result = moveUp(grid);
          break;
        case 'down':
          result = moveDown(grid);
          break;
      }

      if (result.moved) {
        const newGrid = result.grid;
        const newTileKey = addRandomTile(newGrid);

        // Marquer la tuile comme en attente d'animation
        if (newTileKey) {
          console.log(
            '🎯 Nouvelle tuile créée, ajoutée à pendingNewTiles:',
            newTileKey
          );
          setPendingNewTiles(prev => new Set(prev).add(newTileKey));
        }

        setGrid(newGrid);

        // Check for win
        const hasWon = checkWin(newGrid);
        if (hasWon && !won) {
          setWon(true);
          setGameOver(true);
          onWin?.();
        }
        // Check for loss
        else if (checkGameOver(newGrid)) {
          setGameOver(true);
          onLose?.();
        }
      }
    },
    [
      grid,
      gameOver,
      won,
      onWin,
      onLose,
      addRandomTile,
      checkGameOver,
      checkWin,
      moveDown,
      moveLeft,
      moveRight,
      moveUp,
    ]
  );

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

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;

      // Add key to the pressed set
      setPressedKeys(prev => new Set(prev).add(e.key));

      // Common keys (arrows)
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleMove('right');
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleMove('down');
          break;
      }

      // Layout-specific keys
      if (keyboardLayout === 'azerty') {
        // AZERTY : ZQSD
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            handleMove('up');
            break;
          case 'q':
            e.preventDefault();
            handleMove('left');
            break;
          case 's':
            e.preventDefault();
            handleMove('down');
            break;
          case 'd':
            e.preventDefault();
            handleMove('right');
            break;
        }
      } else {
        // QWERTY : WASD
        switch (e.key.toLowerCase()) {
          case 'w':
            e.preventDefault();
            handleMove('up');
            break;
          case 'a':
            e.preventDefault();
            handleMove('left');
            break;
          case 's':
            e.preventDefault();
            handleMove('down');
            break;
          case 'd':
            e.preventDefault();
            handleMove('right');
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Remove key from the pressed set
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(e.key);
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleMove, gameOver, keyboardLayout]);

  // Obtenir la couleur d'une tuile
  const getTileColor = (value: number) => {
    const colors = {
      0: 'bg-slate-200 dark:bg-slate-700',
      2: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100',
      4: 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100',
      8: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
      16: 'bg-amber-200 dark:bg-amber-800/40 text-amber-900 dark:text-amber-100',
      32: 'bg-orange-200 dark:bg-orange-800/40 text-orange-900 dark:text-orange-100',
      64: 'bg-orange-300 dark:bg-orange-700/50 text-orange-900 dark:text-orange-100',
      128: 'bg-red-200 dark:bg-red-800/40 text-red-900 dark:text-red-100',
      256: 'bg-red-300 dark:bg-red-700/50 text-red-900 dark:text-red-100',
      512: 'bg-pink-200 dark:bg-pink-800/40 text-pink-900 dark:text-pink-100',
      1024: 'bg-purple-200 dark:bg-purple-800/40 text-purple-900 dark:text-purple-100',
      2048: 'bg-yellow-200 dark:bg-yellow-800/40 text-yellow-900 dark:text-yellow-100',
    };
    return (
      colors[value as keyof typeof colors] ||
      'bg-emerald-200 dark:bg-emerald-800/40 text-emerald-900 dark:text-emerald-100'
    );
  };

  return (
    <div className='max-w-md mx-auto space-y-6'>
      {/* Game Content */}
      <div
        className={cn(
          'flex flex-col gap-6',
          gameOver ? 'opacity-50 pointer-events-none' : ''
        )}
      >
        {/* Grille de jeu */}
        <div className='flex justify-center'>
          <Card>
            <CardContent className='p-3'>
              <div
                className={`grid gap-2`}
                style={{ gridTemplateColumns: `repeat(${config.size}, 1fr)` }}
              >
                {grid.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const tileKey = `${rowIndex}-${colIndex}`;
                    const isNew = newTiles.has(tileKey);
                    const isMerged = mergedTiles.has(tileKey);
                    const isInitial = initialTiles.has(tileKey);

                    if (isNew) {
                      console.log('🎬 Animation détectée dans le rendu:', {
                        tileKey,
                        cell,
                        isNew,
                        isMerged,
                        isInitial,
                      });
                    }

                    const animationKey = tileAnimationKeys.get(tileKey) || 0;

                    return (
                      <motion.div
                        key={`${rowIndex}-${colIndex}-${animationKey}`}
                        initial={isNew ? { scale: 0.3, opacity: 0 } : false}
                        animate={
                          isNew
                            ? { scale: 1, opacity: 1 }
                            : isMerged
                              ? { scale: [1, 1.2, 1] }
                              : { scale: 1, opacity: 1 }
                        }
                        transition={{
                          duration: isNew ? 0.3 : isMerged ? 0.2 : 0,
                          ease: isNew ? 'easeOut' : 'easeOut',
                          type: 'tween',
                        }}
                        className={`w-16 h-16 flex items-center justify-center text-lg font-bold rounded ${getTileColor(
                          cell
                        )} ${
                          isMerged
                            ? 'ring-4 ring-yellow-400 ring-opacity-75'
                            : ''
                        }`}
                        style={{
                          willChange:
                            isNew || isMerged ? 'transform, opacity' : 'auto',
                        }}
                      >
                        {cell || ''}
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control keyboard */}
        <div className='flex justify-center'>
          <Keyboard
            variant='arrows'
            pressedKeys={pressedKeys}
            disabled={gameOver}
            onKey={key => {
              if (gameOver) return;
              if (key === 'LEFT') handleMove('left');
              else if (key === 'RIGHT') handleMove('right');
              else if (key === 'UP') handleMove('up');
              else if (key === 'DOWN') handleMove('down');
            }}
          />
        </div>
      </div>
    </div>
  );
});

export default Game2048;
