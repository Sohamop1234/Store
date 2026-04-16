import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, paymentsTable, ordersTable } from "@workspace/db";
import {
  CreatePaymentBody,
  ConfirmPaymentParams,
  ConfirmPaymentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { orderId, method, upiId, cardLast4 } = parsed.data;

  // Verify order exists
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [payment] = await db
    .insert(paymentsTable)
    .values({
      orderId,
      method,
      status: method === "cod" ? "confirmed" : "pending",
      amount: order.total,
      upiId: upiId ?? null,
      cardLast4: cardLast4 ?? null,
    })
    .returning();

  // If COD, mark order as processing immediately
  if (method === "cod") {
    await db
      .update(ordersTable)
      .set({ status: "processing" })
      .where(eq(ordersTable.id, orderId));
  }

  res.status(201).json(payment);
});

router.post("/payments/:id/confirm", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = ConfirmPaymentParams.safeParse({ id: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = ConfirmPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [payment] = await db
    .update(paymentsTable)
    .set({ status: "confirmed", transactionRef: parsed.data.transactionRef })
    .where(eq(paymentsTable.id, params.data.id))
    .returning();

  if (!payment) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  // Update order status to processing after payment confirmed
  await db
    .update(ordersTable)
    .set({ status: "processing" })
    .where(eq(ordersTable.id, payment.orderId));

  res.json(payment);
});

export default router;
