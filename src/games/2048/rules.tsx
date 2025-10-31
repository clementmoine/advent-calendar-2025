import React from 'react';

const Rules = () => {
  return (
    <div className='flex flex-col gap-4'>
      <div className='text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
        <h3 className='font-semibold text-emerald-900 dark:text-emerald-100 mb-2'>
          Comment jouer au 2048
        </h3>
        <p className='text-sm text-emerald-800 dark:text-emerald-200'>
          Fusionnez les tuiles identiques pour atteindre l&apos;objectif !
        </p>
      </div>

      <div className='flex flex-col gap-3'>
        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            1
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Utilisez les <strong>flèches</strong> ou <strong>ZQSD/WASD</strong>{' '}
            pour déplacer les tuiles
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            2
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Les tuiles <strong>identiques</strong> se fusionnent quand elles se
            touchent
          </p>
        </div>

        <div className='flex items-start gap-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            3
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            Une nouvelle tuile <strong>2</strong> ou <strong>4</strong> apparaît
            à chaque mouvement
          </p>
        </div>

        <div className='flex items-start space-x-3'>
          <div className='w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-full flex items-center justify-center text-sm font-bold'>
            4
          </div>
          <p className='text-sm text-slate-700 dark:text-slate-300'>
            <strong>Objectif</strong> : Atteindre la tuile cible (64, 256, ou
            1024 selon la difficulté)
          </p>
        </div>
      </div>

      <div className='bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg'>
        <h4 className='font-semibold text-amber-800 dark:text-amber-200 mb-2'>
          💡 Conseils
        </h4>
        <ul className='text-sm text-amber-700 dark:text-amber-300 space-y-1'>
          <li>• Gardez la tuile la plus haute dans un coin</li>
          <li>• Ne mélangez pas les directions</li>
          <li>• Planifiez vos mouvements à l&apos;avance</li>
        </ul>
      </div>
    </div>
  );
};

export default Rules;
