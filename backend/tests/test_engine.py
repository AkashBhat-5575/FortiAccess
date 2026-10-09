import unittest
from app.models import WorkloadRequest
from app.main import run_architecture_analysis, app
from app.scoring import calculate_cost
from app.security import calculate_risk_score
from app.terraform import generate_terraform
from fastapi.testclient import TestClient
import hcl2


class EngineTests(unittest.TestCase):
    def workload(self, **kw):
        return WorkloadRequest(
            **{"users": 5000, "monthly_budget": 100, "traffic_level": "low", **kw}
        )

    def test_four_scenarios_and_reconciliation(self):
        winners = []
        for users, traffic, budget in [
            (5000, "low", 100),
            (20000, "medium", 300),
            (100000, "high", 700),
            (500000, "high", 2000),
        ]:
            result = run_architecture_analysis(
                self.workload(users=users, traffic_level=traffic, monthly_budget=budget)
            )
            winners.append(result["recommendation"]["id"])
            for a in result["architectures"]:
                self.assertAlmostEqual(sum(a["weights"].values()), 1)
                self.assertAlmostEqual(
                    a["overall_score"], round(sum(a["contributions"].values()), 2)
                )
                self.assertAlmostEqual(
                    a["estimated_monthly_cost"],
                    sum(a["cost_details"]["breakdown"].values()),
                    places=2,
                )
                self.assertEqual(a["security_score"], a["metric_scores"]["security"])
                self.assertTrue(
                    all(0 <= value <= 100 for value in a["metric_scores"].values())
                )
            print(
                f"Scenario {users}/{traffic}/${budget}: {winners[-1]} {result['recommendation']['overall_score']}"
            )
        self.assertGreater(len(set(winners)), 1)

    def test_workload_changes_cost_and_metrics(self):
        small = self.workload()
        large = self.workload(users=500000, traffic_level="high")
        for key in "ABC":
            self.assertGreater(calculate_cost(key, large), calculate_cost(key, small))
        a = run_architecture_analysis(small)
        b = run_architecture_analysis(large)
        self.assertNotEqual(a["architectures"], b["architectures"])
        expensive = self.workload(
            monthly_requests=10000000, compute_duration_ms=1000, storage_gb=100
        )
        self.assertGreater(calculate_cost("C", expensive), calculate_cost("C", small))

    def test_availability_and_security_priorities(self):
        low = run_architecture_analysis(
            self.workload(availability_required=99.9, data_sensitivity="low")
        )
        high = run_architecture_analysis(
            self.workload(availability_required=99.99, data_sensitivity="high")
        )
        for a in low["architectures"]:
            b = next(x for x in high["architectures"] if x["id"] == a["id"])
            self.assertGreater(a["availability_score"], b["availability_score"])
            self.assertGreater(a["security_score"], b["security_score"])

    def test_risk_boundaries_and_factors(self):
        for args, decision in [
            (("cloud_engineer", True, True, "medium"), "ALLOW"),
            (("cloud_engineer", True, True, "high"), "STEP-UP AUTHENTICATION"),
            (("viewer", False, False, "high"), "RESTRICT"),
        ]:
            risk = calculate_risk_score(*args)
            self.assertEqual(risk["decision"], decision)
            self.assertEqual(
                risk["risk_score"], sum(f["value"] for f in risk["factors"])
            )

    def test_topologies(self):
        for a in run_architecture_analysis(self.workload())["architectures"]:
            ids = {n["id"] for n in a["nodes"]}
            for edge in a["connections"]:
                self.assertIn(edge["source"], ids)
                self.assertIn(edge["target"], ids)
            self.assertEqual(
                [
                    (e["source"], e["target"])
                    for e in a["connections"]
                    if e["kind"] == "traffic"
                ],
                [
                    ("users", "edge"),
                    ("edge", "ingress"),
                    ("ingress", "compute"),
                    ("compute", "data"),
                ],
            )

    def test_terraform_syntax_and_resources(self):
        expected = {
            "A": ["aws_autoscaling_group", "aws_db_instance", "aws_lb"],
            "B": [
                "aws_ecs_service",
                "aws_ecs_task_definition",
                "aws_db_instance",
                "aws_lb",
            ],
            "C": ["aws_lambda_function", "aws_apigatewayv2_api", "aws_dynamodb_table"],
        }
        for key, resources in expected.items():
            code = generate_terraform(key)
            parsed = hcl2.loads(code)
            names = {
                name.strip('"') for resource in parsed["resource"] for name in resource
            }
            for name in resources + [
                "aws_cloudfront_distribution",
                "aws_iam_role",
                "aws_cloudwatch_log_group",
            ]:
                self.assertIn(name, names)
            self.assertNotIn("change-this-password", code)
            self.assertNotIn("TODO", code)
        with self.assertRaises(ValueError):
            generate_terraform("X")

    def test_api_and_validation(self):
        client = TestClient(app)
        self.assertEqual(client.get("/health").status_code, 200)
        for endpoint in ["/analyze", "/simulate"]:
            response = client.post(endpoint, json=self.workload().model_dump())
            self.assertEqual(response.status_code, 200)
            self.assertEqual(len(response.json()["architectures"]), 3)
        for payload in [
            {"users": 0},
            {"traffic_level": "wrong"},
            {"data_sensitivity": "wrong"},
            {"performance_priority": 8},
            {"storage_gb": -1},
        ]:
            self.assertEqual(
                client.post(
                    "/analyze", json={**self.workload().model_dump(), **payload}
                ).status_code,
                422,
            )
        self.assertEqual(client.get("/terraform/X").status_code, 404)
        self.assertEqual(client.get("/architectures").status_code, 200)

    def test_ai_contract_without_external_calls(self):
        import sys
        from types import ModuleType

        fake = ModuleType("app.ai")
        fake.analyze_workload_with_ai = lambda prompt: {
            **self.workload().model_dump(),
            "reasoning": "Test input",
        }
        from unittest.mock import patch

        with patch.dict(sys.modules, {"app.ai": fake}):
            response = TestClient(app).post("/ai/analyze", json={"prompt": "Small app"})
            self.assertTrue(response.json()["success"])
            self.assertEqual(
                response.json()["analysis"]["workload"],
                response.json()["validated_workload"],
            )


if __name__ == "__main__":
    unittest.main()
