'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle } from 'lucide-react';
import RestartButton from '@/components/ui/restart-button';

interface GameEndModalProps {
  won: boolean;
  onRestart: () => void;
  onExit: () => void;
  unlockedWord?: string;
}

export default function GameEndModal({
  won,
  onRestart,
  onExit,
  unlockedWord,
}: GameEndModalProps) {
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
            "Vous avez débloqué le mot du jour qui vous permettra de composer la phrase secrète dans l'ardoise."
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
