import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { connectDB } from "@/lib/db/connect";
import { Project } from "@/models/Project";
import { UpdateIntegrationsSchema } from "@/lib/schemas";

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json();
    const parsed = UpdateIntegrationsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();
    const project = await Project.findByIdAndUpdate(
      session.projectId,
      { $set: { integrations: parsed.data } },
      { new: true }
    );

    return NextResponse.json({ project });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
