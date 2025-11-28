'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const INTRO_MODAL_KEY = 'avent2025-intro-modal-shown';

export default function IntroModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Vérifier si la modale a déjà été affichée
    const hasSeenIntro = localStorage.getItem(INTRO_MODAL_KEY);
    if (!hasSeenIntro) {
      setIsOpen(true);
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    // Si la modale est fermée (même via overlay), marquer comme vue dans localStorage
    if (!open) {
      localStorage.setItem(INTRO_MODAL_KEY, 'true');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Marquer comme vue dans localStorage
    localStorage.setItem(INTRO_MODAL_KEY, 'true');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold text-center'>
            Bienvenue dans l&apos;Atelier du Père Agile
          </DialogTitle>
        </DialogHeader>
        <DialogDescription asChild>
          <div className='space-y-4 text-base text-slate-700 dark:text-slate-300 leading-relaxed'>
            <p>
              <strong>Hoooooow ... hoooooooow ... ho !?</strong> L&apos;atelier
              du <strong>Père Agile</strong> semble agité. Tous les lutins
              entourent le Père Agile, visiblement préoccupé et perdu dans ses
              pensées : <strong>il a oublié un mot</strong>. Un mot pas vraiment
              crucial… tout le monde essaie de lui dire que ce n'est pas bien
              grave mais ... il est têtu, et tant qu&apos;il ne l&apos;aura pas
              retrouvé, impossible de le faire retourner au travail. Résultat :{' '}
              <strong>Noël est en pause</strong>, certains diraient même…{' '}
              <strong>en DANGER</strong>.
            </p>
            <p>
              Les lutins vous supplient donc de leur venir en aide. Ils vous
              conduisent devant une <strong>machine gigantesque</strong> ornée
              d&apos;un sticker &quot;ChatGPT&quot; soigneusement barré,
              remplacé à la hâte par{' '}
              <strong>&quot;Machine à Remémorer&quot;</strong>.
            </p>

            <div className='flex justify-center rounded-xl overflow-hidden'>
              <Image
                src='/machine.png'
                alt='Machine à remémorer'
                width={800}
                height={600}
                className='object-contain w-full h-auto'
                priority
                unoptimized
              />
            </div>

            <p>
              Vous tentez votre chance en tapant sur l'écran de la machine :{' '}
              <strong>
                &quot;Quel mot le Père Agile a-t-il oublié ?&quot;
              </strong>
              , mais la machine refuse de répondre... en tout cas pas de la
              façon dont vous l'attendiez. À la place, elle vous propose{' '}
              <strong>un cadeau par jour jusqu&apos;au 17 décembre</strong>,
              chacun renfermant un jeu qui, une fois terminé, vous donnera un{' '}
              <strong>indice</strong> pour aider le <strong>Père Agile</strong>{' '}
              à retrouver son fichu mot.
            </p>
            <p>
              Aussi étrange (et stupide) que cela puisse sembler,{' '}
              <strong>vous acceptez cette quête sans broncher</strong>… et vous
              voilà désormais planté face à la machine, à attendre l'arrivée du
              premier cadeau pour découvrir son contenu.
            </p>
          </div>
        </DialogDescription>
        <div className='flex justify-end pt-4'>
          <Button
            onClick={handleClose}
            size='lg'
            className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
          >
            Commencer l&apos;aventure
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
