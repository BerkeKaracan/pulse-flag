/**
 * Per-project delivery smoke test (no secret values printed).
 *
 * Env:
 *   PULSE_URL              e.g. https://pulse-flag.onrender.com
 *   PULSE_DELIVERY_KEY     project delivery api_key (NOT platform admin key)
 *   FLAG_KEY               default ai.canvas_generator
 *   TENANT_ID              default nil UUID
 *
 * Expect after "Ensure paid tiers" on that project:
 *   basic → false, advanced → true, pro → true
 */
import process from "node:process";

const base = (process.env.PULSE_URL || "").replace(/\/$/, "");
const key = (process.env.PULSE_DELIVERY_KEY || "").trim();
const flagKey = (process.env.FLAG_KEY || "ai.canvas_generator").trim();
const tenantId =
  process.env.TENANT_ID || "00000000-0000-4000-8000-000000000001";

if (!base || !key) {
  console.error("PULSE_URL and PULSE_DELIVERY_KEY are required");
  process.exit(1);
}

console.log("pulse_host", new URL(base).host);
console.log("key_prefix", `${key.slice(0, 6)}…`);
console.log("flag", flagKey);

async function evaluate(tier) {
  const params = new URLSearchParams({
    key: flagKey,
    tenant_id: tenantId,
  });
  if (tier) params.set("tier", tier);
  const res = await fetch(`${base}/evaluate?${params}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${key}`,
      "User-Agent": "pulse-flag-smoke",
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 120) };
  }
  return { status: res.status, body };
}

const health = await fetch(`${base}/health`);
console.log("health", health.status, await health.text());

const expectations = [
  ["basic", false],
  ["advanced", true],
  ["pro", true],
];

let failed = 0;
for (const [tier, want] of expectations) {
  const { status, body } = await evaluate(tier);
  const got = body?.enabled;
  const ok = status === 200 && got === want;
  console.log(
    `tier=${tier} http=${status} enabled=${got} want=${want} ${ok ? "OK" : "FAIL"}`,
  );
  if (!ok) failed += 1;
}

process.exit(failed ? 1 : 0);
