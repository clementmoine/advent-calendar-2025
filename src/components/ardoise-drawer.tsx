'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import WordSlate from '@/components/word-slate';

interface ArdoiseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArdoiseDrawer({ isOpen, onClose }: ArdoiseDrawerProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<{ completed: number; total: number }>({
    completed: 0,
    total: 0,
  });

  // Force slate refresh when it opens
  useEffect(() => {
    if (isOpen) {
      setRefreshKey(prev => prev + 1);
    }
  }, [isOpen]);

  // Memoize the callback to prevent infinite loops
  const handleStatsChange = useCallback((completed: number, total: number) => {
    setStats({ completed, total });
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side='bottom'
        className='h-[90vh] max-h-[90vh] rounded-t-3xl border-t-0 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950'
      >
        <SheetHeader className='mb-6'>
          <SheetTitle className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
            Ardoise de mots
            {stats.total > 0 && (
              <span className='ml-2 text-lg font-normal text-slate-500 dark:text-slate-400'>
                ({stats.completed} sur {stats.total})
              </span>
            )}
          </SheetTitle>
          <SheetDescription className='text-slate-600 dark:text-slate-400'>
            Réorganisez par glisser-déposer les mots débloqués pour découvrir la
            phrase mystère.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto custom-scrollbar px-1'>
          <WordSlate key={refreshKey} onStatsChange={handleStatsChange} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
