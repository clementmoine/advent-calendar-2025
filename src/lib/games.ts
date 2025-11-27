import React from 'react';
import {
  GAMES_CONFIG as GENERATED_GAMES_CONFIG,
  DISCOVERED_GAMES,
} from './games-config.generated';

// Common interface for all games
export interface GameProps {
  onWin?: () => void;
  onLose?: () => void;
  onExit?: () => void;
  onReset?: () => void;
  gameData?: {
    day: number;
    unlocked: boolean;
    gameType: string;
    gameMetadata: GameMetadata;
    dailyWord?: string;
  };
}

// Interface for game metadata
export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'dynamic';
  estimatedTime: string;
  instructions: string[];
  args?: string;
}

// Type for game components
export type GameComponent = React.ComponentType<GameProps>;

// Use the auto-generated configuration at build time
export const GAMES_CONFIG = GENERATED_GAMES_CONFIG;
export const KNOWN_GAMES = DISCOVERED_GAMES;
export type KnownGameId = (typeof DISCOVERED_GAMES)[number];

// Utility to compute difficulty based on the day number
export const getDifficultyFromDay = (
  day: number
): 'easy' | 'medium' | 'hard' => {
  if (day <= 8) return 'easy'; // Days 1-8 : Easy
  if (day <= 16) return 'medium'; // Days 9-16: Medium difficulty
  return 'hard'; // Days 17-25 : Hard
};

/**
 * Determines the game type for a given day number.
 * Same logic everywhere for consistency.
 */
export const getGameTypeFromDay = (day: number): string => {
  const gameTypes = Object.keys(GAMES_CONFIG);
  return gameTypes[(day - 1) % gameTypes.length];
};

/**
 * Counts how many times the 2048 game appears up to and including the given day.
 * Returns the difficulty for 2048 based on its occurrence order:
 * - 1st occurrence: easy
 * - 2nd occurrence: medium
 * - 3rd occurrence: hard
 * - Then cycles back: 4th = easy, 5th = medium, etc.
 */
export const get2048DifficultyFromDay = (
  day: number
): 'easy' | 'medium' | 'hard' => {
  const year = new Date().getFullYear();
  let occurrenceCount = 0;
  
  for (let d = 1; d <= day; d++) {
    const dow = new Date(year, 11, d).getDay(); // 0 Sun, 6 Sat
    const isWeekday = dow !== 0 && dow !== 6;
    if (isWeekday && !isDayDisabled(d)) {
      const rotationIndex = getRotationIndexForDay(d);
      const gameType = getGameTypeFromDay(rotationIndex);
      if (gameType === '2048') {
        occurrenceCount++;
      }
    }
  }
  
  // Map occurrence to difficulty: 1st = easy, 2nd = medium, 3rd = hard, then cycles
  const difficultyIndex = ((occurrenceCount - 1) % 3);
  if (difficultyIndex === 0) return 'easy';
  if (difficultyIndex === 1) return 'medium';
  return 'hard';
};

/**
 * Computes the effective difficulty for a game (handles 'dynamic').
 * For 2048, uses a special function that assigns easy/medium/hard based on occurrence order.
 */
export const getActualDifficulty = (
  gameDifficulty: 'easy' | 'medium' | 'hard' | 'dynamic',
  day: number,
  gameType?: string
): 'easy' | 'medium' | 'hard' => {
  // Special handling for 2048: use occurrence-based difficulty
  if (gameType === '2048' && gameDifficulty === 'dynamic') {
    return get2048DifficultyFromDay(day);
  }
  
  if (gameDifficulty === 'dynamic') {
    return getDifficultyFromDay(day);
  }
  return gameDifficulty;
};

/**
 * Returns the number of business days (Mon-Fri) from Dec 1 to the provided date (inclusive).
 */
export const getBusinessDayIndex = (date: Date): number => {
  const year = date.getFullYear();
  const start = new Date(year, 11, 1); // December is month 11
  if (date < start) return 0;
  const d = new Date(start);
  let count = 0;
  while (d <= date) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

/**
 * Env driven helper to know if a day is disabled.
 */
export const isDayDisabled = (day: number): boolean => {
  return Boolean(process.env[`DAY_${day}_DISABLED`] || null);
};

/**
 * Counts non-disabled days up to and including `day` to derive rotation index.
 * Example: if day 2 is disabled, then day 3 maps to index 2.
 */
export const getRotationIndexForDay = (day: number): number => {
  const year = new Date().getFullYear();
  let rotation = 0;
  for (let d = 1; d <= day; d++) {
    const dow = new Date(year, 11, d).getDay(); // 0 Sun, 6 Sat
    const isWeekday = dow !== 0 && dow !== 6;
    if (isWeekday && !isDayDisabled(d)) rotation++;
  }
  return rotation;
};

/**
 * Derives the game type for a given business day number, skipping disabled days.
 */
export const getGameTypeForBusinessDay = (day: number): string => {
  const rotationIndex = getRotationIndexForDay(day);
  return getGameTypeFromDay(rotationIndex);
};

/**
 * Counts the total number of usable days (weekdays that are not disabled) from 1 to 25.
 */
export const getTotalUsableDays = (): number => {
  const year = new Date().getFullYear();
  let count = 0;
  for (let d = 1; d <= 25; d++) {
    const dow = new Date(year, 11, d).getDay(); // 0 Sun, 6 Sat
    const isWeekday = dow !== 0 && dow !== 6;
    if (isWeekday && !isDayDisabled(d)) count++;
  }
  return count;
};
