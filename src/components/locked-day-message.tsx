'use client';

import { Clock, LockKeyhole, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface LockedDayMessageProps {
  daysRemaining: number;
  day: number;
}

export default function LockedDayMessage({
  daysRemaining,
  day,
}: LockedDayMessageProps) {
  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900'>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='text-center max-w-md mx-auto px-6'
      >
        {/* Icon with animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className='mb-6 flex justify-center'
        >
          <div className='relative'>
            <motion.div
              animate={{
                rotate: [0, 10, -10, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: 'easeInOut',
              }}
              className='absolute inset-0 bg-emerald-200/30 dark:bg-emerald-800/30 rounded-full blur-2xl'
            />
            <div className='relative bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 p-6 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-800'>
              <LockKeyhole className='size-16 text-emerald-600 dark:text-emerald-400' />
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className='text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3'
        >
          Jour {day} verrouillé
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='text-lg text-slate-600 dark:text-slate-300 mb-6'
        >
          Ce jour n&apos;est pas encore déverrouillé !
        </motion.p>

        {/* Days remaining card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6'
        >
          <div className='flex items-center justify-center gap-3 mb-2'>
            <Clock className='size-5 text-emerald-600 dark:text-emerald-400' />
            <span className='text-sm font-medium text-slate-500 dark:text-slate-400'>
              Revenez dans
            </span>
          </div>
          <motion.div
            key={daysRemaining}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className='text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-1'
          >
            {daysRemaining}
          </motion.div>
          <p className='text-sm text-slate-500 dark:text-slate-400'>
            jour{daysRemaining > 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Calendar icon hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className='flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400'
        >
          <Calendar className='size-4' />
          <span>Le calendrier se déverrouille jour après jour</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
