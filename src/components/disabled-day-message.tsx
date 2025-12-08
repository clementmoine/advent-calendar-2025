'use client';

import { LockKeyhole, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DisabledDayMessageProps {
  day: number;
  disabledLabel: string;
}

export default function DisabledDayMessage({
  day,
  disabledLabel,
}: DisabledDayMessageProps) {
  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900'>
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
              className='absolute inset-0 bg-slate-200/30 dark:bg-slate-800/30 rounded-full blur-2xl'
            />
            <div className='relative bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-700/50 p-6 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700'>
              <LockKeyhole className='size-16 text-slate-600 dark:text-slate-400' />
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
          Jour {day} indisponible
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className='text-lg text-slate-600 dark:text-slate-300 mb-6'
        >
          Ce jour est désactivé
        </motion.p>

        {/* Disabled label card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className='bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-200 dark:border-slate-700 mb-6'
        >
          <div className='flex items-center justify-center gap-3 mb-2'>
            <XCircle className='size-5 text-slate-500 dark:text-slate-400' />
            <span className='text-sm font-medium text-slate-500 dark:text-slate-400'>
              Raison
            </span>
          </div>
          <motion.div
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className='text-xl font-semibold text-slate-700 dark:text-slate-300 mb-1'
          >
            {disabledLabel}
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
