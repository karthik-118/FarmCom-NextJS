import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // 👇 Next 16 expects params as a Promise, so we await it
  const { id } = await context.params;

  await dbConnect();

  // 👉 put your own deliver logic here
  const order = await Order.findById(id);

  if (!order) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  // Example: mark as delivered
  order.isDelivered = true;
  order.deliveredAt = new Date();

  await order.save();

  return NextResponse.json({ message: "Order marked as delivered" });
}
