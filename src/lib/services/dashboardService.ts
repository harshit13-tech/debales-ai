import { connectDB } from "@/lib/db/connect";
import { DashboardConfig } from "@/models/DashboardConfig";
import { Conversation } from "@/models/Conversation";
import { Project } from "@/models/Project";

export async function getDashboardConfig(projectId: string) {
  await connectDB();
  return DashboardConfig.findOne({ projectId }).lean();
}

export async function getDashboardStats(projectId: string) {
  await connectDB();
  const [totalConversations, project] = await Promise.all([
    Conversation.countDocuments({ projectId }),
    Project.findById(projectId).lean(),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayConversations = await Conversation.countDocuments({
    projectId,
    createdAt: { $gte: todayStart },
  });

  const recentConversations = await Conversation.find({ projectId })
    .select("title createdAt messages")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    totalConversations,
    todayConversations,
    integrations: project?.integrations ?? { shopify: { enabled: false }, crm: { enabled: false } },
    recentConversations,
    aiResponsesTotal: totalConversations * 2,
  };
}
