import { Router } from "express";
import { db, receitasTable, usersTable, reportsTable, favoritosTable, likesTable, categoriasTable, commentsTable } from "@workspace/db";
import { eq, count, isNull, isNotNull, sql } from "drizzle-orm";
import { requireAuth, requireAdm } from "../middlewares/auth.js";
import { z } from "zod/v4";

const router = Router();
router.use(requireAuth, requireAdm);

const userFields = {
  id: usersTable.id,
  nome: usersTable.nome,
  email: usersTable.email,
  papel: usersTable.papel,
  isBanned: usersTable.isBanned,
  photoUrl: usersTable.photoUrl,
};

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
        autor: userFields,
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
            denunciante: userFields,
          })
          .from(reportsTable)
          .leftJoin(usersTable, eq(reportsTable.userId, usersTable.id))
          .where(eq(reportsTable.receitaId, r.id));

        return { ...r, reportCount: reportRows.length, isLiked: false, isFavorited: false, reports: reportRows };
      })
    );

    res.json(withReports.sort((a, b) => b.reportCount - a.reportCount));
  } catch {
    res.status(500).json({ error: "Erro ao buscar denúncias" });
  }
});

router.get("/reports/comentarios", async (_req, res) => {
  try {
    const reported = await db
      .select({
        id: commentsTable.id,
        texto: commentsTable.texto,
        userId: commentsTable.userId,
        receitaId: commentsTable.receitaId,
        isReported: commentsTable.isReported,
        createdAt: commentsTable.createdAt,
        autor: userFields,
        receita: { id: receitasTable.id, titulo: receitasTable.titulo },
      })
      .from(commentsTable)
      .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .leftJoin(receitasTable, eq(commentsTable.receitaId, receitasTable.id))
      .where(eq(commentsTable.isReported, true));

    const withReports = await Promise.all(
      reported.map(async (r) => {
        const reportRows = await db
          .select({
            id: reportsTable.id,
            motivo: reportsTable.motivo,
            userId: reportsTable.userId,
            createdAt: reportsTable.createdAt,
            denunciante: userFields,
          })
          .from(reportsTable)
          .leftJoin(usersTable, eq(reportsTable.userId, usersTable.id))
          .where(eq(reportsTable.comentarioId, r.id));

        return { ...r, reportCount: reportRows.length, reports: reportRows };
      })
    );

    res.json(withReports.sort((a, b) => b.reportCount - a.reportCount));
  } catch {
    res.status(500).json({ error: "Erro ao buscar denúncias de comentários" });
  }
});

router.delete("/receitas/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(favoritosTable).where(eq(favoritosTable.receitaId, id));
    await db.delete(likesTable).where(eq(likesTable.receitaId, id));
    await db.delete(reportsTable).where(eq(reportsTable.receitaId, id));
    await db.delete(commentsTable).where(eq(commentsTable.receitaId, id));
    await db.delete(receitasTable).where(eq(receitasTable.id, id));
    res.json({ message: "Receita removida pelo administrador" });
  } catch {
    res.status(500).json({ error: "Erro ao remover receita" });
  }
});

router.delete("/comentarios/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(reportsTable).where(eq(reportsTable.comentarioId, id));
    await db.delete(commentsTable).where(eq(commentsTable.id, id));
    res.json({ message: "Comentário removido pelo administrador" });
  } catch {
    res.status(500).json({ error: "Erro ao remover comentário" });
  }
});

router.post("/usuarios/:id/ban", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(usersTable).set({ isBanned: true }).where(eq(usersTable.id, id));
    res.json({ message: "Usuário banido com sucesso" });
  } catch {
    res.status(500).json({ error: "Erro ao banir usuário" });
  }
});

router.post("/usuarios/:id/unban", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(usersTable).set({ isBanned: false }).where(eq(usersTable.id, id));
    res.json({ message: "Usuário desbanido" });
  } catch {
    res.status(500).json({ error: "Erro ao desbanir usuário" });
  }
});

// Ignora denúncias de uma receita (limpa reports + flag, mantém receita)
router.post("/reports/receita/:id/ignore", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(reportsTable).where(eq(reportsTable.receitaId, id));
    await db.update(receitasTable).set({ isReported: false }).where(eq(receitasTable.id, id));
    res.json({ message: "Denúncias ignoradas" });
  } catch {
    res.status(500).json({ error: "Erro ao ignorar denúncias" });
  }
});

// Ignora denúncias de um comentário (limpa reports + flag, mantém comentário)
router.post("/reports/comentario/:id/ignore", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(reportsTable).where(eq(reportsTable.comentarioId, id));
    await db.update(commentsTable).set({ isReported: false }).where(eq(commentsTable.id, id));
    res.json({ message: "Denúncias ignoradas" });
  } catch {
    res.status(500).json({ error: "Erro ao ignorar denúncias" });
  }
});

export default router;
