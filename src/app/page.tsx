"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConversations, useCreateConversation, useProject } from "@/hooks/useApi";

export default function ChatPage() {
  const router = useRouter();
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<{role:string;content:string;steps?:string[]}[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: convData } = useConversations();
  const { data: projectData } = useProject();
  const { mutateAsync: createConv } = useCreateConversation();

  const conversations = convData || [];
  const productInstance = projectData?.productInstances?.[0];
  const project = projectData?.project;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [localMessages, sending]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    let convId = activeConvId;
    if (!convId) {
      if (!productInstance?._id) return;
      const newConv = await createConv(productInstance._id);
      convId = newConv.conversation._id;
      setActiveConvId(convId);
    }
    setLocalMessages(prev => [...prev, { role: "user", content: msg }]);
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${convId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, productInstanceId: productInstance?._id || "default" }),
      });
      const data = await res.json();
      if (data.steps) { setSteps(data.steps); await new Promise(r => setTimeout(r, 1500)); setSteps([]); }
      if (data.message) setLocalMessages(prev => [...prev, data.message]);
    } finally { setSending(false); }
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

  const s = {
    shell: { display:"flex", height:"100vh", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif", background:"#f8fafc" },
    sidebar: { width:"260px", background:"white", borderRight:"1px solid #e2e8f0", display:"flex", flexDirection:"column" as const },
    sidebarTop: { padding:"16px", borderBottom:"1px solid #e2e8f0" },
    logo: { display:"flex", alignItems:"center", gap:"8px", marginBottom:"12px" },
    logoIcon: { width:"32px", height:"32px", background:"#2563eb", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:"14px" },
    logoText: { fontWeight:700, fontSize:"14px", color:"#1e293b" },
    logoSub: { fontSize:"11px", color:"#94a3b8" },
    newChatBtn: { width:"100%", background:"#2563eb", color:"white", border:"none", borderRadius:"10px", padding:"10px", fontSize:"13px", fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px" },
    convList: { flex:1, overflowY:"auto" as const, padding:"8px" },
    convItem: (active: boolean) => ({ width:"100%", textAlign:"left" as const, padding:"10px 12px", borderRadius:"10px", border:"none", background: active ? "#eff6ff" : "transparent", color: active ? "#2563eb" : "#64748b", cursor:"pointer", fontSize:"13px", fontWeight: active ? 600 : 400, marginBottom:"2px", display:"block", whiteSpace:"nowrap" as const, overflow:"hidden", textOverflow:"ellipsis" }),
    sidebarBottom: { padding:"8px", borderTop:"1px solid #e2e8f0" },
    navBtn: { width:"100%", textAlign:"left" as const, padding:"10px 12px", borderRadius:"10px", border:"none", background:"transparent", color:"#64748b", cursor:"pointer", fontSize:"13px", display:"block", marginBottom:"2px" },
    main: { flex:1, display:"flex", flexDirection:"column" as const },
    header: { background:"white", borderBottom:"1px solid #e2e8f0", padding:"16px 24px", display:"flex", alignItems:"center", gap:"12px" },
    headerIcon: { width:"40px", height:"40px", background:"linear-gradient(135deg,#2563eb,#1e40af)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:700 },
    headerTitle: { fontWeight:600, fontSize:"15px", color:"#1e293b" },
    headerSub: { fontSize:"12px", color:"#94a3b8", display:"flex", alignItems:"center", gap:"6px" },
    dot: { width:"6px", height:"6px", background:"#22c55e", borderRadius:"50%", display:"inline-block" },
    badge: (color: string) => ({ background: color === "green" ? "#dcfce7" : "#f3e8ff", color: color === "green" ? "#16a34a" : "#9333ea", fontSize:"11px", padding:"2px 8px", borderRadius:"100px", fontWeight:600 }),
    messages: { flex:1, overflowY:"auto" as const, padding:"24px", display:"flex", flexDirection:"column" as const, gap:"16px" },
    emptyState: { display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center", flex:1, textAlign:"center" as const },
    emptyIcon: { width:"64px", height:"64px", background:"#eff6ff", borderRadius:"16px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", marginBottom:"16px" },
    msgRow: (role: string) => ({ display:"flex", gap:"12px", flexDirection: role === "user" ? "row-reverse" as const : "row" as const }),
    avatar: (role: string) => ({ width:"32px", height:"32px", borderRadius:"50%", background: role === "user" ? "#1e293b" : "#2563eb", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:"12px", fontWeight:700, flexShrink:0 }),
    bubble: (role: string) => ({ maxWidth:"70%", padding:"12px 16px", borderRadius: role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: role === "user" ? "#2563eb" : "white", color: role === "user" ? "white" : "#1e293b", fontSize:"14px", lineHeight:1.6, border: role === "user" ? "none" : "1px solid #e2e8f0" }),
    step: { fontSize:"12px", color:"#94a3b8", display:"flex", alignItems:"center", gap:"6px", marginBottom:"4px" },
    inputArea: { background:"white", borderTop:"1px solid #e2e8f0", padding:"16px 24px" },
    inputRow: { display:"flex", gap:"12px", maxWidth:"800px", margin:"0 auto" },
    input: { flex:1, padding:"12px 16px", border:"1px solid #e2e8f0", borderRadius:"12px", fontSize:"14px", outline:"none", fontFamily:"inherit" },
    sendBtn: (disabled: boolean) => ({ background: disabled ? "#93c5fd" : "#2563eb", color:"white", border:"none", borderRadius:"12px", padding:"12px 20px", cursor: disabled ? "not-allowed" : "pointer", fontSize:"14px", fontWeight:600 }),
  };

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.sidebarTop}>
          <div style={s.logo}>
            <div style={s.logoIcon}>D</div>
            <div>
              <div style={s.logoText}>{project?.name || "Debales AI"}</div>
              <div style={s.logoSub}>{productInstance?.displayName || "AI Assistant"}</div>
            </div>
          </div>
          <button style={s.newChatBtn} onClick={handleNewChat}>+ New Chat</button>
        </div>
        <div style={s.convList}>
          {conversations.length === 0
            ? <p style={{textAlign:"center",color:"#94a3b8",fontSize:"12px",marginTop:"24px"}}>No conversations yet</p>
            : conversations.map((c: {_id:string;title:string}) => (
              <button key={c._id} style={s.convItem(activeConvId === c._id)}
                onClick={() => { setActiveConvId(c._id); setLocalMessages([]); }}>
                💬 {c.title}
              </button>
            ))
          }
        </div>
        <div style={s.sidebarBottom}>
          <button style={s.navBtn} onClick={() => router.push("/admin")}>⚙️ Admin Dashboard</button>
          <button style={{...s.navBtn, color:"#ef4444"}} onClick={handleLogout}>← Sign Out</button>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.header}>
          <div style={s.headerIcon}>AI</div>
          <div>
            <div style={s.headerTitle}>{productInstance?.displayName || "AI Sales Assistant"}</div>
            <div style={s.headerSub}>
              <span style={s.dot}/> Online
              {project?.integrations?.shopify?.enabled && <span style={s.badge("green")}>Shopify</span>}
              {project?.integrations?.crm?.enabled && <span style={s.badge("purple")}>CRM</span>}
            </div>
          </div>
        </div>

        <div style={s.messages}>
          {localMessages.length === 0 && !sending && (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>⚡</div>
              <h3 style={{fontSize:"20px",fontWeight:600,color:"#1e293b",marginBottom:"8px"}}>How can I help you today?</h3>
              <p style={{color:"#94a3b8",fontSize:"14px",maxWidth:"320px"}}>Ask me about your orders, customers, pipeline, or anything else.</p>
            </div>
          )}
          {localMessages.map((m, i) => (
            <div key={i} style={s.msgRow(m.role)}>
              <div style={s.avatar(m.role)}>{m.role === "user" ? "U" : "AI"}</div>
              <div>
                {m.steps && m.steps.map((step, si) => <div key={si} style={s.step}>⚡ {step}</div>)}
                <div style={s.bubble(m.role)}>{m.content}</div>
              </div>
            </div>
          ))}
          {sending && (
            <div>
              {steps.map((step, i) => <div key={i} style={s.step}>⏳ {step}</div>)}
              {steps.length === 0 && (
                <div style={s.msgRow("assistant")}>
                  <div style={s.avatar("assistant")}>AI</div>
                  <div style={{...s.bubble("assistant"), color:"#94a3b8"}}>Thinking...</div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        <div style={s.inputArea}>
          <div style={s.inputRow}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
              placeholder="Type a message..." disabled={sending} style={s.input}/>
            <button onClick={handleSend} disabled={sending || !input.trim()} style={s.sendBtn(sending || !input.trim())}>
              {sending ? "..." : "Send →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
