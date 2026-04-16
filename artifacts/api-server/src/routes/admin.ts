import { Router, type IRouter } from "express";
import { eq, desc, count } from "drizzle-orm";
import { db, ordersTable, customersTable, productsTable, paymentsTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminUpdateOrderStatusParams,
  AdminUpdateOrderStatusBody,
} from "@workspace/api-zod";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "somya@admin123";
const ADMIN_TOKEN = "somya-admin-token-2024";

const router: IRouter = Router();

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  res.json({ token: ADMIN_TOKEN, success: true });
});

function requireAdmin(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ") || auth.slice(7) !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.get("/admin/orders", requireAdmin, async (_req, res): Promise<void> => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));

  // Attach payment info
  const enriched = await Promise.all(
    orders.map(async (order) => {
      const [payment] = await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, order.id))
        .limit(1);
      return {
        ...order,
        paymentMethod: payment?.method ?? null,
        paymentStatus: payment?.status ?? null,
      };
    })
  );

  res.json(enriched);
});

router.put("/admin/orders/:id/status", requireAdmin, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminUpdateOrderStatusParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.orderId, order.id))
    .limit(1);

  res.json({
    ...order,
    paymentMethod: payment?.method ?? null,
    paymentStatus: payment?.status ?? null,
  });
});

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const [ordersResult] = await db.select({ total: count() }).from(ordersTable);
  const [customersResult] = await db.select({ total: count() }).from(customersTable);
  const [productsResult] = await db.select({ total: count() }).from(productsTable);

  const allOrders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = allOrders.filter(
    (o) => o.status === "confirmed" || o.status === "processing"
  ).length;

  const recentOrders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(5);

  const recentEnriched = await Promise.all(
    recentOrders.map(async (order) => {
      const [payment] = await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.orderId, order.id))
        .limit(1);
      return {
        ...order,
        paymentMethod: payment?.method ?? null,
        paymentStatus: payment?.status ?? null,
      };
    })
  );

  res.json({
    totalOrders: ordersResult?.total ?? 0,
    totalRevenue,
    totalCustomers: customersResult?.total ?? 0,
    totalProducts: productsResult?.total ?? 0,
    pendingOrders,
    recentOrders: recentEnriched,
  });
});

export default router;
