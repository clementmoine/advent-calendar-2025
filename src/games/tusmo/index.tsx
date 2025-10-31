'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Keyboard from '@/components/keyboard';
import { Card, CardContent } from '@/components/ui/card';
import { GameProps } from '@/lib/games';
import { cn } from '@/lib/utils';
import {
  validateFrenchWord,
  getT9Suggestions,
  normalizeFrenchAccents,
} from '@/lib/word-validation';

// Tusmo-specific colors
const TUSMO_COLORS = {
  correct: 'bg-emerald-500 text-white',
  present: 'bg-amber-500 rounded-full text-white',
  absent: 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600',
  default: 'bg-slate-100 dark:bg-slate-800',
  current: 'bg-emerald-500 dark:bg-emerald-700',
} as const;

const TusmoGame = memo(function TusmoGame({
  onWin,
  onLose,
  gameData,
}: GameProps) {
  // Get the target word from props and normalize it
  const targetWord = gameData?.dailyWord
    ? normalizeFrenchAccents(gameData.dailyWord)
    : '';

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [, setWon] = useState(false);
  const [keyboardState, setKeyboardState] = useState<Record<string, string>>(
    {}
  );
  const [isCurrentWordInvalid, setIsCurrentWordInvalid] = useState(false);
  const [t9Suggestions, setT9Suggestions] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const maxGuesses = 6;
  const wordLength = targetWord.length;

  const handleLetterInput = useCallback(
    (letter: string) => {
      if (currentGuess.length < wordLength) {
        // Normalize the letter before adding it
        const normalizedLetter = normalizeFrenchAccents(letter);
        const newGuess = currentGuess + normalizedLetter;
        setCurrentGuess(newGuess);

        // Check if the word is valid (even if not complete)
        if (newGuess.length === wordLength) {
          const validation = validateFrenchWord(newGuess, wordLength);
          setIsCurrentWordInvalid(!validation.isValid);
        } else {
          setIsCurrentWordInvalid(false);
        }

        setT9Suggestions([]);
      }
    },
    [currentGuess, wordLength]
  );

  const handleBackspace = useCallback(() => {
    const newGuess = currentGuess.slice(0, -1);
    setCurrentGuess(newGuess);

    // Re-check word validity after deletion
    if (newGuess.length === wordLength) {
      const validation = validateFrenchWord(newGuess, wordLength);
      setIsCurrentWordInvalid(!validation.isValid);
    } else {
      setIsCurrentWordInvalid(false);
    }

    setT9Suggestions([]);
  }, [currentGuess, wordLength]);

  // Calculate letter colors for a guess, accounting for letter frequency
  const calculateLetterColors = useCallback(
    (guess: string): string[] => {
      const colors: string[] = new Array(guess.length).fill(
        TUSMO_COLORS.absent
      );
      const targetChars = targetWord.split('');
      const guessChars = guess.split('');

      // Step 1: Mark all correct positions first
      const usedInTarget = new Set<number>();
      const usedInGuess = new Set<number>();

      for (let i = 0; i < guessChars.length; i++) {
        if (targetChars[i] === guessChars[i]) {
          colors[i] = TUSMO_COLORS.correct;
          usedInTarget.add(i);
          usedInGuess.add(i);
        }
      }

      // Step 2: Count available occurrences in target (excluding correct ones)
      const availableCounts: Record<string, number> = {};
      targetChars.forEach((char, index) => {
        if (!usedInTarget.has(index)) {
          availableCounts[char] = (availableCounts[char] || 0) + 1;
        }
      });

      // Step 3: Mark present letters (yellow) for remaining positions
      for (let i = 0; i < guessChars.length; i++) {
        if (!usedInGuess.has(i)) {
          const letter = guessChars[i];
          if (availableCounts[letter] > 0) {
            colors[i] = TUSMO_COLORS.present;
            availableCounts[letter]--;
          }
        }
      }

      return colors;
    },
    [targetWord]
  );

  const getLetterColor = useCallback(
    (letter: string, position: number, guess: string) => {
      // Use the calculated colors for the full guess
      const colors = calculateLetterColors(guess);
      return colors[position] || TUSMO_COLORS.absent;
    },
    [calculateLetterColors]
  );

  const handleSubmit = useCallback(() => {
    if (currentGuess.length !== wordLength) return;

    // Si le mot est invalide, ne pas l'envoyer
    if (isCurrentWordInvalid) return;

    const newGuesses = [...guesses, currentGuess];
    setGuesses(newGuesses);
    setAttempts(attempts + 1);

    // Update keyboard state
    const newKeyboardState = { ...keyboardState };
    const colors = calculateLetterColors(currentGuess);
    currentGuess.split('').forEach((letter, index) => {
      const color = colors[index];
      if (color === TUSMO_COLORS.correct) {
        newKeyboardState[letter] = 'correct';
      } else if (
        color === TUSMO_COLORS.present &&
        newKeyboardState[letter] !== 'correct'
      ) {
        newKeyboardState[letter] = 'present';
      } else if (color === TUSMO_COLORS.absent && !newKeyboardState[letter]) {
        newKeyboardState[letter] = 'absent';
      }
    });

    setKeyboardState(newKeyboardState);

    setCurrentGuess('');
    setIsCurrentWordInvalid(false);
    setT9Suggestions([]);

    if (currentGuess === targetWord) {
      setWon(true);
      setGameOver(true);
      onWin?.();
    } else if (newGuesses.length >= maxGuesses) {
      setGameOver(true);
      onLose?.();
    }
  }, [
    currentGuess,
    wordLength,
    isCurrentWordInvalid,
    guesses,
    attempts,
    keyboardState,
    targetWord,
    onWin,
    onLose,
    calculateLetterColors,
  ]);

  const getKeyboardKeyColor = useCallback(
    (letter: string) => {
      // Let the Keyboard component handle ENTER/DELETE (blue)
      if (letter === 'ENTREE' || letter === 'EFFACER') return '';

      const state = keyboardState[letter];
      const isPressed =
        pressedKeys.has(letter) || pressedKeys.has(letter.toLowerCase());

      switch (state) {
        case 'correct':
          return `${TUSMO_COLORS.correct} hover:opacity-80 ${isPressed ? 'opacity-80' : ''}`;
        case 'present':
          return `${TUSMO_COLORS.present} hover:opacity-80 ${isPressed ? 'opacity-80' : ''}`;
        case 'absent':
          return `${TUSMO_COLORS.absent} hover:opacity-80 ${isPressed ? 'opacity-80' : ''}`;
        default:
          return `${TUSMO_COLORS.default} hover:bg-slate-200 dark:hover:bg-slate-700 ${isPressed ? 'bg-slate-200 dark:bg-slate-700' : ''}`;
      }
    },
    [keyboardState, pressedKeys]
  );

  // Debug events management
  useEffect(() => {
    const handleDebugWin = () => {
      if (!gameOver) {
        setWon(true);
        setGameOver(true);

        onWin?.();
      }
    };

    const handleDebugGameOver = () => {
      if (!gameOver) {
        setWon(false);
        setGameOver(true);
        onLose?.();
      }
    };

    const gameElement = document.querySelector('[data-game-component]');
    if (gameElement) {
      gameElement.addEventListener('debug-win', handleDebugWin);
      gameElement.addEventListener('debug-gameover', handleDebugGameOver);

      // Hints: reveal letters
      const markKeyboard = (
        letter: string,
        state: 'correct' | 'present' | 'absent'
      ) => {
        setKeyboardState(prev => {
          const next = { ...prev } as Record<string, string>;
          const L = letter.toUpperCase();
          if (state === 'correct') next[L] = 'correct';
          else if (state === 'present') {
            if (next[L] !== 'correct') next[L] = 'present';
          } else if (state === 'absent') {
            if (!next[L]) next[L] = 'absent';
          }
          return next;
        });
      };

      // (indice "mal placée" retiré)

      const revealAbsent = () => {
        if (gameOver) return;
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const targetSet = new Set(targetWord.split(''));
        // Also avoid letters already hinted/marked on the keyboard
        const markedSet = new Set(Object.keys(keyboardState));
        const pool = alphabet
          .split('')
          .map(ch => ch as string)
          .filter(ch => !targetSet.has(ch) && !markedSet.has(ch));
        if (pool.length === 0) return;
        const absent = pool[Math.floor(Math.random() * pool.length)];
        // Only reflect on the keyboard, do not modify current guess
        markKeyboard(absent, 'absent');
        setIsCurrentWordInvalid(false);
        setT9Suggestions([]);
      };

      gameElement.addEventListener('tusmo-hint-absent', revealAbsent);

      const handleQueryAvailable = (evt: Event) => {
        const e = evt as CustomEvent<{
          type: 'absent' | 'present' | 'correct';
          available?: boolean;
        }>;
        if (!e.detail) return;
        if (e.detail.type === 'absent') {
          const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const targetSet = new Set(targetWord.split(''));
          const markedSet = new Set(Object.keys(keyboardState));
          const available = alphabet
            .split('')
            .some(ch => !targetSet.has(ch) && !markedSet.has(ch));
          e.detail.available = available;
        }
      };
      gameElement.addEventListener(
        'tusmo-query-available',
        handleQueryAvailable
      );

      return () => {
        gameElement.removeEventListener('debug-win', handleDebugWin);
        gameElement.removeEventListener('debug-gameover', handleDebugGameOver);
        gameElement.removeEventListener('tusmo-hint-absent', revealAbsent);
        gameElement.removeEventListener(
          'tusmo-query-available',
          handleQueryAvailable
        );
      };
    }
  }, [
    gameOver,
    onWin,
    onLose,
    currentGuess,
    keyboardState,
    wordLength,
    targetWord,
  ]);

  // Physical keyboard handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;

      const key = e.key.toUpperCase();

      // Add key to the pressed set
      setPressedKeys(prev => new Set(prev).add(key));

      if (key === 'ENTER') {
        handleSubmit();
      } else if (key === 'BACKSPACE') {
        handleBackspace();
      } else if (key.match(/[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ]/) && key.length === 1) {
        handleLetterInput(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();

      // Remove key from the pressed set
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    currentGuess,
    gameOver,
    handleSubmit,
    handleBackspace,
    handleLetterInput,
  ]);

  // Update T9 suggestions when currentGuess changes
  useEffect(() => {
    if (currentGuess.length > 0) {
      const newSuggestions = getT9Suggestions(currentGuess, wordLength, 3);
      setT9Suggestions(newSuggestions);
    } else {
      setT9Suggestions([]);
    }
  }, [currentGuess, wordLength]);

  const renderGuess = useCallback(
    (guess: string, index: number) => {
      const colors = calculateLetterColors(guess);
      return (
        <div key={index} className='flex gap-2 mb-2'>
          {guess.split('').map((letter, letterIndex) => (
            <div
              key={letterIndex}
              className={`w-12 h-12 flex items-center justify-center font-bold rounded text-lg ${colors[letterIndex] || TUSMO_COLORS.absent}`}
            >
              {letter}
            </div>
          ))}
        </div>
      );
    },
    [calculateLetterColors]
  );

  const renderCurrentGuess = useCallback(() => {
    // Find already discovered correct letters
    const correctLetters: Record<number, string> = {};
    guesses.forEach(guess => {
      guess.split('').forEach((letter, index) => {
        if (targetWord[index] === letter) {
          correctLetters[index] = letter;
        }
      });
    });
    // (plus de lettres fixées par hint "bien placée" – option retirée)

    return (
      <div className='flex gap-2 mb-2'>
        {Array.from({ length: wordLength }).map((_, letterIndex) => {
          const correctLetter = correctLetters[letterIndex];
          const currentLetter = currentGuess[letterIndex];

          // Si le mot est invalide et complet, toutes les lettres en rouge
          const shouldShowRed =
            isCurrentWordInvalid && currentGuess.length === wordLength;

          // Considérée correcte uniquement si validée par un essai précédent
          // ou si révélée par un indice (gérée ailleurs) – pas juste en tapant

          let classes =
            'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100';
          if (shouldShowRed) {
            classes =
              'border-red-500 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
          } else if (currentLetter) {
            // Pendant la saisie: toujours bleu pour clarté
            classes =
              'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
          } else if (correctLetter) {
            // En dehors de la saisie: montrer les lettres validées/révélées en vert
            classes =
              'border-emerald-500 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200';
          }

          return (
            <div
              key={letterIndex}
              className={`w-12 h-12 flex items-center justify-center border-2 rounded text-lg font-bold ${classes}`}
            >
              {currentLetter || correctLetter || ''}
            </div>
          );
        })}
      </div>
    );
  }, [wordLength, currentGuess, guesses, targetWord, isCurrentWordInvalid]);

  const renderEmptyRows = useCallback(() => {
    const emptyRows = [];
    const showCurrent = !gameOver && guesses.length < maxGuesses;
    const start = guesses.length + (showCurrent ? 1 : 0);
    for (let i = start; i < maxGuesses; i++) {
      emptyRows.push(
        <div key={i} className='flex gap-2 mb-2'>
          {Array.from({ length: wordLength }).map((_, letterIndex) => (
            <div
              key={letterIndex}
              className='w-12 h-12 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded'
            ></div>
          ))}
        </div>
      );
    }
    return emptyRows;
  }, [guesses.length, maxGuesses, wordLength, gameOver]);

  return (
    <div className='max-w-md mx-auto'>
      {/* Game Content */}
      <div
        className={cn(
          'flex flex-col gap-6',
          gameOver ? 'opacity-50 pointer-events-none' : ''
        )}
      >
        {/* Grille de jeu */}
        <div className='flex justify-center'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex flex-col items-center'>
                {guesses.map(renderGuess)}
                {!gameOver &&
                  guesses.length < maxGuesses &&
                  renderCurrentGuess()}
                {renderEmptyRows()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clavier virtuel */}
        <Keyboard
          variant='alpha'
          disabled={gameOver}
          pressedKeys={pressedKeys}
          suggestions={t9Suggestions}
          onSuggestionClick={s => {
            const normalized = normalizeFrenchAccents(s);
            setCurrentGuess(normalized);
            const validation = validateFrenchWord(normalized, wordLength);
            setIsCurrentWordInvalid(!validation.isValid);
            setT9Suggestions([]);
          }}
          getKeyColor={getKeyboardKeyColor}
          onEnter={handleSubmit}
          onBackspace={handleBackspace}
          onKey={key => handleLetterInput(key)}
        />
      </div>
    </div>
  );
});

export default TusmoGame;
