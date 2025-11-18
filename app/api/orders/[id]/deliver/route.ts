import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // unwrap params (because in your Next version it's a Promise)
  const { id } = await context.params;

  const body = await request.json();
  const { rating } = body;

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

// keeps file clearly a module + lets you control runtime
export const runtime = "nodejs";
