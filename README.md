<div align="center">

# 🎄 Advent Calendar 2025

Mini-jeux quotidiens + mot du jour. Next.js + TypeScript + Tailwind.

</div>

## ✨ Fonctionnalités
- 25 jours, 25 jeux (découverte auto)
- Mot du jour à débloquer à la victoire
- Tirelire (mini‑jeux à coins)
- A11y: raccourcis, labels, focus
- Palette émeraude + dark mode

## 🧱 Stack
- Next.js (App Router), React, TypeScript
- Tailwind CSS, shadcn/ui
- Framer Motion, DnD Kit

## 🚀 Démarrer
```bash
pnpm i
pnpm dev
# Prod
pnpm run discover-games && pnpm build && pnpm start
```

## 🕹️ Ajouter un jeu
Créer `src/games/mon-jeu/` avec `index.tsx`, `rules.tsx`, `config.ts`.
En dev, découverte auto. En prod, lancez `pnpm run discover-games`.

## 🗂️ Structure
```text
src/
  app/        # pages, API, layout
  components/ # UI & composables
  games/      # jeux
  mini-games/ # mini‑jeux tirelire
  lib/        # utils & config
```

## 🧪 Lint & Types
```bash
pnpm lint
pnpm type-check
```

## 📄 Licence
MIT © 2025