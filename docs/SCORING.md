# Explainable planning model

These are transparent heuristic suitability scores, not benchmarks, AWS SLAs, price quotes or a security audit. Baselines are engineering planning assumptions adapted from the existing score model. Cloud architecture selection also depends on application compatibility, latency constraints and access patterns that this MVP does not collect.

## Priors / 100

| Architecture | Performance | Scalability | Availability | Security | Topology availability target |
|---|---:|---:|---:|---:|---:|
| Traditional | 90 | 75 | 85 | 82 | 99.9% |
| Containerized | 88 | 90 | 90 | 87 | 99.95% |
| Serverless | 80 | 96 | 92 | 85 | 99.95% |

The VM baseline rewards predictable provisioned execution; containers improve elasticity and isolate task IAM roles; serverless favors managed elastic execution but receives a cold-start/long-duration performance tradeoff. The security priors assume the controls listed in each architecture are configured. They do not claim that the app has measured their effectiveness.

Let M be monthly requests in millions, and P = min(1, M/100).
- Performance: prior + {VM: 2, containers: 5, serverless: -10} × P. Serverless also loses min(12, max(0, duration_ms - 200)/200).
- Scalability: prior + {VM: -8, containers: 3, serverless: 0} × P.
- Availability: prior - max(0, requested availability - topology target) × 100.
- Security: prior - {VM: 6, containers: 3, serverless: 1} × sensitivity multiplier {low: 0, medium: 0.5, high: 1}.
- Clamp each score to [0, 100].
- Cost suitability: clamp(budget / estimated cost × 50, 0, 100). At budget equals cost, score is 50; a cost at most half the budget scores 100. Budget does not inflate the cost estimate.

Weights before normalization:
- Cost = 3.
- Performance/scalability/security = corresponding user priority (1–5).
- Availability = 3 + max(0, availability_required - 99.9) × 20.

Divide all weights by their sum. Overall = Σ(score × normalized weight), rounded to two decimal places. The UI displays each score, weight and weighted contribution. Recommendation is highest overall score; ties prefer lower cost. Explanation compares weighted metric advantages against the runner-up. Every displayed metric and chart uses the returned evaluation, not independently hardcoded values.

## Cost model

Requests = explicit monthly_requests, otherwise users × {low: 30, medium: 150, high: 600}.
- Edge delivery = M × $0.80.
- Storage = GB × $0.12 for RDS-based candidates; GB × $0.25 for DynamoDB.
- VM/container database = $90; load balancer = $24.
- VM replicas = max(2, ceil(M/20)); each $32.
- Container replicas = max(2, ceil(M/30)); each $28.
- Serverless API/data/execution = M × (5 + duration_ms/1000 × memory_mb/1024 × 16.67).

These are deliberately approximate USD coefficients, not exact AWS prices. VM/container throughput assumptions are fixed capacity planning priors; duration/memory inputs refine serverless compute cost only. Excludes tax, support, free tier, backups, NAT, regional differences and data-transfer variation. Production deployment must be re-sized and priced with real telemetry and actual service pricing. Terraform defaults are a deployable MVP template, not automatically capacity-sized to the estimate.

## Zero Trust

Risk = declared role points {admin:10, cloud_engineer:15, viewer:20} + untrusted device 25 + untrusted network 20 + sensitivity {low:5, medium:15, high:25}, capped at 100.
ALLOW ≤30; STEP-UP AUTHENTICATION 31–60; RESTRICT >60. Factors and reasons are returned by the backend and displayed in the UI. Role risk values preserve the prior MVP policy; they are not an RBAC permission grant. No real identity verification, access enforcement or real-time context collector is implemented or claimed.

Architecture posture and request risk are different concepts: choosing a different topology changes the posture/control explanation, but does not change the same declared identity/device/network request context.
