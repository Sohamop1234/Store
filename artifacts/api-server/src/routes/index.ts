import { Router, type IRouter } from "express";
import healthRouter from "./health";
import productsRouter from "./products";
import cartRouter from "./cart";
import ordersRouter from "./orders";
import paymentsRouter from "./payments";
import customersRouter from "./customers";
import adminRouter from "./admin";
import otpRouter from "./otp";

const router: IRouter = Router();

router.use(healthRouter);
router.use(productsRouter);
router.use(cartRouter);
router.use(ordersRouter);
router.use(paymentsRouter);
router.use(customersRouter);
router.use(adminRouter);
router.use(otpRouter);

export default router;
