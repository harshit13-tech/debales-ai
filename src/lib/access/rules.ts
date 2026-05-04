import { SessionUser } from "@/lib/session";

export function canAccessProject(user: SessionUser, projectId: string): boolean {
  return user.projectId === projectId;
}

export function canAccessAdmin(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canManageIntegrations(user: SessionUser): boolean {
  return user.role === "admin";
}

export function canViewConversation(
  user: SessionUser,
  conversationUserId: string,
  conversationProjectId: string
): boolean {
  if (user.role === "admin" && user.projectId === conversationProjectId) return true;
  return user.id === conversationUserId && user.projectId === conversationProjectId;
}
