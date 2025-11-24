'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { stateClasses } from '@/lib/state-colors';

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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={stateClasses(
        isCompleted ? 'completed' : 'default',
        'inline-block cursor-grab active:cursor-grabbing rounded-lg px-3 py-2 mx-1 my-1'
      )}
    >
      {isCompleted ? (
        <span className='text-sm font-medium text-slate-900 dark:text-slate-100'>
          {word}
        </span>
      ) : (
        <span className='text-sm font-medium text-slate-400 dark:text-slate-500'>
          Jour {day}
        </span>
      )}
    </div>
  );
}

const WordSlate = memo(function WordSlate() {
  const { progress, reorderPhrase, isLoading } = useGameProgress();
  const [words, setWords] = useState<
    { word: string | null; day: number; isCompleted: boolean }[]
  >([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reload words when loading completes, phrase order changes, or progress changes
  useEffect(() => {
    console.log('🔄 WordSlate useEffect triggered:', { isLoading, progress });
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

      console.log('📝 Calculated all days:', finalDays);
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

  const completedCount = words.filter(w => w.isCompleted).length;
  const totalDays = 25;

  return (
    <div className='space-y-6'>
      {/* Phrase display */}
      <Card className='bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border-emerald-200 dark:border-emerald-700'>
        <CardContent className='p-6'>
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
              <div className='min-h-[100px] bg-white dark:bg-slate-800 p-6 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 flex flex-wrap items-center justify-center gap-2'>
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
                  <p className='text-sm text-slate-400 dark:text-slate-500 italic'>
                    Aucun mot débloqué pour le moment. Complétez les jeux du calendrier pour débloquer des mots !
                  </p>
                )}
              </div>
            </SortableContext>
          </DndContext>
          
          <p className='text-xs text-emerald-700 dark:text-emerald-300 mt-4 text-center'>
            💡 Glissez-déposez les mots pour les réorganiser
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className='grid grid-cols-2 gap-4'>
        <Card className='bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'>
          <CardContent className='p-5 text-center'>
            <div className='text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1'>
              {completedCount}
            </div>
            <div className='text-sm text-slate-600 dark:text-slate-400'>
              Mots trouvés
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'>
          <CardContent className='p-5 text-center'>
            <div className='text-3xl font-bold text-slate-600 dark:text-slate-400 mb-1'>
              {totalDays}
            </div>
            <div className='text-sm text-slate-600 dark:text-slate-400'>
              Total des jours
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default WordSlate;
