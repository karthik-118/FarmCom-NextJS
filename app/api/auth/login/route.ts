// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";

type LeanUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  password: string;
};

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();
    const { email, password } = body as { email: string; password: string };

    const user = await User.findOne({ email }).lean<LeanUser>();

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    // 🔔 Fire Contentstack Automate login alert (non-blocking)
    const automateUrl = process.env.AUTOMATE_USER_EVENT_URL;
    if (automateUrl) {
      fetch(automateUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "login",
          name: user.name,
          email: user.email,
          role: user.role,
          time: new Date().toISOString(),
        }),
      }).catch((err) =>
        console.error("Automate login alert failed:", err)
      );
    }

    return NextResponse.json({
      token,
      user: {
        id: user._id, // string now, no .toString() needed
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
