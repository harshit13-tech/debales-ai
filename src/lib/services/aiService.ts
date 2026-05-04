interface IntegrationContext {
  shopifyEnabled: boolean;
  crmEnabled: boolean;
  productType: string;
}

interface ShopifyData {
  recentOrders: { id: string; product: string; status: string; amount: string }[];
  inventory: { item: string; stock: number }[];
}

interface CRMData {
  contacts: { name: string; stage: string; value: string }[];
  pipeline: { stage: string; count: number }[];
}

function buildSystemPrompt(integrations: IntegrationContext): string {
  let prompt = `You are a helpful ${integrations.productType} AI assistant for Debales AI platform. Be concise, professional, and helpful.`;

  if (integrations.shopifyEnabled) {
    prompt += ` You have access to Shopify store data including orders, inventory, and customer information.`;
  }
  if (integrations.crmEnabled) {
    prompt += ` You have access to CRM data including contacts, pipeline stages, and deal information.`;
  }
  return prompt;
}

function getMockShopifyData(): ShopifyData {
  return {
    recentOrders: [
      { id: "#1042", product: "Pro Plan", status: "fulfilled", amount: "$299" },
      { id: "#1041", product: "Starter Kit", status: "processing", amount: "$49" },
      { id: "#1040", product: "Enterprise License", status: "fulfilled", amount: "$999" },
    ],
    inventory: [
      { item: "Pro Plan", stock: 999 },
      { item: "Starter Kit", stock: 45 },
    ],
  };
}

function getMockCRMData(): CRMData {
  return {
    contacts: [
      { name: "Acme Corp", stage: "proposal", value: "$12,000" },
      { name: "TechStart Inc", stage: "demo", value: "$4,500" },
      { name: "Global Retail Co", stage: "closed-won", value: "$28,000" },
    ],
    pipeline: [
      { stage: "lead", count: 24 },
      { stage: "demo", count: 8 },
      { stage: "proposal", count: 5 },
      { stage: "closed", count: 12 },
    ],
  };
}

function buildContextMessage(integrations: IntegrationContext): string {
  const parts: string[] = [];
  if (integrations.shopifyEnabled) {
    const data = getMockShopifyData();
    parts.push(`\n[SHOPIFY DATA]\nRecent Orders: ${JSON.stringify(data.recentOrders)}\nInventory: ${JSON.stringify(data.inventory)}`);
  }
  if (integrations.crmEnabled) {
    const data = getMockCRMData();
    parts.push(`\n[CRM DATA]\nContacts: ${JSON.stringify(data.contacts)}\nPipeline: ${JSON.stringify(data.pipeline)}`);
  }
  return parts.join("\n");
}

export function getIntegrationSteps(integrations: IntegrationContext): string[] {
  const steps: string[] = ["Analyzing your request..."];
  if (integrations.shopifyEnabled) steps.push("Fetching Shopify store data...");
  if (integrations.crmEnabled) steps.push("Querying CRM pipeline...");
  steps.push("Generating response...");
  return steps;
}

export async function callAI(
  messages: { role: "user" | "assistant"; content: string }[],
  integrations: IntegrationContext
): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  const systemPrompt = buildSystemPrompt(integrations);
  const contextMsg = buildContextMessage(integrations);

  const formattedMessages = messages.map((m, i) => {
    if (i === 0 && m.role === "user" && contextMsg) {
      return { role: m.role, parts: [{ text: contextMsg + "\n\nUser: " + m.content }] };
    }
    return { role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] };
  });

  if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_gemini_api_key_here") {
    return getFallbackResponse(messages[messages.length - 1]?.content || "", integrations);
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: formattedMessages,
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
        }),
      }
    );

    if (res.status === 429) {
      console.warn("Gemini rate limited, using fallback");
      return getFallbackResponse(messages[messages.length - 1]?.content || "", integrations);
    }

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini error:", err);
      return getFallbackResponse(messages[messages.length - 1]?.content || "", integrations);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response. Please try again.";
  } catch (err) {
    console.error("AI call failed:", err);
    return getFallbackResponse(messages[messages.length - 1]?.content || "", integrations);
  }
}

function getFallbackResponse(userMessage: string, integrations: IntegrationContext): string {
  const lower = userMessage.toLowerCase();

  if (integrations.shopifyEnabled && (lower.includes("order") || lower.includes("inventory"))) {
    const data = getMockShopifyData();
    return `Based on your Shopify store data, you have ${data.recentOrders.length} recent orders. The latest is ${data.recentOrders[0].id} for ${data.recentOrders[0].amount} (${data.recentOrders[0].status}). Your inventory shows ${data.inventory[0].item} with ${data.inventory[0].stock} units available.`;
  }

  if (integrations.crmEnabled && (lower.includes("lead") || lower.includes("contact") || lower.includes("deal") || lower.includes("pipeline"))) {
    const data = getMockCRMData();
    return `Your CRM pipeline shows ${data.pipeline[0].count} leads, ${data.pipeline[1].count} in demo stage, and ${data.pipeline[2].count} proposals active. Top opportunity: ${data.contacts[2].name} at ${data.contacts[2].value} (${data.contacts[2].stage}).`;
  }

  const responses = [
    "I'm here to help! Could you provide more details about what you're looking for?",
    "Great question! As your AI assistant, I can help you analyze data, answer questions, and provide insights. What would you like to explore?",
    "I understand you're asking about that. Let me help you with a comprehensive answer based on the available data.",
    "Thanks for reaching out! I'm analyzing your request and here's what I can tell you based on the current data.",
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}
