# Audit – vue d'ensemble des axes d'amélioration

_Septembre 2026 · branche `claude/audit-vue-ensemble` · analyse statique en lecture seule (aucun build ni test exécuté, `node_modules` absents)._

Périmètre : `backend/` (~36 k lignes, 236 fichiers), `frontend/` (~56 k lignes, 434 fichiers), `shared/`, CI, Docker, dépendances.

> **Sécurité :** plusieurs vulnérabilités **critiques** ont été identifiées (contournement de l'isolation multi-tenant, élévation de privilèges). Comme le dépôt est public, leur détail technique n'est **pas** reproduit ici ; il a été transmis séparément au mainteneur. Elles doivent être corrigées avant tout autre chantier.

---

## 1. Synthèse et priorités

| Priorité | Chantier | Effort |
|---|---|---|
| P0 | Corriger les failles critiques de sécurité (§2) | S–M |
| P0 | Secrets : sortir les valeurs réelles de `config/default.json`, refuser de démarrer en prod avec les valeurs par défaut | S |
| P1 | Migrations sûres (verrou, transaction, arrêt en cas d'échec) + politique de sauvegarde | M |
| P1 | Transactions imbriquées (SAVEPOINT) et verrous distribués atomiques | M |
| P1 | Tests : totaux de facture, Factur-X/EN16931, isolation multi-tenant | M–L |
| P1 | CI : frontend (lint/typecheck/build), `yarn --immutable`, Dependabot/CodeQL | S |
| P2 | Frontend : clés de cache `useRest`, lazy loading des routes, `define process.env` | S–M |
| P2 | Dépendances vulnérables/abandonnées (`jsonwebtoken`, `axios`, `multer`, `xlsx`) | S–M |
| P2 | Docker : multi-stage, non-root, Node 22+, `.dockerignore`, compose de dev réparé | M |
| P3 | Dette : Recoil → React Query/Zustand, i18n, architecture en couches, nettoyage deps | L |

---

## 2. Sécurité (backend)

Constats vérifiés dans le code ; les points **critiques** sont volontairement décrits de façon générique.

**Critique**
- Le service REST générique de recherche/comptage accepte des formes de requête qui ne devraient jamais venir du client et s'exécute avec un contexte élevé → contournement du filtre `client_id`. _À corriger : n'accepter que des `RestSearchQuery[]` et ne plus élever le contexte dans `search`/`count`._
- Le calcul des rôles ajoute des rôles par défaut même pour un utilisateur non membre du client → accès inter-tenant à certaines tables. _À corriger : renvoyer `[]` si aucun membership actif._
- Plusieurs routes de modules (factures, sessions de signature, notifications) ne vérifient que `checkRole("USER")` et/ou ne filtrent pas sur `client_id`.

**Haute**
- Téléchargement/miniatures de fichiers : contrôle d'appartenance inopérant, `Content-Type` piloté par l'URL (risque XSS sur le domaine API). → auth + mime lu en base + `X-Content-Type-Options: nosniff`.
- `Captcha.verify` appelé sans `await` (`auth/services/email.ts`) → captcha jamais bloquant ; OTP sans compteur d'essais ; rate-limit global très permissif (50 000 req/min), pas de limite dédiée sur `/login`, `/token`, `/mfa`.
- Transactions imbriquées (`platform/db/adapters/postgres.ts`) : réutilisent la connexion et font `BEGIN/COMMIT` sur la transaction parente → commits prématurés. → SAVEPOINT.
- `/confirm-signed` (adaptateur Documenso) sans vérification de signature (TODO en place).
- Secrets dans `config/default.json` (`jwt.secret`, `signatures.secret`, clé Documenso, `db.encryption_key`) ; certains n'ont pas de mapping dans `custom-environment-variables.json`. → rotation + mappings + garde au démarrage.
- Clés JSONB concaténées sans échappement dans le générateur de clauses (`rest/services/utils.ts`) ; `fields.code` non validé. → paramétrer / valider `^[a-z0-9_]+$`.

**Moyenne**
- MFA/JWT : calcul d'expiration erroné (`mfas.ts`, `exp += now + …`), `exp` jamais vérifié, `/token` renouvelable indéfiniment, pas de révocation/logout serveur, même secret pour sessions et tokens de validation.
- `update` REST : `client_id`, `created_by`, `is_deleted`, `revisions` modifiables par le client ; pas de verrou optimiste.
- WebSocket : origine réfléchie avec credentials, `join` de room client sans contrôle.
- `err.message` renvoyé au client (fuite d'erreurs SQL) ; pas de `helmet`.
- Logs : `debug = true` sur les requêtes SQL (valeurs incluses), log console avant masquage des données sensibles.
- IDs publics (`id()`) non cryptographiques utilisés comme seuls secrets de routes publiques (signature).

---

## 3. Backend – fiabilité et architecture

- **Migrations** (`services/migrations/index.ts`) : lancées au boot sans `await`, sans verrou, sans transaction ; un échec n'arrête pas la suite. `ALTER COLUMN TYPE` automatiques au démarrage (`postgres.ts`). → `pg_advisory_lock`, 1 transaction/migration, étape de migration séparée dans le déploiement.
- **Verrous distribués** (`platform/lock`) : GET puis SET non atomique, `release` sans vérif du propriétaire, verrou local si pas de Redis → crons (factures récurrentes) potentiellement exécutés en double. → `SET NX PX` + release Lua.
- **Pool Postgres** : une seule `PoolClient` partagée hors transaction → requêtes sérialisées ; fuite du premier pool.
- **Performance** : `loadPermissions` fait un `getClient` par membership à chaque requête (N+1) ; `select` + `count` séparés ; cache de permissions `UsersRolesCache` jamais alimenté.
- **Bugs mineurs** : routes REST qui lisent `query` (fonction express importée) au lieu de `req.query` ; longueur mini mot de passe incohérente (4 vs 6).
- **Architecture** : dépendance circulaire `platform → services` (`postgres.ts` importe un hook REST) ; logique métier dans les routes (`signing-sessions/routes.ts` 1000 lignes, `e-invoices/routes.ts` 678) ; code dupliqué `update/remove/restore` et gestion `id~revision`.

---

## 4. Frontend

**Données / React Query**
- `features/utils/rest/hooks/use-rest.ts` :
  - clé de cache incomplète (`asc`, `deleted`, `useRankOrderOnSearch` absents) → résultats périmés pendant 5 min ;
  - `refresh()` invalide une clé qui ne correspond jamais quand `key` est défini ;
  - `setQueryData` et mutation de `options` pendant le rendu ;
  - `isPendingModification` bloqué en cas d'erreur (utiliser `onSettled`).
- `QueryClient` sans configuration par défaut ni gestion globale des erreurs → erreurs de lecture silencieuses.
- Clés écrites à la main et incohérentes → créer une fabrique `queryKeys.ts`.
- Import de `queryClient` depuis `src/index.tsx` (cycle) dans `use-sockets.ts`, sans cleanup du socket.

**État**
- Recoil (archivé) contient des données serveur (`ClientsState`, `LoadingState`…) qui doublonnent React Query. → migrer serveur → React Query, UI → Zustand/Jotai.
- Formulaires maison sur `atomFamily` sans schéma de validation (envisager react-hook-form + zod).

**Performance / build**
- Aucune route en `React.lazy` : ~40 pages + `xlsx`, `@nivo`, `quill`, `pcg.json` (284 Ko) dans le bundle initial.
- `vite.config.ts` : `define: { "process.env": process.env }` peut injecter l'environnement de build (dont `SENTRY_AUTH_TOKEN`) dans le bundle — à vérifier sur un build et remplacer par `process.env.NODE_ENV`.
- Sentry : `tracesSampleRate: 1.0` en prod, `tracePropagationTargets` contient la valeur d'exemple, Session Replay sans masquage explicite ; route `/dev` accessible en prod.

**Qualité**
- Couches inversées : 18 fichiers `atoms/` importent `features`/`components`/`views` ; composants métier dans `views/` au lieu de `features/`.
- 494 `any`, `no-explicit-any` et `react-hooks/exhaustive-deps` désactivés ; `typescript` figé à 5.1.6, cible `es5`.
- Export CSV/XLSX dupliqué 5 fois, CSV sans échappement (virgules/guillemets cassent le fichier) → `lib/export.ts` commun.
- Accessibilité : lignes de tableau cliquables non navigables au clavier, ~48 `div/span onClick`, images sans `alt`.
- i18n : 30 fichiers / 434 utilisent `t()`, ≥ 96 lignes JSX en français en dur, 11 clés manquantes dans `fr.json`, 38 clés manquantes dans `en.json`.
- ErrorBoundary non réinitialisé au changement de route, pas d'`errorElement` dans le routeur.
- Code mort : `assets/font/inter/Inter-bold.js` (424 Ko), `tailwind.config-saved.js`, `atoms/icon-step`, restes CRA.

**Plus gros fichiers** : `lib/quill-mentions/mention.ts` (1037), `invoices-details.tsx` (955), `invoice-line-input.tsx` (765), `multiselect.component.tsx` (749, vendorisé, 14 `@ts-ignore`), `contact-details.tsx` (607).

---

## 5. Tests

- 11 fichiers `*.spec.ts` backend (~2 250 lignes), 0 test frontend, 0 test `shared`. `backend/tests/status.spec.ts` ne teste rien alors que la CI fournit un Postgres.
- **Zones critiques non testées** : `computePricesFromInvoice` (`shared/src/invoices.ts`), génération Factur-X / réception fournisseur, permissions/auth/MFA, isolation `client_id` du REST, stock hors triggers, CRM, comptabilité, migrations.
- Recommandé : tests unitaires totaux (arrondis, remises, multi-TVA, avoirs) ; validation XSD/Schematron EN16931 sur fixtures ; tests d'intégration REST avec accès croisés entre clients ; Vitest côté frontend pour `use-rest` et les utilitaires.

---

## 6. CI/CD, Docker, dépendances

**CI (`.github/workflows`)**
- Frontend ni linté ni typé ni buildé en PR.
- `npm install` alors que le projet est en Yarn 3 → lockfiles ignorés ; `shared` a `package-lock.json` et `yarn.lock`.
- Workflows de déploiement dupliqués (lint/tests relancés deux fois) ; actions en v1/v2 ; `echo $AWS_ACCESS_KEY_ID` ; clés AWS longues durée (préférer OIDC).
- Pas de Dependabot, CodeQL, audit de deps ni scan d'image.
- `.eslintrc.json` à la racine est en fait un tsconfig (supprimé à la volée dans chaque workflow) → renommer.

**Docker**
- `docker-compose.yml` / `docker-compose.tests.yml` pointent vers des Dockerfiles inexistants → Quick Start cassé.
- `docker/node.Dockerfile` : mono-étape (devDeps + sources dans l'image), root, pas de `HEALTHCHECK`, `EXPOSE 80` vs port 3000, `SENTRY_AUTH_TOKEN` en `ARG`. Aucun `.dockerignore`.
- Node 20 en fin de vie (avril 2026) → Node 22/24.
- `docker-compose.prod.yml` : Postgres exposé sur `5432:5432`, Watchtower en `:latest` toutes les 30 s (déploiement non contrôlé + migrations au boot), pas de healthchecks, pas de sauvegarde.

**Dépendances**
- À mettre à jour (sécurité) : `jsonwebtoken` 8 → 9, `axios` 0.27 → 1.x, `multer` 1.4 → 2.x, `xlsx` 0.18.5 (abandonné sur npm) → distribution SheetJS ≥ 0.20.2 ou `exceljs`.
- Express déclaré `^5.0.0-beta.1` (résolu en 5.2.1) → `^5.2.1` + `@types/express@5`.
- TypeScript hétérogène (5.1.6 / 5.5 / 6.0.3) ; outils de dev (`jest`, `eslint`, `@types/*`, `@sentry/cli`, `gulp`, `npm`) en `dependencies`.
- Frontend : dépendances jamais importées (`@fluentui/*`, `nivo@0.31`, `@editorjs/*`, `html2pdf.js`, `react-use`…), doublons (`luxon`+`date-fns`, `clsx`+`classnames`, deux libs de signature, deux versions de Quill), `tailwindcss@3` avec `@tailwindcss/vite@4`, `i18next@21`, `recoil`, `react-quill` non maintenu.
- Pas de `package.json` racine : des **workspaces Yarn** simplifieraient l'install et le build de `shared` (aujourd'hui compilé jusqu'à 3 fois).

---

## 7. Documentation et outillage

- README : badges pointant tous deux vers `deploy-docker.yml`, Quick Start Docker non fonctionnel.
- CLAUDE.md : « Node 16+ » (20+ requis), `yarn install` à la racine (pas de `package.json`), tests « dans `backend/tests/` » (ils sont à côté du code).
- Hook pre-commit non installé automatiquement → `git config core.hooksPath .githooks` + même vérification en CI.

---

## 8. Plan de mise en œuvre suggéré

1. **Semaine 1 – Sécurité** : failles critiques + hautes, secrets, captcha, rate-limit auth, port 5432, deps vulnérables.
2. **Semaine 2 – Fiabilité** : migrations, SAVEPOINT, verrous Redis, sauvegardes, pool Postgres.
3. **Semaine 3 – Filet de sécurité** : CI complète (frontend, immutable, Dependabot, CodeQL), tests totaux / Factur-X / multi-tenant.
4. **Semaine 4 – Frontend** : `useRest`, lazy routes, `vite define`, export CSV commun, nettoyage deps.
5. **Ensuite (continu)** : Docker durci, workspaces Yarn, migration Recoil, i18n, a11y, découpage des gros fichiers.
