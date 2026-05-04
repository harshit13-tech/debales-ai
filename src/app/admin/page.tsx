"use client";
import { useRouter } from "next/navigation";
import { useAdminDashboard, useUpdateIntegrations } from "@/hooks/useApi";
import { WidgetRenderer } from "@/components/admin/WidgetRenderer";
import { ArrowLeft, RefreshCw, Settings, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { useState } from "react";

interface Widget {
  id: string; type: string; title: string; subtitle?: string;
  order: number; span?: "full" | "half" | "third"; config?: Record<string, unknown>;
}
interface Section { id: string; label: string; description?: string; order: number; widgets: Widget[]; }

function getSpanClass(span?: string) {
  if (span === "full") return "col-span-full";
  if (span === "third") return "lg:col-span-1";
  return "lg:col-span-1"; // default half (2-col grid)
}

export default function AdminPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAdminDashboard();
  const { mutateAsync: updateIntegrations, isPending } = useUpdateIntegrations();
  const [toggling, setToggling] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading dashboard config from MongoDB...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-medium mb-2">Access denied or error</p>
          <button onClick={() => router.push("/login")} className="text-sm text-brand-600 underline">Sign in</button>
        </div>
      </div>
    );
  }

  const config = data?.config;
  const stats = data?.stats;

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm">
          <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No Dashboard Config Found</h2>
          <p className="text-sm text-gray-400 mb-4">Run the seed script to create the initial MongoDB dashboard config document.</p>
          <code className="text-xs bg-gray-100 px-3 py-2 rounded-lg block text-left">npm run seed</code>
        </div>
      </div>
    );
  }

  const sortedSections: Section[] = [...(config.sections || [])].sort((a: Section, b: Section) => a.order - b.order);

  async function toggleIntegration(type: "shopify" | "crm") {
    setToggling(type);
    const current = stats?.integrations || { shopify: { enabled: false }, crm: { enabled: false } };
    try {
      await updateIntegrations({
        shopify: {
          enabled: type === "shopify" ? !current.shopify?.enabled : current.shopify?.enabled ?? false,
          storeUrl: "https://demo.myshopify.com",
        },
        crm: {
          enabled: type === "crm" ? !current.crm?.enabled : current.crm?.enabled ?? false,
          crmName: "HubSpot",
        },
      });
      refetch();
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="admin-dashboard">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/chat")} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{config.title}</h1>
              {config.subtitle && <p className="text-xs text-gray-400">{config.subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium border border-blue-200">
              Config-driven from MongoDB
            </span>
            <button onClick={() => refetch()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Integration Toggles */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Integration Controls <span className="text-xs text-gray-400 font-normal ml-2">changes affect chat AI behavior</span></h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "shopify" as const, name: "Shopify", icon: "🛍️", enabled: stats?.integrations?.shopify?.enabled },
              { key: "crm" as const, name: "HubSpot CRM", icon: "📊", enabled: stats?.integrations?.crm?.enabled },
            ].map((int) => (
              <div key={int.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{int.icon}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-800">{int.name}</div>
                    <div className="text-xs text-gray-400">{int.enabled ? "Active — AI uses this data" : "Inactive — AI ignores this"}</div>
                  </div>
                </div>
                <button
                  onClick={() => toggleIntegration(int.key)}
                  disabled={toggling !== null}
                  className={`transition-colors ${int.enabled ? "text-brand-600" : "text-gray-300"} disabled:opacity-50`}
                >
                  {toggling === int.key ? (
                    <Loader2 className="w-7 h-7 animate-spin text-brand-400" />
                  ) : int.enabled ? (
                    <ToggleRight className="w-8 h-8" />
                  ) : (
                    <ToggleLeft className="w-8 h-8" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Config-driven sections */}
        {sortedSections.map((section) => {
          const sortedWidgets = [...section.widgets].sort((a, b) => a.order - b.order);
          return (
            <section key={section.id} data-testid={`section-${section.id}`}>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">{section.label}</h2>
                {section.description && <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedWidgets.map((widget) => (
                  <div key={widget.id} className={getSpanClass(widget.span)} data-testid={`widget-${widget.id}`}>
                    <WidgetRenderer widget={widget} stats={stats} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
