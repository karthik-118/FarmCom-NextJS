import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );

    if (role !== "seller") {
      return NextResponse.json({ message: "Only sellers allowed" }, { status: 403 });
    }

    const orders = await Order.find({ "products.sellerId": userId }).lean();

    return NextResponse.json(orders);
  } catch (err) {
    console.error("GET /api/orders/seller error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
