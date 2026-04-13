import { DiseaseGrounding, MechanismClass, NormalizedCase } from "./types";

type RetrievalHit = {
  title?: string;
  condition?: string;
  intervention?: string;
};

type GroundingConcept = {
  key: string;
  mechanismClass: MechanismClass;
  patterns: RegExp[];
  directions: string[];
  summary: string;
  rationale: string;
};

const GROUNDING_CONCEPTS: GroundingConcept[] = [
  {
    key: "gene-modulation",
    mechanismClass: "gene modulation",
    patterns: [
      /\b(antisense|oligonucleotide|oligo|sirna|aso|pmo|exon skipping|splice|splicing|splice-switching|rna|mrna|toxic rna|repeat expansion|knockdown|gene silencing|dux4)\b/i,
    ],
    directions: ["oligo conjugate", "aoc-style delivery", "productive intracellular routing"],
    summary:
      "the retrieved disease biology points more toward rna- or gene-modulation logic than toward classical released-warhead delivery.",
    rationale:
      "that makes oligo and delivery-handle strategies more biologically plausible than cytotoxic, radioligand, or enzyme/prodrug-first platforms.",
  },
  {
    key: "cns-barrier",
    mechanismClass: "unknown",
    patterns: [
      /\b(alzheimer'?s|parkinson'?s|huntington'?s|neurodegenerative|cns|central nervous system|brain|blood-brain barrier|bbb|neuronal|tau|amyloid|synuclein)\b/i,
    ],
    directions: [
      "bbb-shuttle or receptor-mediated transport logic",
      "small-format or cns-penetrant targeting strategies",
      "non-cytotoxic conjugate architectures",
    ],
    summary:
      "the retrieved disease biology reads like a cns / neurodegenerative context where blood-brain barrier access, chronic dosing, and non-oncology mechanism fit dominate the design problem.",
    rationale:
      "that makes default cytotoxic conjugate logic much less plausible, and it shifts attention toward transport-enabled, non-warhead, or target/pathway-modulating strategies.",
  },
  {
    key: "immune-modulation",
    mechanismClass: "immune modulation",
    patterns: [/\b(autoantibody|complement|immune|neutralizing|blocking|fcrn|b cell|t cell|autoimmune|inflammation)\b/i],
    directions: ["immune-modulatory targeting formats", "non-cytotoxic conjugate logic"],
    summary:
      "the retrieved biology is more immunologic than classical payload-delivery biology.",
    rationale:
      "that usually argues against default cytotoxic platforms and toward mechanism-matched, non-warhead strategies.",
  },
  {
    key: "cytotoxic-delivery",
    mechanismClass: "cytotoxic delivery",
    patterns: [/\b(cytotoxic|tumor kill|microtubule|topoisomerase|warhead|payload release|bystander|oncology)\b/i],
    directions: ["adc", "smdc", "pdc when binder evidence is real"],
    summary:
      "the retrieved biology reads more like targeted payload delivery than sequence rescue or local catalytic activation.",
    rationale:
      "that shifts the plausible space toward classical warhead-bearing conjugate classes if the target and internalization story can support them.",
  },
  {
    key: "radiobiology",
    mechanismClass: "radiobiology",
    patterns: [/\b(radioligand|radionuclide|lutetium|actinium|dosimetry|isotope|radiation)\b/i],
    directions: ["rdc", "radioligand localization strategies"],
    summary:
      "the retrieved biology points toward localization plus isotope effect rather than free small-molecule or oligo payload logic.",
    rationale:
      "that makes radioconjugate strategies more plausible if the target retention and organ-exposure story is favorable.",
  },
  {
    key: "enzyme-prodrug",
    mechanismClass: "enzyme/prodrug",
    patterns: [/\b(prodrug|enzyme activation|catalytic|local activation|protease activation)\b/i],
    directions: ["enzyme conjugate", "local activation strategies"],
    summary:
      "the retrieved biology suggests that local activation or catalytic chemistry may be more central than a standard released payload.",
    rationale:
      "that keeps enzyme/prodrug conjugate logic in play if selectivity really comes from local activation.",
  },
];

function collectText(normalizedCase: NormalizedCase, hits: RetrievalHit[]) {
  const parts = [
    normalizedCase.prompt,
    normalizedCase.disease?.canonical,
    normalizedCase.target?.canonical,
    ...hits.flatMap((hit) => [hit.title, hit.condition, hit.intervention]),
  ].filter(Boolean);
  return parts.join(" ").toLowerCase();
}

function scoreConcepts(corpus: string) {
  return GROUNDING_CONCEPTS.map((concept) => {
    const matchedPatterns = concept.patterns.filter((pattern) => pattern.test(corpus));
    return {
      concept,
      score: matchedPatterns.length,
      matchedPatterns,
    };
  }).sort((a, b) => b.score - a.score);
}

export function buildDiseaseGrounding(
  normalizedCase: NormalizedCase,
  hits: RetrievalHit[],
): DiseaseGrounding | null {
  if (normalizedCase.diseaseSpecificity !== "specific" || !normalizedCase.disease?.canonical) {
    return null;
  }

  const corpus = collectText(normalizedCase, hits);
  const rankedConcepts = scoreConcepts(corpus);
  const winner = rankedConcepts[0];

  if (!winner || winner.score === 0) {
    return null;
  }

  const confidence: DiseaseGrounding["confidence"] =
    winner.score >= 3 ? "high" : winner.score === 2 ? "medium" : "low";

  const supportingSignals = Array.from(
    new Set(
      winner.matchedPatterns
        .map((pattern) => pattern.source.replace(/^\//, "").replace(/\/i$/, ""))
        .slice(0, 4),
    ),
  );

  return {
    mechanismClass: winner.concept.mechanismClass,
    summary: winner.concept.summary,
    rationale: winner.concept.rationale,
    plausibleDirections: winner.concept.directions,
    themes: [winner.concept.key, ...supportingSignals].slice(0, 4),
    confidence,
    supportingSignals,
  };
}
