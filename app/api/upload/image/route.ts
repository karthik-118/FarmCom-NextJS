import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// This route accepts a FormData field called "image"
// and saves it into /public/uploads/<filename>.
// Returns: { url: "/uploads/filename.ext" }

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "No image file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });

    const originalName = (file as any).name || "upload";
    const ext = originalName.includes(".")
      ? originalName.split(".").pop()
      : "png";

    const filename = `${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}.${ext}`;

    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);

    const url = `/uploads/${filename}`; // browser-accessible

    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    console.error("POST /api/upload/image error:", err);
    return NextResponse.json(
      { message: "Image upload failed" },
      { status: 500 }
    );
  }
}
