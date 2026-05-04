"use client";
import { BarChart3, MessageSquare, Zap, Activity, Link2, MousePointerClick, TrendingUp } from "lucide-react";

interface Widget {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  order: number;
  span?: "full" | "half" | "third";
  config?: Record<string, unknown>;
}

interface Stats {
  totalConversations: number;
  todayConversations: number;
  aiResponsesTotal: number;
  integrations: {
    shopify: { enabled: boolean };
    crm: { enabled: boolean };
  };
  recentConversations: { _id: string; title: string; createdAt: string; messages: unknown[] }[];
}

function StatCard({ widget, stats }: { widget: Widget; stats: Stats }) {
  const map: Record<string, { value: string | number; change: string; icon: React.ReactNode; color: string }> = {
    "total-conversations": { value: stats.totalConversations, change: "+12%", icon: <MessageSquare className="w-5 h-5" />, color: "bg-blue-500" },
    "today-conversations": { value: stats.todayConversations, change: "Today", icon: <Activity className="w-5 h-5" />, color: "bg-green-500" },
    "ai-responses": { value: stats.aiResponsesTotal, change: "All time", icon: <Zap className="w-5 h-5" />, color: "bg-purple-500" },
    "active-integrations": {
      value: [stats.integrations.shopify.enabled, stats.integrations.crm.enabled].filter(Boolean).length,
      change: "of 2 enabled",
      icon: <Link2 className="w-5 h-5" />,
      color: "bg-orange-500",
    },
  };

  const key = (widget.config?.statKey as string) || "total-conversations";
  const stat = map[key] || map["total-conversations"];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-white`}>
          {stat.icon}
        </div>
        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">{stat.change}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
      <div className="text-sm text-gray-500">{widget.title}</div>
      {widget.subtitle && <div className="text-xs text-gray-400 mt-1">{widget.subtitle}</div>}
    </div>
  );
}

function ConversationChart({ widget, stats }: { widget: Widget; stats: Stats }) {
  const bars = [
    { label: "Mon", value: 65 },
    { label: "Tue", value: 80 },
    { label: "Wed", value: 45 },
    { label: "Thu", value: 92 },
    { label: "Fri", value: 70 },
    { label: "Sat", value: 30 },
    { label: "Sun", value: stats.todayConversations * 10 + 25 },
  ];
  const max = Math.max(...bars.map((b) => b.value));

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-brand-600" />
        <h3 className="font-semibold text-gray-800">{widget.title}</h3>
      </div>
      <div className="flex items-end gap-3 h-36">
        {bars.map((b) => (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full bg-brand-100 rounded-t-lg relative" style={{ height: `${(b.value / max) * 100}%` }}>
              <div className="absolute bottom-0 w-full bg-brand-500 rounded-t-lg" style={{ height: `${(b.value / max) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-400">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationStatus({ widget, stats }: { widget: Widget; stats: Stats }) {
  const integrations = [
    { name: "Shopify", enabled: stats.integrations.shopify.enabled, icon: "🛍️", desc: "E-commerce data" },
    { name: "HubSpot CRM", enabled: stats.integrations.crm.enabled, icon: "📊", desc: "CRM pipeline" },
  ];
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-brand-600" />
        <h3 className="font-semibold text-gray-800">{widget.title}</h3>
      </div>
      <div className="space-y-3">
        {integrations.map((int) => (
          <div key={int.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-xl">{int.icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-800">{int.name}</div>
                <div className="text-xs text-gray-400">{int.desc}</div>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
              int.enabled ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"
            }`}>
              {int.enabled ? "Active" : "Disabled"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({ widget, stats }: { widget: Widget; stats: Stats }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-brand-600" />
        <h3 className="font-semibold text-gray-800">{widget.title}</h3>
      </div>
      <div className="space-y-3">
        {stats.recentConversations.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No recent conversations</p>
        ) : (
          stats.recentConversations.map((c) => (
            <div key={c._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">{c.title}</div>
                <div className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()} · {Array.isArray(c.messages) ? c.messages.length : 0} msgs</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QuickActions({ widget }: { widget: Widget }) {
  const actions = (widget.config?.actions as { label: string; href: string }[]) || [
    { label: "View Conversations", href: "/chat" },
    { label: "Toggle Integrations", href: "#" },
    { label: "Export Data", href: "#" },
  ];
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <MousePointerClick className="w-5 h-5 text-brand-600" />
        <h3 className="font-semibold text-gray-800">{widget.title}</h3>
      </div>
      <div className="space-y-2">
        {actions.map((a, i) => (
          <a key={i} href={a.href} className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-brand-50 hover:text-brand-700 rounded-xl text-sm text-gray-700 transition-colors">
            {a.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function AiUsage({ widget, stats }: { widget: Widget; stats: Stats }) {
  const pct = Math.min(100, (stats.totalConversations / 100) * 100);
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-brand-600" />
        <h3 className="font-semibold text-gray-800">{widget.title}</h3>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Conversations Used</span>
            <span className="font-semibold text-gray-800">{stats.totalConversations} / 100</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-brand-400 to-brand-600 h-2.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% of monthly quota</p>
        </div>
      </div>
    </div>
  );
}

const WIDGET_MAP: Record<string, React.ComponentType<{ widget: Widget; stats: Stats }>> = {
  "stat-card": StatCard,
  "conversation-chart": ConversationChart,
  "integration-status": IntegrationStatus,
  "recent-activity": RecentActivity,
  "quick-actions": QuickActions,
  "ai-usage": AiUsage,
};

export function WidgetRenderer({ widget, stats }: { widget: Widget; stats: Stats }) {
  const Component = WIDGET_MAP[widget.type];
  if (!Component) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-700">
        Unknown widget type: <code className="font-mono">{widget.type}</code>
      </div>
    );
  }
  return <Component widget={widget} stats={stats} />;
}
