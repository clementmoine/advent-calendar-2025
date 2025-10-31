'use client';

import { memo } from 'react';

const MotsMelesRules = memo(function MotsMelesRules() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
        <h3 className='font-semibold text-emerald-900 dark:text-emerald-100 mb-2'>
          Comment jouer aux Mots Mêlés
        </h3>
        <p className='text-sm text-emerald-800 dark:text-emerald-200'>
          Trouvez tous les mots dans la grille pour découvrir le mot du jour !
        </p>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            1
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Une <strong>liste de mots</strong> à trouver vous est fournie
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            2
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            <strong>Cliquez et glissez</strong> pour sélectionner un mot dans la
            grille
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            3
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Les mots peuvent être{' '}
            <strong>horizontaux, verticaux ou diagonaux</strong>
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            4
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Une fois tous les mots trouvés, les{' '}
            <span className='inline-flex mx-1 w-5 h-5 shrink-0 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 rounded items-center justify-center text-amber-900 dark:text-amber-100 text-xs font-bold'>
              A
            </span>{' '}
            <strong>lettres restantes</strong> forment le mot du jour !
          </p>
        </div>

        <div className='flex items-start space-x-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            5
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Les mots trouvés apparaissent en{' '}
            <span className='inline-flex mx-1 w-5 h-5 shrink-0 bg-emerald-500 rounded items-center justify-center text-white text-xs font-bold'>
              ✓
            </span>{' '}
            <strong>vert</strong> sur la grille et sont barrés dans la liste
          </p>
        </div>
      </div>

      <div className='bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg'>
        <h4 className='font-semibold text-amber-800 dark:text-amber-200 mb-2'>
          💡 Conseils
        </h4>
        <ul className='text-sm text-amber-700 dark:text-amber-300 space-y-1'>
          <li>
            • Cherchez d&apos;abord les mots les plus longs (plus faciles à
            repérer)
          </li>
          <li>
            • Les mots peuvent être lus en ligne et en diagonale dans les deux
            sens (gauche-droite ou droite-gauche)
          </li>
          <li>
            • Une fois tous les mots trouvés, les lettres restantes forment le
            mot du jour
          </li>
        </ul>
      </div>
    </div>
  );
});

export default MotsMelesRules;
