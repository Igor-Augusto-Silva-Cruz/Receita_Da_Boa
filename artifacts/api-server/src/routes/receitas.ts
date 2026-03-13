import { Router } from "express";
import { db, receitasTable, categoriasTable, usersTable, favoritosTable } from "@workspace/db";
import { eq, ilike, and, inArray } from "drizzle-orm";
import { requireAuth, requireAdm, optionalAuth } from "../middlewares/auth.js";
import {
  CreateReceitaBody,
  GetReceitasQueryParams,
  GetReceitaParams,
  UpdateReceitaParams,
  UpdateReceitaBody,
  DeleteReceitaParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", optionalAuth, async (req, res) => {
  try {
    const query = GetReceitasQueryParams.parse(req.query);

    let conditions: ReturnType<typeof eq>[] = [];
    if (query.categoriaId) {
      conditions.push(eq(receitasTable.categoriaId, query.categoriaId));
    }

    let receitasList = await db
      .select({
        id: receitasTable.id,
        titulo: receitasTable.titulo,
        descricao: receitasTable.descricao,
        ingredientes: receitasTable.ingredientes,
        instrucoes: receitasTable.instrucoes,
        urlImagem: receitasTable.urlImagem,
        categoriaId: receitasTable.categoriaId,
        autorId: receitasTable.autorId,
        categoria: { id: categoriasTable.id, nome: categoriasTable.nome },
        autor: { id: usersTable.id, nome: usersTable.nome, email: usersTable.email, papel: usersTable.papel },
      })
      .from(receitasTable)
      .leftJoin(categoriasTable, eq(receitasTable.categoriaId, categoriasTable.id))
      .leftJoin(usersTable, eq(receitasTable.autorId, usersTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    if (query.search) {
      const search = query.search.toLowerCase();
      receitasList = receitasList.filter((r) => r.titulo.toLowerCase().includes(search));
    }

    let favoritedIds = new Set<number>();
    if (req.user) {
      const favs = await db
        .select({ receitaId: favoritosTable.receitaId })
        .from(favoritosTable)
        .where(eq(favoritosTable.userId, req.user.userId));
      favoritedIds = new Set(favs.map((f) => f.receitaId));
    }

    const result = receitasList.map((r) => ({
      ...r,
      isFavorited: favoritedIds.has(r.id),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar receitas" });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = GetReceitaParams.parse(req.params);
    const [receita] = await db
      .select({
        id: receitasTable.id,
        titulo: receitasTable.titulo,
        descricao: receitasTable.descricao,
        ingredientes: receitasTable.ingredientes,
        instrucoes: receitasTable.instrucoes,
        urlImagem: receitasTable.urlImagem,
        categoriaId: receitasTable.categoriaId,
        autorId: receitasTable.autorId,
        categoria: { id: categoriasTable.id, nome: categoriasTable.nome },
        autor: { id: usersTable.id, nome: usersTable.nome, email: usersTable.email, papel: usersTable.papel },
      })
      .from(receitasTable)
      .leftJoin(categoriasTable, eq(receitasTable.categoriaId, categoriasTable.id))
      .leftJoin(usersTable, eq(receitasTable.autorId, usersTable.id))
      .where(eq(receitasTable.id, id))
      .limit(1);

    if (!receita) {
      res.status(404).json({ error: "Receita não encontrada" });
      return;
    }

    let isFavorited = false;
    if (req.user) {
      const [fav] = await db
        .select()
        .from(favoritosTable)
        .where(and(eq(favoritosTable.userId, req.user.userId), eq(favoritosTable.receitaId, id)))
        .limit(1);
      isFavorited = !!fav;
    }

    res.json({ ...receita, isFavorited });
  } catch {
    res.status(500).json({ error: "Erro ao buscar receita" });
  }
});

router.post("/", requireAuth, requireAdm, async (req, res) => {
  try {
    const body = CreateReceitaBody.parse(req.body);
    const [receita] = await db
      .insert(receitasTable)
      .values({ ...body, autorId: req.user!.userId })
      .returning();
    res.status(201).json(receita);
  } catch {
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.put("/:id", requireAuth, requireAdm, async (req, res) => {
  try {
    const { id } = UpdateReceitaParams.parse(req.params);
    const body = UpdateReceitaBody.parse(req.body);
    const [updated] = await db
      .update(receitasTable)
      .set(body)
      .where(eq(receitasTable.id, id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Receita não encontrada" });
      return;
    }
    res.json(updated);
  } catch {
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.delete("/:id", requireAuth, requireAdm, async (req, res) => {
  try {
    const { id } = DeleteReceitaParams.parse(req.params);
    await db.delete(favoritosTable).where(eq(favoritosTable.receitaId, id));
    const [deleted] = await db
      .delete(receitasTable)
      .where(eq(receitasTable.id, id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Receita não encontrada" });
      return;
    }
    res.json({ message: "Receita removida com sucesso" });
  } catch {
    res.status(500).json({ error: "Erro ao remover receita" });
  }
});

export default router;
