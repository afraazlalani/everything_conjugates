import type {
  BiologicalAbstraction,
  ConflictAnalysis,
  DiseaseExploration,
  MechanismInference,
  NormalizedCase,
} from "./types";

type ConflictContext = {
  abstraction?: BiologicalAbstraction | null;
  mechanismInference?: MechanismInference | null;
  exploration?: DiseaseExploration | null;
};

function buildConflict(
  labels: string[],
  summary: string,
  whyItMatters: string,
  clarifier: string,
  severity: ConflictAnalysis["severity"],
  winnerConfidenceCap: ConflictAnalysis["winnerConfidenceCap"],
  source: ConflictAnalysis["source"],
): ConflictAnalysis {
  return {
    present: true,
    labels,
    summary,
    whyItMatters,
    clarifier,
    severity,
    winnerConfidenceCap,
    source,
  };
}

export function analyzeConflictSignals(
  input: NormalizedCase,
  context: ConflictContext = {},
): ConflictAnalysis {
  const abstraction = context.abstraction;
  const promptText = `${input.prompt} ${input.parsed.cleanedPrompt} ${input.parsed.mechanismHints.join(" ")}`.toLowerCase();
  const extracellularCue = /(extracellular|soluble|neutraliz|amyloid plaque|amyloid-beta|aβ|abeta)/i.test(promptText);
  const intracellularOnlyCue = /(intracellular-only|sirna|rnai|knockdown|splice|splice rescue|exon skipping|exon-skipping|transcript correction|nuclear)/i.test(promptText);
  const cytotoxicCue = /(cytotoxic|cell kill|warhead|payload release|adc)/i.test(promptText);
  const nonCytotoxicCue = /(non-cytotoxic|pathway-modulating|pathway modulation|oligo conjugate|antisense|oligo)/i.test(promptText);
  const unconstrainedDeliveryCue = /(unconstrained|no transport|no barrier assumptions|without transport|without barrier)/i.test(promptText);

  if (
    (abstraction?.targetClass === "soluble/extracellular factor" || extracellularCue || abstraction?.compartmentNeed === "extracellular") &&
    (intracellularOnlyCue || abstraction?.compartmentNeed === "nuclear" || abstraction?.compartmentNeed === "cytosolic")
  ) {
    return buildConflict(
      ["extracellular target", "intracellular-only mechanism"],
      "there is a conflict between extracellular target logic and an intracellular-only mechanism.",
      "that mismatch matters because extracellular neutralization and intracellular transcript correction need different trafficking routes, payload formats, and modality choices.",
      "is the real goal extracellular binding or neutralization, or intracellular transcript correction after uptake?",
      "high",
      "insufficient",
      abstraction?.source === "evidence-driven" ? "abstraction-driven" : "normalized-context",
    );
  }

  if (
    abstraction?.pathologyType !== "oncology" &&
    abstraction?.treatmentContext === "chronic" &&
    (
      abstraction?.pathologyType === "autoimmune/inflammatory" ||
      abstraction?.cytotoxicFit === "discouraged" ||
      /rheumatoid arthritis|lupus|systemic sclerosis|myasthenia|multiple sclerosis|autoimmune|inflammatory/.test(promptText)
    ) &&
    cytotoxicCue
  ) {
    return buildConflict(
      ["chronic non-oncology disease", "cytotoxic intent"],
      "there is a conflict between a chronic non-oncology disease frame and explicit cytotoxic payload logic.",
      "that mismatch matters because chronic pathway or immune modulation usually wants a different safety window and modality logic than cell-killing payload delivery.",
      "are you really trying to deplete a pathogenic cell population, or modulate the pathway without cell kill?",
      "high",
      "low",
      abstraction?.source === "evidence-driven" ? "abstraction-driven" : "normalized-context",
    );
  }

  if (abstraction?.deliveryAccessibility === "barrier-limited" && unconstrainedDeliveryCue) {
    return buildConflict(
      ["barrier-limited disease", "unconstrained delivery assumption"],
      "there is a conflict between a barrier-limited disease context and an unconstrained delivery assumption.",
      "that matters for modality choice because cns or other barrier-limited settings need an explicit entry handle, transport route, or exposure argument before large default constructs become believable.",
      "what transport route, brain-entry handle, or exposure assumption is supposed to make delivery work here?",
      "high",
      "low",
      abstraction?.source === "evidence-driven" ? "abstraction-driven" : "normalized-context",
    );
  }

  if (
    input.diseaseArea === "oncology" &&
    input.recommendationScope === "target-conditioned" &&
    nonCytotoxicCue &&
    (abstraction?.therapeuticIntent === "cytotoxic elimination" || abstraction?.cytotoxicFit === "favored")
  ) {
    return buildConflict(
      ["classical oncology target logic", "non-cytotoxic oligo intent"],
      "there is a conflict between classical oncology target logic and the requested non-cytotoxic oligo or pathway-modulating mechanism.",
      "that tension matters because the target and disease context may support targeted delivery, but the requested active biology is no longer the usual intracellular cytotoxic release story that makes those modalities lead by default.",
      "is the real goal targeted cell kill, or do you want a non-cytotoxic pathway or rna intervention built around the same target context?",
      "boundary",
      "low",
      abstraction?.source === "evidence-driven" ? "abstraction-driven" : "normalized-context",
    );
  }

  return {
    present: false,
    labels: [],
    summary: "",
    whyItMatters: "",
    clarifier: context.exploration?.mostInformativeClarifier ?? "",
    severity: "none",
    source: "none",
  };
}
