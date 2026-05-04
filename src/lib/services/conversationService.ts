import { connectDB } from "@/lib/db/connect";
import { Conversation } from "@/models/Conversation";
import { Project } from "@/models/Project";
import { ProductInstance } from "@/models/ProductInstance";
import { callAI, getIntegrationSteps } from "@/lib/services/aiService";
import mongoose from "mongoose";

export async function getConversations(userId: string, projectId: string) {
  await connectDB();
  return Conversation.find({ userId, projectId })
    .select("title createdAt updatedAt messages")
    .sort({ updatedAt: -1 })
    .lean();
}

export async function getConversationById(id: string, userId: string, projectId: string) {
  await connectDB();
  return Conversation.findOne({
    _id: id,
    projectId,
    $or: [{ userId }],
  }).lean();
}

export async function createConversation(
  userId: string,
  projectId: string,
  productInstanceId: string,
  title?: string
) {
  await connectDB();
  const conv = new Conversation({
    userId,
    projectId,
    productInstanceId,
    title: title || "New Conversation",
    messages: [],
  });
  return conv.save();
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  projectId: string,
  content: string
) {
  await connectDB();

  const conv = await Conversation.findOne({ _id: conversationId, projectId });
  if (!conv) throw new Error("Conversation not found");

  // Add user message
  conv.messages.push({ role: "user", content, createdAt: new Date() });

  // Get project integrations
  const project = await Project.findById(projectId).lean();
  const productInstance = await ProductInstance.findById(conv.productInstanceId).lean();

  const integrations = {
    shopifyEnabled: project?.integrations?.shopify?.enabled ?? false,
    crmEnabled: project?.integrations?.crm?.enabled ?? false,
    productType: productInstance?.productType ?? "ai-sales-assistant",
  };

  const steps = getIntegrationSteps(integrations);

  // Build message history for AI
  const history = conv.messages.slice(-10).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const aiResponse = await callAI(history, integrations);

  conv.messages.push({
    role: "assistant",
    content: aiResponse,
    steps,
    createdAt: new Date(),
  });

  // Auto-title from first message
  if (conv.messages.length === 2) {
    conv.title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
  }

  await conv.save();
  return { conversation: conv, steps };
}
