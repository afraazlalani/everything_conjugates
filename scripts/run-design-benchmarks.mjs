import fs from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();
const suiteArgument = process.argv[2] || process.env.DESIGN_BENCHMARK_SUITE || "lib/design-research/benchmark-suite.json";
const suitePath = path.isAbsolute(suiteArgument) ? suiteArgument : path.join(cwd, suiteArgument);
const reportDir = path.join(cwd, "reports");
const suiteBaseName = path.basename(suitePath, path.extname(suitePath));
const reportPath = path.join(reportDir, `${suiteBaseName}-report.json`);
const baseUrl = process.env.DESIGN_BENCHMARK_BASE_URL ?? "http://127.0.0.1:3000";
const endpoint = `${baseUrl}/api/design-research`;

function lower(value) {
  return typeof value === "string" ? value.toLowerCase() : value;
}

function normalizeArray(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => (typeof value === "string" ? value.toLowerCase() : value));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stringContains(text, needle) {
  const source = String(text ?? "").toLowerCase();
  const query = String(needle ?? "").toLowerCase();
  if (!query) return false;

  if (/^[a-z0-9+/.-]+$/i.test(query) && !query.includes(" ")) {
    const boundaryPattern = new RegExp(`(^|[^a-z0-9-])${escapeRegExp(query)}([^a-z0-9]|$)`, "i");
    return boundaryPattern.test(source);
  }

  return source.includes(query);
}

function hasMeaningfulText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function confidenceToRank(value) {
  switch (String(value ?? "").toLowerCase()) {
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    case "insufficient":
    default:
      return 0;
  }
}

function extractMatchedThemes(trace) {
  const matchedFromDiagnostics = (trace?.retrieval?.themeDiagnostics ?? [])
    .filter((item) => item.matched)
    .map((item) => item.theme.toLowerCase());

  if (matchedFromDiagnostics.length) {
    return [...new Set(matchedFromDiagnostics)];
  }

  return (trace?.retrieval?.themeCounts ?? [])
    .filter((item) => item.total > 0)
    .map((item) => item.theme.toLowerCase());
}

function extractCorpusMatchedThemes(trace) {
  return (trace?.retrieval?.themeDiagnostics ?? [])
    .filter((item) => item.corpusMatches > 0)
    .map((item) => item.theme.toLowerCase());
}

function bucketMentionsEntryHandle(bucket) {
  const text = [
    bucket?.entryHandleLogic,
    bucket?.whyPlausible,
    ...(bucket?.requiredAssumptions ?? []),
    bucket?.mainFailureMode,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return /(target|receptor|entry handle|uptake|transport|delivery handle|brain-entry|internalization|localize|cell subset|ligand handle)/i.test(text);
}

function bucketHasDiseaseSpecificConstraintLanguage(bucket, trace) {
  const bucketText = [
    bucket?.whyPlausible,
    bucket?.entryHandleLogic,
    ...(bucket?.requiredAssumptions ?? []),
    bucket?.mainFailureMode,
    ...(bucket?.diseaseSpecificConstraints ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const abstraction = trace?.abstraction ?? {};
  const expected = [];

  if (abstraction.deliveryAccessibility === "barrier-limited") {
    expected.push("bbb", "barrier", "brain", "transport", "uptake");
  }
  if (abstraction.pathologyType === "neurodegeneration") {
    expected.push("neuro", "cns", "chronic", "non-cytotoxic");
  }
  if (abstraction.pathologyType === "autoimmune/inflammatory") {
    expected.push("immune", "inflammatory", "chronic", "non-cytotoxic", "cell subset");
  }
  if (abstraction.pathologyType === "oncology") {
    expected.push("tumor", "oncology", "cytotoxic", "internalization", "target window");
  }
  if (abstraction.compartmentNeed === "nuclear") {
    expected.push("nuclear", "splice", "transcript");
  }
  if (abstraction.compartmentNeed === "cytosolic") {
    expected.push("cytosolic", "intracellular");
  }
  if (abstraction.compartmentNeed === "extracellular") {
    expected.push("extracellular", "soluble", "neutralization", "localization");
  }
  if (abstraction.cytotoxicFit === "discouraged") {
    expected.push("non-cytotoxic", "chronic");
  }

  if (!expected.length) {
    return /(constraint|delivery|target|compartment|trafficking|transport|chronic|immune|tumor|nuclear|extracellular|intracellular)/i.test(bucketText);
  }

  return expected.some((term) => stringContains(bucketText, term));
}

function analyzeExplorationBuckets(exploration, trace) {
  const buckets = exploration?.strategyBuckets ?? [];

  if (!buckets.length) {
    return {
      bucketHasModalityMapping: false,
      bucketHasEntryHandleLogic: false,
      bucketHasRequiredAssumptions: false,
      bucketHasFailureMode: false,
      bucketHasDiseaseSpecificConstraintLanguage: false,
      explorationHasDistinctMechanismLanes: false,
      explorationHasWeakFitCytotoxicLane: false,
      explorationDepthScore: 0,
      weakExplorationReason: "no strategy buckets",
    };
  }

  const laneCategories = buckets.map((bucket) => {
    const text = [
      bucket?.label,
      bucket?.whyPlausible,
      bucket?.entryHandleLogic,
      ...(bucket?.requiredAssumptions ?? []),
      bucket?.mainFailureMode,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const categories = [];

    if (/(oligo|gene|rna|transcript|splice|exon)/i.test(text)) categories.push("gene-rna");
    if (/(extracellular|plaque|aggregate|soluble|biologic|antibody|interception|neutralization)/i.test(text)) categories.push("extracellular-biologic");
    if (/(pathway|small-format|compact)/i.test(text)) categories.push("pathway-small-format");
    if (/(mitochond|proteostasis|autophagy|lysosom|organelle)/i.test(text)) categories.push("organelle-support");
    if (/(immune|inflamm|cell subset)/i.test(text)) categories.push("immune");
    if (/(cytotoxic|cell-killing|ablation)/i.test(text)) categories.push("cytotoxic");
    if (/(radioligand|isotope|dosimetry)/i.test(text)) categories.push("radiobiology");
    if (/(enzyme|prodrug|activation)/i.test(text)) categories.push("enzyme-prodrug");
    if (/(bbb|brain-entry|shuttle|transport|receptor-mediated)/i.test(text)) categories.push("transport");

    return Array.from(new Set(categories));
  });

  const distinctLaneCategories = Array.from(new Set(laneCategories.flat()));
  const needsWeakFitCytotoxicLane =
    trace?.normalization?.recommendationScope === "disease-level" &&
    trace?.abstraction?.cytotoxicFit === "discouraged" &&
    trace?.abstraction?.pathologyType !== "oncology";
  const hasWeakFitCytotoxicLane = needsWeakFitCytotoxicLane
    ? buckets.some((bucket) =>
        /(weak-fit|weak fit|wrong fit|avoid|not.*cytotoxic|classical cytotoxic|cell-killing)/i.test(
          [
            bucket?.label,
            bucket?.whyPlausible,
            bucket?.mainFailureMode,
          ]
            .filter(Boolean)
            .join(" "),
        ),
      )
    : true;

  const bucketAnalyses = buckets.map((bucket) => {
    const missing = [];
    const hasModalityMapping = Array.isArray(bucket?.suggestedModalities) && bucket.suggestedModalities.length > 0;
    const hasEntryHandleLogic = bucketMentionsEntryHandle(bucket);
    const hasRequiredAssumptions = Array.isArray(bucket?.requiredAssumptions) && bucket.requiredAssumptions.length > 0;
    const hasFailureMode = hasMeaningfulText(bucket?.mainFailureMode);
    const hasDiseaseConstraint = bucketHasDiseaseSpecificConstraintLanguage(bucket, trace);

    if (!hasModalityMapping) missing.push("missing modality mapping");
    if (!hasEntryHandleLogic) missing.push("missing entry-handle logic");
    if (!hasRequiredAssumptions) missing.push("missing assumptions");
    if (!hasFailureMode) missing.push("missing failure mode");
    if (!hasDiseaseConstraint) missing.push("too generic / not disease-specific");

    const score = [
      hasModalityMapping,
      hasEntryHandleLogic,
      hasRequiredAssumptions,
      hasFailureMode,
      hasDiseaseConstraint,
    ].filter(Boolean).length;

    return {
      score,
      missing,
      hasModalityMapping,
      hasEntryHandleLogic,
      hasRequiredAssumptions,
      hasFailureMode,
      hasDiseaseConstraint,
    };
  });

  const weakest = bucketAnalyses.reduce((min, item) => (item.score < min.score ? item : min), bucketAnalyses[0]);

  return {
    bucketHasModalityMapping: bucketAnalyses.every((item) => item.hasModalityMapping),
    bucketHasEntryHandleLogic: bucketAnalyses.every((item) => item.hasEntryHandleLogic),
    bucketHasRequiredAssumptions: bucketAnalyses.every((item) => item.hasRequiredAssumptions),
    bucketHasFailureMode: bucketAnalyses.every((item) => item.hasFailureMode),
    bucketHasDiseaseSpecificConstraintLanguage: bucketAnalyses.every((item) => item.hasDiseaseConstraint),
    explorationHasDistinctMechanismLanes:
      buckets.length < 2 ? true : distinctLaneCategories.length >= 2,
    explorationHasWeakFitCytotoxicLane: hasWeakFitCytotoxicLane,
    explorationDepthScore: weakest.score,
    weakExplorationReason: [
      weakest.missing.join("; "),
      buckets.length >= 2 && distinctLaneCategories.length < 2 ? "strategy lanes are not differentiated enough" : "",
      !hasWeakFitCytotoxicLane ? "missing weak-fit cytotoxic comparator" : "",
    ]
      .filter(Boolean)
      .join("; "),
  };
}

function buildMetrics(result) {
  const trace = result?.trace ?? {};
  const exploration = result?.exploration ?? trace?.exploration ?? null;
  const diseaseBiologyDebug = trace?.retrieval?.diseaseBiologyDebug ?? [];
  const sourceBuckets = trace?.retrieval?.sourceBuckets ?? [];
  const ranking = result?.ranking ?? [];
  const sources = result?.sources ?? [];
  const biologyText = (result?.biology ?? [])
    .map((item) => `${item?.title ?? ""} ${item?.body ?? ""}`.trim())
    .join("\n")
    .trim();
  const responseText = [
    result?.summary,
    result?.text,
    result?.topPick,
    result?.topPickWhy,
    result?.biggestRisk,
    result?.firstMove,
    biologyText,
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();

  const diseaseBiologyHitCount = diseaseBiologyDebug.reduce((sum, entry) => {
    const fromSearches = (entry.searches ?? []).reduce((inner, search) => inner + (search.postFilterHitCount ?? 0), 0);
    return sum + Math.max(fromSearches, entry.hitCount ?? 0);
  }, 0);

  const winnerLikeOutputWhileAbstaining =
    Boolean(trace?.confidence?.abstain) &&
    (
      ranking.length > 0 ||
      hasMeaningfulText(result?.firstMove) ||
      Array.isArray(result?.nextSteps) && result.nextSteps.length > 0 ||
      (hasMeaningfulText(result?.topPick) && lower(result?.topPick) !== "under-specified")
    );

  const winnerConfidenceLevel =
    result?.confidence?.winnerLevel ?? trace?.confidence?.winnerLevel ?? result?.confidence?.level ?? trace?.confidence?.level ?? "insufficient";
  const explorationConfidenceLevel =
    result?.confidence?.explorationLevel ?? trace?.confidence?.explorationLevel ?? result?.confidence?.level ?? trace?.confidence?.level ?? "insufficient";
  const biggestRiskPresent = hasMeaningfulText(result?.biggestRisk);
  const firstMovePresent = hasMeaningfulText(result?.firstMove);
  const nextStepCount = Array.isArray(result?.nextSteps) ? result.nextSteps.length : 0;
  const constructDetailTerms = [
    "format",
    "linker",
    "payload",
    "chelator",
    "attachment",
    "release",
    "bystander",
    "internalization",
    "trafficking",
    "transport route",
    "entry handle",
  ].filter((term) => stringContains(responseText, term));
  const constructSectionsPresent =
    /(?:^|\n)format:\s|(?:^|\n)linker:\s|(?:^|\n)payload:\s|construct tradeoff|construct constraint/i.test(
      result?.text ?? ""
    );
  const constructGuidanceSignalCount = [
    !Boolean(result?.confidence?.abstain ?? trace?.confidence?.abstain),
    ranking.length > 0,
    biggestRiskPresent,
    firstMovePresent,
    nextStepCount > 0,
    constructSectionsPresent,
  ].filter(Boolean).length;
  const actionableConstructGuidancePresent =
    !Boolean(result?.confidence?.abstain ?? trace?.confidence?.abstain) &&
    firstMovePresent &&
    biggestRiskPresent &&
    nextStepCount > 0;
  const winnerLikeOutputWithLowWinnerConfidence =
    ["low", "insufficient"].includes(String(winnerConfidenceLevel)) &&
    (
      ranking.length > 0 ||
      (hasMeaningfulText(result?.topPick) && lower(result?.topPick) !== "under-specified") ||
      firstMovePresent ||
      nextStepCount > 0
    );
  const groundedDiseaseOutputNonBlank =
    Boolean(
      trace?.grounding?.groundingObjectPresent &&
      trace?.normalization?.recommendationScope === "disease-level" &&
      (
        hasMeaningfulText(exploration?.diseaseFrame) ||
        (Array.isArray(exploration?.strategyBuckets) && exploration.strategyBuckets.length > 0) ||
        hasMeaningfulText(result?.topPickWhy) ||
        hasMeaningfulText(result?.summary)
      )
    );
  const abstractionSpecificityCount = [
    trace?.abstraction?.pathologyType && trace.abstraction.pathologyType !== "unknown",
    trace?.abstraction?.therapeuticIntent && trace.abstraction.therapeuticIntent !== "unknown",
    trace?.abstraction?.targetClass && !["unknown", "none yet"].includes(trace.abstraction.targetClass),
    trace?.abstraction?.deliveryAccessibility && trace.abstraction.deliveryAccessibility !== "unknown",
    trace?.abstraction?.treatmentContext && trace.abstraction.treatmentContext !== "unknown",
    trace?.abstraction?.cytotoxicFit && trace.abstraction.cytotoxicFit !== "unknown",
    trace?.abstraction?.internalizationRequirement && trace.abstraction.internalizationRequirement !== "unknown",
    trace?.abstraction?.compartmentNeed && !["unknown", "mixed"].includes(trace.abstraction.compartmentNeed),
  ].filter(Boolean).length;
  const specificCompartmentResolved = Boolean(
    trace?.abstraction?.compartmentNeed &&
      !["unknown", "mixed"].includes(trace.abstraction.compartmentNeed),
  );
  const conflictLanguagePresent =
    /(mismatch|contradiction|incoher|not compatible|does not fit|conflict|wrong biology|wrong way|penaliz)/i.test(responseText);
  const anyClarifierPresent =
    hasMeaningfulText(exploration?.mostInformativeClarifier) ||
    /\?/.test(result?.text ?? "") ||
    /what would make this rankable|what target or|what therapeutic mechanism|what brain-entry route|what single target/i.test(responseText);
  const explorationQuality = analyzeExplorationBuckets(exploration, trace);
  const diseaseOnlyTopCardText = [result?.topPickWhy, result?.summary]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
  const firstExplorationAnchor = [
    lower(exploration?.diseaseFrame ?? ""),
    ...((exploration?.strategyBuckets ?? []).map((bucket) => lower(bucket?.label ?? ""))),
    "most plausible strategy lanes",
    "disease-level exploration summary",
  ]
    .filter(Boolean)
    .map((value) => diseaseOnlyTopCardText.indexOf(value))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0] ?? -1;
  const firstUncertaintyAnchor = [
    "insufficient",
    "under-specified",
    "not enough",
    "still not enough to name",
    "why the planner is abstaining",
  ]
    .map((value) => diseaseOnlyTopCardText.indexOf(value))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0] ?? -1;
  const diseaseOnlyExplorationLeadsOutput =
    trace?.normalization?.recommendationScope === "disease-level" &&
    Boolean(result?.confidence?.abstain ?? trace?.confidence?.abstain) &&
    Boolean(exploration?.strategyBuckets?.length) &&
    firstExplorationAnchor >= 0 &&
    (firstUncertaintyAnchor < 0 || firstExplorationAnchor <= firstUncertaintyAnchor);
  const sourceTypeKeys = normalizeArray(sources.map((item) => item?.type ?? ""));
  const hasApprovedPrecedentSource = sourceTypeKeys.includes("approved product");
  const hasClinicalCandidateSource = sourceTypeKeys.includes("clinical candidate");
  const hasModalityAnalogSource = sourceTypeKeys.includes("modality analog");
  const evidenceLimitLanguagePresent =
    /(thin evidence|limited evidence|evidence is still thin|retrieved support is still limited|underdefined|still does not resolve one dominant|still too underdefined|weak evidence|evidence surface is still thin)/i.test(
      responseText,
    );
  const weakEvidenceDistinguishedFromNoEvidence =
    diseaseBiologyDebug.length > 0 &&
    (
      diseaseBiologyHitCount > 0
        ? !Boolean(trace?.grounding?.genericAbstentionTemplateUsed)
        : evidenceLimitLanguagePresent || Boolean(trace?.grounding?.genericAbstentionTemplateUsed)
    );

  return {
    namedDiseaseRecognized: Boolean(trace?.grounding?.namedDiseaseRecognized),
    diseaseSpecificity: trace?.normalization?.diseaseSpecificity ?? "unknown",
    recommendationScope: trace?.normalization?.recommendationScope ?? "disease-level",
    targetMentionPresent: hasMeaningfulText(trace?.parser?.targetMention),
    targetCanonicalPresent: hasMeaningfulText(trace?.normalization?.target?.canonical),
    diseaseCanonicalPresent: hasMeaningfulText(trace?.normalization?.disease?.canonical),
    diseaseBiologyQueryCount: diseaseBiologyDebug.length,
    diseaseBiologyAnyHits: diseaseBiologyHitCount > 0,
    diseaseBiologyHitCount,
    groundingSource: trace?.grounding?.groundingSource ?? "none",
    inferredMechanismFamily: trace?.grounding?.inferredMechanismFamily ?? "unknown",
    genericAbstentionTemplateUsed: Boolean(trace?.grounding?.genericAbstentionTemplateUsed),
    diseaseSpecificAbstentionTemplateUsed: Boolean(trace?.grounding?.diseaseSpecificAbstentionTemplateUsed),
    abstain: Boolean(result?.confidence?.abstain ?? trace?.confidence?.abstain),
    blueprintAllowed: Boolean(result?.confidence?.blueprintAllowed ?? trace?.confidence?.blueprintAllowed),
    confidenceLevel: result?.confidence?.level ?? trace?.confidence?.level ?? "insufficient",
    explorationConfidenceLevel,
    winnerConfidenceLevel,
    winnerConfidenceRank: confidenceToRank(winnerConfidenceLevel),
    explorationConfidenceRank: confidenceToRank(explorationConfidenceLevel),
    rankingCount: ranking.length,
    biggestRiskPresent,
    firstMovePresent,
    nextStepCount,
    constructDetailTermCount: constructDetailTerms.length,
    constructSectionsPresent,
    actionableConstructGuidancePresent,
    constructGuidanceSignalCount,
    topRankingName: lower(ranking?.[0]?.name ?? ""),
    topRankingNames: normalizeArray(ranking.map((item) => item?.name ?? "")),
    abstractionSource: trace?.abstraction?.source ?? "fallback",
    abstractionPathologyType: trace?.abstraction?.pathologyType ?? "unknown",
    abstractionTherapeuticIntent: trace?.abstraction?.therapeuticIntent ?? "unknown",
    abstractionTargetClass: trace?.abstraction?.targetClass ?? "unknown",
    abstractionDeliveryAccessibility: trace?.abstraction?.deliveryAccessibility ?? "unknown",
    abstractionTreatmentContext: trace?.abstraction?.treatmentContext ?? "unknown",
    abstractionCytotoxicFit: trace?.abstraction?.cytotoxicFit ?? "unknown",
    abstractionInternalizationRequirement: trace?.abstraction?.internalizationRequirement ?? "unknown",
    abstractionCompartmentNeed: trace?.abstraction?.compartmentNeed ?? "unknown",
    matchedThemes: extractMatchedThemes(trace),
    corpusMatchedThemes: extractCorpusMatchedThemes(trace),
    sourceBucketKeys: normalizeArray(sourceBuckets.map((bucket) => bucket?.key ?? "")),
    sourceTypeKeys,
    hasDiseaseBiologyBucket: sourceBuckets.some((bucket) => lower(bucket?.key) === "disease biology"),
    hasApprovedPrecedentSource,
    hasClinicalCandidateSource,
    hasModalityAnalogSource,
    evidenceLimitLanguagePresent,
    weakEvidenceDistinguishedFromNoEvidence,
    explorationPresent: Boolean(exploration),
    explorationDiseaseFramePresent: hasMeaningfulText(exploration?.diseaseFrame),
    explorationBucketCount: Array.isArray(exploration?.strategyBuckets) ? exploration.strategyBuckets.length : 0,
    explorationDominantConstraintCount: Array.isArray(exploration?.dominantConstraints) ? exploration.dominantConstraints.length : 0,
    explorationClarifierPresent: hasMeaningfulText(exploration?.mostInformativeClarifier),
    bucketHasModalityMapping: explorationQuality.bucketHasModalityMapping,
    bucketHasEntryHandleLogic: explorationQuality.bucketHasEntryHandleLogic,
    bucketHasRequiredAssumptions: explorationQuality.bucketHasRequiredAssumptions,
    bucketHasFailureMode: explorationQuality.bucketHasFailureMode,
    bucketHasDiseaseSpecificConstraintLanguage: explorationQuality.bucketHasDiseaseSpecificConstraintLanguage,
    explorationHasDistinctMechanismLanes: explorationQuality.explorationHasDistinctMechanismLanes,
    explorationHasWeakFitCytotoxicLane: explorationQuality.explorationHasWeakFitCytotoxicLane,
    explorationDepthScore: explorationQuality.explorationDepthScore,
    weakExplorationReason: explorationQuality.weakExplorationReason,
    diseaseOnlyExplorationLeadsOutput,
    groundedDiseaseOutputNonBlank,
    abstractionSpecificityCount,
    specificCompartmentResolved,
    conflictLanguagePresent,
    anyClarifierPresent,
    responseText,
    biologyText: biologyText.toLowerCase(),
    unknownBiologyInsufficient: Boolean(trace?.unknownBiology?.insufficient),
    winnerLikeOutputWhileAbstaining,
    winnerLikeOutputWithLowWinnerConfidence,
  };
}

function evaluateCheck(metricValue, op, expectedValue) {
  const normalizedMetric = typeof metricValue === "string" ? metricValue.toLowerCase() : metricValue;
  const normalizedExpected = typeof expectedValue === "string" ? expectedValue.toLowerCase() : expectedValue;

  switch (op) {
    case "equals":
      return normalizedMetric === normalizedExpected;
    case "notEquals":
      return normalizedMetric !== normalizedExpected;
    case "truthy":
      return Boolean(metricValue);
    case "falsy":
      return !metricValue;
    case "min":
      return Number(metricValue ?? 0) >= Number(expectedValue);
    case "max":
      return Number(metricValue ?? 0) <= Number(expectedValue);
    case "includes":
      if (Array.isArray(metricValue)) return normalizeArray(metricValue).includes(normalizedExpected);
      return stringContains(normalizedMetric, normalizedExpected);
    case "notIncludes":
      if (Array.isArray(metricValue)) return !normalizeArray(metricValue).includes(normalizedExpected);
      return !stringContains(normalizedMetric, normalizedExpected);
    case "includesAny": {
      const expectedItems = normalizeArray(expectedValue);
      if (Array.isArray(metricValue)) {
        const metricItems = normalizeArray(metricValue);
        return expectedItems.some((item) => metricItems.includes(item));
      }
      return expectedItems.some((item) => stringContains(normalizedMetric, item));
    }
    case "oneOf":
      return normalizeArray(expectedValue).includes(normalizedMetric);
    case "empty":
      return Array.isArray(metricValue) ? metricValue.length === 0 : !hasMeaningfulText(metricValue);
    case "notEmpty":
      return Array.isArray(metricValue) ? metricValue.length > 0 : hasMeaningfulText(metricValue);
    default:
      throw new Error(`unsupported operator: ${op}`);
  }
}

function evaluateCase(caseDef, result) {
  const metrics = buildMetrics(result);
  const failures = [];
  const passedChecks = [];
  const allChecks = [];

  for (const polarity of ["must", "mustNot"]) {
    for (const check of caseDef?.checks?.[polarity] ?? []) {
      const actual = metrics[check.metric];
      const passed = evaluateCheck(actual, check.op, check.value);
      const shouldInvert = polarity === "mustNot";
      const finalPassed = shouldInvert ? !passed : passed;

      allChecks.push({
        id: check.id,
        bucket: check.bucket,
        layer: check.layer,
        passed: finalPassed,
      });

      if (finalPassed) {
        passedChecks.push(check.id);
        continue;
      }

      failures.push({
        id: check.id,
        bucket: check.bucket,
        layer: check.layer,
        metric: check.metric,
        op: shouldInvert ? `not(${check.op})` : check.op,
        expected: check.value,
        actual,
        reason: check.reason,
      });
    }
  }

  return {
    metrics,
    failures,
    passedChecks,
    allChecks,
    passed: failures.length === 0,
  };
}

function normalizeComparableMetric(value) {
  if (typeof value === "string" && ["insufficient", "low", "medium", "high"].includes(value.toLowerCase())) {
    return confidenceToRank(value);
  }

  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

function evaluateComparison(comparisonDef, resultsById) {
  const leftResult = resultsById.get(comparisonDef.leftCase);
  const rightResult = resultsById.get(comparisonDef.rightCase);

  if (!leftResult || !rightResult) {
    return {
      id: comparisonDef.id,
      bucket: comparisonDef.bucket,
      layer: comparisonDef.layer,
      passed: false,
      metric: comparisonDef.metric,
      op: comparisonDef.op,
      leftCase: comparisonDef.leftCase,
      rightCase: comparisonDef.rightCase,
      leftActual: leftResult ? leftResult.metrics?.[comparisonDef.metric] : "(missing case)",
      rightActual: rightResult ? rightResult.metrics?.[comparisonDef.metric] : "(missing case)",
      reason: comparisonDef.reason,
    };
  }

  const leftActual = leftResult.metrics?.[comparisonDef.metric];
  const rightActual = rightResult.metrics?.[comparisonDef.metric];
  const leftComparable = normalizeComparableMetric(leftActual);
  const rightComparable = normalizeComparableMetric(rightActual);

  let passed = false;
  switch (comparisonDef.op) {
    case "gt":
      passed = Number(leftComparable) > Number(rightComparable);
      break;
    case "gte":
      passed = Number(leftComparable) >= Number(rightComparable);
      break;
    case "lt":
      passed = Number(leftComparable) < Number(rightComparable);
      break;
    case "lte":
      passed = Number(leftComparable) <= Number(rightComparable);
      break;
    case "equals":
      passed = leftComparable === rightComparable;
      break;
    case "notEquals":
      passed = leftComparable !== rightComparable;
      break;
    default:
      throw new Error(`unsupported comparison operator: ${comparisonDef.op}`);
  }

  return {
    id: comparisonDef.id,
    bucket: comparisonDef.bucket,
    layer: comparisonDef.layer,
    passed,
    metric: comparisonDef.metric,
    op: comparisonDef.op,
    leftCase: comparisonDef.leftCase,
    rightCase: comparisonDef.rightCase,
    leftActual,
    rightActual,
    reason: comparisonDef.reason,
  };
}

function formatValue(value) {
  if (Array.isArray(value)) return value.join(", ");
  if (value === undefined || value === null || value === "") return "(empty)";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

async function loadSuite() {
  const raw = await fs.readFile(suitePath, "utf8");
  return JSON.parse(raw);
}

async function callPlanner(prompt) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      state: {},
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`planner request failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return response.json();
}

async function ensureServerReachable() {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "benchmark health check",
        state: {},
      }),
    });

    return response.ok || response.status === 400;
  } catch {
    return false;
  }
}

function summarizeFailures(results) {
  const byLayer = new Map();
  const byBucket = new Map();

  for (const result of results) {
    for (const failure of result.failures) {
      byLayer.set(failure.layer, (byLayer.get(failure.layer) ?? 0) + 1);
      byBucket.set(failure.bucket, (byBucket.get(failure.bucket) ?? 0) + 1);
    }
  }

  return {
    byLayer: [...byLayer.entries()].sort((a, b) => b[1] - a[1]),
    byBucket: [...byBucket.entries()].sort((a, b) => b[1] - a[1]),
  };
}

function summarizeCapabilityPassRates(results, comparisonResults = []) {
  const stats = new Map();

  for (const result of results) {
    for (const check of result.allChecks) {
      const current = stats.get(check.bucket) ?? { passed: 0, total: 0 };
      current.total += 1;
      if (check.passed) current.passed += 1;
      stats.set(check.bucket, current);
    }
  }

  for (const comparison of comparisonResults) {
    const current = stats.get(comparison.bucket) ?? { passed: 0, total: 0 };
    current.total += 1;
    if (comparison.passed) current.passed += 1;
    stats.set(comparison.bucket, current);
  }

  return [...stats.entries()]
    .map(([bucket, value]) => ({
      bucket,
      passed: value.passed,
      total: value.total,
      rate: value.total ? value.passed / value.total : 0,
    }))
    .sort((a, b) => b.total - a.total || a.bucket.localeCompare(b.bucket));
}

function summarizeGrounding(results) {
  let evidence = 0;
  let fallback = 0;
  let none = 0;

  for (const result of results) {
    const source = result.metrics.groundingSource;
    if (source === "evidence") evidence += 1;
    else if (source === "fallback-profile") fallback += 1;
    else none += 1;
  }

  const total = results.length || 1;
  return {
    evidence,
    fallback,
    none,
    evidenceRate: evidence / total,
    fallbackRate: fallback / total,
  };
}

async function main() {
  const reachable = await ensureServerReachable();
  if (!reachable) {
    console.error(`could not reach the live design planner at ${endpoint}`);
    console.error("start the app server first, then rerun: npm run benchmark:design");
    process.exit(1);
  }

  const suite = await loadSuite();
  const results = [];

  console.log(`running ${suite.cases.length} benchmark cases against ${endpoint}`);

  for (const caseDef of suite.cases) {
    try {
      const response = await callPlanner(caseDef.prompt);
      const evaluated = evaluateCase(caseDef, response);
      results.push({
        id: caseDef.id,
        prompt: caseDef.prompt,
        category: caseDef.category,
        ...evaluated,
      });

      if (evaluated.passed) {
        console.log(`pass  ${caseDef.id}`);
      } else {
        console.log(`fail  ${caseDef.id}`);
        for (const failure of evaluated.failures) {
          console.log(`  - [${failure.layer}] ${failure.reason}`);
          console.log(`    metric: ${failure.metric}`);
          console.log(`    expected: ${formatValue(failure.expected)}`);
          console.log(`    actual: ${formatValue(failure.actual)}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        id: caseDef.id,
        prompt: caseDef.prompt,
        category: caseDef.category,
        passed: false,
        metrics: {},
        passedChecks: [],
        allChecks: [],
        failures: [
          {
            id: "request-failed",
            bucket: "runtime",
            layer: "retrieval",
            metric: "request",
            op: "ok",
            expected: "successful live planner response",
            actual: message,
            reason: "the live planner request failed before the case could be graded.",
          },
        ],
      });
      console.log(`fail  ${caseDef.id}`);
      console.log(`  - [retrieval] the live planner request failed before the case could be graded.`);
      console.log(`    actual: ${message}`);
    }
  }

  const resultsById = new Map(results.map((item) => [item.id, item]));
  const comparisonResults = (suite.comparisons ?? []).map((comparisonDef) =>
    evaluateComparison(comparisonDef, resultsById),
  );
  const casePasses = results.filter((item) => item.passed).length;
  const totalCases = results.length;
  const comparisonPasses = comparisonResults.filter((item) => item.passed).length;
  const totalComparisons = comparisonResults.length;
  const capabilityPassRates = summarizeCapabilityPassRates(results, comparisonResults);
  const failureSummary = summarizeFailures(results);
  for (const comparison of comparisonResults.filter((item) => !item.passed)) {
    const existingLayer = failureSummary.byLayer.find(([layer]) => layer === comparison.layer);
    if (existingLayer) {
      existingLayer[1] += 1;
    } else {
      failureSummary.byLayer.push([comparison.layer, 1]);
    }
    const existingBucket = failureSummary.byBucket.find(([bucket]) => bucket === comparison.bucket);
    if (existingBucket) {
      existingBucket[1] += 1;
    } else {
      failureSummary.byBucket.push([comparison.bucket, 1]);
    }
  }
  failureSummary.byLayer.sort((a, b) => b[1] - a[1]);
  failureSummary.byBucket.sort((a, b) => b[1] - a[1]);
  const groundingSummary = summarizeGrounding(results);

  const report = {
    generatedAt: new Date().toISOString(),
    endpoint,
    suite: {
      name: suite.name,
      version: suite.version,
      caseCount: totalCases,
    },
    summary: {
      casesPassed: casePasses,
      totalCases,
      casePassRate: totalCases ? casePasses / totalCases : 0,
      comparisonsPassed: comparisonPasses,
      totalComparisons,
      comparisonPassRate: totalComparisons ? comparisonPasses / totalComparisons : 1,
      capabilityPassRates,
      groundingSummary,
      mostCommonFailureCategories: failureSummary.byLayer,
    },
    results,
    comparisonResults,
  };

  await fs.mkdir(reportDir, { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log("");
  console.log("summary");
  console.log(`  cases passed: ${casePasses}/${totalCases} (${Math.round((report.summary.casePassRate || 0) * 100)}%)`);
  if (totalComparisons) {
    console.log(`  comparisons passed: ${comparisonPasses}/${totalComparisons} (${Math.round((report.summary.comparisonPassRate || 0) * 100)}%)`);
  }
  console.log("  grounding:");
  console.log(`    evidence: ${groundingSummary.evidence}/${totalCases} (${Math.round(groundingSummary.evidenceRate * 100)}%)`);
  console.log(`    fallback-profile: ${groundingSummary.fallback}/${totalCases} (${Math.round(groundingSummary.fallbackRate * 100)}%)`);
  console.log(`    none: ${groundingSummary.none}/${totalCases}`);
  console.log("  capability pass rates:");
  for (const bucket of capabilityPassRates) {
    console.log(`    ${bucket.bucket}: ${bucket.passed}/${bucket.total} (${Math.round(bucket.rate * 100)}%)`);
  }
  console.log("  most common failure categories:");
  for (const [layer, count] of failureSummary.byLayer.slice(0, 8)) {
    console.log(`    ${layer}: ${count}`);
  }
  console.log("");
  console.log(`saved report to ${reportPath}`);
}

await main();
