import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  await dbConnect();

  const { value, comment } = await request.json();

  await Order.findByIdAndUpdate(id, {
    buyerRating: { value, comment },
  });

  return NextResponse.json({ message: "Rated" });
}

// Any extra export guarantees TS treats this as a module
export const runtime = "nodejs";
