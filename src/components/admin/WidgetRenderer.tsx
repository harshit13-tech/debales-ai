"use client";
import React from "react";

interface Widget { id:string; type:string; title:string; subtitle?:string; order:number; span?:string; config?:Record<string,unknown>; }
interface Stats {
  totalConversations:number; todayConversations:number; aiResponsesTotal:number;
  integrations:{ shopify:{enabled:boolean}; crm:{enabled:boolean} };
  recentConversations:{_id:string;title:string;createdAt:string;messages:unknown[]}[];
}

const card:React.CSSProperties = {background:"white",borderRadius:"16px",padding:"24px",border:"1px solid #e2e8f0"};

function StatCard({widget,stats}:{widget:Widget;stats:Stats}) {
  const map: Record<string,{value:string|number;change:string;icon:string;color:string}> = {
    "total-conversations":{value:stats.totalConversations,change:"+12%",icon:"💬",color:"#2563eb"},
    "today-conversations":{value:stats.todayConversations,change:"Today",icon:"📈",color:"#16a34a"},
    "ai-responses":{value:stats.aiResponsesTotal,change:"All time",icon:"⚡",color:"#9333ea"},
    "active-integrations":{value:[stats.integrations.shopify.enabled,stats.integrations.crm.enabled].filter(Boolean).length,change:"of 2",icon:"🔗",color:"#ea580c"},
  };
  const key=(widget.config?.statKey as string)||"total-conversations";
  const stat=map[key]||map["total-conversations"];
  return (
    <div style={card}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
        <div style={{width:"40px",height:"40px",background:stat.color,borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>{stat.icon}</div>
        <span style={{fontSize:"12px",color:"#16a34a",background:"#dcfce7",padding:"4px 8px",borderRadius:"100px",fontWeight:600}}>{stat.change}</span>
      </div>
      <div style={{fontSize:"32px",fontWeight:700,color:"#1e293b",marginBottom:"4px"}}>{stat.value}</div>
      <div style={{fontSize:"14px",color:"#64748b"}}>{widget.title}</div>
    </div>
  );
}

function ConversationChart({widget,stats}:{widget:Widget;stats:Stats}) {
  const bars=[{l:"Mon",v:65},{l:"Tue",v:80},{l:"Wed",v:45},{l:"Thu",v:92},{l:"Fri",v:70},{l:"Sat",v:30},{l:"Sun",v:Math.min(99,stats.todayConversations*10+25)}];
  const max=Math.max(...bars.map(b=>b.v));
  return (
    <div style={card}>
      <h3 style={{fontWeight:600,color:"#1e293b",marginBottom:"20px",fontSize:"15px"}}>📊 {widget.title}</h3>
      <div style={{display:"flex",alignItems:"flex-end",gap:"8px",height:"120px"}}>
        {bars.map(b=>(
          <div key={b.l} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px",height:"100%",justifyContent:"flex-end"}}>
            <div style={{width:"100%",background:"#2563eb",borderRadius:"4px 4px 0 0",height:`${(b.v/max)*100}%`,minHeight:"4px"}}/>
            <span style={{fontSize:"11px",color:"#94a3b8"}}>{b.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IntegrationStatus({widget,stats}:{widget:Widget;stats:Stats}) {
  const integrations=[
    {name:"Shopify",enabled:stats.integrations.shopify.enabled,icon:"🛍️",desc:"E-commerce data"},
    {name:"HubSpot CRM",enabled:stats.integrations.crm.enabled,icon:"📊",desc:"CRM pipeline"},
  ];
  return (
    <div style={card}>
      <h3 style={{fontWeight:600,color:"#1e293b",marginBottom:"16px",fontSize:"15px"}}>🔗 {widget.title}</h3>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {integrations.map(int=>(
          <div key={int.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px",background:"#f8fafc",borderRadius:"10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"20px"}}>{int.icon}</span>
              <div>
                <div style={{fontWeight:600,fontSize:"13px",color:"#1e293b"}}>{int.name}</div>
                <div style={{fontSize:"12px",color:"#94a3b8"}}>{int.desc}</div>
              </div>
            </div>
            <span style={{fontSize:"12px",padding:"4px 10px",borderRadius:"100px",fontWeight:600,background:int.enabled?"#dcfce7":"#f1f5f9",color:int.enabled?"#16a34a":"#64748b"}}>
              {int.enabled?"Active":"Disabled"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity({widget,stats}:{widget:Widget;stats:Stats}) {
  return (
    <div style={card}>
      <h3 style={{fontWeight:600,color:"#1e293b",marginBottom:"16px",fontSize:"15px"}}>📋 {widget.title}</h3>
      {stats.recentConversations.length===0
        ? <p style={{fontSize:"13px",color:"#94a3b8",textAlign:"center",padding:"16px 0"}}>No recent conversations</p>
        : stats.recentConversations.map(c=>(
          <div key={c._id} style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px",borderRadius:"8px",marginBottom:"4px"}}>
            <div style={{width:"32px",height:"32px",background:"#eff6ff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px"}}>💬</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:"13px",fontWeight:500,color:"#1e293b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.title}</div>
              <div style={{fontSize:"11px",color:"#94a3b8"}}>{new Date(c.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        ))
      }
    </div>
  );
}

function QuickActions({widget}:{widget:Widget;stats?:Stats}) {
  const actions=(widget.config?.actions as {label:string;href:string}[])||[{label:"Go to Chat",href:"/chat"},{label:"View Conversations",href:"/chat"}];
  return (
    <div style={card}>
      <h3 style={{fontWeight:600,color:"#1e293b",marginBottom:"16px",fontSize:"15px"}}>⚡ {widget.title}</h3>
      <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
        {actions.map((a,i)=>(
          <a key={i} href={a.href} style={{display:"block",padding:"10px 14px",background:"#f8fafc",borderRadius:"8px",fontSize:"13px",color:"#374151",textDecoration:"none",border:"1px solid #e2e8f0"}}>
            {a.label}
          </a>
        ))}
      </div>
    </div>
  );
}

function AiUsage({widget,stats}:{widget:Widget;stats:Stats}) {
  const pct=Math.min(100,(stats.totalConversations/100)*100);
  return (
    <div style={card}>
      <h3 style={{fontWeight:600,color:"#1e293b",marginBottom:"16px",fontSize:"15px"}}>📈 {widget.title}</h3>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:"13px",marginBottom:"8px"}}>
        <span style={{color:"#64748b"}}>Conversations Used</span>
        <span style={{fontWeight:600,color:"#1e293b"}}>{stats.totalConversations} / 100</span>
      </div>
      <div style={{width:"100%",background:"#e2e8f0",borderRadius:"100px",height:"8px"}}>
        <div style={{width:`${pct}%`,background:"linear-gradient(90deg,#2563eb,#1d4ed8)",height:"8px",borderRadius:"100px"}}/>
      </div>
      <p style={{fontSize:"12px",color:"#94a3b8",marginTop:"6px"}}>{pct.toFixed(0)}% of monthly quota</p>
    </div>
  );
}

const WIDGET_MAP: Record<string, any> = {
  "stat-card":StatCard,
  "conversation-chart":ConversationChart,
  "integration-status":IntegrationStatus,
  "recent-activity":RecentActivity,
  "quick-actions":QuickActions,
  "ai-usage":AiUsage,
};

export function WidgetRenderer({widget,stats}:{widget:Widget;stats:Stats}) {
  const Component=WIDGET_MAP[widget.type];
  if (!Component) {
    return (
      <div style={{background:"#fefce8",border:"1px solid #fde047",borderRadius:"12px",padding:"16px",fontSize:"13px",color:"#854d0e"}}>
        Unknown widget: <code>{widget.type}</code>
      </div>
    );
  }
  return <Component widget={widget} stats={stats}/>;
}
