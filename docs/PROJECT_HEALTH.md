# Smart Tailor AI — Project Health Report

Last updated: 2026-08-20

## Architecture

- **Stack:** Next.js 15, React 19, TypeScript, Tailwind, Framer Motion, Recharts, Zod
- **State:** Single source of truth via `AppStateProvider` (`src/lib/context/app-context.tsx`) backed by `localStorage` keys prefixed `st_*`
- **AI layer:** Provider abstraction (`src/lib/ai/provider.ts`) — OpenRouter → OpenAI → Gemini → deterministic Demo AI
- **Routes:** 39 app routes; customer, tailor, and admin layouts with role guards

## Database

- **Production:** Supabase schema and migrations exist under `supabase/`
- **Demo mode:** All persistence uses localStorage; orders seeded from `DEMO_ORDERS` (50 orders) for rich tailor analytics
- **Consistency:** Order status updates propagate to notifications, customer timeline, and tailor dashboard via shared `orders` state

## Authentication

- **Demo:** One-click login at `/login` (customer / tailor / admin)
- **Guards:** `AuthGuard` on customer, tailor, and admin layouts redirects unauthorized users to `/login`
- **Production gap:** No Supabase Auth session, no middleware RLS enforcement yet

## AI

| Mode | Features |
| ---- | -------- |
| Real AI | OpenRouter/OpenAI/Gemini when `OPENROUTER_API_KEY` configured |
| Demo AI | Intent extraction, NL design, vision, measurement, voice, agentic workflows |
| Transparency | Labels: "Demo AI", "AI Estimate", "AI Preview" on relevant outputs |

## Customer Flow

1. Login → AI Concierge → structured intent
2. Design Studio populated via `pendingIntentDesign` / intent actions
3. NL commands ("خليه أنحف") update design state
4. Image AI → analyze → apply to designer
5. Measurements: camera, manual entry, or demo scan
6. Style DNA updates from orders + style events
7. Tailor matching with score + reasons
8. Specification → checkout → order created
9. Order tracking with dynamic timeline
10. One-tap reorder copies design + measurements + tailor

## Tailor Flow

1. Dashboard insights computed from live `orders` + `inventory`
2. Order management with status advance
3. Inventory CRUD + low-stock alerts
4. Pricing calculator with apply
5. Analytics charts from aggregated order data
6. Marketing campaigns generate/save/activate
7. Product creator publish to products list
8. Voice AI: "كم عندي طلب متأخر؟" queries actual orders
9. Agent activity log with approval workflow

## Admin Flow

- National intelligence dashboard aggregates anonymous platform stats from orders
- No personal data exposed in aggregate views

## Security

- Demo mode: no secrets in repo; rotate any exposed API keys
- Customer measurements/photos scoped to local session
- Tailor sees orders filtered by `tailor_id`
- Audit logs for agentic actions in `agentLogs`
- **Gap:** Production RLS, secure file upload, and server-side-only AI calls not fully wired

## Performance

- Build: passes with 39 static/dynamic routes
- Client-side state hydration on mount; no SSR/localStorage mismatch for guarded routes
- Charts lazy via Recharts ResponsiveContainer

## Testing

```bash
npm test  # scripts/test-core.mjs — intent, NL design, matching, Style DNA, reorder
```

Manual E2E demo flow documented in QA prompt (19 steps) — run via `npm run dev`.

## Known Limitations

1. **Supabase not live** — app runs in demo localStorage mode
2. **No real camera ML** — measurements are deterministic demo estimates
3. **No real try-on** — prototype preview labeled "AI Preview"
4. **Voice** — browser SpeechRecognition or demo transcript; tailor intents query local data
5. **Zod validation** — present in dependencies; not applied to every form systematically
6. **Privacy deletion** — demo toasts only; no full data wipe API
7. **Production auth/RLS** — architecture ready, not enforced

## Health Summary

| Area | Status |
| ---- | ------ |
| Build | ✅ Pass |
| Typecheck | ✅ Pass |
| Core tests | ✅ 16/16 |
| Dead UI (major) | ✅ Wired |
| Data consistency | ✅ Single store |
| Demo reliability | ✅ Demo AI fallbacks |

The product is **demo-ready** for hackathon presentation with honest AI labeling and working end-to-end flows in localStorage mode.
