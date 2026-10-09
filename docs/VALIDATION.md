# Executed validation

## Passed

- Backend Ruff lint: no errors.
- Backend unittest suite: 8 tests passed. Covers API validation, AI contract (stub), topology edges, score/weight/cost reconciliation, workload sensitivity, availability/security changes, risk decision boundaries, and Terraform syntax/resource coverage.
- Frontend ESLint: no errors.
- TypeScript checkJs: passed for all JSX/JS source; shared domain interfaces are checked via JSDoc props/state.
- Frontend Node tests: 5 passed (selection, fallback/empty state, stale-score prevention, non-mutating chart order, workload key-order-independent dirty detection).
- Vite production build: passed. Lazy-loaded diagram and chart bundles keep each JS chunk below 500KB. Lucide emits non-fatal library `use client` directive warnings in a client-only Vite build.
- Clean frontend `npm ci --ignore-scripts`, lint, typecheck, tests and build: passed using the delivered lockfile on Linux.
- Production Chromium browser suite: passed four workloads × three selections (12), score/diagram/cost/security synchronization, three charts, Terraform preview/download and clipboard copy, declared trust changes, simulator, dirty-input state, Terraform API failure/retry, and AI UI response contract using an explicit provider stub.
- Responsive checks: 1440px desktop, 768px tablet, 390px mobile; no horizontal page overflow. Mobile topology displays the readable request path and a separately labeled supporting-services list. Screenshots reviewed.
- Unexpected application console errors/page exceptions: none in the passing browser run. An intentional aborted Terraform request is exercised to verify error/retry UI.
- All three generated Terraform configurations: `terraform init -backend=false` and `terraform validate` passed with Terraform 1.9.8 and the AWS 5.x provider. HCL parsed and expected topology resources asserted in backend tests.

## Scenario results

Backend regression scenarios use default priorities 3/3/3, medium sensitivity and 99.9% availability:

| Users | Traffic | Budget | Recommendation | Overall |
|---:|---|---:|---|---:|
| 5,000 | low | $100 | Serverless | 90.50 |
| 20,000 | medium | $300 | Serverless | 90.44 |
| 100,000 | high | $700 | Containerized | 91.66 |
| 500,000 | high | $2,000 | Containerized | 92.30 |

Browser scenarios use the existing default UI priorities 4/5/4 and high sensitivity, so exact score values differ, but the recommendations above remain the same. All three candidates can be manually selected regardless of ranking.

## Not claimed

- No AWS infrastructure was deployed and no AWS account plan/apply was performed.
- Live Gemini provider requests were not made; configure a key/model to use AI extraction. Manual analysis is fully independent of Gemini.
- No live CloudWatch telemetry, end-user authentication, device attestation or real access enforcement. The risk engine is explicitly advisory.
- Cost coefficients and suitability priors are transparent estimates, not exact AWS prices, measured latency or SLA promises.

Reproduction commands are in the main README. Provider locks, generated Terraform, the Lambda example, test scripts and reviewed diagram screenshots are included in the delivery.
