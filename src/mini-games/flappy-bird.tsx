'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FlappyProps {
  onWin: () => void;
  onLose: () => void;
  onClose: () => void;
}

type Pipe = {
  id: number;
  x: number;
  gapTop: number;
  gapHeight: number;
  scored?: boolean;
};

type Cloud = {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  opacity: number;
};

// Full-fluid: no fixed WIDTH/HEIGHT – we derive from container size
const BIRD_X_RATIO = 0.22; // 22% from left
const BIRD_RADIUS_RATIO = 0.02; // 2% of height
const HITBOX_SHRINK = 0.75; // shrink hitbox more for forgiveness
const GAP_MARGIN = 6; // margin inside gap to avoid pixel-perfect deaths
const PIPE_MARGIN_X = 2; // horizontal tolerance on pipe edges
// gap target computed at runtime using container height
// Different gravities for ascent (air time) vs descent (fall time)
const GRAVITY_UP = 0.24; // slower upward deceleration
const GRAVITY_DOWN = 0.38; // faster fall for snappier descents
const JUMP_VELOCITY = -5.2;
const BASE_PIPE_SPEED = 1.6;
// Pipe width derived from container width
const PIPE_WIDTH_RATIO = 0.14; // 14% of width
// Gap derived from jump height + 2x ball height, clamped for playability
// Use upward gravity to estimate ascent
const ESTIMATED_ASCENT =
  Math.pow(Math.abs(JUMP_VELOCITY), 2) / (2 * GRAVITY_UP);
const GAP_EXTRA = 40; // extra leniency for accessibility
const GAP_MIN = 120;
const GAP_MAX = 260;
const PIPE_INTERVAL = 1600; // ms
// Ground metrics
const GROUND_HEIGHT_RATIO = 0.04; // 4% of height (box includes border)
const GROUND_BORDER_TOP = 2; // visual border thickness (for reference)

export default function FlappyBird({ onWin, onLose, onClose }: FlappyProps) {
  const [running, setRunning] = useState(true);
  const [dying, setDying] = useState(false);
  const [score, setScore] = useState(0);
  const [birdY, setBirdY] = useState(240);
  const [velocity, setVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);

  const rafRef = useRef<number | null>(null);
  const lastPipeTimeRef = useRef<number>(0);
  const startGraceUntilRef = useRef<number>(0);
  const lastJumpAtRef = useRef<number>(0);
  const nextPipeIdRef = useRef<number>(1);
  const nextCloudIdRef = useRef<number>(1);
  const scoredIdsRef = useRef<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(360);
  const [containerHeight, setContainerHeight] = useState(480);

  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [showHitbox, setShowHitbox] = useState(false);
  const [impact, setImpact] = useState<{ x: number; y: number } | null>(null);
  const impactRecordedRef = useRef(false);
  const rewardGivenRef = useRef(false);

  const spawnCloud = useCallback(
    (fromRight = false) => {
      const id = nextCloudIdRef.current++;
      const layer = Math.random();
      const speed = layer < 0.33 ? 0.5 : layer < 0.66 ? 0.8 : 1.1;
      const w = 30 + Math.random() * 60;
      const h = 12 + Math.random() * 18;
      const y = 20 + Math.random() * (containerHeight * 0.5);
      const opacity = 0.3 + Math.random() * 0.3;
      const x = fromRight
        ? containerWidth + Math.random() * 80
        : Math.random() * containerWidth;
      return { id, x, y, w, h, speed, opacity } as Cloud;
    },
    [containerHeight, containerWidth]
  );

  const reset = useCallback(() => {
    // Stop any pending animation frame before resetting state
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setRunning(true);
    setDying(false);
    setScore(0);
    setBirdY(containerHeight / 2);
    // Give a very small initial upward velocity to avoid instant drop
    setVelocity(-1.0);
    setPipes([]);
    lastPipeTimeRef.current = 0;
    nextPipeIdRef.current = 1; // restart numbering from 1 on reset
    scoredIdsRef.current.clear();
    // Clouds
    nextCloudIdRef.current = 1;
    setClouds(Array.from({ length: 8 }, () => spawnCloud(false)));
    startGraceUntilRef.current = performance.now() + 600; // short grace at start
    // Ensure input works right away after restart
    setTimeout(() => containerRef.current?.focus(), 0);
    impactRecordedRef.current = false;
    setImpact(null);
    rewardGivenRef.current = false;
  }, [spawnCloud, containerHeight]);

  const jump = useCallback(() => {
    // If game over and not in death fall, allow instant restart via input
    if (!running && !dying) {
      reset();
      return;
    }
    if (!running) return;
    const now = performance.now();
    // Jump cooldown to reduce hover-spam
    if (now - lastJumpAtRef.current < 140) return;
    lastJumpAtRef.current = now;
    const inGrace = now < startGraceUntilRef.current;
    // Use a softer jump during grace to avoid massive first leap
    setVelocity(inGrace ? -4.0 : JUMP_VELOCITY);
  }, [running, dying, reset]);

  // Ensure game area gets focus so keyboard works inside dialog
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // (old scaling effect removed – we now use full-fluid sizing below)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  // Ensure initial clouds exist once sizing is known
  useEffect(() => {
    if (clouds.length === 0 && containerHeight > 0 && containerWidth > 0) {
      setClouds(Array.from({ length: 8 }, () => spawnCloud(false)));
    }
  }, [clouds.length, containerHeight, containerWidth, spawnCloud]);

  // Main loop
  useEffect(() => {
    let last = performance.now();
    if (startGraceUntilRef.current === 0) {
      startGraceUntilRef.current = last + 600;
    }
    const tick = (now: number) => {
      const dt = Math.min(32, now - last); // clamp delta
      last = now;

      setBirdY(prev => {
        const inGrace = now < startGraceUntilRef.current;
        const isAscending = velocity < 0;
        const g = inGrace
          ? GRAVITY_UP * 0.4
          : isAscending
            ? GRAVITY_UP
            : // Slightly increase fall gravity with score (after a few points)
              GRAVITY_DOWN * (1 + Math.min(0.4, Math.max(0, score - 6) * 0.01));
        // integrate velocity with axis-specific gravity
        let nextV = velocity + g * (dt / 16);
        // apply slight air resistance on ascent to avoid hover abuse
        if (!inGrace && isAscending) {
          nextV *= 0.985;
        }
        // clamp terminal velocities (tighter during grace)
        if (inGrace) {
          nextV = Math.max(-3, Math.min(3, nextV));
        } else {
          nextV = Math.max(-7, Math.min(8.5, nextV));
        }
        setVelocity(nextV);
        const groundHeight = containerHeight * GROUND_HEIGHT_RATIO;
        const groundY = containerHeight - groundHeight; // outer top edge of ground
        const nextY = Math.max(0, Math.min(groundY, prev + nextV));
        return nextY;
      });

      // Collisions
      let hit = false;
      let impactPoint: { x: number; y: number } | null = null;
      const birdX = containerWidth * BIRD_X_RATIO;
      const pipeWidth = containerWidth * PIPE_WIDTH_RATIO;
      const effR = containerHeight * BIRD_RADIUS_RATIO * HITBOX_SHRINK;
      const birdTop = birdY - effR;
      const birdBottom = birdY + effR;
      pipes.forEach(p => {
        const withinX =
          birdX + effR > p.x + PIPE_MARGIN_X &&
          birdX - effR < p.x + pipeWidth - PIPE_MARGIN_X;
        const inGap =
          birdTop > p.gapTop + GAP_MARGIN &&
          birdBottom < p.gapTop + p.gapHeight - GAP_MARGIN;
        if (withinX && !inGap) {
          hit = true;
          // Compute nearest point on either top or bottom pipe rectangles
          const rx1 = p.x;
          const rx2 = p.x + pipeWidth;
          const topRect = { x1: rx1, y1: 0, x2: rx2, y2: p.gapTop };
          const bottomTop = p.gapTop + p.gapHeight;
          const groundY =
            containerHeight - containerHeight * GROUND_HEIGHT_RATIO;
          const bottomRect = { x1: rx1, y1: bottomTop, x2: rx2, y2: groundY };

          const clamp = (v: number, a: number, b: number) =>
            Math.max(a, Math.min(b, v));
          const nxTopX = clamp(birdX, topRect.x1, topRect.x2);
          const nxTopY = clamp(birdY, topRect.y1, topRect.y2);
          const nxBotX = clamp(birdX, bottomRect.x1, bottomRect.x2);
          const nxBotY = clamp(birdY, bottomRect.y1, bottomRect.y2);
          const dTop =
            (nxTopX - birdX) * (nxTopX - birdX) +
            (nxTopY - birdY) * (nxTopY - birdY);
          const dBot =
            (nxBotX - birdX) * (nxBotX - birdX) +
            (nxBotY - birdY) * (nxBotY - birdY);
          impactPoint =
            dTop <= dBot ? { x: nxTopX, y: nxTopY } : { x: nxBotX, y: nxBotY };
        }
      });
      const groundHeight = containerHeight * GROUND_HEIGHT_RATIO;
      const groundY = containerHeight - groundHeight; // outer top edge
      const touchedGround = birdBottom >= groundY + 1; // allow visual contact before death
      // Debug: log once when ground is touched
      if (touchedGround) {
        console.debug('[Flappy] touch ground', {
          birdBottom,
          groundY,
          containerHeight,
          groundHeight,
        });
      }
      if (hit || touchedGround) {
        // record last impact point for debug cross once
        if (!impactRecordedRef.current) {
          if (touchedGround && !impactPoint)
            impactPoint = { x: birdX, y: groundY };
          if (impactPoint) {
            setImpact(impactPoint);
            impactRecordedRef.current = true;
          }
        }
        if (running) {
          setRunning(false);
          setDying(true);
          // ensure falling down
          setVelocity(v => Math.max(v, 3));
        }
      }

      // Spawn and move pipes/clouds only when running (not while dying), and only if no hit this frame
      if (running && !hit && !touchedGround) {
        if (lastPipeTimeRef.current === 0) lastPipeTimeRef.current = now;
        // Ease-in: longer spawn interval for first few points
        const intervalFactor = 1 + Math.max(0, 6 - score) * 0.06; // up to +36% at score 0
        if (now - lastPipeTimeRef.current > PIPE_INTERVAL * intervalFactor) {
          lastPipeTimeRef.current = now;
          // Gap variation evolves with score: wide → mixed → narrow
          let minMul: number;
          let maxMul: number;
          if (score < 6) {
            // early: wider gaps
            minMul = 1.1; // 110% of target
            maxMul = 1.3; // 130%
          } else if (score < 15) {
            // mid: mixed widths
            minMul = 0.9; // 90%
            maxMul = 1.2; // 120%
          } else {
            // late: tighter
            minMul = 0.75; // 75%
            maxMul = 1.05; // 105%
          }
          const gapTarget =
            ESTIMATED_ASCENT +
            2 * (containerHeight * BIRD_RADIUS_RATIO) +
            GAP_EXTRA;
          const baseGap =
            gapTarget * (minMul + Math.random() * (maxMul - minMul));
          const gapHeight = Math.max(GAP_MIN, Math.min(GAP_MAX, baseGap));
          const gapTop =
            40 +
            Math.random() *
              Math.max(
                40,
                containerHeight -
                  containerHeight * GROUND_HEIGHT_RATIO -
                  gapHeight -
                  60
              );
          const newPipe: Pipe = {
            id: nextPipeIdRef.current++,
            x: containerWidth + 40,
            gapTop,
            gapHeight,
            scored: false,
          };
          setPipes(prev => [...prev, newPipe]);
        }

        // Progressive speed factor (up to +50%)
        // Start slower; no acceleration for first ~6 points
        const speedFactor = 1 + Math.min(0.5, Math.max(0, score - 6) * 0.03);

        // Move pipes and handle scoring
        setPipes(prev => {
          const moved = prev.map(p => ({
            ...p,
            x: p.x - BASE_PIPE_SPEED * speedFactor,
          }));
          const filtered = moved.filter(p => p.x + pipeWidth > -10);
          // Score when bird passes center of pipe
          filtered.forEach(p => {
            if (!p.scored && p.x + pipeWidth < birdX) {
              if (!scoredIdsRef.current.has(p.id)) {
                scoredIdsRef.current.add(p.id);
                p.scored = true;
                setScore(s => s + 1);
                // Award reward only once per game (after first pipe)
                if (!rewardGivenRef.current && scoredIdsRef.current.size >= 1) {
                  rewardGivenRef.current = true;
                  // Defer coin award to avoid setState during render of another component
                  setTimeout(() => onWin(), 0);
                }
              }
            }
          });
          return filtered;
        });

        // Move clouds parallax and wrap
        setClouds(prev => {
          const arr = prev.map(c => ({ ...c, x: c.x - c.speed * speedFactor }));
          // recycle clouds leaving screen
          for (let i = 0; i < arr.length; i++) {
            const c = arr[i];
            if (c.x + c.w < -20) {
              arr[i] = spawnCloud(true);
            }
          }
          return arr;
        });
      }

      // Continue while running or finishing death-fall
      if (running || dying) {
        if (dying && touchedGround) {
          setDying(false);
          onLose();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    running,
    dying,
    velocity,
    birdY,
    pipes,
    onLose,
    onWin,
    spawnCloud,
    containerHeight,
    containerWidth,
    score,
  ]);

  // Measure container for fluid sizing (robust live measurement)
  useEffect(() => {
    const update = () => {
      const el = containerRef.current || wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cw = rect.width || el.clientWidth || 360;
      const ch = rect.height || el.clientHeight || 480; // fractional allowed
      setContainerWidth(Math.max(0, Math.round(cw)));
      setContainerHeight(ch);
      const gh = ch * GROUND_HEIGHT_RATIO;
      const gyOuter = ch - gh;
      console.info('[Flappy] resize', {
        cw,
        ch,
        groundHeight: gh,
        groundYOuter: gyOuter,
        borderTop: GROUND_BORDER_TOP,
      });
    };

    // Initial updates (next frame + delayed) to capture late layout
    const rafId = requestAnimationFrame(update);
    const t1 = setTimeout(update, 50);
    const t2 = setTimeout(update, 150);
    const t3 = setTimeout(update, 350);

    // Observe both wrapper and inner container when available
    const roWrapper = new ResizeObserver(update);
    if (wrapperRef.current) roWrapper.observe(wrapperRef.current);
    let roInner: ResizeObserver | null = null;
    if (containerRef.current) {
      roInner = new ResizeObserver(update);
      roInner.observe(containerRef.current);
    }

    // Also listen to window resizes
    window.addEventListener('resize', update);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      roWrapper.disconnect();
      roInner?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // No target score: coins are awarded per pipe

  return (
    <Dialog open={true} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2'>
            <span>🐦</span>
            <span>Flappy Bird</span>
          </DialogTitle>
          <p className='text-slate-600 dark:text-slate-300 text-sm'>
            Gagnez 1 pièce par tuyau franchi.
          </p>
        </DialogHeader>

        <div className='flex flex-col gap-3'>
          <div ref={wrapperRef} className='w-full h-[60vh]'>
            <div
              ref={containerRef}
              className='relative overflow-hidden rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-800 shadow-lg'
              style={{ width: '100%', height: '100%' }}
              role='application'
              aria-label='Flappy Bird'
              tabIndex={0}
              onMouseDown={jump}
              onTouchStart={jump}
              onMouseUp={e => e.preventDefault()}
              onTouchEnd={e => e.preventDefault()}
              onKeyDown={e => {
                if (e.code === 'Space' || e.code === 'ArrowUp') {
                  e.preventDefault();
                  jump();
                }
                if (e.key === 'h' || e.key === 'H') {
                  setShowHitbox(v => !v);
                }
              }}
            >
              {/* Light-mode sky gradient overlay */}
              <div
                className='absolute inset-0 pointer-events-none dark:hidden'
                style={{
                  background:
                    'linear-gradient(to bottom, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 30%, rgba(0,0,0,0) 60%)',
                }}
                aria-hidden='true'
              />
              {/* Night stars (dark only) */}
              <div
                className='absolute inset-0 pointer-events-none hidden dark:block'
                style={{
                  backgroundImage:
                    'radial-gradient(2px 2px at 20% 30%, rgba(255,255,255,0.6) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 60% 20%, rgba(255,255,255,0.55) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 80% 60%, rgba(255,255,255,0.5) 50%, transparent 51%), radial-gradient(2px 2px at 35% 70%, rgba(255,255,255,0.6) 50%, transparent 51%)',
                }}
                aria-hidden='true'
              />
              {/* Ground */}
              <div
                className='absolute left-0 right-0 bg-emerald-400 dark:bg-emerald-700 border-t-2 border-emerald-500 dark:border-emerald-600 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]'
                style={{ height: containerHeight * 0.04, bottom: 0 }}
              >
                {/* subtle grass highlight */}
                <div className='pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-white/30 dark:bg-white/15' />
              </div>

              {/* Clouds (parallax) */}
              {clouds.map(c => (
                <div
                  key={`cloud-${c.id}`}
                  className='absolute z-0'
                  style={{
                    left: c.x,
                    top: c.y,
                    width: c.w,
                    height: c.h,
                    opacity: c.opacity,
                  }}
                  aria-hidden='true'
                >
                  <div className='w-full h-full rounded-full blur-[1px] bg-white/80 dark:bg-white/40 drop-shadow-[0_1px_4px_rgba(0,0,0,0.15)]' />
                </div>
              ))}

              {/* Bird */}
              <div
                className='absolute z-50'
                style={{
                  left: containerWidth * BIRD_X_RATIO,
                  top: birdY,
                  width: containerHeight * BIRD_RADIUS_RATIO * 2,
                  height: containerHeight * BIRD_RADIUS_RATIO * 2,
                  marginLeft: -containerHeight * BIRD_RADIUS_RATIO,
                  marginTop: -containerHeight * BIRD_RADIUS_RATIO,
                  transition: 'transform 0.1s ease-out',
                  transform: `rotate(${velocity > 0 ? Math.min(30, velocity * 3) : Math.max(-15, velocity * 2)}deg)`,
                }}
                aria-label='Oiseau'
              >
                <div
                  className='absolute rounded-full bg-amber-400 dark:bg-amber-500 border-2 border-amber-600 dark:border-amber-700 shadow-lg drop-shadow-md'
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>

              {/* Pipes */}
              {pipes.map((p, idx) => (
                <div
                  key={idx}
                  className='absolute top-0 z-10'
                  style={{
                    left: p.x,
                    width: containerWidth * PIPE_WIDTH_RATIO,
                  }}
                  aria-hidden='true'
                >
                  <div
                    className='relative bg-emerald-500 dark:bg-emerald-600 border-l-2 border-r-2 border-t-0 border-b-0 border-l-emerald-600 border-r-emerald-600 dark:border-l-emerald-700 dark:border-r-emerald-700 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]'
                    style={{
                      height: p.gapTop,
                      width: containerWidth * PIPE_WIDTH_RATIO,
                    }}
                  >
                    {/* Shine */}
                    <div
                      className='pointer-events-none absolute inset-y-0 left-0'
                      style={{
                        width: '35%',
                        background: 'rgba(255,255,255,0.2)',
                        mixBlendMode: 'overlay',
                      }}
                    />
                    {/* Dark edge on non-lit side */}
                    <div className='pointer-events-none absolute inset-y-0 right-0 w-[3px] bg-black/20 dark:bg-black/50' />
                    {/* Pipe number (top) */}
                    <div
                      className='absolute bottom-4 left-1/2 -translate-x-1/2 text-emerald-50 dark:text-emerald-100 text-md font-extrabold select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'
                      style={{
                        lineHeight: 1,
                        opacity: 0.95,
                      }}
                    >
                      {p.id}
                    </div>
                  </div>
                  {/* Top pipe cap */}
                  <div
                    className='absolute bg-emerald-600 dark:bg-emerald-700 border-2 border-emerald-700 dark:border-emerald-800 shadow-md'
                    style={{
                      height: 10,
                      width: containerWidth * PIPE_WIDTH_RATIO + 8,
                      left: -4,
                      top: (p.gapTop || 0) - 10,
                    }}
                  />
                  <div
                    className='relative bg-emerald-500 dark:bg-emerald-600 border-l-2 border-r-2 border-t-0 border-b-0 border-l-emerald-600 border-r-emerald-600 dark:border-l-emerald-700 dark:border-r-emerald-700 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]'
                    style={{
                      height:
                        containerHeight -
                        p.gapTop -
                        p.gapHeight -
                        containerHeight * GROUND_HEIGHT_RATIO,
                      width: containerWidth * PIPE_WIDTH_RATIO,
                      position: 'absolute',
                      top: p.gapTop + p.gapHeight,
                    }}
                  >
                    {/* Shine */}
                    <div
                      className='pointer-events-none absolute inset-y-0 left-0'
                      style={{
                        width: '35%',
                        background: 'rgba(255,255,255,0.2)',
                        mixBlendMode: 'overlay',
                      }}
                    />
                    {/* Dark edge on non-lit side */}
                    <div className='pointer-events-none absolute inset-y-0 right-0 w-[3px] bg-black/20 dark:bg-black/50' />
                    {/* Pipe number (bottom) */}
                    <div
                      className='absolute top-4 left-1/2 -translate-x-1/2 text-emerald-50 dark:text-emerald-100 text-md font-extrabold select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]'
                      style={{
                        lineHeight: 1,
                        opacity: 0.95,
                      }}
                    >
                      {p.id}
                    </div>
                  </div>
                  {/* Bottom pipe cap */}
                  <div
                    className='absolute bg-emerald-600 dark:bg-emerald-700 border-2 border-emerald-700 dark:border-emerald-800 shadow-md'
                    style={{
                      height: 10,
                      width: containerWidth * PIPE_WIDTH_RATIO + 8,
                      left: -4,
                      top: p.gapTop + p.gapHeight,
                    }}
                  />
                </div>
              ))}

              {/* Debug hitboxes */}
              {showHitbox && (
                <>
                  {/* Ground collision line */}
                  <div
                    className='absolute left-0 right-0 bg-red-500/40 pointer-events-none'
                    style={{
                      top:
                        containerHeight - containerHeight * GROUND_HEIGHT_RATIO,
                      height: 1,
                      zIndex: 60,
                    }}
                  />
                  {/* Bird hitbox */}
                  {(() => {
                    const birdX = containerWidth * BIRD_X_RATIO;
                    const effR =
                      containerHeight * BIRD_RADIUS_RATIO * HITBOX_SHRINK;
                    return (
                      <div
                        className='absolute border border-red-500/60 bg-red-500/10 rounded pointer-events-none'
                        style={{
                          left: birdX - effR,
                          top: birdY - effR,
                          width: effR * 2,
                          height: effR * 2,
                          zIndex: 60,
                        }}
                      />
                    );
                  })()}
                  {/* Pipe hitboxes */}
                  {pipes.map((p, i) => {
                    const pipeWidth = containerWidth * PIPE_WIDTH_RATIO;
                    const groundY =
                      containerHeight - containerHeight * GROUND_HEIGHT_RATIO;
                    const bottomTop = p.gapTop + p.gapHeight;
                    return (
                      <div
                        key={`hb-${i}`}
                        className='absolute inset-0 pointer-events-none'
                        style={{ zIndex: 60 }}
                      >
                        {/* top rect */}
                        <div
                          className='absolute bg-red-500/10 border border-red-500/50'
                          style={{
                            left: p.x,
                            top: 0,
                            width: pipeWidth,
                            height: p.gapTop,
                            zIndex: 60,
                          }}
                        />
                        {/* bottom rect */}
                        <div
                          className='absolute bg-red-500/10 border border-red-500/50'
                          style={{
                            left: p.x,
                            top: bottomTop,
                            width: pipeWidth,
                            height: Math.max(0, groundY - bottomTop),
                            zIndex: 60,
                          }}
                        />
                      </div>
                    );
                  })}
                </>
              )}

              {/* Impact cross for debug */}
              {showHitbox && impact && (
                <div
                  className='absolute pointer-events-none'
                  style={{ left: impact.x, top: impact.y, zIndex: 70 }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: -8,
                      top: 0,
                      width: 16,
                      height: 1,
                      background: 'rgba(239,68,68,0.7)',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: -8,
                      width: 1,
                      height: 16,
                      background: 'rgba(239,68,68,0.7)',
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
