import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

// Configure Cloudinary server-side instance
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

/**
 * Upload a file buffer or base64 string directly to Cloudinary from server actions / API routes
 */
export async function uploadToCloudinary(
  file: string | Buffer,
  folder = "uploads"
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    if (typeof file === "string") {
      cloudinary.uploader.upload(
        file,
        {
          folder,
          resource_type: "auto",
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            reject(error || new Error("Upload failed"));
          } else {
            resolve(result);
          }
        }
      );
    } else {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            reject(error || new Error("Upload failed"));
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(file);
    }
  });
}

/**
 * Extract publicId and resourceType from a Cloudinary URL or raw string
 */
export function extractCloudinaryDetails(urlOrPublicId: string): {
  publicId: string;
  resourceType: "image" | "raw" | "video";
} | null {
  if (!urlOrPublicId || typeof urlOrPublicId !== "string") return null;

  // Check if it's a full Cloudinary URL
  if (urlOrPublicId.includes("cloudinary.com")) {
    const isRaw = urlOrPublicId.includes("/raw/upload/") || urlOrPublicId.toLowerCase().endsWith(".pdf");
    const isVideo = urlOrPublicId.includes("/video/upload/");
    const resourceType: "image" | "raw" | "video" = isRaw ? "raw" : isVideo ? "video" : "image";

    // Extract path after /upload/(v\d+/)?
    const uploadIndex = urlOrPublicId.indexOf("/upload/");
    if (uploadIndex !== -1) {
      let pathAfterUpload = urlOrPublicId.substring(uploadIndex + 8);
      // Remove version prefix if present (e.g., v1724245678/)
      pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, "");

      if (resourceType === "image") {
        // Remove file extension for image public_ids (Cloudinary strips extensions for images)
        pathAfterUpload = pathAfterUpload.replace(/\.[^/.]+$/, "");
      }
      return { publicId: decodeURIComponent(pathAfterUpload), resourceType };
    }
  }

  // If it's already a publicId
  return {
    publicId: urlOrPublicId,
    resourceType: urlOrPublicId.toLowerCase().endsWith(".pdf") ? "raw" : "image",
  };
}

/**
 * Delete an asset from Cloudinary by URL or publicId
 */
export async function deleteFromCloudinary(urlOrPublicId: string) {
  const details = extractCloudinaryDetails(urlOrPublicId);
  if (!details) {
    return { result: "not_found" };
  }

  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiKey || !apiSecret || apiKey.includes("placeholder") || apiSecret.includes("placeholder")) {
    return { result: "skipped_unconfigured" };
  }

  try {
    const res = await cloudinary.uploader.destroy(details.publicId, {
      resource_type: details.resourceType,
      invalidate: true,
    });

    // If result was 'not found' and it wasn't raw, try raw fallback
    if (res.result === "not found") {
      const fallbackType = details.resourceType === "image" ? "raw" : "image";
      const fallbackRes = await cloudinary.uploader.destroy(details.publicId, {
        resource_type: fallbackType,
        invalidate: true,
      });
      return fallbackRes;
    }

    return res;
  } catch (error) {
    console.error("Cloudinary destroy error:", error);
    return { result: "error", error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Generate a signed upload signature for direct client-side uploads (CldUploadWidget / custom frontend)
 */
export function generateUploadSignature(paramsToSign: Record<string, string | number>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error("CLOUDINARY_API_SECRET is not configured");
  }
  return cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
}
