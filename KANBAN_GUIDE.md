# 📋 Guide Méthodologique Agile (Kanban avec Trello) & CI/CD — Coderdojo Hub

Bienvenue dans l'équipe de développement de **Coderdojo Fianarantsoa Hub** !  
Pour maintenir une qualité de code irréprochable et travailler efficacement à plusieurs, nous appliquons la méthodologie **Agile Kanban sur Trello**, couplée à un pipeline **CI/CD automatisé sur GitHub**.

---

## 🎯 1. Principes du Kanban sur Trello

Le Kanban est une méthode visuelle visant à gérer le flux de travail en continu :

1. **Visibilité Totale** : Chaque fonctionnalité, tâche ou correction de bug doit avoir sa **carte Trello** dédiée.
2. **Limitation du Travail en Cours (WIP Limit)** : Max **2 cartes simultanées dans la colonne `In Progress` par développeur**.
3. **Lien Trello ↔ GitHub** : Chaque branche Git et chaque Pull Request doivent faire référence au lien ou au titre de la carte Trello correspondante.

---

## 📊 2. Colonnes du Tableau Trello

Le tableau Trello de l'équipe doit être configuré avec les colonnes suivantes :

| Colonne Trello | Définition & Rôle |
| :--- | :--- |
| **📥 Backlog** | Idées, User Stories et demandes non encore prioritaires. |
| **🎯 Ready (To Do)** | Cartes prêtes à être développées (DoR validée : critères clairs). |
| **🚧 In Progress** | Cartes en cours de développement par un membre de l'équipe. |
| **🔍 In Review (PR)** | Code en cours de revue sur GitHub. Une Pull Request est ouverte. |
| **✅ Done** | Code fusionné sur `main`, validé par la CI et déployé. |

### 🔗 Intégration Trello & GitHub (Power-Up GitHub)
Nous vous recommandons d'activer le **Power-Up GitHub** gratuit dans Trello :
- Attachez les branches et les Pull Requests directement sur les cartes Trello.
- **Automatisations Trello (Butler)** :
  - Lorsqu'une PR est attachée à une carte ➔ Déplacer la carte vers `In Review (PR)`.
  - Lorsqu'une PR est fusionnée ➔ Déplacer automatiquement la carte vers `Done`.

---

## 🌿 3. Stratégie de Branches & Nommage Git (GitHub Flow)

La branche `main` contient le code de production. **Direct Push interdit sur `main` !**

### Convention de Nommage des Branches (avec Référence Trello) :
Nommez vos branches en incluant la tâche Trello :
- **Fonctionnalité** : `feat/trello-nom-fonctionnalite` (ex: `feat/secret-friend-timer`)
- **Bugfix** : `fix/trello-description-bug` (ex: `fix/auth-redirect-loop`)
- **Tâche Technique** : `chore/nom-tache` (ex: `chore/trello-powerup-config`)

```bash
# Exemple de workflow développeur :
git checkout main
git pull origin main
git checkout -b feat/secret-friend-timer
# ... développements ...
git add .
git commit -m "feat(secret-friend): ajout du compte à rebours interactif"
git push origin feat/secret-friend-timer
```

---

## 💬 4. Conventions de Commit (Conventional Commits)

Chaque message de commit doit respecter le format standardisé **Conventional Commits**.

> 📖 **[Consulter le Guide complet des Normes de Commit (COMMIT_CONVENTIONS.md)](COMMIT_CONVENTIONS.md)** pour voir tous les types (`feat`, `fix`, `docs`, `refactor`, `style`, `chore`, `ci`), les scopes recommandés du projet et des exemples concrets.

---

## ⚡ 5. Pipeline CI/CD GitHub Actions

À chaque ouverture ou mise à jour d'une Pull Request, le pipeline `.github/workflows/ci.yml` s'exécute :

1. **TypeScript Typecheck** (`npm run typecheck`)
2. **ESLint Linting** (`npm run lint`)
3. **Build Next.js Turbopack** (`npm run build`)

> ⚠️ Si le voyant est rouge (❌ CI failed), la Pull Request **ne peut pas être fusionnée**. Corrigez le code sur votre branche.

---

## 📜 6. Critères DoR & DoD

### Definition of Ready (DoR) — Sur Trello :
- [ ] La carte Trello contient une description claire (Besoin + Critères d'acceptation).
- [ ] La tâche est assignée à un membre de l'équipe.

### Definition of Done (DoD) — Sur GitHub & Trello :
- [ ] Code propre et respectant les règles d'architecture du projet.
- [ ] `npm run validate` s'exécute sans aucune erreur en local.
- [ ] La PR GitHub est ouverte avec le lien de la carte Trello.
- [ ] Le pipeline CI GitHub Actions est au vert (✔️ Passed).
- [ ] Relecture et approbation d'au moins 1 membre de l'équipe (Code Review).
- [ ] La PR est fusionnée dans `main` et la carte Trello passe dans **Done**.
