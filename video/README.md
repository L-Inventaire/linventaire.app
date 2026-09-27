# Vidéo d'onboarding (Remotion)

Vidéo de ~50 s présentant linventaire.app (fonctionnalités, architecture, notions de base) et comment démarrer une nouvelle branche.

```bash
cd video
npm install
npm run studio   # prévisualisation interactive
npm run render   # génère out/onboarding.mp4
```

Les scènes sont dans `src/scenes/index.tsx`, leur durée dans `src/Root.tsx`.
