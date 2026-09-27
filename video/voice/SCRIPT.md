# Voix off : script

Un fichier audio **par scène**, à déposer dans `video/public/voice/` sous le nom indiqué (mp3 ou wav).
Quand une scène a plusieurs répliques, laisser une **pause d'environ 0,6 s** entre elles : c'est ce qui permet de caler chaque réplique sur l'animation. Avec ElevenLabs, ajouter `<break time="0.7s" />` entre les répliques.

Si ElevenLabs fournit les timestamps (API `with-timestamps`), déposer aussi la réponse JSON sous `<scène>.json` : ils seront utilisés tels quels.

Ensuite : `node voice/timings.mjs` puis `npm run render`.

Réglages conseillés : modèle `eleven_multilingual_v2`, voix française posée, stabilité ~50 %.

## `intro.mp3`

```
L'inventaire : le co-pilote ERP de votre entreprise.
```

## `features.mp3`

```
Devis, factures, abonnements, contacts, stock, interventions, comptabilité, facture électronique... <break time="0.7s" /> Tout le quotidien de votre entreprise, réuni dans un seul outil.
```

## `how.mp3`

```
Mais alors, comment ça marche ?
```

## `positioning.mp3`

```
Chez L'inventaire, tout part du devis. <break time="0.7s" /> C'est lui qui organise vos opérations : vos clients, vos produits, vos interventions et vos achats. <break time="0.7s" /> Et c'est lui qui génère toute la partie financière : factures, avoirs, abonnements et paiements.
```

## `quote.mp3`

```
Prenons un exemple : vous équipez une boulangerie en caisses enregistreuses. <break time="0.7s" /> Vous créez le devis, et vous y déposez vos articles : deux caisses tactiles, deux tiroirs-caisses, six heures d'installation, et un contrat de maintenance mensuel.
```

## `send.mp3`

```
Un clic, et le devis part par email, avec la signature électronique intégrée.
```

## `sign.mp3`

```
Votre client l'accepte et le signe en ligne, depuis son téléphone ou son ordinateur. <break time="0.7s" /> Le devis passe automatiquement en « accepté ».
```

## `fulfil.mp3`

```
Place à la réalisation : les caisses sont réservées en stock, et la commande fournisseur est créée. <break time="0.7s" /> Une fois l'installation faite, le devis est prêt à être facturé.
```

## `invoice.mp3`

```
Facturez alors en un clic : en totalité, en partie, ou sous forme d'acompte. <break time="0.7s" /> Les lignes sont reprises automatiquement. Rien à ressaisir.
```

## `subscription.mp3`

```
Quant à la maintenance mensuelle, elle devient un abonnement : une facture est générée automatiquement, chaque mois.
```

## `payment.mp3`

```
Votre client règle sa facture ? Enregistrez le paiement. <break time="0.7s" /> La facture est soldée, et votre trésorerie est à jour.
```

## `recap.mp3`

```
Et voilà, c'est aussi simple que ça ! <break time="0.7s" /> Un seul document, du premier contact jusqu'au paiement.
```

## `dashboard.mp3`

```
Et au quotidien, votre tableau de bord vous donne en temps réel votre chiffre d'affaires, vos charges et votre résultat... <break time="0.7s" /> ...mais aussi les devis signés, les factures en retard, et tout ce qui demande votre attention.
```

## `outro.mp3`

```
L'inventaire. Simplifiez votre gestion, du devis au paiement.
```

_1819 caractères au total, soit environ 2.0 min de voix._
