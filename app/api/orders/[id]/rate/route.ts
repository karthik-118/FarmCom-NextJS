import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

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

export const runtime = "nodejs";
