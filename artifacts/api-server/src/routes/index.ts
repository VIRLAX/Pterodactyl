import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import ordersRouter from "./orders.js";
import discountsRouter from "./discounts.js";
import invitesRouter from "./invites.js";
import reviewsRouter from "./reviews.js";
import bugsRouter from "./bugs.js";
import adminRouter from "./admin.js";
import settingsRouter from "./settings.js";
import backupRouter from "./backup.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(discountsRouter);
router.use(invitesRouter);
router.use(reviewsRouter);
router.use(bugsRouter);
router.use(adminRouter);
router.use(settingsRouter);
router.use(backupRouter);

export default router;
