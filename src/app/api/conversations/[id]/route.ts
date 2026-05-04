import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { sendMessage } from "@/lib/services/conversationService";
import { SendMessageSchema } from "@/lib/schemas";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const parsed = SendMessageSchema.safeParse({ ...body, conversationId: params.id });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const result = await sendMessage(
      params.id,
      session.id,
      session.projectId,
      parsed.data.message
    );

    return NextResponse.json({
      message: result.conversation.messages[result.conversation.messages.length - 1],
      steps: result.steps,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
