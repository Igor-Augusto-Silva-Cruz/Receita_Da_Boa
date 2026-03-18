# Receita da Boa

## Overview

"Receita da Boa" is a Portuguese social recipe network — a full-stack platform with Google OAuth authentication, social features (likes, follows, favorites), a 3-tab feed, recipe reporting, and an admin moderation dashboard.

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
- **Frontend**: React + Vite + Tailwind CSS (SPA), Wouter routing, TanStack Query
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── receita-da-boa/     # React + Vite frontend SPA
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── ...
```

## Features

- **Google OAuth only** — no local passwords, popup-based flow in iframe
- **JWT sessions** — token in localStorage, injected via `window.fetch` interceptor
- **Role-based access**: `usuario` and `adm`
  - First user to sign up automatically becomes admin
  - Any logged-in user can create/edit/delete their OWN recipes
  - ADM can delete any recipe and ban users
- **Feed Tabs**: Recentes (newest), Seguindo (followed authors), Populares (most liked)
- **Social**: Likes (toggle), Follows (toggle), Favorites (bookmark)
- **Recipe Reporting**: Any user can report a recipe; marks it as `isReported`
- **Admin Moderation Dashboard**: View all reported recipes, delete them, ban authors
- **Categories**: Filter recipes by category

## Data Models (Drizzle/Postgres)

- `users` — id, nome, email, google_id, papel (usuario|adm), is_banned
- `categorias` — id, nome
- `receitas` — id, titulo, descricao, ingredientes, instrucoes, url_imagem, categoria_id, autor_id, is_reported, created_at
- `favoritos` — id, user_id, receita_id (unique pair)
- `likes` — id, user_id, receita_id (unique pair)
- `follows` — id, follower_id, following_id (unique pair)
- `comments` — id, user_id, receita_id, texto, created_at
- `reports` — id, user_id, receita_id, motivo, created_at

## API Endpoints

- `GET /api/auth/google` — start Google OAuth
- `GET /api/auth/google/callback` — OAuth callback
- `GET /api/auth/me` — current user
- `GET /api/receitas?feed=recentes|seguindo|populares&search=&categoriaId=`
- `GET|POST /api/receitas/:id` — view / create recipe
- `PUT|DELETE /api/receitas/:id` — edit / delete own recipe
- `POST /api/likes/:receitaId` — toggle like
- `POST /api/follows/:userId` — toggle follow
- `GET|POST /api/favoritos` — user favorites
- `DELETE /api/favoritos/:receitaId` — remove favorite
- `GET|POST /api/categorias` — list / create categories
- `POST /api/reports` — report a recipe
- `GET /api/admin/reports` — ADM: all reported recipes
- `DELETE /api/admin/receitas/:id` — ADM: delete any recipe
- `POST /api/admin/usuarios/:id/ban` — ADM: ban a user
- `GET /api/usuarios/:id` — user profile with follow stats

## Auth Flow Details

- Login opens Google OAuth in popup (avoids iframe restriction)
- On success, redirected to `/?token=JWT`
- Popup calls `window.opener.postMessage({ type: 'AUTH_SUCCESS', token })`
- Main window stores token in localStorage and invalidates React Query cache
- Global `window.fetch` interceptor adds `Authorization: Bearer ...` to all `/api/` requests

## Environment Variables Required

- `DATABASE_URL` — PostgreSQL connection string (auto-provisioned by Replit)
- `GOOGLE_CLIENT_ID` — from Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `JWT_SECRET` — random secret for signing JWT tokens

## Development Commands

- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/receita-da-boa run dev` — run frontend
- `pnpm --filter @workspace/db run push` — push DB schema changes
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from OpenAPI spec
