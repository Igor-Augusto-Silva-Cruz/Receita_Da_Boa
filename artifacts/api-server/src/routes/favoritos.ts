import { Router } from "express";
import { db, favoritosTable, receitasTable, categoriasTable, usersTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { AddFavoritoBody, RemoveFavoritoParams } from "@workspace/api-zod";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const favs = await db
      .select({ receitaId: favoritosTable.receitaId })
      .from(favoritosTable)
      .where(eq(favoritosTable.userId, userId));

    const receitaIds = favs.map((f) => f.receitaId);
    if (receitaIds.length === 0) {
      res.json([]);
      return;
    }

    const receitas = await db
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
      .where(inArray(receitasTable.id, receitaIds));

    res.json(receitas.map((r) => ({ ...r, isFavorited: true })));
  } catch {
    res.status(500).json({ error: "Erro ao buscar favoritos" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { receitaId } = AddFavoritoBody.parse(req.body);
    const userId = req.user!.userId;

    const [existing] = await db
      .select()
      .from(favoritosTable)
      .where(and(eq(favoritosTable.userId, userId), eq(favoritosTable.receitaId, receitaId)))
      .limit(1);

    if (!existing) {
      await db.insert(favoritosTable).values({ userId, receitaId });
    }

    res.status(201).json({ message: "Adicionado aos favoritos" });
  } catch {
    res.status(400).json({ error: "Erro ao adicionar favorito" });
  }
});

router.delete("/:receitaId", requireAuth, async (req, res) => {
  try {
    const { receitaId } = RemoveFavoritoParams.parse(req.params);
    const userId = req.user!.userId;

    await db
      .delete(favoritosTable)
      .where(and(eq(favoritosTable.userId, userId), eq(favoritosTable.receitaId, receitaId)));

    res.json({ message: "Removido dos favoritos" });
  } catch {
    res.status(500).json({ error: "Erro ao remover favorito" });
  }
});

export default router;
