# Vidéo de présentation (Remotion)

Vidéo client (~1 min 38) qui présente le positionnement de L'inventaire : **tout part du devis**.
On suit le devis D-2026-1 d'une boulangerie, de sa création jusqu'au paiement :
devis → envoi → signature client → réalisation (stock, commandes, interventions) → facturation → abonnement → paiement.

Les écrans sont reconstruits à l'identique de l'app (sidebar, pages devis/facture, modales, libellés réels),
avec le logo officiel (`frontend/public/medias/logo*.svg`), la police Inter et les icônes Heroicons.

```bash
cd video
npm install
npm run studio   # prévisualisation (composition "Presentation", ou une scène seule "scene-…")
npm run render   # génère out/presentation.mp4
```

- `src/ui/` : reconstruction de l'interface (shell, document devis/facture, curseur, logo)
- `src/scenes/steps.tsx` : les étapes animées dans l'interface
- `src/scenes/story.tsx` : intro, fonctionnalités, « Comment ça marche ? », schéma « tout part du devis », récap, outro
- `src/scenes/dashboard.tsx` : le tableau de bord (données de démo)
- `src/Root.tsx` : ordre et durée des scènes
- `node stills.mjs quote:120 send:60` : rend des images clés dans `out/stills/` pour vérifier une scène

## Voix off

- `voice/script.json` : les répliques de chaque scène, avec l'image de l'animation (`at`) sur laquelle chacune doit tomber.
- `voice/SCRIPT.md` : le même script, prêt à coller dans ElevenLabs (un fichier par scène).
- Déposer les fichiers dans `public/voice/<scène>.mp3`, puis `node voice/timings.mjs` : mesure la durée de chaque
  fichier et le début de chaque réplique (timestamps ElevenLabs si `<scène>.json` est fourni, sinon détection des
  pauses), et écrit `src/voice-timings.json`.
- Au rendu, chaque scène est allongée à la durée de sa voix et son animation est recalée pour que chaque étape
  tombe sur sa réplique (`src/timing.tsx`). Sans fichier audio, la vidéo garde son rythme actuel.
