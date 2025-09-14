# Repository Guidelines
- 가능한 모든 대답은 한글로 대답합니다. 

## Project Structure & Module Organization
- App code lives in `src/`.
  - `src/pages/` (Next.js Pages Router) — route files like `index.jsx`, `post/[id].jsx`.
  - `src/components/` — reusable UI (PascalCase files, e.g., `DynamicEditor.jsx`).
  - `src/store/` — Redux store, actions, reducers, sagas.
  - `src/service/` — API clients (axios) and service facades.
  - `src/styles/` — global CSS and theme assets.
  - `src/model/`, `src/util/` — shared models and helpers.
- Static assets: `public/` (e.g., `public/images`, `public/fonts`).
- CKEditor custom build: `ckeditor5/`.

## Build, Test, and Development Commands
- `npm run dev` — start local dev at `http://localhost:3000` with inspector.
- `npm run build` — production build via Next.js.
- `npm start` — run production server (after build).
- `npm run lint` — ESLint (Next core-web-vitals rules).
- Docker (optional): `docker build -t blog-nextjs .` then `docker run -p 3000:3000 blog-nextjs`.

## Coding Style & Naming Conventions
- JavaScript/JSX with 2-space indentation.
- Components: PascalCase (`PostCard.jsx`); hooks: camelCase starting with `use`.
- Redux types: UPPER_SNAKE_CASE in `src/store/types/*`.
- Pages mirror routes (e.g., `src/pages/admin/write/[id].jsx`).
- Linting: extends `next/core-web-vitals` from `.eslintrc.json`. Fix warnings before PR.

## Testing Guidelines
- No formal test suite yet. Prefer Jest + React Testing Library.
- Place tests near sources or under `src/__tests__/`.
- Naming: `*.test.jsx` or `*.test.js`.
- Aim for critical coverage on reducers, sagas, and services.

## Commit & Pull Request Guidelines
- Commits: short, imperative summary (Korean or English). Optional Conventional Commits (e.g., `feat: add tag filter`).
- Before opening a PR: ensure `npm run lint` and `npm run build` pass.
- PRs should include:
  - Purpose and scope; link related issues.
  - Screenshots/GIFs for UI changes.
  - Notes on routes, state changes, and API impacts.

## Security & Configuration Tips
- API proxying is configured in `next.config.js` (`/api/*` rewrites). Use `BLOG_URL_DEV/PROD` envs; do not hardcode secrets.
- Axios is centralized in `src/service/axiosClient.js`; avoid leaking cookies or tokens to logs.
- CI builds container images via `.github/workflows/buildx.yml`; required secrets: `DOCKERHUB_TOKEN`, `GHCR_PAT`.

## Architecture Overview
- Data flow: Components → Actions → Sagas → Services → Reducers → Store → Components.
- Admin routes under `/admin/*` enforce auth via `_app.jsx`.
