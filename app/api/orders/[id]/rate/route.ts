import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Next 16 expects params as a Promise
  const { id } = await context.params;

  const { rating } = await request.json();

  if (typeof rating !== "number") {
    return NextResponse.json(
      { message: "Invalid rating" },
      { status: 400 }
    );
  }

  await dbConnect();

  await Order.findByIdAndUpdate(id, { rating });

  return NextResponse.json({ message: "Rating updated" });
}
