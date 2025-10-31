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

  const getLetterColor = useCallback(
    (letter: string, position: number) => {
      if (targetWord[position] === letter) {
        return TUSMO_COLORS.correct;
      } else if (targetWord.includes(letter)) {
        return TUSMO_COLORS.present;
      } else {
        return TUSMO_COLORS.absent;
      }
    },
    [targetWord]
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
    currentGuess.split('').forEach((letter, index) => {
      const color = getLetterColor(letter, index);
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
    getLetterColor,
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

      return () => {
        gameElement.removeEventListener('debug-win', handleDebugWin);
        gameElement.removeEventListener('debug-gameover', handleDebugGameOver);
      };
    }
  }, [gameOver, onWin, onLose]);

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
      return (
        <div key={index} className='flex gap-2 mb-2'>
          {guess.split('').map((letter, letterIndex) => (
            <div
              key={letterIndex}
              className={`w-12 h-12 flex items-center justify-center font-bold rounded text-lg ${getLetterColor(
                letter,
                letterIndex
              )}`}
            >
              {letter}
            </div>
          ))}
        </div>
      );
    },
    [getLetterColor]
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

    return (
      <div className='flex gap-2 mb-2'>
        {Array.from({ length: wordLength }).map((_, letterIndex) => {
          const correctLetter = correctLetters[letterIndex];
          const currentLetter = currentGuess[letterIndex];

          // Si le mot est invalide et complet, toutes les lettres en rouge
          const shouldShowRed =
            isCurrentWordInvalid && currentGuess.length === wordLength;

          return (
            <div
              key={letterIndex}
              className={`w-12 h-12 flex items-center justify-center border-2 rounded text-lg font-bold ${
                shouldShowRed
                  ? 'border-red-500 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  : currentLetter
                    ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                    : correctLetter
                      ? 'border-emerald-500 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
              }`}
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
