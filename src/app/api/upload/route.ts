import { NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary/config";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (!fileEntry.type.startsWith("image/")) {
      return NextResponse.json({ error: "Le fichier doit être une image." }, { status: 415 });
    }

    const arrayBuffer = await fileEntry.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadToCloudinary(buffer, "coderdojo_hub");

    return NextResponse.json({
      success: true,
      url: result.url,
      cloudinaryId: result.publicId,
    });
  } catch (error: unknown) {
    console.error("Cloudinary upload error:", error);
    const message = error instanceof Error ? error.message : "Erreur Cloudinary";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
