import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import storageRouter from "./storage.js";
import receitasRouter from "./receitas.js";
import categoriasRouter from "./categorias.js";
import favoritosRouter from "./favoritos.js";
import likesRouter from "./likes.js";
import followsRouter from "./follows.js";
import comentariosRouter from "./comentarios.js";
import reportsRouter from "./reports.js";
import adminRouter from "./admin.js";
import usuariosRouter from "./usuarios.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use("/auth", authRouter);
router.use("/receitas", receitasRouter);
router.use("/categorias", categoriasRouter);
router.use("/favoritos", favoritosRouter);
router.use("/likes", likesRouter);
router.use("/follows", followsRouter);
router.use("/comentarios", comentariosRouter);
router.use("/reports", reportsRouter);
router.use("/admin", adminRouter);
router.use("/usuarios", usuariosRouter);

export default router;
