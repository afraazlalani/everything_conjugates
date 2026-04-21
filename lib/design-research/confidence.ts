import { CONFIDENCE_THRESHOLDS } from "./config";
import {
  BiologicalAbstraction,
  ConfidenceAssessment,
  ConflictAnalysis,
  EvidenceObject,
  EvidenceSource,
  MechanismInference,
  ModalityScore,
  NormalizedCase,
  OncologyPrecedentPlaybook,
  RetrievedSourceBucket,
} from "./types";

export function assessConfidence(
  input: NormalizedCase,
  scores: ModalityScore[],
  sources: EvidenceSource[],
  context: {
    sourceBuckets?: RetrievedSourceBucket[];
    evidenceObjects?: EvidenceObject[];
    mechanismInference?: MechanismInference | null;
    abstraction?: BiologicalAbstraction | null;
    conflict?: ConflictAnalysis | null;
    precedentPlaybook?: OncologyPrecedentPlaybook | null;
  } = {},
): ConfidenceAssessment {
  const top = scores[0];
  const runnerUp = scores[1];
  const leadGap = top && runnerUp ? top.total - runnerUp.total : 0;
  const factors: ConfidenceAssessment["factors"] = [];
  const sourceBucketCount = context.sourceBuckets?.filter((bucket) => bucket.items.length).length ?? 0;
  const evidenceSupportCount = context.evidenceObjects?.filter((item) => item.direction === "supports").length ?? 0;
  const mechanismInference = context.mechanismInference;
  const abstraction = context.abstraction;
  const conflict = context.conflict;
  const precedentPlaybook = context.precedentPlaybook;
  const targetConditionedWithRealTarget = input.recommendationScope === "target-conditioned" && Boolean(input.target?.canonical);
  const meaningfulTargetClass =
    abstraction?.targetClass === "cell-surface protein" ||
    abstraction?.targetClass === "transport receptor/uptake handle" ||
    abstraction?.targetClass === "soluble/extracellular factor";
  const meaningfulDeliveryContext =
    abstraction?.deliveryAccessibility === "systemic accessible" ||
    abstraction?.deliveryAccessibility === "barrier-limited";
  const coherentTargetConditionedContext =
    targetConditionedWithRealTarget &&
    (
      abstraction?.pathologyType === "oncology" ||
      meaningfulTargetClass ||
      meaningfulDeliveryContext ||
      input.hasSelectiveSurfaceTarget
    );
  const coherentTargetConditionedHardCase =
    coherentTargetConditionedContext &&
    abstraction?.source === "evidence-driven" &&
    abstraction?.deliveryAccessibility === "barrier-limited";
  const diseaseOnlyOncologyWithoutTarget =
    input.diseaseArea === "oncology" &&
    input.recommendationScope === "disease-level" &&
    !input.target?.canonical;
  const promptText = `${input.prompt} ${input.parsed.cleanedPrompt}`.toLowerCase();
  const mechanismSpecificSpliceOligoContext =
    input.recommendationScope === "disease-level" &&
    input.diseaseSpecificity === "specific" &&
    input.mechanismClass === "gene modulation" &&
    abstraction?.therapeuticIntent === "gene/rna modulation" &&
    abstraction?.compartmentNeed === "nuclear" &&
    abstraction?.cytotoxicFit === "discouraged" &&
    (
      /splice|exon|transcript correction|transcript rescue|splice-switching|exon skipping|exon-skipping|51st exon|exon 51|pmo|aso/.test(
        promptText,
      ) ||
      Boolean(
        context.evidenceObjects?.some((item) =>
          /splice|exon|transcript correction|splice-switching|exon skipping|pmo|aso/i.test(
            [
              item.label,
              item.claim,
              item.rationale,
              ...item.mechanismHints,
              ...item.themes,
            ].join(" "),
          ),
        ),
      )
    );

  if (input.recommendationScope === "disease-level") {
    factors.push({
      label: "disease-level only",
      impact: "negative",
      note: "there is no target-conditioned entry point yet, so the recommendation is still broad.",
    });
  } else {
    factors.push({
      label: "target-conditioned",
      impact: "positive",
      note: "the case includes a target-specific framing, which makes modality fit more meaningful.",
    });
  }

  if (input.unknowns.length >= CONFIDENCE_THRESHOLDS.insufficientUnknownCount) {
    factors.push({
      label: "many unknowns remain",
      impact: "negative",
      note: "core biology or delivery assumptions are still missing.",
    });
  }

  if (input.broadOncologyNoTarget) {
    factors.push({
      label: "under-specified oncology brief",
      impact: "negative",
      note: "the prompt names a cancer setting, but not the target, internalization logic, or therapeutic mechanism.",
    });
  }

  if (input.diseaseSpecificity === "family") {
    factors.push({
      label: "disease-family prompt",
      impact: "negative",
      note: "this reads like a broad disease family rather than a named disease subtype, so abstention is more appropriate.",
    });
  }

  if (input.diseaseSpecificity === "specific" && input.diseaseArea === "neuromuscular") {
    factors.push({
      label: "specific neuromuscular disease",
      impact: "positive",
      note: "this is a named neuromuscular disease rather than a generic family prompt, so disease-specific delivery literature can matter even before a target is fixed.",
    });
  }

  if (input.diseaseSpecificity === "specific" && input.diseaseArea === "oncology") {
    factors.push({
      label: "specific oncology disease",
      impact: "positive",
      note: "this is a named oncology disease, so disease-level oncology precedent can support provisional class guidance even before target conditioning is locked.",
    });
  }

  if (sourceBucketCount >= 3 || sources.length >= 4) {
    factors.push({
      label: "multiple source buckets",
      impact: "positive",
      note: "the current answer has support from several live evidence sources.",
    });
  } else {
    factors.push({
      label: "thin evidence surface",
      impact: "negative",
      note: "retrieved support is still limited for the current case.",
    });
  }

  if (mechanismInference?.source === "evidence" && mechanismInference.mechanismClass !== "unknown") {
    factors.push({
      label: "evidence-derived mechanism grounding",
      impact: "positive",
      note: `retrieved evidence points toward ${mechanismInference.mechanismClass}, so the planner is not only leaning on prompt cues or fallback profiles.`,
    });
  }

  if (abstraction?.source === "evidence-driven") {
    factors.push({
      label: "biological abstraction grounded",
      impact: "positive",
      note: `the planner derived a biomedical state with ${abstraction.pathologyType}, ${abstraction.therapeuticIntent}, and ${abstraction.deliveryAccessibility} constraints before ranking modalities.`,
    });
  }

  if ((evidenceSupportCount ?? 0) === 0) {
    factors.push({
      label: "weak disease grounding",
      impact: "negative",
      note: "retrieval did not yield enough structured mechanism-support evidence objects yet.",
    });
  }

  if (leadGap >= CONFIDENCE_THRESHOLDS.blueprintLeadGap) {
    factors.push({
      label: "winner separation",
      impact: "positive",
      note: "the top modality is meaningfully ahead of the runner-up.",
    });
  } else {
    factors.push({
      label: "close race",
      impact: "negative",
      note: "the top two modalities are still close enough that the answer should stay softer.",
    });
  }

  if (diseaseOnlyOncologyWithoutTarget) {
    factors.push({
      label: "disease-only oncology still needs target conditioning",
      impact: "negative",
      note: "oncology disease prompts without a target can support class-level hypotheses, but not a responsible winner yet.",
    });
  }

  if (coherentTargetConditionedContext) {
    factors.push({
      label: "target-conditioned biology is coherent",
      impact: "positive",
      note: "the target-conditioned scope, disease context, and abstraction state are coherent enough for provisional ranking even if the mechanism family is still broad.",
    });
  }

  if (precedentPlaybook) {
    factors.push({
      label: "approved-product precedent is strong",
      impact: "positive",
      note: `${precedentPlaybook.dominantProduct.label} provides a high-precedent playbook for this target-conditioned oncology setting.`,
    });
  }

  if (conflict?.present) {
    factors.push({
      label: "biological conflict detected",
      impact: "negative",
      note: `${conflict.summary} ${conflict.whyItMatters}`,
    });
  }

  if (mechanismSpecificSpliceOligoContext) {
    factors.push({
      label: "mechanism-specific splice/oligo case",
      impact: "positive",
      note: "the prompt already specifies exon or splice-correction biology, so the planner can move beyond generic disease exploration even without a named target yet.",
    });
  }

  const insufficientBiology =
    (
      !input.disease?.canonical &&
      !input.target?.canonical
    ) ||
    (
      input.mechanismClass === "unknown" &&
      abstraction?.therapeuticIntent === "unknown" &&
      !coherentTargetConditionedContext
    ) ||
    (
      input.unknowns.length >= CONFIDENCE_THRESHOLDS.insufficientUnknownCount &&
      !coherentTargetConditionedContext
    ) ||
    input.broadOncologyNoTarget ||
    diseaseOnlyOncologyWithoutTarget ||
    (
      input.recommendationScope === "disease-level" &&
      evidenceSupportCount === 0 &&
      abstraction?.source !== "evidence-driven"
    );

  const allowSpecificOncologyProvisional =
    input.diseaseSpecificity === "specific" &&
    input.diseaseArea === "oncology" &&
    input.recommendationScope === "disease-level" &&
    !input.target?.canonical;

  if (insufficientBiology && !allowSpecificOncologyProvisional) {
    if (mechanismSpecificSpliceOligoContext && (top?.total ?? 0) >= CONFIDENCE_THRESHOLDS.low) {
      return {
        level: "low",
        explorationLevel: "medium",
        winnerLevel: "low",
        factors,
        abstain: false,
        blueprintAllowed: false,
      };
    }

    const explorationLevel: ConfidenceAssessment["explorationLevel"] =
      mechanismInference?.source === "evidence" || abstraction?.source === "evidence-driven"
        ? "low"
        : "insufficient";
    return {
      level: "insufficient",
      explorationLevel,
      winnerLevel: "insufficient",
      factors,
      abstain: true,
      blueprintAllowed: false,
    };
  }

  if (allowSpecificOncologyProvisional) {
    return {
      level: "low",
      explorationLevel: "low",
      winnerLevel: "insufficient",
      factors,
      abstain: true,
      blueprintAllowed: false,
    };
  }

  if (coherentTargetConditionedContext) {
    const winnerLevel =
      (top?.total ?? 0) >= CONFIDENCE_THRESHOLDS.medium && leadGap >= CONFIDENCE_THRESHOLDS.blueprintLeadGap
        ? "medium"
        : "low";
    const cappedWinnerLevel =
      conflict?.winnerConfidenceCap === "insufficient"
        ? "insufficient"
        : conflict?.winnerConfidenceCap === "low" && winnerLevel === "medium"
          ? "low"
          : winnerLevel;
    return {
      level: cappedWinnerLevel,
      explorationLevel: coherentTargetConditionedHardCase ? "low" : "medium",
      winnerLevel: cappedWinnerLevel,
      factors,
      abstain: cappedWinnerLevel === "insufficient",
      blueprintAllowed: false,
    };
  }

  if ((top?.total ?? 0) >= CONFIDENCE_THRESHOLDS.high && leadGap >= CONFIDENCE_THRESHOLDS.blueprintLeadGap) {
    return {
      level: "high",
      explorationLevel: "high",
      winnerLevel: "high",
      factors,
      abstain: false,
      blueprintAllowed: true,
    };
  }

  if ((top?.total ?? 0) >= CONFIDENCE_THRESHOLDS.medium) {
    return {
      level: "medium",
      explorationLevel: "medium",
      winnerLevel: "medium",
      factors,
      abstain: false,
      blueprintAllowed: false,
    };
  }

  if ((top?.total ?? 0) >= CONFIDENCE_THRESHOLDS.low) {
    const explorationLevel: ConfidenceAssessment["explorationLevel"] =
      input.recommendationScope === "disease-level" ? "medium" : "low";
    return {
      level: "low",
      explorationLevel,
      winnerLevel: "low",
      factors,
      abstain: false,
      blueprintAllowed: false,
    };
  }

  return {
    level: "insufficient",
    explorationLevel: "insufficient",
    winnerLevel: "insufficient",
    factors,
    abstain: true,
    blueprintAllowed: false,
  };
}
