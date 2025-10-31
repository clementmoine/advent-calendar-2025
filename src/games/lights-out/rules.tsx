'use client';

import { memo } from 'react';

const LightsOutRules = memo(function LightsOutRules() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
        <h3 className='font-semibold text-emerald-900 dark:text-emerald-100 mb-2'>
          Comment jouer à Lights Out
        </h3>
        <p className='text-sm text-emerald-800 dark:text-emerald-200'>
          Éteignez toutes les lumières en un minimum de coups.
        </p>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            1
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Cliquez sur une case pour basculer sa lumière et celles de ses
            voisines
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            2
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            L’objectif est d’éteindre toutes les lumières
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            3
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            La taille de la grille varie selon le jour (plus grand = plus
            difficile)
          </p>
        </div>
      </div>
    </div>
  );
});

export default LightsOutRules;
