# Prendre en main L'inventaire

Quelques principes s'appliquent à tous les documents de L'inventaire, qu'il s'agisse d'un devis, d'un article, d'un contact ou d'un élément de stock.

## Tout est modifiable

Chaque document s'ouvre en lecture. Pour le changer, cliquez sur **Modifier** (touche **E**), faites vos changements puis cliquez sur **Sauvegarder** (**Ctrl+S**) ou **Annuler**.

La barre en haut de chaque document propose aussi :

- **Dupliquer** (**Ctrl+D**) : crée une copie du document, pratique pour repartir d'un devis existant.
- **Copier le lien** (**Maj+U**) : pour partager le document avec un collègue.
- **Précédent / Suivant** (touches **K** / **J**) : pour passer d'un document à l'autre dans la liste.
- Le menu **…** › **Supprimer**.

> [!WARNING]
> Pour protéger vos documents légaux, certains contenus se verrouillent : un devis accepté, une facture ou un avoir envoyé et un document terminé ne peuvent plus être modifiés sur le fond. Vous pouvez toujours les commenter, les étiqueter ou les assigner.
>
> Une facture ou un avoir qui n'est plus en brouillon (facturation électronique) ne peut plus repasser en brouillon, être supprimé ni être restauré à une version antérieure. Pour corriger une facture envoyée, créez un avoir.

**Supprimer n'efface rien définitivement** : un document supprimé est masqué des listes et affiche le badge « Document supprimé » avec un bouton **Restaurer**. Pour retrouver les documents supprimés d'une liste, ajoutez le filtre « Est archivé ».

## Tout est historisé

Chaque modification est enregistrée : qui a changé quoi, et quand. L'historique se trouve dans la section **Activité**, en bas de chaque document (« a créé ce document », « a modifié … », « a restauré ce document »…). Pour la référence et le statut, l'ancienne et la nouvelle valeur sont affichées.

Vous pouvez revenir dans le temps :

1. Survolez un évènement de l'activité et cliquez sur l'icône en forme d'œil (**Ouvrir cette version**).
2. Le document s'affiche tel qu'il était à ce moment-là (« Vous consultez une version antérieure »).
3. Cliquez sur **Restaurer cette version** pour la remettre en place, ou sur **Revenir à la dernière version**. La restauration n'est pas proposée pour une facture ou un avoir qui n'est plus en brouillon.

## Commenter et être notifié

[![La section Activité d'un devis : historique des changements de statut et commentaire](images/activite.png)](images/activite.png)

La section **Activité** sert aussi à échanger avec votre équipe, directement sur le document concerné :

- **Commenter** : écrivez dans « Ajouter un commentaire... » puis cliquez sur **Envoyer**.
- **Mentionner** : tapez **@** suivi du nom d'un collègue, dans un commentaire ou dans les notes. Il reçoit une notification.
- **Suivre un document** : cliquez sur **Être notifié** pour être prévenu des changements de statut et des nouveaux commentaires. Les avatars à côté listent les utilisateurs abonnés ; vous pouvez en ajouter ou en retirer.
- **Assigner** : chaque document a un sélecteur d'utilisateurs en haut à droite. Les personnes assignées sont notifiées et abonnées automatiquement.

Les notifications arrivent dans le menu **Notifications** (avec un compteur de non lues) et par email, regroupées toutes les 5 minutes. Depuis le menu **…** de la page, vous pouvez afficher les **non lus uniquement** ou **tout marquer comme lu**.

> [!TIP]
> Dans **Compte › Notifications**, choisissez les évènements pour lesquels vous voulez toujours être notifié, même sans suivre le document : devis signé, devis refusé, commentaire ajouté.

## Organiser : étiquettes, champs personnalisés et fichiers

- **Étiquettes** : chaque document peut recevoir des étiquettes de couleur (en haut du document). Créez-les dans **Paramètres › Étiquettes**. Elles servent ensuite à filtrer vos listes.
- **Champs personnalisés** : ajoutez vos propres informations (texte, nombre, date, liste de choix, fichiers…) aux contacts, articles, documents de vente et d'achat, services et stock, dans **Paramètres › Champs personnalisés**.
- **Notes et documents internes** : chaque document a une zone de notes et de fichiers réservée à votre équipe, jamais visible par le client.

## Rechercher et filtrer

Chaque liste a une barre de recherche (**Ctrl+F**). Tapez simplement un mot pour chercher partout.

Le bouton en forme d'entonnoir (**Ctrl+Maj+F**) active les **filtres avancés** : en tapant, L'inventaire vous propose les champs puis les valeurs possibles, et écrit le filtre pour vous sous la forme `champ:valeur`. Le nom du champ est son libellé en minuscules, sans accents, les espaces remplacés par `_`. Quelques exemples dans la liste des devis :

| Exemple | Signification |
|---|---|
| `boulangerie` | Tout ce qui contient « boulangerie » |
| `total_ht:>=1000` | Total HT supérieur ou égal à 1 000 |
| `date_d_emission:2026-01-01->2026-03-31` | Émis entre deux dates |
| `champ:a,b` | Valeur « a » ou « b » |
| `!champ:a` | Tout sauf la valeur « a » |
| `champ:""` | Champ vide |

[![Les filtres avancés proposent les champs au fil de la frappe](images/recherche.png)](images/recherche.png)

Les filtres sont conservés dans l'adresse de la page : vous pouvez la garder en favori ou la partager. Le bouton **Exporter** en bas des listes télécharge les résultats.

## Raccourcis clavier

| Raccourci | Action |
|---|---|
| Ctrl+K | Rechercher un document ou une action (dans une liste : actions sur la sélection) |
| Ctrl+F / Ctrl+Maj+F | Rechercher dans la liste / filtres avancés |
| Maj+A | Ajouter (articles, contacts…) |
| C | Créer un document dans les listes de devis et factures |
| E | Modifier le document |
| Ctrl+S | Sauvegarder |
| Ctrl+D | Dupliquer |
| J / K | Document suivant / précédent |
| Échap | Retour ou fermer |

Sur Mac, remplacez **Ctrl** par **⌘**.
