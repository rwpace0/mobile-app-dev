# Workout Tracker Mobile App

A React Native (Expo) workout app with a Node.js/Express API backed by Supabase (database and auth). The mobile client is **local-first**: workouts, templates, exercises, profiles, and **training plans** are stored in on-device SQLite and synchronized with the server on a schedule and when connectivity returns.

## Project status

**In active development**. The features below reflect what is in the repository today, not a roadmap.

## What the app has today

### Shell and navigation

- **Bottom tabs**: **History**, **Workout** (start hub), **Profile** (settings, library, stats, plan).
- **Stack flows** per tab for drill-in screens (e.g. workout detail, exercise detail, statistics sub-pages).
- **Modal screens** for active workout, template create/edit, add/create exercise, calendar, workout completion, edit workout, and some settings.
- **Deep linking** for email verification and password recovery (`workout://`, plus Expo dev URLs).
- **Gesture handler** root and a custom tab bar (`Navbar`).

### Authentication and onboarding

- Welcome, login, sign-up, **email verification** gate before main app, **password reset** (including handling recovery links).
- JWT access tokens with **refresh** handling in the API client; tokens stored via Expo Secure Store patterns in the auth layer.

### Workout (Start) tab

- **Routine templates** list with refresh, template options, and delete flow.
- **Training plan integration**: when an **active plan** exists, resolves **today’s scheduled template** and shows it with exercise details.
- **Scrollable week calendar**, collapsible sections (e.g. today’s workout, routines, quick start).
- Starts a workout from a template or quick flow; **conflict handling** when a session is already active (`ActiveWorkoutModal`).
- Navigation to routine detail, exercise library, and exercise detail from this area.

### Active workout

- Full-screen **active workout** experience with set logging, **rest timer**, **RIR** and **rep mode** modals, per-exercise notes, finish flow, and **WorkoutComplete** summary.
- **ActiveMini** bar when a session exists so the user can return to the full active workout screen without losing context (not a separate “pause” mode; the session stays in memory/context).

### History

- **Workout history** list and **workout detail** (including exercise detail from history).

### Training plan

- **Plan** screen: active plan, volume-style stats, calendar alignment with the plan, refresh, plan options, delete confirmation.
- **Plan setup**: create/configure a plan (name, start date, pattern length, schedule slots mapped to templates) stored in SQLite via `planAPI` (same local-first/sync-status pattern as other entities).

### Templates (routines)

- **Create** and **edit** templates, **routine detail**, exercises resolved from the library, delete confirmation.

### Exercises

- **View** library, **add** to templates, **create** custom exercises, **exercise detail**; optional **image/video** with local paths and server URLs.

### Statistics (from Profile stack)

- **Overview** charts (workouts, duration, sets) with week/month views and chart components (bar, line, multi-line).
- Dedicated screens: **weekly sets**, **top exercises**, **muscle groups**, **recent bests**, **workout frequency**.

### Profile and settings

- Profile display and **edit profile**; **settings** hub and **account** screens (change username, email, password).
- **Theme**: light/dark via `SettingsContext` and shared color hooks.
- **Haptics** on key actions.

### Data and sync (client)

- **Expo SQLite** (`dbManager`) with versioned migrations, `sync_status` / `version` fields, and a **sync manager** (intervals, network reconnect, app state).
- **NetInfo**-aware behavior; local storage helpers for active workout and tokens.

### Backend (Express)

- **Routes**: `/auth`, `/users`, `/exercises`, `/workouts`, `/templates`, `/media`, `/profile` (see `backend/app.js`).
- **Security**: Helmet, CORS (dev vs production origins), **rate limiting** on non-`/auth` paths.
- **Supabase** for auth and database access from controllers.
- **Media**: uploads and serving exercise/avatar assets via **Cloudflare R2** (see `r2Service.js` / `mediaController.js`), with image processing in `MediaService`.

## Technical architecture (summary)

### Frontend

| Area        | Implementation                                                              |
| ----------- | --------------------------------------------------------------------------- |
| Framework   | Expo ~54, React Native 0.81, React 19                                       |
| Navigation  | React Navigation 7 (native stack + bottom tabs)                             |
| State       | React Context (`AuthProvider`, `SettingsProvider`, `ActiveWorkoutProvider`) |
| Persistence | Expo SQLite, Async Storage / secure patterns for auth                       |
| Media       | Expo Image Picker, file system, cleanup hooks after login                   |

### Backend

| Area      | Implementation                               |
| --------- | -------------------------------------------- |
| Server    | Express, Morgan, cookie parser               |
| Data/auth | Supabase client                              |
| Objects   | Cloudflare R2 for avatars and exercise media |

## Repository layout

```
mobile-app-dev/
├── Workout/                    # Expo app
│   ├── App.jsx                 # Navigation, linking, providers
│   ├── components/             # UI, charts, modals, active workout pieces
│   ├── pages/
│   │   ├── workouts/           # History, active, detail, edit, calendar, complete
│   │   ├── exercises/          # List, add, create, detail
│   │   ├── templates/          # Create, edit, detail
│   │   ├── plan/               # Plan home, plan setup
│   │   ├── statistics/         # Overview + breakdown screens
│   │   └── settings/           # Profile, account, settings pages
│   ├── API/                    # REST clients, local DB, plan, sync
│   ├── state/                  # Settings + active workout context
│   └── styles/                 # Per-screen / component styles
├── backend/                    # Express API
│   ├── app.js
│   ├── routes/                 # Route modules
│   ├── controller/
│   ├── auth/
│   ├── media/                  # R2, validation, media service
│   └── database/               # Supabase client
└── README.md
```

## Platform support

- **iOS**: primary target via Expo (including Expo Go in development).
- **Android / Web**: Expo scripts exist (`expo start --android`, `--web`); polish and testing are limited compared to iOS (see planned items).

## Planned

- Session timeout and clearer error surfacing in the UI
- Crashlytics
- Social or sharing features
- Wearable integration (e.g. Apple Watch)
- Stronger Android parity and testing
- New UI from the ground-up

## Known issues

- Some UI inconsistencies and miscellaneous bugs are still being worked through

## Contributing

This is a personal project currently in active development. Contributions will not be used.
