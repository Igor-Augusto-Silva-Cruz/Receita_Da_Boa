import { Router } from "express";
import { db, followsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { FollowUserParams } from "@workspace/api-zod";

const router = Router();

router.post("/:userId", requireAuth, async (req, res) => {
  try {
    const { userId: targetId } = FollowUserParams.parse(req.params);
    const followerId = req.user!.userId;

    if (followerId === targetId) {
      res.status(400).json({ error: "Você não pode seguir a si mesmo" });
      return;
    }

    const [existing] = await db
      .select()
      .from(followsTable)
      .where(and(eq(followsTable.followerId, followerId), eq(followsTable.followingId, targetId)))
      .limit(1);

    if (existing) {
      await db.delete(followsTable).where(eq(followsTable.id, existing.id));
      res.json({ following: false });
    } else {
      await db.insert(followsTable).values({ followerId, followingId: targetId });
      res.json({ following: true });
    }
  } catch {
    res.status(500).json({ error: "Erro ao seguir usuário" });
  }
});

export default router;
