import { Router } from "express";
import { db, usersTable, followsTable, receitasTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { optionalAuth } from "../middlewares/auth.js";
import { GetUsuarioParams } from "@workspace/api-zod";

const router = Router();

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = GetUsuarioParams.parse(req.params);
    const currentUserId = req.user?.userId;

    const [user] = await db
      .select({ id: usersTable.id, nome: usersTable.nome, email: usersTable.email, papel: usersTable.papel, isBanned: usersTable.isBanned, photoUrl: usersTable.photoUrl })
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }

    const [[{ followers }], [{ following }], [{ receitas }]] = await Promise.all([
      db.select({ followers: count() }).from(followsTable).where(eq(followsTable.followingId, id)),
      db.select({ following: count() }).from(followsTable).where(eq(followsTable.followerId, id)),
      db.select({ receitas: count() }).from(receitasTable).where(eq(receitasTable.autorId, id)),
    ]);

    let isFollowing = false;
    if (currentUserId && currentUserId !== id) {
      const [follow] = await db.select().from(followsTable)
        .where(eq(followsTable.followerId, currentUserId))
        .limit(1);
      isFollowing = !!follow;
    }

    res.json({
      ...user,
      followersCount: followers,
      followingCount: following,
      receitasCount: receitas,
      isFollowing,
    });
  } catch {
    res.status(500).json({ error: "Erro ao buscar usuário" });
  }
});

export default router;
