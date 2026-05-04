"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useConversations, useCreateConversation, useSendMessage,
  useProject, useConversationMessages
} from "@/hooks/useApi";
import { MessageSquare, Plus, Send, Bot, User, Loader2, Settings, LogOut, Zap } from "lucide-react";

interface Message { role: "user" | "assistant"; content: string; steps?: string[]; createdAt: string; }

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const router = useRouter();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: convData } = useConversations();
  const { data: projectData } = useProject();
  const { mutateAsync: createConv } = useCreateConversation();
  const { mutateAsync: sendMsg } = useSendMessage(activeConvId || "");
  const { data: activeConv } = useConversationMessages(activeConvId);

  const conversations = convData || [];
  const productInstance = projectData?.productInstances?.[0];

  useEffect(() => {
    if (activeConv?.messages) setLocalMessages(activeConv.messages);
  }, [activeConv]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [localMessages, sending]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");

    let convId = activeConvId;
    if (!convId) {
      if (!productInstance?._id) { alert("No product instance found"); return; }
      const newConv = await createConv(productInstance._id);
      convId = newConv.conversation._id;
      setActiveConvId(convId);
    }

    const userMsg: Message = { role: "user", content: msg, createdAt: new Date().toISOString() };
    setLocalMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, productInstanceId: productInstance?._id || "default" }),
      });
      const data = await res.json();
      if (data.steps) {
        setSteps(data.steps);
        await new Promise((r) => setTimeout(r, 1500));
        setSteps([]);
      }
      if (data.message) setLocalMessages((prev) => [...prev, data.message]);
    } finally {
      setSending(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  async function handleNewChat() {
    if (!productInstance?._id) return;
    const newConv = await createConv(productInstance._id);
    setActiveConvId(newConv.conversation._id);
    setLocalMessages([]);
  }

  const project = projectData?.project;
  const isAdmin = typeof window !== "undefined"; // simplified; actual role from cookie

  return (
    <div className="flex h-screen bg-gray-50" data-testid="chat-shell">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col" data-testid="sidebar">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">D</span>
            </div>
            <div>
              <div className="font-semibold text-sm text-gray-900">{project?.name || "Debales AI"}</div>
              <div className="text-xs text-gray-400">{productInstance?.displayName || "AI Assistant"}</div>
            </div>
          </div>
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin" data-testid="conversations-list">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-8">No conversations yet</p>
          ) : (
            <div className="space-y-1">
              {conversations.map((c: { _id: string; title: string; updatedAt: string }) => (
                <button
                  key={c._id}
                  onClick={() => { setActiveConvId(c._id); setLocalMessages([]); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    activeConvId === c._id ? "bg-brand-50 text-brand-700 font-medium" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{c.title}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-gray-200 space-y-1">
          <button
            onClick={() => router.push("/admin")}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4" /> Admin Dashboard
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col" data-testid="chat-area">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">{productInstance?.displayName || "AI Sales Assistant"}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
              Online
              {project?.integrations?.shopify?.enabled && (
                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-xs font-medium">Shopify</span>
              )}
              {project?.integrations?.crm?.enabled && (
                <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-xs font-medium">CRM</span>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin" data-testid="messages">
          {localMessages.length === 0 && !sending && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">How can I help you today?</h3>
              <p className="text-gray-400 text-sm max-w-sm">Ask me about your orders, customers, pipeline, or anything else you need help with.</p>
            </div>
          )}

          {localMessages.map((m, i) => (
            <div key={i} className={`flex gap-3 animate-slide-up ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                m.role === "assistant" ? "bg-brand-600" : "bg-gray-800"
              }`}>
                {m.role === "assistant" ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
              </div>
              <div className={`max-w-[70%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {m.steps && m.steps.length > 0 && m.role === "assistant" && (
                  <div className="space-y-1 mb-1">
                    {m.steps.map((s, si) => (
                      <div key={si} className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Zap className="w-3 h-3" />{s}
                      </div>
                    ))}
                  </div>
                )}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-brand-600 text-white rounded-tr-sm"
                    : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                }`}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator with steps */}
          {sending && (
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400 animate-fade-in">
                  <Loader2 className="w-3 h-3 animate-spin" />{s}
                </div>
              ))}
              {steps.length === 0 && <TypingIndicator />}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message..."
              disabled={sending}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm disabled:opacity-50"
              data-testid="message-input"
            />
            <button
              onClick={handleSend} disabled={sending || !input.trim()}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white px-4 py-3 rounded-xl transition-colors"
              data-testid="send-button"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
