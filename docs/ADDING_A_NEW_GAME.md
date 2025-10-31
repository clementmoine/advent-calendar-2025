# Ajouter un nouveau jeu

Ce guide explique comment ajouter un nouveau jeu à l'application de manière simple et automatique.

## Structure requise

Pour ajouter un nouveau jeu, créez un dossier dans `src/games/[nom-du-jeu]/` avec les fichiers suivants :

```text
src/games/[nom-du-jeu]/
├── index.tsx          # Composant principal du jeu
├── rules.tsx          # Composant des règles du jeu
└── config.ts          # Configuration et métadonnées du jeu
```

## Fichiers requis

### 1) `index.tsx` – Composant principal

```typescript
'use client';

import { GameProps } from '@/lib/games';
// ... autres imports

export default function MonJeu({ gameData, onWin, onLose, onExit, onReset }: GameProps) {
  // Logique du jeu
  return (
    <div>
      {/* Interface du jeu */}
    </div>
  );
}
```

### 2) `rules.tsx` – Règles du jeu

```typescript
'use client';

export default function MonJeuRules() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Règles du jeu</h3>
      <ol className="space-y-2 list-decimal list-inside">
        <li>Règle 1</li>
        <li>Règle 2</li>
        {/* ... */}
      </ol>
    </div>
  );
}
```

### 3) `config.ts` – Configuration

```typescript
import { GameMetadata } from '@/lib/games';

export const MON_JEU_METADATA: GameMetadata = {
  id: 'mon-jeu',
  name: 'Mon Jeu',
  description: 'Description du jeu',
  difficulty: 'medium', // ou 'dynamic' pour une difficulté basée sur le jour
  estimatedTime: '5-10 min',
  instructions: [
    'Instruction 1',
    'Instruction 2',
    // ...
  ],
};
```

## Découverte automatique

Une fois les fichiers créés, le jeu sera automatiquement découvert :

1. **Développement**: le jeu est chargé dynamiquement dès que les trois fichiers existent.
2. **Production**: exécutez `npm run discover-games` pour régénérer `src/lib/games-config.generated.ts`.

## Configuration de la difficulté

### Difficulté fixe
```typescript
difficulty: 'easy' | 'medium' | 'hard'
```

### Difficulté dynamique (basée sur le jour)
```typescript
difficulty: 'dynamic'
```

La difficulté sera automatiquement calculée :
- Jours 1-8 : Facile
- Jours 9-16 : Modéré  
- Jours 17-25 : Difficile

## Exemple minimal

Les trois fichiers ci‑dessus suffisent. Inspirez‑vous des jeux existants (`src/games/2048`, `lights-out`, `mots-meles`, `sudoku`, `tusmo`) pour la structure et les styles.

## Avantages du système

✅ **Découverte automatique** : Pas besoin de modifier des fichiers de configuration  
✅ **Type-safe** : TypeScript vérifie la conformité des métadonnées  
✅ **Fallback robuste** : Configuration statique en cas d'erreur  
✅ **Facile à maintenir** : Un seul endroit pour chaque jeu  
✅ **Extensible** : Ajout de nouveaux jeux sans impact sur l'existant  

## Commandes utiles

```bash
# Découvrir (ou régénérer) la configuration des jeux
npm run discover-games

# Vérifier la configuration TypeScript
npm run type-check

# Lancer en mode développement
npm run dev
```
