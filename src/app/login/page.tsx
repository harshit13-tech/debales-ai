"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_USERS = [
  { email: "admin@techcorp.com", projectSlug: "techcorp", label: "TechCorp Admin", role: "admin", color: "#2563eb" },
  { email: "member@techcorp.com", projectSlug: "techcorp", label: "TechCorp Member", role: "member", color: "#64748b" },
  { email: "admin@retailco.com", projectSlug: "retailco", label: "RetailCo Admin", role: "admin", color: "#2563eb" },
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
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#2563eb 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"}}>
      <div style={{width:"100%",maxWidth:"420px"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:"10px",background:"rgba(255,255,255,0.15)",padding:"8px 20px",borderRadius:"100px",marginBottom:"16px"}}>
            <div style={{width:"28px",height:"28px",background:"white",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#1d4ed8",fontSize:"14px"}}>D</div>
            <span style={{color:"white",fontWeight:600,fontSize:"15px"}}>Debales AI</span>
          </div>
          <h1 style={{color:"white",fontSize:"28px",fontWeight:700,margin:"0 0 8px"}}>Welcome back</h1>
          <p style={{color:"rgba(255,255,255,0.7)",fontSize:"14px",margin:0}}>Sign in to your AI workspace</p>
        </div>
        <div style={{background:"white",borderRadius:"20px",boxShadow:"0 25px 50px rgba(0,0,0,0.25)",padding:"32px"}}>
          <p style={{fontSize:"11px",fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:"12px"}}>Quick Demo Login</p>
          <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"24px"}}>
            {DEMO_USERS.map((u)=>(
              <button key={u.email} onClick={()=>handleLogin(undefined,{email:u.email,projectSlug:u.projectSlug})} disabled={loading}
                style={{display:"flex",alignItems:"center",gap:"12px",padding:"12px 16px",border:"1px solid #e2e8f0",borderRadius:"12px",background:"white",cursor:"pointer",textAlign:"left",width:"100%"}}>
                <div style={{width:"36px",height:"36px",borderRadius:"10px",background:u.color,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:"14px",flexShrink:0}}>{u.label[0]}</div>
                <div>
                  <div style={{fontWeight:600,fontSize:"14px",color:"#1e293b"}}>{u.label}</div>
                  <div style={{fontSize:"12px",color:"#94a3b8"}}>{u.email} · {u.role}</div>
                </div>
                <span style={{marginLeft:"auto",color:"#2563eb",fontSize:"16px"}}>→</span>
              </button>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
            <div style={{flex:1,height:"1px",background:"#e2e8f0"}}/>
            <span style={{fontSize:"12px",color:"#94a3b8"}}>or sign in manually</span>
            <div style={{flex:1,height:"1px",background:"#e2e8f0"}}/>
          </div>
          <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:"16px"}}>
            <div>
              <label style={{display:"block",fontSize:"13px",fontWeight:600,color:"#374151",marginBottom:"6px"}}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" required
                style={{width:"100%",padding:"10px 14px",border:"1px solid #d1d5db",borderRadius:"10px",fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:"13px",fontWeight:600,color:"#374151",marginBottom:"6px"}}>Project Slug</label>
              <input type="text" value={projectSlug} onChange={e=>setProjectSlug(e.target.value)} placeholder="techcorp" required
                style={{width:"100%",padding:"10px 14px",border:"1px solid #d1d5db",borderRadius:"10px",fontSize:"14px",outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
            </div>
            {error&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"8px",padding:"10px 14px",fontSize:"13px",color:"#dc2626"}}>{error}</div>}
            <button type="submit" disabled={loading}
              style={{background:loading?"#93c5fd":"#2563eb",color:"white",border:"none",borderRadius:"10px",padding:"12px",fontSize:"14px",fontWeight:600,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit"}}>
              {loading?"Signing in...":"Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
