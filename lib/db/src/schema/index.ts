import { pgTable, serial, text, integer, pgEnum, uniqueIndex, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const papelEnum = pgEnum("papel", ["usuario", "adm"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  googleId: text("google_id").notNull().unique(),
  papel: papelEnum("papel").notNull().default("usuario"),
  isBanned: boolean("is_banned").notNull().default(false),
  photoUrl: text("photo_url"),
});

export const categoriasTable = pgTable("categorias", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
});

export const receitasTable = pgTable("receitas", {
  id: serial("id").primaryKey(),
  titulo: text("titulo").notNull(),
  descricao: text("descricao").notNull(),
  ingredientes: text("ingredientes").notNull(),
  instrucoes: text("instrucoes").notNull(),
  urlImagem: text("url_imagem"),
  categoriaId: integer("categoria_id").references(() => categoriasTable.id),
  autorId: integer("autor_id").notNull().references(() => usersTable.id),
  isReported: boolean("is_reported").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const favoritosTable = pgTable("favoritos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  receitaId: integer("receita_id").notNull().references(() => receitasTable.id),
}, (t) => [
  uniqueIndex("favoritos_user_receita_idx").on(t.userId, t.receitaId),
]);

export const likesTable = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  receitaId: integer("receita_id").notNull().references(() => receitasTable.id),
}, (t) => [
  uniqueIndex("likes_user_receita_idx").on(t.userId, t.receitaId),
]);

export const followsTable = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull().references(() => usersTable.id),
  followingId: integer("following_id").notNull().references(() => usersTable.id),
}, (t) => [
  uniqueIndex("follows_pair_idx").on(t.followerId, t.followingId),
]);

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  receitaId: integer("receita_id").notNull().references(() => receitasTable.id),
  texto: text("texto").notNull(),
  isReported: boolean("is_reported").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  receitaId: integer("receita_id").references(() => receitasTable.id),
  comentarioId: integer("comentario_id").references(() => commentsTable.id),
  motivo: text("motivo").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationTypeEnum = pgEnum("notification_type", ["like", "comment"]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  actorId: integer("actor_id").notNull().references(() => usersTable.id),
  type: notificationTypeEnum("type").notNull(),
  receitaId: integer("receita_id").references(() => receitasTable.id, { onDelete: "cascade" }),
  comentarioId: integer("comentario_id").references(() => commentsTable.id, { onDelete: "cascade" }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true });
export const insertCategoriaSchema = createInsertSchema(categoriasTable).omit({ id: true });
export const insertReceitaSchema = createInsertSchema(receitasTable).omit({ id: true, createdAt: true });
export const insertFavoritoSchema = createInsertSchema(favoritosTable).omit({ id: true });
export const insertLikeSchema = createInsertSchema(likesTable).omit({ id: true });
export const insertFollowSchema = createInsertSchema(followsTable).omit({ id: true });
export const insertCommentSchema = createInsertSchema(commentsTable).omit({ id: true, createdAt: true });
export const insertReportSchema = createInsertSchema(reportsTable).omit({ id: true, createdAt: true });

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Categoria = typeof categoriasTable.$inferSelect;
export type Receita = typeof receitasTable.$inferSelect;
export type InsertReceita = z.infer<typeof insertReceitaSchema>;
export type Favorito = typeof favoritosTable.$inferSelect;
export type Like = typeof likesTable.$inferSelect;
export type Follow = typeof followsTable.$inferSelect;
export type Comment = typeof commentsTable.$inferSelect;
export type Report = typeof reportsTable.$inferSelect;
