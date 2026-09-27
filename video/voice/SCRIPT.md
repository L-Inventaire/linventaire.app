# Voix off : script

**Le plus simple : tout en un seul fichier.** Coller `voice/SCRIPT-full.txt` dans ElevenLabs (modèle v3 : `[pause]` entre les répliques, `[long pause]` entre les scènes, balises d'intention comme `[warmly]` déjà placées) et déposer le résultat sous `video/public/voice/full.mp3`.
Avec l'API `with-timestamps`, déposer aussi la réponse JSON sous `full.json` : le découpage et le calage utilisent alors les timestamps exacts. Sinon, ils se font sur les pauses.

Autre possibilité : un fichier par scène (`<scène>.mp3`, et `<scène>.json` pour les timestamps), avec les blocs ci-dessous.

Ensuite : `node voice/timings.mjs` puis `npm run render`.

Réglages conseillés : modèle Eleven v3, voix française chaleureuse et posée, stabilité « Natural ».

## `intro.mp3`

```
[curious] Des devis sur un tableur, des factures dans un autre logiciel, un stock qu'on suit de tête... [short pause] Ça vous parle ? [pause] [warmly] Avec L'inventaire, tout est enfin au même endroit.
```

## `features.mp3`

```
[confident] Devis, factures, stock, clients, comptabilité... tout y est. [pause] Un seul outil, pensé pour vous simplifier la vie.
```

## `how.mp3`

```
[smiles] Et le plus simple, c'est encore de vous montrer comment ça marche.
```

## `positioning.mp3`

```
Chez L'inventaire, [short pause] tout part du devis. [pause] C'est lui qui organise vos opérations : vos clients, vos produits, vos interventions et vos achats. [pause] Et c'est lui qui génère toute la partie financière : factures, avoirs, abonnements et paiements.
```

## `quote.mp3`

```
Prenons un exemple : vous équipez une boulangerie en caisses enregistreuses. [pause] Vous créez le devis, et vous y déposez vos articles : deux caisses tactiles, deux tiroirs-caisses, six heures d'installation, et un contrat de maintenance mensuel.
```

## `send.mp3`

```
Un clic, [short pause] et le devis part par email, avec la signature électronique intégrée.
```

## `sign.mp3`

```
Votre client l'accepte et le signe en ligne, depuis son téléphone ou son ordinateur. [pause] Le devis passe automatiquement en « accepté ».
```

## `fulfil.mp3`

```
Place à la réalisation : les caisses sont réservées en stock, et la commande fournisseur est créée. [pause] Une fois l'installation faite, le devis est prêt à être facturé.
```

## `invoice.mp3`

```
Facturez alors en un clic : en totalité, en partie, ou sous forme d'acompte. [pause] Les lignes sont reprises automatiquement. Rien à ressaisir.
```

## `subscription.mp3`

```
Quant à la maintenance mensuelle, elle devient un abonnement : une facture est générée automatiquement, chaque mois.
```

## `payment.mp3`

```
Votre client règle sa facture ? [short pause] Enregistrez le paiement. [pause] La facture est soldée, et votre trésorerie est à jour.
```

## `recap.mp3`

```
[excited] Et voilà, c'est aussi simple que ça ! [pause] Un seul document, du premier contact jusqu'au paiement.
```

## `dashboard.mp3`

```
Et au quotidien, votre tableau de bord vous donne en temps réel votre chiffre d'affaires, vos charges et votre résultat... [pause] ...mais aussi les devis signés, les factures en retard, et tout ce qui demande votre attention.
```

## `outro.mp3`

```
[warmly] L'inventaire. [short pause] Simplifiez votre gestion, du devis au paiement.
```

_2036 caractères au total, soit environ 2.3 min de voix._
