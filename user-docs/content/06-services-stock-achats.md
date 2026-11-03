# Services, stock, achats et plus

Ce chapitre détaille les modules qui gravitent autour du devis : ils se remplissent pour la plupart automatiquement à partir de vos devis, et vous permettent de suivre la réalisation au quotidien.

## Services et temps passé

Le module **Activité › Service** regroupe les tâches de votre équipe : interventions, installations, dépannages, heures de prestation…

Une tâche suit ces statuts : **Non planifié**, **À faire**, **En cours**, **En revue**, **Terminé** ou **Annulé**.

[![La liste des tâches de service, avec le devis associé et le temps passé](images/service.png)](images/service.png)

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

[![Le stock : chaque élément avec son article, son devis associé, son emplacement et son statut](images/stock.png)](images/stock.png)

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

[![Une commande fournisseur au statut Commandé, prête à être réceptionnée](images/commande.png)](images/commande.png)

### Les factures d'achat

Les factures de vos fournisseurs se trouvent dans **Achats › Factures d'achat**. Créez-les depuis la commande (**Enregistrer une facture**) pour reprendre ses lignes, ou directement. Ensuite :

1. **Comptabiliser** : la facture passe en attente de paiement (onglet **À payer**) ;
2. **Enregistrer un paiement** quand vous la réglez : une fois payée en totalité, elle est terminée.

### Les factures électroniques reçues

Si la réception des factures électroniques est activée (**Paramètres › Facturation électronique**), les factures envoyées par vos fournisseurs arrivent dans **Achats › Factures électroniques**, dans l'onglet **Nouveaux**. Pour chacune :

- **Rattacher** : la lier à une facture d'achat existante (L'inventaire propose celle du même fournisseur avec un montant proche, émise à 45 jours près) ;
- **Créer** › **Créer une facture** ou **Créer une commande** : créer le document d'achat à partir de la facture reçue ;
- **Imprimer** : imprimer la facture reçue (ou l'enregistrer en PDF depuis la fenêtre d'impression), sans avoir besoin de la rattacher ;
- **Ignorer** : si la facture n'est pas pour vous ou est un doublon. Elle est rangée dans l'onglet **Ignorées** ; le fournisseur n'est pas prévenu et aucun refus n'est transmis à la plateforme de facturation électronique.

Avant de créer le document, associez chaque ligne de la facture à un article de votre catalogue (L'inventaire le retrouve tout seul à partir de la référence fournisseur). Les lignes sans article sont créées avec l'**Article par défaut** (**Paramètres › Stock et services**) : elles gardent le libellé, la quantité et le prix de la facture mais ne sont pas liées au stock.

La liste affiche d'abord les factures les plus récentes. Cliquez sur l'en-tête d'une colonne (date, numéro, fournisseur ou montants) pour la trier autrement, et cliquez à nouveau pour inverser l'ordre.

## Abonnements

Un devis qui contient des lignes récurrentes (un contrat de maintenance mensuel, un abonnement annuel…) devient un **abonnement** : L'inventaire génère les factures à chaque période, sans intervention.

Dans le devis, la section **Récurrence** définit :

- le **Début de la récurrence** : après la première facture, lorsque le devis est accepté, ou à une date précise ;
- le jour de facturation (**Facturer le** premier jour, dernier jour ouvré… de la période) ;
- l'**État des factures créées** : brouillon (à vérifier avant envoi) ou envoyé directement au client ;
- la **Fin de la facturation** : sans fin (tacite reconduction), après 1, 2 ou 3 ans, ou à une date précise, et l'action à mener à la fin.

[![La section Récurrence d'un devis avec une ligne mensuelle](images/abonnement.png)](images/abonnement.png)

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

Dans l'export comptable, chaque ligne de facture porte son compte de vente ou d'achat et son compte de TVA. Le compte de l'article est utilisé en priorité. Pour les articles sans compte et les lignes sans article, l'export utilise les comptes par défaut de **Paramètres › Comptabilité** : par défaut 707 (marchandises) et 706 (prestations de services) pour les ventes, 607, 604 et 6022 pour les achats, 44571 (TVA collectée) et 44566 (TVA déductible). Vous pouvez les modifier, et définir un compte de TVA différent par taux si votre expert-comptable les distingue.

La remise globale d'une facture est répartie sur ses lignes, au prorata de leur montant : le total des lignes de l'export correspond ainsi exactement aux totaux de la facture.

### L'envoi automatique au comptable

Dans **Paramètres › Comptabilité**, la section **Envoi automatique au comptable** accepte deux adresses email : une pour les factures et avoirs de vente, une pour les factures et avoirs d'achat (votre expert-comptable, ou l'adresse de collecte de son logiciel). Chaque document y est envoyé seul, en PDF au format Factur-X, avec sa référence comme objet et comme nom de fichier :

- une vente est envoyée lorsqu'elle quitte le brouillon (envoi au client ou marquée comme envoyée) ;
- un achat est envoyé lorsque vous cliquez sur **Comptabiliser**. Si une facture électronique reçue est rattachée à l'achat, c'est la facture électronique qui est envoyée, et une même facture électronique n'est jamais envoyée deux fois.

Seuls les documents postérieurs à l'activation de l'adresse sont envoyés (pour les achats : saisis ou reçus après cette date), et chacun une seule fois, même s'il est rouvert puis comptabilisé à nouveau. L'envoi apparaît dans l'historique du document. En cas d'échec, il est réessayé plusieurs fois, puis une notification vous prévient.

### Le tableau de bord

Le **Tableau de bord** résume l'exercice en cours : chiffre d'affaires, charges et résultat, leur évolution mois par mois comparée à l'année précédente, ainsi que les devis signés et envoyés, les factures payées et en retard, et les commandes en attente ou à payer.

[![Le tableau de bord](images/tableau-de-bord.png)](images/tableau-de-bord.png)

## Le CRM

**Activité › CRM** suit vos opportunités commerciales avant le devis, dans un tableau en colonnes : **Nouveau**, **Qualifié**, **Proposition** et **Terminé**. Créez une opportunité avec le bouton **+** d'une colonne, associez-lui jusqu'à trois clients, un vendeur et des personnes assignées, puis faites-la glisser d'une colonne à l'autre au fil de son avancement.

Sur chaque carte, la première ligne de la description sert de titre et s'affiche en gras ; la suite est résumée en quelques lignes (**Afficher plus** pour tout lire). Les opportunités les plus récemment modifiées sont en haut de chaque colonne, et la durée depuis la dernière modification s'affiche en haut à droite de la carte : en orange au-delà d'un mois, en rouge au-delà de trois mois, pour repérer les opportunités qui n'avancent plus. La colonne **Terminé** est repliée par défaut : cliquez dessus pour l'afficher.

Pour changer une opportunité d'étape sans la faire glisser, utilisez le menu **…** de sa carte (**Déplacer vers…**).

Sur téléphone, le CRM affiche une étape à la fois : choisissez-la avec les onglets en haut (chacun indique son nombre d'opportunités) ou en faisant glisser l'écran vers la gauche ou la droite. Le bouton **+** en bas à droite crée une opportunité dans l'étape affichée, et le menu **…** d'une carte la change d'étape.

[![Le CRM : les opportunités par étape](images/crm.png)](images/crm.png)
