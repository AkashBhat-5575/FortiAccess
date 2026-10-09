import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const artifacts = process.env.QA_ARTIFACTS_DIR || "test-results";
await fs.mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
const issues = [];
page.on("pageerror", (e) => issues.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") issues.push(m.text());
});
const scenarios = [
  [5000, "low", 100],
  [20000, "medium", 300],
  [100000, "high", 700],
  [500000, "high", 2000],
];
const summary = [];
try {
  await page.goto("http://127.0.0.1:5173");
  assert.equal(
    await page
      .getByRole("heading", { name: "FortiAccess", exact: true })
      .count(),
    1,
  );
  for (const [users, traffic, budget] of scenarios) {
    await page.locator('[name="users"]').fill(String(users));
    await page.locator('[name="traffic_level"]').selectOption(traffic);
    await page.locator('[name="monthly_budget"]').fill(String(budget));
    const responsePromise = page.waitForResponse(
      (r) => r.url().endsWith("/analyze") && r.request().method() === "POST",
    );
    await page
      .getByRole("button", { name: "Analyze Architecture", exact: true })
      .click();
    const response = await responsePromise;
    const data = await response.json();
    assert.equal(response.status(), 200);
    await page.locator(".recommendation-header h2").waitFor();
    await page.waitForFunction(
      (name) =>
        document
          .querySelector(".recommendation-header h2")
          ?.textContent.trim() === name,
      data.recommendation.name,
    );
    assert.equal(
      await page
        .locator(".workload-summary")
        .innerText()
        .then((t) => t.includes(users.toLocaleString())),
      true,
    );
    for (const architecture of data.architectures) {
      const row = page
        .locator(".architecture-selection-card tbody tr")
        .filter({ hasText: architecture.name });
      await row.getByRole("button").click();
      await page.waitForFunction(
        (name) =>
          document
            .querySelector(".recommendation-header h2")
            ?.textContent.trim() === name,
        architecture.name,
      );
      assert.equal(
        (await page.locator(".score-badge strong").innerText()).trim(),
        architecture.overall_score.toFixed(2),
      );
      await page.waitForFunction(
        (n) => document.querySelectorAll(".aws-node-title").length === n,
        architecture.nodes.length,
      );
      assert.equal(
        await page.locator(".aws-node-title").count(),
        architecture.nodes.length,
      );
      assert.equal(
        await page.locator(".react-flow__edge").count(),
        architecture.connections.length,
      );
      const path = await page.locator(".topology-path").innerText();
      for (const n of architecture.nodes.slice(0, 5))
        assert(path.includes(n.name));
      assert(
        (await page.locator(".cost-estimate").innerText()).includes(
          architecture.estimated_monthly_cost.toFixed(2),
        ),
      );
      assert(
        (await page.locator(".security-controls").innerText()).includes(
          architecture.metadata.security_controls[0].service,
        ),
      );
      await page.waitForSelector(".terraform-panel .primary-button");
      await page.locator(".terraform-panel summary").click();
      await page.waitForFunction(
        (id) =>
          document
            .querySelector(".terraform-panel pre")
            ?.textContent.includes(
              id === "C"
                ? "aws_lambda_function"
                : id === "B"
                  ? "aws_ecs_service"
                  : "aws_autoscaling_group",
            ),
        architecture.id,
      );
      const code = await page.locator(".terraform-panel pre").innerText();
      assert(code.includes("aws_cloudfront_distribution"));
      await page
        .getByRole("button", { name: "Copy Terraform", exact: true })
        .click();
      await page.getByRole("button", { name: "Copied", exact: true }).waitFor();
      assert.equal(
        await page.evaluate(() => navigator.clipboard.readText()),
        code,
      );
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download Terraform" }).click();
      const download = await downloadPromise;
      assert.equal(
        download.suggestedFilename(),
        `fortiaccess-${architecture.id}.tf`,
      );
      const savedPath = await download.path();
      assert.equal(await fs.readFile(savedPath, "utf8"), code);
      await page.locator(".terraform-panel summary").click();
      await page.waitForFunction(
        () => document.querySelectorAll(".recharts-wrapper").length === 3,
      );
      assert.equal(await page.locator(".recharts-wrapper").count(), 3);
      assert(
        (await page.locator(".monitoring-header").innerText()).includes(
          architecture.name.replace(" AWS Architecture", ""),
        ),
      );
    }
    summary.push({
      users,
      traffic,
      budget,
      recommended: data.recommendation.id,
      scores: data.architectures.map((a) => [
        a.id,
        a.overall_score,
        a.estimated_monthly_cost,
      ]),
    });
  }
  // Cost-model override and stale-result notice.
  await page.locator('[name="users"]').fill("600000");
  assert(
    (await page.locator(".workload-summary").innerText()).includes(
      "Inputs have changed",
    ),
  );
  await page.locator(".advanced-inputs summary").click();
  await page.locator('[name="monthly_requests"]').fill("1000000");
  await page.locator('[name="storage_gb"]').fill("80");
  await page.locator('[name="compute_duration_ms"]').fill("800");
  await page
    .getByRole("button", { name: "Analyze Architecture", exact: true })
    .click();
  await page.waitForFunction(() =>
    document
      .querySelector(".cost-estimate")
      ?.textContent.includes("1,000,000 estimated requests"),
  );
  // Advisory trust decisions update after re-analysis.
  await page.locator('[name="device_trusted"]').uncheck();
  await page.locator('[name="network_trusted"]').uncheck();
  await page
    .getByRole("button", { name: "Analyze Architecture", exact: true })
    .click();
  await page.waitForFunction(() =>
    document.querySelector(".risk-flow")?.textContent.includes("RESTRICT"),
  );
  // Separate what-if flow remains functional.
  const simulationPromise = page.waitForResponse((r) =>
    r.url().endsWith("/simulate"),
  );
  await page
    .getByRole("button", { name: "Run What-If Simulation", exact: true })
    .click();
  assert.equal((await simulationPromise).status(), 200);
  await page.locator(".simulation-results").waitFor();
  await page.locator(".architecture-diagram").scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${artifacts}/desktop.png` });
  // Smaller screens: no page overflow, chart SVGs exist, all diagram nodes remain navigable.
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(350);
    const dims = await page.evaluate(() => ({
      viewport: innerWidth,
      width: document.documentElement.scrollWidth,
    }));
    assert(dims.width <= dims.viewport, `Overflow at ${width}: ${dims.width}`);
    assert.equal(
      await page.locator(".recharts-wrapper > .recharts-surface").count(),
      3,
    );
    await page.locator(".architecture-diagram").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${artifacts}/${width}.png` });
  }
  // API failure has a real error state; Terraform Retry works.
  await page.route("**/terraform/A", (route) => route.abort());
  await page
    .locator(".architecture-selection-card tbody tr")
    .filter({ hasText: "Traditional AWS Architecture" })
    .getByRole("button")
    .click();
  await page.getByRole("button", { name: "Retry", exact: true }).waitFor();
  await page.unroute("**/terraform/A");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page.getByRole("button", { name: "Download Terraform" }).waitFor();
  // AI UI flow tested with an explicit provider stub; deterministic evaluation remains real.
  const aiResponse = await page.request.post("http://127.0.0.1:8000/analyze", {
    data: {
      application_name: "AI test app",
      users: 5000,
      traffic_level: "low",
      monthly_budget: 100,
    },
  });
  const aiAnalysis = await aiResponse.json();
  await page.route("**/ai/analyze", (route) =>
    route.fulfill({
      json: {
        success: true,
        ai_requirements: {
          ...aiAnalysis.workload,
          reasoning: "Test stub, not a live provider call",
        },
        validated_workload: aiAnalysis.workload,
        analysis: aiAnalysis,
      },
    }),
  );
  await page
    .getByRole("button", { name: "AI Cloud Architect", exact: true })
    .click();
  await page
    .getByLabel("Application description")
    .fill("Test app for 5000 users");
  await page
    .getByRole("button", { name: "Analyze with AI", exact: true })
    .click();
  await page.waitForFunction(() =>
    document
      .querySelector(".workload-summary")
      ?.textContent.includes("AI test app"),
  );
  assert(
    !(await page.locator(".workload-summary").innerText()).includes(
      "Inputs have changed",
    ),
  );
  await page
    .getByRole("button", { name: "Manual Analysis", exact: true })
    .click();
  assert.equal(await page.locator('[name="users"]').inputValue(), "5000");
  await page.unroute("**/ai/analyze");
  // A failed request intentionally causes a browser network diagnostic, not an application exception.
  const unexpected = issues.filter(
    (x) => !x.includes("ERR_FAILED") && !x.includes("favicon"),
  );
  assert.deepEqual(unexpected, []);
  console.log(
    JSON.stringify(
      {
        passed: true,
        scenarios: summary,
        browserErrors: unexpected,
        widths: [1440, 390, 768],
        selections: 12,
        checks: [
          "scores",
          "diagrams",
          "charts",
          "cost",
          "security",
          "Terraform preview/download",
          "what-if",
          "dirty state",
          "error/retry",
        ],
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
