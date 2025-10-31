import { GameMetadata } from '@/lib/games';

export const GAME_2048_METADATA: GameMetadata = {
  id: '2048',
  name: '2048',
  description: 'Combinez les tuiles pour atteindre la tuile cible !',
  difficulty: 'dynamic',
  estimatedTime: '5-15 min',
  instructions: [
    'Utilisez les flèches ou WASD/ZQSD pour déplacer les tuiles',
    'Les tuiles avec le même nombre se combinent quand elles se touchent',
    'Atteignez la tuile cible pour gagner',
    "Le jeu se termine quand la grille est pleine et aucun mouvement n'est possible",
    'Chaque jour a une difficulté différente (grille et cible)',
  ],
};
