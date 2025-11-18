import { NextResponse } from "next/server";
import Product from "@/models/Product";
import { dbConnect } from "@/lib/db";

export const GET = async () => {
  await dbConnect();
  const products = await Product.find().sort({ createdAt: -1 });
  return NextResponse.json(products);
};
