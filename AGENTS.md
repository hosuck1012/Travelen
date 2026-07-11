# Repository Guidelines

## Project Sources & Scope

- Use `specification.pdf` as the source of truth for feature requirements and product behavior.
- Use `travel_ai_mockup_ko/travel_ai_mockup_ko/index.html` as the design reference for layout, flow, visual tone, and Korean UI copy.
- Write actual website code only under `web/`; keep root files, specs, mockups, and temporary assets separate from app source.
- Build the UI in Korean by default.
- Work in clear stages. Do not implement the entire site in one pass unless explicitly requested.
- For the current stage, do not implement external APIs, login/authentication, or databases. Use static or local mock data when needed.

## Project Structure & Module Organization

- `web/` contains the active Next.js app. Source is in `web/src/app/`, static assets are in `web/public/`, and config files include `package.json`, `tsconfig.json`, `eslint.config.mjs`, and `next.config.ts`.
- `travel_ai_mockup_ko/travel_ai_mockup_ko/` contains the standalone Korean HTML mockup.
- `specification.pdf` contains feature requirements. `tmp/` is for temporary local work and should not be treated as source.

## Build, Test, and Development Commands

Run app commands from `web/`:

- `npm run dev` starts the local Next.js dev server with Turbopack.
- `npm run build` creates a production build.
- `npm run start` serves the production build after `npm run build`.
- `npm run lint` runs ESLint with Next.js and TypeScript rules.

After implementation work, run `npm run lint` from `web/` and report the result.

## Coding Style & Naming Conventions

Use TypeScript, React function components, and the App Router conventions already present in `web/src/app/`. Keep two-space indentation, double quotes, semicolons, and Tailwind CSS utility classes for component styling. Keep global CSS limited to shared tokens and base styles in `web/src/app/globals.css`.

Name React components in `PascalCase`, hooks in `useCamelCase`, and route or utility files with clear lowercase names unless the framework requires otherwise. Before editing `web/`, read `web/AGENTS.md` for web-specific instructions.

## Testing Guidelines

No test framework is currently configured. Until one is added, validate changes with `npm run lint` and a local browser check for UI work. If tests are introduced, use descriptive names such as `ComponentName.test.tsx` and place them near the relevant source or in a clearly named test directory.

## Commit & Pull Request Guidelines

Recent commits use Conventional Commit style, for example `fix: track web app in root repository` and `chore: initialize Travelen project`. Continue using `type: concise summary` with lower-case types such as `fix`, `feat`, `chore`, or `docs`.

Pull requests should include a short description, validation steps run, linked issues when applicable, and screenshots or screen recordings for visible UI changes.
