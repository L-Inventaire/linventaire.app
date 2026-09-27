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
