import { cookies } from "next/headers";
import { connectDB } from "@/lib/db/connect";
import { User, IUser } from "@/models/User";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  projectId: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie?.value) return null;

  try {
    const parsed = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
    return parsed as SessionUser;
  } catch {
    return null;
  }
}

export function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "admin") throw new Error("FORBIDDEN");
  return session;
}
