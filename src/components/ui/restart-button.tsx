'use client';

import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface RestartButtonProps {
  onRestart: () => void;
  variant?: 'icon-only' | 'with-label';
  disabled?: boolean;
  className?: string;
  title?: string;
}

export default function RestartButton({
  onRestart,
  variant = 'icon-only',
  disabled = false,
  className = '',
  title = 'Recommencer',
}: RestartButtonProps) {
  return (
    <Button
      onClick={onRestart}
      disabled={disabled}
      variant='outline'
      size={variant === 'icon-only' ? 'icon' : 'default'}
      className={className}
      title={title}
    >
      <RotateCcw
        className={variant === 'icon-only' ? 'size-4' : 'size-4 mr-2'}
      />
      {variant === 'with-label' && 'Recommencer'}
    </Button>
  );
}
