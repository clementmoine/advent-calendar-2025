import { GameMetadata } from '@/lib/games';

export const SUDOKU_METADATA: GameMetadata = {
  id: 'sudoku',
  name: 'Sudoku',
  description: 'Remplissez la grille avec les chiffres 1 à 9 !',
  difficulty: 'dynamic',
  estimatedTime: '10-20 min',
  instructions: [
    'Remplissez la grille avec les chiffres 1 à 9',
    'Chaque ligne doit contenir tous les chiffres de 1 à 9',
    'Chaque colonne doit contenir tous les chiffres de 1 à 9',
    'Chaque carré 3x3 doit contenir tous les chiffres de 1 à 9',
    'Cliquez sur une case pour la sélectionner',
    'Utilisez le clavier numérique pour entrer un chiffre',
    'Utilisez les flèches pour naviguer',
  ],
};
