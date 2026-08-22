import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { fetchMembers, saveMemberItem, deleteMemberItem } from "@/lib/supabase/data";
import { Member } from "@/data/mockData";
import { revalidateTag } from "next/cache";

export async function GET(request: NextRequest) {
  try {
    const data = await fetchMembers();
    const json = JSON.stringify(data);

    const etag = `"${createHash("sha1").update(json).digest("hex")}"`;

    const ifNoneMatch = request.headers.get("if-none-match");
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      });
    }

    return new Response(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ETag: etag,
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        Vary: "Accept-Encoding",
      },
    });
  } catch (error) {
    console.error("[api/members] GET error:", error);
    return Response.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Member;
    await saveMemberItem(body);
    revalidateTag("members", "max");
    return Response.json({ success: true, data: body });
  } catch (error) {
    console.error("[api/members] POST error:", error);
    return Response.json({ error: "Failed to save member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return Response.json({ error: "ID is required" }, { status: 400 });
    await deleteMemberItem(id);
    revalidateTag("members", "max");
    return Response.json({ success: true, id });
  } catch (error) {
    console.error("[api/members] DELETE error:", error);
    return Response.json({ error: "Failed to delete member" }, { status: 500 });
  }
}
