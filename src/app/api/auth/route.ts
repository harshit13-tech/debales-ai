import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Project } from "@/models/Project";
import { LoginSchema } from "@/lib/schemas";
import { encodeSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();
    const { email, projectSlug } = parsed.data;

    const project = await Project.findOne({ slug: projectSlug });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const user = await User.findOne({ email, projectId: project._id });
    if (!user) {
      return NextResponse.json({ error: "User not found in this project" }, { status: 401 });
    }

    const sessionData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      projectId: project._id.toString(),
    };

    const sessionToken = encodeSession(sessionData);
    const response = NextResponse.json({ success: true, user: sessionData, projectSlug });
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  return response;
}
