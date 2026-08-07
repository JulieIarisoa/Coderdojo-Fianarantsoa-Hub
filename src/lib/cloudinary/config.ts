import crypto from "crypto";
import { buildOptimizedCloudinaryUrl } from "@/lib/cloudinary/transform";

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

/**
 * Uploads a file buffer directly to Cloudinary using signed upload REST API
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = "coderdojo_memories"
): Promise<{ url: string; publicId: string }> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured on the server.");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);

  // Generate signature for signed Cloudinary upload
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

  const formData = new FormData();
  const uint8Array = new Uint8Array(fileBuffer);
  const blob = new Blob([uint8Array]);
  formData.append("file", blob);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp.toString());
  formData.append("signature", signature);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Cloudinary upload failed: ${errText}`);
  }

  const data: CloudinaryUploadResponse = await res.json();
  return {
    url: buildOptimizedCloudinaryUrl(cloudName, data.public_id),
    publicId: data.public_id,
  };
}
