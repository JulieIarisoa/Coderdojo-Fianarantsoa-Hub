# 🇲🇬 Coderdojo Fianarantsoa Hub

[![CI Status](https://github.com/Tanguy1902/Coderdojo-Fianarantsoa-Hub/actions/workflows/ci.yml/badge.svg)](https://github.com/Tanguy1902/Coderdojo-Fianarantsoa-Hub/actions/workflows/ci.yml)

Plateforme web de la communauté **Coderdojo Fianarantsoa**, développée en Next.js (App Router), Tailwind CSS et Firebase.

---

## 👥 Travail d'Équipe & Méthodologie Agile (Kanban sur Trello)

Ce projet est géré en **Agile Kanban via Trello** avec un pipeline **CI/CD GitHub Actions**.

> 📖 **Guides & Règlement pour l'équipe :**
> - **[Charte & Règlement de l'Équipe (TEAM_RULES.md)](TEAM_RULES.md)** : Les 6 règles d'or obligatoires pour tous les développeurs.
> - **[Guide Méthodologique Kanban avec Trello (KANBAN_GUIDE.md)](KANBAN_GUIDE.md)** : Structure des colonnes, règles Trello et Git Flow.
> - **[Guide des Normes de Commit (COMMIT_CONVENTIONS.md)](COMMIT_CONVENTIONS.md)** : Standard Conventional Commits (`feat:`, `fix:`, `docs:`, etc.).

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement du serveur de développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 🧪 Validation & Qualité du Code

Avant d'ouvrir une Pull Request, assurez-vous d'exécuter la commande de validation locale :

```bash
npm run validate
```
Cette commande exécute le typage TypeScript (`tsc --noEmit`) ainsi que le linter ESLint (`eslint`).

---

## 🛠️ Scripts disponibles

- `npm run dev` : Lance l'environnement de développement local.
- `npm run build` : Compile l'application pour la production.
- `npm run typecheck` : Vérifie la validité des types TypeScript.
- `npm run lint` : Analyse le code avec ESLint.
- `npm run validate` : Exécute le typecheck et le linting combinés.
