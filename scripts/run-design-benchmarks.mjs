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
const DISEASE_ALIAS_TABLE = {
  "inflammatory bowel disease": ["ibd", "crohn's disease", "crohns disease", "ulcerative colitis", "colitis"],
  "multiple sclerosis": ["ms"],
  glioblastoma: ["gbm", "glioblastoma multiforme"],
  "myotonic dystrophy type 1": ["dm1", "dm 1", "myotonic dystrophy", "steinert disease"],
  "duchenne muscular dystrophy": ["dmd", "duchenne"],
  "facioscapulohumeral muscular dystrophy": ["fshd", "fshd1", "fshd2", "facioscapulohumeral dystrophy"],
  "myasthenia gravis": ["mg", "myasthenia", "myasthania gravis", "myasthenic gravis"],
  "alzheimer disease": ["alzheimer's disease", "alzheimers disease", "alzheimer disease", "alzheimer's", "alzheimers", "ad dementia"],
  "parkinson disease": ["parkinson's disease", "parkinsons disease", "parkinson disease", "parkinson's", "parkinsons", "pd"],
  "amyotrophic lateral sclerosis": ["als", "motor neuron disease", "lou gehrig disease"],
  "rheumatoid arthritis": ["ra"],
  "systemic lupus erythematosus": ["sle", "lupus"],
};

function lower(value) {
  return typeof value === "string" ? value.toLowerCase() : value;
}

function normalizePhrase(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function looksPromptShapedEntity(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return false;

  return (
    /\b(what|which|format|linker|payload|try first|start somewhere|would you|if you had to|should i build)\b/.test(text) ||
    text.split(/\s+/).length > 6
  );
}

function normalizeArray(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => (typeof value === "string" ? value.toLowerCase() : value));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectDiseaseMentions(text) {
  const normalizedText = normalizePhrase(text);
  const matches = [];

  for (const [canonical, aliases] of Object.entries(DISEASE_ALIAS_TABLE)) {
    for (const candidate of [canonical, ...aliases]) {
      const normalizedCandidate = normalizePhrase(candidate);
      if (!normalizedCandidate) continue;
      const pattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedCandidate)}(\\s|$)`, "i");
      if (pattern.test(normalizedText)) {
        matches.push(canonical);
        break;
      }
    }
  }

  return Array.from(new Set(matches));
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

function repeatedParagraphCount(value) {
  const parts = String(value ?? "")
    .split(/\n+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 80);
  const seen = new Set();
  let duplicates = 0;
  for (const part of parts) {
    if (seen.has(part)) duplicates += 1;
    seen.add(part);
  }
  return duplicates;
}

function payloadMatchesResponse(payload, responseText) {
  const normalizedPayload = String(payload ?? "").toLowerCase();
  const normalizedResponse = String(responseText ?? "").toLowerCase();

  if (!normalizedPayload) return false;

  if (
    /(topoisomerase|topo-i|sn-38|deruxtecan|exatecan)/.test(normalizedPayload) &&
    /(topoisomerase|topo-i|sn-38|deruxtecan|exatecan)/.test(normalizedResponse)
  ) {
    return true;
  }

  if (
    /(mmae|mmaf|microtubule|dm1|dm4|maytansinoid|vedotin|emtansine|soravtansine)/.test(normalizedPayload) &&
    /(mmae|mmaf|microtubule|dm1|dm4|maytansinoid|vedotin|emtansine|soravtansine)/.test(normalizedResponse)
  ) {
    return true;
  }

  return stringContains(normalizedResponse, normalizedPayload);
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
      explorationNeuroDegenerativeUseful: false,
      explorationMixedPathologyUseful: false,
      explorationOvercommitsExtracellularInMixedCase: false,
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
    if (/(atrophy|wasting|anabolic|myostatin|activin|supportive|remodel)/i.test(text)) categories.push("supportive-tissue");
    if (/(neuron|neuronal|microglia|glia|astrocyte|dopaminergic|cell-type)/i.test(text)) categories.push("cell-type-targeting");
    if (/(cytotoxic|cell-killing|ablation)/i.test(text)) categories.push("cytotoxic");
    if (/(radioligand|isotope|dosimetry)/i.test(text)) categories.push("radiobiology");
    if (/(enzyme|prodrug|activation)/i.test(text)) categories.push("enzyme-prodrug");
    if (/(bbb|brain-entry|shuttle|transport|receptor-mediated)/i.test(text)) categories.push("transport");

    return Array.from(new Set(categories));
  });

  const distinctLaneCategories = Array.from(new Set(laneCategories.flat()));
  const isMixedPathologyCase = trace?.abstraction?.pathologyType === "mixed";
  const isNeurodegenerativeCase = trace?.abstraction?.pathologyType === "neurodegeneration";
  const hasExtracellularThemeSupport =
    (trace?.matchedThemes ?? []).some((theme) => /extracellular|soluble factor|amyloid plaque clearance/.test(theme)) ||
    (trace?.corpusMatchedThemes ?? []).some((theme) => /extracellular|soluble factor|amyloid plaque clearance/.test(theme));
  const mixedPathologyUseful =
    !isMixedPathologyCase
      ? true
      : distinctLaneCategories.length >= 3 &&
        distinctLaneCategories.includes("immune") &&
        (
          distinctLaneCategories.includes("organelle-support") ||
          distinctLaneCategories.includes("supportive-tissue") ||
          distinctLaneCategories.includes("gene-rna") ||
          distinctLaneCategories.includes("pathway-small-format")
        );
  const overcommitsExtracellularInMixedCase =
    isMixedPathologyCase &&
    !hasExtracellularThemeSupport &&
    distinctLaneCategories.includes("extracellular-biologic") &&
    !distinctLaneCategories.includes("organelle-support") &&
    !distinctLaneCategories.includes("supportive-tissue") &&
    !distinctLaneCategories.includes("gene-rna");
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
  const neuroExplorationUseful =
    !isNeurodegenerativeCase
      ? true
      : (() => {
          const differentiatedNeuroLanes = [
            "gene-rna",
            "extracellular-biologic",
            "cell-type-targeting",
            "organelle-support",
            "pathway-small-format",
          ].filter((category) => distinctLaneCategories.includes(category));

          return (
            distinctLaneCategories.includes("transport") &&
            hasWeakFitCytotoxicLane &&
            differentiatedNeuroLanes.length >= 2 &&
            differentiatedNeuroLanes.some((category) => ["gene-rna", "extracellular-biologic", "cell-type-targeting"].includes(category))
          );
        })();

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
    explorationNeuroDegenerativeUseful: neuroExplorationUseful,
    explorationMixedPathologyUseful: mixedPathologyUseful,
    explorationOvercommitsExtracellularInMixedCase: overcommitsExtracellularInMixedCase,
    explorationHasWeakFitCytotoxicLane: hasWeakFitCytotoxicLane,
    explorationDepthScore: weakest.score,
    weakExplorationReason: [
      weakest.missing.join("; "),
      buckets.length >= 2 && distinctLaneCategories.length < 2 ? "strategy lanes are not differentiated enough" : "",
      !neuroExplorationUseful ? "neurodegenerative lanes are still too generic" : "",
      !mixedPathologyUseful ? "mixed-pathology lanes are too narrow or not differentiated enough" : "",
      overcommitsExtracellularInMixedCase ? "mixed-pathology case overcommits to extracellular logic" : "",
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
  const presentation = result?.presentation ?? null;
  const constructBlueprint = result?.constructBlueprint ?? null;
  const strategyTable = Array.isArray(result?.strategyTable) ? result.strategyTable : [];
  const rankingPreview = Array.isArray(result?.rankingPreview) ? result.rankingPreview : [];
  const uiContract = result?.uiContract ?? null;
  const viabilityBuckets = result?.viabilityBuckets ?? null;
  const followUpAnswer = result?.followUpAnswer ?? null;
  const sectionOrder = Array.isArray(result?.sectionOrder) ? result.sectionOrder.map((item) => lower(item)) : [];
  const presentationPrimaryCardPresent =
    Boolean(presentation) &&
    hasMeaningfulText(presentation?.title) &&
    hasMeaningfulText(presentation?.rationale);
  const presentationStartingPointCardPresent =
    presentation?.mode === "recommended-starting-point" &&
    hasMeaningfulText(presentation?.bestConjugateClass) &&
    hasMeaningfulText(presentation?.confidence);
  const presentationStrategyDirectionCardPresent =
    presentation?.mode === "best-current-strategy-direction" &&
    Array.isArray(presentation?.strategyLanes) &&
    presentation.strategyLanes.length >= 2 &&
    hasMeaningfulText(presentation?.bestClarifier);
  const presentationPrimaryCardHasBuildParts =
    presentation?.mode !== "recommended-starting-point"
      ? true
      : hasMeaningfulText(presentation?.recommendedFormat) &&
        hasMeaningfulText(presentation?.recommendedLinker) &&
        hasMeaningfulText(presentation?.recommendedPayload);
  const presentationSectionOrderValid =
    !sectionOrder.length ||
    [
      "recommended starting point / best current strategy direction",
      "recommended construct / strategy table",
      "construct blueprint",
      "ranked conjugate options",
      "innovative strategy ideas",
      "why not the other options",
      "evidence / precedent anchors",
      "what is still uncertain",
      "debug trace",
    ].every((item, index, all) => {
      const foundIndex = sectionOrder.indexOf(item);
      if (foundIndex < 0) return true;
      const previousFound = all
        .slice(0, index)
        .map((previous) => sectionOrder.indexOf(previous))
        .filter((previousIndex) => previousIndex >= 0);
      return !previousFound.length || foundIndex >= previousFound[previousFound.length - 1];
    });
  const innovativeIdeasRich =
    Array.isArray(result?.innovativeIdeas) &&
    result.innovativeIdeas.every((idea) =>
      hasMeaningfulText(idea?.ideaName) &&
      hasMeaningfulText(idea?.whyInteresting) &&
      hasMeaningfulText(idea?.assumptionMustBeTrue) &&
      hasMeaningfulText(idea?.firstExperiment) &&
      hasMeaningfulText(idea?.whyItCouldFail) &&
      hasMeaningfulText(idea?.riskLevel),
    );
  const repeatedLongParagraphBlocks =
    result?.uiContract?.compactRenderer
      ? 0
      : repeatedParagraphCount(result?.text ?? result?.summary ?? "");
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
  const diseaseCanonical = String(trace?.normalization?.disease?.canonical ?? "");
  const responseNamedDiseases = detectDiseaseMentions(responseText);
  const responseWrongDiseaseMentionPresent =
    hasMeaningfulText(diseaseCanonical) &&
    responseNamedDiseases.some((item) => lower(item) !== lower(diseaseCanonical));
  const precedentPlaybook = result?.trace?.precedentPlaybook ?? null;
  const oligoPrecedentAnchors = result?.trace?.oligoPrecedentAnchors ?? null;
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
  const precedentPlaybookPresent = Boolean(precedentPlaybook);
  const highPrecedentOncologyPlaybookPresent =
    precedentPlaybookPresent &&
    String(precedentPlaybook?.strength ?? "").toLowerCase() === "high" &&
    trace?.normalization?.recommendationScope === "target-conditioned" &&
    trace?.abstraction?.pathologyType === "oncology";
  const precedentPlaybookDetailCount = [
    precedentPlaybook?.dominantProduct?.label,
    precedentPlaybook?.dominantProduct?.linker,
    precedentPlaybook?.dominantProduct?.payload,
    precedentPlaybook?.dominantProduct?.bystander,
    precedentPlaybook?.dominantProduct?.safetyWatchout,
    precedentPlaybook?.comparatorProduct?.label,
  ].filter(hasMeaningfulText).length;
  const responseMentionsDominantPrecedentProduct =
    hasMeaningfulText(precedentPlaybook?.dominantProduct?.label) &&
    stringContains(responseText, String(precedentPlaybook?.dominantProduct?.label).split("/")[0].trim());
  const responseMentionsComparatorProduct =
    hasMeaningfulText(precedentPlaybook?.comparatorProduct?.label) &&
    stringContains(responseText, String(precedentPlaybook?.comparatorProduct?.label).split("/")[0].trim());
  const oligoPrecedentAnchorsPresent = Boolean(oligoPrecedentAnchors);
  const responseMentionsApprovedOligoComparator =
    hasMeaningfulText(oligoPrecedentAnchors?.approvedComparator?.label) &&
    stringContains(responseText, String(oligoPrecedentAnchors?.approvedComparator?.label).split("/")[0].trim());
  const responseMentionsConjugatedOligoExample =
    hasMeaningfulText(oligoPrecedentAnchors?.conjugatedExample?.label) &&
    stringContains(responseText, String(oligoPrecedentAnchors?.conjugatedExample?.label).split("/")[0].trim());
  const responseMentionsTargetedOligoDeliveryExample =
    hasMeaningfulText(oligoPrecedentAnchors?.targetedDeliveryExample?.label) &&
    stringContains(responseText, String(oligoPrecedentAnchors?.targetedDeliveryExample?.label).split("/")[0].trim());
  const oligoPrecedentAnchorCount = [
    oligoPrecedentAnchors?.approvedComparator?.label,
    oligoPrecedentAnchors?.conjugatedExample?.label,
    oligoPrecedentAnchors?.targetedDeliveryExample?.label,
    oligoPrecedentAnchors?.platformAnchor?.label,
  ].filter(hasMeaningfulText).length;
  const responseMentionsBystanderLogic =
    stringContains(responseText, "bystander") ||
    stringContains(responseText, "heterogeneity") ||
    stringContains(responseText, "heterogeneous");
  const responseMentionsSafetyWatchout =
    stringContains(responseText, "pneumonitis") ||
    stringContains(responseText, "interstitial lung disease") ||
    stringContains(responseText, "ild") ||
    stringContains(responseText, "ocular toxicity") ||
    stringContains(responseText, "neuropathy") ||
    stringContains(responseText, "diarrhea") ||
    stringContains(responseText, "neutropenia");
  const responseMentionsModernPayloadClass =
    stringContains(responseText, "topoisomerase") ||
    stringContains(responseText, "topo-i") ||
    stringContains(responseText, "sn-38") ||
    stringContains(responseText, "deruxtecan");
  const responseMentionsCleavableLinkerLogic =
    stringContains(responseText, "cleavable linker") ||
    stringContains(responseText, "protease-cleavable") ||
    stringContains(responseText, "hydrolyzable linker") ||
    stringContains(responseText, "non-cleavable linker");
  const responseMentionsSpliceSwitchingOligoLogic =
    stringContains(responseText, "splice-switching") ||
    stringContains(responseText, "splice switching") ||
    stringContains(responseText, "pmo") ||
    stringContains(responseText, "aso") ||
    stringContains(responseText, "antisense") ||
    stringContains(responseText, "nuclear pre-mrna");
  const responseMentionsMechanismSpecificDeliveryConstraint =
    (stringContains(responseText, "muscle delivery") && stringContains(responseText, "routing")) ||
    stringContains(responseText, "productive intracellular routing") ||
    stringContains(responseText, "muscle nuclei");
  const cnsOncologyConstructConstraintLanguagePresent =
    (
      stringContains(responseText, "blood-tumor barrier") ||
      stringContains(responseText, "brain tumor") ||
      stringContains(responseText, "tumor penetration") ||
      stringContains(responseText, "heterogeneity") ||
      stringContains(responseText, "heterogeneous")
    ) &&
    (
      stringContains(responseText, "fab") ||
      stringContains(responseText, "scfv") ||
      stringContains(responseText, "nanobody") ||
      stringContains(responseText, "full igg") ||
      stringContains(responseText, "antibody-derived binders")
    );
  const responseMakesOligoLeadingClassExplicit =
    stringContains(responseText, "oligo conjugate is the best current fit") ||
    stringContains(responseText, "i’d start with oligo conjugate") ||
    (lower(result?.topPick ?? "") === "oligo conjugate");
  const dominantPayloadMatchesResponse = payloadMatchesResponse(precedentPlaybook?.dominantProduct?.payload, responseText);
  const comparatorPayloadMatchesResponse = payloadMatchesResponse(precedentPlaybook?.comparatorProduct?.payload, responseText);
  const responseContradictsDominantPlaybook =
    highPrecedentOncologyPlaybookPresent &&
    hasMeaningfulText(precedentPlaybook?.dominantProduct?.payload) &&
    hasMeaningfulText(precedentPlaybook?.comparatorProduct?.payload) &&
    !dominantPayloadMatchesResponse &&
    comparatorPayloadMatchesResponse;
  const contradictoryComparatorPayloadLanguage =
    highPrecedentOncologyPlaybookPresent &&
    /microtubule payload first|mmae\/dm1-style payload logic is still the most straightforward first screen/.test(
      String(responseText ?? "").toLowerCase(),
    );
  const responseAvoidsEqualSecondaryCompetitors =
    !(
      trace?.normalization?.recommendationScope === "target-conditioned" &&
      trace?.abstraction?.pathologyType === "oncology" &&
      Array.isArray(result?.matrix) &&
      result.matrix.length >= 3 &&
      new Set(
        result.matrix.slice(0, 3).map((item) => Number(item?.total ?? 0).toFixed(1)),
      ).size === 1
    );
  const scoreOutOfTen = (total) => Math.max(0, Math.min(10, Math.round(((Number(total ?? 0) + 15) / 30) * 10)));
  const topMatrix = Array.isArray(result?.matrix) && result.matrix.length ? result.matrix[0] : null;
  const secondaryPdc = Array.isArray(result?.matrix) ? result.matrix.find((item) => lower(item?.modality) === "pdc") : null;
  const secondarySmdc = Array.isArray(result?.matrix) ? result.matrix.find((item) => lower(item?.modality) === "smdc") : null;
  const bestUnsupportedSecondary = [secondaryPdc, secondarySmdc]
    .filter(Boolean)
    .reduce((best, current) => (!best || Number(current.total ?? -999) > Number(best.total ?? -999) ? current : best), null);
  const highPrecedentSecondaryGapAdequate =
    !highPrecedentOncologyPlaybookPresent ||
    lower(topMatrix?.modality) !== "adc" ||
    !bestUnsupportedSecondary
      ? true
      : scoreOutOfTen(topMatrix.total) - scoreOutOfTen(bestUnsupportedSecondary.total) >= 2;
  const precedentRecommendedPartsConsistent =
    !highPrecedentOncologyPlaybookPresent ||
    (dominantPayloadMatchesResponse &&
      !responseContradictsDominantPlaybook &&
      !contradictoryComparatorPayloadLanguage);
  const responseMentionsFcRnOrIgGLowering =
    stringContains(responseText, "fcrn") ||
    stringContains(responseText, "igg-lowering") ||
    stringContains(responseText, "igg lowering") ||
    stringContains(responseText, "pathogenic igg");
  const responseMentionsComplementLogic =
    stringContains(responseText, "complement") ||
    stringContains(responseText, "c5") ||
    stringContains(responseText, "c3");
  const responseMentionsAntigenSpecificAutoimmuneLogic =
    stringContains(responseText, "antigen-specific") ||
    stringContains(responseText, "tolerance") ||
    stringContains(responseText, "achr") ||
    stringContains(responseText, "acetylcholine receptor") ||
    stringContains(responseText, "musk") ||
    stringContains(responseText, "lrp4");
  const responseMentionsBCellOrPlasmaLogic =
    stringContains(responseText, "b-cell") ||
    stringContains(responseText, "b cell") ||
    stringContains(responseText, "plasma-cell") ||
    stringContains(responseText, "plasma cell") ||
    stringContains(responseText, "plasmablast");
  const autoimmuneSpecificLaneCount = [
    responseMentionsFcRnOrIgGLowering,
    responseMentionsComplementLogic,
    responseMentionsAntigenSpecificAutoimmuneLogic,
    responseMentionsBCellOrPlasmaLogic,
  ].filter(Boolean).length;
  const noRecommendedNotViableOverlap =
    viabilityBuckets?.contradictionFree ??
    (() => {
      const recommended = new Set((viabilityBuckets?.feasibleNames ?? []).map((item) => lower(item)));
      const blocked = new Set((viabilityBuckets?.notViableNames ?? []).map((item) => lower(item)));
      return [...recommended].every((item) => !blocked.has(item));
    })();
  const followUpAnswerPresent = Boolean(followUpAnswer);
  const followUpAcknowledgesContradiction =
    /you.?re right|inconsistent|contradiction|should not appear in both/.test(responseText);
  const followUpUsesPreviousResult = Boolean(followUpAnswer?.usedPreviousResult);
  const followUpAvoidsFreshRecommendation =
    !followUpAnswerPresent ||
    !/\b(adc|pdc|smdc|rdc|oligo conjugate|enzyme conjugate) is the best current fit\b/.test(responseText);

  return {
    namedDiseaseRecognized: Boolean(trace?.grounding?.namedDiseaseRecognized),
    diseaseSpecificity: trace?.normalization?.diseaseSpecificity ?? "unknown",
    diseaseArea: trace?.normalization?.diseaseArea ?? "unknown",
    recommendationScope: trace?.normalization?.recommendationScope ?? "disease-level",
    targetMentionPresent: hasMeaningfulText(trace?.parser?.targetMention),
    parserTargetMentionPromptShaped: looksPromptShapedEntity(trace?.parser?.targetMention),
    parserDiseaseMentionPromptShaped: looksPromptShapedEntity(trace?.parser?.diseaseMention),
    targetCanonicalPresent: hasMeaningfulText(trace?.normalization?.target?.canonical),
    diseaseCanonicalPresent: hasMeaningfulText(trace?.normalization?.disease?.canonical),
    diseaseCanonical,
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
    precedentPlaybookPresent,
    oligoPrecedentAnchorsPresent,
    highPrecedentOncologyPlaybookPresent,
    precedentPlaybookDetailCount,
    oligoPrecedentAnchorCount,
    responseMentionsDominantPrecedentProduct,
    responseMentionsComparatorProduct,
    responseMentionsApprovedOligoComparator,
    responseMentionsConjugatedOligoExample,
    responseMentionsTargetedOligoDeliveryExample,
    responseMentionsBystanderLogic,
    responseMentionsSafetyWatchout,
    responseMentionsModernPayloadClass,
    responseMentionsCleavableLinkerLogic,
    responseMentionsSpliceSwitchingOligoLogic,
    responseMentionsMechanismSpecificDeliveryConstraint,
    responseMentionsFcRnOrIgGLowering,
    responseMentionsComplementLogic,
    responseMentionsAntigenSpecificAutoimmuneLogic,
    responseMentionsBCellOrPlasmaLogic,
    autoimmuneSpecificLaneCount,
    cnsOncologyConstructConstraintLanguagePresent,
    responseMakesOligoLeadingClassExplicit,
    responseAvoidsEqualSecondaryCompetitors,
    highPrecedentSecondaryGapAdequate,
    precedentRecommendedPartsConsistent,
    uiNoRecommendedNotViableOverlap:
      uiContract?.noRecommendedNotViableOverlap ?? noRecommendedNotViableOverlap,
    uiPlannerResponsePrimary: Boolean(uiContract?.plannerResponsePrimary),
    uiTopCardPresent: Boolean(uiContract?.topCard) || presentationPrimaryCardPresent,
    strategyTablePresent: Boolean(uiContract?.strategyTable) || strategyTable.length > 0,
    rankingPreviewPresent: Boolean(uiContract?.rankingSection) || rankingPreview.length > 0 || ranking.length > 0,
    innovationSectionPresent: Boolean(uiContract?.innovationSection) || Boolean(result?.innovativeIdeas?.length),
    uiDebugCollapsedByDefault: Boolean(uiContract?.debugCollapsedByDefault),
    uiCompactRenderer: Boolean(uiContract?.compactRenderer),
    uiFormatPayloadFieldsPresentWhenAvailable:
      uiContract?.formatPayloadFieldsPresentWhenAvailable ?? presentationPrimaryCardHasBuildParts,
    repeatedLongParagraphBlocks,
    presentationPrimaryCardPresent,
    presentationStartingPointCardPresent,
    presentationStrategyDirectionCardPresent,
    presentationPrimaryCardHasBuildParts,
    presentationSectionOrderValid,
    constructBlueprintPresent: Boolean(constructBlueprint),
    innovativeIdeasRich,
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
    explorationNeuroDegenerativeUseful: explorationQuality.explorationNeuroDegenerativeUseful,
    explorationMixedPathologyUseful: explorationQuality.explorationMixedPathologyUseful,
    explorationOvercommitsExtracellularInMixedCase: explorationQuality.explorationOvercommitsExtracellularInMixedCase,
    explorationHasWeakFitCytotoxicLane: explorationQuality.explorationHasWeakFitCytotoxicLane,
    explorationDepthScore: explorationQuality.explorationDepthScore,
    weakExplorationReason: explorationQuality.weakExplorationReason,
    diseaseOnlyExplorationLeadsOutput,
    groundedDiseaseOutputNonBlank,
    responseNamedDiseases,
    responseWrongDiseaseMentionPresent,
    followUpAnswerPresent,
    followUpAcknowledgesContradiction,
    followUpUsesPreviousResult,
    followUpAvoidsFreshRecommendation,
    noRecommendedNotViableOverlap,
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

async function callPlanner(prompt, state = {}, previousResult = undefined) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      state,
      previousResult,
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
      let previousResult;
      if (caseDef.previousPrompt) {
        previousResult = await callPlanner(caseDef.previousPrompt, caseDef.previousState ?? {}, caseDef.previousResult);
      }

      const response = await callPlanner(caseDef.prompt, caseDef.state ?? {}, previousResult);
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
