import { pgTable, serial, text, integer, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const papelEnum = pgEnum("papel", ["usuario", "adm"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull().unique(),
  googleId: text("google_id").notNull().unique(),
  papel: papelEnum("papel").notNull().default("usuario"),
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
});

export const favoritosTable = pgTable("favoritos", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  receitaId: integer("receita_id").notNull().references(() => receitasTable.id),
}, (t) => [
  uniqueIndex("favoritos_user_receita_idx").on(t.userId, t.receitaId),
]);

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true });
export const insertCategoriaSchema = createInsertSchema(categoriasTable).omit({ id: true });
export const insertReceitaSchema = createInsertSchema(receitasTable).omit({ id: true });
export const insertFavoritoSchema = createInsertSchema(favoritosTable).omit({ id: true });

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Categoria = typeof categoriasTable.$inferSelect;
export type InsertCategoria = z.infer<typeof insertCategoriaSchema>;
export type Receita = typeof receitasTable.$inferSelect;
export type InsertReceita = z.infer<typeof insertReceitaSchema>;
export type Favorito = typeof favoritosTable.$inferSelect;
export type InsertFavorito = z.infer<typeof insertFavoritoSchema>;
