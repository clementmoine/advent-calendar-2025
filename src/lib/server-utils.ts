import { getRandomWordByLength } from './word-validation';

/**
 * Retrieve the daily word on the server (secure).
 * Priority: environment variable > random word.
 */
export async function getDailyWord(day: number): Promise<string> {
  if (day < 1 || day > 25) {
    throw new Error('Invalid day: must be between 1 and 25');
  }

  // Priority: environment variable
  const envWord = process.env[`DAY_${day}`];
  if (envWord) {
    console.log(`📝 Using env word for day ${day}: ${envWord}`);
    return envWord;
  }

  // Generate a random word with variable length (4-8 letters)
  const wordLength = 4 + (day % 5); // 4, 5, 6, 7, 8 lettres en rotation
  const randomWord = getRandomWordByLength(wordLength);

  console.log(
    `🎲 Generated random word for day ${day}: ${randomWord} (length: ${wordLength})`
  );
  return randomWord;
}

/**
 * Validate that a game was actually won (server-side stub).
 */
export async function validateGameWin(
  gameId: string,
  day: number,
  gameData: unknown
): Promise<boolean> {
  // For now, we trust the frontend
  // In a real app, we would check victory conditions on the server side
  console.log(`✅ Validating ${gameId} win for day ${day}:`, gameData);
  return true;
}
