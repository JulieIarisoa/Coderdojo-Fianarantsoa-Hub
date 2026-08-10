# 🇲🇬 Coderdojo Fianarantsoa Hub

[![CI Status](https://github.com/Tanguy1902/Coderdojo-Fianarantsoa-Hub/actions/workflows/ci.yml/badge.svg)](https://github.com/Tanguy1902/Coderdojo-Fianarantsoa-Hub/actions/workflows/ci.yml)

Plateforme web de la communauté **Coderdojo Fianarantsoa**, développée en Next.js (App Router), Tailwind CSS et Firebase.

---

## 👥 Travail d'Équipe & Méthodologie Agile (Kanban sur Trello)

Ce projet est géré en **Agile Kanban via Trello** avec un pipeline **CI/CD GitHub Actions**.

> 📖 **[Consulter le Guide Méthodologique Kanban avec Trello (KANBAN_GUIDE.md)](KANBAN_GUIDE.md)** pour connaître :
> - La structure des colonnes Trello (`Backlog`, `Ready`, `In Progress`, `In Review`, `Done`)
> - L'intégration du Power-Up GitHub sur Trello
> - La stratégie de branches (GitHub Flow)
> - Les conventions de commit (`feat:`, `fix:`, `chore:`, etc.)
> - La Definition of Done (DoD) & le processus de Code Review

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
