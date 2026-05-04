import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

const ProjectSchema = new mongoose.Schema({
  name: String, slug: String, description: String,
  integrations: {
    shopify: { enabled: Boolean, storeUrl: String },
    crm: { enabled: Boolean, crmName: String },
  },
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  name: String, email: String, passwordHash: String,
  projectId: mongoose.Schema.Types.ObjectId,
  role: { type: String, enum: ["admin", "member"] },
}, { timestamps: true });

const ProductInstanceSchema = new mongoose.Schema({
  projectId: mongoose.Schema.Types.ObjectId,
  nameSpace: String, productType: String, displayName: String, systemPrompt: String,
}, { timestamps: true });

const ConversationSchema = new mongoose.Schema({
  projectId: mongoose.Schema.Types.ObjectId,
  productInstanceId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  title: String,
  messages: [{
    role: String, content: String, steps: [String],
    createdAt: { type: Date, default: Date.now }, _id: false,
  }],
}, { timestamps: true });

const WidgetSchema = new mongoose.Schema({
  id: String, type: String, title: String, subtitle: String,
  order: Number, span: String, config: mongoose.Schema.Types.Mixed,
}, { _id: false });

const SectionSchema = new mongoose.Schema({
  id: String, label: String, description: String, order: Number, widgets: [WidgetSchema],
}, { _id: false });

const DashboardConfigSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, unique: true },
  title: String, subtitle: String, sections: [SectionSchema], theme: String,
}, { timestamps: true });

const Project = mongoose.models.Project || mongoose.model("Project", ProjectSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);
const ProductInstance = mongoose.models.ProductInstance || mongoose.model("ProductInstance", ProductInstanceSchema);
const Conversation = mongoose.models.Conversation || mongoose.model("Conversation", ConversationSchema);
const DashboardConfig = mongoose.models.DashboardConfig || mongoose.model("DashboardConfig", DashboardConfigSchema);

async function seed() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!");

  await Promise.all([
    Project.deleteMany({}), User.deleteMany({}),
    ProductInstance.deleteMany({}), Conversation.deleteMany({}),
    DashboardConfig.deleteMany({}),
  ]);
  console.log("Cleared existing data");

  const techcorp = await Project.create({
    name: "TechCorp Inc.", slug: "techcorp", description: "B2B SaaS company",
    integrations: {
      shopify: { enabled: true, storeUrl: "https://techcorp.myshopify.com" },
      crm: { enabled: false, crmName: "HubSpot" },
    },
  });

  const retailco = await Project.create({
    name: "RetailCo", slug: "retailco", description: "E-commerce retailer",
    integrations: {
      shopify: { enabled: false, storeUrl: "https://retailco.myshopify.com" },
      crm: { enabled: true, crmName: "Salesforce" },
    },
  });
  console.log("Projects created");

  const adminUser = await User.create({
    name: "Alex Admin", email: "admin@techcorp.com",
    passwordHash: "demo-hash", projectId: techcorp._id, role: "admin",
  });
  const memberUser = await User.create({
    name: "Maria Member", email: "member@techcorp.com",
    passwordHash: "demo-hash", projectId: techcorp._id, role: "member",
  });
  await User.create({
    name: "Rita Retail", email: "admin@retailco.com",
    passwordHash: "demo-hash", projectId: retailco._id, role: "admin",
  });
  console.log("Users created");

  const salesBot = await ProductInstance.create({
    projectId: techcorp._id, nameSpace: "techcorp-sales",
    productType: "ai-sales-assistant", displayName: "Sales AI Assistant",
    systemPrompt: "You are a helpful sales AI for TechCorp.",
  });

  await ProductInstance.create({
    projectId: retailco._id, nameSpace: "retailco-support",
    productType: "ai-support-agent", displayName: "Support Agent",
    systemPrompt: "You are a customer support agent for RetailCo.",
  });
  console.log("Product instances created");

  await Conversation.create({
    projectId: techcorp._id, productInstanceId: salesBot._id, userId: adminUser._id,
    title: "Q2 pipeline review",
    messages: [
      { role: "user", content: "Show me the current pipeline status" },
      { role: "assistant", content: "Your pipeline has 24 leads, 8 in demo, 5 proposals active.", steps: ["Analyzing...", "Querying CRM...", "Generating response..."] },
    ],
  });
  await Conversation.create({
    projectId: techcorp._id, productInstanceId: salesBot._id, userId: memberUser._id,
    title: "Latest Shopify orders",
    messages: [
      { role: "user", content: "What are our recent orders?" },
      { role: "assistant", content: "Recent orders: #1042 Pro Plan $299 (fulfilled), #1041 Starter Kit $49 (processing).", steps: ["Fetching Shopify data...", "Generating response..."] },
    ],
  });
  console.log("Conversations created");

  await DashboardConfig.create({
    projectId: techcorp._id,
    title: "TechCorp Admin Dashboard",
    subtitle: "Powered by MongoDB config — edit the DashboardConfig document to change this UI",
    theme: "light",
    sections: [
      {
        id: "overview", label: "Overview", description: "Key metrics at a glance", order: 1,
        widgets: [
          { id: "w1", type: "stat-card", title: "Total Conversations", span: "third", order: 1, config: { statKey: "total-conversations" } },
          { id: "w2", type: "stat-card", title: "Today's Chats", span: "third", order: 2, config: { statKey: "today-conversations" } },
          { id: "w3", type: "stat-card", title: "AI Responses", span: "third", order: 3, config: { statKey: "ai-responses" } },
          { id: "w4", type: "stat-card", title: "Active Integrations", span: "third", order: 4, config: { statKey: "active-integrations" } },
        ],
      },
      {
        id: "analytics", label: "Analytics", description: "Conversation trends and AI usage", order: 2,
        widgets: [
          { id: "w5", type: "conversation-chart", title: "Weekly Conversations", span: "half", order: 1 },
          { id: "w6", type: "ai-usage", title: "AI Usage Quota", span: "half", order: 2 },
        ],
      },
      {
        id: "integrations-activity", label: "Integrations & Activity", description: "Connected services and recent interactions", order: 3,
        widgets: [
          { id: "w7", type: "integration-status", title: "Integration Status", span: "half", order: 1 },
          { id: "w8", type: "recent-activity", title: "Recent Conversations", span: "half", order: 2 },
          { id: "w9", type: "quick-actions", title: "Quick Actions", span: "third", order: 3, config: { actions: [{ label: "Go to Chat", href: "/chat" }, { label: "View Conversations", href: "/chat" }] } },
        ],
      },
    ],
  });

  await DashboardConfig.create({
    projectId: retailco._id,
    title: "RetailCo Dashboard",
    subtitle: "E-commerce AI insights",
    theme: "light",
    sections: [
      {
        id: "overview", label: "Store Overview", description: "RetailCo metrics", order: 1,
        widgets: [
          { id: "r1", type: "stat-card", title: "Conversations", span: "half", order: 1, config: { statKey: "total-conversations" } },
          { id: "r2", type: "integration-status", title: "Integrations", span: "half", order: 2 },
        ],
      },
    ],
  });

  console.log("Dashboard configs created!");
  console.log("\nSeed complete! Demo logins:");
  console.log("  admin@techcorp.com  / project: techcorp  (admin)");
  console.log("  member@techcorp.com / project: techcorp  (member)");
  console.log("  admin@retailco.com  / project: retailco  (admin)");

  await mongoose.disconnect();
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
