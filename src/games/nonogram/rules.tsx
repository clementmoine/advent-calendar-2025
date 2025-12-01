'use client';

import { memo } from 'react';

const NonogramRules = memo(function NonogramRules() {
  return (
    <div className='flex flex-col gap-4'>
      <div className='text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
        <h3 className='font-semibold text-blue-900 dark:text-blue-100 mb-2'>
          Comment jouer au Nonogram
        </h3>
        <p className='text-sm text-blue-800 dark:text-blue-200'>
          Remplissez la grille en suivant les nombres sur les côtés pour révéler le motif caché.
        </p>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            1
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Les <strong>nombres en haut et à gauche</strong> indiquent les groupes de cases{' '}
            <strong>consécutives remplies</strong> sur chaque ligne et chaque colonne.
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            2
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Entre deux groupes de nombres, il y a toujours <strong>au moins une case vide</strong>.{' '}
            Par exemple, l&apos;indice <strong>2 1 3</strong> signifie : 2 cases remplies, au moins une vide,
            1 remplie, au moins une vide, puis 3 remplies.
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            3
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            <strong>Remplir une case</strong> : clic gauche (ou glisser) pour la marquer comme noire/remplie.{' '}
            <strong>Marquer une case vide</strong> : clic droit ou Ctrl+Clic pour indiquer qu&apos;elle ne doit
            pas être remplie.
          </p>
        </div>

        <div className='flex items-start space-x-3'>
          <div className='w-6 h-6 shrink-0 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            4
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            La grille est <strong>terminée</strong> quand toutes les lignes et colonnes respectent exactement
            leurs indices (ni plus, ni moins de cases remplies).
          </p>
        </div>
      </div>

      <div className='bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg'>
        <h4 className='font-semibold text-amber-800 dark:text-amber-200 mb-2'>
          💡 Conseils
        </h4>
        <ul className='text-sm text-amber-700 dark:text-amber-300 space-y-1'>
          <li>• Commencez par les lignes/colonnes avec les <strong>plus grands nombres</strong>.</li>
          <li>• Quand une ligne est complète, marquez le reste des cases comme vides pour clarifier.</li>
          <li>• Croisez toujours les informations <strong>lignes ↔ colonnes</strong> pour progresser logiquement.</li>
        </ul>
      </div>
    </div>
  );
});

export default NonogramRules;
