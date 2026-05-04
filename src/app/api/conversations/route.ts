import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { canAccessProject } from "@/lib/access/rules";
import { getConversations, createConversation } from "@/lib/services/conversationService";
import { CreateConversationSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const conversations = await getConversations(session.id, session.projectId);
    return NextResponse.json({ conversations });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = CreateConversationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const conv = await createConversation(
      session.id,
      session.projectId,
      parsed.data.productInstanceId,
      parsed.data.title
    );
    return NextResponse.json({ conversation: conv });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
