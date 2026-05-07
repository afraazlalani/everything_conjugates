import fs from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const reportDir = path.join(cwd, "reports");
const reportPath = path.join(reportDir, "planner-conversation-bots-report.json");
const suiteArgument =
  process.argv[2] ??
  process.env.PLANNER_BOT_SUITE ??
  "lib/design-research/planner-conversation-stress-suite.json";
const suitePath = path.isAbsolute(suiteArgument) ? suiteArgument : path.join(cwd, suiteArgument);
const baseUrl = process.env.PLANNER_BOT_BASE_URL ?? "http://127.0.0.1:3000";
const endpoint = `${baseUrl}/api/design-research`;
let maxFollowUps = Number.parseInt(process.env.PLANNER_BOT_MAX_FOLLOWUPS ?? "10", 10);
let passingScore = Number.parseFloat(process.env.PLANNER_BOT_PASSING_SCORE ?? "0.78");

const fallbackTracks = [
  {
    id: "cns-parameter-framework",
    category: "disease checklist / parameters",
    seed: "what parameters do i need to take care of while i am creating a conjugate for parkinson's disease (suggest everything pertaining to parkinsons)",
    state: {},
    expectedMode: "parameter-framework",
    expectedTerms: ["parameter", "target", "delivery", "trafficking", "payload", "linker", "pk", "safety", "experiment"],
    forbiddenTerms: ["winner", "rank 1"],
    followUps: [
      "make this into a table",
      "focus only on the protein carrier parameters",
      "what would you test first?",
      "what are the trafficking risks?",
      "which parameters matter for linker selection?",
      "what payload assumptions would change the design?",
      "what would make adc inappropriate here?",
      "make it simpler for a non-expert",
      "make it more technical for a scientist",
      "give me the shortest decision checklist",
    ],
  },
  {
    id: "her2-linker-microenvironment",
    category: "linker decision",
    seed: "what linker is best for targeting her2 for breast cancer as per the microenvironment",
    state: {},
    expectedMode: "recommended-starting-point",
    expectedTerms: ["linker", "her2", "cleavable", "lysosomal", "payload", "bystander", "trastuzumab"],
    forbiddenTerms: ["biology you wan", "forma"],
    followUps: [
      "why not a hydrazone linker?",
      "what should i test first?",
      "compare cleavable vs non-cleavable as a table",
      "what microenvironment assumptions matter most?",
      "how does bystander effect change the linker choice?",
      "what would make kadcyla-like logic better?",
      "give me a concise construct recommendation",
      "what toxicity risks should i watch?",
      "make it more technical",
      "give me the final decision tree",
    ],
  },
  {
    id: "protein-carrier-cns",
    category: "protein / carrier format",
    seed: "i have a target antigen and a payload for parkinson's disease, what protein will be the best for me to reach the target?",
    state: {},
    expectedMode: "recommended-starting-point",
    expectedTerms: ["protein", "carrier", "vhh", "scfv", "fab", "brain", "transport", "full igg"],
    forbiddenTerms: ["i have a target antigen and a payload for parkinson"],
    followUps: [
      "what protein will work best?",
      "which binder would you use?",
      "vhh or fab?",
      "full igg or scfv?",
      "what transport handle matters?",
      "what linker should connect the carrier to payload?",
      "what experiment distinguishes these formats?",
      "why not a full antibody first?",
      "make it a ranked table",
      "give me the final carrier selection rule",
    ],
  },
  {
    id: "oncology-disease-only",
    category: "under-specified oncology",
    seed: "conjugates for colorectal cancer",
    state: {},
    expectedMode: "best-current-strategy-direction",
    expectedTerms: ["colorectal", "target", "adc", "egfr", "her2", "trop2", "ceacam", "under"],
    forbiddenTerms: ["pdc is the winner", "final winner"],
    followUps: [
      "why can't you pick one yet?",
      "what target would make adc viable?",
      "compare egfr and her2 for colorectal cancer",
      "what payload class would you consider?",
      "what linker would you avoid?",
      "what would you test first?",
      "give me evidence links",
      "make it a table",
      "what would make pdc viable?",
      "give me the shortest recommendation",
    ],
  },
  {
    id: "autoimmune-noncytotoxic",
    category: "autoimmune biology",
    seed: "possible conjugates for systemic lupus erythematosus",
    state: {},
    expectedMode: "best-current-strategy-direction",
    expectedTerms: ["lupus", "immune", "non-cytotoxic", "target", "chronic", "safety"],
    forbiddenTerms: ["cytotoxic adc lead", "winner: adc"],
    followUps: [
      "why not adc?",
      "what target would make a conjugate viable?",
      "what payload should be avoided?",
      "give me a parameter checklist",
      "what would you test first?",
      "what safety issue matters most?",
      "make it simpler",
      "make it more technical",
      "compare pdc and smdc here",
      "give me a final go/no-go checklist",
    ],
  },
];

async function loadSuite() {
  try {
    const raw = await fs.readFile(suitePath, "utf8");
    const suite = JSON.parse(raw);
    if (Number.isFinite(suite.maxFollowUps)) maxFollowUps = suite.maxFollowUps;
    if (Number.isFinite(suite.passingScore)) passingScore = suite.passingScore;
    return {
      name: suite.name ?? path.basename(suitePath, path.extname(suitePath)),
      tracks: Array.isArray(suite.tracks) && suite.tracks.length ? suite.tracks : fallbackTracks,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`could not load suite at ${suitePath}; using embedded fallback suite. ${message}`);
    return {
      name: "embedded-fallback-suite",
      tracks: fallbackTracks,
    };
  }
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeFollowUp(value) {
  if (typeof value === "string") {
    return {
      prompt: value,
      responseMode: undefined,
      expectedTerms: [],
      forbiddenTerms: [],
      expectedMode: undefined,
      expectedDisease: undefined,
      expectedTarget: undefined,
      expectedDocumentTitles: [],
    };
  }

  return {
    prompt: value?.prompt ?? "",
    responseMode: value?.responseMode,
    expectedTerms: asArray(value?.expectedTerms),
    forbiddenTerms: asArray(value?.forbiddenTerms),
    expectedMode: value?.expectedMode,
    expectedDisease: value?.expectedDisease,
    expectedTarget: value?.expectedTarget,
    expectedDocumentTitles: asArray(value?.expectedDocumentTitles),
  };
}

function flattenResultText(result) {
  const presentation = result?.presentation ?? {};
  const followUp = result?.followUpAnswer ?? {};
  if (result?.followUpAnswer) {
    return [
      followUp.title,
      followUp.answer,
      ...asArray(followUp.bullets),
      ...(followUp.kind === "table"
        ? asArray(result?.strategyTable).flatMap((row) => [row.strategy, row.bestFormat, row.linkerOrDeliveryLogic, row.payloadOrActiveSpecies, row.whyItFits, row.riskOrFailureMode])
        : []),
      ...(followUp.kind === "evidence"
        ? asArray(result?.evidenceAnchors).flatMap((item) => [item.label, item.why])
        : []),
    ]
      .filter(Boolean)
      .join("\n");
  }

  const documentSections = asArray(result?.documentSections)
    .flatMap((section) => [section.title, section.body, ...asArray(section.bullets)]);
  const strategyRows = asArray(result?.strategyTable)
    .flatMap((row) => [row.strategy, row.bestFormat, row.linkerOrDeliveryLogic, row.payloadOrActiveSpecies, row.whyItFits, row.riskOrFailureMode]);
  const viabilityRows = asArray(result?.modalityViability)
    .flatMap((row) => [row.modality, row.status, row.reason, row.missingEvidence, row.upgradeEvidence]);

  return [
    presentation.title,
    presentation.status,
    presentation.rationale,
    presentation.bestClarifier,
    presentation.mainMissingEvidence,
    presentation.bestConjugateClass,
    presentation.recommendedFormat,
    presentation.recommendedLinker,
    presentation.recommendedPayload,
    presentation.recommendedChemistry,
    ...(presentation.parameterBuckets ?? []),
    followUp.title,
    followUp.answer,
    ...asArray(followUp.bullets),
    ...documentSections,
    ...strategyRows,
    ...viabilityRows,
    ...(result?.presentation || result?.followUpAnswer || documentSections.length
      ? []
      : [result?.summary, result?.topPick, result?.topPickWhy, result?.text]),
  ]
    .filter(Boolean)
    .join("\n");
}

function repeatedSentenceRate(text) {
  const sentences = normalize(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 60);
  if (sentences.length < 4) return 0;
  const seen = new Set();
  let repeats = 0;
  for (const sentence of sentences) {
    if (seen.has(sentence)) repeats += 1;
    seen.add(sentence);
  }
  return repeats / sentences.length;
}

function sentenceSet(text) {
  return new Set(
    normalize(text)
      .split(/(?<=[.!?])\s+|\n+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 60),
  );
}

function crossTurnRepeatRate(text, previousText) {
  const currentSentences = sentenceSet(text);
  const previousSentences = sentenceSet(previousText);
  if (currentSentences.size < 3 || previousSentences.size < 3) return 0;
  let repeated = 0;
  for (const sentence of currentSentences) {
    if (previousSentences.has(sentence)) repeated += 1;
  }
  return repeated / currentSentences.size;
}

function hasAny(text, terms) {
  const normalizedText = normalize(text);
  return terms.some((term) => normalizedText.includes(normalize(term)));
}

function termHitRate(text, terms) {
  if (!terms.length) return 1;
  const normalizedText = normalize(text);
  const hits = terms.filter((term) => normalizedText.includes(normalize(term))).length;
  return hits / terms.length;
}

function detectPromptIntent(prompt) {
  const text = normalize(prompt);
  if (/(table|tabulate)/.test(text)) return "table";
  if (/(why not|why can't|why cant)/.test(text)) return "challenge";
  if (/(test first|experiment|validate|assay)/.test(text)) return "experiment";
  if (/(simpler|non expert|shortest|concise)/.test(text)) return "simplify";
  if (/(technical|scientist)/.test(text)) return "technical";
  if (/(linker|payload|protein|binder|carrier|format|chemistry|dar|drug-to-antibody|moa|mechanism of action|pk\/pd|pkpd|adverse|side effect|dose-limiting|chelator|radionuclide|radioligand)/.test(text)) return "design-decision";
  if (/(checklist|parameters|consider|optimize)/.test(text)) return "parameter-framework";
  if (/(evidence|links|precedent)/.test(text)) return "evidence";
  return "general-follow-up";
}

function expectedTermsForTurn(track, prompt, turnIndex) {
  if (turnIndex === 0) return track.expectedTerms ?? [];
  const text = normalize(prompt);
  const promptTerms = [];

  if (/linker/.test(text)) promptTerms.push("linker", "release");
  if (/dar|drug-to-antibody/.test(text)) promptTerms.push("DAR", "stoichiometry");
  if (/moa|mechanism of action/.test(text)) promptTerms.push("MOA", "mechanism");
  if (/pk\/pd|pkpd|\bpk\b|\bpd\b/.test(text)) promptTerms.push("PK", "PD", "exposure");
  if (/adverse|side effect|dose-limiting|dlt/.test(text)) promptTerms.push("adverse", "toxicity", "safety");
  if (/chelator|radionuclide|radioligand/.test(text)) promptTerms.push("chelator", "radionuclide", "dosimetry");
  if (/payload/.test(text)) promptTerms.push("payload", "active species");
  if (/protein|carrier|binder|vhh|scfv|fab|igg|fc|f ab|f\(ab|minibody|nanobody/.test(text)) {
    promptTerms.push("protein", "carrier", "binder", "vhh", "fab");
  }
  if (/monospecific|monoclonal|bispecific|trispecific|multispecific/.test(text)) {
    promptTerms.push("monospecific", "bispecific", "multispecific");
  }
  if (/enzyme|catalytic|prodrug/.test(text)) promptTerms.push("enzyme", "catalytic");
  if (/masked|probody|conditionall|newer modality|innovative modality|degrader|molecular glue|immune engager/.test(text)) {
    promptTerms.push("masked", "modality", "logic");
  }
  if (/traffick|uptake|internalization|escape/.test(text)) promptTerms.push("trafficking", "uptake", "compartment");
  if (/test|experiment|validate|assay/.test(text)) promptTerms.push("experiment", "test", "validate");
  if (/target/.test(text)) promptTerms.push("target", "entry handle");
  if (/antigen|tarhet/.test(text)) promptTerms.push("antigen", "target", "expression");
  if (/table|compare/.test(text)) promptTerms.push("compare");
  if (/safety|toxicity|toxic/.test(text)) promptTerms.push("safety", "toxicity");
  if (/technical|scientist/.test(text)) promptTerms.push("mechanism", "delivery", "evidence");
  if (/simpler|shortest|concise|non expert/.test(text)) promptTerms.push("short", "simple");
  if (/checklist|parameters|optimize|consider/.test(text)) promptTerms.push("parameter", "checklist");

  return Array.from(new Set([...promptTerms, ...(track.expectedTerms ?? []).slice(0, 3)]));
}

function documentTitleSet(result) {
  return new Set(
    asArray(result?.documentSections)
      .map((section) => normalize(section.title))
      .filter(Boolean),
  );
}

function hasDocumentTitles(result, titles) {
  if (!titles.length) return true;
  const found = documentTitleSet(result);
  return titles.every((title) => found.has(normalize(title)));
}

function normalizedDisease(result) {
  return normalize(result?.trace?.normalization?.disease?.canonical ?? result?.conversationSlots?.disease ?? "");
}

function normalizedTarget(result) {
  return normalize(result?.trace?.normalization?.target?.canonical ?? result?.conversationSlots?.target ?? "");
}

function scoreTurn({ track, prompt, result, previousResult, turnIndex, turnSpec = {} }) {
  const text = flattenResultText(result);
  const previousText = previousResult ? flattenResultText(previousResult) : "";
  const normalizedText = normalize(text);
  const intent = detectPromptIntent(prompt);
  const failures = [];
  const checks = [];
  const expectedTerms = Array.from(new Set([...expectedTermsForTurn(track, prompt, turnIndex), ...asArray(turnSpec.expectedTerms)]));
  const expectedThreshold = turnIndex === 0 ? 0.45 : 0.3;
  const forbiddenTerms = Array.from(new Set([...(track.forbiddenTerms ?? []), ...asArray(turnSpec.forbiddenTerms)]));
  const addCheck = (name, passed, weight, detail) => {
    checks.push({ name, passed, weight, detail });
    if (!passed) failures.push({ name, detail });
  };

  const expectedMode = turnSpec.expectedMode ?? (turnIndex === 0 ? track.expectedMode : null);
  const mode = result?.followUpAnswer?.kind ?? result?.presentation?.mode ?? "unknown";
  addCheck(
    "direct response surface",
    Boolean(result?.presentation || result?.followUpAnswer || asArray(result?.documentSections).length),
    0.13,
    "needs a top card, follow-up answer, or document sections",
  );
  addCheck(
    "expected initial mode",
    !expectedMode || mode === expectedMode,
    0.12,
    `expected ${expectedMode ?? "contextual follow-up"}, got ${mode}`,
  );
  addCheck(
    "expected terms",
    termHitRate(text, expectedTerms) >= expectedThreshold,
    0.17,
    `hit ${Math.round(termHitRate(text, expectedTerms) * 100)}% of expected terms`,
  );
  addCheck(
    "forbidden leakage",
    !hasAny(text, forbiddenTerms),
    0.14,
    `forbidden terms: ${forbiddenTerms.join(", ")}`,
  );
  addCheck(
    "low repetition",
    repeatedSentenceRate(text) <= 0.12,
    0.12,
    `repeated sentence rate ${repeatedSentenceRate(text).toFixed(2)}`,
  );
  addCheck(
    "low cross-turn parroting",
    turnIndex === 0 || crossTurnRepeatRate(text, previousText) <= 0.22,
    0.12,
    `cross-turn repeated sentence rate ${crossTurnRepeatRate(text, previousText).toFixed(2)}`,
  );
  addCheck(
    "not clipped",
    !/\b(wan|forma|construc|strateg|payloads?|linke|biolog)\s*$/i.test(text.trim()),
    0.1,
    "response should not end with a clipped word",
  );
  addCheck(
    "follow-up continuity",
    turnIndex === 0 ||
      Boolean(result?.followUpAnswer) ||
      normalize(result?.trace?.normalization?.disease?.canonical) === normalize(previousResult?.trace?.normalization?.disease?.canonical) ||
      normalize(result?.conversationSlots?.disease) === normalize(previousResult?.conversationSlots?.disease),
    0.12,
    "follow-up should stay in prior disease/target context",
  );

  addCheck(
    "disease normalization",
    !((turnSpec.expectedDisease ?? track.expectedDisease)) ||
      normalizedDisease(result) === normalize(turnSpec.expectedDisease ?? track.expectedDisease),
    0.1,
    `expected disease ${(turnSpec.expectedDisease ?? track.expectedDisease) || "not specified"}, got ${normalizedDisease(result) || "unknown"}`,
  );

  addCheck(
    "target normalization",
    !((turnSpec.expectedTarget ?? track.expectedTarget)) ||
      normalizedTarget(result) === normalize(turnSpec.expectedTarget ?? track.expectedTarget),
    0.1,
    `expected target ${(turnSpec.expectedTarget ?? track.expectedTarget) || "not specified"}, got ${normalizedTarget(result) || "unknown"}`,
  );

  addCheck(
    "expected document shape",
    hasDocumentTitles(
      result,
      asArray(turnSpec.expectedDocumentTitles).length
        ? turnSpec.expectedDocumentTitles
        : turnIndex === 0
          ? asArray(track.expectedDocumentTitles)
          : [],
    ),
    0.1,
    `expected sections ${(asArray(turnSpec.expectedDocumentTitles).length ? turnSpec.expectedDocumentTitles : turnIndex === 0 ? asArray(track.expectedDocumentTitles) : []).join(", ")}`,
  );

  if (track.forbiddenGenericTerms?.length) {
    addCheck(
      "no generic-template drift",
      !hasAny(text, track.forbiddenGenericTerms),
      0.1,
      `generic leftovers: ${track.forbiddenGenericTerms.join(", ")}`,
    );
  }

  if (intent === "parameter-framework") {
    addCheck(
      "parameter intent match",
      result?.followUpAnswer?.kind === "parameter-framework" ||
        result?.presentation?.mode === "parameter-framework" ||
        asArray(result?.documentSections).some((section) => /parameter|checklist/i.test(section.title + section.body)),
      0.1,
      "parameter/checklist prompts should not become generic ranking reports",
    );
  } else if (intent === "table") {
    addCheck(
      "table intent match",
      Boolean(result?.followUpAnswer?.kind === "table" || asArray(result?.strategyTable).length || asArray(result?.modalityViability).length),
      0.1,
      "table asks should produce table-shaped data",
    );
  } else if (intent === "experiment") {
    addCheck(
      "experiment intent match",
      /experiment|assay|test|validate|measure/i.test(text),
      0.1,
      "experiment asks should answer with assays or validation steps",
    );
  } else if (intent === "challenge") {
    addCheck(
      "challenge intent match",
      /why|because|risk|not viable|fails|mismatch|toxicity|window/i.test(text),
      0.1,
      "challenge asks should answer directly with reasoned tradeoffs",
    );
  }

  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earned = checks.reduce((sum, check) => sum + (check.passed ? check.weight : 0), 0);
  const score = totalWeight ? earned / totalWeight : 0;
  const repairBrief = failures.length
    ? buildRepairBrief({ track, prompt, result, failures, intent, mode })
    : null;

  return {
    prompt,
    turnIndex,
    intent,
    mode,
    score,
    passed: score >= passingScore && failures.length <= 1,
    checks,
    failures,
    repairBrief,
    responsePreview: text.slice(0, 1200),
  };
}

function buildRepairBrief({ track, prompt, failures, intent, mode }) {
  const failedNames = failures.map((failure) => failure.name);
  const focus =
    failedNames.includes("parameter intent match")
      ? "Add or fix a parameter/checklist response route so this prompt does not fall into the generic ranking memo."
      : failedNames.includes("follow-up continuity")
        ? "Fix follow-up routing and conversation slots so the answer stays in the previous disease/target case."
        : failedNames.includes("low repetition")
          ? "Compress repeated sections and avoid rendering the same rationale in transcript, card, biology, and strategy sections."
          : failedNames.includes("low cross-turn parroting")
            ? "Improve follow-up answer synthesis so each turn directly answers the new user request instead of replaying the previous planner memo."
          : failedNames.includes("expected terms")
            ? "Strengthen question-specific answer generation so the requested design dimension appears in the first answer surface."
            : failedNames.includes("forbidden leakage")
              ? "Fix parser/normalizer/display sanitization so placeholder or forbidden phrases do not survive into the visible planner answer."
              : "Tighten the response assembly and renderer for this prompt family.";

  return {
    repairBotInstruction: focus,
    failingTrack: track.id,
    prompt,
    detectedIntent: intent,
    detectedMode: mode,
    failedChecks: failedNames,
    generalizationRule:
      "Fix the prompt family at parser, router, reasoning, or renderer level. Do not hardcode this single disease or exact wording.",
  };
}

async function callPlanner(prompt, state = {}, previousResult = undefined) {
  return callPlannerWithMode(prompt, state, previousResult, "deep");
}

async function callPlannerWithMode(prompt, state = {}, previousResult = undefined, responseMode = "deep") {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      state,
      previousResult,
      responseMode,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`planner request failed (${response.status}): ${text.slice(0, 240)}`);
  }

  return response.json();
}

async function ensureServerReachable() {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "planner bot health check", state: {} }),
    });
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      protected:
        response.status === 401 ||
        response.headers.get("x-vercel-id") ||
        response.headers.get("x-robots-tag") === "noindex",
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: error instanceof Error ? error.message : String(error),
      protected: false,
    };
  }
}

async function runTrack(track) {
  const turns = [];
  let previousResult;
  const seedMode = track.responseMode ?? "deep";

  const seedResult = await callPlannerWithMode(track.seed, track.state, undefined, seedMode);
  const seedEvaluation = scoreTurn({
    track,
    prompt: track.seed,
    result: seedResult,
    previousResult: null,
    turnIndex: 0,
    turnSpec: {
      responseMode: seedMode,
      expectedDisease: track.expectedDisease,
      expectedTarget: track.expectedTarget,
      expectedDocumentTitles: track.expectedDocumentTitles,
    },
  });
  turns.push(seedEvaluation);
  previousResult = seedResult;

  for (const rawFollowUp of track.followUps.slice(0, maxFollowUps)) {
    const followUp = normalizeFollowUp(rawFollowUp);
    const result = await callPlannerWithMode(
      followUp.prompt,
      track.state,
      previousResult,
      followUp.responseMode ?? track.responseMode ?? "deep",
    );
    const evaluation = scoreTurn({
      track,
      prompt: followUp.prompt,
      result,
      previousResult,
      turnIndex: turns.length,
      turnSpec: followUp,
    });
    turns.push(evaluation);
    previousResult = result;
  }

  const passedTurns = turns.filter((turn) => turn.passed).length;
  const repairQueue = turns
    .filter((turn) => !turn.passed && turn.repairBrief)
    .map((turn) => turn.repairBrief);

  return {
    id: track.id,
    category: track.category,
    seed: track.seed,
    passed: passedTurns === turns.length,
    passedTurns,
    totalTurns: turns.length,
    passRate: turns.length ? passedTurns / turns.length : 0,
    averageScore: turns.reduce((sum, turn) => sum + turn.score, 0) / Math.max(turns.length, 1),
    turns,
    repairQueue,
  };
}

async function main() {
  await fs.mkdir(reportDir, { recursive: true });
  const suite = await loadSuite();

  const endpointHealth = await ensureServerReachable();
  if (!endpointHealth.ok) {
    console.error(`could not reach planner at ${endpoint}`);
    if (endpointHealth.status) {
      console.error(`endpoint status: ${endpointHealth.status} ${endpointHealth.statusText}`);
    }
    if (endpointHealth.protected) {
      console.error("this looks like a protected deployment. use local testing, a Vercel bypass token, or disable deployment protection for bot access.");
    }
    console.error("start the website first, then rerun: npm run eval:planner:conversation");
    process.exit(1);
  }

  console.log(`planner evaluator bot running ${suite.tracks.length} tracks from ${suite.name} against ${endpoint}`);
  console.log(`each track will run 1 seed + ${maxFollowUps} follow-ups`);

  const results = [];
  for (const track of suite.tracks) {
    console.log(`track: ${track.id}`);
    const result = await runTrack(track);
    results.push(result);
    console.log(`  pass rate: ${result.passedTurns}/${result.totalTurns} avg ${result.averageScore.toFixed(2)}`);
    for (const turn of result.turns.filter((item) => !item.passed).slice(0, 3)) {
      console.log(`  repair needed turn ${turn.turnIndex}: ${turn.prompt}`);
      console.log(`    ${turn.repairBrief?.repairBotInstruction ?? "see report"}`);
    }
  }

  const totalTurns = results.reduce((sum, result) => sum + result.totalTurns, 0);
  const passedTurns = results.reduce((sum, result) => sum + result.passedTurns, 0);
  const repairQueue = results.flatMap((result) => result.repairQueue);
  const summary = {
    endpoint,
    baseUrl,
    targetKind: /^https?:\/\/(localhost|127\.0\.0\.1)/.test(baseUrl) ? "local" : "remote",
    endpointHealth,
    suite: suite.name,
    suitePath,
    generatedAt: new Date().toISOString(),
    passingScore,
    tracks: results.length,
    totalTurns,
    passedTurns,
    passRate: totalTurns ? passedTurns / totalTurns : 0,
    averageScore: results.reduce((sum, result) => sum + result.averageScore, 0) / Math.max(results.length, 1),
    repairQueueCount: repairQueue.length,
    topRepairThemes: summarizeRepairThemes(repairQueue),
  };

  const report = { summary, results, repairQueue };
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`saved report to ${reportPath}`);
  console.log(`overall pass rate: ${passedTurns}/${totalTurns} (${Math.round(summary.passRate * 100)}%)`);

  if (repairQueue.length) {
    process.exitCode = 1;
  }
}

function summarizeRepairThemes(repairQueue) {
  const counts = new Map();
  for (const item of repairQueue) {
    const key = item.repairBotInstruction;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([theme, count]) => ({ theme, count }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
