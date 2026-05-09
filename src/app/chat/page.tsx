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

  return (
    <div style={{display:"flex",height:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",background:"#f8fafc"}}>
      {/* Sidebar */}
      <aside style={{width:"260px",background:"white",borderRight:"1px solid #e2e8f0",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"16px",borderBottom:"1px solid #e2e8f0"}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"12px"}}>
            <div style={{width:"32px",height:"32px",background:"#2563eb",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:900,fontSize:"14px"}}>D</div>
            <div>
              <div style={{fontWeight:700,fontSize:"14px",color:"#1e293b"}}>{project?.name || "Debales AI"}</div>
              <div style={{fontSize:"11px",color:"#94a3b8"}}>{productInstance?.displayName || "AI Assistant"}</div>
            </div>
          </div>
          <button onClick={handleNewChat} style={{width:"100%",background:"#2563eb",color:"white",border:"none",borderRadius:"10px",padding:"10px",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>
            + New Chat
          </button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"8px"}}>
          {conversations.length === 0
            ? <p style={{textAlign:"center",color:"#94a3b8",fontSize:"12px",marginTop:"24px"}}>No conversations yet</p>
            : conversations.map((c: {_id:string;title:string}) => (
              <button key={c._id} onClick={() => { setActiveConvId(c._id); setLocalMessages([]); }}
                style={{width:"100%",textAlign:"left",padding:"10px 12px",borderRadius:"10px",border:"none",background:activeConvId===c._id?"#eff6ff":"transparent",color:activeConvId===c._id?"#2563eb":"#64748b",cursor:"pointer",fontSize:"13px",fontWeight:activeConvId===c._id?600:400,marginBottom:"2px",display:"block",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                💬 {c.title}
              </button>
            ))
          }
        </div>
        <div style={{padding:"8px",borderTop:"1px solid #e2e8f0"}}>
          <button onClick={() => router.push("/admin")} style={{width:"100%",textAlign:"left",padding:"10px 12px",borderRadius:"10px",border:"none",background:"transparent",color:"#64748b",cursor:"pointer",fontSize:"13px",display:"block",marginBottom:"2px"}}>
            ⚙️ Admin Dashboard
          </button>
          <button onClick={handleLogout} style={{width:"100%",textAlign:"left",padding:"10px 12px",borderRadius:"10px",border:"none",background:"transparent",color:"#ef4444",cursor:"pointer",fontSize:"13px",display:"block"}}>
            ← Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{background:"white",borderBottom:"1px solid #e2e8f0",padding:"16px 24px",display:"flex",alignItems:"center",gap:"12px"}}>
          <div style={{width:"40px",height:"40px",background:"linear-gradient(135deg,#2563eb,#1e40af)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700}}>AI</div>
          <div>
            <div style={{fontWeight:600,fontSize:"15px",color:"#1e293b"}}>{productInstance?.displayName || "AI Sales Assistant"}</div>
            <div style={{fontSize:"12px",color:"#94a3b8",display:"flex",alignItems:"center",gap:"6px"}}>
              <span style={{width:"6px",height:"6px",background:"#22c55e",borderRadius:"50%",display:"inline-block"}}/>
              Online
              {project?.integrations?.shopify?.enabled && <span style={{background:"#dcfce7",color:"#16a34a",fontSize:"11px",padding:"2px 8px",borderRadius:"100px",fontWeight:600}}>Shopify</span>}
              {project?.integrations?.crm?.enabled && <span style={{background:"#f3e8ff",color:"#9333ea",fontSize:"11px",padding:"2px 8px",borderRadius:"100px",fontWeight:600}}>CRM</span>}
            </div>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"24px",display:"flex",flexDirection:"column",gap:"16px"}}>
          {localMessages.length === 0 && !sending && (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flex:1,textAlign:"center"}}>
              <div style={{width:"64px",height:"64px",background:"#eff6ff",borderRadius:"16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"28px",marginBottom:"16px"}}>⚡</div>
              <h3 style={{fontSize:"20px",fontWeight:600,color:"#1e293b",marginBottom:"8px"}}>How can I help you today?</h3>
              <p style={{color:"#94a3b8",fontSize:"14px",maxWidth:"320px"}}>Ask me about your orders, customers, pipeline, or anything else.</p>
            </div>
          )}
          {localMessages.map((m, i) => (
            <div key={i} style={{display:"flex",gap:"12px",flexDirection:m.role==="user"?"row-reverse":"row"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"50%",background:m.role==="user"?"#1e293b":"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"12px",fontWeight:700,flexShrink:0}}>
                {m.role==="user"?"U":"AI"}
              </div>
              <div style={{maxWidth:"70%"}}>
                {m.steps && m.steps.map((step,si) => (
                  <div key={si} style={{fontSize:"12px",color:"#94a3b8",display:"flex",alignItems:"center",gap:"6px",marginBottom:"4px"}}>⚡ {step}</div>
                ))}
                <div style={{padding:"12px 16px",borderRadius:m.role==="user"?"16px 4px 16px 16px":"4px 16px 16px 16px",background:m.role==="user"?"#2563eb":"white",color:m.role==="user"?"white":"#1e293b",fontSize:"14px",lineHeight:1.6,border:m.role==="user"?"none":"1px solid #e2e8f0"}}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div>
              {steps.map((step,i) => <div key={i} style={{fontSize:"12px",color:"#94a3b8",marginBottom:"4px"}}>⏳ {step}</div>)}
              {steps.length===0 && (
                <div style={{display:"flex",gap:"12px"}}>
                  <div style={{width:"32px",height:"32px",borderRadius:"50%",background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"12px",fontWeight:700}}>AI</div>
                  <div style={{padding:"12px 16px",borderRadius:"4px 16px 16px 16px",background:"white",border:"1px solid #e2e8f0",color:"#94a3b8",fontSize:"14px"}}>Thinking...</div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        <div style={{background:"white",borderTop:"1px solid #e2e8f0",padding:"16px 24px"}}>
          <div style={{display:"flex",gap:"12px",maxWidth:"800px",margin:"0 auto"}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
              placeholder="Type a message..." disabled={sending}
              style={{flex:1,padding:"12px 16px",border:"1px solid #e2e8f0",borderRadius:"12px",fontSize:"14px",outline:"none",fontFamily:"inherit"}}/>
            <button onClick={handleSend} disabled={sending||!input.trim()}
              style={{background:sending||!input.trim()?"#93c5fd":"#2563eb",color:"white",border:"none",borderRadius:"12px",padding:"12px 20px",cursor:sending||!input.trim()?"not-allowed":"pointer",fontSize:"14px",fontWeight:600}}>
              {sending?"...":"Send →"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
