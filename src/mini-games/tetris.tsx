'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Keyboard from '@/components/keyboard';

interface TetrisProps {
  onWin: () => void;
  onLose: () => void;
  onClose: () => void;
}

interface Piece {
  shape: number[][];
  color: string;
  type: string;
}

interface Position {
  x: number;
  y: number;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

/* -------------------------------
   Pieces (spawn orientations)
   ------------------------------- */
const PIECES: Piece[] = [
  { type: 'I', shape: [[1, 1, 1, 1]], color: 'bg-sky-500 dark:bg-sky-400' },
  {
    type: 'O',
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: 'bg-yellow-400 dark:bg-yellow-300',
  },
  {
    type: 'T',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: 'bg-purple-600 dark:bg-purple-500',
  },
  {
    type: 'S',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: 'bg-green-500 dark:bg-green-400',
  },
  {
    type: 'Z',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: 'bg-red-500 dark:bg-red-400',
  },
  {
    type: 'L',
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: 'bg-orange-400 dark:bg-orange-300',
  },
  {
    type: 'J',
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: 'bg-blue-600 dark:bg-blue-500',
  },
];

/* -------------------------------
   Rotation tables (SRS shapes)
   Each entry: 4 rotation states for that piece.
   ------------------------------- */
const ROTATION_TABLES: Record<string, number[][][]> = {
  I: [
    [[1, 1, 1, 1]], // 0° horizontal
    [[1], [1], [1], [1]], // 90° vertical
    [[1, 1, 1, 1]], // 180° horizontal (flipped)
    [[1], [1], [1], [1]], // 270° vertical (flipped)
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 0],
    ],
    [
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1],
      [1, 1],
      [0, 1],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 0],
    ],
  ],
  L: [
    [
      [1, 0, 0],
      [1, 1, 1],
    ],
    [
      [1, 1],
      [1, 0],
      [1, 0],
    ],
    [
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
  ],
  J: [
    [
      [0, 0, 1],
      [1, 1, 1],
    ],
    [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    [
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1],
      [0, 1],
      [0, 1],
    ],
  ],
};

/* -------------------------------
   SRS wall kick tables (official-like)
   Indexed by from->to rotation (0, R, 2, L).
   I-piece has its own table.
   ------------------------------- */
const ROT_NAMES = ['0', 'R', '2', 'L'];

// J/L/S/T/Z kicks
const JLSTZ_KICKS: Record<string, number[][]> = {
  '0->R': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  'R->0': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  'R->2': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  '2->R': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  '2->L': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  'L->2': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  'L->0': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  '0->L': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
};

// I kicks
const I_KICKS: Record<string, number[][]> = {
  '0->R': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  'R->0': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  'R->2': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  '2->R': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  '2->L': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  'L->2': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  'L->0': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  '0->L': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
};

/* -------------------------------
   Scoring (guideline-like)
   Back-to-back multiplier and T-spin scoring
   ------------------------------- */
const BASE_SCORE = {
  single: 100,
  double: 300,
  triple: 500,
  tetris: 800,
  tspinSingle: 800,
  tspinDouble: 1200,
  tspinTriple: 1600,
  tspinMiniSingle: 200,
};

/* -------------------------------
   Component start
   ------------------------------- */
export default function Tetris({ onWin, onLose, onClose }: TetrisProps) {
  // board cells are either '' or a tailwind class string like 'bg-sky-500 ...'
  const [board, setBoard] = useState<string[][]>(
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(''))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [currentRotation, setCurrentRotation] = useState<number>(0);
  const [currentPosition, setCurrentPosition] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [, setScore] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [, setLinesCleared] = useState<number>(0);
  // Keep last piece visible on game over
  const [frozenPiece, setFrozenPiece] = useState<Piece | null>(null);
  const [frozenPosition, setFrozenPosition] = useState<Position | null>(null);

  // Lock delay and state
  const lockDelayMs = 500; // guideline uses small lock delay
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onGroundRef = useRef(false);

  // Track last move type to detect T-spins (rotation -> lock)
  const lastActionWasRotationRef = useRef(false);
  const backToBackRef = useRef(false);

  // stable refs for callbacks
  const onWinRef = useRef(onWin);
  const onLoseRef = useRef(onLose);
  useEffect(() => {
    onWinRef.current = onWin;
    onLoseRef.current = onLose;
  }, [onWin, onLose]);

  const getRandomPiece = useCallback((): Piece => {
    return PIECES[Math.floor(Math.random() * PIECES.length)];
  }, []);

  /* -------------------------------
     Utility: check placement validity
     ------------------------------- */
  const isValidPosition = useCallback(
    (piece: Piece, pos: Position, boardToCheck: string[][]) => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (!piece.shape[y][x]) continue;
          const nx = pos.x + x;
          const ny = pos.y + y;
          if (nx < 0 || nx >= BOARD_WIDTH) return false;
          if (ny >= BOARD_HEIGHT) return false;
          if (ny >= 0 && boardToCheck[ny][nx]) return false;
        }
      }
      return true;
    },
    []
  );

  /* -------------------------------
     Place piece (returns new board)
     ------------------------------- */
  const placePiece = useCallback(
    (piece: Piece, pos: Position, boardToUse: string[][]) => {
      const nb = boardToUse.map(row => [...row]);
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const nx = pos.x + x;
            const ny = pos.y + y;
            if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
              nb[ny][nx] = piece.color;
            }
          }
        }
      }
      return nb;
    },
    []
  );

  /* -------------------------------
     Clear lines, compute score + back-to-back rules, T-spin handling
     Returns {newBoard, linesCleared, linesType}
     linesType: 'normal' | 'tspin' | 'tspin-mini'
     ------------------------------- */
  const handleClearsAndScoring = useCallback(
    (boardWithPlaced: string[][], isTSpin: boolean, isTSpinMini: boolean) => {
      const newBoard = boardWithPlaced.filter(row =>
        row.some(cell => cell === '')
      );
      const lines = BOARD_HEIGHT - newBoard.length;
      let finalBoard = boardWithPlaced;
      let points = 0;

      if (lines > 0) {
        // build top empty lines
        const empty = Array(lines)
          .fill(null)
          .map(() => Array(BOARD_WIDTH).fill(''));
        finalBoard = [...empty, ...newBoard];

        // scoring
        if (isTSpin && !isTSpinMini) {
          // T-Spin proper
          if (lines === 1) points = BASE_SCORE.tspinSingle;
          else if (lines === 2) points = BASE_SCORE.tspinDouble;
          else if (lines === 3) points = BASE_SCORE.tspinTriple;
        } else if (isTSpinMini) {
          if (lines === 1) points = BASE_SCORE.tspinMiniSingle;
          // mini double/triple are rare/undefined, ignore
        } else {
          // normal clears
          if (lines === 1) points = BASE_SCORE.single;
          else if (lines === 2) points = BASE_SCORE.double;
          else if (lines === 3) points = BASE_SCORE.triple;
          else if (lines === 4) points = BASE_SCORE.tetris;
        }

        // back-to-back multiplier for Tetris or T-Spin non-mini
        if (
          (lines === 4 || (isTSpin && !isTSpinMini)) &&
          backToBackRef.current
        ) {
          points = Math.floor(points * 1.5);
        }

        // update B2B state
        if (lines === 4 || (isTSpin && !isTSpinMini)) {
          backToBackRef.current = true;
        } else if (lines > 0) {
          backToBackRef.current = false;
        }

        setScore(s => s + points);
        setLinesCleared(l => l + lines);
        // Award 1 coin per cleared line (defer to next tick)
        setTimeout(() => {
          for (let i = 0; i < lines; i++) onWinRef.current();
        }, 0);
      }

      return {
        newBoard: finalBoard,
        linesCleared: lines,
        points,
        linesType: isTSpin ? (isTSpinMini ? 'tspin-mini' : 'tspin') : 'normal',
      };
    },
    []
  );

  /* -------------------------------
     Reset game
     ------------------------------- */
  const reset = useCallback(() => {
    setBoard(
      Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(''))
    );
    setCurrentPiece(null);
    setNextPiece(null);
    setCurrentRotation(0);
    setCurrentPosition({ x: 0, y: 0 });
    setScore(0);
    setLinesCleared(0);
    setGameOver(false);
    backToBackRef.current = false;
    lastActionWasRotationRef.current = false;
    onGroundRef.current = false;
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  /* -------------------------------
     Spawn piece (uses nextPiece or random)
     ------------------------------- */
  const spawnNewPiece = useCallback(() => {
    const piece = nextPiece || getRandomPiece();
    const nextP = getRandomPiece();

    const spawnX =
      Math.floor(BOARD_WIDTH / 2) - Math.floor(piece.shape[0].length / 2);

    if (isValidPosition(piece, { x: spawnX, y: 0 }, board)) {
      setCurrentPiece(piece);
      setNextPiece(nextP);
      setCurrentRotation(0);
      setCurrentPosition({ x: spawnX, y: 0 });
      lastActionWasRotationRef.current = false;
    } else {
      // spawn blocked -> game over
      setFrozenPiece(piece);
      setFrozenPosition({ x: spawnX, y: 0 });
      setGameOver(true);
      onLoseRef.current();
    }
  }, [board, getRandomPiece, isValidPosition, nextPiece]);

  /* -------------------------------
     Rotation with full SRS wall kicks; records lastActionWasRotationRef
     ------------------------------- */
  const rotatePiece = useCallback(
    (direction: 'cw' | 'ccw' = 'cw') => {
      if (!currentPiece || gameOver) return;

      const from = currentRotation;
      const to = direction === 'cw' ? (from + 1) % 4 : (from + 3) % 4;

      const rotationTable = ROTATION_TABLES[currentPiece.type];
      const rotatedShape = rotationTable[to];
      const rotatedPiece: Piece = { ...currentPiece, shape: rotatedShape };

      const key = `${ROT_NAMES[from]}->${ROT_NAMES[to]}`;
      const kicks =
        currentPiece.type === 'I'
          ? I_KICKS[key] || [[0, 0]]
          : JLSTZ_KICKS[key] || [[0, 0]];

      // try each wall kick
      for (const [dx, dy] of kicks) {
        const testPos = {
          x: currentPosition.x + dx,
          y: currentPosition.y + dy,
        };
        // clamp horizontally to board edges for safety
        testPos.x = Math.max(
          0,
          Math.min(BOARD_WIDTH - rotatedShape[0].length, testPos.x)
        );
        if (isValidPosition(rotatedPiece, testPos, board)) {
          setCurrentPiece(rotatedPiece);
          setCurrentRotation(to);
          setCurrentPosition(testPos);
          lastActionWasRotationRef.current = true;
          // reset lock timer if on ground after rotation (rotation that moves down may put on ground)
          if (lockTimerRef.current) {
            clearTimeout(lockTimerRef.current);
            lockTimerRef.current = null;
          }
          return;
        }
      }
      // no valid kick found -> no rotation; still record that player tried rotating (for T-Spin mini nuance)
      lastActionWasRotationRef.current = true;
    },
    [
      currentPiece,
      currentPosition,
      currentRotation,
      isValidPosition,
      board,
      gameOver,
    ]
  );

  /* -------------------------------
     Soft/hard drop and lateral movement
     Lateral + rotation reset lock delay.
     ------------------------------- */
  const movePiece = useCallback(
    (dx: number, dy: number) => {
      if (!currentPiece || gameOver) return;

      const np = { x: currentPosition.x + dx, y: currentPosition.y + dy };
      if (isValidPosition(currentPiece, np, board)) {
        setCurrentPosition(np);
        // any movement cancels lock timer
        if (lockTimerRef.current) {
          clearTimeout(lockTimerRef.current);
          lockTimerRef.current = null;
        }
        onGroundRef.current = false;
      } else {
        // if trying to move down and cannot, start lock delay if not already started
        if (dy > 0) {
          if (!onGroundRef.current) {
            onGroundRef.current = true;
            if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
            lockTimerRef.current = setTimeout(() => {
              // time to lock
              if (!currentPiece) return;
              const finalBoard = placePiece(
                currentPiece,
                currentPosition,
                board
              );
              // detect T-Spin at lock
              let isTSpin = false;
              let isTSpinMini = false;
              if (
                currentPiece.type === 'T' &&
                lastActionWasRotationRef.current
              ) {
                // check 4 corners around T tile origin (use currentPosition and shape)
                // find center of T: when using our rotation tables, center is ambiguous.
                // Simpler heuristic: count occupied corners around the rotation center cell:
                const corners = [
                  { x: currentPosition.x, y: currentPosition.y }, // top-left approx
                  { x: currentPosition.x + 2, y: currentPosition.y }, // top-right approx
                  { x: currentPosition.x, y: currentPosition.y + 2 }, // bottom-left approx
                  { x: currentPosition.x + 2, y: currentPosition.y + 2 }, // bottom-right approx
                ];
                let occupied = 0;
                for (const c of corners) {
                  if (
                    c.x < 0 ||
                    c.x >= BOARD_WIDTH ||
                    c.y < 0 ||
                    c.y >= BOARD_HEIGHT
                  )
                    occupied++;
                  else if (finalBoard[c.y][c.x]) occupied++;
                }
                if (occupied >= 3) isTSpin = true;
                // mini detection heuristic: if rotation had no kicks and piece didn't move down, it's mini
                // for simplicity we won't compute mini precisely; only set mini when occupied === 3 and lastActionWasRotationRef is true
                if (occupied === 3) isTSpinMini = true;
              }
              const {
                newBoard,
                // linesCleared: lines,
                // points,
              } = (() => {
                const res = handleClearsAndScoring(
                  finalBoard,
                  isTSpin,
                  isTSpinMini
                );
                return {
                  newBoard: res.newBoard,
                  // linesCleared: res.linesCleared,
                  // points: res.points,
                };
              })();

              setBoard(newBoard);
              setCurrentPiece(null);
              lastActionWasRotationRef.current = false;
              onGroundRef.current = false;
              if (lockTimerRef.current) {
                clearTimeout(lockTimerRef.current);
                lockTimerRef.current = null;
              }
            }, lockDelayMs);
          }
        }
      }
    },
    [
      board,
      currentPiece,
      currentPosition,
      gameOver,
      handleClearsAndScoring,
      isValidPosition,
      placePiece,
    ]
  );

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver) return;
    let y = currentPosition.y;
    while (
      isValidPosition(currentPiece, { x: currentPosition.x, y: y + 1 }, board)
    )
      y++;
    const finalBoard = placePiece(
      currentPiece,
      { x: currentPosition.x, y },
      board
    );
    // T-spin detection similar to above
    let isTSpin = false;
    let isTSpinMini = false;
    if (currentPiece.type === 'T' && lastActionWasRotationRef.current) {
      const corners = [
        { x: currentPosition.x, y: currentPosition.y },
        { x: currentPosition.x + 2, y: currentPosition.y },
        { x: currentPosition.x, y: currentPosition.y + 2 },
        { x: currentPosition.x + 2, y: currentPosition.y + 2 },
      ];
      let occupied = 0;
      for (const c of corners) {
        if (c.x < 0 || c.x >= BOARD_WIDTH || c.y < 0 || c.y >= BOARD_HEIGHT)
          occupied++;
        else if (finalBoard[c.y][c.x]) occupied++;
      }
      if (occupied >= 3) isTSpin = true;
      if (occupied === 3) isTSpinMini = true;
    }
    const { newBoard } = handleClearsAndScoring(
      finalBoard,
      isTSpin,
      isTSpinMini
    );
    setBoard(newBoard);
    setCurrentPiece(null);
    lastActionWasRotationRef.current = false;
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, [
    board,
    currentPiece,
    currentPosition,
    handleClearsAndScoring,
    isValidPosition,
    placePiece,
    gameOver,
  ]);

  /* -------------------------------
     Game loop auto gravity
     ------------------------------- */
  const gravityIntervalMs = 500;
  useEffect(() => {
    if (gameOver || isPaused) return;
    const id = setInterval(() => {
      // attempt to move down; if blocked, movePiece will start lock timer
      movePiece(0, 1);
    }, gravityIntervalMs);
    return () => clearInterval(id);
  }, [movePiece, gameOver, isPaused]);

  /* -------------------------------
     Spawn when needed
     ------------------------------- */
  useEffect(() => {
    if (!currentPiece && !gameOver) spawnNewPiece();
  }, [currentPiece, gameOver, spawnNewPiece]);

  // Pressed keys state for on-screen arrows feedback
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      setPressedKeys(prev => new Set(prev).add(e.key));
    };
    const onUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.key);
        return next;
      });
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  /* -------------------------------
     Keyboard handlers with repeat
     ------------------------------- */
  useEffect(() => {
    const pressed = new Set<string>();
    const intervals = new Map<string, NodeJS.Timeout>();

    const onKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      const k = e.key;
      if (pressed.has(k)) return;
      pressed.add(k);

      switch (k) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece(-1, 0);
          intervals.set(
            k,
            setInterval(() => movePiece(-1, 0), 100)
          );
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece(1, 0);
          intervals.set(
            k,
            setInterval(() => movePiece(1, 0), 100)
          );
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece(0, 1); // soft drop
          intervals.set(
            k,
            setInterval(() => movePiece(0, 1), 50)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotatePiece('cw');
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          rotatePiece('ccw');
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPaused(v => !v);
          break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key;
      pressed.delete(k);
      const t = intervals.get(k);
      if (t) {
        clearInterval(t);
        intervals.delete(k);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      intervals.forEach(i => clearInterval(i));
    };
  }, [movePiece, rotatePiece, hardDrop, gameOver]);

  /* -------------------------------
     Win condition
     ------------------------------- */
  // Per-line rewards handled in clear-time

  /* -------------------------------
     Rendering helpers: render piece small preview
     ------------------------------- */
  const renderPiecePreview = (piece: Piece | null) => {
    if (!piece) return <div className='w-9 h-9' />;

    const PREVIEW_SIZE = 4; // 4x4 canonical preview
    // Always preview at spawn orientation (no rotation)
    const baseShape = ROTATION_TABLES[piece.type][0];
    const ph = baseShape.length;
    const pw = baseShape[0]?.length || 0;
    const offY = Math.max(0, Math.floor((PREVIEW_SIZE - ph) / 2));
    const offX = Math.max(0, Math.floor((PREVIEW_SIZE - pw) / 2));

    return (
      <div className='grid grid-cols-4 gap-0.5'>
        {Array.from({ length: PREVIEW_SIZE }).map((_, y) =>
          Array.from({ length: PREVIEW_SIZE }).map((_, x) => {
            const py = y - offY;
            const px = x - offX;
            const cell = baseShape[py]?.[px] || 0;
            return (
              <div
                key={`${y}-${x}`}
                className={`w-3 h-3 ${cell ? piece.color : ''}`}
              />
            );
          })
        )}
      </div>
    );
  };

  /* -------------------------------
     Landing/ghost calculation
     ------------------------------- */
  const getLandingY = useCallback(() => {
    if (!currentPiece) return currentPosition.y;
    let y = currentPosition.y;
    while (
      isValidPosition(currentPiece, { x: currentPosition.x, y: y + 1 }, board)
    )
      y++;
    return y;
  }, [currentPiece, currentPosition, board, isValidPosition]);

  const landingY = currentPiece ? getLandingY() : null;

  /* -------------------------------
     Render final board with current piece and ghost
     ------------------------------- */
  const renderBoard = () => {
    const display = board.map(r => [...r]);

    if (currentPiece && landingY !== null) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const nx = currentPosition.x + x;
            const ny = landingY + y;
            if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
              display[ny][nx] = `shadow-${currentPiece.color}`;
            }
          }
        }
      }
    }

    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const nx = currentPosition.x + x;
            const ny = currentPosition.y + y;
            if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
              display[ny][nx] = currentPiece.color;
            }
          }
        }
      }
    }

    // If game over, keep last piece visible at its spawn position
    if (gameOver && frozenPiece && frozenPosition) {
      for (let y = 0; y < frozenPiece.shape.length; y++) {
        for (let x = 0; x < frozenPiece.shape[y].length; x++) {
          if (frozenPiece.shape[y][x]) {
            const nx = frozenPosition.x + x;
            const ny = frozenPosition.y + y;
            if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
              display[ny][nx] = frozenPiece.color;
            }
          }
        }
      }
    }

    return display;
  };

  /* -------------------------------
     Mouse movement: set X and auto-rotate using SRS-aware search
     Behavior: follow mouse X, compute best rotation using kicks
     ------------------------------- */
  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-lg p-0'>
        <DialogHeader className='px-6 pt-6'>
          <DialogTitle className='text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2'>
            🧩 Tetris
          </DialogTitle>
          <DialogDescription>
            Gagnez 1 pièce par ligne effacée.
          </DialogDescription>
        </DialogHeader>

        <div className='px-6'>
          <div className='flex gap-4 justify-center'>
            {/* Board */}
            <div className='grid grid-cols-10 gap-0.5 p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900'>
              {renderBoard().map((row, y) =>
                row.map((cell, x) => {
                  const isShadow =
                    typeof cell === 'string' && cell.startsWith('shadow-');
                  const shadowColor = isShadow
                    ? cell.replace('shadow-', '')
                    : '';
                  const actualColor = isShadow ? '' : cell;
                  const getShadowOutline = (color: string) => {
                    if (!isShadow) return '';
                    if (color.includes('sky-500'))
                      return 'outline-sky-500/30 dark:outline-sky-400/30';
                    if (color.includes('yellow-400'))
                      return 'outline-yellow-400/30 dark:outline-yellow-300/30';
                    if (color.includes('purple-600'))
                      return 'outline-purple-600/30 dark:outline-purple-500/30';
                    if (color.includes('green-500'))
                      return 'outline-green-500/30 dark:outline-green-400/30';
                    if (color.includes('red-500'))
                      return 'outline-red-500/30 dark:outline-red-400/30';
                    if (color.includes('orange-400'))
                      return 'outline-orange-400/30 dark:outline-orange-300/30';
                    if (color.includes('blue-600'))
                      return 'outline-blue-600/30 dark:outline-blue-500/30';
                    return 'outline-cyan-500/30 dark:outline-cyan-400/30';
                  };

                  return (
                    <div
                      key={`${y}-${x}`}
                      className={`w-4 h-4 relative rounded-sm ${actualColor || ''} ${
                        isShadow
                          ? `outline outline-[1px] ${getShadowOutline(shadowColor)} outline-offset-[-1px]`
                          : ''
                      }`}
                    />
                  );
                })
              )}
            </div>

            {/* Side panel (current + next) */}
            <div className='flex flex-col gap-4'>
              <div className='p-2 overflow-hidden items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex flex-col justify-center'>
                <div className='flex-1 flex items-center justify-center shrink-0'>
                  {currentPiece ? (
                    renderPiecePreview(currentPiece)
                  ) : (
                    <div className='w-9 h-9' />
                  )}
                </div>
              </div>

              <div className='p-2 overflow-hidden items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 flex flex-col justify-center'>
                <div className='flex-1 flex items-center justify-center shrink-0'>
                  {nextPiece ? (
                    renderPiecePreview(nextPiece)
                  ) : (
                    <div className='w-9 h-9' />
                  )}
                </div>
              </div>

              <Keyboard
                variant='custom'
                className='mt-auto'
                rows={[['ROTATE'], ['LEFT', 'DOWN', 'RIGHT'], ['DROP']]}
                aliases={{
                  ROTATE: ['ArrowUp', 'z', 'Z', 'w', 'W'],
                  LEFT: ['ArrowLeft', 'q', 'Q', 'a', 'A'],
                  DOWN: ['ArrowDown', 's', 'S'],
                  RIGHT: ['ArrowRight', 'd', 'D'],
                  DROP: [' ', 'Space'],
                }}
                pressedKeys={pressedKeys}
                disabled={gameOver}
                onKey={key => {
                  if (gameOver) return;
                  switch (key) {
                    case 'LEFT':
                      movePiece(-1, 0);
                      break;
                    case 'RIGHT':
                      movePiece(1, 0);
                      break;
                    case 'DOWN':
                      movePiece(0, 1);
                      break;
                    case 'ROTATE':
                      rotatePiece('cw');
                      break;
                    case 'DROP':
                      hardDrop();
                      break;
                  }
                }}
              />
            </div>
          </div>
        </div>

        <DialogFooter className='px-6 pb-6'>
          <Button onClick={reset} variant='outline' size='sm'>
            Recommencer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
