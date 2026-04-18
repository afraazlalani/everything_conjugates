import type {
  EvidenceObject,
  MechanismClass,
  ModalityName,
  NormalizedCase,
  RetrievedSourceBucket,
} from "./types";

type PatternDefinition = {
  theme: string;
  mechanism: MechanismClass;
  claim: string;
  rationale: string;
  direction: EvidenceObject["direction"];
  type: EvidenceObject["type"];
  patterns: RegExp[];
  modalityHints?: ModalityName[];
};

type AggregateDefinition = {
  theme: string;
  mechanism: MechanismClass;
  claim: string;
  rationale: string;
  type: EvidenceObject["type"];
  direction: EvidenceObject["direction"];
  patterns: RegExp[];
  minimumMatches: number;
  modalityHints?: ModalityName[];
};

const PATTERN_DEFINITIONS: PatternDefinition[] = [
  {
    theme: "gene modulation",
    mechanism: "gene modulation",
    claim: "retrieved biology points toward sequence-directed or rna-directed intervention logic.",
    rationale: "terms like antisense, sirna, splice switching, or toxic-rna correction usually mean the active species is the oligo scaffold itself.",
    direction: "supports",
    type: "disease mechanism",
    patterns: [/\b(antisense|sirna|oligo|oligonucleotide|splice|splicing|exon skipping|rna|mrna|toxic rna|repeat expansion|knockdown|dux4)\b/i],
    modalityHints: ["oligo conjugate"],
  },
  {
    theme: "cns / bbb",
    mechanism: "pathway modulation",
    claim: "retrieved biology highlights a cns and blood-brain barrier delivery problem.",
    rationale: "brain, neuronal, amyloid, tau, and bbb language usually means transport and exposure constraints dominate early modality fit.",
    direction: "supports",
    type: "delivery constraint",
    patterns: [/\b(alzheimer'?s|parkinson'?s|huntington'?s|neurodegenerative|cns|central nervous system|brain|blood-brain barrier|bbb|neuronal|tau|amyloid|synuclein)\b/i],
  },
  {
    theme: "neurodegeneration",
    mechanism: "pathway modulation",
    claim: "retrieved biology reads like chronic neurodegenerative disease rather than oncology payload-delivery biology.",
    rationale: "that shifts the design space toward transport-aware, non-cytotoxic, and pathway-matched strategies even before a target-conditioned construct is chosen.",
    direction: "supports",
    type: "disease mechanism",
    patterns: [/\b(alzheimer'?s|parkinson'?s|huntington'?s|neurodegenerative|amyloid|tau|neuronal)\b/i],
  },
  {
    theme: "immune biology",
    mechanism: "immune modulation",
    claim: "retrieved biology looks more immune-modulatory than classical payload-delivery biology.",
    rationale: "autoimmune, complement, immune, or blocking language usually argues for non-cytotoxic mechanism-matched strategies.",
    direction: "supports",
    type: "disease mechanism",
    patterns: [/\b(autoimmune|immune|complement|blocking|neutralizing|autoantibody|fcrn|b cell|t cell)\b/i],
  },
  {
    theme: "oncology payload delivery",
    mechanism: "cytotoxic delivery",
    claim: "retrieved evidence describes tumor-directed payload delivery logic.",
    rationale: "oncology, tumor kill, and payload-release language support classical warhead-bearing conjugate architectures.",
    direction: "supports",
    type: "modality precedent",
    patterns: [/\b(oncology|breast cancer|lung cancer|ovarian cancer|colorectal cancer|solid tumor|metastatic|tumou?r|carcinoma|payload release|warhead|bystander|cytotoxic)\b/i],
    modalityHints: ["adc", "smdc", "pdc"],
  },
  {
    theme: "radiobiology",
    mechanism: "radiobiology",
    claim: "retrieved evidence points toward localization plus isotope effect as the core therapeutic mechanism.",
    rationale: "radioligand and dosimetry language usually means the payload logic is radiometal delivery rather than released free drug.",
    direction: "supports",
    type: "mechanism support",
    patterns: [/\b(radioligand|radionuclide|lutetium|actinium|dosimetry|isotope|radiation)\b/i],
    modalityHints: ["rdc"],
  },
  {
    theme: "enzyme / prodrug",
    mechanism: "enzyme/prodrug",
    claim: "retrieved evidence points toward local activation or catalytic chemistry.",
    rationale: "prodrug, catalytic, or enzyme activation language is one of the few cases where enzyme conjugate logic is a true mechanistic fit.",
    direction: "supports",
    type: "mechanism support",
    patterns: [/\b(prodrug|catalytic|enzyme activation|local activation|protease activation)\b/i],
    modalityHints: ["enzyme conjugate"],
  },
  {
    theme: "no selective target yet",
    mechanism: "unknown",
    claim: "the current evidence still does not identify a selective accessible target or entry handle.",
    rationale: "disease-only prompts without target-conditioned hits should keep adc, smdc, and peptide logic softer.",
    direction: "penalizes",
    type: "target context",
    patterns: [/\b(disease|pathogenesis|biology|mechanism)\b/i],
    modalityHints: ["adc", "smdc", "pdc"],
  },
];

const AGGREGATE_DEFINITIONS: AggregateDefinition[] = [
  {
    theme: "cns / bbb",
    mechanism: "pathway modulation",
    claim: "the retrieved disease literature consistently frames this as a cns / blood-brain barrier delivery problem.",
    rationale: "multiple retrieved biology hits point toward brain access and exposure constraints as core design limits, so disease-level conjugate guidance should reflect transport-aware logic.",
    type: "delivery constraint",
    direction: "supports",
    patterns: [/\b(alzheimer'?s|neurodegenerative|brain|neuronal|blood-brain barrier|bbb|cns)\b/i],
    minimumMatches: 2,
  },
  {
    theme: "neurodegeneration",
    mechanism: "pathway modulation",
    claim: "the retrieved disease evidence reads like chronic neurodegeneration rather than oncology payload-delivery biology.",
    rationale: "that shifts the plausible class space toward pathway-matched and non-cytotoxic strategies rather than default released-warhead logic.",
    type: "disease mechanism",
    direction: "supports",
    patterns: [/\b(alzheimer'?s|amyloid|tau|synapse|neuronal|neurodegenerative)\b/i],
    minimumMatches: 2,
  },
  {
    theme: "transport-aware implications",
    mechanism: "pathway modulation",
    claim: "retrieved evidence implies that transport-aware or shuttle-like logic matters more than classical free-payload release.",
    rationale: "when the biology is cns-constrained and chronic, disease-level recommendations should stay centered on transport, exposure, and pathway modulation.",
    type: "delivery constraint",
    direction: "supports",
    patterns: [/\b(bbb|blood-brain barrier|transport|brain uptake|cns delivery|neuronal uptake)\b/i],
    minimumMatches: 2,
  },
  {
    theme: "chronic non-oncology",
    mechanism: "pathway modulation",
    claim: "the retrieved disease context looks chronic and non-oncologic, which softens classical cytotoxic payload logic.",
    rationale: "repeat-dosing and tolerability constraints should stay central in disease-level conjugate guidance for this case.",
    type: "delivery constraint",
    direction: "supports",
    patterns: [/\b(chronic|neurodegenerative|progressive|disease biology|pathogenesis)\b/i],
    minimumMatches: 2,
    modalityHints: ["adc", "pdc", "smdc"],
  },
];

const DEBUG_THEME_NAMES = [
  "cns / bbb",
  "neurodegeneration",
  "transport-aware implications",
  "chronic non-oncology",
] as const;

function strengthFromBucket(bucket: RetrievedSourceBucket["key"]): EvidenceObject["strength"] {
  if (bucket === "biology reviews" || bucket === "clinical context") return "high";
  if (bucket === "disease biology" || bucket === "biology literature" || bucket === "modality literature") return "medium";
  return "low";
}

function compactText(value?: string) {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function hasCorpusTheme(evidence: EvidenceObject[], theme: string) {
  return evidence.some((item) => item.origin === "corpus" && item.themes.includes(theme));
}

function makeId(bucket: RetrievedSourceBucket["key"], label: string, index: number) {
  return `${bucket}:${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48)}:${index}`;
}

function buildAggregateEvidence(
  input: NormalizedCase,
  sourceBuckets: RetrievedSourceBucket[],
): EvidenceObject[] {
  const bucketItems = [
    {
      bucketKey: "biology literature" as const,
      text: `${input.prompt} ${input.disease?.canonical ?? ""}`,
      label: input.disease?.canonical ?? input.prompt,
    },
    {
      bucketKey: "biology literature" as const,
      text: input.prompt,
      label: input.prompt,
    },
    {
      bucketKey: "biology literature" as const,
      text: input.disease?.canonical ?? "",
      label: input.disease?.canonical ?? input.prompt,
    },
    {
      bucketKey: "biology literature" as const,
      text: `${input.disease?.canonical ?? ""} ${input.diseaseArea} ${input.mechanismClass} ${input.parsed.mechanismHints.join(" ")}`.trim(),
      label: "normalized disease context",
    },
    ...sourceBuckets.flatMap((bucket) =>
      bucket.items.map((item) => ({
        bucketKey: bucket.key,
        text: `${input.prompt} ${input.disease?.canonical ?? ""} ${item.label} ${item.snippet ?? ""}`,
        label: item.label,
      })),
    ),
  ];

  return AGGREGATE_DEFINITIONS.flatMap((definition) => {
    const matchedItems = bucketItems.filter((item) =>
      definition.patterns.some((pattern) => pattern.test(item.text)),
    );

    if (matchedItems.length < definition.minimumMatches) {
      return [];
    }

    return [
      {
        id: `aggregate:${definition.theme.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        type: definition.type,
        label: definition.theme,
        claim: definition.claim,
        rationale: definition.rationale,
        direction: definition.direction,
        strength: matchedItems.length >= definition.minimumMatches + 1 ? "high" : "medium",
        mechanismHints: [definition.mechanism],
        themes: [definition.theme],
        sourceBucket: matchedItems[0]?.bucketKey ?? "biology literature",
        sourceLabels: matchedItems.slice(0, 3).map((item) => compactText(item.label)),
        origin: "synthetic aggregate",
        modalityHints: definition.modalityHints,
      },
    ];
  });
}

export function buildEvidenceObjects(
  input: NormalizedCase,
  sourceBuckets: RetrievedSourceBucket[],
): EvidenceObject[] {
  const evidence: EvidenceObject[] = [];
  const seenClaims = new Set<string>();

  buildAggregateEvidence(input, sourceBuckets).forEach((item) => {
    evidence.push(item);
    seenClaims.add(`${item.label}|${item.sourceBucket}|${item.sourceLabels.join("|")}`);
  });

  sourceBuckets.forEach((bucket) => {
    bucket.items.forEach((item, index) => {
      const corpus = `${input.prompt} ${input.disease?.canonical ?? ""} ${input.target?.canonical ?? ""} ${item.label} ${item.snippet ?? ""}`;

      PATTERN_DEFINITIONS.forEach((definition) => {
        if (!definition.patterns.some((pattern) => pattern.test(corpus))) {
          return;
        }

        const key = `${definition.theme}|${bucket.key}|${item.label}`;
        if (seenClaims.has(key)) {
          return;
        }

        seenClaims.add(key);
        evidence.push({
          id: makeId(bucket.key, item.label, index),
          type: definition.type,
          label: definition.theme,
          claim: definition.claim,
          rationale: definition.rationale,
          direction: definition.direction,
          strength: strengthFromBucket(bucket.key),
          mechanismHints: [definition.mechanism],
          themes: [definition.theme],
          sourceBucket: bucket.key,
          sourceLabels: [compactText(item.label)],
          origin: "corpus",
          modalityHints: definition.modalityHints,
        });
      });
    });
  });

  if (input.disease?.canonical && input.diseaseSpecificity === "specific") {
    evidence.push({
      id: `named-disease:${input.disease.canonical.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      type: "disease mechanism",
      label: "named disease recognized",
      claim: `the prompt names ${input.disease.canonical} as a specific disease rather than a broad family.`,
      rationale: "specific named diseases should get a disease-level mechanistic read even if target-conditioned ranking is still premature.",
      direction: "supports",
      strength: "medium",
      mechanismHints: [input.mechanismClass],
      themes: ["named disease"],
      sourceBucket: "biology literature",
      sourceLabels: [input.disease.canonical],
      origin: "synthetic aggregate",
    });
  }

  if (input.disease?.canonical && input.diseaseSpecificity === "specific" && input.diseaseArea === "other") {
    evidence.push({
      id: `disease-level-read:${input.disease.canonical.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      type: "disease mechanism",
      label: "specific disease biology needs live grounding",
      claim: `this is a named disease prompt for ${input.disease.canonical}, so disease-level biology should still be interpreted even before a target is specified.`,
      rationale: "named diseases should not collapse all the way to the same state as broad family prompts when retrieval gives usable biology themes.",
      direction: "supports",
      strength: "medium",
      mechanismHints: ["unknown"],
      themes: ["named disease", "disease-level grounding"],
      sourceBucket: "biology literature",
      sourceLabels: [input.disease.canonical],
      origin: "synthetic aggregate",
    });
  }

  if (!input.target?.canonical) {
    evidence.push({
      id: "missing-target-context",
      type: "target context",
      label: "missing target context",
      claim: "the prompt does not yet specify a target or entry handle.",
      rationale: "that should soften target-dependent classes and push the planner toward disease-level or provisional guidance.",
      direction: "penalizes",
      strength: "high",
      mechanismHints: ["unknown"],
      themes: ["target missing"],
      sourceBucket: "fallback profile",
      sourceLabels: ["prompt structure"],
      origin: "fallback",
      modalityHints: ["adc", "smdc", "pdc"],
    });
  }

  const hasCorpusCnsTheme = hasCorpusTheme(evidence, "cns / bbb");
  const hasCorpusNeurodegenerationTheme = hasCorpusTheme(evidence, "neurodegeneration");

  if ((hasCorpusCnsTheme || hasCorpusNeurodegenerationTheme) && input.diseaseArea !== "oncology") {
    evidence.push({
      id: "disease-level-chronic-non-oncology-context",
      type: "delivery constraint",
      label: "chronic non-oncology context",
      claim: "the retrieved disease biology reads like a chronic non-oncology setting where tolerability and repeat exposure matter.",
      rationale: "once the corpus already supports cns or neurodegenerative disease biology, the planner should carry that chronic non-cytotoxic context as part of the evidence read instead of only as a fallback assumption.",
      direction: "supports",
      strength: "medium",
      mechanismHints: ["pathway modulation"],
      themes: ["chronic dosing", "non-oncology"],
      sourceBucket: "disease biology",
      sourceLabels: evidence
        .filter((item) => item.origin === "corpus" && (item.themes.includes("cns / bbb") || item.themes.includes("neurodegeneration")))
        .flatMap((item) => item.sourceLabels)
        .slice(0, 3),
      origin: "synthetic aggregate",
      modalityHints: ["adc", "pdc", "smdc"],
    });
  } else if (input.chronicContext && input.diseaseArea !== "oncology") {
    evidence.push({
      id: "chronic-non-oncology-context",
      type: "delivery constraint",
      label: "chronic non-oncology context",
      claim: "the retrieved and normalized case points to a chronic non-oncology treatment setting.",
      rationale: "that should keep cytotoxic warhead logic softer and make tolerability and repeat dosing part of the disease-level read.",
      direction: "supports",
      strength: "high",
      mechanismHints: ["unknown"],
      themes: ["chronic dosing", "non-oncology"],
      sourceBucket: "fallback profile",
      sourceLabels: ["normalized case context"],
      origin: "fallback",
      modalityHints: ["adc", "pdc", "smdc"],
    });
  }

  if (evidence.some((item) => item.themes.includes("cns / bbb"))) {
    evidence.push({
      id: "cns-implications",
      type: "delivery constraint",
      label: "transport-aware implications",
      claim: "the disease-level biology implies transport-aware, bbb-aware, and non-cytotoxic strategy constraints.",
      rationale: "for cns disease prompts, disease grounding should talk about barrier access, exposure, and pathway modulation rather than acting like the biology is blank.",
      direction: "supports",
      strength: "high",
      mechanismHints: ["pathway modulation"],
      themes: ["cns / bbb", "transport-aware implications", "non-cytotoxic"],
      sourceBucket: "biology literature",
      sourceLabels: evidence
        .filter((item) => item.themes.includes("cns / bbb"))
        .flatMap((item) => item.sourceLabels)
        .slice(0, 3),
      origin: "synthetic aggregate",
    });
  }

  return evidence;
}

export function buildThemeDiagnostics(
  input: NormalizedCase,
  sourceBuckets: RetrievedSourceBucket[],
  evidenceObjects: EvidenceObject[],
) {
  const relevantDefinitions = [
    ...PATTERN_DEFINITIONS.filter((item) =>
      DEBUG_THEME_NAMES.includes(item.theme as (typeof DEBUG_THEME_NAMES)[number]),
    ),
    ...AGGREGATE_DEFINITIONS.filter((item) =>
      DEBUG_THEME_NAMES.includes(item.theme as (typeof DEBUG_THEME_NAMES)[number]),
    ),
  ];

  const corpusItems = sourceBuckets
    .filter((bucket) => bucket.key === "disease biology" || bucket.key === "biology literature" || bucket.key === "biology reviews")
    .flatMap((bucket) =>
      bucket.items.map((item) => ({
        label: item.label,
        text: `${input.prompt} ${input.disease?.canonical ?? ""} ${item.label} ${item.snippet ?? ""}`,
      })),
    );

  return DEBUG_THEME_NAMES.map((theme) => {
    const definitions = relevantDefinitions.filter((item) => item.theme === theme);
    const matchedCorpusItems = corpusItems.filter((item) =>
      definitions.some((definition) => definition.patterns.some((pattern) => pattern.test(item.text))),
    );
    const matchedObjects = evidenceObjects.filter((item) => item.themes.includes(theme));

    return {
      theme,
      corpusMatches: matchedCorpusItems.length,
      syntheticAggregateObjects: matchedObjects.filter((item) => item.origin === "synthetic aggregate").length,
      fallbackObjects: matchedObjects.filter((item) => item.origin === "fallback").length,
      matched: matchedCorpusItems.length > 0 || matchedObjects.length > 0,
      sourceLabels: matchedCorpusItems.slice(0, 4).map((item) => compactText(item.label)),
    };
  });
}
