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
 * Generate a signed upload signature for direct client-side uploads (CldUploadWidget / custom frontend)
 */
export function generateUploadSignature(paramsToSign: Record<string, string | number>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error("CLOUDINARY_API_SECRET is not configured");
  }
  return cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
}
