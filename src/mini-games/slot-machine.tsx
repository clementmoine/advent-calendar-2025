'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Coins,
  Star,
  Bell,
  Apple,
  Grape,
  Citrus,
  CandyCane,
} from 'lucide-react';
import { usePiggyBank } from '@/contexts/piggy-bank-context';

interface SlotMachineProps {
  onWin: () => void;
  onLose: () => void;
  onClose: () => void;
}

// Symbol components with their associated icons and colors
const SYMBOL_CONFIGS = [
  { Icon: CandyCane, color: 'text-emerald-500 dark:text-emerald-400' },
  { Icon: Citrus, color: 'text-yellow-500 dark:text-yellow-400' },
  { Icon: Apple, color: 'text-red-500 dark:text-red-400' },
  { Icon: Star, color: 'text-amber-500 dark:text-amber-400' },
  { Icon: Bell, color: 'text-orange-500 dark:text-orange-400' },
  { Icon: Grape, color: 'text-purple-500 dark:text-purple-400' },
] as const;

const REEL_COUNT = 3;
const REPEAT_FACTOR = 8;
const SPIN_COST = 1;
const WIN_REWARD = 20; // must match piggy-bank reward

export default function SlotMachine({ onWin, onClose }: SlotMachineProps) {
  const { coins, spendCoins } = usePiggyBank();
  const [symbolSize, setSymbolSize] = useState(64);
  const symbolRef = useRef<HTMLDivElement | null>(null);
  const longReel = Array.from(
    { length: SYMBOL_CONFIGS.length * REPEAT_FACTOR },
    (_, i) => SYMBOL_CONFIGS[i % SYMBOL_CONFIGS.length]
  );

  // removed animTargets state (we only need local targets per spin)
  const [spinning, setSpinning] = useState(false);
  const rafRef = useRef<number | null>(null);
  const paidRef = useRef<boolean>(false);
  const finishedRef = useRef<number>(0);
  const lossStreakRef = useRef<number>(0);
  const controls0 = useAnimation();
  const controls1 = useAnimation();
  const controls2 = useAnimation();
  const controls = useMemo(
    () => [controls0, controls1, controls2],
    [controls0, controls1, controls2]
  );

  // Floating coin delta animations near balance
  const [floatDeltas, setFloatDeltas] = useState<
    { id: number; text: string; color: string }[]
  >([]);
  const nextDeltaIdRef = useRef(1);

  const showDelta = useCallback((delta: number) => {
    const id = nextDeltaIdRef.current++;
    const isGain = delta > 0;
    const text = `${isGain ? '+' : ''}${delta}`;
    const color = isGain ? '#16a34a' : '#dc2626'; // green-600 or red-600
    setFloatDeltas(d => [...d, { id, text, color }]);
    setTimeout(() => {
      setFloatDeltas(d => d.filter(x => x.id !== id));
    }, 1200);
  }, []);

  useEffect(() => {
    if (symbolRef.current) {
      const rect = symbolRef.current.getBoundingClientRect();
      setSymbolSize(Math.max(48, Math.round(rect.height)));
    }
  }, []);

  const computeTargets = useCallback(() => {
    const roundsBase = SYMBOL_CONFIGS.length * REPEAT_FACTOR * symbolSize;
    return Array.from({ length: REEL_COUNT }, (_, i) => {
      const finalIndex = Math.floor(Math.random() * SYMBOL_CONFIGS.length);
      const extraRounds = (i + 1) * 16; // spin even longer per reel
      return (
        roundsBase +
        extraRounds * SYMBOL_CONFIGS.length * symbolSize +
        finalIndex * symbolSize
      );
    });
  }, [symbolSize]);

  const spin = useCallback(() => {
    if (spinning) return;
    // Require coins to spin
    if (!spendCoins(SPIN_COST)) {
      return;
    }
    showDelta(-SPIN_COST);
    setSpinning(true);
    paidRef.current = false;
    // Hard reset any ongoing animations to avoid sluggish subsequent spins
    controls.forEach(ctrl => {
      ctrl.stop();
      // ensure visual reset before starting new animation
      ctrl.set({ y: 0 });
    });
    // Pity/bias:
    // - 20th consecutive loss attempt (streak>=19): 50% chance to force a win
    // - 30th consecutive loss attempt (streak>=29): always force a win
    const streak = lossStreakRef.current;
    const shouldForceWin =
      streak >= 29 || (streak >= 19 && Math.random() < 0.5);
    let newTargets = computeTargets();
    if (shouldForceWin) {
      const roundsBase = SYMBOL_CONFIGS.length * REPEAT_FACTOR * symbolSize;
      const finalIndex = Math.floor(Math.random() * SYMBOL_CONFIGS.length);
      newTargets = Array.from({ length: REEL_COUNT }, (_, i) => {
        const extraRounds = (i + 1) * 16;
        return (
          roundsBase +
          extraRounds * SYMBOL_CONFIGS.length * symbolSize +
          finalIndex * symbolSize
        );
      });
    }
    finishedRef.current = 0;

    const startReel = async (i: number) => {
      const ctrl = controls[i];
      const loopHeight = SYMBOL_CONFIGS.length * symbolSize;
      await ctrl.start({ y: 0, transition: { duration: 0 } });
      // linear spin to overshoot with longer path for later reels
      const loops = 3 + i; // 3,4,5
      const targetOffset = newTargets[i] % (longReel.length * symbolSize);
      const finalY = -(loops * loopHeight + targetOffset);
      const overshoot = 10;
      await ctrl.start({
        y: finalY - overshoot,
        transition: { duration: 2.6 + i * 0.8, ease: 'linear' },
      });
      // tiny rebound to settle
      await ctrl.start({
        y: finalY,
        transition: { type: 'spring', stiffness: 180, damping: 20, mass: 0.6 },
      });
      finishedRef.current += 1;
      if (finishedRef.current === REEL_COUNT) {
        const indices = newTargets.map(
          n => Math.floor(n / symbolSize) % SYMBOL_CONFIGS.length
        );
        const allEqual = indices.every(idx => idx === indices[0]);
        if (allEqual && !paidRef.current) {
          paidRef.current = true;
          showDelta(WIN_REWARD);
          onWin();
          lossStreakRef.current = 0;
        } else {
          lossStreakRef.current = Math.min(1000, lossStreakRef.current + 1);
        }
        setSpinning(false);
      }
    };

    // start all at the same moment; different durations ensure stop order 1→2→3
    startReel(0);
    startReel(1);
    startReel(2);
  }, [
    spinning,
    computeTargets,
    spendCoins,
    symbolSize,
    controls,
    longReel.length,
    onWin,
    showDelta,
  ]);

  useEffect(() => {
    const id = rafRef.current;
    return () => {
      if (id) cancelAnimationFrame(id);
    };
  }, []);

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>🎰 Machine à sous</DialogTitle>

          <DialogDescription>
            Gagnez 20 pièces en alignant 3 symboles identiques.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 items-center'>
          <div className='grid grid-cols-3 gap-3 w-full'>
            {Array.from({ length: REEL_COUNT }).map((_, col) => (
              <div
                key={col}
                className='flex-1 overflow-hidden rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 select-none'
                style={{ height: `${symbolSize}px` }}
              >
                <motion.div
                  className='flex flex-col items-center'
                  animate={controls[col]}
                  style={{
                    willChange: 'transform',
                    transform: 'translateZ(0)',
                  }}
                >
                  {longReel.map((sym, i) => {
                    const { Icon, color } = sym;
                    return (
                      <div
                        key={`${col}-${i}`}
                        ref={col === 0 && i === 0 ? symbolRef : undefined}
                        className='flex items-center justify-center'
                        style={{ height: `${symbolSize}px`, width: '100%' }}
                      >
                        <Icon className={`${color} size-8`} />
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            ))}
          </div>

          <div className='flex items-center justify-between w-full max-w-sm'>
            <div className='text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2 relative'>
              <span>Solde:</span>
              <span className='inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400'>
                <Coins className='size-4 text-amber-700 dark:text-amber-400' />{' '}
                {coins}
              </span>
              {/* Floating coin delta animations */}
              <div className='absolute left-full ml-1 pointer-events-none'>
                {floatDeltas.map(d => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    style={{ color: d.color }}
                    className='text-sm font-bold drop-shadow-sm'
                  >
                    {d.text}
                  </motion.div>
                ))}
              </div>
            </div>
            <Button
              onClick={spin}
              disabled={spinning || coins < SPIN_COST}
              className='px-4 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <span className='inline-flex items-center gap-2'>
                <Coins className='size-4' />
                Lancer ({SPIN_COST})
              </span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
