// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      name,
      email,
      password,
      role = "buyer", // default role
    } = body as {
      name: string;
      email: string;
      password: string;
      role?: string;
    };

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // create user
    const createdUser = await User.create({ name, email, password, role });

    // relax typing so TS doesn't complain about _id being unknown
    const user = createdUser as any;

    const id =
      user._id && typeof user._id.toString === "function"
        ? user._id.toString()
        : String(user._id);

    const token = jwt.sign(
      { id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    return NextResponse.json(
      {
        token,
        user: {
          id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Signup API error:", err);
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
