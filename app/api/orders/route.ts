import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Order from "@/models/Order";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();

    // Create order
    const order = await Order.create({
      customerId: body.customerId,
      products: body.products,
      totalAmount: body.totalAmount,
      shippingDetails: body.shippingDetails,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      paymentMethod: body.paymentMethod,
      status: "Pending",
    });

    return NextResponse.json(order, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/orders error:", err);
    return NextResponse.json(
      { message: "Server error creating order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    const orders = await Order.find().lean();
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json(
      { message: "Error fetching orders" },
      { status: 500 }
    );
  }
}
