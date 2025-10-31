'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MemoryCard {
  id: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface MemoryProps {
  onWin: () => void;
  onLose: () => void;
  onClose: () => void;
}

const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

export default function Memory({ onWin, onClose }: MemoryProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Use useRef to avoid unnecessary re-renders
  const onWinRef = useRef(onWin);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onWinRef.current = onWin;
    onCloseRef.current = onClose;
  }, [onWin, onClose]);

  const initializeCards = useCallback(() => {
    // Immediately reset all states
    console.log('Restarting game, setting gameOver to false');
    setGameOver(false);
    setFlippedCards([]);
    setMoves(0);

    const shuffledEmojis = [...EMOJIS, ...EMOJIS].sort(
      () => Math.random() - 0.5
    );
    const newCards = shuffledEmojis.map((emoji, index) => ({
      id: `card-${index}-${emoji}-${Math.random()}`, // ID unique
      emoji,
      isFlipped: false,
      isMatched: false,
    }));
    setCards(newCards);
  }, []);

  useEffect(() => {
    initializeCards();
  }, [initializeCards]);

  // Handle end of game
  useEffect(() => {
    if (gameOver) {
      // Use setTimeout to avoid calling during render
      const timeoutId = setTimeout(() => {
        onWinRef.current();
        // Ne pas fermer automatiquement le jeu, laisser l'utilisateur choisir
      }, 100); // Small delay to ensure state is stable

      // Cleanup function to cancel the timeout if the game restarts
      return () => clearTimeout(timeoutId);
    }
  }, [gameOver]);

  const flipCard = useCallback(
    (cardId: string) => {
      if (flippedCards.length >= 2 || gameOver) return;

      // Check if card is already flipped or matched
      const card = cards.find(c => c.id === cardId);
      if (card?.isFlipped || card?.isMatched) return;

      setCards(prev =>
        prev.map(card =>
          card.id === cardId ? { ...card, isFlipped: true } : card
        )
      );

      const newFlippedCards = [...flippedCards, cardId];
      setFlippedCards(newFlippedCards);

      if (newFlippedCards.length === 2) {
        setMoves(prev => prev + 1);

        setTimeout(() => {
          const [firstId, secondId] = newFlippedCards;
          const firstCard = cards.find(c => c.id === firstId);
          const secondCard = cards.find(c => c.id === secondId);

          if (firstCard?.emoji === secondCard?.emoji) {
            // Match found
            setCards(prev =>
              prev.map(card =>
                card.id === firstId || card.id === secondId
                  ? { ...card, isMatched: true, isFlipped: true }
                  : card
              )
            );

            // Check if all cards are matched
            setTimeout(() => {
              setCards(prev => {
                const allMatched = prev.every(card => card.isMatched);
                if (allMatched) {
                  setGameOver(true);
                }
                return prev;
              });
            }, 500);
          } else {
            // Pas de match, retourner les cartes
            setCards(prev =>
              prev.map(card =>
                card.id === firstId || card.id === secondId
                  ? { ...card, isFlipped: false }
                  : card
              )
            );
          }

          setFlippedCards([]);
        }, 750);
      }
    },
    [flippedCards, cards, gameOver]
  );

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>🧠 Memory</DialogTitle>

          <DialogDescription>
            Gagnez 3 pièces en retrouvant toutes les paires.
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className='grid grid-cols-4 gap-1 max-w-sm mx-auto'>
            {cards.map(card => (
              <motion.div
                key={card.id}
                onClick={() => flipCard(card.id)}
                className={`aspect-square text-2xl font-bold cursor-pointer rounded border flex items-center justify-center ${
                  card.isFlipped || card.isMatched || gameOver
                    ? 'cursor-not-allowed'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                } bg-slate-100 dark:bg-slate-800`}
                whileTap={{ scale: 0.95 }}
                animate={{
                  rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: 'easeInOut',
                }}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Face avant - Question mark */}
                <div
                  className='absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500'
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(0deg)',
                  }}
                >
                  ?
                </div>

                {/* Back face - Emoji */}
                <div
                  className={`absolute inset-0 flex items-center justify-center ${
                    card.isMatched
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  }`}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  {card.emoji}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={initializeCards} variant='outline' size='sm'>
            Recommencer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
