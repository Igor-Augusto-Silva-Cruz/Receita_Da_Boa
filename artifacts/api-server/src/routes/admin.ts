import { Router } from "express";
import { db, receitasTable, usersTable, reportsTable, favoritosTable, likesTable, categoriasTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { requireAuth, requireAdm } from "../middlewares/auth.js";
import { AdminDeleteReceitaParams, BanUsuarioParams } from "@workspace/api-zod";

const router = Router();

router.use(requireAuth, requireAdm);

router.get("/reports", async (_req, res) => {
  try {
    const reported = await db
      .select({
        id: receitasTable.id,
        titulo: receitasTable.titulo,
        autorId: receitasTable.autorId,
        isReported: receitasTable.isReported,
        autor: { id: usersTable.id, nome: usersTable.nome, email: usersTable.email, papel: usersTable.papel, isBanned: usersTable.isBanned },
        categoria: { id: categoriasTable.id, nome: categoriasTable.nome },
      })
      .from(receitasTable)
      .leftJoin(usersTable, eq(receitasTable.autorId, usersTable.id))
      .leftJoin(categoriasTable, eq(receitasTable.categoriaId, categoriasTable.id))
      .where(eq(receitasTable.isReported, true));

    const withCounts = await Promise.all(
      reported.map(async (r) => {
        const [{ total }] = await db
          .select({ total: count() })
          .from(reportsTable)
          .where(eq(reportsTable.receitaId, r.id));
        return { ...r, reportCount: total };
      })
    );

    res.json(withCounts.sort((a, b) => b.reportCount - a.reportCount));
  } catch {
    res.status(500).json({ error: "Erro ao buscar denúncias" });
  }
});

router.delete("/receitas/:id", async (req, res) => {
  try {
    const { id } = AdminDeleteReceitaParams.parse(req.params);
    await db.delete(favoritosTable).where(eq(favoritosTable.receitaId, id));
    await db.delete(likesTable).where(eq(likesTable.receitaId, id));
    await db.delete(reportsTable).where(eq(reportsTable.receitaId, id));
    await db.delete(receitasTable).where(eq(receitasTable.id, id));
    res.json({ message: "Receita removida pelo administrador" });
  } catch {
    res.status(500).json({ error: "Erro ao remover receita" });
  }
});

router.post("/usuarios/:id/ban", async (req, res) => {
  try {
    const { id } = BanUsuarioParams.parse(req.params);
    await db.update(usersTable).set({ isBanned: true }).where(eq(usersTable.id, id));
    res.json({ message: "Usuário banido com sucesso" });
  } catch {
    res.status(500).json({ error: "Erro ao banir usuário" });
  }
});

export default router;
