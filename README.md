Receita da Boa - Plataforma Social de Culinária
O Receita da Boa é uma aplicação web full-stack desenvolvida para facilitar o compartilhamento de receitas entre amantes da culinaria, permitindo que usuários publiquem suas receitas, interajam com outros cozinheiros e participem de uma comunidade moderada e organizada.

Este projeto foi desenvolvido como parte da avaliação do Curso de tecnologia da fatec praia grande, focando em integração full-stack e modelagem de dados relacional.

--------------------------------
Entusiastas de culinária muitas vezes sentem falta de uma plataforma centralizada que una a organização pessoal de receitas com o aspecto social de seguir autores favoritos e descobrir pratos por categorias, tudo isso sob um sistema de moderação que garanta a qualidade do conteúdo.

----------------------------------


Backend (artifacts/api-server) — Express 5 + Drizzle ORM + PostgreSQL, com autenticação via Google OAuth 2.0 e JWT
Frontend (artifacts/receita-da-boa) — React + Vite + Tailwind CSS + TanStack Query, roteamento com Wouter
Libs compartilhadas — tipos Zod gerados via Orval a partir do spec OpenAPI, cliente React Query gerado automaticamente, schema do banco com Drizzle

--------------------------------------

Funcionalidades Principais
Feed com 3 abas (Recentes, Seguindo, Populares)
Sistema de curtidas, seguidores e favoritos
Comentários nas receitas com denúncias
Notificações em tempo real (polling)
Painel de moderação para admins
Upload de imagens via object storage com URLs presignadas

 -------------------------------------

  Demonstração visual das ações dos Usuários
 <img width="8192" height="2126" alt="image" src="https://github.com/user-attachments/assets/a7b62658-b3d4-445c-8133-c08889481eb3" />





 
