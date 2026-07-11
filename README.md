# Fasrord Monorepo

Arborescence cible du projet Fasrord, pensée pour séparer clairement le frontend Next.js, le backend FastAPI, les migrations, les tests et l'infrastructure.

```text
fasrod/
├─ apps/
│  ├─ frontend/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  ├─ components/
│  │  │  ├─ features/
│  │  │  ├─ lib/
│  │  │  └─ styles/
│  │  ├─ public/
│  │  ├─ tests/
│  │  ├─ package.json
│  │  └─ tsconfig.json
│  └─ backend/
│     ├─ app/
│     │  ├─ api/
│     │  │  └─ v1/
│     │  ├─ core/
│     │  ├─ db/
│     │  ├─ models/
│     │  ├─ schemas/
│     │  ├─ services/
│     │  ├─ security/
│     │  └─ main.py
│     ├─ alembic/
│     │  └─ versions/
│     ├─ tests/
│     ├─ pyproject.toml
│     └─ alembic.ini
├─ packages/
│  └─ shared/
├─ infra/
│  └─ docker/
├─ docker-compose.yml
├─ .env.example
└─ README.md
```

Principes appliqués:

- `apps/frontend` et `apps/backend` contiennent chacun une application autonome.
- `app/api/v1` permet de versionner l'API dès le départ.
- `app/models`, `app/schemas` et `app/services` séparent persistance, validation et logique métier.
- `alembic/versions` isole les migrations pour PostgreSQL.
- `infra/docker` pourra accueillir des Dockerfiles et scripts d'infrastructure sans polluer les apps.
- `packages/shared` reste disponible si des types ou utilitaires communs deviennent utiles plus tard.

Étapes suivantes prévues:

1. Docker Compose de base.
2. Modèles SQLAlchemy alignés sur le MCD/ERD.
3. Authentification JWT sécurisée côté backend.