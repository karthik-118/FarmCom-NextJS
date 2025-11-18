// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";

export const runtime = "nodejs";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // 👈 params is a Promise
) {
  const { id } = await params;                      // 👈 await it
  console.log("🟠 DELETE /api/products/[id] called with id =", id);

  try {
    await dbConnect();

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      console.log("🟡 No product found with that id");
      return NextResponse.json(
        { message: "No product found with that id", deleted: false },
        { status: 200 } // still idempotent
      );
    }

    console.log("✅ Product deleted:", deleted._id.toString());

    return NextResponse.json(
      { message: "Product deleted", deleted: true },
      { status: 200 }
    );
  } catch (err) {
    console.error("🔴 DELETE /api/products/[id] fatal error:", err);
    return NextResponse.json(
      { message: "Error deleting product" },
      { status: 500 }
    );
  }
}
