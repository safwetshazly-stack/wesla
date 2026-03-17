# Wasla Frontend — وصلة

React 18 + TypeScript + Vite + Tailwind CSS — Arabic RTL PWA

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env.local

# 3. Start dev server (make sure backend is running first)
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
src/
├── App.tsx                    ← Router + route guards
├── main.tsx                   ← React entry point
├── index.css                  ← Tailwind + global styles
├── stores/
│   └── auth.store.ts          ← Zustand auth state (persisted)
├── lib/
│   ├── api.ts                 ← Axios client + auto token refresh
│   └── socket.ts              ← Socket.io client singleton
├── hooks/
│   └── useApi.ts              ← All React Query hooks
├── components/
│   ├── ui/index.tsx           ← Button, Input, Badge, Modal, etc.
│   └── layout/
│       ├── AuthLayout.tsx     ← Centered card for auth pages
│       └── DashboardLayout.tsx← Sidebar + header for app pages
└── pages/
    ├── LandingPage.tsx        ← Public home page
    ├── auth/
    │   ├── LoginPage.tsx
    │   ├── RegisterPage.tsx
    │   ├── OtpPage.tsx
    │   └── ForgotPasswordPage.tsx
    ├── dashboard/
    │   ├── SeekerDashboard.tsx
    │   └── HelperDashboard.tsx
    ├── helpers/
    │   ├── SearchHelpersPage.tsx
    │   ├── HelperProfilePage.tsx
    │   └── HelperProfileEditPage.tsx
    ├── sessions/
    │   ├── SessionsListPage.tsx
    │   ├── BookSessionPage.tsx
    │   ├── SessionDetailPage.tsx
    │   └── SessionRoomPage.tsx  ← WebRTC voice/video/chat
    ├── payments/
    │   └── WalletPage.tsx
    └── admin/
        ├── AdminDashboard.tsx
        ├── AdminUsersPage.tsx
        ├── AdminSessionsPage.tsx
        └── AdminDisputesPage.tsx
```

---

## Scripts

```bash
npm run dev      # Dev server with HMR
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Tech Stack

| Package | Purpose |
|---------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool + HMR |
| Tailwind CSS | Styling (RTL support) |
| React Router v6 | Client-side routing |
| TanStack Query v5 | Server state + caching |
| Zustand | Client state (auth) |
| React Hook Form | Forms + validation |
| Zod | Schema validation |
| Axios | HTTP client |
| Socket.io-client | Real-time WebSocket |
| date-fns | Date formatting (Arabic) |
| Lucide React | Icons |
| React Hot Toast | Notifications |

---

## Design System

- **Language**: Arabic-first (RTL) with English support
- **Font**: Cairo (Google Fonts)
- **Colors**: Wasla Green (`#1D9E75`) + Teal (`#0F6E56`)
- **3D effects**: CSS `perspective` + `transform` only — no WebGL
- **Animations**: GPU-friendly (`opacity` + `transform`) — respects `prefers-reduced-motion`
- **Mobile**: Touch-friendly (44px min tap targets), works on all screen sizes
