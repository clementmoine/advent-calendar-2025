import { GameMetadata } from '@/lib/games';

export const MOTS_MELES_METADATA: GameMetadata = {
  id: 'mots-meles',
  name: 'Mots Mêlés',
  description: 'Trouvez tous les mots cachés dans la grille !',
  difficulty: 'dynamic',
  estimatedTime: '5-15 min',
  instructions: [
    'Trouvez tous les mots de la liste dans la grille',
    'Les mots peuvent être horizontaux, verticaux ou diagonaux',
    'Cliquez et glissez pour sélectionner un mot',
    'Trouvez tous les mots pour gagner !',
  ],
};
