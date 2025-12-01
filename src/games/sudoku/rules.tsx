'use client';

import { memo } from 'react';

const SudokuRules = memo(function SudokuRules() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
        <h3 className='font-semibold text-blue-900 dark:text-blue-100 mb-2'>
          Comment jouer au Sudoku
        </h3>
        <p className='text-sm text-blue-800 dark:text-blue-200'>
          Remplissez la grille 9×9 en respectant les règles !
        </p>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            1
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Remplissez la grille <strong>9×9</strong> avec des chiffres de 1 à 9
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            2
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Chaque <strong>ligne</strong> doit contenir tous les chiffres de 1 à
            9
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            3
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Chaque <strong>colonne</strong> doit contenir tous les chiffres de 1
            à 9
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            4
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Chaque <strong>sous-grille 3×3</strong> doit contenir tous les
            chiffres de 1 à 9
          </p>
        </div>

        <div className='flex items-start space-x-3'>
          <div className='w-6 h-6 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            5
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            <strong>Aucune répétition</strong> n&apos;est autorisée dans les
            lignes, colonnes ou sous-grilles
          </p>
        </div>
      </div>

      <div className='bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg'>
        <h4 className='font-semibold text-amber-800 dark:text-amber-200 mb-2'>
          💡 Conseils
        </h4>
        <ul className='text-sm text-amber-700 dark:text-amber-300 space-y-1'>
          <li>• Commencez par les cases évidentes avec peu de possibilités</li>
          <li>• Utilisez des annotations pour suivre vos hypothèses</li>
          <li>• Vérifiez régulièrement lignes, colonnes et sous-grilles</li>
        </ul>
      </div>
    </div>
  );
});

export default SudokuRules;
