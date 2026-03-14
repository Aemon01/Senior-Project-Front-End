# Senior Project (Frontend)

Monorepo for the VECEP frontend, centered around a Next.js web app with shared UI and types packages.

## Repo structure

```
Senior-Project/
  apps/
    web/                # Next.js app (App Router)
  packages/
    ui-kit/             # Shared UI components
    shared-types/       # Shared TS types
    shared-schemas/     # Shared validation schemas
  .env.example
  package.json          # Workspace root
```

## Tech stack

- Frontend: Next.js (App Router) + React + Tailwind + Three.js (R3F)
- State/Data: Zustand, React Query

## Getting started

### Prereqs

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Run the web app (frontend)

```bash
npm run dev
```

Then open http://localhost:3000.

## Scripts

Run from repo root:

- `npm run dev` ? start Next.js in `apps/web`
- `npm run build` ? build Next.js
- `npm run start` ? start Next.js production server
- `npm run lint` ? lint Next.js app

## Configuration

Copy `.env.example` to `.env` and fill in any required values.

## App notes

- Routes live under `apps/web/src/app`.
- Global styles live in `apps/web/src/styles/globals.css`.
- Static assets live in `apps/web/public`.

## Packages

- `packages/ui-kit`: shared UI primitives and components.
- `packages/shared-types`: shared TypeScript types.
- `packages/shared-schemas`: shared validation schemas.

## Contributing

- Keep changes scoped and add notes to this README if setup steps change.
- Prefer small, reviewable PRs.

## License

TBD
