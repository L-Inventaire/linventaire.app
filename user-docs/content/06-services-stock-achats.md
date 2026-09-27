# Services, stock, achats et plus

Ce chapitre détaille les modules qui gravitent autour du devis : ils se remplissent pour la plupart automatiquement à partir de vos devis, et vous permettent de suivre la réalisation au quotidien.

## Services et temps passé

Le module **Activité › Service** regroupe les tâches de votre équipe : interventions, installations, dépannages, heures de prestation…

Une tâche suit ces statuts : **Non planifié**, **À faire**, **En cours**, **En revue**, **Terminé** ou **Annulé**.

Pour créer une tâche, cliquez sur **Ajouter** et renseignez :

- la **Description** (par exemple « Installation des caisses ») et le **Temps** prévu ;
- le **Client** ;
- dans **Facturation**, le **Devis associé** (parmi les devis acceptés ou en abonnement) : l'article de service et la quantité sont repris du devis. Si la tâche ne doit pas être facturée (contrat de maintenance, geste commercial…), cochez **Non facturable / Contrat** ;
- les personnes assignées, en haut de la tâche (par défaut, son créateur).

Le **temps passé** se saisit dans la section **Temps passé** › **Ajouter** : la date, le nombre d'heures et le travail effectué. Le total de la tâche est calculé automatiquement.

Quand la tâche est **Terminée**, son temps passé complète la ligne correspondante du devis (indicateur **Executé**).

> [!TIP]
> Des interventions réalisées sans devis ? Dans l'onglet **À facturer**, sélectionnez les tâches d'un même client et utilisez **Facturer la sélection** : vous pouvez les ajouter à un devis existant ou créer un nouveau devis.

## Le stock

Le module **Activité › Stock** suit chaque élément physique : un numéro de série ou un lot, une quantité, un emplacement et un statut (**En stock**, **En transit**, **Livré**, **Épuisé**). Les onglets permettent de voir le stock disponible, réservé pour un devis, ou livré.

### Réceptionner du stock

Cliquez sur **Réception** et choisissez comment démarrer :

- **À partir d'une commande** : le cas le plus courant, les lignes de la commande fournisseur sont reprises et déjà rattachées au bon devis ;
- **À partir d'un fournisseur** ou **À partir d'un article** : pour du stock hors commande.

Pour chaque ligne, saisissez le **Numéro de série ou de lot**, la **Quantité** et la **Localisation**, puis cliquez sur **Ajouter N éléments dans le stock**.

> [!TIP]
> Appuyez sur **Entrée** dans le champ « Numéro de série ou de lot » pour dupliquer la ligne : pratique pour scanner une série de produits à la suite.

### Suivre un élément

La fiche d'un élément de stock indique sa **Commande d'origine**, le devis pour lequel il est réservé (**Pour le devis**) et, une fois livré, chez quel contact il se trouve. La section **Traçabilité** retrace son parcours. **Subdiviser le lot** permet de séparer une partie d'un lot, ou de créer une pièce détachée.

Les emplacements (entrepôts, étagères) se configurent dans **Paramètres › Lieux de stockage**.

## Commandes et factures d'achat

Les achats suivent le même principe que les ventes, dans la section **Achats**.

### Les commandes fournisseurs

Une commande est généralement créée depuis un devis client, avec **Fournir les produits** ou le menu **…** › **Créer une commande**. Vous pouvez aussi en créer une directement avec le bouton **+** de la section Achats. Ses statuts :

| Statut | Action pour avancer |
|---|---|
| **Brouillon** | **Demande envoyée** si vous demandez un prix, ou directement **Commandé** |
| **Prix demandé** | **Commandé** une fois la commande passée |
| **Commandé** | **Réception** à l'arrivée des produits (voir [Le stock](#description/le-stock)) |
| **Réceptionné** | **Enregistrer une facture** à réception de la facture du fournisseur |
| **Terminé** | — |

La commande passe automatiquement au statut **Réceptionné** quand tous ses produits sont reçus.

### Les factures d'achat

Les factures de vos fournisseurs se trouvent dans **Achats › Factures d'achat**. Créez-les depuis la commande (**Enregistrer une facture**) pour reprendre ses lignes, ou directement. Ensuite :

1. **Comptabiliser** : la facture passe en attente de paiement (onglet **À payer**) ;
2. **Enregistrer un paiement** quand vous la réglez : une fois payée en totalité, elle est terminée.

### Les factures électroniques reçues

Si la réception des factures électroniques est activée (**Paramètres › Facturation électronique**), les factures envoyées par vos fournisseurs arrivent dans **Achats › Factures électroniques**, dans l'onglet **Nouveaux**. Pour chacune :

- **Rattacher** : la lier à une facture d'achat existante (L'inventaire propose celles qui correspondent) ;
- **Créer** › **Créer une facture** ou **Créer une commande** : créer le document d'achat à partir de la facture reçue ;
- **Rejeter** : si la facture n'est pas pour vous ou est erronée.

## Abonnements

Un devis qui contient des lignes récurrentes (un contrat de maintenance mensuel, un abonnement annuel…) devient un **abonnement** : L'inventaire génère les factures à chaque période, sans intervention.

Dans le devis, la section **Récurrence** définit :

- le **Début de la récurrence** : après la première facture, lorsque le devis est accepté, ou à une date précise ;
- le jour de facturation (**Facturer le** premier jour, dernier jour ouvré… de la période) ;
- l'**État des factures créées** : brouillon (à vérifier avant envoi) ou envoyé directement au client ;
- la **Fin de la facturation** : sans fin (tacite reconduction), après 1, 2 ou 3 ans, ou à une date précise, et l'action à mener à la fin.

Les abonnements en cours se trouvent dans **Ventes › Abonnements**. Chacun indique sa date de démarrage et la date de la prochaine facture. Le bouton **Modifier l'abonnement** permet de changer ses lignes ou de l'annuler. Vous pouvez aussi programmer un rappel de vérification périodique (onglet **À vérifier**).

## Comptabilité et tableaux

### Les opérations

**Comptabilité › Opérations** liste les mouvements financiers : paiements reçus, paiements de vos fournisseurs, et toute autre opération. Chaque opération a une date, un montant, un compte débité, un compte crédité et, pour un paiement, les factures ou avoirs liés.

La plupart des opérations se créent avec **Enregistrer un paiement** depuis une facture. Les comptes clients (411) et fournisseurs (401) sont créés automatiquement avec chaque contact. Vos comptes bancaires et de caisse se déclarent dans **Paramètres › Comptes bancaires**.

### Les tableaux et exports

**Comptabilité › Tableaux** propose :

- le **Chiffre d'affaires catégorisé** ;
- la **Balance clients** et la **Balance fournisseurs**, avec l'ancienneté des sommes dues (non échues, 1 à 30 jours, 31 à 60 jours…) ;
- les **Bénéfices par clients** ;
- l'**Export comptable** de vos documents, au format Excel ou CSV, à transmettre à votre expert-comptable.

### Le tableau de bord

Le **Tableau de bord** résume l'exercice en cours : chiffre d'affaires, charges et résultat, leur évolution mois par mois comparée à l'année précédente, ainsi que les devis signés et envoyés, les factures payées et en retard, et les commandes en attente ou à payer.

## Le CRM

**Activité › CRM** suit vos opportunités commerciales avant le devis, dans un tableau en colonnes : **Nouveau**, **Qualifié**, **Proposition** et **Terminé**. Créez une opportunité avec le bouton **+** d'une colonne, associez-lui jusqu'à trois clients, un vendeur et des personnes assignées, puis faites-la glisser d'une colonne à l'autre au fil de son avancement.
