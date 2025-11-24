import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  await dbConnect();

  const { value, comment } = await request.json();

  await Order.findByIdAndUpdate(id, {
    buyerRating: { value, comment },
  });

  return NextResponse.json({ message: "Rated" });
}

export const runtime = "nodejs";
