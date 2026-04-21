import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const cwd = process.cwd();
const reportDir = path.join(cwd, "reports");
const summaryPath = path.join(reportDir, "benchmark-health-summary.json");

const suites = [
  {
    key: "core",
    label: "core",
    report: path.join(reportDir, "benchmark-suite-report.json"),
  },
  {
    key: "transfer",
    label: "transfer",
    report: path.join(reportDir, "benchmark-transfer-suite-report.json"),
  },
  {
    key: "specificity-depth",
    label: "specificity-depth",
    report: path.join(reportDir, "benchmark-specificity-suite-report.json"),
  },
  {
    key: "conflict",
    label: "conflict",
    report: path.join(reportDir, "benchmark-conflict-suite-report.json"),
  },
  {
    key: "construct-guidance",
    label: "construct-guidance",
    report: path.join(reportDir, "benchmark-construct-suite-report.json"),
  },
  {
    key: "thin-evidence",
    label: "thin-evidence",
    report: path.join(reportDir, "benchmark-thin-evidence-suite-report.json"),
  },
  {
    key: "rare-disease-normalization",
    label: "rare-disease normalization",
    report: path.join(reportDir, "benchmark-rare-disease-suite-report.json"),
  },
  {
    key: "scientist-style",
    label: "scientist-style",
    report: path.join(reportDir, "benchmark-scientist-style-suite-report.json"),
  },
];

function pct(value) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function collectFailureKeys(report, suiteKey) {
  const keys = new Set();

  for (const result of safeArray(report.results)) {
    for (const failure of safeArray(result.failures)) {
      keys.add(`${suiteKey}:case:${result.id}:${failure.layer}:${failure.id}`);
    }
  }

  for (const comparison of safeArray(report.comparisonResults)) {
    if (!comparison.passed) {
      keys.add(`${suiteKey}:comparison:${comparison.id}:${comparison.layer}`);
    }
  }

  return keys;
}

function summarizeSuite(report, suite) {
  const summary = report.summary ?? {};
  const caseRate = summary.casePassRate ?? 0;
  const comparisonRate = summary.comparisonPassRate ?? 1;
  const failedCases = (summary.totalCases ?? 0) - (summary.casesPassed ?? 0);
  const failedComparisons = (summary.totalComparisons ?? 0) - (summary.comparisonsPassed ?? 0);

  return {
    key: suite.key,
    label: suite.label,
    caseRate,
    comparisonRate,
    failedCases,
    failedComparisons,
    capabilityPassRates: safeArray(summary.capabilityPassRates),
    groundingSummary: summary.groundingSummary ?? { evidence: 0, fallback: 0, none: 0 },
    mostCommonFailureCategories: safeArray(summary.mostCommonFailureCategories),
  };
}

function aggregateCapabilityBuckets(suiteSummaries) {
  const stats = new Map();

  for (const suite of suiteSummaries) {
    for (const bucket of suite.capabilityPassRates) {
      const current = stats.get(bucket.bucket) ?? { passed: 0, total: 0 };
      current.passed += bucket.passed ?? 0;
      current.total += bucket.total ?? 0;
      stats.set(bucket.bucket, current);
    }
  }

  return [...stats.entries()]
    .map(([bucket, value]) => ({
      bucket,
      passed: value.passed,
      total: value.total,
      rate: value.total ? value.passed / value.total : 0,
    }))
    .sort((a, b) => a.rate - b.rate || b.total - a.total || a.bucket.localeCompare(b.bucket));
}

function aggregateFailureLayers(suiteSummaries) {
  const stats = new Map();

  for (const suite of suiteSummaries) {
    for (const [layer, count] of suite.mostCommonFailureCategories) {
      stats.set(layer, (stats.get(layer) ?? 0) + count);
    }
  }

  return [...stats.entries()].sort((a, b) => b[1] - a[1]);
}

function determineStatus(suiteSummaries) {
  const worstCaseRate = Math.min(...suiteSummaries.map((suite) => suite.caseRate));
  const worstComparisonRate = Math.min(...suiteSummaries.map((suite) => suite.comparisonRate));
  const anyFailures = suiteSummaries.some((suite) => suite.failedCases > 0 || suite.failedComparisons > 0);

  if (!anyFailures && worstCaseRate === 1 && worstComparisonRate === 1) {
    return "green";
  }

  if (worstCaseRate >= 0.8 && worstComparisonRate >= 0.8) {
    return "yellow";
  }

  return "red";
}

function buildNextAction(status, topFailureLayer, scientistSuite, explorationBucket) {
  if (status === "green") {
    return "everything is green. next best move is expanding pressure tests rather than changing planner logic.";
  }

  if (topFailureLayer) {
    return `focus next on the ${topFailureLayer} layer, since that is the current top failure bucket.`;
  }

  if (scientistSuite && scientistSuite.caseRate < 1) {
    return "focus next on scientist-style robustness, since the clean boards held but messy prompts still slipped.";
  }

  if (explorationBucket && explorationBucket.rate < 1) {
    return "focus next on exploration usefulness, since strategy buckets are slipping before other planner layers.";
  }

  return "focus next on the newest failing suite and keep the green suites as guardrails.";
}

async function loadPreviousSnapshot() {
  const existing = {};

  for (const suite of suites) {
    if (await fileExists(suite.report)) {
      existing[suite.key] = await readJson(suite.report);
    }
  }

  return existing;
}

function diffFailures(previousReports, currentReports) {
  const previousKeys = new Set();
  const currentKeys = new Set();

  for (const suite of suites) {
    const previous = previousReports[suite.key];
    const current = currentReports[suite.key];

    if (previous) {
      for (const key of collectFailureKeys(previous, suite.key)) previousKeys.add(key);
    }
    if (current) {
      for (const key of collectFailureKeys(current, suite.key)) currentKeys.add(key);
    }
  }

  const newFailures = [...currentKeys].filter((key) => !previousKeys.has(key));
  const resolvedFailures = [...previousKeys].filter((key) => !currentKeys.has(key));

  return {
    newFailures,
    resolvedFailures,
  };
}

async function main() {
  const previousReports = await loadPreviousSnapshot();
  const activeBaseUrl = process.env.DESIGN_BENCHMARK_BASE_URL ?? "http://127.0.0.1:3000";

  const child = spawnSync("npm", ["run", "benchmark:design:all"], {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      DESIGN_BENCHMARK_BASE_URL: activeBaseUrl,
    },
  });

  if (child.status !== 0) {
    process.exit(child.status ?? 1);
  }

  const currentReports = {};
  for (const suite of suites) {
    currentReports[suite.key] = await readJson(suite.report);
  }

  const suiteSummaries = suites.map((suite) => summarizeSuite(currentReports[suite.key], suite));
  const capabilityBuckets = aggregateCapabilityBuckets(suiteSummaries);
  const failureLayers = aggregateFailureLayers(suiteSummaries);
  const diff = diffFailures(previousReports, currentReports);
  const status = determineStatus(suiteSummaries);
  const totalFallbackUsage = suiteSummaries.reduce((sum, suite) => sum + (suite.groundingSummary.fallback ?? 0), 0);
  const explorationBucket = capabilityBuckets.find((item) => item.bucket === "exploration-quality");
  const scientistSuite = suiteSummaries.find((suite) => suite.key === "scientist-style");
  const topFailureLayer = failureLayers[0]?.[0] ?? null;

  const summary = {
    generatedAt: new Date().toISOString(),
    status,
    activeBenchmarkServer: activeBaseUrl,
    suitePassRates: suiteSummaries.map((suite) => ({
      key: suite.key,
      label: suite.label,
      caseRate: suite.caseRate,
      comparisonRate: suite.comparisonRate,
      failedCases: suite.failedCases,
      failedComparisons: suite.failedComparisons,
    })),
    capabilityBuckets,
    newFailures: diff.newFailures,
    resolvedFailures: diff.resolvedFailures,
    topFailureLayer,
    fallbackProfileUsageAppeared: totalFallbackUsage > 0,
    fallbackProfileUsageCount: totalFallbackUsage,
    explorationQualityPassed: explorationBucket ? explorationBucket.passed === explorationBucket.total : null,
    scientistStylePassed: scientistSuite ? scientistSuite.caseRate === 1 && scientistSuite.comparisonRate === 1 : null,
    nextRecommendedAction: buildNextAction(status, topFailureLayer, scientistSuite, explorationBucket),
  };

  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log("");
  console.log(`overall status: ${status}`);
  console.log(`active benchmark server: ${activeBaseUrl}`);
  console.log("");
  console.log("pass rate by suite:");
  for (const suite of summary.suitePassRates) {
    const comparisonsPart =
      suite.comparisonRate !== 1 || suite.failedComparisons > 0
        ? `, comparisons ${pct(suite.comparisonRate)}`
        : "";
    console.log(`- ${suite.label}: cases ${pct(suite.caseRate)}${comparisonsPart}`);
  }

  console.log("");
  console.log("pass rate by capability bucket:");
  for (const bucket of capabilityBuckets) {
    console.log(`- ${bucket.bucket}: ${bucket.passed}/${bucket.total} (${pct(bucket.rate)})`);
  }

  console.log("");
  console.log("changed since previous run:");
  console.log(`- new failures: ${summary.newFailures.length}`);
  console.log(`- resolved failures: ${summary.resolvedFailures.length}`);
  if (summary.newFailures.length) {
    for (const item of summary.newFailures.slice(0, 8)) {
      console.log(`  - ${item}`);
    }
  }

  console.log("");
  console.log("health checks:");
  console.log(`- top architectural failure bucket: ${summary.topFailureLayer ?? "none"}`);
  console.log(`- fallback-profile usage appeared: ${summary.fallbackProfileUsageAppeared ? "yes" : "no"}`);
  console.log(`- exploration-quality checks passed: ${summary.explorationQualityPassed ? "yes" : "no"}`);
  console.log(`- scientist-style prompt robustness passed: ${summary.scientistStylePassed ? "yes" : "no"}`);

  console.log("");
  console.log(`next recommended action: ${summary.nextRecommendedAction}`);
  console.log("");
  console.log(`saved health summary to ${summaryPath}`);
}

await main();
