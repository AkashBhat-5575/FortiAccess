# Implementation audit and plan

## Existing architecture
- React/Vite JSX, single App route (no router or authentication implementation).
- Local React state: manual/AI workload, API analysis, selected architecture, separate what-if result.
- FastAPI endpoints: /, /health, /architectures, /analyze, /simulate, /ai/analyze, /terraform/{id}.
- React Flow diagram and Recharts demo monitoring. Existing neutral CSS design system.
- Scoring, cost, risk and Terraform are backend modules. Gemini parses requirements only.

## Conflicts found
- /analyze computes results twice; simulation duplicates evaluation.
- models.py is shadowed by models/; security scores duplicated.
- Diagram uses service list order (EC2 → RDS → ALB → CloudFront), not traffic topology.
- Overall score contains a cost score not displayed; scores do not respond to workload.
- Monitoring invents timestamps/CPU; no telemetry backend exists.
- Terraform lacks networking/origins and has a literal database password.
- AI import requires a key at startup; google-genai missing from requirements.

## Smallest compatible changes
1. Preserve endpoints, form, selection table, AI and simulator.
2. Add canonical architecture definitions and evaluate all results in one function.
3. Derive estimates, normalized scores/weights, explanations and risk factors there.
4. Render backend topology in existing React Flow; compare results with existing Recharts.
5. Extend selected dashboard with explainability, cost assumptions, security controls and Terraform preview/download.
6. Validate backend, production build, JS checks and browser flows; no infrastructure deployment.

## Completed implementation
- Canonical architecture topology/controls in architecture.py; one evaluation function for analyze, simulate and AI.
- Workload-based cost breakdown, five metric scores, normalized weights, weighted contributions, rank and runner-up explanation.
- Risk factor breakdown with advisory decisions; architecture-specific control explanations.
- Existing selection table retained; selected ID now resolves against the current result rather than holding a stale object.
- Existing manual form, AI form and independent simulation retained. Added optional cost inputs, workload snapshot and dirty-input warning.
- React Flow service diagram with directional traffic/control edges and a readable mobile request path.
- Recharts comparisons replace fabricated time-series monitoring (which had no telemetry integration).
- Reusable score, cost, security and Terraform panels; real preview/copy/download with cancellation, errors and retry.
- Completed shared/common Terraform generation for CloudFront + ALB + ASG/ECS + RDS and CloudFront + API Gateway + Lambda + DynamoDB.
- Optional AI module loaded lazily by the backend; declared Google SDK dependency and configurable model names. Manual operation no longer depends on a key.
- Added reusable checked domain interfaces, regression tests, browser checks and delivery documentation.
- Source credentials, bundled Windows virtual environment and node_modules excluded from the deliverable; environment examples supplied.
