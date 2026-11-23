# API de gestion de flotte de transport routier

API REST pour gérer une flotte de transport routier : véhicules, trajets, personnel et maintenance.

## Fonctionnalités

- Inscription et connexion avec authentification par jeton
- Gestion des camions et des remorques
- Gestion des pneus, des trajets et des chauffeurs
- Gestion des opérations de maintenance
- Routes protégées et contrôle des accès administrateur
- Architecture séparant routes, contrôleurs, services, modèles et middlewares

## Documentation du backend

Le guide détaillé de l'architecture, de la configuration, des endpoints et des flux métier se trouve dans [docs/BACKEND.md](docs/BACKEND.md). La référence OpenAPI est également disponible dans [openapi.yaml](openapi.yaml) et via `/api-docs` lorsque le serveur est lancé.

## Versionnement du backend

Le backend suit Semantic Versioning indépendamment de l'interface React. Consultez [CHANGELOG.md](CHANGELOG.md) pour les versions et [docs/VERSIONING.md](docs/VERSIONING.md) pour la procédure de tag et de release GitHub.

## Technologies

- Node.js et Express
- MongoDB et Mongoose
- JSON Web Token
- Jest

## Prérequis

- Node.js et npm
- MongoDB, en local ou accessible par URI

## Installation

```bash
git clone https://github.com/yassminejabal/API-de-Gestion-de-Flotte-de-Transport-Routier.git
cd API-de-Gestion-de-Flotte-de-Transport-Routier
npm install
```

Créez un fichier `.env` à la racine du projet :

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fleet_db
```

`MONGO_URI` est facultative si MongoDB est disponible en local avec cette adresse par défaut.

## Démarrer l’API

```bash
node server.js
```

L’API écoute par défaut sur `http://localhost:5000`.

## Routes

| Préfixe | Ressource |
| --- | --- |
| `/api/auth` | Inscription, connexion et accès administrateur |
| `/api/camions` | Camions |
| `/api/remorques` | Remorques |
| `/api/pneus` | Pneus |
| `/api/trajets` | Trajets |
| `/api/chauffeurs` | Chauffeurs |
| `/api/maintenance` | Maintenance |

Les opérations disponibles et leurs autorisations dépendent des routes de chaque ressource. Les routes protégées nécessitent une authentification et, selon la ressource, un accès administrateur.

## Tests

```bash
npm test
```

## Dépôt

[github.com/yassminejabal/API-de-Gestion-de-Flotte-de-Transport-Routier](https://github.com/yassminejabal/API-de-Gestion-de-Flotte-de-Transport-Routier)
