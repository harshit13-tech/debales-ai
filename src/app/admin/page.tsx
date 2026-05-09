"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminDashboard, useUpdateIntegrations } from "@/hooks/useApi";
import { WidgetRenderer } from "@/components/admin/WidgetRenderer";

interface Widget { id:string; type:string; title:string; subtitle?:string; order:number; span?:string; config?:Record<string,unknown>; }
interface Section { id:string; label:string; description?:string; order:number; widgets:Widget[]; }

export default function AdminPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useAdminDashboard();
  const { mutateAsync: updateIntegrations } = useUpdateIntegrations();
  const [toggling, setToggling] = useState<string|null>(null);

  if (isLoading) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,sans-serif"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:"32px",marginBottom:"12px"}}>⏳</div>
          <p style={{color:"#64748b",fontSize:"14px"}}>Loading dashboard from MongoDB...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,sans-serif"}}>
        <div style={{textAlign:"center"}}>
          <p style={{color:"#ef4444",fontWeight:600,marginBottom:"8px"}}>Access denied or error</p>
          <button onClick={()=>router.push("/login")} style={{color:"#2563eb",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Sign in</button>
        </div>
      </div>
    );
  }

  const config = data?.config;
  const stats = data?.stats;

  if (!config) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"-apple-system,sans-serif"}}>
        <div style={{textAlign:"center",maxWidth:"400px"}}>
          <div style={{fontSize:"48px",marginBottom:"12px"}}>⚙️</div>
          <h2 style={{fontSize:"18px",fontWeight:600,color:"#374151",marginBottom:"8px"}}>No Dashboard Config Found</h2>
          <p style={{fontSize:"14px",color:"#94a3b8"}}>Run the seed script to create the MongoDB dashboard config.</p>
        </div>
      </div>
    );
  }

  const sortedSections:Section[] = [...(config.sections||[])].sort((a:Section,b:Section)=>a.order-b.order);

  async function toggleIntegration(type:"shopify"|"crm") {
    setToggling(type);
    const current = stats?.integrations||{shopify:{enabled:false},crm:{enabled:false}};
    try {
      await updateIntegrations({
        shopify:{ enabled:type==="shopify"?!current.shopify?.enabled:current.shopify?.enabled??false, storeUrl:"https://demo.myshopify.com" },
        crm:{ enabled:type==="crm"?!current.crm?.enabled:current.crm?.enabled??false, crmName:"HubSpot" },
      });
      refetch();
    } finally {
      setToggling(null);
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif"}}>
      <header style={{background:"white",borderBottom:"1px solid #e2e8f0",position:"sticky",top:0,zIndex:10}}>
        <div style={{maxWidth:"1200px",margin:"0 auto",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
            <button onClick={()=>router.push("/chat")} style={{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:"14px"}}>
              Back
            </button>
            <div style={{width:"1px",height:"20px",background:"#e2e8f0"}} />
            <div>
              <h1 style={{fontSize:"20px",fontWeight:700,color:"#1e293b",margin:0}}>{config.title}</h1>
              {config.subtitle && <p style={{fontSize:"12px",color:"#94a3b8",margin:0}}>{config.subtitle}</p>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <span style={{fontSize:"12px",background:"#eff6ff",color:"#2563eb",padding:"4px 12px",borderRadius:"100px",fontWeight:600,border:"1px solid #bfdbfe"}}>
              Config-driven from MongoDB
            </span>
            <button onClick={()=>refetch()} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:"8px",padding:"6px 10px",cursor:"pointer",fontSize:"13px",color:"#64748b"}}>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div style={{maxWidth:"1200px",margin:"0 auto",padding:"32px 24px"}}>
        <div style={{background:"white",borderRadius:"16px",border:"1px solid #e2e8f0",padding:"24px",marginBottom:"32px"}}>
          <h2 style={{fontSize:"16px",fontWeight:600,color:"#1e293b",margin:"0 0 16px"}}>
            Integration Controls
          </h2>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
            {[
              {key:"shopify" as const, name:"Shopify", icon:"🛍️", enabled:stats?.integrations?.shopify?.enabled},
              {key:"crm" as const, name:"HubSpot CRM", icon:"📊", enabled:stats?.integrations?.crm?.enabled},
            ].map((int)=>(
              <div key={int.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px",background:"#f8fafc",borderRadius:"12px",border:"1px solid #e2e8f0"}}>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <span style={{fontSize:"24px"}}>{int.icon}</span>
                  <div>
                    <div style={{fontWeight:600,fontSize:"14px",color:"#1e293b"}}>{int.name}</div>
                    <div style={{fontSize:"12px",color:"#94a3b8"}}>{int.enabled?"Active":"Inactive"}</div>
                  </div>
                </div>
                <button
                  onClick={()=>toggleIntegration(int.key)}
                  disabled={toggling!==null}
                  style={{background:int.enabled?"#2563eb":"#e2e8f0",color:int.enabled?"white":"#64748b",border:"none",borderRadius:"20px",padding:"6px 16px",cursor:"pointer",fontWeight:600,fontSize:"13px"}}
                >
                  {toggling===int.key?"...":int.enabled?"ON":"OFF"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {sortedSections.map((section)=>{
          const sortedWidgets=[...section.widgets].sort((a,b)=>a.order-b.order);
          return (
            <div key={section.id} style={{marginBottom:"32px"}}>
              <div style={{marginBottom:"16px"}}>
                <h2 style={{fontSize:"18px",fontWeight:700,color:"#1e293b",margin:"0 0 4px"}}>{section.label}</h2>
                {section.description && <p style={{fontSize:"14px",color:"#64748b",margin:0}}>{section.description}</p>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}}>
                {sortedWidgets.map((widget)=>(
                  <div key={widget.id} style={{gridColumn:widget.span==="full"?"span 3":"span 1"}}>
                    <WidgetRenderer widget={widget} stats={stats}/>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
