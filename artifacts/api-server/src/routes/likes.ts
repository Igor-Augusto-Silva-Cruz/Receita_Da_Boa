import { Router } from "express";
import { db, likesTable, receitasTable, notificationsTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { LikeReceitaParams } from "@workspace/api-zod";

const router = Router();

router.post("/:receitaId", requireAuth, async (req, res) => {
  try {
    const { receitaId } = LikeReceitaParams.parse(req.params);
    const userId = req.user!.userId;

    const [existing] = await db
      .select()
      .from(likesTable)
      .where(and(eq(likesTable.userId, userId), eq(likesTable.receitaId, receitaId)))
      .limit(1);

    if (existing) {
      await db.delete(likesTable).where(eq(likesTable.id, existing.id));
    } else {
      await db.insert(likesTable).values({ userId, receitaId });
      // Cria notificação para o autor da receita (se não for a própria pessoa)
      const [receita] = await db.select({ autorId: receitasTable.autorId }).from(receitasTable).where(eq(receitasTable.id, receitaId)).limit(1);
      if (receita && receita.autorId !== userId) {
        await db.insert(notificationsTable).values({
          userId: receita.autorId,
          actorId: userId,
          type: "like",
          receitaId,
        });
      }
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(likesTable)
      .where(eq(likesTable.receitaId, receitaId));

    res.json({ liked: !existing, likeCount: total });
  } catch {
    res.status(500).json({ error: "Erro ao curtir receita" });
  }
});

export default router;
