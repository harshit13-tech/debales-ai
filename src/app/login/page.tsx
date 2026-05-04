"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_USERS = [
  { email: "admin@techcorp.com", projectSlug: "techcorp", label: "TechCorp Admin", role: "admin" },
  { email: "member@techcorp.com", projectSlug: "techcorp", label: "TechCorp Member", role: "member" },
  { email: "admin@retailco.com", projectSlug: "retailco", label: "RetailCo Admin", role: "admin" },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [projectSlug, setProjectSlug] = useState("");

  async function handleLogin(e?: React.FormEvent, overrides?: { email: string; projectSlug: string }) {
    e?.preventDefault();
    setLoading(true);
    setError("");
    const payload = overrides ?? { email, projectSlug };
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login failed"); return; }
      router.push("/chat");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full mb-4">
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-brand-700 text-xs font-black">D</span>
            </div>
            <span className="text-white font-semibold text-sm">Debales AI</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-brand-200">Sign in to your AI workspace</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Quick login */}
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Demo Login</p>
            <div className="space-y-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => handleLogin(undefined, { email: u.email, projectSlug: u.projectSlug })}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:bg-brand-50 hover:border-brand-300 transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${u.role === "admin" ? "bg-brand-600" : "bg-gray-400"}`}>
                    {u.label[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{u.label}</div>
                    <div className="text-xs text-gray-400">{u.email} · {u.role}</div>
                  </div>
                  <span className="ml-auto text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or sign in manually</span></div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Slug</label>
              <input
                type="text" value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)}
                placeholder="techcorp" required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
              />
            </div>
            {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
