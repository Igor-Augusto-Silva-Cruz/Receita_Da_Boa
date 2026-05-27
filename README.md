# 🍳 Receita da Boa     
[![Acessar o Site](https://img.shields.io/badge/Para%20Acessar%20o%20Site%20Teste-clique%20aqui-orange?style=for-the-badge&logo=googlechrome&logoColor=white)](https://receita-da-boa--igorau.replit.app/)

Receita da Boa é uma Rede social com o intuido de compartilhamento de receitas entre amantes da culinaria, desenvolvida como projeto de avaliação do **Curso de Analise e Desenvolvimento de Sistemas da FATEC Praia Grande**, com foco em integração full-stack e modelagem de dados relacional.

Usuários publicam, curtem, salvam e comentam receitas, seguem outros chefs e recebem notificações. Administradores têm acesso a um painel de moderação completo.

<img width="8192" height="2126" alt="image" src="https://github.com/user-attachments/assets/a7b62658-b3d4-445c-8133-c08889481eb3" />

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Estrutura do monorepo](#estrutura-do-monorepo)
- [Pré-requisitos](#pré-requisitos)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Instalação e execução](#instalação-e-execução)
- [Fluxo de autenticação](#fluxo-de-autenticação)
- [API](#api)
- [Banco de dados](#banco-de-dados)
- [Upload de imagens](#upload-de-imagens)
- [Moderação](#moderação)
- [Codegen (OpenAPI → hooks)](#codegen-openapi--hooks)

---

## Funcionalidades

| Área | Detalhes |
|---|---|
| **Autenticação** | Login via Google OAuth 2.0; JWT armazenado no `localStorage` |
| **Feed** | 3 abas: Recentes · Seguindo · Populares |
| **Receitas** | Criar, editar e excluir receitas com foto e categoria |
| **Social** | Curtir, salvar nos favoritos, seguir chefs, comentar |
| **Perfil** | Foto, bio, estatísticas, aba de receitas e de salvos |
| **Notificações** | Notificações de curtidas e comentários nas próprias receitas |
| **Moderação** | Denúncia de receitas e comentários; painel ADM para revisão |
| **Administração** | Primeiro usuário cadastrado vira ADM automaticamente; pode banir usuários |

---

## Stack

### Frontend (`artifacts/receita-da-boa`)
- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- Radix UI (componentes acessíveis)
- TanStack Query (cache e sincronização de estado servidor)
- Wouter (roteamento leve)
- Uppy (upload de arquivos)
- Lucide React (ícones)

### Backend (`artifacts/api-server`)
- Node.js + Express 5 + TypeScript
- Drizzle ORM + PostgreSQL
- Passport.js (estratégia Google OAuth 2.0)
- JSON Web Token (JWT)
- Google Cloud Storage (imagens)

### Libs compartilhadas (`lib/`)

| Pacote | Função |
|---|---|
| `lib/db` | Schema Drizzle + cliente do banco |
| `lib/api-spec` | Especificação OpenAPI 3.1 |
| `lib/api-zod` | Schemas Zod gerados a partir do OpenAPI |
| `lib/api-client-react` | Hooks TanStack Query gerados via Orval |
| `lib/object-storage-web` | Wrapper Uppy para upload direto ao GCS |

---

## Estrutura do monorepo

```
receita-da-boa/
├── artifacts/
│   ├── api-server/          # Servidor Express
│   │   └── src/
│   │       ├── routes/      # Endpoints por domínio
│   │       └── middlewares/ # requireAuth, optionalAuth
│   ├── receita-da-boa/      # App React
│   │   └── src/
│   │       ├── pages/       # Feed, Profile, Moderation
│   │       └── components/  # RecipeCard, Sidebar, Modals…
│   └── mockup-sandbox/      # Sandbox de prototipagem de UI
├── lib/
│   ├── db/                  # Schema + migrations (drizzle-kit)
│   ├── api-spec/            # openapi.yaml + orval.config.ts
│   ├── api-zod/             # Schemas Zod (gerado)
│   ├── api-client-react/    # Hooks React Query (gerado)
│   └── object-storage-web/  # Upload helper
├── package.json             # Root pnpm workspace
└── pnpm-workspace.yaml
```

---

## Pré-requisitos

- **Node.js** ≥ 20
- **pnpm** ≥ 9
- **PostgreSQL** (ou Replit Database integrado)
- Conta Google Cloud com projeto configurado para OAuth e Storage

---

## Variáveis de ambiente

Configure os seguintes secrets (no Replit ou em um arquivo `.env` local):

```env
# Banco de dados
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# JWT
JWT_SECRET=uma-string-secreta-longa

# Object Storage (Google Cloud Storage)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=nome-do-bucket
PRIVATE_OBJECT_DIR=uploads/private
PUBLIC_OBJECT_SEARCH_PATHS=uploads/public
```

---

## Instalação e execução

```bash
# 1. Instalar dependências
pnpm install

# 2. Aplicar schema no banco
pnpm --filter @workspace/db run push

# 3. Iniciar o backend
pnpm --filter @workspace/api-server run dev

# 4. Iniciar o frontend (em outro terminal)
pnpm --filter @workspace/receita-da-boa run dev
```

O frontend roda em `http://localhost:5173` e o backend em `http://localhost:3000` (ou na porta definida pela variável `PORT`).

---

## Fluxo de autenticação

```
Usuário clica "Entrar com Google"
        ↓
GET /api/auth/google  →  Google OAuth consent screen
        ↓
GET /api/auth/google/callback
        ↓  (Passport verifica ou cria o usuário no banco)
Redireciona para /?token=<JWT>
        ↓
Frontend salva JWT no localStorage ("receita_token")
        ↓
Todas as requisições: Authorization: Bearer <JWT>
```

> O primeiro usuário cadastrado recebe automaticamente o papel `adm`.

---

## API

Base: `/api`

### Auth

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/auth/google` | — | Inicia fluxo OAuth |
| GET | `/auth/google/callback` | — | Callback OAuth |
| GET | `/auth/me` | ✅ | Retorna usuário logado |
| PATCH | `/auth/me` | ✅ | Atualiza nome e bio |

### Receitas

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/receitas` | Opcional | Lista receitas (filtros: `feed`, `autorId`, `q`, `categoriaId`) |
| POST | `/receitas` | ✅ | Cria receita |
| GET | `/receitas/:id` | Opcional | Detalhe da receita |
| PUT | `/receitas/:id` | ✅ | Atualiza receita (própria ou ADM) |
| DELETE | `/receitas/:id` | ✅ | Remove receita (própria ou ADM) |

**Valores do parâmetro `feed`:**
- `recentes` — todas, ordem cronológica inversa
- `seguindo` — apenas receitas de usuários que você segue
- `populares` — ordenadas por número de curtidas

### Social

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST / DELETE | `/likes/:receitaId` | ✅ | Curtir / descurtir |
| GET | `/favoritos` | ✅ | Receitas salvas do usuário |
| POST / DELETE | `/favoritos/:receitaId` | ✅ | Salvar / remover dos favoritos |
| POST / DELETE | `/follows/:userId` | ✅ | Seguir / deixar de seguir |
| GET | `/comentarios/:receitaId` | Opcional | Lista comentários |
| POST | `/comentarios/:receitaId` | ✅ | Adiciona comentário |
| DELETE | `/comentarios/:comentarioId` | ✅ | Remove comentário (próprio ou ADM) |

### Notificações

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/notificacoes` | ✅ | Lista notificações do usuário |
| PATCH | `/notificacoes/read` | ✅ | Marca todas como lidas |

### Usuários

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/usuarios/:id` | Opcional | Perfil público + campo `isFollowing` |

### Denúncias

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/reports` | ✅ | Denuncia receita ou comentário |

### Admin _(requer papel `adm`)_

| Método | Rota | Descrição |
|---|---|---|
| GET | `/admin/reports` | Lista denúncias pendentes |
| DELETE | `/admin/reports/:id` | Descarta denúncia |
| POST | `/admin/usuarios/:id/ban` | Bane / desbane usuário |

### Storage

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/storage/upload-url` | ✅ | Gera URL assinada para upload direto ao GCS |

---

## Banco de dados

Schema gerenciado via **Drizzle ORM** em `lib/db/src/schema/index.ts`.

### Tabelas

```
users
  id · nome · email · googleId · papel (usuario|adm)
  isBanned · photoUrl · bio

receitas
  id · titulo · descricao · ingredientes · instrucoes
  urlImagem · categoriaId · autorId · isReported · createdAt

categorias
  id · nome

comments
  id · userId · receitaId · texto · isReported · createdAt

likes
  userId · receitaId  (chave primária composta)

favoritos
  userId · receitaId  (chave primária composta)

follows
  followerId · followingId  (chave primária composta)

reports
  id · userId · receitaId? · comentarioId? · motivo · createdAt

notifications
  id · userId · actorId · type (like|comment)
  receitaId · comentarioId · isRead
```

### Comandos úteis

```bash
# Aplicar mudanças do schema ao banco
pnpm --filter @workspace/db run push

# Gerar arquivos de migration (sem aplicar)
pnpm --filter @workspace/db run generate
```

---

## Upload de imagens

O upload é feito **diretamente do browser para o Google Cloud Storage** usando URLs assinadas:

1. Frontend chama `POST /api/storage/upload-url` com nome e tipo do arquivo.
2. Backend gera uma URL assinada (válida por 15 min) e retorna ao frontend.
3. Frontend faz `PUT` direto na URL assinada com o arquivo binário.
4. URL pública resultante é salva na receita ou no perfil do usuário.

A lib `lib/object-storage-web` encapsula esse fluxo com Uppy.

---

## Moderação

- Qualquer usuário pode denunciar uma receita ou comentário via `POST /reports`.
- O painel ADM (`/moderation`) lista todas as denúncias com contexto completo (receita, comentário, autor, denunciante).
- O ADM pode:
  - **Descartar** a denúncia (falso positivo).
  - **Remover** o conteúdo denunciado.
  - **Banir** o autor do conteúdo.

---

## Codegen (OpenAPI → hooks)

O projeto usa **Orval** para gerar automaticamente os hooks do TanStack Query e os schemas Zod a partir do `openapi.yaml`.

```bash
# Regenerar após alterar openapi.yaml
pnpm --filter @workspace/api-spec run codegen
```

**Arquivos gerados:**
- `lib/api-zod/src/` — schemas Zod de request/response
- `lib/api-client-react/src/` — hooks como `useGetReceitas`, `usePostLike`, etc.

> Nunca edite os arquivos gerados diretamente. Edite o `openapi.yaml` e execute o codegen.
