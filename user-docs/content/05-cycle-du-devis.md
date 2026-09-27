# Le cycle du devis

Ce chapitre suit un devis de sa création jusqu'au paiement de la facture. Les devis se trouvent dans **Ventes › Devis**, classés par onglets : Brouillons, Envoyés, Acceptés, À facturer et Terminés.

| Statut | Signification |
|---|---|
| **Brouillon** | En préparation, modifiable librement |
| **Envoyé** | Transmis au client, en attente de sa réponse |
| **Accepté** | Signé par le client : c'est le moment de le réaliser |
| **À facturer** | Tout est livré et réalisé : il reste à facturer |
| **Terminé** | Entièrement facturé, ou clôturé |
| **Abonnement** | Devis récurrent en cours (voir [Abonnements](#description/abonnements)) |

[![La liste des devis, classés par onglets](images/devis-liste.png)](images/devis-liste.png)

## Créer le devis

1. Dans **Devis**, cliquez sur **Devis** (touche **C**), ou sur **Créer un devis** depuis la fiche d'un client.
2. Choisissez le **Client**, et si besoin le **Contact** à qui s'adresse le devis. La section **Contenu** apparaît.
3. Ajoutez vos lignes avec **Ajouter une ligne** :
   - **Article** : choisissez un article du catalogue, son nom, sa description, son prix et sa TVA sont repris ;
   - **Texte libre** : un titre et une description, sans article ;
   - **Acompte** : une ligne d'acompte.
4. Ajustez chaque ligne : cliquez sur la quantité pour changer la **Quantité**, l'**Unité** ou la **Récurrence**, et sur le prix pour changer le **Prix unitaire HT** ou la **TVA**.
5. Cliquez sur **Sauvegarder** (**Ctrl+S**).

[![Un devis en cours de modification](images/devis-creation.png)](images/devis-creation.png)

Pour enrichir le devis :

- **Réductions** : menu **…** de la ligne › **Ajouter une réduction** (pourcentage ou montant fixe), ou **Réduction globale** sur le total.
- **Options** : menu **…** de la ligne › **Article optionnel**. Le client pourra cocher ou décocher l'option au moment de signer.
- **Groupes** : regroupez des lignes sous un intitulé (« Installation », « Matériel »…) avec **Créer un groupe d'articles**. Vous pouvez masquer le prix des lignes pour n'afficher que le total du groupe.
- **Pièces jointes** : l'icône trombone joint des fichiers visibles par le client (fiche technique, plan…).
- **Livraison** : un délai ou une date de livraison, et une adresse de livraison.
- **Format, paiement, et autre** : langue, notes, conditions générales de vente, moyens et délai de paiement. Par défaut, ce sont les réglages de votre entreprise ou du client.

Le cadre des totaux affiche le total HT, la TVA, le total TTC ainsi que le **coût estimé** et la **marge estimée**, calculés à partir des prix d'achat de vos articles. L'icône d'impression affiche l'aperçu PDF.

> [!TIP]
> Pour gagner du temps, partez d'un devis similaire et cliquez sur **Dupliquer** (**Ctrl+D**).

## L'envoyer

Depuis un devis en brouillon, cliquez sur **Envoyer** › **Envoyer par email...**. La fenêtre d'envoi propose :

- les **destinataires** : les emails du client sont cochés, vous pouvez en **Ajouter** d'autres ;
- pour chaque destinataire, son **Action** : **Signer** ou simplement **Voir** le devis (au moins un signataire est nécessaire) ;
- le **Statut final** du devis après l'envoi (Envoyé en général).

[![La fenêtre d'envoi d'un devis](images/devis-envoi.png)](images/devis-envoi.png)

Cliquez sur **Envoyer à N destinataires**. Chaque destinataire reçoit un email avec le PDF en pièce jointe et un bouton **Signer le devis** (ou **Accéder au devis**). Le devis passe au statut **Envoyé**.

Autres possibilités du menu **Envoyer** :

- **Télécharger le PDF**, pour l'envoyer vous-même ;
- **Marquer comme envoyé**, si le devis a été transmis autrement (en main propre, par courrier…).

Dans l'activité du devis, une icône indique pour chaque destinataire si l'email est bien arrivé. Tant que le client n'a pas répondu, un rappel lui est envoyé automatiquement chaque semaine, 3 fois au maximum.

> [!NOTE]
> Besoin de modifier un devis déjà envoyé ? Menu **…** › **Retourner en brouillon**, faites vos modifications, puis **Envoyer de nouveau...**. Les liens de signature précédents expirent.

## Devis signé ou refusé

Le client ouvre le lien reçu par email, depuis son ordinateur ou son téléphone. Il peut consulter le devis, cocher les options qu'il souhaite, puis :

- **Accepter et signer** : le devis passe automatiquement au statut **Accepté**, et vous recevez un email avec le devis signé ;
- **Refuser** : il indique la raison de son refus, qui apparaît dans l'activité du devis. Le devis revient en **Brouillon**, prêt à être retravaillé et renvoyé.

[![Ce que voit le client : le devis en PDF et la signature en ligne](images/devis-signature.png)](images/devis-signature.png)

Si la réponse du client vous parvient autrement (signature papier, accord par téléphone…), utilisez les boutons du devis envoyé :

- **Devis accepté** : valide le devis (il ne pourra plus revenir en brouillon) ;
- **Devis refusé** : renvoie le devis en brouillon.

Depuis la liste, l'action **Marquer comme accepté** valide plusieurs devis d'un coup.

> [!TIP]
> Pour être prévenu à chaque signature ou refus, activez « Devis signé » et « Devis refusé » dans **Compte › Notifications**.

Une fois accepté, le contenu et le client du devis ne sont plus modifiables : il fait foi pour la suite.

## Compléter un devis

Un devis accepté doit être réalisé : produits fournis et livrés, services effectués. Sur chaque ligne, des indicateurs suivent l'avancement : **Reservé X %** et **Livré X %** pour les produits, **Executé X %** pour les services.

[![Un devis accepté : chaque ligne indique ce qui est réservé, livré ou exécuté](images/devis-accepte.png)](images/devis-accepte.png)

### Fournir les produits

Cliquez sur **Fournir les produits** (touche **F**). Pour chaque article, le tableau **Articles à fournir** indique ce qui est déjà commandé, réservé ou livré. Dans la colonne **Fournir**, choisissez d'où viennent les produits :

- **Stock disponible** : les éléments en stock sont réservés pour ce devis ;
- **Fournisseurs** : une commande est préparée chez le fournisseur choisi.

[![Fournir les produits : pour chaque article, le stock à réserver ou la commande à passer](images/fournir-produits.png)](images/fournir-produits.png)

Validez avec **Créer N commandes et réserver M éléments du stock**. Les commandes sont créées en brouillon et liées au devis : il reste à les envoyer au fournisseur (voir [Commandes et factures d'achat](#description/commandes-et-factures-dachat)). À la réception de la commande, les produits sont rattachés au devis.

### Livrer

Quand les produits sont remis au client, cliquez sur l'indicateur **Livré** d'une ligne › **Marquer tout le stock comme livré**. Le menu **…** du devis propose aussi un **Bon de livraison...** et un **Accusé de réception...**.

### Réaliser les services

Les lignes de service se complètent avec les tâches du module **Service** liées au devis : une tâche **Terminée** compte comme réalisée, à hauteur du temps passé. Depuis l'indicateur **Executé** d'une ligne, **Compléter les services** permet de le faire rapidement (voir [Services et temps passé](#description/services-et-temps-passé)).

Quand toutes les lignes sont livrées ou réalisées, le devis passe automatiquement au statut **À facturer**.

> [!NOTE]
> Vous n'avez pas à attendre la réalisation complète pour facturer : un acompte ou une facture partielle sont possibles dès l'acceptation.

## Une fois complété, générer une facture

Sur un devis accepté ou à facturer, cliquez sur **Facturer**. La fenêtre **Créer une facture** propose trois choix :

| Onglet | Usage |
|---|---|
| **Tout facturer** | Facture tout ce qui reste à facturer |
| **Facture partielle** | Choisissez la quantité à facturer ligne par ligne (les quantités livrées sont indiquées) |
| **Acompte** | Saisissez le montant de l'acompte |

[![La fenêtre Créer une facture](images/facturer.png)](images/facturer.png)

Le résumé indique ce qui sera facturé, ce qui l'est déjà et ce qui restera à facturer. Cliquez sur **Créer la facture** : une facture en brouillon s'ouvre avec les lignes du devis, rien à ressaisir. Vérifiez-la, puis sauvegardez.

Les acomptes déjà facturés sont automatiquement déduits des factures suivantes. Le devis passe au statut **Terminé** quand ses factures, une fois envoyées, couvrent la totalité du devis. Si une partie ne sera jamais facturée, utilisez **Clôturer le devis sans facturer** dans le menu **…**.

> [!TIP]
> Pour plusieurs devis d'un même client, sélectionnez-les dans la liste et utilisez **Créer une facture groupée**.

Les factures se trouvent dans **Ventes › Factures**. Elles s'envoient comme les devis (**Envoyer** › **Envoyer par email...**). Le numéro définitif de la facture est attribué à l'envoi, et une facture envoyée n'est plus modifiable. Si la facturation électronique est activée, la facture est aussi transmise sur la plateforme de facturation électronique.

## Compléter (payer) une facture

Une facture envoyée est **en attente de paiement**. Elle apparaît dans l'onglet **Envoyés** tant que son échéance n'est pas passée, puis dans **Impayés** (la facture affiche alors « en retard de N jours »).

Quand le client paie :

1. Ouvrez la facture et cliquez sur **Enregistrer un paiement**.
2. La fenêtre **Déclarer une opération** est pré-remplie avec le montant restant dû, la facture liée et les comptes. Ajustez la **Date**, le **Montant** (pour un paiement partiel) et la **Référence** (numéro de virement, de chèque…).
3. Sauvegardez.

[![Enregistrer un paiement : l'opération est pré-remplie avec le montant restant dû](images/paiement.png)](images/paiement.png)

Les paiements sont listés dans la section **Paiements** de la facture, et un badge indique le pourcentage payé. Une fois payée à 100 %, la facture passe automatiquement au statut **Terminé**. En cas d'erreur, **Re-ouvrir la facture** la remet en attente de paiement.

[![Une facture payée : statut Terminé et badge « 100 % »](images/facture-payee.png)](images/facture-payee.png)

### Les avoirs

Pour annuler tout ou partie d'une facture envoyée, cliquez sur **Créer un avoir** (**Maj+A**) depuis la facture. L'avoir reprend les lignes de la facture, que vous ajustez. Il se trouve ensuite dans **Ventes › Avoirs** et suit le même cycle qu'une facture : envoi, puis remboursement enregistré avec **Enregistrer un paiement**.
