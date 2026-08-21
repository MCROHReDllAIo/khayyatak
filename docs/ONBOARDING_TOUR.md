# Onboarding Tour — خياطك

**Version:** `2026.1`  
**Tour id:** `main`

## Overview

Premium interactive walkthrough for first-time visitors to the stores-first home (floating AI concierge).

- Optional welcome: **ابدأ الجولة** / **استكشف بنفسي**
- Spotlight targets real DOM via `data-tour="..."`
- Persists for authenticated users in Postgres; guests use `localStorage`
- Never creates fake products, stores, or orders
- Honest caveats when features may be unconfigured (Virtual Look, 3D, mic)
- AI sheet opens/closes via `openAi` on steps (`kytk-open-ai` / provider callbacks)

## Components

| Component | Path |
|-----------|------|
| `OnboardingProvider` | `src/components/onboarding/OnboardingProvider.tsx` |
| `OnboardingTour` | `src/components/onboarding/OnboardingTour.tsx` |
| `TourWelcome` | `src/components/onboarding/TourWelcome.tsx` |
| `Spotlight` | `src/components/onboarding/Spotlight.tsx` |
| `TourProgress` / demos | `src/components/onboarding/TourProgress.tsx` |
| `FeatureTutorial` | `src/components/onboarding/FeatureTutorial.tsx` |
| `HomeAIConcierge` | `src/components/home/HomeAIConcierge.tsx` |

## Tour steps (targets)

| # | Step id | Target | Notes |
|---|---------|--------|-------|
| — | welcome | full-screen | `TourWelcome` (before tour) |
| 1 | `home` | `[data-tour=home-split]` | Brand + stores-first hero |
| 2 | `stores` | `[data-tour=home-stores]` | Full-width marketplace |
| 3 | `store-card` | `[data-tour=home-store-card]` | First card or empty state |
| 4 | `ai` | `[data-tour=home-ai-fab]` | Floating AI launcher |
| 5 | `ai-demo` | `[data-tour=home-ai-input]` | Opens sheet; demo search (no DB write) |
| 6 | `media` | `[data-tour=home-ai-controls]` | Voice / photo / innovate — no auto mic |
| 7 | `innovate` | `[data-tour=home-innovate]` | Design collab demo |
| 8 | `design` | center | Measurements / virtual / tailor feasibility caveats |
| 9 | `orders` | center | Order timeline demo — no fake order |
| 10 | `finish` | center | Summary CTAs |

## Feature dependencies / honesty

| Feature | Tour behavior |
|---------|----------------|
| Real stores | Uses live marketplace; empty state if none |
| AI search | Visual demo only in tour; real search only when user sends |
| Microphone | Never requested during tour |
| Virtual Look | Explained with “available when configured” |
| 3D | Labeled conceptual / when model exists |
| Orders | Timeline illustration only |

## Persistence

**Table:** `user_onboarding` (migration `008_onboarding_tours.sql`)

Fields: `user_id`, `tour_id`, `tour_version`, `completed`, `skipped`, `current_step`, `completed_at`

**Local fallback key:** `kytk_tour_main_2026.1`

**API:** `GET/POST /api/onboarding`

## Analytics events

| Event | When |
|-------|------|
| `tour_started` | User starts tour |
| `tour_step_viewed` | Step change |
| `tour_skipped` | Skip / explore alone |
| `tour_completed` | Finish |
| `tour_restarted` | Restart from profile |
| `feature_tutorial_opened` | Mini-tutorial dismissed |

Stored in `onboarding_events` when DB available.

## Restart

- Profile → **جولة تعريفية — ابدأ الجولة**
- Dispatches `kytk-restart-tour` and navigates to `/`

## Responsive

- Desktop: spotlight + floating tooltip
- Mobile: bottom sheet card + switches AI/Stores tabs per step
- Keyboard: Esc skip, arrows / Enter next
- `prefers-reduced-motion`: no pulse / smooth scroll

## Mini tutorials

| Feature id | Page |
|------------|------|
| `innovation` | `/customer/innovation` |
| `measurements` | `/customer/measurements` |

## Tours

| Tour id | Where | Notes |
|---------|-------|-------|
| `main` | `/` (home) | Stores-first + floating AI |
| `customer` | `/customer` | Customer hub walkthrough (nav, concierge, innovate, orders) |

Replay customer tour from **حسابي → جولة لوحة العميل**.

## Known limitations

1. Run `npm run db:migrate` on Railway for server persistence (localStorage works without it).
2. Spotlight uses `getBoundingClientRect` — complex sticky headers may need padding tweaks.
3. Tour demos are UI-only; they do not call concierge or create DB rows.
4. English LTR: tooltip placement still uses physical left/right from rect math (viewport-safe).
