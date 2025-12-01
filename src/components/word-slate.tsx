'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useGameProgress } from '@/hooks/useGameProgress';
import { Sparkles, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WordItemProps {
  word: string | null;
  day: number;
  isCompleted: boolean;
}

function WordItem({ word, day, isCompleted }: WordItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `day-${day}` });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.6 : 1,
    scale: isDragging ? 1.05 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        'group relative cursor-grab active:cursor-grabbing',
        'transition-all duration-200 ease-out',
        isDragging && 'z-50 shadow-2xl'
      )}
    >
      <div
        {...listeners}
        className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-3',
          'border-2 transition-all duration-200',
          'shadow-sm hover:shadow-md',
          isCompleted
            ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/40 border-emerald-300 dark:border-emerald-600 hover:border-emerald-400 dark:hover:border-emerald-500'
            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
          isDragging && 'ring-2 ring-emerald-400 ring-offset-2'
        )}
      >
        <GripVertical
          className={cn(
            'size-4 transition-colors',
            isCompleted
              ? 'text-emerald-400 dark:text-emerald-500 opacity-60'
              : 'text-slate-400 opacity-60'
          )}
        />
        {isCompleted ? (
          <span className='text-base font-semibold text-emerald-900 dark:text-emerald-100'>
            {word}
          </span>
        ) : (
          <span className='text-sm font-medium text-slate-500 dark:text-slate-400'>
            Jour {day}
          </span>
        )}
      </div>
    </div>
  );
}

interface WordSlateProps {
  onStatsChange?: (completed: number, total: number) => void;
}

const WordSlate = memo(function WordSlate({ onStatsChange }: WordSlateProps) {
  const { progress, reorderPhrase, isLoading } = useGameProgress();
  const [words, setWords] = useState<
    { word: string | null; day: number; isCompleted: boolean }[]
  >([]);
  const [totalUsableDays, setTotalUsableDays] = useState<number>(25);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reload words when loading completes, phrase order changes, or progress changes
  useEffect(() => {
    if (!isLoading) {
      // Compute directly instead of using getAllDays to avoid dependency issues
      const allDays: {
        word: string | null;
        day: number;
        isCompleted: boolean;
      }[] = [];

      // Add only days that have a word (do not list empty days)
      for (let day = 1; day <= 25; day++) {
        const word = progress.completedDays[day]?.word || null;
        if (word) {
          allDays.push({
            word,
            day,
            isCompleted: true,
          });
        }
      }

      // Reorder following the phrase order (completed days only)
      const reorderedDays: {
        word: string | null;
        day: number;
        isCompleted: boolean;
      }[] = [];

      // First the days in the phrase order
      progress.phraseOrder.forEach(day => {
        const dayData = allDays.find(d => d.day === day);
        if (dayData) {
          reorderedDays.push(dayData);
        }
      });

      // Then remaining completed days in chronological order
      for (let day = 1; day <= 25; day++) {
        if (!progress.phraseOrder.includes(day)) {
          const dayData = allDays.find(d => d.day === day);
          if (dayData) {
            reorderedDays.push(dayData);
          }
        }
      }

      const finalDays = reorderedDays;
      setWords(finalDays);
    }
  }, [isLoading, progress]);

  const handleDragOver = useCallback(
    (event: {
      active: { id: string | number };
      over: { id: string | number } | null;
    }) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setWords(items => {
          const oldIndex = items.findIndex(
            item => `day-${item.day}` === active.id
          );
          const newIndex = items.findIndex(
            item => `day-${item.day}` === over.id
          );
          const newItems = arrayMove(items, oldIndex, newIndex);

          return newItems;
        });
      }
    },
    []
  );

  const handleDragEnd = useCallback(
    (event: {
      active: { id: string | number };
      over: { id: string | number } | null;
    }) => {
      const { over } = event;

      // Always save the current order when drag ends (even if same position)
      // This fixes the issue with horizontalListSortingStrategy and flex-wrap
      if (over) {
        const allDays = words.map(item => item.day);
        reorderPhrase(allDays);
      }
    },
    [reorderPhrase, words]
  );

  // Calculate total usable days (weekdays from 1-25 that are not disabled and have a word)
  useEffect(() => {
    const calculateTotalUsableDays = async () => {
      try {
        const response = await fetch('/api/calendar');
        if (response.ok) {
          const data = await response.json();
          // Count days that are:
          // 1. Weekdays (Mon-Fri)
          // 2. Not disabled
          // 3. Have a word defined (hasEnvWord)
          let count = 0;
          for (let day = 1; day <= 25; day++) {
            const game = data.games?.[day];
            if (game) {
              // Check if it's a weekday
              const year = new Date().getFullYear();
              const dow = new Date(year, 11, day).getDay(); // 0 Sun, 6 Sat
              const isWeekday = dow !== 0 && dow !== 6;

              // Must be weekday, not disabled, and have a word
              if (isWeekday && !game.disabledLabel && game.hasEnvWord) {
                count++;
              }
            }
          }
          setTotalUsableDays(count);
        }
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
        // Fallback: count weekdays in December 1-25
        const year = new Date().getFullYear();
        let count = 0;
        for (let day = 1; day <= 25; day++) {
          const dow = new Date(year, 11, day).getDay();
          if (dow !== 0 && dow !== 6) count++;
        }
        setTotalUsableDays(count);
      }
    };
    calculateTotalUsableDays();
  }, []);

  // Notify parent of stats changes
  useEffect(() => {
    if (!onStatsChange) return;
    const completedCount = words.filter(w => w.isCompleted).length;
    onStatsChange(completedCount, totalUsableDays);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words.length, totalUsableDays]);

  return (
    <div className='space-y-6'>
      {/* Phrase display */}
      <div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={words.map(w => `day-${w.day}`)}
            strategy={horizontalListSortingStrategy}
          >
            <div className='min-h-[140px] bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm p-8 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-center gap-3 transition-colors duration-300 hover:border-emerald-300 dark:hover:border-emerald-700'>
              {words.length > 0 ? (
                words.map(item => (
                  <WordItem
                    key={`day-${item.day}`}
                    word={item.word}
                    day={item.day}
                    isCompleted={item.isCompleted}
                  />
                ))
              ) : (
                <div className='flex flex-col items-center justify-center gap-3 py-8 text-center'>
                  <div className='flex items-center justify-center size-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700'>
                    <Sparkles className='size-8 text-slate-400 dark:text-slate-500' />
                  </div>
                  <div>
                    <p className='text-base font-medium text-slate-600 dark:text-slate-400 mb-1'>
                      Aucun mot débloqué
                    </p>
                    <p className='text-sm text-slate-500 dark:text-slate-500'>
                      Complétez les jeux du calendrier pour débloquer des mots !
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
});

export default WordSlate;
