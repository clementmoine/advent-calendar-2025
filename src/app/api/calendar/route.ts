import { NextResponse } from 'next/server';
import {
  GAMES_CONFIG,
  getGameTypeForBusinessDay,
  getActualDifficulty,
} from '@/lib/games';

export async function GET() {
  try {
    const today = new Date();

    // In development mode, allow access even if not in December
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isDecember = today.getMonth() === 11;

    if (!isDecember && !isDevelopment) {
      return NextResponse.json({
        message: 'The advent calendar is only available in December!',
        available: false,
      });
    }

    // Build game configuration for each day (based on rotation)
    const games: Record<
      number,
      {
        id: string;
        name: string;
        description: string;
        difficulty: 'easy' | 'medium' | 'hard';
        estimatedTime: string;
        instructions: string[];
        hasEnvWord: boolean;
        disabledLabel: string | null;
      }
    > = {};

    for (let day = 1; day <= 25; day++) {
      const disabledLabel = process.env[`DAY_${day}_DISABLED`] || null;
      const gameType = getGameTypeForBusinessDay(day);
      const gameConfig = GAMES_CONFIG[gameType];

      games[day] = {
        id: `${gameType}-${day}`,
        name: gameConfig.metadata.name,
        description: gameConfig.metadata.description,
        difficulty: getActualDifficulty(gameConfig.metadata.difficulty, day),
        estimatedTime: gameConfig.metadata.estimatedTime,
        instructions: gameConfig.metadata.instructions,
        hasEnvWord: Boolean(process.env[`DAY_${day}`]),
        disabledLabel,
      };
    }

    // Business days logic: only open on weekdays (Mon-Fri)
    const getBusinessDayIndex = (date: Date) => {
      const year = date.getFullYear();
      const start = new Date(year, 11, 1); // Dec 1 (month 11)
      if (date < start) return 0;
      const d = new Date(start);
      let count = 0;
      while (d <= date) {
        const day = d.getDay();
        if (day !== 0 && day !== 6) count++; // 1..5 are weekdays
        d.setDate(d.getDate() + 1);
      }
      return count;
    };

    // In development mode, allow access to all days
    const businessDayIndex = getBusinessDayIndex(today);
    const availableDays = isDevelopment ? 25 : Math.min(businessDayIndex, 25);

    // Return calendar information
    const calendarData = {
      currentDay: isDevelopment ? 25 : businessDayIndex,
      totalDays: 25,
      availableDays,
      games: games,
      message: isDevelopment
        ? 'Cliquez sur une case pour découvrir le jeu du jour !'
        : businessDayIndex <= 25
          ? `Jour ${businessDayIndex} (jours ouvrés) sur 25`
          : 'Calendrier terminé !',
    };

    return NextResponse.json(calendarData);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error retrieving calendar data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
