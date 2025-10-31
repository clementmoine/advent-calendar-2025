import { GameMetadata } from '@/lib/games';

export const LIGHTS_OUT_METADATA: GameMetadata = {
  id: 'lights-out',
  name: 'Lights Out',
  description: 'Éteignez toutes les lumières en un minimum de coups !',
  difficulty: 'dynamic',
  estimatedTime: '3-10 min',
  instructions: [
    'Cliquez sur une case pour basculer sa lumière et celles de ses voisines',
    'L’objectif est d’éteindre toutes les lumières',
    'Chaque jour ajuste la taille de la grille',
  ],
};
