import { CONFIDENCE_THRESHOLDS } from "./config";
import {
  ConfidenceAssessment,
  EvidenceObject,
  EvidenceSource,
  MechanismInference,
  ModalityScore,
  NormalizedCase,
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
  } = {},
): ConfidenceAssessment {
  const top = scores[0];
  const runnerUp = scores[1];
  const leadGap = top && runnerUp ? top.total - runnerUp.total : 0;
  const factors: ConfidenceAssessment["factors"] = [];
  const sourceBucketCount = context.sourceBuckets?.filter((bucket) => bucket.items.length).length ?? 0;
  const evidenceSupportCount = context.evidenceObjects?.filter((item) => item.direction === "supports").length ?? 0;
  const mechanismInference = context.mechanismInference;

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

  const insufficientBiology =
    !input.disease?.canonical && !input.target?.canonical ||
    input.mechanismClass === "unknown" ||
    input.unknowns.length >= CONFIDENCE_THRESHOLDS.insufficientUnknownCount ||
    input.broadOncologyNoTarget ||
    (input.recommendationScope === "disease-level" && evidenceSupportCount === 0);

  const allowSpecificOncologyProvisional =
    input.diseaseSpecificity === "specific" &&
    input.diseaseArea === "oncology" &&
    input.recommendationScope === "disease-level" &&
    !input.target?.canonical;

  if (insufficientBiology && !allowSpecificOncologyProvisional) {
    return {
      level: "insufficient",
      factors,
      abstain: true,
      blueprintAllowed: false,
    };
  }

  if (allowSpecificOncologyProvisional) {
    return {
      level: "low",
      factors,
      abstain: false,
      blueprintAllowed: false,
    };
  }

  if ((top?.total ?? 0) >= CONFIDENCE_THRESHOLDS.high && leadGap >= CONFIDENCE_THRESHOLDS.blueprintLeadGap) {
    return {
      level: "high",
      factors,
      abstain: false,
      blueprintAllowed: true,
    };
  }

  if ((top?.total ?? 0) >= CONFIDENCE_THRESHOLDS.medium) {
    return {
      level: "medium",
      factors,
      abstain: false,
      blueprintAllowed: false,
    };
  }

  if ((top?.total ?? 0) >= CONFIDENCE_THRESHOLDS.low) {
    return {
      level: "low",
      factors,
      abstain: false,
      blueprintAllowed: false,
    };
  }

  return {
    level: "insufficient",
    factors,
    abstain: true,
    blueprintAllowed: false,
  };
}
