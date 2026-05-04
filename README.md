# Debales AI — Multi-Tenant AI Assistant Platform

A full-stack, multi-tenant AI assistant SaaS built with **Next.js App Router**, **MongoDB**, **TanStack Query**, **Zod**, and **Gemini AI**.

---

## 🚀 Quick Start (Local)

### 1. Prerequisites
- Node.js 20+
- MongoDB Atlas account (free tier works) **or** Docker

### 2. Clone & Install
```bash
git clone <your-repo-url>
cd debales-ai
npm install
```

### 3. Set Environment Variables
```bash
cp .env.example .env.local
```
Edit `.env.local`:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/debales-ai?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here   # Get free at https://aistudio.google.com/app/apikey
SESSION_SECRET=any-random-32-char-string
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Seed the Database
```bash
npm run seed
```
This creates:
- 2 Projects: `techcorp`, `retailco`
- 3 Users (admin + member for techcorp, admin for retailco)
- 2 Product Instances (AI Sales Assistant, AI Support Agent)
- 2 Sample Conversations
- **2 DashboardConfig documents** (the MongoDB docs that drive the admin UI)

### 5. Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Demo Logins

| Email | Project Slug | Role |
|---|---|---|
| `admin@techcorp.com` | `techcorp` | **Admin** (can access admin dashboard) |
| `member@techcorp.com` | `techcorp` | Member (chat only) |
| `admin@retailco.com` | `retailco` | **Admin** |

> **No password needed** — just email + project slug. Auth is a demo stub.

---

## 🐳 Docker Alternative

```bash
cp .env.example .env.local   # fill in your vars
docker-compose up --build
```
If using Docker's local MongoDB, use `MONGODB_URI=mongodb://mongo:27017/debales-ai`

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App Router                │
│                                                      │
│  /login   /chat   /admin   (pages)                  │
└────────────────────┬────────────────────────────────┘
                     │ TanStack Query hooks
                     ▼
┌─────────────────────────────────────────────────────┐
│              Route Handlers (API Layer)              │
│  /api/auth  /api/projects  /api/conversations        │
│  /api/admin  /api/projects/integrations              │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   [Access]     [Services]    [Zod Schemas]
   Pure rules   Business logic  Input validation
   canAdmin()   conversationSvc  LoginSchema
   canAccess()  dashboardSvc     SendMessageSchema
                aiService
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              MongoDB (Mongoose Models)               │
│  Project │ User │ ProductInstance                    │
│  Conversation │ DashboardConfig ◄── drives admin UI  │
└─────────────────────────────────────────────────────┘
```

### Layer Responsibilities
| Layer | Files | Role |
|---|---|---|
| **Access** | `src/lib/access/rules.ts` | Pure boolean authorization functions |
| **Services** | `src/lib/services/*.ts` | Business logic + DB access |
| **Routes** | `src/app/api/**/route.ts` | Thin HTTP handlers, Zod validation |
| **Hooks** | `src/hooks/useApi.ts` | TanStack Query client hooks |
| **UI** | `src/app/**/page.tsx` | React components, no direct DB calls |

---

## 🗄️ Multi-Tenant Model

```
Project (tenant boundary — has a slug like "techcorp")
  └── Users (role: admin | member, scoped to project)
  └── ProductInstances (e.g. "AI Sales Assistant")
       └── Conversations (scoped to project + productInstance)
            └── Messages (user/assistant turns)
  └── DashboardConfig (ONE per project — drives admin UI layout)
```

Every API route verifies the requesting user's `projectId` matches the resource's `projectId`. Admins of one project cannot see another project's data.

---

## ⚙️ Config-Driven Admin Dashboard

### Which collection drives it?
**`DashboardConfig`** — one document per project.

### How it works
1. Admin visits `/admin`
2. `/api/admin` calls `getDashboardConfig(projectId)`
3. The document is returned and the page maps `sections → widgets → WidgetRenderer`
4. Editing the MongoDB document changes the dashboard **without any code changes**

### Supported widget types
| type | What it renders |
|---|---|
| `stat-card` | Metric card with icon, value, change |
| `conversation-chart` | Weekly bar chart |
| `integration-status` | Shopify/CRM status cards |
| `recent-activity` | Last 5 conversations |
| `quick-actions` | Configurable action buttons |
| `ai-usage` | Monthly quota progress bar |

### How to verify config-driven behavior

**Step 1 — Open MongoDB Atlas** → Collections → `dashboardconfigs`

**Step 2 — Edit the document** for your project (e.g. remove a section or add a widget):
```json
// Add this widget to any section's widgets array:
{
  "id": "w99",
  "type": "quick-actions",
  "title": "My New Widget",
  "order": 99,
  "span": "full",
  "config": {
    "actions": [
      { "label": "Custom Action", "href": "/chat" }
    ]
  }
}
```

Or change a section label:
```json
// Find: "label": "Overview"
// Change to: "label": "🚀 My Custom Section"
```

**Step 3 — Refresh `/admin`** — the new section/widget appears instantly with no code change.

**Step 4 — Record Loom video** showing this flow for the assignment.

---

## 🤖 AI Integration

- **Primary**: Google Gemini 1.5 Flash (free tier at [aistudio.google.com](https://aistudio.google.com/app/apikey))
- **Fallback**: Smart mock responses based on message content and integration state
- **Rate limiting**: If Gemini returns 429, automatically falls back to mock
- **Integrations**: Toggling Shopify/CRM on the admin dashboard changes the context injected into AI calls and the "step" indicators shown in chat

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `GEMINI_API_KEY` | ⚠️ | Gemini API key (falls back to mock if missing) |
| `SESSION_SECRET` | ✅ | Any random string for session encoding |
| `NEXT_PUBLIC_APP_URL` | ✅ | Your app URL |

---

## 📦 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars in Vercel dashboard:
# MONGODB_URI, GEMINI_API_KEY, SESSION_SECRET, NEXT_PUBLIC_APP_URL
```

After deploying, run seed against the production DB:
```bash
MONGODB_URI=your_production_uri npm run seed
```

---

## ✅ Mocked / Simplified Items

- **Auth**: No password hashing — session is base64 JSON cookie (demo only; use JWT + bcrypt in production)
- **AI responses**: Falls back to canned responses if no Gemini key or rate limited
- **Shopify/CRM integrations**: Mock data (realistic order + pipeline data hard-coded in `aiService.ts`)
- **Charts**: Static weekly data with today's count injected

---

## 🧪 Testing

```bash
# Access rule tests (pure functions)
npx ts-node -e "
const { canAccessAdmin, canManageIntegrations, canViewConversation } = require('./src/lib/access/rules');
const admin = { id: '1', role: 'admin', projectId: 'p1', name: 'Test', email: 't@t.com' };
const member = { ...admin, role: 'member' };
console.assert(canAccessAdmin(admin) === true);
console.assert(canAccessAdmin(member) === false);
console.assert(canManageIntegrations(admin) === true);
console.log('All access rule tests passed!');
"
```
