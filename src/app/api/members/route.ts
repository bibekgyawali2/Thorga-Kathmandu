import { NextRequest } from "next/server";
import { fetchMembers, saveMemberItem, deleteMemberItem } from "@/lib/supabase/data";
import { Member } from "@/data/mockData";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET() {
  try {
    const data = await fetchMembers();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/members] GET error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch members" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Member;
    await saveMemberItem(body);
    return new Response(JSON.stringify({ success: true, data: body }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/members] POST error:", error);
    return new Response(JSON.stringify({ error: "Failed to save member" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "ID is required" }), {
        status: 400,
        headers: NO_CACHE_HEADERS,
      });
    }
    await deleteMemberItem(id);
    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: NO_CACHE_HEADERS,
    });
  } catch (error) {
    console.error("[api/members] DELETE error:", error);
    return new Response(JSON.stringify({ error: "Failed to delete member" }), {
      status: 500,
      headers: NO_CACHE_HEADERS,
    });
  }
}
