import { NextRequest, NextResponse } from 'next/server';
import {
  GAMES_CONFIG,
  getBusinessDayIndex,
  getGameTypeForBusinessDay,
} from '@/lib/games';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ day: string }> }
) {
  try {
    const { day: dayParam } = await params;
    const day = parseInt(dayParam);

    if (day < 1 || day > 25) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 });
    }

    const today = new Date();

    // In development mode, allow access even if not in December
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Check if the day is unlocked
    const businessDayIndex = getBusinessDayIndex(today);
    // In production, block access to future days (even in December)
    if (!isDevelopment && day > businessDayIndex) {
      const daysRemaining = day - businessDayIndex;
      return NextResponse.json(
        {
          error: 'This day is not yet unlocked!',
          unlocked: false,
          daysRemaining,
          message: `Revenez dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}`,
        },
        { status: 403 }
      );
    }

    // Disabled day support and rotation skipping
    const disabledLabel = process.env[`DAY_${day}_DISABLED`] || null;
    if (disabledLabel) {
      return NextResponse.json(
        { error: 'Day disabled', unlocked: false, disabledLabel },
        { status: 403 }
      );
    }

    // Determine the game type for this day, skipping disabled days in rotation
    const gameType = getGameTypeForBusinessDay(day);
    
    // If "all", return special indicator
    if (gameType === 'all') {
      return NextResponse.json({
        day,
        unlocked: true,
        gameType: 'all',
        requiresSelection: true,
      });
    }
    
    const gameConfig = GAMES_CONFIG[gameType];

    const gameData = {
      day,
      unlocked: true,
      gameType,
      gameMetadata: gameConfig.metadata,
    };

    return NextResponse.json(gameData);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error retrieving game data',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
