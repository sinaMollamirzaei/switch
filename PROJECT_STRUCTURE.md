# SwitchApp — Project Structure

A car service management app with a **Vite + React (TypeScript) web frontend**, a **Supabase backend**, and an **Expo (React Native) mobile app**.

---

## Root

| Path | Purpose |
|------|---------|
| `index.html` | Vite entry HTML |
| `vite.config.ts` | Vite build config (React + Tailwind + custom asset resolver) |
| `package.json` | Web app dependencies |
| `pnpm-workspace.yaml` | pnpm workspace setup |
| `postcss.config.mjs` | PostCSS config |
| `default_shadcn_theme.css` | shadcn/ui default theme vars |

## `src/` — Web Frontend (Vite + React + Tailwind)

```
src/
├── main.tsx              # ReactDOM entry
├── styles/               # CSS (tailwind, globals, theme, calendar, fonts)
├── assets/               # Static images
├── imports/              # CarServiceManagementApp.tsx, SVG imports
└── app/
    ├── App.tsx           # Root component (auth flow + 4-tab navigation)
    ├── context/          # React Contexts
    │   ├── AppContext.tsx
    │   └── AuthContext.tsx
    ├── utils/
    │   └── dateFormatter.ts
    └── components/
        ├── ui/           # ~50 shadcn/ui Radix-based UI primitives (button, dialog, etc.)
        ├── figma/        # Figma-specific components (ImageWithFallback)
        ├── Dashboard.tsx
        ├── AddService.tsx
        ├── CarManagement.tsx
        ├── EducationInsights.tsx
        ├── PhoneLogin.tsx
        ├── OTPVerification.tsx
        ├── SplashScreen.tsx
        ├── ServiceCard.tsx / ServiceHistorySheet.tsx
        ├── SwipeableReminderCard.tsx
        ├── Timeline.tsx / TimelineItem.tsx
        ├── ValiditySection.tsx / PrivacyPolicy.tsx
        └── CarCard.tsx
```

## `supabase/` — Backend (Supabase Edge Functions)

```
supabase/
├── SETUP_GUIDE.md        # Deployment guide
├── DATABASE_SCHEMA.md    # Full DB schema + SQL
├── API_ENDPOINTS.md      # 50+ endpoint docs
├── ARCHITECTURE.md       # System design
├── API_TESTING.md        # Testing guide
└── functions/server/
    ├── index.tsx          # Main server entry
    ├── services.tsx       # Service CRUD routes
    ├── reminders.tsx      # Reminder routes
    ├── insurance_inspection.tsx
    ├── notifications.tsx
    └── kv_store.tsx       # KV store utilities
```

## `mobile-app/` — Mobile App (Expo / React Native)

```
mobile-app/
├── App.tsx                # Root component
├── app.json / eas.json    # Expo + EAS Build config
├── package.json / tsconfig.json / babel.config.js
├── src/
│   ├── config/            # api.ts, theme.ts, i18n.ts (fa/en)
│   ├── contexts/          # AuthContext, CarsContext, ProfileContext
│   ├── navigation/        # RootNavigator, AuthNavigator, MainNavigator
│   ├── screens/auth/      # PhoneNumberScreen.tsx
│   ├── services/api/      # client.ts (Axios)
│   ├── types/index.ts     # TypeScript type definitions
│   └── utils/             # storage, persianNumber, jalaliDate, format
```

## `docs/` — Integration Documentation

| File | Content |
|------|---------|
| `FRONTEND_BACKEND_INTEGRATION.md` | Screen-to-API mapping (most important) |
| `API_CLIENT_SETUP.md` | Ready-to-use TS client code |
| `INTEGRATION_FLOWCHARTS.md` | Auth, dashboard, and feature flows |

## `utils/supabase/` — Supabase helper (info.tsx)

## `guidelines/` — Development guidelines (Guidelines.md)

## Root Documentation

| File | Content |
|------|---------|
| `GETTING_STARTED.md` | Quick overview & 5-min setup |
| `PROJECT_COMPLETE_SUMMARY.md` | Full project overview & stats |
| `MOBILE_APP_COMPLETE_GUIDE.md` | Mobile implementation roadmap |
| `ATTRIBUTIONS.md` | Third-party attributions |

---

## Architecture Overview

```
User → Vite Web App (src/) ←→ Supabase Edge Functions (supabase/functions/server/) ←→ PostgreSQL DB
                                    ↑
User → Expo Mobile App (mobile-app/) ┘
```

- **Auth**: Phone number → OTP verification flow
- **State**: React Context (AppContext, AuthContext) on web; Context providers on mobile
- **UI**: shadcn/ui (Radix primitives + Tailwind) on web; custom components on mobile
- **Language**: Bilingual (Persian/English) via i18n config
- **Calendar**: Jalali (Persian) date support via `jalaali-js`
