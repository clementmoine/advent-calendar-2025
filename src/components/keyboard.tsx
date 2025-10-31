'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  CornerDownLeft,
  Delete,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowDownToLine,
  RotateCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type KeyboardVariant = 'alpha' | 'arrows' | 'numeric' | 'custom';

interface KeyboardProps {
  variant: KeyboardVariant;
  className?: string;
  onKey: (key: string) => void;
  onEnter?: () => void;
  onBackspace?: () => void;
  disabled?: boolean;
  pressedKeys?: Set<string>;
  getKeyColor?: (key: string) => string;
  // Optional suggestions (used by alpha variant)
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  maxSuggestions?: number;
  rows?: string[][]; // for custom variant or overrides
  aliases?: Record<string, string[]>; // additional pressed aliases
}

function getAlphaRows(): string[][] {
  return [
    ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
    ['ENTREE', 'W', 'X', 'C', 'V', 'B', 'N', 'EFFACER'],
  ];
}

function getArrowRows(): string[][] {
  return [['UP'], ['LEFT', 'DOWN', 'RIGHT']];
}

function getNumericRows(): string[][] {
  return [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['EFFACER']];
}

export default function Keyboard({
  variant,
  className,
  onKey,
  onEnter,
  onBackspace,
  disabled = false,
  pressedKeys = new Set(),
  getKeyColor,
  suggestions = [],
  onSuggestionClick,
  maxSuggestions = 3,
  rows: overrideRows,
  aliases,
}: KeyboardProps) {
  const rows =
    variant === 'custom'
      ? overrideRows || []
      : variant === 'alpha'
        ? getAlphaRows()
        : variant === 'arrows'
          ? getArrowRows()
          : getNumericRows();

  // Default alias mapping for pressed state normalization (AZERTY/QWERTY)
  const defaultAliases: Record<string, string[]> = (() => {
    if (variant === 'arrows') {
      return {
        UP: ['ArrowUp', 'z', 'Z', 'w', 'W'],
        LEFT: ['ArrowLeft', 'q', 'Q', 'a', 'A'],
        DOWN: ['ArrowDown', 's', 'S'],
        RIGHT: ['ArrowRight', 'd', 'D'],
      };
    }
    if (variant === 'numeric') {
      // FR AZERTY top-row shifted symbols mapping to digits
      return {
        '1': ['1', '&'],
        '2': ['2', 'é', 'É'],
        '3': ['3', '"'],
        '4': ['4', "'"],
        '5': ['5', '('],
        '6': ['6', '§', '-'],
        '7': ['7', 'è', 'È'],
        '8': ['8', '_'],
        '9': ['9', 'ç', 'Ç'],
      } as Record<string, string[]>;
    }
    return {};
  })();

  const mergedAliases: Record<string, string[]> = {
    ...defaultAliases,
    ...(aliases || {}),
  };

  // Normalized pressed-state checker (DRY across all variants/keys)
  const isKeyPressed = (key: string) => {
    if (disabled) return false;
    if (key === 'ENTREE') {
      return (
        pressedKeys.has('ENTER') ||
        pressedKeys.has('Enter') ||
        pressedKeys.has('Entree')
      );
    }
    if (key === 'EFFACER') {
      return (
        pressedKeys.has('BACKSPACE') ||
        pressedKeys.has('Backspace') ||
        pressedKeys.has('DELETE') ||
        pressedKeys.has('Delete')
      );
    }
    const aliasList = mergedAliases[key] || [];
    return pressedKeys.has(key) || aliasList.some(a => pressedKeys.has(a));
  };

  const handleKeyClick = (key: string) => {
    if (disabled) return;

    if (key === 'ENTREE' && onEnter) {
      onEnter();
    } else if (key === 'EFFACER' && onBackspace) {
      onBackspace();
    } else if (
      key === 'UP' ||
      key === 'DOWN' ||
      key === 'LEFT' ||
      key === 'RIGHT'
    ) {
      onKey(key);
    } else {
      onKey(key);
    }
  };

  const getDefaultKeyColor = (key: string) => {
    if (key === 'ENTREE' || key === 'EFFACER') {
      const isEnterPressed =
        pressedKeys.has('ENTER') ||
        pressedKeys.has('Enter') ||
        pressedKeys.has('Entree');
      const isDeletePressed =
        pressedKeys.has('BACKSPACE') ||
        pressedKeys.has('Backspace') ||
        pressedKeys.has('DELETE') ||
        pressedKeys.has('Delete');
      const isPressedRaw = key === 'ENTREE' ? isEnterPressed : isDeletePressed;
      const isPressed = !disabled && isPressedRaw;
      return `bg-emerald-600 text-white hover:bg-emerald-700 ${
        isPressed ? 'bg-emerald-700' : ''
      }`;
    }
    return 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700';
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {variant === 'alpha' && onSuggestionClick && (
        <div className='flex justify-center gap-2'>
          {Array.from({ length: maxSuggestions }).map((_, index) => {
            const suggestion = suggestions[index];
            const isDisabled = disabled || !suggestion;
            return (
              <button
                key={index}
                onClick={e => {
                  if (!isDisabled && suggestion) {
                    onSuggestionClick(suggestion);
                    (e.currentTarget as HTMLButtonElement).blur();
                  }
                }}
                disabled={isDisabled}
                className={`flex-1 h-12 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isDisabled
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-900/40 cursor-pointer'
                }`}
              >
                {suggestion || ''}
              </button>
            );
          })}
        </div>
      )}

      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className='flex justify-center gap-2'>
          {row.map(key => {
            const showPressed = isKeyPressed(key);
            return (
              <motion.div
                key={key}
                whileTap={{ scale: 0.95 }}
                animate={showPressed ? { scale: 0.95 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className={
                  key === 'ENTREE' || key === 'EFFACER' ? 'flex-[2]' : 'flex-1'
                }
              >
                <Button
                  onClick={() => handleKeyClick(key)}
                  disabled={disabled}
                  className={`h-12 text-sm font-semibold w-full ${
                    key === 'ENTREE' || key === 'EFFACER'
                      ? getDefaultKeyColor(key)
                      : (getKeyColor
                          ? getKeyColor(key)
                          : getDefaultKeyColor(key)) +
                        (showPressed ? ' bg-slate-200 dark:bg-slate-700' : '')
                  } border border-slate-300 dark:border-slate-600`}
                >
                  {key === 'ENTREE' ? (
                    <CornerDownLeft className='size-4' />
                  ) : key === 'EFFACER' ? (
                    <Delete className='size-4' />
                  ) : key === 'UP' ? (
                    <ArrowUp className='size-4' />
                  ) : key === 'DOWN' ? (
                    <ArrowDown className='size-4' />
                  ) : key === 'LEFT' ? (
                    <ArrowLeft className='size-4' />
                  ) : key === 'RIGHT' ? (
                    <ArrowRight className='size-4' />
                  ) : key === 'ROTATE' ? (
                    <RotateCw className='size-4' />
                  ) : key === 'DROP' ? (
                    <ArrowDownToLine className='size-4' />
                  ) : (
                    <span className='size-4 inline-flex items-center justify-center'>
                      {key}
                    </span>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
