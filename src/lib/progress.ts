// Game progress management
export interface GameProgress {
  completedDays: Record<
    number,
    {
      word: string;
      completedAt: string;
      attempts: number;
    }
  >;
  phraseOrder: number[]; // Order of days for the final phrase
}

const STORAGE_KEY = 'advent-calendar-progress';

// Load progress from localStorage
export function loadProgress(): GameProgress {
  if (typeof window === 'undefined') {
    return { completedDays: {}, phraseOrder: [] };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { completedDays: {}, phraseOrder: [] };
  } catch (error) {
    console.error('Failed to load progress:', error);
    return { completedDays: {}, phraseOrder: [] };
  }
}

// Save progress to localStorage
export function saveProgress(progress: GameProgress): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}

// Mark a day as completed
export function markDayCompleted(
  day: number,
  word: string,
  attempts: number
): void {
  const progress = loadProgress();
  progress.completedDays[day] = {
    word,
    completedAt: new Date().toISOString(),
    attempts,
  };

  // Add to phrase order if not already there
  if (!progress.phraseOrder.includes(day)) {
    progress.phraseOrder.push(day);
  }

  saveProgress(progress);
}

// Update phrase order
export function updatePhraseOrder(newOrder: number[]): void {
  const progress = loadProgress();
  progress.phraseOrder = newOrder;
  saveProgress(progress);
}

// Get completed word for a day
export function getCompletedWord(day: number): string | null {
  const progress = loadProgress();
  return progress.completedDays[day]?.word || null;
}

// Check if a day is completed
export function isDayCompleted(day: number): boolean {
  const progress = loadProgress();
  return day in progress.completedDays;
}

// Get all days (completed and empty) in phrase order
export function getAllDaysInOrder(
  customPhraseOrder?: number[]
): { word: string | null; day: number; isCompleted: boolean }[] {
  const progress = loadProgress();
  const phraseOrder = customPhraseOrder || progress.phraseOrder;

  const allDays: { word: string | null; day: number; isCompleted: boolean }[] =
    [];

  // Add completed days in their current order
  phraseOrder.forEach(day => {
    const word = progress.completedDays[day]?.word || null;
    allDays.push({
      word,
      day,
      isCompleted: word !== null,
    });
  });

  // Add empty days (not yet completed) in chronological order
  for (let day = 1; day <= 25; day++) {
    if (!phraseOrder.includes(day)) {
      allDays.push({
        word: null,
        day,
        isCompleted: false,
      });
    }
  }

  return allDays;
}
