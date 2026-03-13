# Receita da Boa

## Overview

"Receita da Boa" is a full-stack recipe management and sharing platform with Google OAuth authentication, role-based access control, and a modern React SPA frontend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: Google OAuth 2.0 (Passport.js) + JWT
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite (SPA)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port auto-assigned)
│   └── receita-da-boa/     # React + Vite frontend SPA (port auto-assigned)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Features

- **Google OAuth only** — no local passwords
- **JWT sessions** — token stored in localStorage, passed as Bearer header
- **Role-based access**: `usuario` and `adm`
  - First user to sign up automatically becomes admin
  - Only admins can create/edit/delete recipes and categories
- **Recipes**: Public browsing, search by name, filter by category
- **Favorites**: Logged-in users can favorite/unfavorite recipes
- **Categories**: Publicly listed, admin-created

## Data Models (Drizzle/Postgres)

- `users` — id, nome, email (unique), google_id (unique), papel (enum: usuario|adm)
- `categorias` — id, nome
- `receitas` — id, titulo, descricao, ingredientes, instrucoes, url_imagem, categoria_id, autor_id
- `favoritos` — id, user_id, receita_id (unique pair)

## API Endpoints

- `GET /api/auth/google` — start Google OAuth
- `GET /api/auth/google/callback` — OAuth callback (redirects to `/?token=JWT`)
- `GET /api/auth/me` — get current user (requires auth)
- `GET /api/receitas` — list recipes (public, supports ?search=&categoriaId=)
- `GET /api/receitas/:id` — get recipe (public)
- `POST/PUT/DELETE /api/receitas` — manage recipes (ADM only)
- `GET/POST /api/favoritos` — user favorites (auth required)
- `DELETE /api/favoritos/:receitaId` — remove favorite (auth required)
- `GET /api/categorias` — list categories (public)
- `POST /api/categorias` — create category (ADM only)

## Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `JWT_SECRET` — random secret for signing JWT tokens

## Google OAuth Setup

In Google Cloud Console, add the authorized redirect URI:
`https://[your-domain]/api/auth/google/callback`

## Development Commands

- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/receita-da-boa run dev` — run frontend
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from OpenAPI spec
