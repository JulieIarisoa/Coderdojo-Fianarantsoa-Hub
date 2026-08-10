# 📜 Charte de Développement & Règlement de l'Équipe — Coderdojo Hub

Afin de garantir un code de haute qualité, une organisation fluide et un travail d'équipe harmonieux, **tous les membres de l'équipe de développement doivent respecter scrupuleusement les règles suivantes.**

---

## 🎯 1. Gestion des Tâches (Agile Kanban sur Trello)

1. **Aucune ligne de code sans tâche Trello** : Interdiction de démarrer un développement sans qu'une carte Trello existe et soit déplacée dans la colonne `In Progress`.
2. **Limite du Travail en Cours (WIP Limit = 2)** : Un développeur ne peut pas avoir plus de **2 cartes simultanées** dans la colonne `In Progress`.
3. **Assignation Obligatoire** : Chaque carte en cours doit afficher clairement la photo/nom du développeur responsable.
4. **Mise à jour Continue** : Déplacez votre carte Trello à chaque étape : `Ready` ➔ `In Progress` ➔ `In Review (PR)` ➔ `Done`.

---

## 🌿 2. Règle Git & Gestion des Branches (GitHub Flow)

1. **Interdiction de Push Direct sur `main`** : La branche `main` est le code de production. Tout push direct est bloqué par la plateforme.
2. **Nommage Strict des Branches** : Chaque branche doit refléter la tâche Trello :
   - `feat/nom-fonctionnalite` (ex: `feat/notifications-centre`)
   - `fix/nom-du-bug` (ex: `fix/auth-redirect-loop`)
   - `chore/nom-tache` (ex: `chore/vitest-setup`)
3. **Une Branche = Une Seule Fonctionnalité** : Ne mélangez pas plusieurs sujets sans rapport sur la même branche.

---

## 💬 3. Normes de Commit (Conventional Commits)

1. **Format Obligatoire** : `<type>(<scope optionnel>): <description en minuscules>`
   - `feat`: Nouvelle fonctionnalité
   - `fix`: Correction de bug
   - `docs`: Documentation
   - `style`: Formatage / design CSS sans changement de logique
   - `refactor`: Restructuration du code
   - `chore`: Dépendances, configuration
2. **Interdiction des messages flous** : Les commits du type `"wip"`, `"fix bug"`, `"update"` ou `"test"` sont **strictement interdits**.
3. **Langue** : Rédigez les descriptions de commit en français ou en anglais, mais restez cohérents.

---

## 🧪 4. Validation Locale & Qualité du Code (DoD)

Avant d'ouvrir une Pull Request sur GitHub, le développeur doit **OBLIGATOIREMENT** :

1. Exécuter la commande de validation complète :
   ```bash
   npm run validate
   ```
   *(Aucune erreur TypeScript `tsc` ni avertissement ESLint n'est toléré).*
2. Vérifier que la compilation de production passe :
   ```bash
   npm run build
   ```
3. **Aucune clé secrète dans le code** : Ne jamais commiter de mots de passe, clés d'API privées ou fichiers `.env.local`.

---

## 🔍 5. Processus de Pull Request & Code Review

1. **Compléter le Modèle de PR** : Remplir la description, l'objectif et coller le lien de la carte Trello associée.
2. **Vérification du Pipeline CI/CD** : La PR ne sera examinée que si le voyant GitHub Actions est **VERT (✔️ Passed)**.
3. **Approbation du Tech Lead** : Toute PR nécessite l'approbation (**Approve**) du responsable technique avant fusion dans `main`.
4. **Traiter les Remarques de Revue** : En cas de demande de modification par le reviewer, appliquez les corrections sur votre branche et repushez.

---

## 🤝 6. Communication & Esprit d'Équipe

1. **Transparence** : En cas de blocage technique de plus de 2 heures sur une tâche, signalez-le sur Trello ou sur le canal de discussion d'équipe.
2. **Entraide & Bienséance** : Les revues de code sont bienveillantes et éducatives. Elles visent à faire progresser toute l'équipe.
