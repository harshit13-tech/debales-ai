import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { getDashboardConfig, getDashboardStats } from "@/lib/services/dashboardService";

export async function GET() {
  try {
    const session = await requireAdmin();
    const [config, stats] = await Promise.all([
      getDashboardConfig(session.projectId),
      getDashboardStats(session.projectId),
    ]);

    return NextResponse.json({ config, stats });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
