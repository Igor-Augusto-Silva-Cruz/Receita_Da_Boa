import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db, usersTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
}

const DOMAINS = process.env.REPLIT_DOMAINS?.split(",") ?? [];
const callbackURL = DOMAINS.length > 0
  ? `https://${DOMAINS[0]}/api/auth/google/callback`
  : "http://localhost:80/api/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value ?? "";
        const nome = profile.displayName ?? email;
        const photoUrl = profile.photos?.[0]?.value ?? null;

        let [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.googleId, googleId))
          .limit(1);

        if (!user) {
          const [{ total }] = await db
            .select({ total: count() })
            .from(usersTable);

          const papel = total === 0 ? "adm" : "usuario";

          const [newUser] = await db
            .insert(usersTable)
            .values({ googleId, email, nome, papel: papel as "adm" | "usuario", photoUrl })
            .returning();
          user = newUser;
        } else {
          // Update photo if changed
          if (photoUrl && user.photoUrl !== photoUrl) {
            const [updated] = await db
              .update(usersTable)
              .set({ photoUrl })
              .where(eq(usersTable.id, user.id))
              .returning();
            user = updated;
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false, prompt: "select_account" } as object));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/?error=auth_failed" }),
  (req, res) => {
    const user = req.user as typeof usersTable.$inferSelect;
    const token = signToken({ userId: user.id, email: user.email, papel: user.papel });
    res.redirect(`/?token=${token}`);
  }
);

router.patch("/me", requireAuth, async (req, res) => {
  try {
    const updates: { bio?: string | null; nome?: string } = {};
    if (req.body?.bio !== undefined) {
      updates.bio = typeof req.body.bio === "string" ? req.body.bio.slice(0, 500) : null;
    }
    if (req.body?.nome !== undefined) {
      const nome = typeof req.body.nome === "string" ? req.body.nome.trim().slice(0, 60) : "";
      if (nome.length < 2) {
        res.status(400).json({ error: "Nome deve ter pelo menos 2 caracteres" });
        return;
      }
      updates.nome = nome;
    }
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Nenhum campo para atualizar" });
      return;
    }
    await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.userId));
    res.json({ message: "Perfil atualizado" });
  } catch {
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [user] = await db
      .select({ id: usersTable.id, nome: usersTable.nome, email: usersTable.email, papel: usersTable.papel, isBanned: usersTable.isBanned, photoUrl: usersTable.photoUrl, bio: usersTable.bio })
      .from(usersTable)
      .where(eq(usersTable.id, req.user!.userId))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado" });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
