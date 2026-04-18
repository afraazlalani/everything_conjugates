import fs from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const suiteArg =
  process.argv[2] ||
  process.env.PLANNER_BASELINE_EVAL_SUITE ||
  "lib/design-research/planner-vs-baseline-eval-suite.json";
const suitePath = path.isAbsolute(suiteArg) ? suiteArg : path.join(cwd, suiteArg);
const reportDir = path.join(cwd, "reports");
const outputPath = path.join(reportDir, "planner-vs-baseline-summary.md");

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function average(values) {
  const numeric = values.filter((value) => typeof value === "number");
  if (!numeric.length) return null;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function scoreCase(caseDef) {
  const review = caseDef.review ?? {};
  const criteria = [
    review.biologicalGrounding,
    review.conjugationSpecificity,
    review.usefulness,
    review.uncertaintyHandling,
    review.noveltyStrategyGeneration,
  ];
  const positive = average(criteria);
  const hallucinationRisk = typeof review.hallucinationRisk === "number" ? review.hallucinationRisk : null;

  return {
    id: caseDef.id,
    prompt: caseDef.prompt,
    category: caseDef.category,
    overallPreference: review.overallPreference ?? "unreviewed",
    averagePositiveScore: positive,
    hallucinationRisk,
    notes: review.notes ?? "",
    futureBenchmarkIdea: review.futureBenchmarkIdea ?? "",
    plannerPresent: (caseDef.plannerOutput?.text ?? "").trim().length > 0,
    baselinePresent: (caseDef.baselineOutput?.text ?? "").trim().length > 0,
  };
}

function groupByPreference(scoredCases) {
  const groups = {
    planner: [],
    baseline: [],
    tie: [],
    "both-weak": [],
    unreviewed: [],
  };

  for (const item of scoredCases) {
    const key = item.overallPreference in groups ? item.overallPreference : "unreviewed";
    groups[key].push(item);
  }

  return groups;
}

async function main() {
  const raw = await fs.readFile(suitePath, "utf8");
  const suite = JSON.parse(raw);
  const scoredCases = safeArray(suite.cases).map(scoreCase);
  const groups = groupByPreference(scoredCases);
  const reviewedCases = scoredCases.filter((item) => item.overallPreference !== "unreviewed");

  const overallPositive = average(reviewedCases.map((item) => item.averagePositiveScore).filter((value) => value !== null));
  const overallHallucination = average(reviewedCases.map((item) => item.hallucinationRisk).filter((value) => value !== null));

  const futureBoardIdeas = reviewedCases
    .map((item) => item.futureBenchmarkIdea)
    .filter((item) => item && item.trim().length > 0);

  const lines = [];
  lines.push("# Planner vs Baseline Summary");
  lines.push("");
  lines.push(`- total cases: ${scoredCases.length}`);
  lines.push(`- reviewed cases: ${reviewedCases.length}`);
  lines.push(`- planner preferred: ${groups.planner.length}`);
  lines.push(`- baseline preferred: ${groups.baseline.length}`);
  lines.push(`- ties: ${groups.tie.length}`);
  lines.push(`- both weak: ${groups["both-weak"].length}`);
  lines.push(`- unreviewed: ${groups.unreviewed.length}`);
  lines.push(`- average positive review score: ${overallPositive ? overallPositive.toFixed(2) : "n/a"}`);
  lines.push(`- average hallucination risk score: ${overallHallucination ? overallHallucination.toFixed(2) : "n/a"}`);
  lines.push("");

  const sections = [
    ["Where Planner Clearly Beats Baseline", groups.planner],
    ["Where Baseline Is Still Better", groups.baseline],
    ["Where Both Are Weak", groups["both-weak"]],
    ["Ties", groups.tie],
    ["Still Unreviewed", groups.unreviewed],
  ];

  for (const [title, items] of sections) {
    lines.push(`## ${title}`);
    if (!items.length) {
      lines.push("");
      lines.push("- none");
      lines.push("");
      continue;
    }

    lines.push("");
    for (const item of items) {
      lines.push(`- \`${item.id}\` — ${item.prompt}`);
      lines.push(`  category: ${item.category}`);
      lines.push(`  avg score: ${item.averagePositiveScore ? item.averagePositiveScore.toFixed(2) : "n/a"}`);
      lines.push(`  hallucination risk: ${item.hallucinationRisk ?? "n/a"}`);
      if (item.notes) {
        lines.push(`  note: ${item.notes}`);
      }
      if (item.futureBenchmarkIdea) {
        lines.push(`  future board idea: ${item.futureBenchmarkIdea}`);
      }
    }
    lines.push("");
  }

  lines.push("## Future Benchmark Boards To Consider");
  lines.push("");
  if (!futureBoardIdeas.length) {
    lines.push("- none captured yet");
  } else {
    for (const idea of futureBoardIdeas) {
      lines.push(`- ${idea}`);
    }
  }
  lines.push("");

  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(outputPath, `${lines.join("\n")}\n`, "utf8");

  console.log(`saved planner-vs-baseline summary to ${outputPath}`);
  console.log(`reviewed cases: ${reviewedCases.length}/${scoredCases.length}`);
  console.log(`planner preferred: ${groups.planner.length}`);
  console.log(`baseline preferred: ${groups.baseline.length}`);
  console.log(`both weak: ${groups["both-weak"].length}`);
}

await main();
