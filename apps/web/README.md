# Modelarna Web

Marketing site and order flow for [modelarna.cz](https://modelarna.cz) — physical 3D architectural scale models (FDM / PLA).

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- react-i18next (cs, de, pl, it, es, fr)
- react-helmet-async (SEO)

## Local development

```bash
yarn dev:web
```

Runs on [http://localhost:8080](http://localhost:8080). API requests to `/api` are proxied to the backend on port 3000.

## Environment

Copy `.env.example` to `.env`:

| Variable | Description |
|----------|-------------|
| `VITE_SITE_URL` | Canonical site URL (default `https://modelarna.cz`) |
| `VITE_API_BASE_URL` | API base path (default `/api`) |
| `VITE_SUPABASE_*` | Optional Supabase client |

## Production

Build: `yarn build:web` → output in `apps/web/dist`.

Netlify sets `VITE_SITE_URL=https://modelarna.cz` via `netlify.toml`.
