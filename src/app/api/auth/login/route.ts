import { NextResponse } from "next/server";
import { DEFAULT_ADMIN_CONFIG, SUPERADMIN_EMAIL } from "@/lib/adminAuth";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    const cleanId = (username || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();

    const envAdminUser = (
      process.env.ADMIN_USERNAME ||
      process.env.NEXT_PUBLIC_ADMIN_USERNAME ||
      DEFAULT_ADMIN_CONFIG.username ||
      "admin"
    ).toLowerCase();

    const envAdminPass =
      process.env.ADMIN_PASSWORD ||
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD ||
      DEFAULT_ADMIN_CONFIG.password ||
      "thorga2081@admin";

    const superEmail = (
      process.env.SUPERADMIN_EMAIL ||
      process.env.NEXT_PUBLIC_SUPERADMIN_EMAIL ||
      SUPERADMIN_EMAIL
    ).toLowerCase();

    // Check against superadmin or admin credentials
    if (
      cleanId === superEmail ||
      cleanId === envAdminUser ||
      cleanId === "admin" ||
      cleanId === "superadmin@thorgaktm.org.np" ||
      cleanId === "admin@thorgaktm.org.np"
    ) {
      if (cleanPass === envAdminPass) {
        const isSuper =
          cleanId === superEmail ||
          cleanId === "superadmin@thorgaktm.org.np" ||
          cleanId === envAdminUser ||
          cleanId === "admin";
        return NextResponse.json({
          success: true,
          user: {
            id: isSuper ? "usr-superadmin" : "usr-general-admin",
            name: isSuper ? "System Superadmin" : "Forum Administrator",
            email: cleanId.includes("@") ? cleanId : superEmail,
            role: "superadmin",
            isActive: true,
            addedAt: "2026-08-01",
            addedBy: "System",
          },
        });
      }
    }

    return NextResponse.json(
      { success: false, error: "Invalid username or password." },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Authentication failed." },
      { status: 500 }
    );
  }
}
