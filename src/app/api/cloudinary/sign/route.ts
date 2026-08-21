import { NextResponse } from "next/server";
import { generateUploadSignature } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paramsToSign } = body;

    if (!paramsToSign) {
      return NextResponse.json(
        { error: "Missing paramsToSign parameter" },
        { status: 400 }
      );
    }

    const signature = generateUploadSignature(paramsToSign);
    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Cloudinary sign error:", error);
    return NextResponse.json(
      { error: "Failed to generate Cloudinary signature" },
      { status: 500 }
    );
  }
}
