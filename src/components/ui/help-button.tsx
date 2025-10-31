'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePiggyBank } from '@/contexts/piggy-bank-context';
import { Coins, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HelpButtonProps {
  cost: number;
  onHelp: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  variant?:
    | 'default'
    | 'outline'
    | 'secondary'
    | 'destructive'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function HelpButton({
  cost,
  onHelp,
  disabled = false,
  children,
  className = '',
  variant = 'outline',
  size = 'sm',
}: HelpButtonProps) {
  const { coins, spendCoins } = usePiggyBank();
  const [isAnimating, setIsAnimating] = useState(false);

  const canAfford = coins >= cost;
  const isDisabled = disabled || !canAfford;

  const handleClick = () => {
    if (isDisabled) return;

    const success = spendCoins(cost);
    if (success) {
      setIsAnimating(true);
      onHelp();

      // Reset animation after a short delay
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  return (
    <motion.div
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      className='relative'
    >
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        variant={variant}
        size={size}
        className={`relative overflow-hidden ${className} ${
          !canAfford ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className='absolute inset-0 flex items-center justify-center'
            >
              <Coins className='h-4 w-4 text-yellow-500' />
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={`flex items-center gap-2 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        >
          <HelpCircle className='h-4 w-4' />
          {children}
          <div className='flex items-center gap-1'>
            <Coins className='h-3 w-3 text-yellow-500' />
            <span className='text-xs font-medium'>{cost}</span>
          </div>
        </div>
      </Button>
    </motion.div>
  );
}
