'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameProps, getActualDifficulty } from '@/lib/games';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  normalizeFrenchAccents,
  getRandomWordByLengthSeeded,
} from '@/lib/word-validation';

type Direction = 'horizontal' | 'vertical' | 'diagonal-up' | 'diagonal-down';
type Position = { row: number; col: number };
type WordPlacement = {
  word: string;
  positions: Position[];
  direction: Direction;
  found: boolean;
};

// Configuration based on difficulty
const DIFFICULTY_CONFIG = {
  easy: {
    gridSize: 8,
    minWordLength: 4,
    maxWordLength: 6,
    targetWordCount: 6,
    allowDirections: ['horizontal', 'vertical'] as Direction[],
  },
  medium: {
    gridSize: 10,
    minWordLength: 4,
    maxWordLength: 7,
    targetWordCount: 10,
    allowDirections: ['horizontal', 'vertical', 'diagonal-down'] as Direction[],
  },
  hard: {
    gridSize: 12,
    minWordLength: 5,
    maxWordLength: 9,
    targetWordCount: 15,
    allowDirections: [
      'horizontal',
      'vertical',
      'diagonal-up',
      'diagonal-down',
    ] as Direction[],
  },
};

const MotsMeles = ({ onWin, gameData }: GameProps) => {
  const day = gameData?.day || 1;
  const gameDifficulty = gameData?.gameMetadata?.difficulty || 'medium';
  const actualDifficulty = getActualDifficulty(gameDifficulty, day);
  const config = DIFFICULTY_CONFIG[actualDifficulty];
  const GRID_SIZE = config.gridSize;

  const dailyWordRaw = gameData?.dailyWord || 'NOEL';
  const dailyWord = normalizeFrenchAccents(dailyWordRaw);

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [lastSelected, setLastSelected] = useState<Position | null>(null);
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [gameWon, setGameWon] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  // Generate the grid while reserving the daily word letters
  const { grid, wordPlacements, wordsToFind, reservedKeys } = useMemo(() => {
    // Deterministic RNG based on day + word + difficulty
    const seedString = `${day}-${dailyWord}-${actualDifficulty}-${GRID_SIZE}`;
    const xfnv1a = (str: string) => {
      let h = 2166136261 >>> 0;
      for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
      }
      return h >>> 0;
    };
    const mulberry32 = (a: number) => {
      return () => {
        let t = (a += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    const rng = mulberry32(xfnv1a(seedString));
    const grid: string[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(''));

    const wordPlacements: WordPlacement[] = [];

    // Select random positions for the daily word letters
    const total = GRID_SIZE * GRID_SIZE;
    const indices = Array.from({ length: total }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const reservedPositions: Position[] = [];
    for (let i = 0; i < Math.min(dailyWord.length, indices.length); i++) {
      const idx = indices[i];
      const r = Math.floor(idx / GRID_SIZE);
      const c = idx % GRID_SIZE;
      reservedPositions.push({ row: r, col: c });
    }
    const reservedKeySet = new Set(
      reservedPositions.map(p => `${p.row}-${p.col}`)
    );

    // Place the daily word letters (arbitrary order)
    reservedPositions.forEach((pos, i) => {
      grid[pos.row][pos.col] = dailyWord[i] || dailyWord[dailyWord.length - 1];
    });

    // Get a dictionary word for a given length
    // Completely ignore hyphenated words (not placeable in a letter grid)
    const getRandomWord = (len: number): string | null => {
      if (len < config.minWordLength || len > config.maxWordLength) return null;

      // Try multiple times to find a word without a hyphen
      let attempts = 0;
      const maxAttempts = 50;

      while (attempts < maxAttempts) {
        const word = getRandomWordByLengthSeeded(len, rng);
        if (word && !word.includes('-')) {
          return word;
        }
        attempts++;
      }

      // If not found, search among all words of the correct length
      const allWordsOfLength = Array.from(
        new Set(
          Array.from({ length: 100 }, () =>
            getRandomWordByLengthSeeded(len, rng)
          ).filter(w => w && !w.includes('-'))
        )
      );

      if (allWordsOfLength.length > 0) {
        return allWordsOfLength[Math.floor(rng() * allWordsOfLength.length)];
      }

      return null;
    };

    // Check whether a word can be placed at a given position
    const canPlaceWord = (
      word: string,
      row: number,
      col: number,
      direction: Direction
    ): Position[] | null => {
      const positions: Position[] = [];
      let currentRow = row;
      let currentCol = col;

      for (let i = 0; i < word.length; i++) {
        // Check grid boundaries
        if (
          currentRow < 0 ||
          currentRow >= GRID_SIZE ||
          currentCol < 0 ||
          currentCol >= GRID_SIZE
        ) {
          return null;
        }

        const key = `${currentRow}-${currentCol}`;
        const existingLetter = grid[currentRow][currentCol];

        // If this is a reserved letter, we cannot place a word that crosses it
        if (reservedKeySet.has(key)) {
          return null;
        }

        // If the cell already contains a different letter, we cannot place the word
        if (existingLetter && existingLetter !== word[i]) {
          return null;
        }

        positions.push({ row: currentRow, col: currentCol });

        // Move forward according to direction
        switch (direction) {
          case 'horizontal':
            currentCol++;
            break;
          case 'vertical':
            currentRow++;
            break;
          case 'diagonal-down':
            currentRow++;
            currentCol++;
            break;
          case 'diagonal-up':
            currentRow--;
            currentCol++;
            break;
        }
      }

      return positions;
    };

    // Place a word in reverse (right-to-left, bottom-to-top)
    const canPlaceWordReverse = (
      word: string,
      row: number,
      col: number,
      direction: Direction
    ): Position[] | null => {
      // For reverse, start at the "end" position and move to the beginning
      let startRow = row;
      let startCol = col;

      // Adjust the starting position according to the reverse direction
      switch (direction) {
        case 'horizontal':
          startCol = col - word.length + 1; // Start from the right
          break;
        case 'vertical':
          startRow = row - word.length + 1; // Start from the bottom
          break;
        case 'diagonal-down':
          startRow = row - word.length + 1;
          startCol = col - word.length + 1;
          break;
        case 'diagonal-up':
          startRow = row + word.length - 1;
          startCol = col - word.length + 1;
          break;
      }

      // Check if it can be placed (reuse normal function but inverted)
      const positions: Position[] = [];
      let currentRow = startRow;
      let currentCol = startCol;

      for (let i = 0; i < word.length; i++) {
        if (
          currentRow < 0 ||
          currentRow >= GRID_SIZE ||
          currentCol < 0 ||
          currentCol >= GRID_SIZE
        ) {
          return null;
        }

        const key = `${currentRow}-${currentCol}`;
        if (reservedKeySet.has(key)) {
          return null;
        }

        const existingLetter = grid[currentRow][currentCol];
        if (existingLetter && existingLetter !== word[word.length - 1 - i]) {
          return null;
        }

        positions.push({ row: currentRow, col: currentCol });

        // Move according to direction (towards beginning = reverse)
        switch (direction) {
          case 'horizontal':
            currentCol++;
            break;
          case 'vertical':
            currentRow++;
            break;
          case 'diagonal-down':
            currentRow++;
            currentCol++;
            break;
          case 'diagonal-up':
            currentRow--;
            currentCol++;
            break;
        }
      }

      return positions;
    };

    // Place words into the grid, allowing intersections
    const wordsToPlace: string[] = [];
    const usedWords = new Set<string>();
    let hasDiagonalPlaced = false;
    let hasReversePlaced = false;
    let forcedIntersectionsCount = 0;
    const targetForcedIntersections = actualDifficulty === 'hard' ? 2 : 0; // Force 2 crossings on hard

    // Generate a list of words to place
    // Filter out hyphenated words (not placeable in a letter grid)
    while (wordsToPlace.length < config.targetWordCount) {
      const wordLen =
        config.minWordLength +
        Math.floor(rng() * (config.maxWordLength - config.minWordLength + 1));
      const word = getRandomWord(wordLen);
      // Ensure there are no hyphens (already filtered in getRandomWord; double-check)
      if (
        word &&
        !word.includes('-') &&
        !usedWords.has(word) &&
        word.length >= config.minWordLength &&
        word.length <= config.maxWordLength
      ) {
        usedWords.add(word);
        wordsToPlace.push(word);
      }
    }

    // Try to place each word
    for (const word of wordsToPlace) {
      let placed = false;
      const maxAttempts = 200;

      // For medium, force at least one diagonal and one reversed word
      const isMedium = actualDifficulty === 'medium';
      const isHard = actualDifficulty === 'hard';
      const needsDiagonal = isMedium && !hasDiagonalPlaced;
      const needsReverse = isMedium && !hasReversePlaced;
      const needsIntersection =
        isHard && forcedIntersectionsCount < targetForcedIntersections;

      // Prepare candidate directions
      const diagonals = config.allowDirections.filter(
        d => d === 'diagonal-down' || d === 'diagonal-up'
      );
      const nonDiagonals = config.allowDirections.filter(
        d => d !== 'diagonal-down' && d !== 'diagonal-up'
      );
      const fyShuffle = <T,>(arr: T[]) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };
      const shuffledDiagonals = fyShuffle(diagonals);
      const shuffledNonDiagonals = fyShuffle(nonDiagonals);

      let shuffledDirections: Direction[];
      if (needsDiagonal && shuffledDiagonals.length > 0) {
        shuffledDirections = [...shuffledDiagonals, ...shuffledNonDiagonals];
      } else {
        shuffledDirections = [...shuffledNonDiagonals, ...shuffledDiagonals];
      }

      // Find all previously placed letters to encourage intersections
      const existingLetters: {
        row: number;
        col: number;
        letter: string;
      }[] = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (grid[r][c] && !reservedKeySet.has(`${r}-${c}`)) {
            existingLetters.push({ row: r, col: c, letter: grid[r][c] });
          }
        }
      }

      // Find a position that crosses an existing word
      const findIntersectingPosition = (word: string) => {
        for (const { row, col, letter } of existingLetters) {
          // Check if this letter matches a letter in the candidate word
          for (let i = 0; i < word.length; i++) {
            if (word[i] === letter) {
              // Try placing the word so that this position maps to index i
              const directions = shuffledDirections;
              for (const direction of directions) {
                let startRow = row;
                let startCol = col;

                // Compute the start position so the word passes (row, col) at index i
                switch (direction) {
                  case 'horizontal':
                    startCol = col - i;
                    break;
                  case 'vertical':
                    startRow = row - i;
                    break;
                  case 'diagonal-down':
                    startRow = row - i;
                    startCol = col - i;
                    break;
                  case 'diagonal-up':
                    startRow = row + i;
                    startCol = col - i;
                    break;
                }

                const positions = canPlaceWord(
                  word,
                  startRow,
                  startCol,
                  direction
                );
                if (positions) {
                  return { positions, direction, isReverse: false };
                }
              }

              // Also try reversed placement
              for (const direction of [
                'horizontal',
                'vertical',
              ] as Direction[]) {
                if (!config.allowDirections.includes(direction)) continue;
                if (word[word.length - 1 - i] === letter) {
                  let startRow = row;
                  let startCol = col;

                  switch (direction) {
                    case 'horizontal':
                      startCol = col - (word.length - 1 - i);
                      break;
                    case 'vertical':
                      startRow = row - (word.length - 1 - i);
                      break;
                  }

                  const positions = canPlaceWordReverse(
                    word,
                    startRow,
                    startCol,
                    direction
                  );
                  if (positions) {
                    return { positions, direction, isReverse: true };
                  }
                }
              }
            }
          }
        }
        return null;
      };

      for (let attempt = 0; attempt < maxAttempts && !placed; attempt++) {
        // If a reversed word is needed, try horizontal/vertical reversed first
        if (needsReverse) {
          for (const direction of ['horizontal', 'vertical'] as Direction[]) {
            if (!config.allowDirections.includes(direction)) continue;

            const startRow = Math.floor(rng() * GRID_SIZE);
            const startCol = Math.floor(rng() * GRID_SIZE);

            const positions = canPlaceWordReverse(
              word,
              startRow,
              startCol,
              direction
            );
            if (positions) {
              // Place the word (reversed in the grid)
              positions.forEach((pos, i) => {
                grid[pos.row][pos.col] = word[word.length - 1 - i];
              });

              wordPlacements.push({
                word,
                positions,
                direction,
                found: false,
              });

              hasReversePlaced = true;
              placed = true;
              break;
            }
          }
          if (placed) break;
        }

        // Prefer finding an intersection with an existing word first
        // - Hard: force intersections early
        // - Otherwise: attempt without forcing (30% of tries)
        const shouldTryIntersection =
          needsIntersection ||
          (attempt < maxAttempts * 0.3 && existingLetters.length > 0);

        if (shouldTryIntersection) {
          const intersection = findIntersectingPosition(word);
          if (intersection) {
            // Ensure it is truly an intersection (at least one shared cell)
            const hasIntersection = intersection.positions.some(pos =>
              existingLetters.some(
                el => el.row === pos.row && el.col === pos.col
              )
            );

            if (hasIntersection || needsIntersection) {
              if (intersection.isReverse) {
                intersection.positions.forEach((pos, i) => {
                  grid[pos.row][pos.col] = word[word.length - 1 - i];
                });
              } else {
                intersection.positions.forEach((pos, i) => {
                  grid[pos.row][pos.col] = word[i];
                });
              }

              wordPlacements.push({
                word,
                positions: intersection.positions,
                direction: intersection.direction,
                found: false,
              });

              if (
                intersection.direction === 'diagonal-down' ||
                intersection.direction === 'diagonal-up'
              ) {
                hasDiagonalPlaced = true;
              }

              if (hasIntersection) {
                forcedIntersectionsCount++;
              }

              placed = true;
              break;
            }
          }
        }

        // Try each direction normally (random positions)
        for (const direction of shuffledDirections) {
          const startRow = Math.floor(rng() * GRID_SIZE);
          const startCol = Math.floor(rng() * GRID_SIZE);

          const positions = canPlaceWord(word, startRow, startCol, direction);
          if (positions) {
            // Place the word
            positions.forEach((pos, i) => {
              grid[pos.row][pos.col] = word[i];
            });

            wordPlacements.push({
              word,
              positions,
              direction,
              found: false,
            });

            if (direction === 'diagonal-down' || direction === 'diagonal-up') {
              hasDiagonalPlaced = true;
            }
            placed = true;
            break;
          }
        }
      }
    }

    // Fill remaining cells with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const key = `${r}-${c}`;
        if (!grid[r][c] && !reservedKeySet.has(key)) {
          grid[r][c] = letters[Math.floor(rng() * letters.length)];
        }
      }
    }

    return {
      grid,
      wordPlacements,
      wordsToFind: wordPlacements.map(wp => wp.word),
      reservedKeys: reservedKeySet,
    };
  }, [day, dailyWord, config, GRID_SIZE, actualDifficulty]);

  // Get a position key
  const getPositionKey = (pos: Position): string => `${pos.row}-${pos.col}`;

  // Parse a position key
  const getPositionFromKey = (key: string): Position => {
    const [row, col] = key.split('-').map(Number);
    return { row, col };
  };

  // Check whether a selection corresponds to a placed word
  const checkSelection = useCallback(
    (cells: Set<string>) => {
      if (cells.size === 0) return;

      const positions = Array.from(cells).map(getPositionFromKey);
      if (positions.length === 0) return;

      // Sort positions to verify in both directions
      const sortedPositions = [...positions].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });

      // Check each placed word
      for (const placement of wordPlacements) {
        if (foundWords.has(placement.word)) continue; // Already found

        // Check whether positions match (in both directions)
        const matches = (positions1: Position[], positions2: Position[]) => {
          if (positions1.length !== positions2.length) return false;

          // Check forward direction
          let matchesForward = true;
          for (let i = 0; i < positions1.length; i++) {
            const p1 = positions1[i];
            const p2 = positions2[i];
            if (p1.row !== p2.row || p1.col !== p2.col) {
              matchesForward = false;
              break;
            }
          }

          // Check reverse direction
          let matchesBackward = true;
          const reversed = [...positions2].reverse();
          for (let i = 0; i < positions1.length; i++) {
            const p1 = positions1[i];
            const p2 = reversed[i];
            if (p1.row !== p2.row || p1.col !== p2.col) {
              matchesBackward = false;
              break;
            }
          }

          return matchesForward || matchesBackward;
        };

        if (matches(sortedPositions, placement.positions)) {
          setFoundWords(prev => new Set(prev).add(placement.word));
          setSelectedCells(new Set());
          return;
        }
      }
    },
    [wordPlacements, foundWords]
  );

  // Handle initial click
  const handleCellMouseDown = (row: number, col: number) => {
    setIsSelecting(true);
    const key = getPositionKey({ row, col });
    setSelectedCells(new Set([key]));
    setLastSelected({ row, col });
  };

  // Handle hover during selection
  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || !lastSelected) return;

    const newSelection = new Set<string>();
    const start = lastSelected;
    const end = { row, col };

    // Determine selection direction
    const rowDiff = Math.abs(end.row - start.row);
    const colDiff = Math.abs(end.col - start.col);

    let validDirection = false;
    if (rowDiff === 0 && colDiff > 0) {
      // Horizontal
      validDirection = true;
      const minCol = Math.min(start.col, end.col);
      const maxCol = Math.max(start.col, end.col);
      for (let c = minCol; c <= maxCol; c++) {
        newSelection.add(getPositionKey({ row: start.row, col: c }));
      }
    } else if (colDiff === 0 && rowDiff > 0) {
      // Vertical
      validDirection = true;
      const minRow = Math.min(start.row, end.row);
      const maxRow = Math.max(start.row, end.row);
      for (let r = minRow; r <= maxRow; r++) {
        newSelection.add(getPositionKey({ row: r, col: start.col }));
      }
    } else if (rowDiff === colDiff && rowDiff > 0) {
      // Diagonal
      validDirection = true;
      const rowStep = end.row > start.row ? 1 : -1;
      const colStep = end.col > start.col ? 1 : -1;
      let currentRow = start.row;
      let currentCol = start.col;
      while (
        Math.abs(currentRow - end.row) >= 0 &&
        Math.abs(currentCol - end.col) >= 0
      ) {
        newSelection.add(getPositionKey({ row: currentRow, col: currentCol }));
        if (currentRow === end.row && currentCol === end.col) break;
        currentRow += rowStep;
        currentCol += colStep;
      }
    }

    if (validDirection) {
      setSelectedCells(newSelection);
    }
  };

  // Handle selection end
  const handleCellMouseUp = () => {
    if (isSelecting && selectedCells.size > 0) {
      checkSelection(selectedCells);
    }
    setIsSelecting(false);
    setLastSelected(null);
  };

  // Global mouse handling
  useEffect(() => {
    const handleMouseUp = () => {
      if (isSelecting && selectedCells.size > 0) {
        checkSelection(selectedCells);
      }
      setIsSelecting(false);
      setLastSelected(null);
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isSelecting, selectedCells, checkSelection]);

  // Check for win condition
  useEffect(() => {
    if (
      foundWords.size === wordsToFind.length &&
      wordsToFind.length > 0 &&
      !gameWon
    ) {
      setGameWon(true);
      // Highlight daily-word letters, then call onWin after a short delay
      setTimeout(() => {
        onWin?.();
      }, 2000); // 2 seconds to show the highlighted daily-word letters
    }
  }, [foundWords.size, wordsToFind.length, onWin, gameWon]);

  // Check if a cell belongs to a found word
  const isInFoundWord = (row: number, col: number): boolean => {
    for (const placement of wordPlacements) {
      if (foundWords.has(placement.word)) {
        if (
          placement.positions.some(pos => pos.row === row && pos.col === col)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const isSelected = (row: number, col: number): boolean => {
    return selectedCells.has(getPositionKey({ row, col }));
  };

  const isReservedCell = (row: number, col: number): boolean => {
    return reservedKeys.has(`${row}-${col}`);
  };

  return (
    <div className='flex max-w-4xl mx-auto flex-row gap-4 items-center justify-center'>
      {/* Game grid */}
      <div className='flex flex-col gap-2'>
        {wordsToFind.map(word => {
          const isFound = foundWords.has(word);
          return (
            <motion.div
              key={word}
              initial={{ opacity: 1 }}
              animate={{
                opacity: isFound ? 0.5 : 1,
                scale: isFound ? 0.95 : 1,
              }}
              transition={{ duration: 0.3 }}
              className={`px-3 py-1 rounded-md font-medium text-sm ${
                isFound
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 line-through'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
              }`}
            >
              {word}
            </motion.div>
          );
        })}
      </div>
      <Card>
        <CardContent className='p-3'>
          <div
            ref={gridRef}
            className='select-none flex justify-center'
            onMouseUp={handleCellMouseUp}
            onMouseLeave={handleCellMouseUp}
          >
            <div
              className='grid gap-0.5'
              style={{
                gridTemplateColumns: `repeat(${GRID_SIZE}, 2.5rem)`,
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const cellKey = getPositionKey({
                    row: rowIndex,
                    col: colIndex,
                  });
                  const cellIsSelected = isSelected(rowIndex, colIndex);
                  const cellIsFound = isInFoundWord(rowIndex, colIndex);
                  const cellIsReserved = isReservedCell(rowIndex, colIndex);
                  // Highlight daily-word letters only after victory
                  const shouldHighlightReserved = gameWon && cellIsReserved;

                  return (
                    <motion.div
                      key={cellKey}
                      className={`
                        w-10 h-10 flex items-center justify-center 
                        font-bold text-xs cursor-pointer rounded
                        transition-all duration-300
                        ${
                          shouldHighlightReserved
                            ? 'bg-amber-400 dark:bg-amber-500 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500 dark:ring-amber-400 shadow-lg'
                            : cellIsFound
                              ? 'bg-emerald-500 text-white'
                              : cellIsSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100'
                        }
                      `}
                      animate={
                        shouldHighlightReserved
                          ? { boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)' }
                          : {}
                      }
                      transition={{ duration: 0.3 }}
                      onMouseDown={e => {
                        e.preventDefault();
                        handleCellMouseDown(rowIndex, colIndex);
                      }}
                      onMouseEnter={() =>
                        handleCellMouseEnter(rowIndex, colIndex)
                      }
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {letter}
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MotsMeles;
