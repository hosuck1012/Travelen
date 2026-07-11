<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Web App Instructions

## Sources Of Truth

- Use `../specification.pdf` as the feature specification.
- Use `../travel_ai_mockup_ko/travel_ai_mockup_ko/index.html` as the design reference.
- Keep actual website implementation in this `web/` project.

## Current Implementation Rules

- Build Korean UI copy and interactions by default.
- Work step by step; implement scoped stages instead of the whole site at once.
- Do not add external API integrations, login/authentication, or database code in the current stage. Use local mock data where behavior needs to be demonstrated.
- After work, run `npm run lint` from `web/` and address any reported errors.
