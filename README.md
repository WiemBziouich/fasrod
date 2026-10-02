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

## Cloudinary product images

The backend uses the official Cloudinary Python SDK for admin-only image uploads. Configure these variables in the local `.env` file (never commit real values):

```text
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_MAX_UPLOAD_BYTES=5242880
```

The API secret is backend-only and must never be exposed through `NEXT_PUBLIC_*` variables or sent to the browser. The upload endpoint is:

```text
POST /api/v1/admin/produits/{produit_id}/images/upload
```

It requires an authenticated admin, accepts an image multipart field, validates the declared type and file signature, enforces the configured size limit, validates the selected product color/variant, uploads to Cloudinary, then stores the returned HTTPS URL and Cloudinary public ID in `produit_images`. The public ID is retained so deletion can remove both the database record and the remote Cloudinary asset.

Color-level images use `couleur` with `variante_id` left empty, so one image applies to every size of that color. Product-wide images leave both target fields empty. Existing image priority remains exact variant, color, product-wide, then fallback.

No local product images are uploaded automatically. Cloudinary credentials must be configured before using the admin upload form.

## Provision the first local admin

Normal registration always creates a regular client. For local development, provision the first admin from the backend directory:

```powershell
cd apps/backend
python -m scripts.provision_admin
```

The command prompts for the email, telephone, name, and password. Password input is hidden and confirmed twice. It creates exactly one `Client` with `is_admin=true` and `email_verified=true`, using the existing bcrypt helper. It runs in a database transaction and refuses to run when any admin already exists. Never put the password in source code, `.env`, command history, or logs.