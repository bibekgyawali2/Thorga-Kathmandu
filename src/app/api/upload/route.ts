import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB limit

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "thorga_uploads";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // 1. Validate File Size (Max 2MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds 2MB limit. (Your file: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
        },
        { status: 400 }
      );
    }

    // 2. Validate File Type (Images & PDFs)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Only Images (JPEG, PNG, WebP, GIF) and PDF documents are allowed.`,
        },
        { status: 400 }
      );
    }

    // 3. Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload to Cloudinary
    const result = await uploadToCloudinary(buffer, folder);

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      resourceType: result.resource_type,
    });
  } catch (error: unknown) {
    console.error("Cloudinary upload API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file to Cloudinary";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, publicId } = body;

    const target = url || publicId;
    if (!target) {
      return NextResponse.json(
        { error: "Missing 'url' or 'publicId' parameter" },
        { status: 400 }
      );
    }

    const result = await deleteFromCloudinary(target);
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    console.error("Cloudinary delete API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete file from Cloudinary";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
