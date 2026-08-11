# 📜 Guide des Normes de Commit (Conventional Commits) — Coderdojo Hub

Pour maintenir un historique Git propre, lisible et compréhensible par tous les membres de l'équipe, nous appliquons la norme internationale **Conventional Commits**.

---

## 🎯 1. Structure d'un Message de Commit

Chaque message de commit doit être rédigé sous le format suivant :

```text
<type>(<scope optionnel>): <description courte en minuscules>

[corps optionnel : explications détaillées si nécessaire]

[pied de page optionnel : référence Trello ou Breaking Changes]
```

---

## 🏷️ 2. Types de Commits Autorisés

| Type | Utilisation & Définition | Exemple |
| :--- | :--- | :--- |
| `feat` | Nouvelle fonctionnalité pour l'utilisateur final | `feat(auth): ajout de la connexion Google Firebase` |
| `fix` | Correction d'un bug dans l'application | `fix(secret-friend): correction du délai du compte à rebours` |
| `docs` | Modification de la documentation (README, guides, etc.) | `docs(commit): ajout du guide des normes de commit` |
| `style` | Changements de style (espaces, virgules, linter) sans impact sur la logique | `style(tailwind): réalignement des marges sur les cartes mentor` |
| `refactor` | Modification du code qui ne corrige pas de bug et n'ajoute pas de feat | `refactor(firestore): optimisation des requêtes de liste` |
| `perf` | Amélioration des performances de rendu ou de chargement | `perf(images): optimisation du composant Next/Image` |
| `test` | Ajout ou correction de tests | `test(auth): ajout des tests unitaires du hook useAuth` |
| `chore` | Tâches de maintenance, dépendances, configuration du projet | `chore(deps): mise à jour des packages Firebase` |
| `ci` | Modifications des scripts et workflows GitHub Actions | `fix(ci): mise à jour de la version Node.js dans le workflow` |

---

## 🎯 3. Scopes Recommandés pour Coderdojo Hub

Le `scope` indique la partie du projet impactée par le changement. Voici les scopes standard du projet :

- **`auth`** : Authentification, session, rôles utilisateurs.
- **`secret-friend`** : Module Secret Friend (tirage, messages anonymes).
- **`mentors`** : Gestion des mentors et profils.
- **`badges`** : Système de badges et récompenses.
- **`firebase`** : Configuration, Firestore, règles de sécurité.
- **`ui`** : Composants graphiques réutilisables (boutons, modales, etc.).
- **`ci`** : GitHub Actions, Workflows.
- **`deps`** : Fichiers `package.json` et `package-lock.json`.

---

## ✍️ 4. Règles de Rédaction

1. **Utiliser l'impératif / présent** : Écrivez *"ajout du bouton"* ou *"ajouter le bouton"* au lieu de *"j'ai ajouté le bouton"*.
2. **Minuscules uniquement** : La description commence par une minuscule et ne se termine **pas** par un point.
3. **Clarté et Concision** : La première ligne doit faire moins de 72 caractères.
4. **Référence Trello** : Ajoutez le lien de la carte Trello en fin de message si pertinent.

---

## ❌ Exemples Bon vs Mauvais

| ❌ À Ne PAS Faire (Mauvais) | ✅ Ce qu'il faut Faire (Bon) |
| :--- | :--- |
| `fix bug` | `fix(auth): correction de la redirection après connexion` |
| `update secret friend page.` | `feat(secret-friend): ajout de la modale de tirage au sort` |
| `J'ai modifié la couleur du bouton admin` | `style(ui): changement de couleur du bouton d'action admin` |
| `wip` | `refactor(firestore): simplification du hook useSecretFriend` |

---

## 💥 5. Gérer les Ruptures de Compatibilité (Breaking Changes)

Si une modification rompt la compatibilité existante (ex: modification de la structure Firestore), ajoutez un point d'exclamation `!` après le type ou mentionnez `BREAKING CHANGE:` en pied de page :

```text
feat(firebase)!: restructuration de la collection secret_friends

BREAKING CHANGE: La clé mentor_id est remplacée par mentorRef dans Firestore.
```
