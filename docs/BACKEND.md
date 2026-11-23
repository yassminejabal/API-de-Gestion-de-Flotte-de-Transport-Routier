# Documentation du backend

## 1. Présentation

Ce dépôt contient une API REST Node.js/Express pour la gestion d'une flotte de transport routier. Elle couvre les comptes et rôles, les camions, remorques, pneus, chauffeurs, trajets, alertes de maintenance et documents d'ordre de mission.

Le backend utilise MongoDB avec Mongoose pour les données, JWT pour l'authentification, Redis pour limiter les tentatives sur les routes d'authentification et un stockage compatible S3 (MinIO par défaut) pour les ordres de mission PDF.

## 2. Technologies et composants

| Composant | Rôle |
| --- | --- |
| Node.js / Express 5 | Serveur HTTP et routage |
| MongoDB / Mongoose | Persistance des comptes et des ressources de flotte |
| JSON Web Token | Authentification Bearer |
| bcryptjs | Hachage des mots de passe |
| Redis | Stockage du compteur de limitation des requêtes d'authentification |
| MinIO / AWS SDK S3 | Stockage des ordres de mission PDF et URL pré-signées |
| PDFKit | Génération des ordres de mission |
| Swagger UI / OpenAPI | Référence interactive de l'API |
| Jest / Supertest | Tests unitaires et tests HTTP |

## 3. Architecture

Le code applicatif se trouve dans `src/`.

| Répertoire/fichier | Responsabilité |
| --- | --- |
| `src/app.js` | Création Express, JSON, Swagger UI et montage des routes/middlewares |
| `server.js` | Chargement de l'environnement, initialisation de MongoDB et écoute HTTP |
| `src/routes/` | Déclaration des chemins HTTP et des contrôles d'accès par route |
| `src/controllers/` | Adaptation entre la requête/réponse HTTP et la logique métier |
| `src/services/` | Règles métier, orchestration des modèles et intégrations externes |
| `src/models/` | Schémas et modèles Mongoose |
| `src/middlewares/` | Authentification, autorisation, limitation de débit et gestion des erreurs |
| `src/config/` | Connexions MongoDB, Redis et S3/MinIO |
| `src/utils/` | Erreurs applicatives et fonctions utilitaires |

Le chemin nominal d'une requête est : route -> middleware d'accès -> contrôleur -> service -> modèle/infrastructure -> réponse JSON. Les erreurs propagées avec `next(error)` sont traitées par `error.middleware.js`.

## 4. Installation et démarrage local

### Prérequis

- Node.js compatible avec les dépendances du projet et npm.
- Docker Desktop si les services d'infrastructure sont lancés avec Compose, ou des services MongoDB/Redis/MinIO accessibles autrement.

### Installer les dépendances

```bash
npm install
```

### Démarrer les services d'infrastructure

Le fichier `docker-compose.yml` démarre MongoDB, Redis et MinIO :

```bash
docker compose up -d
```

Ports exposés par la configuration Compose : MongoDB `27017`, Redis `6379`, MinIO S3 `9000`, console MinIO `9001`. Les volumes Docker conservent les données MongoDB et MinIO.

Le bucket MinIO utilisé par défaut est `fleettrack-documents`. Il doit exister avant la génération du premier ordre de mission; le service applicatif ne le crée pas automatiquement.

### Configurer l'environnement

Créer un fichier `.env` à la racine du dépôt. Les valeurs suivantes correspondent aux noms lus dans le code :

| Variable | Valeur par défaut / utilité |
| --- | --- |
| `PORT` | `5000`, port HTTP du serveur |
| `MONGO_URI` | `mongodb://localhost:27017/fleet_db` |
| `JWT_SECRET` | Secret de signature JWT; la valeur de secours dans le code est temporaire et ne doit pas être utilisée en production |
| `JWT_EXPIRES_IN` | `1d`, durée de validité du JWT |
| `REDIS_URL` | `redis://127.0.0.1:6379` |
| `AWS_REGION` | `us-east-1` |
| `MINIO_ENDPOINT` | `http://127.0.0.1:9000` |
| `MINIO_ACCESS_KEY` | `minioadmin` dans la configuration de développement Compose |
| `MINIO_SECRET_KEY` | `minioadminpassword` dans la configuration de développement Compose |
| `MINIO_BUCKET` | `fleettrack-documents` |
| `EMAIL_USER` | Compte Gmail utilisé par l'utilitaire d'envoi d'e-mail |
| `EMAIL_PASS` | Mot de passe d'application associé à `EMAIL_USER` |

Exemple de configuration locale :

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fleet_db
JWT_SECRET=remplacer-par-un-secret-long-et-aleatoire
JWT_EXPIRES_IN=1d
REDIS_URL=redis://127.0.0.1:6379
AWS_REGION=us-east-1
MINIO_ENDPOINT=http://127.0.0.1:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadminpassword
MINIO_BUCKET=fleettrack-documents
```

Les paramètres MinIO par défaut sont réservés au développement local. En production, définir des secrets propres à l'environnement et ne pas les versionner.

### Lancer le serveur

```bash
node server.js
```

Par défaut, l'API est disponible à `http://localhost:5000`. La route `GET /` renvoie un texte de disponibilité simple. L'interface Swagger est disponible à `http://localhost:5000/api-docs`.

## 5. Authentification et autorisations

Les routes protégées attendent le JWT dans l'en-tête HTTP suivant :

```http
Authorization: Bearer <token>
```

Le jeton contient l'identifiant MongoDB de l'utilisateur. Le middleware le vérifie, recharge le compte et le place sur `req.user`. Les rôles définis par le modèle sont `ADMIN` et `CHAUFFEUR`; en l'absence de rôle fourni, le modèle attribue `CHAUFFEUR`.

Les mots de passe sont hachés par un hook Mongoose avec bcrypt avant l'enregistrement. Le champ `password` n'est pas sélectionné dans les lectures ordinaires.

Le middleware `restrictToAdmin` exige le rôle `ADMIN`. La route d'authentification est limitée à 10 requêtes par fenêtre de 15 minutes, avec Redis comme stockage du compteur.

**Attention à l'inscription actuelle :** `POST /api/auth/register` est publique et transmet le champ `role` fourni dans la requête au modèle. En l'état, un appelant peut donc demander la création d'un compte `ADMIN`. Pour une mise en production, l'attribution du rôle administrateur doit être contrôlée par une procédure distincte et non par cette inscription publique.

## 6. API et accès

Toutes les routes ci-dessous sont préfixées par les URL indiquées. Les corps de requête et schémas détaillés sont disponibles dans [openapi.yaml](../openapi.yaml); Swagger UI est servi par `/api-docs`. Les noms et casses des chemins reflètent le routage actuel.

### Authentification — `/api/auth`

| Méthode et chemin | Accès | Fonction |
| --- | --- | --- |
| `POST /register` | Public | Créer un compte et recevoir un JWT |
| `POST /login` | Public, limité par Redis | Vérifier les identifiants et recevoir un JWT |
| `GET /Admin` | Admin | Retourner l'utilisateur authentifié |

### Camions — `/api/camions`

Toutes les opérations requièrent un utilisateur `ADMIN`.

| Méthode et chemin | Fonction |
| --- | --- |
| `POST /` | Créer un camion |
| `GET /` | Lister les camions |
| `PUT /:id` | Modifier un camion |
| `DELETE /:id` | Archiver un camion |

### Remorques — `/api/remorques`

Toutes les opérations requièrent un utilisateur `ADMIN`.

| Méthode et chemin | Fonction |
| --- | --- |
| `POST /` | Créer une remorque |
| `GET /` | Lister les remorques |
| `PUT /:id` | Modifier une remorque |
| `DELETE /:id` | Archiver une remorque |

### Pneus — `/api/pneus`

Toutes les opérations requièrent un utilisateur `ADMIN`.

| Méthode et chemin | Fonction |
| --- | --- |
| `POST /` | Créer un pneu |
| `GET /` | Lister les pneus |
| `PUT /:id/assigner` | Affecter un pneu à un camion |
| `PUT /:id` | Modifier un pneu |
| `DELETE /:id` | Archiver un pneu |

### Trajets — `/api/trajets`

Toutes les routes exigent un JWT. La création et la liste globale exigent en plus `ADMIN`; les actions de cycle de vie sont prévues pour le chauffeur affecté.

| Méthode et chemin | Accès | Fonction |
| --- | --- | --- |
| `GET /mes-trajets` | Authentifié | Lister les trajets du compte connecté |
| `POST /` | Admin | Planifier un trajet et affecter les ressources |
| `GET /` | Admin | Lister tous les trajets non archivés |
| `GET /:id` | Authentifié | Consulter un trajet |
| `PATCH /:id/demarrer` | Authentifié; chauffeur affecté | Démarrer un trajet avec le kilométrage de départ |
| `PATCH /:id/terminer` | Authentifié; chauffeur affecté | Terminer le trajet et saisir le kilométrage/consommation |
| `GET /:id/ordre-mission` | Authentifié | Télécharger directement un PDF d'ordre de mission |

### Chauffeurs — `/api/chauffeurs`

Toutes les opérations requièrent un utilisateur `ADMIN`.

| Méthode et chemin | Fonction |
| --- | --- |
| `POST /` | Créer un chauffeur |
| `GET /` | Lister les chauffeurs |
| `PATCH /:id/suspendre` | Basculer l'état de suspension |
| `PUT /:id` | Modifier un chauffeur |
| `DELETE /:id` | Archiver un chauffeur |

### Maintenance — `/api/maintenance`

| Méthode et chemin | Accès | Fonction |
| --- | --- | --- |
| `GET /alertes` | Authentifié | Retourner les alertes camion et pneu |

### V2 — `/api/v2`

| Méthode et chemin | Accès | Fonction |
| --- | --- | --- |
| `GET /trips/:id/mission-order-url` | Authentifié; admin ou chauffeur affecté selon le contrôleur | Générer ou réutiliser l'ordre de mission stocké, puis retourner une URL de téléchargement pré-signée |
| `GET /analytics/tires/health-matrix` | Public dans le routage actuel | Retourner la matrice d'état de santé des pneus |

L'endpoint d'analytics est bien monté par l'application mais n'est pas présent dans la spécification OpenAPI actuelle. Vérifier la route réelle avant de considérer OpenAPI comme un inventaire exhaustif.

## 7. Modèle de données et règles métier

Les modèles Mongoose ajoutent généralement `createdAt` et `updatedAt`.

### Utilisateur / chauffeur

Les comptes chauffeur sont stockés dans le modèle `User`, avec le rôle `CHAUFFEUR`; il n'y a pas de collection dédiée aux chauffeurs dans le flux principal. Les propriétés prévues comprennent `nom`, `prenom`, `email`, `telephone`, `password`, `role`, `isSuspended` et `actif`. Les adresses e-mail sont uniques.

### Camion

Un camion contient notamment `immatriculation` (unique), `marque`, `modele`, `kilometrageActuel`, `statut`, `alerteMaintenance`, `pneus` et `estArchive`. Les statuts déclarés sont `DISPONIBLE`, `EN_TRAJET` et `EN_MAINTENANCE`.

### Remorque

Une remorque contient `immatriculation` (unique), `type`, `capaciteMaxKg`, `statut`, `alerteMaintenance` et `estArchive`. Les statuts déclarés sont les mêmes que ceux du camion.

### Pneu

Le schéma déclare `numeroSerie` (unique), `position`, `kilometrageActuel`, `seuilUsureKm`, `alerteRemplacement`, `camion` et `estArchive`.

### Trajet

Un trajet comprend `pointDepart`, `pointArrivee`, `marchandise`, `dateDepartPrevue`, `dateArriveePrevue`, et les références `chauffeur`, `camion` et `remorque`. Il stocke aussi le statut, les kilométrages départ/arrivée, la consommation de carburant, son coût, les remarques, l'indicateur d'archivage et les métadonnées du document de mission.

Les statuts de trajet sont `A_FAIRE`, `EN_COURS`, `TERMINE` et `ANNULE`.

### Cycle de vie d'un trajet

1. À la planification, le service vérifie que le camion, la remorque et le chauffeur existent et sont disponibles, puis refuse une affectation si l'une de ces ressources est déjà engagée dans un trajet actif ou planifié.
2. Le camion et la remorque sont marqués `EN_TRAJET` après création.
3. Le chauffeur assigné démarre le trajet avec un kilométrage de départ positif; le statut devient `EN_COURS`.
4. Pour terminer, il faut un kilométrage d'arrivée supérieur au kilométrage de départ et une consommation strictement positive. Le statut devient `TERMINE`.
5. Le coût carburant est calculé dans le service avec un tarif codé en dur de 13 par litre. La distance parcourue met à jour le kilométrage du camion et l'usure des pneus; la remorque redevient `DISPONIBLE`.

Le schéma autorise également `ANNULE`, mais les routes de trajet actuelles ne déclarent pas d'opération d'annulation.

## 8. Ordres de mission et stockage

Le service PDF produit un document PDFKit contenant l'identité du chauffeur, les ressources affectées et les informations d'itinéraire.

- `GET /api/trajets/:id/ordre-mission` renvoie directement le PDF en pièce jointe.
- `GET /api/v2/trips/:id/mission-order-url` vérifie le rôle admin ou l'affectation du chauffeur. Si le document n'a pas encore été stocké, il est généré à la demande puis téléversé dans le bucket configuré.
- L'URL pré-signée de téléchargement expire au bout de 900 secondes (15 minutes). MongoDB conserve le bucket, la clé S3, la taille et la date de génération.

MinIO est configuré en mode path-style et utilise l'endpoint de développement local par défaut. Le bucket doit exister et être accessible avec les identifiants fournis.

## 9. Réponses et erreurs

Les réponses de succès utilisent généralement `status: "success"` et une propriété `data`. Les réponses d'authentification renvoient le JWT à la racine sous `token`. Certaines réponses ajoutent un message ou un nombre de résultats.

Le gestionnaire global retourne une forme simple :

```json
{
  "status": "error",
  "message": "Description de l'erreur"
}
```

Les contrôles d'accès retournent notamment `401` si le jeton manque ou est invalide et `403` si le rôle requis manque. Les erreurs métier utilisent les codes `400`, `404` et `409` selon le cas; une erreur non classée peut devenir une réponse `500`.

## 10. Tests et couverture

Scripts disponibles :

```bash
npm test
npm run test:coverage
```

Les tests sont principalement sous `tests/unit/` et couvrent les services, contrôleurs, erreurs/middlewares, stockage et PDF. La configuration Jest vise les fichiers JavaScript de `src/`, exclut notamment les configurations et définit un seuil global de couverture de 30 % pour les instructions, branches, fonctions et lignes.

## 11. Écarts et vérifications à faire

Cette section distingue la documentation du comportement réellement vérifié dans le code. Ces points devraient être corrigés ou confirmés avant de s'appuyer sur eux en production :

- **Création de comptes administrateur :** l'inscription publique accepte actuellement le rôle demandé dans le corps de la requête.
- **Consultation par identifiant :** le contrôleur de `GET /api/trajets/:id` appelle le service sans lui transmettre `req.user`, alors que le service utilise l'utilisateur pour contrôler l'accès. Cette route risque donc d'échouer pour un trajet existant.
- **Suspension chauffeur :** le schéma `User` déclare `isSuspended`, tandis que le contrôle de disponibilité du trajet consulte `estSuspendu`. Vérifier et unifier le nom du champ.
- **Champs d'usure des pneus :** le schéma déclare `seuilUsureKm` et `alerteRemplacement`, mais le service trajet et le service maintenance consultent aussi `kilometrageMax` et `statut`. Le calcul des alertes d'usure et leur persistance peuvent ne pas correspondre au schéma.
- **Champs de vidange :** le service trajet consulte `dernierKilometrageVidange` et `periodiciteVidangeKm`, absents du schéma camion actuel; il utilise des valeurs de repli dans ce calcul.
- **Documentation OpenAPI :** l'analytics V2 est absent du fichier OpenAPI alors qu'il est monté par l'application. Les exemples et codes de réponse de la spécification doivent rester alignés avec les contrôleurs réels.
- **Ordre de démarrage :** `server.js` charge l'environnement, attend une connexion Redis et MongoDB, puis monte l'application et ouvre le port HTTP. Le limiteur Redis attend lui aussi que la connexion soit prête avant de charger ses scripts.

## 12. Liens utiles

- [README du projet](../README.md)
- [Spécification OpenAPI](../openapi.yaml)
- [Configuration Docker Compose](../docker-compose.yml)
- [Configuration Jest](../jest.config.js)`
