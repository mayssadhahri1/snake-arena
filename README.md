# 🐍 Snake Arena

Jeu **Snake** dans le navigateur avec un **classement en ligne**, servi par une API **Node.js / Express**, conteneurisé avec **Docker** et livré par un pipeline **Jenkins** (et GitHub Actions).

![Node](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-pipeline-D24939?logo=jenkins&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)

## Fonctionnalités

- Jeu fluide sur `<canvas>` : niveaux, vitesse progressive, pause, record personnel
- Jouable au clavier (flèches, ZQSD, WASD) et sur mobile (croix directionnelle)
- Classement Top 10 enregistré côté serveur (fichier JSON persistant)
- API REST validée : pseudo filtré, score borné, erreurs JSON propres
- Logique du jeu séparée de l'affichage → **testée unitairement**
- 18 tests automatisés (logique + API) avec le test runner natif de Node

## Architecture

```
snake-arena/
├── public/            # Front-end (HTML, CSS, JS modules)
│   ├── logic.js       # Règles du jeu (pures, sans DOM)
│   └── game.js        # Rendu canvas, contrôles, appels API
├── server/
│   ├── app.js         # Application Express (routes, erreurs)
│   ├── scores.js      # Stockage et validation des scores
│   └── index.js       # Démarrage du serveur
├── test/              # Tests unitaires et d'intégration
├── Dockerfile         # Build multi-étapes, utilisateur non root, healthcheck
├── docker-compose.yml
├── Jenkinsfile        # Pipeline CI/CD
└── .github/workflows/ci.yml
```

## API

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/health` | État du service |
| `GET` | `/api/scores?limit=10` | Meilleurs scores (1 à 50) |
| `POST` | `/api/scores` | Ajoute un score `{ "name": "Mayssa", "score": 120 }` |

## Lancer le projet

**En local**

```bash
npm install
npm start          # http://localhost:3000
npm test
```

**Avec Docker**

```bash
docker compose up -d --build   # http://localhost:3000
```

## Pipeline CI/CD

```
Checkout → Install & Test → Build image → Scan Trivy → Smoke test → Push Docker Hub
```

- **Jenkins** : les tests tournent dans un conteneur `node:20-alpine`, l'image est scannée par Trivy (échec si faille critique), un conteneur de test vérifie `/api/health`, puis l'image est poussée sur Docker Hub depuis `main`. Il faut créer l'identifiant `dockerhub-credentials` dans Jenkins.
- **GitHub Actions** : tests sur Node 20 et 22, build Docker, smoke test et scan Trivy à chaque push.

## Pistes d'amélioration

- Base de données (MongoDB ou PostgreSQL) à la place du fichier JSON
- Mode multijoueur en temps réel avec WebSocket
- Déploiement sur Kubernetes

---

Réalisé avec l'aide d'un assistant IA.

## Auteure

**Mayssa Dhahri** — élève-ingénieure en Génie Logiciel, École Polytechnique de Sousse
[LinkedIn](https://www.linkedin.com/in/mayssa-dhahri-38b1373bb/) · [GitHub](https://github.com/mayssadhahri1)
