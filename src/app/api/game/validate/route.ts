import { NextRequest, NextResponse } from 'next/server';
import { validateGameWin } from '@/lib/server-utils';

export async function POST(request: NextRequest) {
  try {
    const { gameId, day, gameData } = await request.json();

    if (!gameId || !day || !gameData) {
      return NextResponse.json(
        { error: 'Missing required fields: gameId, day, gameData' },
        { status: 400 }
      );
    }

    if (day < 1 || day > 25) {
      return NextResponse.json(
        { error: 'Invalid day: must be between 1 and 25' },
        { status: 400 }
      );
    }

    // Validate on the server that the game was truly won
    const isValidWin = await validateGameWin(gameId, day, gameData);

    if (!isValidWin) {
      return NextResponse.json(
        { success: false, error: 'Invalid game win' },
        { status: 400 }
      );
    }

    // If validation passes, we could unlock the word
    // (In a real app, this would use a database)
    console.log(`✅ Game ${gameId} validated for day ${day}`);

    return NextResponse.json({
      success: true,
      message: 'Game win validated successfully',
    });
  } catch (error) {
    console.error('Error validating game win:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
