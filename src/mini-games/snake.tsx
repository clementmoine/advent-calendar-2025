'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';

import Keyboard from '@/components/keyboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Direction = 'up' | 'down' | 'left' | 'right';

interface Position {
  x: number;
  y: number;
}

interface SnakeProps {
  onWin: () => void;
  onLose: () => void;
  onClose: () => void;
}

const GRID_SIZE = 12;
const INITIAL_SNAKE: Position[] = [
  { x: 6, y: 6 },
  { x: 5, y: 6 },
  { x: 4, y: 6 },
];
const GAME_SPEED = 150;

export default function Snake({ onWin, onLose, onClose }: SnakeProps) {
  // Game state
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [applesEaten, setApplesEaten] = useState(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const directionRef = useRef<Direction>('right');
  const nextDirectionRef = useRef<Direction>('right');
  const hasCalledLoseRef = useRef(false);
  const previousApplesEatenRef = useRef(0);
  const onWinRef = useRef(onWin);
  const processedApplesRef = useRef(0);
  const lastFoodPositionRef = useRef<Position | null>(null);

  // Generate food at random position
  const generateFood = useCallback((currentSnake: Position[]) => {
    const availablePositions: Position[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const isSnakeBody = currentSnake.some(
          segment => segment.x === x && segment.y === y
        );
        if (!isSnakeBody) {
          availablePositions.push({ x, y });
        }
      }
    }
    if (availablePositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * availablePositions.length);
      setFood(availablePositions[randomIndex]);
    }
  }, []);

  // Check collision
  const checkCollision = useCallback(
    (head: Position, body: Position[]): boolean => {
      // Check wall collision
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        return true;
      }
      // Check self collision
      return body.some(segment => segment.x === head.x && segment.y === head.y);
    },
    []
  );

  // Initialize game
  const initializeGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    directionRef.current = 'right';
    nextDirectionRef.current = 'right';
    setGameOver(false);
    setApplesEaten(0);
    previousApplesEatenRef.current = 0;
    processedApplesRef.current = 0;
    lastFoodPositionRef.current = null;
    hasCalledLoseRef.current = false;
    generateFood(INITIAL_SNAKE);
  }, [generateFood]);

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameOver) return;

    setSnake(currentSnake => {
      // Update direction
      directionRef.current = nextDirectionRef.current;
      const currentDirection = directionRef.current;

      // Calculate new head position
      const head = { ...currentSnake[0] };
      switch (currentDirection) {
        case 'up':
          head.y -= 1;
          break;
        case 'down':
          head.y += 1;
          break;
        case 'left':
          head.x -= 1;
          break;
        case 'right':
          head.x += 1;
          break;
      }

      // Check collision
      if (checkCollision(head, currentSnake)) {
        setGameOver(true);
        return currentSnake;
      }

      // Check if food is eaten
      const ateFood =
        food &&
        head.x === food.x &&
        head.y === food.y &&
        // Prevent double counting: only count if this is a new food position
        (lastFoodPositionRef.current === null ||
          lastFoodPositionRef.current.x !== food.x ||
          lastFoodPositionRef.current.y !== food.y);

      const newSnake = ateFood
        ? [head, ...currentSnake]
        : [head, ...currentSnake.slice(0, -1)];

      // Update food if eaten
      if (ateFood) {
        // Mark this food as processed
        lastFoodPositionRef.current = { x: food.x, y: food.y };
        setApplesEaten(prev => prev + 1);
        generateFood(newSnake);
        // Reset food position ref after a short delay to allow new food to be detected
        setTimeout(() => {
          lastFoodPositionRef.current = null;
        }, 100);
      }

      return newSnake;
    });
  }, [gameOver, food, checkCollision, generateFood]);

  // Update onWin ref when it changes
  useEffect(() => {
    onWinRef.current = onWin;
  }, [onWin]);

  // Award coin when apple is eaten (useEffect to avoid setState during render)
  useEffect(() => {
    // Only process apples that haven't been processed yet
    if (applesEaten > processedApplesRef.current) {
      const coinsToAward = applesEaten - processedApplesRef.current;
      // Update ref immediately to prevent double calls in StrictMode
      processedApplesRef.current = applesEaten;
      // Call onWin for each new apple eaten (only once per apple)
      for (let i = 0; i < coinsToAward; i++) {
        onWinRef.current();
      }
    }
  }, [applesEaten]);

  useEffect(() => {
    if (gameOver && !hasCalledLoseRef.current) {
      hasCalledLoseRef.current = true;
      onLose();
    }
  }, [gameOver, onLose]);

  // Handle direction change
  const handleDirectionChange = useCallback((newDirection: Direction) => {
    const currentDir = directionRef.current;
    // Prevent reversing into itself
    if (
      (currentDir === 'up' && newDirection === 'down') ||
      (currentDir === 'down' && newDirection === 'up') ||
      (currentDir === 'left' && newDirection === 'right') ||
      (currentDir === 'right' && newDirection === 'left')
    ) {
      return;
    }
    nextDirectionRef.current = newDirection;
  }, []);

  // Handle keyboard input
  const handleMove = useCallback(
    (dir: Direction) => {
      // If game over, restart on any direction
      if (gameOver) {
        initializeGame();
        return;
      }
      handleDirectionChange(dir);
    },
    [gameOver, handleDirectionChange, initializeGame]
  );

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        W: 'up',
        z: 'up',
        Z: 'up',
        s: 'down',
        S: 'down',
        a: 'left',
        A: 'left',
        q: 'left',
        Q: 'left',
        d: 'right',
        D: 'right',
      };

      // If game over, restart on any direction key
      if (gameOver) {
        const direction = keyMap[key];
        if (direction) {
          e.preventDefault();
          initializeGame();
          return;
        }
      }

      // Normal game controls
      const direction = keyMap[key];
      if (direction) {
        e.preventDefault();
        setPressedKeys(prev => new Set(prev).add(key));
        handleDirectionChange(direction);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameOver, handleDirectionChange, initializeGame]);

  // Initialize game on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Start game loop
  useEffect(() => {
    if (gameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    gameLoopRef.current = setInterval(gameLoop, GAME_SPEED);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gameLoop, gameOver]);

  // Reset game
  const reset = useCallback(() => {
    initializeGame();
  }, [initializeGame]);

  // Render grid cell
  const renderCell = (x: number, y: number) => {
    const isSnakeHead = snake[0]?.x === x && snake[0]?.y === y;
    const isSnakeBody = snake.some(
      (segment, index) => segment.x === x && segment.y === y && index > 0
    );
    const isFood = food?.x === x && food?.y === y;

    let cellContent = null;
    const cellClass = 'bg-slate-200/50 dark:bg-slate-800/50';

    if (isSnakeHead || isSnakeBody) {
      cellContent = (
        <div className='w-full h-full bg-emerald-600 dark:bg-emerald-500' />
      );
    } else if (isFood) {
      cellContent = (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className='text-sm leading-none flex items-center justify-center w-full h-full'
        >
          🍎
        </motion.div>
      );
    }

    return (
      <div
        key={`${x}-${y}`}
        className={cn(
          'aspect-square flex items-center justify-center overflow-hidden',
          cellClass
        )}
      >
        {cellContent}
      </div>
    );
  };

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Snake 🐍</DialogTitle>
          <DialogDescription>
            Gagnez 1 pièce par pomme dégustée par votre serpent.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col items-center gap-4'>
          {/* Game grid */}
          <div
            className='flex-1 overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 select-none p-2'
            style={{
              width: `${GRID_SIZE * 24 + 16}px`,
              maxWidth: '100%',
            }}
          >
            <div
              className='grid gap-0.5'
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
                const x = index % GRID_SIZE;
                const y = Math.floor(index / GRID_SIZE);
                return renderCell(x, y);
              })}
            </div>
          </div>

          {/* Control keyboard */}
          <div className='flex justify-center w-full'>
            <Keyboard
              variant='arrows'
              pressedKeys={pressedKeys}
              disabled={false}
              onKey={key => {
                if (key === 'LEFT') handleMove('left');
                else if (key === 'RIGHT') handleMove('right');
                else if (key === 'UP') handleMove('up');
                else if (key === 'DOWN') handleMove('down');
              }}
            />
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
