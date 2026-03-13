import { Router } from "express";
import { db, categoriasTable } from "@workspace/db";
import { requireAuth, requireAdm } from "../middlewares/auth.js";
import { CreateCategoriaBody } from "@workspace/api-zod";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const categorias = await db.select().from(categoriasTable).orderBy(categoriasTable.nome);
    res.json(categorias);
  } catch {
    res.status(500).json({ error: "Erro ao buscar categorias" });
  }
});

router.post("/", requireAuth, requireAdm, async (req, res) => {
  try {
    const body = CreateCategoriaBody.parse(req.body);
    const [categoria] = await db.insert(categoriasTable).values(body).returning();
    res.status(201).json(categoria);
  } catch {
    res.status(400).json({ error: "Dados inválidos" });
  }
});

export default router;
