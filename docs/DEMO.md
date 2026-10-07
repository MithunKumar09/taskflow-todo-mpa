# Reviewer demo — 5–7 minutes

Prepare the app and verification output before recording. Use actual running application content; optionally seed demo tasks.

| Time      | Demonstration                                                                                   |
| --------- | ----------------------------------------------------------------------------------------------- |
| 0:00–0:45 | Desktop/mobile UI, Node 24, React/Vite MPA, Fastify, Prisma 7, PostgreSQL                       |
| 0:45–1:45 | Create/edit a todo, complete/reopen, explain unrelated-edit completion preservation             |
| 1:45–2:30 | Search, combined filters, sorts, pagination, filtered empty/reset                               |
| 2:30–3:15 | Browser Network: normal detail anchor, document request, direct refresh, two emitted HTML files |
| 3:15–4:15 | Layers/migration constraints; Postman success, invalid body/UUID, 404, request IDs              |
| 4:15–5:15 | Backend/Chromium/axe results and five widths; keyboard focus/Escape, duplicate protection       |
| 5:15–6:00 | Restart development PostgreSQL, wait for health, confirm persistence; delete demo task          |
| 6:00–6:45 | Setup/API/architecture/testing docs, remote CI, optional scope, AI disclosure                   |

Commands: npm run test:unit, npm run test:integration, npm run test:e2e, npm run postman:test, docker compose restart postgres. Never remove the development volume to demonstrate persistence.

Record the running application. Generated reference images are not runtime evidence, screenshots, or visual acceptance.
