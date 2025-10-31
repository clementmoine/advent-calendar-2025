import { cn } from '@/lib/utils';
import { type ClassValue } from 'clsx';

/**
 * Standardized color system for UI states
 * Used across games, keyboard, words, etc.
 */

export type StateType =
  | 'completed'
  | 'active'
  | 'disabled'
  | 'default'
  | 'current'
  | 'selected'
  | 'unlocked'
  | 'locked';

export interface StateColors {
  background: string;
  backgroundHover: string;
  border: string;
  text: string;
  textSecondary?: string;
}

export const STATE_COLORS: Record<StateType, StateColors> = {
  // Completion states
  completed: {
    background: 'bg-emerald-100 dark:bg-emerald-900/30',
    backgroundHover: 'hover:bg-emerald-200 dark:hover:bg-emerald-900/40',
    border: 'border-emerald-300 dark:border-emerald-600',
    text: 'text-slate-900 dark:text-slate-100',
  },

  // Active/selected states
  active: {
    background: 'bg-emerald-100 dark:bg-emerald-900/30',
    backgroundHover: 'hover:bg-emerald-200 dark:hover:bg-emerald-900/40',
    border: 'border-emerald-300 dark:border-emerald-600',
    text: 'text-slate-900 dark:text-slate-100',
  },

  selected: {
    background: 'bg-emerald-500 dark:bg-emerald-700',
    backgroundHover: 'hover:bg-emerald-600 dark:hover:bg-emerald-600',
    border: 'border-emerald-500 dark:border-emerald-500',
    text: 'text-white dark:text-slate-100',
  },

  current: {
    background: 'bg-emerald-500 dark:bg-emerald-700',
    backgroundHover: 'hover:bg-emerald-600 dark:hover:bg-emerald-600',
    border: 'border-emerald-500 dark:border-emerald-500',
    text: 'text-white dark:text-slate-100',
  },

  // Availability states
  unlocked: {
    background: 'bg-emerald-50 dark:bg-emerald-900/20',
    backgroundHover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
    border: 'border-emerald-200 dark:border-emerald-700',
    text: 'text-slate-900 dark:text-slate-100',
  },

  locked: {
    background: 'bg-slate-50 dark:bg-slate-800',
    backgroundHover: '',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-400 dark:text-slate-500',
  },

  // Default/disabled states
  disabled: {
    background: 'bg-slate-100 dark:bg-slate-700',
    backgroundHover: 'hover:bg-slate-200 dark:hover:bg-slate-600',
    border: 'border-slate-300 dark:border-slate-600',
    text: 'text-slate-400 dark:text-slate-500',
  },

  default: {
    background: 'bg-slate-100 dark:bg-slate-800',
    backgroundHover: 'hover:bg-slate-200 dark:hover:bg-slate-700',
    border: 'border-slate-300 dark:border-slate-600',
    text: 'text-slate-900 dark:text-slate-100',
  },
};

/**
 * Get CSS classes for a state with cn
 */
export function getStateClasses(
  state: StateType,
  includeHover: boolean = true,
  ...additionalClasses: ClassValue[]
): string {
  const colors = STATE_COLORS[state];
  const classes: ClassValue[] = [colors.background, colors.border, colors.text];

  if (includeHover && colors.backgroundHover) {
    classes.push(colors.backgroundHover);
  }

  if (additionalClasses.length > 0) {
    classes.push(...additionalClasses);
  }

  return cn(...classes);
}

/**
 * Get CSS classes for a state with customization options
 */
export function getStateClassesWithOptions(
  state: StateType,
  options: {
    includeHover?: boolean;
    includeBorder?: boolean;
    includeText?: boolean;
    customClasses?: ClassValue | ClassValue[];
  } = {},
  ...additionalClasses: ClassValue[]
): string {
  const {
    includeHover = true,
    includeBorder = true,
    includeText = true,
    customClasses = [],
  } = options;

  const colors = STATE_COLORS[state];
  const classes: ClassValue[] = [colors.background];

  if (includeHover && colors.backgroundHover) {
    classes.push(colors.backgroundHover);
  }

  if (includeBorder) {
    classes.push(colors.border);
  }

  if (includeText) {
    classes.push(colors.text);
  }

  if (customClasses) {
    classes.push(customClasses);
  }

  if (additionalClasses.length > 0) {
    classes.push(...additionalClasses);
  }

  return cn(...classes);
}

/**
 * Get background color for a state (without hover)
 */
export function getStateBackground(state: StateType): string {
  return STATE_COLORS[state].background;
}

/**
 * Get text color for a state
 */
export function getStateText(state: StateType): string {
  return STATE_COLORS[state].text;
}

/**
 * Get border color for a state
 */
export function getStateBorder(state: StateType): string {
  return STATE_COLORS[state].border;
}

/**
 * Get CSS classes for a state with custom classes (simplified helper)
 */
export function stateClasses(
  state: StateType,
  ...classes: ClassValue[]
): string {
  return getStateClasses(state, true, ...classes);
}
