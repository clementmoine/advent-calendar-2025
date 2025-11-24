'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Coins } from 'lucide-react';
import RestartButton from '@/components/ui/restart-button';
import { usePiggyBank } from '@/contexts/piggy-bank-context';
import { motion, AnimatePresence } from 'framer-motion';

interface GameEndModalProps {
  won: boolean;
  onRestart: () => void;
  onExit: () => void;
  unlockedWord?: string;
  isFirstCompletion?: boolean;
}

export default function GameEndModal({
  won,
  onRestart,
  onExit,
  unlockedWord,
  isFirstCompletion = false,
}: GameEndModalProps) {
  const { coins } = usePiggyBank();
  const [displayCoins, setDisplayCoins] = useState(coins);
  const [floatDeltas, setFloatDeltas] = useState<
    { id: number; text: string; color: string }[]
  >([]);
  const nextDeltaIdRef = useRef(1);

  const showDelta = useCallback((delta: number) => {
    const id = nextDeltaIdRef.current++;
    const isGain = delta > 0;
    const text = `${isGain ? '+' : ''}${delta}`;
    const color = isGain ? '#16a34a' : '#dc2626'; // green-600 or red-600
    setFloatDeltas(d => [...d, { id, text, color }]);
    setTimeout(() => {
      setFloatDeltas(d => d.filter(x => x.id !== id));
    }, 1200);
  }, []);

  // Show +20 animation and animate coins when first completion
  useEffect(() => {
    if (won && isFirstCompletion) {
      // Start with original value
      const startCoins = coins - 20;
      setDisplayCoins(startCoins);

      // Small delay to ensure modal is visible
      const timer = setTimeout(() => {
        // Show the +20 animation
        showDelta(20);

        // Animate coins from start to end
        const duration = 1000; // 1 second
        const steps = 20;
        const stepDuration = duration / steps;
        const increment = 20 / steps;

        let currentStep = 0;
        const interval = setInterval(() => {
          currentStep++;
          const newCoins = Math.min(
            startCoins + increment * currentStep,
            coins
          );
          setDisplayCoins(Math.floor(newCoins));

          if (currentStep >= steps) {
            setDisplayCoins(coins);
            clearInterval(interval);
          }
        }, stepDuration);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setDisplayCoins(coins);
    }
  }, [won, isFirstCompletion, coins, showDelta]);

  return (
    <Dialog open={true} onOpenChange={open => !open && onExit()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <div className='flex items-center gap-4'>
            {won ? (
              <CheckCircle className='size-12 text-green-500' />
            ) : (
              <XCircle className='size-12 text-red-500' />
            )}
            <DialogTitle className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
              {won ? 'Bravo !' : 'Game Over'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Message */}
        <p className='text-slate-600 dark:text-slate-400'>
          {won ? (
            isFirstCompletion ? (
              "Vous avez débloqué le mot du jour qui vous permettra de composer la phrase secrète dans l'ardoise."
            ) : (
              <>
                Vous avez déjà terminé ce jeu. Pour gagner plus de pièces,
                essayez les{' '}
                <button
                  onClick={() => {
                    // Open piggy bank
                    const piggyBankButton = document.querySelector(
                      '[data-piggy-bank-button]'
                    ) as HTMLButtonElement;
                    if (piggyBankButton) {
                      piggyBankButton.click();
                    }
                  }}
                  className='text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 underline font-medium'
                >
                  mini-jeux
                </button>{' '}
                disponibles dans la tirelire !
              </>
            )
          ) : (
            <>
              Ne désespère pas et n&apos;hésite pas à consulter le
              <button
                onClick={() => {
                  // Trigger rules opening
                  const rulesButton = document.querySelector(
                    '[data-rules-button]'
                  ) as HTMLButtonElement;
                  if (rulesButton) {
                    rulesButton.click();
                  }
                }}
                className='text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline font-medium'
              >
                mode d&apos;emploi
              </button>
              pour obtenir des astuces !
            </>
          )}
        </p>

        {/* Coins display for first completion */}
        {won && isFirstCompletion && (
          <div className='flex items-center gap-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3 border border-yellow-200 dark:border-yellow-800'>
            <Coins className='size-6 text-yellow-600 dark:text-yellow-400' />
            <div className='flex flex-col flex-1'>
              <div className='text-sm text-yellow-700 dark:text-yellow-300 mb-1'>
                Récompense jeu terminé
              </div>
              <div className='flex items-center gap-2 relative'>
                <span className='text-sm text-slate-600 dark:text-slate-300'>
                  Solde:
                </span>
                <span className='inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 relative'>
                  <Coins className='size-4 text-amber-700 dark:text-amber-400' />
                  {displayCoins}
                  {/* Floating coin delta animations */}
                  <div className='absolute left-full ml-1 pointer-events-none'>
                    {floatDeltas.map(d => (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        style={{ color: d.color }}
                        className='text-sm font-bold drop-shadow-sm'
                      >
                        {d.text}
                      </motion.div>
                    ))}
                  </div>
                </span>
              </div>
              <span className='text-xs text-slate-600 dark:text-slate-400 mt-1'>
                Utilisez vos pièces pour obtenir des indices dans les jeux
              </span>
            </div>
          </div>
        )}

        {/* Unlocked word */}
        {won && unlockedWord && (
          <div className='inline-flex items-center rounded-lg bg-green-100 dark:bg-green-900/30 px-4 py-2'>
            <span className='text-lg font-bold text-green-800 dark:text-green-200'>
              {unlockedWord}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className='flex flex-col gap-3'>
          <Button onClick={onExit} variant='outline' className='w-full'>
            Retour au calendrier
          </Button>
          <RestartButton
            onRestart={onRestart}
            variant='with-label'
            className='w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
