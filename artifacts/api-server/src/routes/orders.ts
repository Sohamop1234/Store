import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cartItemsTable, productsTable, ordersTable, customersTable } from "@workspace/db";
import { PlaceOrderBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = PlaceOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sessionId, customerName, customerEmail, customerPhone, address, city, pincode } = parsed.data;

  // Get cart items
  const rawItems = await db
    .select({
      id: cartItemsTable.id,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      product: productsTable,
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.sessionId, sessionId));

  if (rawItems.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const items = rawItems.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    product: item.product,
  }));

  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const [order] = await db
    .insert(ordersTable)
    .values({
      sessionId,
      customerName,
      customerEmail,
      customerPhone,
      address,
      city,
      pincode,
      total,
      status: "confirmed",
      items,
    })
    .returning();

  // Upsert customer — find existing by email or create new
  const [existingCustomer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.email, customerEmail));

  if (existingCustomer) {
    await db
      .update(customersTable)
      .set({
        totalOrders: existingCustomer.totalOrders + 1,
        totalSpent: existingCustomer.totalSpent + total,
        // Update address info in case it changed
        address,
        city,
        pincode,
        phone: customerPhone,
      })
      .where(eq(customersTable.id, existingCustomer.id));
  } else {
    await db.insert(customersTable).values({
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      address,
      city,
      pincode,
      totalOrders: 1,
      totalSpent: total,
    });
  }

  // Clear cart
  await db
    .delete(cartItemsTable)
    .where(eq(cartItemsTable.sessionId, sessionId));

  res.status(201).json({ ...order, items });
});

export default router;
