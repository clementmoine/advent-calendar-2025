'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { ClipboardList, ArrowLeft, Sparkles, Coins } from 'lucide-react';
import { useArdoise } from '@/contexts/ardoise-context';
import { usePiggyBank } from '@/contexts/piggy-bank-context';
import ArdoiseDrawer from '@/components/ardoise-drawer';
import PiggyBank from '@/components/piggy-bank';
import { useEffect, useState } from 'react';

interface CommonLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonHref?: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  className?: string;
}

export default function CommonLayout({
  children,
  showBackButton = false,
  backButtonText = 'Retour',
  backButtonHref = '/',
  title,
  subtitle,
  showHeader = true,
  className = '',
}: CommonLayoutProps) {
  const router = useRouter();
  const { openArdoise, closeArdoise, isArdoiseOpen } = useArdoise();
  const { coins } = usePiggyBank();
  const [isPiggyBankOpen, setIsPiggyBankOpen] = useState(false);

  const handleBack = () => {
    if (backButtonHref) {
      router.push(backButtonHref);
    } else {
      router.back();
    }
  };

  // Open piggy bank when receiving global event (mounted only)
  useEffect(() => {
    const handler: EventListener = () => setIsPiggyBankOpen(true);
    if (typeof window !== 'undefined') {
      window.addEventListener('open-piggy-bank', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('open-piggy-bank', handler);
      }
    };
  }, []);

  return (
    <div
      className={`min-h-screen bg-gradient-primary flex flex-col ${className}`}
    >
      {/* Header */}
      {showHeader && (
        <header className='sticky top-0 z-50 glass'>
          <div className='w-full px-4 py-4'>
            <div className='flex items-center justify-between'>
              {/* Left side - Back button or logo */}
              <div className='flex items-center gap-4'>
                {showBackButton && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleBack}
                    className='flex items-center gap-2'
                  >
                    <ArrowLeft className='size-4' />
                    <span>{backButtonText}</span>
                  </Button>
                )}

                {!showBackButton && (
                  <button
                    onClick={() => router.push('/')}
                    className='flex items-center gap-2 hover:opacity-80 transition-opacity duration-200'
                  >
                    <Sparkles className='size-6 text-emerald-600 dark:text-emerald-400' />
                    <span className='text-xl font-bold text-slate-900 dark:text-slate-100'>
                      Calendrier de l&apos;Avent
                    </span>
                  </button>
                )}
              </div>

              {/* Center - Page title */}
              {(title || subtitle) && (
                <div className='text-center flex-1'>
                  {title && (
                    <h1 className='text-2xl font-bold text-slate-900 dark:text-slate-100'>
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className='text-sm text-slate-600 dark:text-slate-300 mt-1'>
                      {subtitle}
                    </p>
                  )}
                </div>
              )}

              {/* Right side - Navigation and theme */}
              <div className='flex items-center gap-2'>
                {/* Navigation */}
                <nav className='hidden md:flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={openArdoise}
                    className='flex items-center gap-2'
                  >
                    <ClipboardList className='size-4' />
                    <span>Ardoise</span>
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setIsPiggyBankOpen(true)}
                    className='flex items-center gap-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800'
                  >
                    <Coins className='size-4' />
                    <span>Tirelire ({coins})</span>
                  </Button>
                </nav>

                {/* Mobile navigation */}
                <div className='md:hidden flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={openArdoise}
                    title='Ardoise'
                  >
                    <ClipboardList className='size-4' />
                  </Button>

                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => setIsPiggyBankOpen(true)}
                    title={`Tirelire (${coins} pièces)`}
                    className='border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800'
                  >
                    <Coins className='size-4' />
                  </Button>
                </div>

                {/* Theme toggle */}
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main content */}
      <main className='flex-1 flex flex-col'>{children}</main>

      {/* Slate drawer */}
      <ArdoiseDrawer isOpen={isArdoiseOpen} onClose={closeArdoise} />

      {/* Piggy bank modal */}
      {isPiggyBankOpen && (
        <PiggyBank onClose={() => setIsPiggyBankOpen(false)} />
      )}
    </div>
  );
}
