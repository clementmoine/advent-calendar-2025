'use client';

import { motion } from 'framer-motion';
import { X, Circle } from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Player = 'X' | 'O' | null;
type Board = Player[];

interface TicTacToeProps {
  onWin: () => void;
  onLose: () => void;
  onClose: () => void;
}

export default function TicTacToe({ onWin, onLose, onClose }: TicTacToeProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<'X' | 'O'>('X');
  const [gameOver, setGameOver] = useState(false);
  const [, setWinner] = useState<Player>(null);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [lineCoords, setLineCoords] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const checkWinner = useCallback(
    (board: Board): { winner: Player; line: number[] | null } => {
      const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // rows
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // columns
        [0, 4, 8],
        [2, 4, 6], // diagonals
      ];

      for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return { winner: board[a], line: [a, b, c] };
        }
      }
      return { winner: null, line: null };
    },
    []
  );

  // Easy-to-beat AI (Level 1)
  const getComputerMove = useCallback(
    (board: Board): number => {
      // 1) Prevent the player from winning (defensive only)
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          const newBoard = [...board];
          newBoard[i] = 'X';
          if (checkWinner(newBoard).winner === 'X') {
            return i;
          }
        }
      }

      // 2) Pick a random free cell (no offensive strategy)
      const availableMoves = [];
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          availableMoves.push(i);
        }
      }

      // Return a random cell
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    },
    [checkWinner]
  );

  const makeMove = useCallback(
    (index: number) => {
      if (
        board[index] ||
        gameOver ||
        currentPlayer !== 'X' ||
        isComputerThinking
      )
        return;

      const newBoard = [...board];
      newBoard[index] = 'X';
      setBoard(newBoard);

      const { winner: gameWinner, line: winningLineResult } =
        checkWinner(newBoard);
      if (gameWinner) {
        setWinner(gameWinner);
        setWinningLine(winningLineResult);
        setGameOver(true);
        if (gameWinner === 'X') {
          onWin();
        } else {
          onLose();
        }
        // Laisser l'utilisateur fermer manuellement
        return;
      }

      if (newBoard.every(cell => cell !== null)) {
        setGameOver(true);
        onLose(); // Draw = loss (game rule)
        // Laisser l'utilisateur fermer manuellement
        return;
      }

      // Tour de l'ordinateur
      setIsComputerThinking(true);
      setTimeout(() => {
        const computerMove = getComputerMove(newBoard);
        if (computerMove !== -1) {
          const computerBoard = [...newBoard];
          computerBoard[computerMove] = 'O';
          setBoard(computerBoard);

          const { winner: computerWinner, line: computerWinningLine } =
            checkWinner(computerBoard);
          if (computerWinner) {
            setWinner(computerWinner);
            setWinningLine(computerWinningLine);
            setGameOver(true);
            if (computerWinner === 'X') {
              onWin(); // Player won
            } else {
              onLose(); // Computer won
            }
            // Laisser l'utilisateur fermer manuellement
            return;
          }

          if (computerBoard.every(cell => cell !== null)) {
            setGameOver(true);
            onLose(); // Draw = loss (game rule)
            // Laisser l'utilisateur fermer manuellement
            return;
          }
        }
        setIsComputerThinking(false);
      }, 800); // Delay to simulate "thinking"
    },
    [
      board,
      currentPlayer,
      gameOver,
      isComputerThinking,
      checkWinner,
      getComputerMove,
      onWin,
      onLose,
    ]
  );

  const reset = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setGameOver(false);
    setWinner(null);
    setIsComputerThinking(false);
    setWinningLine(null);
    setLineCoords(null);
  }, []);

  // Compute winning line coordinates
  useEffect(() => {
    if (winningLine && boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect();
      const cells = boardRef.current.querySelectorAll('[data-cell]');

      if (cells.length >= 3) {
        const firstCell = cells[winningLine[0]] as HTMLElement;
        const lastCell = cells[winningLine[2]] as HTMLElement;

        if (firstCell && lastCell) {
          const firstRect = firstCell.getBoundingClientRect();
          const lastRect = lastCell.getBoundingClientRect();

          setLineCoords({
            x1: firstRect.left - boardRect.left + firstRect.width / 2,
            y1: firstRect.top - boardRect.top + firstRect.height / 2,
            x2: lastRect.left - boardRect.left + lastRect.width / 2,
            y2: lastRect.top - boardRect.top + lastRect.height / 2,
          });
        }
      }
    }
  }, [winningLine]);

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>⭕ Morpion</DialogTitle>

          <DialogDescription>Gagnez 1 pièce par victoire.</DialogDescription>
        </DialogHeader>

        <div>
          <div ref={boardRef} className='w-48 aspect-square mx-auto relative'>
            {/* Ligne de victoire */}
            {winningLine && (
              <motion.div
                key={winningLine.join('-')}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  damping: 20,
                  stiffness: 300,
                  delay: 0.5,
                }}
                className='absolute inset-0 pointer-events-none'
              >
                <svg className='w-full h-full'>
                  <motion.line
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      duration: 1,
                      ease: 'easeInOut',
                      delay: 0.8,
                    }}
                    x1={lineCoords?.x1 || 0}
                    y1={lineCoords?.y1 || 0}
                    x2={lineCoords?.x2 || 0}
                    y2={lineCoords?.y2 || 0}
                    stroke='#10b981'
                    strokeWidth='6'
                    strokeLinecap='round'
                    className='drop-shadow-lg'
                  />
                </svg>
              </motion.div>
            )}

            {/* Board */}
            <div className='grid grid-cols-3 grid-rows-3 gap-2'>
              {board.map((cell, index) => (
                <motion.div
                  key={index}
                  data-cell
                  onClick={() => makeMove(index)}
                  className={`aspect-square flex items-center justify-center text-2xl font-bold cursor-pointer rounded border relative z-10 ${
                    cell !== null || gameOver || isComputerThinking
                      ? 'cursor-not-allowed'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  } ${
                    cell === 'X'
                      ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : cell === 'O'
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  } ${
                    winningLine && winningLine.includes(index)
                      ? 'ring-4 ring-green-500 dark:ring-green-400'
                      : ''
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {cell === 'X' ? (
                    <X className='size-6' />
                  ) : cell === 'O' ? (
                    <Circle className='size-6' />
                  ) : null}
                </motion.div>
              ))}
            </div>
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
