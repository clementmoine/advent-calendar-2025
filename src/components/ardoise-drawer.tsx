'use client';

import { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import WordSlate from '@/components/word-slate';

interface ArdoiseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArdoiseDrawer({ isOpen, onClose }: ArdoiseDrawerProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  // Force slate refresh when it opens
  useEffect(() => {
    if (isOpen) {
      setRefreshKey(prev => prev + 1);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent side='bottom' className='h-[85vh] rounded-t-2xl'>
        <SheetHeader>
          <SheetTitle className='text-xl font-bold text-slate-900 dark:text-slate-100'>
            📝 Ardoise de mots
          </SheetTitle>
        </SheetHeader>

        <div className='flex-1 overflow-y-auto custom-scrollbar mt-4'>
          <WordSlate key={refreshKey} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
