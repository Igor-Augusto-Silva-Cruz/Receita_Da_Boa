import { Router } from "express";
import { db, receitasTable, usersTable, reportsTable, favoritosTable, likesTable, categoriasTable } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";
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
        descricao: receitasTable.descricao,
        ingredientes: receitasTable.ingredientes,
        instrucoes: receitasTable.instrucoes,
        urlImagem: receitasTable.urlImagem,
        autorId: receitasTable.autorId,
        isReported: receitasTable.isReported,
        createdAt: receitasTable.createdAt,
        autor: { id: usersTable.id, nome: usersTable.nome, email: usersTable.email, papel: usersTable.papel, isBanned: usersTable.isBanned, photoUrl: usersTable.photoUrl },
        categoria: { id: categoriasTable.id, nome: categoriasTable.nome },
        likeCount: sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.receita_id = ${receitasTable.id})`.mapWith(Number),
      })
      .from(receitasTable)
      .leftJoin(usersTable, eq(receitasTable.autorId, usersTable.id))
      .leftJoin(categoriasTable, eq(receitasTable.categoriaId, categoriasTable.id))
      .where(eq(receitasTable.isReported, true));

    const withReports = await Promise.all(
      reported.map(async (r) => {
        const reportRows = await db
          .select({
            id: reportsTable.id,
            motivo: reportsTable.motivo,
            userId: reportsTable.userId,
            createdAt: reportsTable.createdAt,
            denunciante: {
              id: usersTable.id,
              nome: usersTable.nome,
              email: usersTable.email,
              papel: usersTable.papel,
              isBanned: usersTable.isBanned,
              photoUrl: usersTable.photoUrl,
            },
          })
          .from(reportsTable)
          .leftJoin(usersTable, eq(reportsTable.userId, usersTable.id))
          .where(eq(reportsTable.receitaId, r.id));

        return {
          ...r,
          reportCount: reportRows.length,
          isLiked: false,
          isFavorited: false,
          reports: reportRows,
        };
      })
    );

    res.json(withReports.sort((a, b) => b.reportCount - a.reportCount));
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
