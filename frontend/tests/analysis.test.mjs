import test from "node:test";
import assert from "node:assert/strict";
import {
  selectedArchitecture,
  architectureOrder,
  workloadChanged,
} from "../src/services/analysis.js";
const a = { id: "A", overall_score: 70 },
  b = { id: "B", overall_score: 90 },
  c = { id: "C", overall_score: 80 };
const result = { architectures: [b, c, a], recommendation: b };
test("all architecture selections use result objects", () => {
  for (const candidate of [a, b, c])
    assert.equal(selectedArchitecture(result, candidate.id), candidate);
});
test("fallback selection and empty state", () => {
  assert.equal(selectedArchitecture(result, null), b);
  assert.equal(selectedArchitecture(result, "X"), b);
  assert.equal(selectedArchitecture(null, "A"), undefined);
});
test("new result cannot retain stale selected metrics", () => {
  const updated = {
    ...result,
    architectures: [{ ...a, overall_score: 98 }, b, c],
  };
  assert.equal(selectedArchitecture(updated, "A").overall_score, 98);
});
test("chart order does not mutate ranked results", () => {
  assert.deepEqual(
    architectureOrder(result.architectures).map((a) => a.id),
    ["A", "B", "C"],
  );
  assert.deepEqual(
    result.architectures.map((a) => a.id),
    ["B", "C", "A"],
  );
});

test("dirty detection ignores key order and detects edits", () => {
  assert.equal(
    workloadChanged(
      { users: 5000, traffic_level: "low" },
      { traffic_level: "low", users: 5000 },
    ),
    false,
  );
  assert.equal(workloadChanged({ users: 6000 }, { users: 5000 }), true);
});
