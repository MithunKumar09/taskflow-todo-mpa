# Testing and certification

## Reproduce

Use Node 24 and .env copied from .env.example. Install with npm ci, generate Prisma, start both Compose services, and apply development/test migrations as described in [README](../README.md).

```powershell
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run build
npx playwright install chromium
npm run test:e2e
```

Postman requires a running API: `npm run postman:test`. Override a dedicated port using `-- --env-var baseUrl=http://127.0.0.1:3100`. The collection creates/deletes its own record and preserves other tasks.

## Isolation

Unit tests need no database. Integration tests automatically apply committed migrations, then use Fastify inject against real PostgreSQL. Browser tests use compiled API and built preview on dedicated ports 3100/5174 with reuseExistingServer false.

TEST_DATABASE_URL must use a loopback host, end in _test, and name a different database from development. Fixtures clear only Todo records on that guarded target before/after tests. A single browser worker and nonparallel integration files prevent collisions. Do not run these suites simultaneously against the same test database. No application reset endpoint exists.

## Coverage

| Layer                   | Checks                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema/environment unit | Normalization/defaults, invalid/unknown fields, UUID/enums/dates/lengths, pagination, safe configuration failures                                       |
| Service unit            | Atomic completion/reopening, no prior read, unrelated-patch preservation, not-found                                                                     |
| PostgreSQL integration  | CRUD/persistence/status codes, nulls, completion, combined filters, all sorts/stable ties, pagination, safe errors, CORS, body/rate limits, constraints |
| Chromium journeys       | CRUD, queries/page, MPA/refresh, missing/malformed/unknown IDs, empty/filter-empty, retry, skeleton, duplicate mutation, stale reads                    |
| Responsive              | 360×800, 390×844, 768×1024, 1024×900, 1440×900                                                                                                          |
| Axe/keyboard            | List, detail, create/edit dialogs, focus containment/restoration, Escape, validation focus                                                              |
| Postman                 | Health, lifecycle/query/completion, negative validation/404                                                                                             |

Responsive checks cover document overflow, control bounds, long text, dialogs/reachability, pagination, mobile actions, and focus visibility. Tests prefer roles/labels and web-first assertions. Only controlled failures/delays use interception; ordinary flows persist through the real API.

## MPA proof

mpa-navigation.spec.ts verifies an ordinary anchor and installs the request waiter before clicking. The matching request must be a navigation request of resourceType document to /todo/?id=<uuid>. Its response must be successful HTML and render the expected detail. Direct reload must produce another successful document response. URL changes alone cannot pass.

## Focus and human review

Automated keyboard checks complement axe and do not replace all accessibility review. At mobile and desktop widths:

1. Tab/Shift+Tab through controls; confirm visible focus and logical order.
2. Open create/edit/delete dialogs; cycle focus both directions inside the modal.
3. Close via Escape/Cancel; check focus restoration or a meaningful fallback.
4. Submit invalid input; verify message/focus. Hold a submission; verify dismissal and duplicate writes are locked.
5. Inspect long content, date controls, status filters, pagination, and scrolling dialogs.

Human visual acceptance and a recorded demo remain separate from automation. This is a focused accessibility layer, not full WCAG certification.

## Failure evidence

Trace/video are retained on failure, screenshots only on failure. Retries: 0 locally, 1 in CI. Investigate retry-only passes. Successful runs retain no recordings. test-results/ and playwright-report/ are ignored; CI uploads failure evidence.

Use `npx playwright show-report` or `npx playwright show-trace <trace.zip>`. `npm run test:e2e:ui` opens the functional Chromium suite interactively.

## Optional visual regression

Visual tests are separate and skipped unless VISUAL_BASELINES_APPROVED=1 is explicitly set **after application visual acceptance**.

```powershell
$env:VISUAL_BASELINES_APPROVED = '1'
npm run test:e2e:update
npm run test:e2e:visual
Remove-Item Env:VISUAL_BASELINES_APPROVED
```

Generate baselines from the application, never reference PNGs. Fixed fixture timestamps, locale/timezone/viewports, font readiness, and disabled animations reduce noise. Review platform-specific baselines explicitly. CI never updates them automatically and excludes them from functional certification. README screenshots live separately in docs/assets/.

Firefox/WebKit smoke, concurrency stress, public deployment, and Swagger remain optional. Serializable/retry machinery is absent.

## CI

Lockfile install → Prisma generate → isolated PostgreSQL readiness → committed migrations → lint → typecheck → unit → integration → build → install Chromium/system dependencies → functional E2E. Postman runs against a temporary compiled test API. Remote CI must be checked against the pushed revision.

## Verified local results

On Windows with Node 24.21.0 and Docker PostgreSQL 17:

| Check                                | Result                                               |
| ------------------------------------ | ---------------------------------------------------- |
| Unit                                 | 42 passed                                            |
| PostgreSQL integration               | 42 passed                                            |
| Functional Chromium                  | 18 passed, no retries                                |
| Postman                              | 15 requests, 45 assertions passed                    |
| Lint, strict type checking, build    | Passed                                               |
| Environment/schema/client/migrations | Passed                                               |
| Database outage/recovery             | Safe health 503 while stopped; healthy after restart |
| Persistence                          | Created record survived PostgreSQL stop/start        |
| Clean staged export                  | npm ci, generation/migrations, and all checks passed |

The Chromium result includes axe scans, keyboard/focus checks, document-navigation proof, and all five responsive widths. Actual application screenshots are published under docs/assets/. Human visual approval and optional visual baselines remain separate. Remote CI is verified against the pushed revision during delivery.

## Dependency audit

The production dependency audit reports **zero vulnerabilities**. Patched transitive versions are pinned through root package overrides and verified through Prisma generation/migration and application/tooling checks.

The complete development audit still reports **10 affected packages (6 high, 4 moderate)** through Newman 6: its old Faker/UUID/CSV dependencies and a node-forge signature-verification advisory. The local HTTP collection does not exercise RSA authentication, external CSV iteration data, or Faker templates, but these upstream advisories remain unresolved. Newman is a development-only tool; use the committed collection and keep it out of a production installation. Do not force npm's suggested Prisma 6/Newman 4 downgrades. Recheck the full audit when upstream compatible fixes become available.
