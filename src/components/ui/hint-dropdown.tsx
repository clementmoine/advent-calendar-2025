'use client';

import { useCallback, useState } from 'react';
import { HelpCircle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { usePiggyBank } from '@/contexts/piggy-bank-context';

interface HintOption {
  id: string;
  label: string;
  cost: number;
  action: () => void;
  can?: () => boolean; // optional pre-check to allow/disable
  disabled?: boolean;
}

interface HintDropdownProps {
  options: HintOption[];
  disabled?: boolean;
}

export default function HintDropdown({ options, disabled }: HintDropdownProps) {
  const { coins, spendCoins } = usePiggyBank();
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState(0); // force re-render after use

  const handleSelect = useCallback(
    (opt: HintOption) => {
      if (opt.disabled) return;
      if (opt.can && !opt.can()) return;
      if (coins < opt.cost) return;
      if (spendCoins(opt.cost)) {
        opt.action();
        // re-evaluate availability shortly after game updates its state
        setTimeout(() => setVersion(v => v + 1), 60);
      }
    },
    [coins, spendCoins]
  );

  const sortedOptions = [...options].sort((a, b) => a.cost - b.cost);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          title={`Aides (${coins} pièces)`}
          disabled={disabled}
          className='flex items-center gap-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800'
        >
          <HelpCircle className='size-4' />
          <span>Besoin d&apos;aide</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent key={version} align='end' sideOffset={8}>
        <DropdownMenuLabel className='text-amber-700 dark:text-amber-400'>
          Aides ({coins} pièces)
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {sortedOptions.map(opt => {
          const isDisabled = opt.disabled || (opt.can ? !opt.can() : false);
          return (
            <DropdownMenuItem
              key={opt.id}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              onSelect={e => {
                e.preventDefault();
                handleSelect(opt);
              }}
            >
              <span className='flex-1'>{opt.label}</span>
              {isDisabled ? (
                <span className='text-xs italic text-slate-400'>Épuisé</span>
              ) : (
                <span className='text-xs font-semibold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1'>
                  <Coins className='h-3 w-3' /> {opt.cost}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={e => {
            e.preventDefault();
            window.dispatchEvent(new Event('open-piggy-bank'));
          }}
        >
          <Coins className='text-amber-700 dark:text-amber-400' />
          <span className='flex-1'>Gagner plus de pièces</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
