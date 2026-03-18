import { Router } from "express";
import { db, reportsTable, receitasTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { ReportReceitaBody } from "@workspace/api-zod";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  try {
    const { receitaId, motivo } = ReportReceitaBody.parse(req.body);
    const userId = req.user!.userId;

    await db.insert(reportsTable).values({ userId, receitaId, motivo });
    await db.update(receitasTable).set({ isReported: true }).where(eq(receitasTable.id, receitaId));

    res.status(201).json({ message: "Receita denunciada com sucesso" });
  } catch {
    res.status(400).json({ error: "Erro ao denunciar receita" });
  }
});

export default router;
