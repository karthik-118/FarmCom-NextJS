import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // ⬅️ Next 16: params is a Promise
  const { id } = await context.params;

  await dbConnect();

  const order = await Order.findById(id);

  if (!order) {
    return NextResponse.json(
      { message: "Order not found" },
      { status: 404 }
    );
  }

  // 👉 keep or modify this logic as per your schema
  order.isDelivered = true;
  order.deliveredAt = new Date();

  await order.save();

  return NextResponse.json({ message: "Order marked as delivered" });
}
