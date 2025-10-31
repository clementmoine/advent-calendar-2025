/**
 * Generic validation of French words
 * Used by all word-based games
 */

import snapshot from '@/lib/dictionary.snapshot.json';
type DictionarySnapshot = { all: string[]; byLength: Record<string, string[]> };

// Runtime uses prebuilt snapshot; no NSFW filtering at runtime

export interface WordValidation {
  isValid: boolean;
  message?: string;
}

// Normalize accents for all dictionary words
export function normalizeFrenchAccents(word: string): string {
  return word
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toUpperCase();
}

let FRENCH_WORDS_SET: Set<string> = new Set<string>();
let WORDS_BY_LENGTH: Map<number, string[]> = new Map();
let ALL_WORDS_SORTED: string[] = [];

function ensureBuilt(): void {
  if (ALL_WORDS_SORTED.length) return;
  const data = snapshot as unknown as DictionarySnapshot;
  ALL_WORDS_SORTED = Array.isArray(data.all) ? data.all : [];
  FRENCH_WORDS_SET = new Set(ALL_WORDS_SORTED);
  const byLengthObj: Record<string, string[]> = data.byLength || {};
  WORDS_BY_LENGTH = new Map(
    Object.entries(byLengthObj).map(([k, v]) => [Number(k), v])
  );
}

// Quick presence check in the dictionary (after normalization)
export function isFrenchWord(word: string): boolean {
  ensureBuilt();
  const normalized = normalizeFrenchAccents(word);
  return FRENCH_WORDS_SET.has(normalized);
}

export function validateFrenchWord(
  word: string,
  targetLength?: number
): WordValidation {
  const normalizedWord = normalizeFrenchAccents(word);

  // Check length
  if (targetLength && normalizedWord.length !== targetLength) {
    return {
      isValid: false,
      message: `Le mot doit contenir exactement ${targetLength} lettres`,
    };
  }

  // Check if word exists in our dictionary
  if (!FRENCH_WORDS_SET.has(normalizedWord)) {
    return {
      isValid: false,
      message: "Ce mot n'existe pas dans notre dictionnaire",
    };
  }

  return { isValid: true };
}

// Levenshtein distance between two words
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

export function getWordSuggestions(
  word: string,
  targetLength: number
): string[] {
  ensureBuilt();
  const normalizedWord = normalizeFrenchAccents(word);

  // Find all words of the target length
  const wordsOfLength = WORDS_BY_LENGTH.get(targetLength) || [];

  // Compute Levenshtein distance for each candidate
  const wordsWithDistance = wordsOfLength.map(candidate => ({
    word: candidate,
    distance: levenshteinDistance(normalizedWord, candidate),
  }));

  // Sort by distance (closest first) and return the top 5
  return wordsWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map(item => item.word);
}

export function getRandomValidWord(): string {
  ensureBuilt();
  return ALL_WORDS_SORTED[Math.floor(Math.random() * ALL_WORDS_SORTED.length)];
}

export function getRandomWordByLength(length: number): string {
  ensureBuilt();
  const wordsOfLength = WORDS_BY_LENGTH.get(length) || [];

  if (wordsOfLength.length === 0) {
    console.warn(
      `No words found for length ${length}, falling back to any word`
    );
    return getRandomValidWord();
  }

  return wordsOfLength[Math.floor(Math.random() * wordsOfLength.length)];
}

// Deterministic version with an injected RNG
export function getRandomWordByLengthSeeded(
  length: number,
  rng: () => number
): string {
  ensureBuilt();
  const wordsOfLength = WORDS_BY_LENGTH.get(length) || [];

  if (wordsOfLength.length === 0) {
    // Deterministic fallback to any word
    return ALL_WORDS_SORTED[Math.floor(rng() * ALL_WORDS_SORTED.length)];
  }

  return wordsOfLength[Math.floor(rng() * wordsOfLength.length)];
}

// T9 suggestions - words starting with typed letters
export function getT9Suggestions(
  currentWord: string,
  targetLength: number,
  maxSuggestions: number = 5
): string[] {
  ensureBuilt();
  const normalizedWord = normalizeFrenchAccents(currentWord);

  if (normalizedWord.length === 0) {
    return [];
  }

  // Find all words of target length that start with the typed letters
  const bucket = WORDS_BY_LENGTH.get(targetLength) || [];
  const matchingWords = bucket.filter(word => word.startsWith(normalizedWord));

  // If typed word is exactly a valid word, do not propose it
  const filteredWords = matchingWords.filter(word => word !== normalizedWord);

  // If we have exact prefix matches, return them
  if (filteredWords.length > 0) {
    return filteredWords.slice(0, maxSuggestions);
  }

  // Otherwise, use Levenshtein for closest words (exclude exact word)
  const allWordsOfLength = bucket.filter(word => word !== normalizedWord);

  const wordsWithDistance = allWordsOfLength.map(candidate => ({
    word: candidate,
    distance: levenshteinDistance(normalizedWord, candidate),
  }));

  return wordsWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxSuggestions)
    .map(item => item.word);
}
