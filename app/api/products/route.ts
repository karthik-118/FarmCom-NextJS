// /app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";

// GET /api/products  → list all products
export async function GET() {
  try {
    await dbConnect();
    const products = await Product.find().lean();
    return NextResponse.json(products, { status: 200 });
  } catch (err) {
    console.error("GET /api/products error:", err);
    return NextResponse.json(
      { message: "Server error fetching products" },
      { status: 500 }
    );
  }
}

// POST /api/products  → create a new product (for SellerDashboard)
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    // You can add validation here if you want
    // e.g. check required fields: name, price, etc.
    const product = await Product.create(body);

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("POST /api/products error:", err);
    return NextResponse.json(
      { message: "Server error creating product" },
      { status: 500 }
    );
  }
}
