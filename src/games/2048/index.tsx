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
  const [history, setHistory] = useState<number[][][]>([]);

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
  const computeMoveLeft = useCallback(
    (currentGrid: number[][]) => {
      const newGrid = currentGrid.map(row => [...row]);
      let moved = false;
      const newMergedTiles = new Set<string>();

      for (let row = 0; row < config.size; row++) {
        const filteredRow = newGrid[row].filter(cell => cell !== 0);
        const mergedRow: number[] = [];
        let i = 0;

        while (i < filteredRow.length) {
          if (
            i < filteredRow.length - 1 &&
            filteredRow[i] === filteredRow[i + 1]
          ) {
            const mergedValue = filteredRow[i] * 2;
            mergedRow.push(mergedValue);

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

      return { grid: newGrid, moved, mergedTiles: newMergedTiles };
    },
    [config.size]
  );

  const moveLeft = useCallback(
    (currentGrid: number[][]) => {
      const res = computeMoveLeft(currentGrid);
      if (res.moved && res.mergedTiles.size > 0) {
        setMergedTiles(res.mergedTiles);
        setTimeout(() => setMergedTiles(new Set()), 200);
      }
      return { grid: res.grid, moved: res.moved };
    },
    [computeMoveLeft]
  );

  // Move tiles right
  const computeMoveRight = useCallback(
    (currentGrid: number[][]) => {
      const newGrid = currentGrid.map(row => [...row]);
      let moved = false;
      const newMergedTiles = new Set<string>();

      for (let row = 0; row < config.size; row++) {
        const filteredRow = newGrid[row].filter(cell => cell !== 0);
        const mergedRow: number[] = [];
        let i = filteredRow.length - 1;

        while (i >= 0) {
          if (i > 0 && filteredRow[i] === filteredRow[i - 1]) {
            const mergedValue = filteredRow[i] * 2;
            mergedRow.unshift(mergedValue);

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

      return { grid: newGrid, moved, mergedTiles: newMergedTiles };
    },
    [config.size]
  );

  const moveRight = useCallback(
    (currentGrid: number[][]) => {
      const res = computeMoveRight(currentGrid);
      if (res.moved && res.mergedTiles.size > 0) {
        setMergedTiles(res.mergedTiles);
        setTimeout(() => setMergedTiles(new Set()), 200);
      }
      return { grid: res.grid, moved: res.moved };
    },
    [computeMoveRight]
  );

  // Move tiles up
  const computeMoveUp = useCallback(
    (currentGrid: number[][]) => {
      const newGrid = currentGrid.map(row => [...row]);
      let moved = false;
      const newMergedTiles = new Set<string>();

      for (let col = 0; col < config.size; col++) {
        const column: number[] = [];
        for (let row = 0; row < config.size; row++) {
          if (newGrid[row][col] !== 0) {
            column.push(newGrid[row][col]);
          }
        }

        const mergedColumn: number[] = [];
        let i = 0;

        while (i < column.length) {
          if (i < column.length - 1 && column[i] === column[i + 1]) {
            const mergedValue = column[i] * 2;
            mergedColumn.push(mergedValue);

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

      return { grid: newGrid, moved, mergedTiles: newMergedTiles };
    },
    [config.size]
  );

  const moveUp = useCallback(
    (currentGrid: number[][]) => {
      const res = computeMoveUp(currentGrid);
      if (res.moved && res.mergedTiles.size > 0) {
        setMergedTiles(res.mergedTiles);
        setTimeout(() => setMergedTiles(new Set()), 200);
      }
      return { grid: res.grid, moved: res.moved };
    },
    [computeMoveUp]
  );

  // Move tiles down
  const computeMoveDown = useCallback(
    (currentGrid: number[][]) => {
      const newGrid = currentGrid.map(row => [...row]);
      let moved = false;
      const newMergedTiles = new Set<string>();

      for (let col = 0; col < config.size; col++) {
        const column: number[] = [];
        for (let row = 0; row < config.size; row++) {
          if (newGrid[row][col] !== 0) {
            column.push(newGrid[row][col]);
          }
        }

        const mergedColumn: number[] = [];
        let i = column.length - 1;

        while (i >= 0) {
          if (i > 0 && column[i] === column[i - 1]) {
            const mergedValue = column[i] * 2;
            mergedColumn.unshift(mergedValue);

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

      return { grid: newGrid, moved, mergedTiles: newMergedTiles };
    },
    [config.size]
  );

  const moveDown = useCallback(
    (currentGrid: number[][]) => {
      const res = computeMoveDown(currentGrid);
      if (res.moved && res.mergedTiles.size > 0) {
        setMergedTiles(res.mergedTiles);
        setTimeout(() => setMergedTiles(new Set()), 200);
      }
      return { grid: res.grid, moved: res.moved };
    },
    [computeMoveDown]
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
        // Save history for undo
        setHistory(prev => {
          const next = [...prev, grid.map(r => [...r])];
          return next.length > 50 ? next.slice(next.length - 50) : next;
        });
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

  // Heuristic for auto-move: favors more empty cells, smoothness, max tile in corner
  const scoreGrid = useCallback(
    (g: number[][]) => {
      const size = config.size;
      let empty = 0;
      let smooth = 0;
      let maxTile = 0;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const val = g[r][c];
          if (val === 0) empty++;
          if (val > maxTile) maxTile = val;
          if (c + 1 < size) smooth -= Math.abs(val - g[r][c + 1]);
          if (r + 1 < size) smooth -= Math.abs(val - g[r + 1][c]);
        }
      }
      const corners = [
        g[0][0],
        g[0][size - 1],
        g[size - 1][0],
        g[size - 1][size - 1],
      ];
      const cornerBonus = Math.max(...corners) === maxTile ? 1 : 0;
      return empty * 100 + smooth * 0.1 + cornerBonus * 50;
    },
    [config.size]
  );

  type SimResult = {
    moved: boolean;
    score: number;
    grid: number[][];
    safe: boolean;
  };
  const simulateMove = useCallback(
    (dir: 'left' | 'right' | 'up' | 'down'): SimResult => {
      // Guard: grid not yet initialized
      const validShape =
        Array.isArray(grid) &&
        grid.length === config.size &&
        grid.every(row => Array.isArray(row) && row.length === config.size);
      if (!validShape) {
        return {
          moved: false,
          score: -Infinity,
          grid,
          safe: false,
        };
      }
      const handler =
        dir === 'left'
          ? moveLeft
          : dir === 'right'
            ? moveRight
            : dir === 'up'
              ? moveUp
              : moveDown;
      // Use pure compute variants to avoid side-effects during simulation
      const compute =
        handler === moveLeft
          ? computeMoveLeft
          : handler === moveRight
            ? computeMoveRight
            : handler === moveUp
              ? computeMoveUp
              : computeMoveDown;
      const res = compute(grid);
      if (!res.moved)
        return { moved: false, score: -Infinity, grid: res.grid, safe: false };

      // Consider all possible spawns (adversarial/worst-case) to avoid instant loss
      const size = config.size;
      const empties: { r: number; c: number }[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (res.grid[r][c] === 0) empties.push({ r, c });
        }
      }

      if (empties.length === 0) {
        const over = checkGameOver(res.grid);
        return {
          moved: true,
          score: over ? -Infinity : scoreGrid(res.grid),
          grid: res.grid,
          safe: !over,
        };
      }

      let worstScore = Infinity;
      let anyNonLosing = false;
      for (const { r, c } of empties) {
        for (const val of [2, 4]) {
          const g2 = res.grid.map(row => [...row]);
          g2[r][c] = val;
          const over = checkGameOver(g2);
          if (!over) anyNonLosing = true;
          const s = scoreGrid(g2);
          if (s < worstScore) worstScore = s;
        }
      }

      return {
        moved: true,
        score: worstScore,
        grid: res.grid,
        safe: anyNonLosing,
      };
    },
    [
      grid,
      config.size,
      moveLeft,
      moveRight,
      moveUp,
      moveDown,
      scoreGrid,
      checkGameOver,
      computeMoveDown,
      computeMoveUp,
      computeMoveLeft,
      computeMoveRight,
    ]
  );

  const autoMove = useCallback(() => {
    // Try shortest-path to target first (bounded depth search)
    const dirs: ('left' | 'right' | 'up' | 'down')[] = [
      'left',
      'right',
      'up',
      'down',
    ];

    const chooseBestSpawn = (g: number[][]): number[][] => {
      const size = config.size;
      const empties: { r: number; c: number }[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++)
          if (g[r][c] === 0) empties.push({ r, c });
      }
      if (empties.length === 0) return g;
      let bestScore = -Infinity;
      let best: number[][] | null = null;
      for (const { r, c } of empties) {
        for (const val of [2, 4]) {
          const g2 = g.map(row => [...row]);
          g2[r][c] = val;
          const s = scoreGrid(g2);
          if (s > bestScore) {
            bestScore = s;
            best = g2;
          }
        }
      }
      return best || g;
    };

    const computeAfterDir = (
      g: number[][],
      d: 'left' | 'right' | 'up' | 'down'
    ) => {
      const res =
        d === 'left'
          ? computeMoveLeft(g)
          : d === 'right'
            ? computeMoveRight(g)
            : d === 'up'
              ? computeMoveUp(g)
              : computeMoveDown(g);
      if (!res.moved) return null;
      const spawned = chooseBestSpawn(res.grid);
      return spawned;
    };

    const timeLimitMs = 25; // keep it snappy
    const start = Date.now();
    const maxDepth = 5;

    const isWin = (g: number[][]) => checkWin(g);

    const iddfs = (): ('left' | 'right' | 'up' | 'down') | null => {
      for (let depth = 1; depth <= maxDepth; depth++) {
        for (const firstDir of dirs) {
          const firstGrid = computeAfterDir(grid, firstDir);
          if (!firstGrid) continue;
          if (isWin(firstGrid)) return firstDir;

          const stack: { grid: number[][]; d: number }[] = [
            { grid: firstGrid, d: 1 },
          ];
          let found = false;
          while (stack.length > 0) {
            if (Date.now() - start > timeLimitMs) break;
            const node = stack.pop()!;
            if (node.d >= depth) continue;
            for (const dir of dirs) {
              const next = computeAfterDir(node.grid, dir);
              if (!next) continue;
              if (isWin(next)) {
                found = true;
                break;
              }
              stack.push({ grid: next, d: node.d + 1 });
            }
            if (found) return firstDir;
          }
          if (Date.now() - start > timeLimitMs) break;
        }
        if (Date.now() - start > timeLimitMs) break;
      }
      return null;
    };

    const spMove = iddfs();
    if (spMove) {
      handleMove(spMove);
      return;
    }

    // Fallback to conservative safe heuristic
    let bestSafeDir: 'left' | 'right' | 'up' | 'down' | null = null;
    let bestSafeScore = -Infinity;
    dirs.forEach(d => {
      const res = simulateMove(d);
      if (!res.moved) return;
      if (res.safe && res.score > bestSafeScore) {
        bestSafeScore = res.score;
        bestSafeDir = d;
      }
    });
    if (bestSafeDir) handleMove(bestSafeDir);
  }, [
    simulateMove,
    handleMove,
    checkWin,
    computeMoveDown,
    computeMoveUp,
    computeMoveLeft,
    computeMoveRight,
    config.size,
    scoreGrid,
    grid,
  ]);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop()!;
      setGrid(last.map(r => [...r]));
      setGameOver(false);
      setWon(false);
      return next;
    });
  }, []);

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
      const handleAuto = () => autoMove();
      const handleUndo = () => undo();
      const handleQuery = (evt: Event) => {
        const e = evt as CustomEvent<{
          type: 'undo' | 'auto';
          available?: boolean;
        }>;
        if (!e.detail) return;
        if (e.detail.type === 'undo') e.detail.available = history.length > 0;
        if (e.detail.type === 'auto') {
          // available if any valid move exists (game not over)
          const dirs: ('left' | 'right' | 'up' | 'down')[] = [
            'left',
            'right',
            'up',
            'down',
          ];
          e.detail.available =
            !gameOver &&
            dirs.some(d => {
              const res = simulateMove(d);
              return res.moved;
            });
        }
      };
      gameElement.addEventListener('2048-auto-move', handleAuto);
      gameElement.addEventListener('2048-undo', handleUndo);
      gameElement.addEventListener('2048-query-available', handleQuery);

      return () => {
        gameElement.removeEventListener('debug-win', handleDebugWin);
        gameElement.removeEventListener('debug-gameover', handleDebugGameOver);
        gameElement.removeEventListener('2048-auto-move', handleAuto);
        gameElement.removeEventListener('2048-undo', handleUndo);
        gameElement.removeEventListener('2048-query-available', handleQuery);
      };
    }
  }, [
    gameOver,
    onWin,
    onLose,
    autoMove,
    undo,
    history.length,
    checkGameOver,
    simulateMove,
  ]);

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
