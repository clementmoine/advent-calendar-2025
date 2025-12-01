import { GameMetadata } from '@/lib/games';

export const NONOGRAM_METADATA: GameMetadata = {
  id: 'nonogram',
  name: 'Nonogram',
  description: 'Résolvez le puzzle pour révéler l\'image cachée !',
  difficulty: 'dynamic',
  estimatedTime: '5-15 min',
  instructions: [
    'Les nombres sur les côtés indiquent les groupes de cases remplies',
    'Cliquez ou faites glisser pour remplir les cases',
    'Clic droit ou Ctrl+Clic pour marquer une case comme vide',
    'Résolvez toutes les lignes et colonnes pour révéler l\'image',
    'La taille de la grille augmente avec la difficulté',
  ],
};

