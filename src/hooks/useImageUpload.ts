"use client";

import { useState } from "react";

interface UploadedImage {
  url: string;
  cloudinaryId?: string;
}

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<UploadedImage | null> => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "L'image n'a pas pu être envoyée.");
      }

      return {
        url: data.url,
        cloudinaryId: data.cloudinaryId,
      };
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Erreur lors de l'envoi de l'image.";
      setError(message);
      console.error("Image upload failed", uploadError);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading, error };
}
