import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { connectDB } from "@/lib/db/connect";
import { Project } from "@/models/Project";
import { ProductInstance } from "@/models/ProductInstance";

export async function GET() {
  try {
    const session = await requireSession();
    await connectDB();

    const project = await Project.findById(session.projectId).lean();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const productInstances = await ProductInstance.find({ projectId: session.projectId }).lean();

    return NextResponse.json({ project, productInstances });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
