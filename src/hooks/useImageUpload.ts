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

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          return { url: data.url, cloudinaryId: data.cloudinaryId };
        }
      }

      // Fallback for static hosting: Convert file to Data URL
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ url: reader.result as string });
        };
        reader.onerror = () => {
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    } catch {
      // Fallback for static hosting
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({ url: reader.result as string });
        };
        reader.onerror = () => {
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading, error };
}
