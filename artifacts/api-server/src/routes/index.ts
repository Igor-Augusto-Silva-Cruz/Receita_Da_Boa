import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import receitasRouter from "./receitas.js";
import categoriasRouter from "./categorias.js";
import favoritosRouter from "./favoritos.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/receitas", receitasRouter);
router.use("/categorias", categoriasRouter);
router.use("/favoritos", favoritosRouter);

export default router;
