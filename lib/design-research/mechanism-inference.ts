import type {
  DiseaseGrounding,
  EvidenceObject,
  MechanismClass,
  MechanismInference,
  NormalizedCase,
} from "./types";

const DIRECTION_MAP: Record<EvidenceObject["direction"], number> = {
  supports: 1,
  penalizes: -1,
  neutral: 0,
};

function weightForStrength(strength: EvidenceObject["strength"]) {
  if (strength === "high") return 3;
  if (strength === "medium") return 2;
  return 1;
}

function mechanismSummary(mechanism: MechanismClass) {
  switch (mechanism) {
    case "gene modulation":
      return {
        summary:
          "the retrieved evidence reads more like sequence-directed or rna-directed intervention biology than classical released-warhead delivery.",
        rationale:
          "that keeps oligo and delivery-handle strategies more plausible than cytotoxic, radioligand, or enzyme-first classes until target-conditioned details are added.",
        plausibleDirections: ["oligo conjugate", "aoc-style delivery", "productive intracellular routing"],
      };
    case "pathway modulation":
      return {
        summary:
          "the retrieved evidence points toward pathway- or transport-aware disease biology rather than classical released-warhead delivery.",
        rationale:
          "that makes non-cytotoxic, transport-aware, or pathway-matched conjugate strategies more plausible at disease level, while still leaving the final construct open until target and entry-handle details are clearer.",
        plausibleDirections: [
          "bbb-shuttle or transport-aware logic",
          "small-format or pathway-matched conjugate strategies",
          "non-cytotoxic targeted architectures",
        ],
      };
    case "cytotoxic delivery":
      return {
        summary:
          "the retrieved evidence reads more like tumor-directed payload delivery than scaffold-preservation or sequence-rescue biology.",
        rationale:
          "that makes classical warhead-bearing conjugate classes plausible at disease level, but target and internalization specifics still decide whether adc, smdc, or pdc is actually defensible.",
        plausibleDirections: ["adc", "smdc", "target-conditioned pdc only if binder evidence is real"],
      };
    case "immune modulation":
      return {
        summary:
          "the retrieved evidence looks more immune-modulatory than classical payload-delivery biology.",
        rationale:
          "that usually pushes the planner away from default cytotoxic logic and toward non-cytotoxic, mechanism-matched strategies.",
        plausibleDirections: ["immune-modulatory targeting formats", "non-cytotoxic conjugate logic"],
      };
    case "radiobiology":
      return {
        summary:
          "the retrieved evidence points toward localization plus isotope effect as the real therapeutic engine.",
        rationale:
          "that makes radioconjugate logic plausible only if the target-retention and organ-exposure story can support it.",
        plausibleDirections: ["rdc", "radioligand localization strategies"],
      };
    case "enzyme/prodrug":
      return {
        summary:
          "the retrieved evidence suggests that local activation or catalytic chemistry may matter more than classical payload release.",
        rationale:
          "that keeps enzyme/prodrug strategies in play, but only if selectivity genuinely comes from local activation rather than the carrier alone.",
        plausibleDirections: ["enzyme conjugate", "local activation strategies"],
      };
    case "unknown":
    default:
      return {
        summary:
          "the retrieved evidence gives a disease-level read, but it still does not resolve one dominant therapeutic mechanism family.",
        rationale:
          "that means we can describe the biology and delivery constraints, but not responsibly name a final conjugate winner yet.",
        plausibleDirections: ["target-conditioned clarification", "delivery-handle clarification"],
      };
  }
}

export function inferMechanismFromEvidence(
  input: NormalizedCase,
  evidenceObjects: EvidenceObject[],
  fallbackGrounding?: DiseaseGrounding | null,
): MechanismInference {
  const scores = new Map<MechanismClass, number>([
    ["gene modulation", 0],
    ["pathway modulation", 0],
    ["cytotoxic delivery", 0],
    ["radiobiology", 0],
    ["enzyme/prodrug", 0],
    ["immune modulation", 0],
    ["unknown", 0],
  ]);

  const supportingEvidenceIds: string[] = [];
  const themes = new Set<string>();
  const nonMechanisticSupport = evidenceObjects.filter(
    (item) => item.direction === "supports" && item.mechanismHints.every((hint) => hint === "unknown"),
  );

  evidenceObjects.forEach((item) => {
    const signedWeight = DIRECTION_MAP[item.direction] * weightForStrength(item.strength);
    item.mechanismHints.forEach((hint) => {
      if (hint === "unknown") {
        return;
      }
      scores.set(hint, (scores.get(hint) ?? 0) + signedWeight);
      if (signedWeight > 0) {
        supportingEvidenceIds.push(item.id);
        item.themes.forEach((theme) => themes.add(theme));
      }
    });
  });

  const ranked = [...scores.entries()]
    .filter(([mechanism]) => mechanism !== "unknown")
    .sort((left, right) => right[1] - left[1]);

  const [winnerMechanism, winnerScore] = ranked[0] ?? ["unknown", 0];
  const [, runnerUpScore] = ranked[1] ?? ["unknown", 0];
  const leadGap = winnerScore - runnerUpScore;

  if (winnerScore <= 0 && nonMechanisticSupport.length) {
    const dominantThemes = Array.from(
      new Set(nonMechanisticSupport.flatMap((item) => item.themes).filter(Boolean)),
    ).slice(0, 4);
    const cnsDriven = dominantThemes.includes("cns / bbb") || dominantThemes.includes("neurodegeneration");

    return {
      mechanismClass: cnsDriven ? "pathway modulation" : "unknown",
      confidence: cnsDriven ? "medium" : "low",
      summary: cnsDriven
        ? "the retrieved evidence gives a real disease-level read: this looks like a chronic neurodegenerative cns case where blood-brain barrier access and non-cytotoxic biology are the main constraints."
        : "the retrieved evidence gives a disease-level read, but it still does not resolve one dominant therapeutic mechanism family.",
      rationale: cnsDriven
        ? "that means the planner should talk about transport-aware and non-warhead directions at high level, even if it still abstains from naming a final conjugate winner."
        : "that means we can describe the biology and delivery constraints, but not responsibly name a final conjugate winner yet.",
      plausibleDirections: cnsDriven
        ? ["bbb-shuttle logic", "small-format or transport-aware conjugate strategies", "non-cytotoxic pathway-matched architectures"]
        : ["target-conditioned clarification", "delivery-handle clarification"],
      themes: dominantThemes,
      supportingEvidenceIds: nonMechanisticSupport.map((item) => item.id).slice(0, 6),
      source: "evidence",
    };
  }

  if (winnerScore <= 0 && fallbackGrounding) {
    return {
      mechanismClass: fallbackGrounding.mechanismClass,
      confidence: fallbackGrounding.confidence,
      summary: fallbackGrounding.summary,
      rationale: fallbackGrounding.rationale,
      plausibleDirections: fallbackGrounding.plausibleDirections,
      themes: fallbackGrounding.themes,
      supportingEvidenceIds: [],
      source: "fallback-profile",
    };
  }

  if (winnerScore <= 0) {
    const unknownSummary = mechanismSummary("unknown");
    return {
      mechanismClass: input.mechanismClass,
      confidence: "low",
      summary: unknownSummary.summary,
      rationale: unknownSummary.rationale,
      plausibleDirections: unknownSummary.plausibleDirections,
      themes: [...themes].slice(0, 4),
      supportingEvidenceIds: [],
      source: "none",
    };
  }

  const confidence: MechanismInference["confidence"] =
    winnerScore >= 6 && leadGap >= 2 ? "high" : winnerScore >= 3 ? "medium" : "low";
  const summary = mechanismSummary(winnerMechanism as MechanismClass);

  return {
    mechanismClass: winnerMechanism as MechanismClass,
    confidence,
    summary: summary.summary,
    rationale: summary.rationale,
    plausibleDirections: summary.plausibleDirections,
    themes: [...themes].slice(0, 4),
    supportingEvidenceIds: supportingEvidenceIds.slice(0, 6),
    source: "evidence",
  };
}
