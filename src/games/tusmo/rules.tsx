'use client';

import { memo } from 'react';

const TusmoRules = memo(function TusmoRules() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
        <h3 className='font-semibold text-emerald-900 dark:text-emerald-100 mb-2'>
          Comment jouer au Tusmo
        </h3>
        <p className='text-sm text-emerald-800 dark:text-emerald-200'>
          Trouvez le mot mystère en 6 essais maximum !
        </p>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            1
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Vous avez <strong>6 essais</strong> pour trouver le mot du jour
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            2
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Le mot doit être un <strong>mot français valide</strong>
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            3
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Une lettre{' '}
            <span className='inline-flex mx-1 w-5 h-5 shrink-0 bg-emerald-500 rounded items-center justify-center text-white text-xs font-bold'>
              A
            </span>{' '}
            <strong>verte</strong> est bien placée
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            4
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Une lettre{' '}
            <span className='inline-flex mx-1 w-5 h-5 shrink-0 bg-amber-500 rounded-full items-center justify-center text-white text-xs font-bold'>
              B
            </span>{' '}
            <strong>jaune</strong> existe mais n&apos;est pas bien placée
          </p>
        </div>

        <div className='flex items-start space-x-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            5
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Une lettre{' '}
            <span className='inline-flex mx-1 w-5 h-5 shrink-0 bg-slate-300 dark:bg-slate-600 rounded items-center justify-center text-white text-xs font-bold'>
              C
            </span>{' '}
            <strong>grise</strong> n&apos;existe pas dans le mot
          </p>
        </div>
      </div>

      <div className='bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg'>
        <h4 className='font-semibold text-amber-800 dark:text-amber-200 mb-2'>
          💡 Conseils
        </h4>
        <ul className='text-sm text-amber-700 dark:text-amber-300 space-y-1'>
          <li>• Commencez par un mot courant contenant des voyelles variées</li>
          <li>• Évitez de répéter les lettres déjà confirmées absentes</li>
          <li>
            • Utilisez les suggestions quand un mot n&apos;est pas reconnu
          </li>
        </ul>
      </div>
    </div>
  );
});

export default TusmoRules;
