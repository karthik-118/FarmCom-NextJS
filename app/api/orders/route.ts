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

    // ---------- 📩 Contentstack Automate Order Alert ----------
    try {
      const automateOrderUrl = process.env.AUTOMATE_ORDER_EVENT_URL2;
      if (automateOrderUrl) {
        // Build readable summary
        const summaryLines = (body.products || []).map((p: any) => {
          const qty = p.quantity || 1;
          const price = Number(p.price) || 0;
          return `${qty} x ${p.name} – ₹${price} each (₹${qty * price})`;
        });

        const totalItems = (body.products || []).reduce(
          (n: number, p: any) => n + (p.quantity || 1),
          0
        );

        const summary = [
          ...summaryLines,
          "",
          `Total items: ${totalItems}`,
        ].join("\n");

        const shippingAddress = `${body.shippingDetails.address}, ${body.shippingDetails.city}, ${body.shippingDetails.state} - ${body.shippingDetails.pincode}`;

        // Send POST request to Automate (non-blocking)
        fetch(automateOrderUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "order",
            orderId: order._id.toString(),
            customerName: body.customerName,
            customerEmail: body.customerEmail,
            totalAmount: body.totalAmount,
            paymentMethod: body.paymentMethod,
            summary,
            shippingAddress,
            time: new Date().toISOString(),
          }),
        }).catch((err) =>
          console.error("Automate order alert failed:", err)
        );
      }
    } catch (err) {
      console.error("Order automate call error:", err);
    }

    // ---------- Response ----------
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

// optional but recommended with Mongo/Mongoose
export const runtime = "nodejs";
