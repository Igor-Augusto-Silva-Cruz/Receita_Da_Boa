import { Router } from "express";
import { db, notificationsTable, usersTable, receitasTable, commentsTable } from "@workspace/db";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const rows = await db
      .select({
        id: notificationsTable.id,
        type: notificationsTable.type,
        receitaId: notificationsTable.receitaId,
        comentarioId: notificationsTable.comentarioId,
        isRead: notificationsTable.isRead,
        createdAt: notificationsTable.createdAt,
        actor: {
          id: usersTable.id,
          nome: usersTable.nome,
          photoUrl: usersTable.photoUrl,
        },
        receita: {
          id: receitasTable.id,
          titulo: receitasTable.titulo,
          urlImagem: receitasTable.urlImagem,
        },
        comentarioTexto: commentsTable.texto,
      })
      .from(notificationsTable)
      .leftJoin(usersTable, eq(notificationsTable.actorId, usersTable.id))
      .leftJoin(receitasTable, eq(notificationsTable.receitaId, receitasTable.id))
      .leftJoin(commentsTable, eq(notificationsTable.comentarioId, commentsTable.id))
      .where(eq(notificationsTable.userId, userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar notificações:", err);
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

router.get("/unread-count", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const [{ total }] = await db
      .select({ total: count() })
      .from(notificationsTable)
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
    res.json({ count: total });
  } catch {
    res.status(500).json({ error: "Erro ao contar notificações" });
  }
});

router.post("/read-all", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.userId;
    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.userId, userId), eq(notificationsTable.isRead, false)));
    res.json({ message: "Todas marcadas como lidas" });
  } catch {
    res.status(500).json({ error: "Erro ao marcar como lidas" });
  }
});

router.post("/:id/read", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
    const userId = req.user!.userId;
    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, userId)));
    res.json({ message: "Notificação marcada como lida" });
  } catch {
    res.status(500).json({ error: "Erro ao marcar como lida" });
  }
});

export default router;
