'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadProgress, saveProgress, GameProgress } from '@/lib/progress';

// Hook for game progress management
export function useGameProgress() {
  const [progress, setProgress] = useState<GameProgress>({
    completedDays: {},
    phraseOrder: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load progress on mount
  useEffect(() => {
    const loadedProgress = loadProgress();
    setProgress(loadedProgress);
    setIsLoading(false);
  }, []);

  // Listen to slate reset event in debug mode
  useEffect(() => {
    const handleResetArdoise = () => {
      console.log('🧹 Resetting ardoise - clearing all progress');
      const emptyProgress: GameProgress = {
        completedDays: {},
        phraseOrder: [],
      };
      setProgress(emptyProgress);
      saveProgress(emptyProgress);
    };

    window.addEventListener('debug-reset-ardoise', handleResetArdoise);
    return () => {
      window.removeEventListener('debug-reset-ardoise', handleResetArdoise);
    };
  }, []);

  // Save progress whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveProgress(progress);
    }
  }, [progress, isLoading]);

  // Mark a day as completed
  const completeDay = useCallback(
    (day: number, word: string, attempts: number) => {
      console.log('🎯 completeDay called:', { day, word, attempts });
      setProgress(prev => {
        const newProgress = { ...prev };
        newProgress.completedDays[day] = {
          word,
          completedAt: new Date().toISOString(),
          attempts,
        };

        // Add to phrase order if not already there
        if (!newProgress.phraseOrder.includes(day)) {
          newProgress.phraseOrder.push(day);
        }

        console.log('📊 New progress:', newProgress);
        return newProgress;
      });
    },
    []
  );

  // Update phrase order
  const reorderPhrase = useCallback((newOrder: number[]) => {
    setProgress(prev => ({
      ...prev,
      phraseOrder: newOrder,
    }));
  }, []);

  // Check if a day is completed
  const checkDayCompleted = useCallback(
    (day: number) => {
      return day in progress.completedDays;
    },
    [progress.completedDays]
  );

  // Get completed word for a day
  const getWord = useCallback(
    (day: number) => {
      return progress.completedDays[day]?.word || null;
    },
    [progress.completedDays]
  );

  // Get all days in current order
  const getAllDays = useCallback(() => {
    const allDays: {
      word: string | null;
      day: number;
      isCompleted: boolean;
    }[] = [];

    // Add completed days in their current order
    progress.phraseOrder.forEach(day => {
      const word = progress.completedDays[day]?.word || null;
      allDays.push({
        word,
        day,
        isCompleted: word !== null,
      });
    });

    return allDays;
  }, [progress.phraseOrder, progress.completedDays]);

  // Get completed words in phrase order
  const getCompletedWords = useCallback(() => {
    return progress.phraseOrder
      .map(day => progress.completedDays[day]?.word)
      .filter(word => word !== undefined) as string[];
  }, [progress]);

  // Reset phrase order to chronological
  const resetPhraseOrder = useCallback(() => {
    const chronologicalOrder = Object.keys(progress.completedDays)
      .map(Number)
      .sort((a, b) => a - b);

    setProgress(prev => ({
      ...prev,
      phraseOrder: chronologicalOrder,
    }));
  }, [progress.completedDays]);

  // Get completion stats
  const getStats = useCallback(() => {
    const totalDays = 25;
    const completedCount = Object.keys(progress.completedDays).length;
    const completionPercentage = Math.round((completedCount / totalDays) * 100);

    return {
      totalDays,
      completedCount,
      remainingCount: totalDays - completedCount,
      completionPercentage,
    };
  }, [progress.completedDays]);

  return {
    progress,
    isLoading,
    completeDay,
    reorderPhrase,
    checkDayCompleted,
    getWord,
    getAllDays,
    getCompletedWords,
    resetPhraseOrder,
    getStats,
  };
}

// Hook for specific game state management
export function useGameState<T>(gameId: string, initialState: T) {
  const [gameState, setGameState] = useState<T>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  // Load game state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`game-state-${gameId}`);
      if (saved) {
        setGameState(JSON.parse(saved));
      }
    } catch (error) {
      console.error(`Failed to load game state for ${gameId}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [gameId]);

  // Save game state whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(`game-state-${gameId}`, JSON.stringify(gameState));
      } catch (error) {
        console.error(`Failed to save game state for ${gameId}:`, error);
      }
    }
  }, [gameState, gameId, isLoading]);

  // Clear game state
  const clearState = useCallback(() => {
    localStorage.removeItem(`game-state-${gameId}`);
    setGameState(initialState);
  }, [gameId, initialState]);

  return {
    gameState,
    setGameState,
    isLoading,
    clearState,
  };
}

// Hook for auto-save functionality
export function useAutoSave<T>(data: T, key: string, delay: number = 1000) {
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        setIsSaving(false);
      } catch (error) {
        console.error(`Failed to auto-save ${key}:`, error);
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [data, key, delay]);

  return { isSaving };
}
