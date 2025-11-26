'use client';

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

interface BreakoutProps {
  onWin: () => void;
  onLose: () => void;
  onClose: () => void;
}

const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 10;
const BALL_SIZE = 8;
const BALL_SPEED = 3;
const PADDLE_SPEED = 6;
const MIN_BALL_SPEED_Y = 1.5; // Minimum vertical speed to prevent horizontal lock

interface Position {
  x: number;
  y: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  broken: boolean;
}

export default function Breakout({ onWin, onLose, onClose }: BreakoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Game state refs for immediate access
  const paddleXRef = useRef(0);
  const ballRef = useRef<Position>({ x: 0, y: 0 });
  const ballVelocityRef = useRef<Position>({ x: 0, y: 0 });
  const bricksRef = useRef<Brick[]>([]);
  const gameOverRef = useRef(false);
  const wonRef = useRef(false);

  // State for rendering
  const [paddleX, setPaddleX] = useState(0);
  const [paddleDirection, setPaddleDirection] = useState<
    'left' | 'right' | null
  >(null);
  const [score, setScore] = useState(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [renderTrigger, setRenderTrigger] = useState(0);

  const hasCalledLoseRef = useRef(false);
  const onWinRef = useRef(onWin);
  const onLoseRef = useRef(onLose);
  const processedBricksRef = useRef(0);

  const canvasWidth = 320;
  const canvasHeight = 400;

  // Initialize game
  const initializeGame = useCallback(() => {
    const newBricks: Brick[] = [];
    const brickGap = 2;
    const brickHeight = 18;
    const colWidth = canvasWidth / BRICK_COLS;
    const brickWidth = colWidth - brickGap * 2;

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * colWidth + brickGap,
          y: row * (brickHeight + brickGap) + 40 + brickGap,
          width: brickWidth,
          height: brickHeight,
          broken: false,
        });
      }
    }

    bricksRef.current = newBricks;
    paddleXRef.current = canvasWidth / 2 - PADDLE_WIDTH / 2;
    setPaddleX(canvasWidth / 2 - PADDLE_WIDTH / 2);
    setPaddleDirection(null);

    ballRef.current = { x: canvasWidth / 2, y: canvasHeight - 60 };
    ballVelocityRef.current = { x: BALL_SPEED * 0.7, y: -BALL_SPEED };

    gameOverRef.current = false;
    wonRef.current = false;
    setScore(0);
    processedBricksRef.current = 0;
    hasCalledLoseRef.current = false;
    setRenderTrigger(t => t + 1);
  }, []);

  // Update refs
  useEffect(() => {
    onWinRef.current = onWin;
    onLoseRef.current = onLose;
  }, [onWin, onLose]);

  // Award coins when bricks are broken
  useEffect(() => {
    const brokenCount = bricksRef.current.filter(b => b.broken).length;
    if (brokenCount > processedBricksRef.current) {
      const newBricksBroken = brokenCount - processedBricksRef.current;
      processedBricksRef.current = brokenCount;
      setScore(brokenCount);

      for (let i = 0; i < newBricksBroken; i++) {
        onWinRef.current();
      }
    }
  }, [renderTrigger]);

  // Check if ball hits brick using AABB collision
  const checkBrickCollision = (ballX: number, ballY: number) => {
    for (let i = 0; i < bricksRef.current.length; i++) {
      const brick = bricksRef.current[i];
      if (brick.broken) continue;

      // AABB collision detection
      if (
        ballX + BALL_SIZE > brick.x &&
        ballX - BALL_SIZE < brick.x + brick.width &&
        ballY + BALL_SIZE > brick.y &&
        ballY - BALL_SIZE < brick.y + brick.height
      ) {
        // Break the brick
        brick.broken = true;
        setRenderTrigger(t => t + 1);

        // Determine bounce direction based on overlap
        const overlapLeft = ballX + BALL_SIZE - brick.x;
        const overlapRight = brick.x + brick.width - (ballX - BALL_SIZE);
        const overlapTop = ballY + BALL_SIZE - brick.y;
        const overlapBottom = brick.y + brick.height - (ballY - BALL_SIZE);

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        // Bounce on the axis with smaller overlap
        if (minOverlapX < minOverlapY) {
          // Hit from left or right
          return {
            axis: 'x',
            newX:
              overlapLeft < overlapRight
                ? brick.x - BALL_SIZE
                : brick.x + brick.width + BALL_SIZE,
          };
        } else {
          // Hit from top or bottom
          return {
            axis: 'y',
            newY:
              overlapTop < overlapBottom
                ? brick.y - BALL_SIZE
                : brick.y + brick.height + BALL_SIZE,
          };
        }
      }
    }
    return null;
  };

  // Game loop
  const gameLoop = useCallback(() => {
    if (gameOverRef.current || wonRef.current) return;

    const ball = ballRef.current;
    const velocity = ballVelocityRef.current;

    let newX = ball.x + velocity.x;
    let newY = ball.y + velocity.y;
    let newVx = velocity.x;
    let newVy = velocity.y;

    // Wall collisions
    if (newX - BALL_SIZE <= 0) {
      newX = BALL_SIZE;
      newVx = Math.abs(newVx);
    } else if (newX + BALL_SIZE >= canvasWidth) {
      newX = canvasWidth - BALL_SIZE;
      newVx = -Math.abs(newVx);
    }

    // Ceiling collision
    if (newY - BALL_SIZE <= 0) {
      newY = BALL_SIZE;
      newVy = Math.abs(newVy);
      // Ensure minimum vertical speed to prevent horizontal lock
      if (Math.abs(newVy) < MIN_BALL_SPEED_Y) {
        newVy = MIN_BALL_SPEED_Y;
      }
    }

    // Bottom collision (lose)
    if (newY + BALL_SIZE >= canvasHeight) {
      gameOverRef.current = true;
      if (!hasCalledLoseRef.current) {
        hasCalledLoseRef.current = true;
        onLoseRef.current();
      }
      setRenderTrigger(t => t + 1);
      return;
    }

    // Paddle collision
    const paddleTop = canvasHeight - 30;
    const paddleLeft = paddleXRef.current;
    const paddleRight = paddleLeft + PADDLE_WIDTH;

    if (
      newY + BALL_SIZE >= paddleTop &&
      newY - BALL_SIZE <= paddleTop + PADDLE_HEIGHT &&
      newX >= paddleLeft - BALL_SIZE &&
      newX <= paddleRight + BALL_SIZE &&
      newVy > 0 // Ball moving down
    ) {
      // Calculate hit position on paddle (-1 to 1)
      const hitPos =
        (newX - (paddleLeft + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
      const angle = (hitPos * Math.PI) / 3; // Max 60 degrees

      newVy = -Math.abs(BALL_SPEED * Math.cos(angle));
      newVx = BALL_SPEED * Math.sin(angle);
      newY = paddleTop - BALL_SIZE;

      // Ensure minimum vertical speed
      if (Math.abs(newVy) < MIN_BALL_SPEED_Y) {
        newVy = -MIN_BALL_SPEED_Y;
      }
    }

    // Brick collision
    const collision = checkBrickCollision(newX, newY);
    if (collision) {
      if (collision.axis === 'x') {
        newVx = -newVx;
        if (collision.newX !== undefined) newX = collision.newX;
      } else {
        newVy = -newVy;
        if (collision.newY !== undefined) newY = collision.newY;
        // Ensure minimum vertical speed
        if (Math.abs(newVy) < MIN_BALL_SPEED_Y) {
          newVy = newVy > 0 ? MIN_BALL_SPEED_Y : -MIN_BALL_SPEED_Y;
        }
      }

      // Check win condition
      const allBroken = bricksRef.current.every(b => b.broken);
      if (allBroken) {
        wonRef.current = true;
        setRenderTrigger(t => t + 1);
      }
    }

    // Update ball position and velocity
    ballRef.current = { x: newX, y: newY };
    ballVelocityRef.current = { x: newVx, y: newVy };
  }, []);

  // Handle paddle movement
  const handleMove = useCallback(
    (direction: 'left' | 'right' | null) => {
      if (gameOverRef.current || wonRef.current) {
        if (gameOverRef.current && direction !== null) {
          initializeGame();
        }
        return;
      }
      setPaddleDirection(direction);
    },
    [initializeGame]
  );

  // Update paddle position
  useEffect(() => {
    if (!paddleDirection) return;

    const interval = setInterval(() => {
      if (gameOverRef.current || wonRef.current) return;

      setPaddleX(prev => {
        let newX = prev;
        if (paddleDirection === 'left') {
          newX = Math.max(0, prev - PADDLE_SPEED);
        } else if (paddleDirection === 'right') {
          newX = Math.min(canvasWidth - PADDLE_WIDTH, prev + PADDLE_SPEED);
        }
        paddleXRef.current = newX;
        return newX;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [paddleDirection]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (['ArrowLeft', 'a', 'A', 'q', 'Q'].includes(key)) {
        e.preventDefault();
        setPressedKeys(prev => new Set(prev).add(key));
        handleMove('left');
      } else if (['ArrowRight', 'd', 'D'].includes(key)) {
        e.preventDefault();
        setPressedKeys(prev => new Set(prev).add(key));
        handleMove('right');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      setPressedKeys(prev => {
        const newKeys = new Set(prev);
        newKeys.delete(key);

        if (
          ['ArrowLeft', 'a', 'A', 'q', 'Q', 'ArrowRight', 'd', 'D'].includes(
            key
          )
        ) {
          const hasLeft = Array.from(newKeys).some(k =>
            ['ArrowLeft', 'a', 'A', 'q', 'Q'].includes(k)
          );
          const hasRight = Array.from(newKeys).some(k =>
            ['ArrowRight', 'd', 'D'].includes(k)
          );

          if (hasLeft && !hasRight) handleMove('left');
          else if (hasRight && !hasLeft) handleMove('right');
          else handleMove(null);
        }

        return newKeys;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleMove]);

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high-DPI rendering
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvasWidth;
    const displayHeight = canvasHeight;

    // Set actual size in memory (scaled for DPI)
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // Scale the canvas back down using CSS
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // Scale the drawing context so everything draws at the correct size
    ctx.scale(dpr, dpr);

    const animate = () => {
      // Update game state
      gameLoop();

      // Clear canvas
      ctx.clearRect(0, 0, displayWidth, displayHeight);

      // Draw bricks
      bricksRef.current.forEach(brick => {
        if (!brick.broken) {
          ctx.fillStyle = '#10b981';
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
          ctx.strokeStyle = '#059669';
          ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        }
      });

      // Draw paddle
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(
        paddleXRef.current,
        canvasHeight - 30,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      // Draw ball
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(ballRef.current.x, ballRef.current.y, BALL_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Draw game over / win overlay
      if (gameOverRef.current || wonRef.current) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = displayWidth / 2;
        const centerY = displayHeight / 2;

        if (gameOverRef.current) {
          ctx.font = 'bold 40px Arial';
          ctx.fillStyle = '#ef4444';
          ctx.fillText('GAME OVER', centerX, centerY - 40);

          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(
            `${score} pièce${score > 1 ? 's' : ''}`,
            centerX,
            centerY
          );

          ctx.font = '16px Arial';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('Appuyez sur une touche', centerX, centerY + 35);
          ctx.fillText('pour recommencer', centerX, centerY + 55);
        } else {
          ctx.font = 'bold 40px Arial';
          ctx.fillStyle = '#10b981';
          ctx.fillText('VICTOIRE !', centerX, centerY - 30);

          ctx.font = 'bold 24px Arial';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(`${score} pièces gagnées !`, centerX, centerY + 10);
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameLoop, paddleX, score]);

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>🎮 Breakout</DialogTitle>
          <DialogDescription>
            Gagnez une pièce pour chaque brique cassée !
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col items-center gap-4'>
          <div className='flex-1 overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 select-none p-2'>
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className='block w-full h-auto'
            />
          </div>

          <div className='flex justify-center w-full'>
            <Keyboard
              variant='custom'
              rows={[['LEFT', 'RIGHT']]}
              aliases={{
                LEFT: ['ArrowLeft', 'q', 'Q', 'a', 'A'],
                RIGHT: ['ArrowRight', 'd', 'D'],
              }}
              pressedKeys={pressedKeys}
              disabled={false}
              onKey={key => {
                if (key === 'LEFT') handleMove('left');
                else if (key === 'RIGHT') handleMove('right');
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={initializeGame} variant='outline' size='sm'>
            Recommencer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
