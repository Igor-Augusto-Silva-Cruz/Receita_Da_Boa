import { Router } from "express";
import { db, receitasTable, categoriasTable, usersTable, favoritosTable, likesTable, followsTable, reportsTable } from "@workspace/db";
import { eq, ilike, and, inArray, desc, count, sql } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/auth.js";
import {
  CreateReceitaBody,
  GetReceitasQueryParams,
  GetReceitaParams,
  UpdateReceitaParams,
  UpdateReceitaBody,
  DeleteReceitaParams,
} from "@workspace/api-zod";
import { verificarImagemImpropria } from "../lib/moderacao.js";
import { ObjectStorageService } from "../lib/objectStorage.js";

const router = Router();

async function buildReceitaQuery(userId?: number) {
  const rows = await db
    .select({
      id: receitasTable.id,
      titulo: receitasTable.titulo,
      descricao: receitasTable.descricao,
      ingredientes: receitasTable.ingredientes,
      instrucoes: receitasTable.instrucoes,
      urlImagem: receitasTable.urlImagem,
      categoriaId: receitasTable.categoriaId,
      autorId: receitasTable.autorId,
      isReported: receitasTable.isReported,
      createdAt: receitasTable.createdAt,
      categoria: { id: categoriasTable.id, nome: categoriasTable.nome },
      autor: { id: usersTable.id, nome: usersTable.nome, email: usersTable.email, papel: usersTable.papel, isBanned: usersTable.isBanned },
      likeCount: sql<number>`(SELECT COUNT(*) FROM likes WHERE likes.receita_id = ${receitasTable.id})`.mapWith(Number),
    })
    .from(receitasTable)
    .leftJoin(categoriasTable, eq(receitasTable.categoriaId, categoriasTable.id))
    .leftJoin(usersTable, eq(receitasTable.autorId, usersTable.id));

  if (!userId) {
    return rows.map(r => ({ ...r, isLiked: false, isFavorited: false }));
  }

  const [favs, likes] = await Promise.all([
    db.select({ receitaId: favoritosTable.receitaId }).from(favoritosTable).where(eq(favoritosTable.userId, userId)),
    db.select({ receitaId: likesTable.receitaId }).from(likesTable).where(eq(likesTable.userId, userId)),
  ]);

  const favSet = new Set(favs.map(f => f.receitaId));
  const likeSet = new Set(likes.map(l => l.receitaId));

  return rows.map(r => ({ ...r, isLiked: likeSet.has(r.id), isFavorited: favSet.has(r.id) }));
}

router.get("/", optionalAuth, async (req, res) => {
  try {
    const query = GetReceitasQueryParams.parse(req.query);
    const userId = req.user?.userId;

    let rows = await buildReceitaQuery(userId);

    // Feed filters
    if (query.feed === "populares") {
      rows = rows.sort((a, b) => b.likeCount - a.likeCount);
    } else if (query.feed === "seguindo") {
      if (!userId) { res.json([]); return; }
      const follows = await db.select({ followingId: followsTable.followingId }).from(followsTable).where(eq(followsTable.followerId, userId));
      const followingIds = new Set(follows.map(f => f.followingId));
      rows = rows.filter(r => followingIds.has(r.autorId)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } else {
      rows = rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    if (query.categoriaId) rows = rows.filter(r => r.categoriaId === query.categoriaId);
    if (query.autorId) rows = rows.filter(r => r.autorId === query.autorId);
    if (query.search) {
      const s = query.search.toLowerCase();
      rows = rows.filter(r => r.titulo.toLowerCase().includes(s));
    }

    res.json(rows);
  } catch {
    res.status(500).json({ error: "Erro ao buscar receitas" });
  }
});

router.get("/:id", optionalAuth, async (req, res) => {
  try {
    const { id } = GetReceitaParams.parse(req.params);
    const userId = req.user?.userId;
    const rows = await buildReceitaQuery(userId);
    const receita = rows.find(r => r.id === id);
    if (!receita) { res.status(404).json({ error: "Receita não encontrada" }); return; }
    res.json(receita);
  } catch {
    res.status(500).json({ error: "Erro ao buscar receita" });
  }
});

const objectStorage = new ObjectStorageService();

router.post("/", requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.userId)).limit(1);
    if (dbUser?.isBanned) { res.status(403).json({ error: "Usuário banido não pode criar receitas" }); return; }

    const body = CreateReceitaBody.parse(req.body);

    // Moderação de imagem via Gemini (apenas para imagens do storage)
    if (body.urlImagem && body.urlImagem.startsWith("/api/storage/objects/")) {
      try {
        const objectPath = body.urlImagem.replace("/api/storage", "");
        const objectFile = await objectStorage.getObjectEntityFile(objectPath);
        const response = await objectStorage.downloadObject(objectFile);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = response.headers.get("content-type") ?? "image/jpeg";

        const impropria = await verificarImagemImpropria(buffer, mimeType);
        if (impropria) {
          res.status(403).json({ error: "A imagem enviada contém conteúdo impróprio e não pode ser publicada." });
          return;
        }
      } catch (err) {
        console.error("Erro ao moderar imagem:", err);
        // Falha na moderação não bloqueia a criação
      }
    }

    const [receita] = await db.insert(receitasTable).values({ ...body, autorId: user.userId }).returning();
    res.status(201).json({ ...receita, likeCount: 0, isLiked: false, isFavorited: false });
  } catch {
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = UpdateReceitaParams.parse(req.params);
    const body = UpdateReceitaBody.parse(req.body);
    const user = req.user!;

    const [existing] = await db.select().from(receitasTable).where(eq(receitasTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Receita não encontrada" }); return; }
    if (existing.autorId !== user.userId && user.papel !== "adm") {
      res.status(403).json({ error: "Sem permissão para editar esta receita" }); return;
    }

    const [updated] = await db.update(receitasTable).set(body).where(eq(receitasTable.id, id)).returning();
    res.json(updated);
  } catch {
    res.status(400).json({ error: "Dados inválidos" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = DeleteReceitaParams.parse(req.params);
    const user = req.user!;

    const [existing] = await db.select().from(receitasTable).where(eq(receitasTable.id, id)).limit(1);
    if (!existing) { res.status(404).json({ error: "Receita não encontrada" }); return; }
    if (existing.autorId !== user.userId && user.papel !== "adm") {
      res.status(403).json({ error: "Sem permissão" }); return;
    }

    await db.delete(favoritosTable).where(eq(favoritosTable.receitaId, id));
    await db.delete(likesTable).where(eq(likesTable.receitaId, id));
    await db.delete(reportsTable).where(eq(reportsTable.receitaId, id));
    await db.delete(receitasTable).where(eq(receitasTable.id, id));
    res.json({ message: "Receita removida" });
  } catch {
    res.status(500).json({ error: "Erro ao remover receita" });
  }
});

export default router;
