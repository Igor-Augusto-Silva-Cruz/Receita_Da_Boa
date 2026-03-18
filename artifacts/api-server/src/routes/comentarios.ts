import { Router } from "express";
import { db, commentsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/:receitaId", optionalAuth, async (req, res) => {
  try {
    const receitaId = parseInt(req.params.receitaId);
    if (isNaN(receitaId)) { res.status(400).json({ error: "ID inválido" }); return; }

    const rows = await db
      .select({
        id: commentsTable.id,
        userId: commentsTable.userId,
        receitaId: commentsTable.receitaId,
        texto: commentsTable.texto,
        isReported: commentsTable.isReported,
        createdAt: commentsTable.createdAt,
        autor: {
          id: usersTable.id,
          nome: usersTable.nome,
          email: usersTable.email,
          papel: usersTable.papel,
          isBanned: usersTable.isBanned,
          photoUrl: usersTable.photoUrl,
        },
      })
      .from(commentsTable)
      .leftJoin(usersTable, eq(commentsTable.userId, usersTable.id))
      .where(eq(commentsTable.receitaId, receitaId))
      .orderBy(commentsTable.createdAt);

    res.json(rows);
  } catch {
    res.status(500).json({ error: "Erro ao buscar comentários" });
  }
});

router.post("/:receitaId", requireAuth, async (req, res) => {
  try {
    const receitaId = parseInt(req.params.receitaId);
    if (isNaN(receitaId)) { res.status(400).json({ error: "ID inválido" }); return; }

    const texto = String(req.body?.texto ?? "").trim();
    if (!texto) { res.status(400).json({ error: "Texto é obrigatório" }); return; }
    if (texto.length > 2000) { res.status(400).json({ error: "Comentário muito longo" }); return; }

    const userId = req.user!.userId;

    const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (dbUser?.isBanned) {
      res.status(403).json({ error: "Usuário banido não pode comentar" });
      return;
    }

    const [comment] = await db
      .insert(commentsTable)
      .values({ userId, receitaId, texto })
      .returning();

    const [autor] = await db
      .select({ id: usersTable.id, nome: usersTable.nome, email: usersTable.email, papel: usersTable.papel, isBanned: usersTable.isBanned, photoUrl: usersTable.photoUrl })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    res.status(201).json({ ...comment, autor });
  } catch {
    res.status(400).json({ error: "Erro ao criar comentário" });
  }
});

router.post("/:id/delete", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

    const user = req.user!;
    const [existing] = await db.select().from(commentsTable).where(eq(commentsTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Comentário não encontrado" }); return; }
    if (existing.userId !== user.userId && user.papel !== "adm") {
      res.status(403).json({ error: "Sem permissão" }); return;
    }

    await db.delete(commentsTable).where(eq(commentsTable.id, id));
    res.json({ message: "Comentário removido" });
  } catch {
    res.status(500).json({ error: "Erro ao remover comentário" });
  }
});

export default router;
