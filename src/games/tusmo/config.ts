import { GameMetadata } from '@/lib/games';

export const TUSMO_METADATA: GameMetadata = {
  id: 'tusmo',
  name: 'Tusmo',
  description: 'Devinez le mot français en 6 tentatives maximum !',
  difficulty: 'medium',
  estimatedTime: '5-10 min',
  instructions: [
    'Vous avez 6 essais pour trouver le mot',
    'Le mot doit être un mot français valide',
    'Une lettre en VERT est bien placée',
    'Une lettre en JAUNE existe dans le mot mais est mal placée',
    "Une lettre en GRIS n'existe pas dans le mot",
  ],
};
