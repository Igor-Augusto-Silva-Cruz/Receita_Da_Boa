import { Router } from "express";
import { db, reportsTable, receitasTable, commentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const receitaId = req.body?.receitaId ? parseInt(req.body.receitaId) : null;
    const comentarioId = req.body?.comentarioId ? parseInt(req.body.comentarioId) : null;
    const motivo = String(req.body?.motivo ?? "").trim();

    if (!motivo) { res.status(400).json({ error: "Motivo é obrigatório" }); return; }
    if (!receitaId && !comentarioId) { res.status(400).json({ error: "Informe receitaId ou comentarioId" }); return; }

    const userId = req.user!.userId;

    await db.insert(reportsTable).values({ userId, receitaId, comentarioId, motivo });

    if (receitaId) {
      await db.update(receitasTable).set({ isReported: true }).where(eq(receitasTable.id, receitaId));
    }
    if (comentarioId) {
      await db.update(commentsTable).set({ isReported: true }).where(eq(commentsTable.id, comentarioId));
    }

    res.status(201).json({ message: "Denúncia registrada com sucesso" });
  } catch {
    res.status(400).json({ error: "Erro ao registrar denúncia" });
  }
});

export default router;
