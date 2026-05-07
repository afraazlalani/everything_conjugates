import {
  BiologicalAbstraction,
  DiseaseExploration,
  DiseaseExplorationStrategyBucket,
  EvidenceObject,
  MechanismInference,
  NormalizedCase,
} from "./types";

function uniqueStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function findEvidenceIds(
  evidenceObjects: EvidenceObject[],
  matcher: (item: EvidenceObject) => boolean,
): string[] {
  return evidenceObjects
    .filter(matcher)
    .map((item) => item.id)
    .slice(0, 4);
}

function textIncludesAny(value: string | undefined, patterns: RegExp[]): boolean {
  const source = value ?? "";
  return patterns.some((pattern) => pattern.test(source));
}

function evidenceMentions(
  evidenceObjects: EvidenceObject[],
  patterns: RegExp[],
): boolean {
  return evidenceObjects.some((item) =>
    textIncludesAny(
      [
        item.label,
        item.claim,
        item.rationale,
        ...item.mechanismHints,
        ...item.themes,
        ...item.sourceLabels,
        ...(item.modalityHints ?? []),
      ].join(" "),
      patterns,
    ),
  );
}

function buildConstraintList(abstraction: BiologicalAbstraction): string[] {
  return uniqueStrings([
    abstraction.deliveryAccessibility === "barrier-limited" ? "bbb / barrier-limited exposure" : undefined,
    abstraction.deliveryAccessibility === "intracellular difficult" ? "productive intracellular routing" : undefined,
    abstraction.compartmentNeed === "nuclear" ? "nuclear access" : undefined,
    abstraction.compartmentNeed === "cytosolic" ? "cytosolic delivery" : undefined,
    abstraction.compartmentNeed === "extracellular" ? "extracellular accessibility" : undefined,
    abstraction.compartmentNeed === "mixed" ? "mixed compartment biology" : undefined,
    abstraction.treatmentContext === "chronic" ? "chronic dosing tolerability" : undefined,
    abstraction.pathologyType === "neurodegeneration" ? "neurodegeneration / cns biology" : undefined,
    abstraction.pathologyType === "autoimmune/inflammatory" ? "immune-inflammatory selectivity" : undefined,
    abstraction.pathologyType === "mixed" ? "mixed inflammatory + degenerative biology" : undefined,
    abstraction.pathologyType === "oncology" ? "tumor selectivity and target window" : undefined,
    abstraction.cytotoxicFit === "discouraged" ? "non-cytotoxic fit" : undefined,
    ...(abstraction.cellProcessingGates ?? []).slice(0, 2),
    ...(abstraction.microenvironmentPressures ?? []).slice(0, 2),
  ]);
}

function buildBucket(
  bucket: DiseaseExplorationStrategyBucket,
  abstraction: BiologicalAbstraction,
): DiseaseExplorationStrategyBucket {
  return {
    ...bucket,
    diseaseSpecificConstraints: uniqueStrings([
      ...bucket.diseaseSpecificConstraints,
      ...buildConstraintList(abstraction),
    ]).slice(0, 4),
  };
}

function addBucket(
  buckets: DiseaseExplorationStrategyBucket[],
  bucket: DiseaseExplorationStrategyBucket,
): void {
  if (buckets.some((item) => item.label === bucket.label)) {
    return;
  }

  buckets.push(bucket);
}

function prioritizeStrategyBuckets(
  buckets: DiseaseExplorationStrategyBucket[],
  options: {
    antibodyMediatedAutoimmune: boolean;
  },
): DiseaseExplorationStrategyBucket[] {
  if (!options.antibodyMediatedAutoimmune) {
    return buckets;
  }

  const priorityByLabel: Record<string, number> = {
    "fcRn / igg-lowering strategy": 1,
    "complement-pathway modulation": 2,
    "antigen-specific immune modulation / tolerance": 3,
    "b-cell / plasma-cell modulation": 4,
    "non-cytotoxic immune-targeted modulation": 5,
    "immune-modulatory targeted delivery": 5,
    "non-cytotoxic pathway-matched targeting": 6,
    "extracellular neutralization / localization": 7,
    "classical cytotoxic conjugates are a weak-fit comparator": 98,
  };

  return [...buckets].sort((left, right) => {
    const leftPriority = priorityByLabel[left.label] ?? 50;
    const rightPriority = priorityByLabel[right.label] ?? 50;
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
    return left.label.localeCompare(right.label);
  });
}

function buildAntigenSpecificAutoimmuneBucket(
  abstraction: BiologicalAbstraction,
  evidenceObjects: EvidenceObject[],
  hasDirectSignal: boolean,
): DiseaseExplorationStrategyBucket {
  return buildBucket(
    {
      label: "antigen-specific immune modulation / tolerance",
      whyPlausible: hasDirectSignal
        ? "the disease biology points toward a receptor or autoantigen-focused autoimmune handle, so antigen-specific modulation or tolerance should stay visible as a distinct higher-specificity lane."
        : "the disease frame is antibody-mediated enough that antigen-specific modulation or tolerance should stay visible as a higher-risk conditional lane if a tractable autoantigen or receptor handle can be defined.",
      entryHandleLogic:
        "this bucket needs a real autoantigen, receptor, or antigen-presenting-cell entry handle that can bias the immune intervention toward the pathogenic antigen context rather than broad systemic suppression.",
      requiredAssumptions: [
        hasDirectSignal
          ? "one named autoantigen or receptor is central enough to organize the disease biology"
          : "a tractable autoantigen or receptor handle can actually be identified for the disease setting",
        "antigen-specific modulation can be delivered without losing too much selectivity or tolerability",
      ],
      mainFailureMode:
        "this bucket is high-risk because it collapses if the antigen handle is incomplete, too heterogeneous, or not selective enough to outperform broader immune strategies.",
      diseaseSpecificConstraints: [
        "antigen-specific autoimmune logic",
        "non-cytotoxic fit",
        "chronic tolerability",
      ],
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          textIncludesAny(
            [item.label, item.claim, item.rationale, ...item.themes].join(" "),
            [/\bachr\b/i, /acetylcholine receptor/i, /\bmusk\b/i, /\blrp4\b/i, /\bdesmoglein\b/i],
          ),
      ),
      suggestedModalities: ["pdc", "oligo conjugate", "adc"],
    },
    abstraction,
  );
}

function buildDiseaseFrame(
  input: NormalizedCase,
  abstraction: BiologicalAbstraction,
  mechanismInference: MechanismInference,
  options: {
    interpretationMode: "tentative" | "grounded";
  },
): string {
  const diseaseLabel = input.disease?.canonical ?? input.parsed.diseaseMention ?? "this disease";
  const promptText = `${input.prompt} ${input.parsed.cleanedPrompt}`.toLowerCase();
  const neuromuscularGeneModulationCase =
    input.diseaseArea === "neuromuscular" &&
    abstraction.pathologyType === "genetic/rna-driven" &&
    abstraction.therapeuticIntent === "gene/rna modulation";
  const spliceCorrectionCase =
    abstraction.therapeuticIntent === "gene/rna modulation" &&
    abstraction.compartmentNeed === "nuclear" &&
    /\bsplice\b|\bexon\b|transcript correction|transcript rescue|splice-switching|exon skipping|exon-skipping|51st exon|exon 51/.test(
      promptText,
    );
  const parts = [
    abstraction.pathologyType !== "unknown" ? abstraction.pathologyType : undefined,
    abstraction.therapeuticIntent !== "unknown" ? abstraction.therapeuticIntent : undefined,
    abstraction.deliveryAccessibility !== "unknown" ? abstraction.deliveryAccessibility : undefined,
  ].filter(Boolean);

  const lead =
    spliceCorrectionCase
      ? `${diseaseLabel} currently reads like a nuclear splice-correction / oligo-delivery case rather than a broad disease-level targeting problem.`
      : neuromuscularGeneModulationCase
      ? `${diseaseLabel} currently reads like a neuromuscular gene/rna modulation case where the real design job is getting an active transcript-modulating cargo into muscle with productive intracellular routing.`
      : parts.length > 0
      ? `${diseaseLabel} currently reads like a ${parts.join(" / ")} case.`
      : `${diseaseLabel} has enough disease-level biology to explore strategy buckets, even though the final construct choice is still open.`;

  const mechanismNote =
    mechanismInference.mechanismClass !== "unknown"
      ? ` the current mechanism read leans toward ${mechanismInference.mechanismClass}.`
      : "";

  const barrierNote =
    abstraction.deliveryBarriers.length > 0
      ? ` the main delivery constraints right now are ${abstraction.deliveryBarriers.join(", ")}.`
      : "";

  const tentativeLead = lead
    .replace(/\bcurrently reads like\b/i, "looks most like")
    .replace(/\bhas enough disease-level biology to explore strategy buckets, even though the final construct choice is still open\./i, "gives enough signal for a provisional strategy read, but not enough to collapse to one mechanism or build yet.");

  return (
    options.interpretationMode === "tentative"
      ? `based on the prompt alone, i’m provisionally reading it this way: ${tentativeLead.toLowerCase()}${mechanismNote}${barrierNote}`
      : `${lead}${mechanismNote}${barrierNote}`
  ).trim();
}

function buildUnderstandingSignals(
  input: NormalizedCase,
  abstraction: BiologicalAbstraction,
  mechanismInference: MechanismInference,
): string[] {
  return uniqueStrings([
    input.disease?.canonical ? `recognized disease: ${input.disease.canonical}` : undefined,
    input.target?.canonical ? `recognized target: ${input.target.canonical}` : undefined,
    input.parsed.mechanismHints.length ? `prompt hints: ${input.parsed.mechanismHints.slice(0, 3).join(", ")}` : undefined,
    abstraction.pathologyType !== "unknown" ? `biology read: ${abstraction.pathologyType}` : undefined,
    abstraction.therapeuticIntent !== "unknown" ? `therapeutic read: ${abstraction.therapeuticIntent}` : undefined,
    abstraction.deliveryAccessibility !== "unknown" ? `delivery read: ${abstraction.deliveryAccessibility}` : undefined,
    mechanismInference.mechanismClass !== "unknown" ? `mechanism inference: ${mechanismInference.mechanismClass}` : undefined,
  ]).slice(0, 4);
}

function getInterpretationMode(
  input: NormalizedCase,
  abstraction: BiologicalAbstraction,
  mechanismInference: MechanismInference,
  evidenceObjects: EvidenceObject[],
): "tentative" | "grounded" {
  const promptWords = input.parsed.cleanedPrompt.trim().split(/\s+/).filter(Boolean).length;
  const explicitPromptSignals =
    Number(Boolean(input.target?.canonical)) +
    Number(Boolean(input.parsed.mechanismHints.length)) +
    Number(Boolean(input.parsed.mentionedModalities.length));
  const strongEvidenceSignals = evidenceObjects.filter(
    (item) => item.direction === "supports" && item.origin !== "fallback",
  ).length;

  if (input.recommendationScope === "target-conditioned" && input.target?.canonical) {
    return "grounded";
  }

  if (
    promptWords <= 8 &&
    !input.target?.canonical &&
    input.parsed.mechanismHints.length === 0
  ) {
    return "tentative";
  }

  if (
    explicitPromptSignals <= 1 &&
    strongEvidenceSignals < 3 &&
    mechanismInference.confidence !== "high" &&
    abstraction.source !== "evidence-driven"
  ) {
    return "tentative";
  }

  return "grounded";
}

function buildStrategyBuckets(
  input: NormalizedCase,
  abstraction: BiologicalAbstraction,
  mechanismInference: MechanismInference,
  evidenceObjects: EvidenceObject[],
): DiseaseExplorationStrategyBucket[] {
  const buckets: DiseaseExplorationStrategyBucket[] = [];
  const promptText = `${input.prompt} ${input.parsed.cleanedPrompt}`.toLowerCase();
  const diseaseCanonicalLower = input.disease?.canonical?.toLowerCase() ?? "";
  const isNeuroBarrierCase = Boolean(
    abstraction.pathologyType === "neurodegeneration" ||
    abstraction.deliveryAccessibility === "barrier-limited" ||
    abstraction.deliveryBarriers.some((item) => /bbb|blood-brain|cns/i.test(item)),
  );
  const hasGeneOrTranscriptSignals = Boolean(
    abstraction.therapeuticIntent === "gene/rna modulation" ||
    abstraction.compartmentNeed === "nuclear" ||
    abstraction.compartmentNeed === "cytosolic" ||
    abstraction.mechanismLocation === "intracellular" ||
    mechanismInference.mechanismClass === "gene modulation" ||
    evidenceMentions(evidenceObjects, [
      /\bgene modulation\b/i,
      /\brna\b/i,
      /\boligo/i,
      /\btranscript\b/i,
      /\bsplice\b/i,
      /\bexon\b/i,
    ])
  );
  const hasExtracellularNeuroSignals = Boolean(
    abstraction.targetClass === "soluble/extracellular factor" ||
    abstraction.compartmentNeed === "extracellular" ||
    abstraction.mechanismLocation === "extracellular" ||
    evidenceMentions(evidenceObjects, [
      /\bextracellular\b/i,
      /\bsoluble\b/i,
      /\baggregate\b/i,
      /\bplaque\b/i,
      /\bspreading\b/i,
      /\binterception\b/i,
    ])
  );
  const hasNeuroTranscriptLaneSignals = Boolean(
    hasGeneOrTranscriptSignals ||
    evidenceMentions(evidenceObjects, [
      /\bamyloid\b/i,
      /\btau\b/i,
      /\bsynuclein\b/i,
      /\blrrk2\b/i,
      /\btranscript\b/i,
      /\bgene\b/i,
      /\bexpression\b/i,
      /\bproteostasis\b/i,
    ])
  );
  const hasProteostasisSignals = evidenceMentions(evidenceObjects, [
    /\bmitochond/i,
    /\bproteostasis\b/i,
    /\bautophagy\b/i,
    /\blysosom/i,
    /\baggregat/i,
    /\bneuroinflamm/i,
  ]);
  const hasMitochondrialSignals = evidenceMentions(evidenceObjects, [
    /\bmitochond/i,
    /\boxidative stress\b/i,
    /\bmitophagy\b/i,
  ]);
  const hasAutophagySignals = evidenceMentions(evidenceObjects, [
    /\bautophagy\b/i,
    /\blysosom/i,
    /\bproteostasis\b/i,
    /\baggregate\b/i,
  ]);
  const hasAtrophyOrRemodelingSignals = evidenceMentions(evidenceObjects, [
    /\batrophy\b/i,
    /\bwasting\b/i,
    /\bfibrosis\b/i,
    /\bremodel/i,
  ]);
  const hasNeuroCellTypeSignals = evidenceMentions(evidenceObjects, [
    /\bneuron/i,
    /\bneuronal\b/i,
    /\bmicroglia/i,
    /\bglia\b/i,
    /\bastrocyte/i,
    /\bdopaminergic\b/i,
    /\bcell-type\b/i,
  ]);
  const hasSpliceCorrectionSignals = Boolean(
    abstraction.therapeuticIntent === "gene/rna modulation" &&
    abstraction.compartmentNeed === "nuclear" &&
    (
      /\bsplice\b|\bexon\b|transcript correction|transcript rescue|splice-switching|exon skipping|exon-skipping|51st exon|exon 51/.test(
        promptText,
      ) ||
      evidenceMentions(evidenceObjects, [
        /\bsplice\b/i,
        /\bexon\b/i,
        /transcript correction/i,
        /splice-switch/i,
        /exon skipping/i,
        /\bpmo\b/i,
        /\baso\b/i,
      ])
    )
  );
  const isMuscleDeliveryContext = Boolean(
    input.diseaseArea === "neuromuscular" ||
    /\bmuscle\b|\bduchenne\b|\bdmd\b|\bmyotonic\b|\bmyositis\b|\bmyopathy\b/.test(promptText),
  );
  const hasNeuromuscularOligoFamilySignals = Boolean(
    !hasSpliceCorrectionSignals &&
      isMuscleDeliveryContext &&
      input.diseaseArea === "neuromuscular" &&
      abstraction.pathologyType === "genetic/rna-driven" &&
      abstraction.therapeuticIntent === "gene/rna modulation",
  );
  const isMixedPathologyCase = Boolean(
    abstraction.pathologyType === "mixed" ||
    (
      abstraction.treatmentContext === "chronic" &&
      abstraction.cytotoxicFit === "discouraged" &&
      (
        (abstraction.therapeuticIntent === "immune modulation" && (hasProteostasisSignals || hasAtrophyOrRemodelingSignals || isMuscleDeliveryContext)) ||
        (hasMitochondrialSignals && hasAutophagySignals) ||
        (isMuscleDeliveryContext && (hasProteostasisSignals || hasMitochondrialSignals || hasAtrophyOrRemodelingSignals))
      )
    )
  );
  const isAutoimmuneCase = abstraction.pathologyType === "autoimmune/inflammatory";
  const hasAntibodyMediatedSignals = Boolean(
    isAutoimmuneCase &&
      (
        evidenceMentions(evidenceObjects, [
          /\bpathogenic igg\b/i,
          /\bautoantibody\b/i,
          /\bfcrn\b/i,
          /\bmyasthenia gravis\b/i,
          /\bpemphigus\b/i,
          /\bantibody-mediated\b/i,
          /\bautoimmune neuropath/i,
          /\bcidp\b/i,
        ]) ||
        /\b(myasthenia gravis|pemphigus|cidp|guillain-barre|autoimmune neuropath)/.test(promptText) ||
        /\b(myasthenia gravis|pemphigus|cidp|guillain-barre|autoimmune neuropath)/.test(diseaseCanonicalLower)
      )
  );
  const hasComplementSignals = Boolean(
    isAutoimmuneCase &&
      (
        evidenceMentions(evidenceObjects, [
          /\bcomplement\b/i,
          /\bc5\b/i,
          /\bc3\b/i,
          /\bmembrane attack complex\b/i,
        ]) ||
        /\bmyasthenia gravis\b/.test(promptText) ||
        /\bmyasthenia gravis\b/.test(diseaseCanonicalLower)
      )
  );
  const hasAntigenSpecificAutoimmuneSignals = Boolean(
    isAutoimmuneCase &&
      (
        evidenceMentions(evidenceObjects, [
          /\bachr\b/i,
          /acetylcholine receptor/i,
          /\bmusk\b/i,
          /\blrp4\b/i,
          /\bdesmoglein\b/i,
          /\baquaporin-4\b/i,
          /\bcaspr2\b/i,
          /\blgi1\b/i,
        ]) ||
        /\bmyasthenia gravis\b/.test(promptText) ||
        /\bmyasthenia gravis\b/.test(diseaseCanonicalLower) ||
        /\b(myasthenia gravis|pemphigus|neuromyelitis optica|autoimmune encephalitis)\b/.test(diseaseCanonicalLower)
      )
  );
  const hasBCellOrPlasmaSignals = Boolean(
    isAutoimmuneCase &&
      (
        evidenceMentions(evidenceObjects, [
          /\bb cell\b/i,
          /\bb-cell\b/i,
          /\bplasma cell\b/i,
          /\bplasmablast\b/i,
          /\bcd19\b/i,
          /\bcd20\b/i,
          /\bbcma\b/i,
        ]) ||
        /\b(lupus|pemphigus)\b/.test(promptText) ||
        /\b(systemic lupus erythematosus|lupus|pemphigus)\b/.test(diseaseCanonicalLower)
      )
  );

  if (isNeuroBarrierCase) {
    addBucket(
      buckets,
      buildBucket(
        {
          label: hasNeuroTranscriptLaneSignals
            ? "bbb-shuttled oligo / gene-modulation delivery"
            : "bbb-shuttled non-cytotoxic delivery",
          whyPlausible:
            hasNeuroTranscriptLaneSignals
              ? "the grounded disease frame points to chronic cns biology where delivery is the bottleneck, so a shuttle-enabled oligo or gene-modulation lane is more plausible than free-warhead logic."
              : "the grounded disease frame points to a chronic cns case where transport is the gating problem, so a shuttle-enabled non-cytotoxic delivery lane is more plausible than classical warhead release.",
          entryHandleLogic:
            "this bucket needs a believable receptor-mediated transport route, brain-endothelial shuttle, or other uptake handle that can create productive cns exposure instead of only peripheral binding.",
          requiredAssumptions: uniqueStrings([
            "there is a believable brain-entry route or transport receptor to exploit",
            hasNeuroTranscriptLaneSignals
              ? "the disease mechanism can actually be shifted by an oligo or gene/rna payload once it reaches the relevant compartment"
              : "the disease mechanism can be shifted without relying on cytotoxic cell killing",
            input.target?.canonical ? undefined : "a specific target or entry handle can later be chosen without breaking the disease-level frame",
          ]),
          mainFailureMode:
            hasNeuroTranscriptLaneSignals
              ? "this lane collapses if the shuttle improves blood exposure but still does not deliver enough active oligo into the relevant cns cells or compartment."
              : "this lane collapses if the transport concept never produces useful cns exposure where the disease biology actually lives.",
          diseaseSpecificConstraints: [
            "bbb / barrier-limited exposure",
            "neurodegeneration / cns biology",
            "chronic dosing tolerability",
            "non-cytotoxic fit",
          ],
          supportingEvidenceIds: findEvidenceIds(
            evidenceObjects,
            (item) =>
              item.themes.some((theme) =>
                ["cns / bbb", "neurodegeneration", "transport-aware implications", "chronic non-oncology"].includes(theme),
              ) || item.mechanismHints.includes("gene modulation"),
          ),
          suggestedModalities: hasNeuroTranscriptLaneSignals
            ? ["oligo conjugate", "pdc", "adc"]
            : ["pdc", "adc", "smdc"],
        },
        abstraction,
      ),
    );

    if (
      hasExtracellularNeuroSignals ||
      abstraction.mechanismLocation === "extracellular" ||
      abstraction.targetClass === "soluble/extracellular factor" ||
      (
        hasProteostasisSignals &&
        evidenceMentions(evidenceObjects, [/\baggregate\b/i, /\bspread/i, /\bseeding\b/i, /\bplaque\b/i, /\bextracellular\b/i])
      )
    ) {
      addBucket(
        buckets,
        buildBucket(
          {
            label: "bbb-enhanced biologic / extracellular pathology interception",
            whyPlausible:
              "part of the biology may be reachable outside the cell, so a brain-penetrant biologic or extracellular-interception lane can be explored before committing to intracellular-only architectures.",
            entryHandleLogic:
              "this lane needs either a bbb-enhancing shuttle or a compact biologic format plus an extracellularly reachable target, aggregate, or spreading pathology species.",
            requiredAssumptions: uniqueStrings([
              "the important disease-driving species is extracellularly reachable long enough for the construct to matter",
              "brain exposure can be improved enough for a biologic or fragment-based format to engage the target",
            ]),
            mainFailureMode:
              "this lane weakens if the real driver is mostly intracellular or if the extracellular species is too indirect to change disease progression meaningfully.",
            diseaseSpecificConstraints: [
              "bbb / barrier-limited exposure",
              "extracellular accessibility",
              "neurodegeneration / cns biology",
            ],
            supportingEvidenceIds: findEvidenceIds(
              evidenceObjects,
              (item) =>
                item.themes.some((theme) =>
                  ["cns / bbb", "neurodegeneration", "extracellular", "transport-aware implications"].includes(theme),
                ),
            ),
            suggestedModalities: ["adc", "pdc"],
          },
          abstraction,
        ),
      );
    }

    addBucket(
      buckets,
      buildBucket(
        {
          label:
            hasProteostasisSignals
              ? "neuroprotective / pathway-modulating peptide or biologic logic"
              : "neuroprotective / pathway-modulating or proteostasis-support biologic logic",
          whyPlausible:
            hasProteostasisSignals
              ? "the disease frame looks more like chronic neuroprotection or pathway control than cell ablation, so a peptide-, fragment-, or compact-biologic lane is worth keeping alive if there is a tractable entry handle."
              : "the disease frame looks more like chronic neuroprotection or pathway control than cell ablation, and in thin-evidence neuro cases it is still worth keeping a conditional proteostasis- or mitochondrial-support lane alive rather than pretending barrier access is the only design question.",
          entryHandleLogic:
            "this lane needs a compact target, receptor, or tissue-localizing handle that can bias exposure toward the disease-setting cells without depending on broad cytotoxic payload release or oversized default formats.",
          requiredAssumptions: uniqueStrings([
            "the relevant disease driver can be shifted by pathway modulation rather than cell killing",
            hasProteostasisSignals
              ? undefined
              : "a protective or proteostasis-supportive payload could matter if mitochondrial, lysosomal, or aggregate stress turns out to be part of the disease-setting biology",
            "a compact entry handle exists that does not make the construct too large for the access problem",
            abstraction.deliveryAccessibility === "barrier-limited"
              ? "the chosen format can still preserve enough exposure across the barrier"
              : undefined,
          ]),
          mainFailureMode:
            hasProteostasisSignals
              ? "this lane fails if the entry handle is too weak or the construct becomes too large or too systemically exposed to create a useful therapeutic window."
              : "this lane fails if the entry handle is too weak, the construct becomes too large for the barrier problem, or the assumed proteostasis / mitochondrial support biology turns out to be too indirect to matter.",
          diseaseSpecificConstraints: [
            "bbb / barrier-limited exposure",
            "non-cytotoxic fit",
            "chronic dosing tolerability",
            hasProteostasisSignals ? undefined : "mitochondrial / proteostasis uncertainty",
          ].filter(Boolean) as string[],
          supportingEvidenceIds: findEvidenceIds(
            evidenceObjects,
            (item) =>
              item.mechanismHints.includes("pathway modulation") ||
              item.themes.some((theme) =>
                ["pathway modulation", "chronic non-oncology", "transport-aware implications"].includes(theme),
              ),
          ),
          suggestedModalities: ["pdc", "adc", "smdc"],
        },
        abstraction,
      ),
    );

    if (hasProteostasisSignals || (abstraction.pathologyType === "neurodegeneration" && abstraction.treatmentContext === "chronic")) {
      addBucket(
        buckets,
        buildBucket(
          {
            label: "mitochondrial / proteostasis support conjugates",
            whyPlausible:
              hasProteostasisSignals
                ? "the evidence surface includes stress-response biology such as proteostasis, mitochondrial, lysosomal, or aggregate-control pressure, so a supportive targeted-conjugate lane is worth keeping conditional rather than treating every neuro case the same way."
                : "chronic neurodegenerative cns disease often still needs a conditional stress-response lane even when the retrieval pass is thin, because mitochondrial, lysosomal, or proteostasis pressure may matter enough to shape payload and routing choices.",
            entryHandleLogic:
              "this lane needs either a compact uptake handle, receptor-mediated entry route, organelle-biased motif, or tissue-localizing delivery handle that can deliver a supportive payload into the stressed compartment without adding too much systemic burden.",
            requiredAssumptions: hasProteostasisSignals
              ? [
                  "the stress-response biology is upstream enough to matter therapeutically and not only a downstream marker",
                  "the construct can reach the relevant subcellular setting without overwhelming chronic tolerability",
                ]
              : [
                  "mitochondrial, lysosomal, or proteostasis stress is relevant enough in the actual subtype to be worth a supportive lane",
                  "the construct can reach the relevant subcellular setting without overwhelming chronic tolerability",
                ],
            mainFailureMode:
              hasProteostasisSignals
                ? "this lane fails if the stress-response biology is mostly secondary and the conjugate never reaches the relevant compartment with enough activity to change disease progression."
                : "this lane fails if stress-response biology turns out to be too downstream in the actual subtype or the conjugate never reaches the relevant compartment with enough activity to matter.",
            diseaseSpecificConstraints: [
              "neurodegeneration / cns biology",
              "chronic dosing tolerability",
              "productive intracellular routing",
            ],
            supportingEvidenceIds: findEvidenceIds(
              evidenceObjects,
              (item) =>
                textIncludesAny(
                  [
                    item.label,
                    item.claim,
                    item.rationale,
                    ...item.themes,
                    ...item.mechanismHints,
                  ].join(" "),
                  [/\bmitochond/i, /\bproteostasis\b/i, /\bautophagy\b/i, /\blysosom/i, /\baggregat/i, /\bneuroinflamm/i],
                ) ||
                (
                  !hasProteostasisSignals &&
                  item.themes.some((theme) =>
                    ["cns / bbb", "neurodegeneration", "transport-aware implications", "chronic non-oncology"].includes(theme),
                  )
                ),
            ),
            suggestedModalities: ["smdc", "pdc", "oligo conjugate"],
          },
          abstraction,
        ),
      );
    }

    if (hasNeuroCellTypeSignals) {
      addBucket(
        buckets,
        buildBucket(
          {
            label: "neuron- or glia-targeted delivery as a high-risk conditional lane",
            whyPlausible:
              "the evidence surface points to specific neuronal or glial compartments, so a cell-type-targeted delivery lane is worth keeping visible as a higher-risk hypothesis rather than pretending all cns targeting is interchangeable.",
            entryHandleLogic:
              "this lane needs a truly selective neuron-, glia-, or subtype-biased entry handle that can improve exposure to the relevant cell compartment without worsening off-cell toxicity or losing too much brain penetration.",
            requiredAssumptions: [
              "a cell-type-biased targeting handle actually exists and remains selective in vivo",
              "the cell-type-focused lane adds something meaningful beyond a broader transport-only strategy",
            ],
            mainFailureMode:
              "this lane fails if the cell-type handle is too weak, too unsafe, or too distribution-limited to improve on a broader cns delivery strategy.",
            diseaseSpecificConstraints: [
              "bbb / barrier-limited exposure",
              "neurodegeneration / cns biology",
              "chronic dosing tolerability",
              "non-cytotoxic fit",
            ],
            supportingEvidenceIds: findEvidenceIds(
              evidenceObjects,
              (item) =>
                textIncludesAny(
                  [
                    item.label,
                    item.claim,
                    item.rationale,
                    ...item.themes,
                    ...item.mechanismHints,
                    ...item.sourceLabels,
                  ].join(" "),
                  [/\bneuron/i, /\bmicroglia/i, /\bglia\b/i, /\bastrocyte/i, /\bdopaminergic\b/i],
                ),
            ),
            suggestedModalities: ["pdc", "adc", "oligo conjugate"],
          },
          abstraction,
        ),
      );
    }

    if (abstraction.cytotoxicFit === "discouraged") {
      addBucket(
        buckets,
        buildBucket(
          {
            label: "classical cytotoxic conjugates are a weak-fit comparator",
            whyPlausible:
              "it is still useful to state this lane explicitly because the disease frame is chronic, non-oncologic, and neurodegenerative, which makes classical cell-killing payload logic a generally weak default fit unless the hypothesis changes to selective cell ablation.",
            entryHandleLogic:
              "this lane would only become viable if the biology actually shifted toward a harmful cell population that should be ablated and there were a selective entry handle to do that safely.",
            requiredAssumptions: [
              "the real therapeutic intent has changed from protection or modulation to selective ablation",
              "a target exists that can support cytotoxic delivery without worsening vulnerable tissue loss",
            ],
            mainFailureMode:
              "this lane is usually the wrong fit because the same payload logic that works in oncology can worsen chronic neurodegeneration if it is applied without a true cell-ablation rationale.",
            diseaseSpecificConstraints: [
              "non-cytotoxic fit",
              "neurodegeneration / cns biology",
              "chronic dosing tolerability",
            ],
            supportingEvidenceIds: findEvidenceIds(
              evidenceObjects,
              (item) =>
                item.themes.some((theme) =>
                  ["neurodegeneration", "chronic non-oncology", "non-cytotoxic fit"].includes(theme),
                ),
            ),
            suggestedModalities: ["adc", "rdc", "smdc"],
          },
          abstraction,
        ),
      );
    }
  }

  if (!isNeuroBarrierCase && (
    abstraction.pathologyType === "neurodegeneration" ||
    abstraction.deliveryAccessibility === "barrier-limited" ||
    abstraction.deliveryBarriers.some((item) => /bbb|blood-brain|cns/i.test(item))
  )) {
    addBucket(buckets, buildBucket({
      label: "transport-aware non-cytotoxic targeting",
      whyPlausible:
        "the grounded biology points to a barrier-limited chronic disease context, so transport-aware delivery and non-cytotoxic mechanism logic are more plausible than classical free-warhead release.",
      entryHandleLogic:
        "this bucket only becomes real if there is a believable receptor-mediated transport route, shuttle handle, or uptake mechanism that can move the construct into the relevant cns compartment.",
      requiredAssumptions: uniqueStrings([
        "there is a believable brain-entry route or uptake handle",
        "the therapeutic mechanism is non-cytotoxic and compatible with chronic dosing",
        input.target?.canonical ? undefined : "a target or entry handle can be specified later without breaking the disease-level frame",
      ]),
      mainFailureMode:
        "this bucket falls apart if there is no workable transport route across the barrier or if the chosen target cannot support useful exposure where the biology lives.",
      diseaseSpecificConstraints: [
        "bbb / barrier-limited exposure",
        "chronic dosing tolerability",
        "non-cytotoxic fit",
      ],
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.themes.some((theme) =>
            ["cns / bbb", "neurodegeneration", "transport-aware implications", "chronic non-oncology"].includes(theme),
          ),
      ),
      suggestedModalities: ["oligo conjugate", "smdc", "pdc"],
    }, abstraction));
  }

  if (
    !isNeuroBarrierCase &&
    (
      (!hasSpliceCorrectionSignals && abstraction.therapeuticIntent === "pathway modulation") ||
      mechanismInference.mechanismClass === "pathway modulation" ||
      (
        !hasSpliceCorrectionSignals &&
        abstraction.treatmentContext === "chronic" &&
        abstraction.cytotoxicFit === "discouraged" &&
        abstraction.pathologyType !== "oncology"
      )
    )
  ) {
    addBucket(buckets, buildBucket({
      label: isMixedPathologyCase
        ? "tissue-targeted oligo or pathway modulation"
        : "non-cytotoxic pathway-matched targeting",
      whyPlausible:
        isMixedPathologyCase
          ? "the disease frame is mixed rather than purely inflammatory, so a useful lane is tissue-targeted oligo or pathway modulation that can work inside stressed tissue instead of assuming extracellular immune modulation is the whole story."
          : "the disease frame looks more like chronic pathway control than kill-and-release payload logic, so a non-cytotoxic targeted architecture is a more plausible starting bucket.",
      entryHandleLogic:
        isMixedPathologyCase
          ? "this bucket needs a tissue-biased uptake route, receptor, or localizing handle that can bias delivery toward the affected tissue compartment rather than only circulating immune cells."
          : "this bucket needs a target, receptor, or tissue-localizing handle that can bias exposure toward the relevant pathway-setting cells without relying on classical cell-killing payload logic.",
      requiredAssumptions: uniqueStrings([
        isMixedPathologyCase
          ? "the disease can be shifted by tissue-directed pathway or oligo modulation rather than only systemic immune suppression"
          : "the relevant biology can be shifted by pathway modulation rather than cell killing",
        input.target?.canonical ? undefined : "a target or entry handle can later be chosen without breaking the non-cytotoxic strategy",
        abstraction.deliveryAccessibility === "barrier-limited"
          ? "the delivery format can still reach the relevant tissue despite the barrier"
          : undefined,
        isMuscleDeliveryContext ? "the delivery handle can create meaningful exposure in the affected muscle tissue" : undefined,
      ]),
      mainFailureMode:
        isMixedPathologyCase
          ? "this bucket weakens if the tissue-directed lane never reaches the stressed compartment with enough productive exposure, or if the mixed pathology is actually dominated by a different biology lane."
          : "this bucket weakens if the actual disease driver cannot be moved enough by pathway-level intervention or if there is no tractable way to localize the construct to the right cells or tissue.",
      diseaseSpecificConstraints: [
        abstraction.treatmentContext === "chronic" ? "chronic dosing tolerability" : "",
        abstraction.cytotoxicFit === "discouraged" ? "non-cytotoxic fit" : "",
        abstraction.deliveryAccessibility === "barrier-limited" ? "bbb / barrier-limited exposure" : "",
        isMixedPathologyCase ? "mixed inflammatory + degenerative biology" : "",
        isMuscleDeliveryContext ? "muscle delivery" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.mechanismHints.includes("pathway modulation") ||
          item.themes.some((theme) =>
            ["pathway modulation", "chronic non-oncology", "non-cytotoxic fit", "transport-aware implications"].includes(theme),
          ),
      ),
      suggestedModalities: isMixedPathologyCase ? ["oligo conjugate", "pdc", "smdc"] : ["pdc", "smdc", "oligo conjugate"],
    }, abstraction));
  }

  if (
    !isNeuroBarrierCase &&
    (
      abstraction.therapeuticIntent === "gene/rna modulation" ||
      abstraction.compartmentNeed === "nuclear" ||
      abstraction.compartmentNeed === "cytosolic" ||
      abstraction.mechanismLocation === "intracellular"
    )
  ) {
    if (hasNeuromuscularOligoFamilySignals) {
      addBucket(buckets, buildBucket({
        label: "oligo-first muscle delivery lane",
        whyPlausible:
          "the disease frame already points toward transcript-level muscle biology, so the leading lane should start from an oligo or transcript-modulating cargo plus a delivery concept rather than a generic non-cytotoxic bucket.",
        entryHandleLogic:
          "this lane needs a muscle-relevant uptake route or delivery handle that can improve productive intracellular routing into the relevant muscle compartment without breaking the active cargo.",
        requiredAssumptions: [
          "the disease biology is tractable enough at the rna or transcript level that an oligo-class active species is the right starting scaffold",
          "the chosen delivery handle can improve meaningful muscle exposure rather than only circulation or bulk uptake",
        ],
        mainFailureMode:
          "this lane fails if transcript-level biology is too diffuse for one oligo strategy or if the delivery concept improves uptake without enough productive activity in muscle.",
        diseaseSpecificConstraints: [
          "muscle delivery",
          abstraction.compartmentNeed === "nuclear" ? "nuclear access" : "productive intracellular routing",
          "chronic dosing tolerability",
          "non-cytotoxic fit",
        ],
        supportingEvidenceIds: findEvidenceIds(
          evidenceObjects,
          (item) =>
            textIncludesAny(
              [
                item.label,
                item.claim,
                item.rationale,
                ...item.mechanismHints,
                ...item.themes,
              ].join(" "),
              [/\bduchenne\b/i, /\bdmd\b/i, /\bmuscle\b/i, /\brna\b/i, /\btranscript\b/i, /\bantisense\b/i, /\boligo\b/i],
            ),
        ),
        suggestedModalities: ["oligo conjugate"],
      }, abstraction));

      addBucket(buckets, buildBucket({
        label: "peptide- or receptor-assisted muscle uptake lane",
        whyPlausible:
          "once the active species looks transcript-directed in muscle, a differentiated lane is to improve exposure with peptide-assisted uptake or receptor-mediated muscle targeting rather than relying on passive delivery alone.",
        entryHandleLogic:
          "this lane needs either a peptide-assisted muscle-entry motif, a receptor-mediated uptake route, or another delivery handle that can bias exposure toward muscle and preserve productive intracellular routing.",
        requiredAssumptions: [
          "the added delivery module improves tissue uptake without destroying the activity of the core transcript-modulating cargo",
          "the delivery gain is meaningful in the muscle compartments that actually matter clinically",
        ],
        mainFailureMode:
          "this lane fails if the added targeting chemistry improves bulk uptake or half-life on paper but never translates into enough active intracellular delivery in muscle.",
        diseaseSpecificConstraints: [
          "muscle delivery",
          "productive intracellular routing",
          "chronic dosing tolerability",
        ],
        supportingEvidenceIds: findEvidenceIds(
          evidenceObjects,
          (item) =>
            textIncludesAny(
              [
                item.label,
                item.claim,
                item.rationale,
                ...item.mechanismHints,
                ...item.themes,
              ].join(" "),
              [/\bmuscle\b/i, /\bdelivery\b/i, /\buptake\b/i, /\breceptor-mediated\b/i, /\bantibody\b/i, /\bpeptide\b/i],
            ),
        ),
        suggestedModalities: ["oligo conjugate", "pdc"],
      }, abstraction));

      addBucket(buckets, buildBucket({
        label: "plain oligo comparator lane",
        whyPlausible:
          "it is still useful to keep a plain oligo comparator visible, because the real question is often how much extra delivery architecture improves on a baseline transcript-directed scaffold.",
        entryHandleLogic:
          "this lane intentionally keeps the delivery architecture simple so it can act as a reference for whether added targeting chemistry is really buying enough tissue exposure to matter.",
        requiredAssumptions: [
          "baseline oligo or transcript-directed biology is real enough that a plain comparator is still informative",
          "the comparison will be used to judge whether added delivery complexity is earning its keep",
        ],
        mainFailureMode:
          "this lane usually fails on limited tissue uptake, which is exactly why it is useful as a baseline comparator rather than a final aspirational design.",
        diseaseSpecificConstraints: [
          "muscle delivery",
          "non-cytotoxic fit",
          "chronic dosing tolerability",
        ],
        supportingEvidenceIds: findEvidenceIds(
          evidenceObjects,
          (item) =>
            textIncludesAny(
              [
                item.label,
                item.claim,
                item.rationale,
                ...item.mechanismHints,
                ...item.themes,
              ].join(" "),
              [/\bduchenne\b/i, /\bdmd\b/i, /\bmuscular dystrophy\b/i, /\boligo\b/i, /\bantisense\b/i],
            ),
        ),
        suggestedModalities: ["oligo conjugate"],
      }, abstraction));
    }

    if (hasSpliceCorrectionSignals) {
      addBucket(buckets, buildBucket({
        label: isMuscleDeliveryContext
          ? "peptide-conjugated pmo / ppmo splice-switching delivery"
          : "splice-switching oligo delivery",
        whyPlausible:
          isMuscleDeliveryContext
            ? "the prompt already points to exon or splice correction, so the leading lane is a splice-switching oligo with a delivery architecture that improves muscle uptake rather than a generic non-cytotoxic bucket."
            : "the prompt already points to exon or splice correction, so the leading lane is a splice-switching oligo architecture rather than a generic pathway-modulation frame.",
        entryHandleLogic:
          isMuscleDeliveryContext
            ? "this lane needs a delivery handle that improves productive muscle-cell entry and intracellular routing, such as a peptide-conjugated pmo-style uptake module or another chemistry that clearly improves muscle exposure."
            : "this lane needs an uptake or trafficking handle that preserves splice-switching oligo activity while improving productive intracellular routing into the relevant compartment.",
        requiredAssumptions: uniqueStrings([
          "the disease mechanism can be shifted by splice correction or exon-skipping rather than extracellular occupancy",
          abstraction.compartmentNeed === "nuclear"
            ? "the oligo can reach nuclear pre-mrna with enough productive delivery"
            : "the oligo can reach the active intracellular compartment with enough productive delivery",
          isMuscleDeliveryContext
            ? "the added delivery handle improves muscle uptake without breaking the splice-switching cargo"
            : "the delivery handle improves uptake without breaking the splice-switching cargo",
        ]),
        mainFailureMode:
          isMuscleDeliveryContext
            ? "this lane fails if the conjugation chemistry improves bulk uptake but still does not deliver enough active splice-switching oligo into muscle nuclei."
            : "this lane fails if the delivery handle improves uptake on paper but does not preserve enough active splice-switching oligo in the relevant compartment.",
        diseaseSpecificConstraints: [
          "nuclear access",
          "productive intracellular routing",
          isMuscleDeliveryContext ? "muscle delivery" : "",
          "non-cytotoxic fit",
        ].filter(Boolean),
        supportingEvidenceIds: findEvidenceIds(
          evidenceObjects,
          (item) =>
            textIncludesAny(
              [
                item.label,
                item.claim,
                item.rationale,
                ...item.mechanismHints,
                ...item.themes,
              ].join(" "),
              [/\bsplice\b/i, /\bexon\b/i, /transcript correction/i, /exon skipping/i, /\bpmo\b/i, /\baso\b/i],
            ),
        ),
        suggestedModalities: ["oligo conjugate"],
      }, abstraction));

      addBucket(buckets, buildBucket({
        label: isMuscleDeliveryContext
          ? "antibody/fab or receptor-mediated muscle-targeted oligo delivery"
          : "receptor-mediated oligo delivery",
        whyPlausible:
          isMuscleDeliveryContext
            ? "once the active species is a splice-switching oligo, a differentiated lane is to use an antibody, fab, or receptor-mediated delivery handle to improve muscle exposure rather than only relying on passive oligo uptake."
            : "once the active species is a splice-switching oligo, a differentiated lane is to use a receptor-mediated or binder-led delivery handle to improve exposure to the right cells.",
        entryHandleLogic:
          isMuscleDeliveryContext
            ? "this lane needs a muscle-biased receptor, antibody/fab handle, or other receptor-mediated uptake route that can move the oligo into skeletal muscle and ideally other clinically important muscle compartments."
            : "this lane needs a receptor-mediated uptake route or binder-led handle that creates productive cell entry for the splice-switching oligo.",
        requiredAssumptions: uniqueStrings([
          "a receptor or binder handle exists that genuinely improves tissue delivery for the oligo cargo",
          "the added carrier still preserves productive intracellular routing into the active compartment",
          isMuscleDeliveryContext ? "the delivery gain is meaningful in muscle, not only in circulation" : undefined,
        ]),
        mainFailureMode:
          "this lane fails if the targeting handle improves binding or exposure but not the productive intracellular routing that the oligo actually needs.",
        diseaseSpecificConstraints: [
          "nuclear access",
          "productive intracellular routing",
          isMuscleDeliveryContext ? "muscle delivery" : "",
        ].filter(Boolean),
        supportingEvidenceIds: findEvidenceIds(
          evidenceObjects,
          (item) => item.mechanismHints.includes("gene modulation") || item.themes.includes("gene modulation"),
        ),
        suggestedModalities: ["oligo conjugate", "pdc"],
      }, abstraction));

      if (isMuscleDeliveryContext) {
        addBucket(buckets, buildBucket({
          label: "plain pmo / aso splice-switching reference lane",
          whyPlausible:
            "it is still useful to keep a plain splice-switching oligo comparator in view, because the real question may be how much extra delivery architecture improves on a baseline pmo or aso reference.",
          entryHandleLogic:
            "this lane intentionally uses minimal added targeting so it can act as a reference for whether more elaborate delivery chemistry is actually buying enough muscle uptake to matter.",
          requiredAssumptions: [
            "baseline splice-switching biology is real enough that a plain oligo reference is still informative",
            "delivery enhancement is being judged against a meaningful oligo-only comparator rather than against no active biology at all",
          ],
          mainFailureMode:
            "this lane usually fails on limited tissue uptake, which is exactly why it is useful as a reference comparator rather than a final aspirational design.",
          diseaseSpecificConstraints: [
            "nuclear access",
            "muscle delivery",
            "non-cytotoxic fit",
          ],
          supportingEvidenceIds: findEvidenceIds(
            evidenceObjects,
            (item) => item.mechanismHints.includes("gene modulation") || item.themes.includes("named disease"),
          ),
          suggestedModalities: ["oligo conjugate"],
        }, abstraction));
      }
    }

    addBucket(buckets, buildBucket({
      label: "intracellular gene / pathway modulation delivery",
      whyPlausible:
        hasSpliceCorrectionSignals
          ? "the current biological state points toward a splice-switching or transcript-correction active species that has to work inside the nucleus, so productive trafficking matters more than classical extracellular payload release."
          : "the current biological state points toward an active species that has to work inside the cell, so productive trafficking matters more than classical extracellular payload release.",
      entryHandleLogic:
        abstraction.compartmentNeed === "nuclear"
          ? hasSpliceCorrectionSignals
            ? "this bucket needs an entry handle and trafficking route that can deliver an active splice-switching oligo into the nucleus, not only surface binding or bulk uptake."
            : "this bucket needs an entry handle and trafficking route that can deliver the active construct far enough to support nuclear biology, not only surface binding or bulk uptake."
          : "this bucket needs an uptake handle and intracellular routing path that create productive delivery where the active species actually has to work.",
      requiredAssumptions: uniqueStrings([
        abstraction.compartmentNeed === "nuclear"
          ? "the construct can reach the nucleus with enough productive delivery"
          : "the construct can achieve productive intracellular delivery",
        "the mechanism really is sequence- or pathway-directed rather than simple extracellular occupancy",
        input.target?.canonical ? undefined : "a compatible entry handle or uptake route can be identified",
      ]),
      mainFailureMode:
        "this bucket fails if uptake looks good on paper but productive intracellular routing is too weak to create real biology at the relevant compartment.",
      diseaseSpecificConstraints: [
        abstraction.compartmentNeed === "nuclear" ? "nuclear access" : "productive intracellular routing",
        abstraction.treatmentContext === "chronic" ? "chronic dosing tolerability" : "",
        abstraction.deliveryAccessibility === "barrier-limited" ? "bbb / barrier-limited exposure" : "",
        isMuscleDeliveryContext ? "muscle delivery" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.mechanismHints.includes("gene modulation") ||
          item.themes.some((theme) =>
            ["gene modulation", "pathway modulation", "productive trafficking", "intracellular delivery"].includes(theme),
          ),
      ),
      suggestedModalities: ["oligo conjugate", "pdc", "smdc"],
    }, abstraction));
  }

  if (
    !isNeuroBarrierCase &&
    (
      abstraction.targetClass === "soluble/extracellular factor" ||
      abstraction.compartmentNeed === "extracellular" ||
      abstraction.mechanismLocation === "extracellular"
    )
  ) {
    addBucket(buckets, buildBucket({
      label: "extracellular neutralization / localization",
      whyPlausible:
        "the wording and abstraction state both point to biology that can be addressed outside the cell, so extracellular engagement can be explored before committing to intracellular-delivery architectures.",
      entryHandleLogic:
        "this bucket only makes sense if there is an extracellular target, deposited material, or localization handle that is reachable without needing productive intracellular release.",
      requiredAssumptions: uniqueStrings([
        "the key biology really is extracellular and accessible to the conjugate format",
        "payload logic does not require productive intracellular release",
        isMixedPathologyCase ? "extracellular interception is only one lane in a mixed disease model rather than the whole disease story" : undefined,
      ]),
      mainFailureMode:
        "this bucket weakens quickly if the true driver turns out to be intracellular pathway control rather than extracellular occupancy or localization.",
      diseaseSpecificConstraints: [
        "extracellular accessibility",
        abstraction.deliveryAccessibility === "barrier-limited" ? "bbb / barrier-limited exposure" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.themes.some((theme) =>
            ["extracellular", "soluble factor", "amyloid plaque clearance", "transport-aware implications"].includes(theme),
          ),
      ),
      suggestedModalities: ["adc", "pdc", "smdc", "rdc"],
    }, abstraction));
  }

  if (
    abstraction.pathologyType === "autoimmune/inflammatory" ||
    abstraction.pathologyType === "mixed" ||
    abstraction.therapeuticIntent === "immune modulation" ||
    (
      input.diseaseArea === "autoimmune" &&
      abstraction.treatmentContext === "chronic" &&
      abstraction.cytotoxicFit === "discouraged"
    )
  ) {
    addBucket(buckets, buildBucket({
      label: isMixedPathologyCase ? "immune-modulatory targeted delivery" : "non-cytotoxic immune-targeted modulation",
      whyPlausible:
        isMixedPathologyCase
          ? "immune and inflammatory biology is still one real lane here, but it should stay alongside tissue-degenerative and stress-response lanes rather than swallowing the whole disease frame."
          : "the current biology reads like chronic inflammatory control rather than cytotoxic elimination, so the useful strategy space is immune-modulatory targeting rather than warhead-first delivery.",
      entryHandleLogic:
        "this bucket needs a selective immune-cell, stromal, or soluble-factor handle that can bias modulation toward the disease-driving compartment instead of broad systemic exposure.",
      requiredAssumptions: uniqueStrings([
        "the disease can be improved by modulating immune signaling or cell-state biology instead of killing tissue broadly",
        isMixedPathologyCase ? "immune modulation is one useful lever even if it does not fully solve the degenerative tissue component" : undefined,
        input.target?.canonical ? undefined : "a target, cell subset, or delivery handle can be identified later for selective modulation",
      ]),
      mainFailureMode:
        "this bucket fails if the eventual target does not create enough selectivity or if the construct cannot shift immune biology without creating broader systemic toxicity.",
      diseaseSpecificConstraints: [
        "immune-inflammatory selectivity",
        abstraction.treatmentContext === "chronic" ? "chronic dosing tolerability" : "",
        abstraction.cytotoxicFit === "discouraged" ? "non-cytotoxic fit" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.mechanismHints.includes("immune modulation") ||
          item.themes.some((theme) =>
            ["immune modulation", "autoimmune/inflammatory", "chronic non-oncology", "non-oncology"].includes(theme),
          ),
      ),
      suggestedModalities: ["pdc", "smdc", "adc"],
    }, abstraction));
  }

  if (hasAntibodyMediatedSignals) {
    addBucket(buckets, buildBucket({
      label: "fcRn / igg-lowering strategy",
      whyPlausible:
        "the disease frame supports pathogenic igg or autoantibody biology strongly enough that lowering circulating pathogenic igg is a distinct lane, not only generic immune modulation.",
      entryHandleLogic:
        "this bucket needs an fcrn target, igg-turnover receptor, or other entry handle that can reduce pathogenic antibody burden without defaulting into broad cytotoxic immune-cell depletion.",
      requiredAssumptions: [
        "pathogenic igg or autoantibody burden is a real driver of disease activity",
        "lowering igg changes the disease-relevant functional phenotype more than a generic anti-inflammatory move would",
      ],
      mainFailureMode:
        "this bucket weakens if the actual disease driver is less antibody-dominant than expected or the igg-lowering strategy is too broad for chronic tolerability.",
      diseaseSpecificConstraints: [
        "pathogenic igg / autoantibody biology",
        "chronic dosing tolerability",
        "non-cytotoxic fit",
      ],
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          textIncludesAny(
            [item.label, item.claim, item.rationale, ...item.themes].join(" "),
            [/\bpathogenic igg\b/i, /\bautoantibody\b/i, /\bfcrn\b/i],
          ),
      ),
      suggestedModalities: ["pdc", "adc", "smdc"],
    }, abstraction));
  }

  if (hasComplementSignals) {
    addBucket(buckets, buildBucket({
      label: "complement-pathway modulation",
      whyPlausible:
        "the disease biology leaves room for complement-mediated injury, so complement-localized or complement-biased modulation is a distinct non-cytotoxic strategy lane.",
      entryHandleLogic:
        "this bucket needs a complement target, extracellular entry handle, or tissue-localizing delivery handle that can intercept damaging complement activity where injury happens rather than only broad immune suppression.",
      requiredAssumptions: [
        "complement activity is upstream enough to matter in the disease-setting biology",
        "local complement modulation is more useful than diffuse systemic immune modulation alone",
      ],
      mainFailureMode:
        "this bucket fails if complement activity turns out to be secondary rather than a real disease driver or if localization is too weak to create a useful therapeutic window.",
      diseaseSpecificConstraints: [
        "extracellular accessibility",
        "complement-mediated injury possibility",
        "chronic non-cytotoxic context",
      ],
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          textIncludesAny(
            [item.label, item.claim, item.rationale, ...item.themes].join(" "),
            [/\bcomplement\b/i, /\bc5\b/i, /\bc3\b/i],
          ),
      ),
      suggestedModalities: ["adc", "pdc"],
    }, abstraction));
  }

  if (hasAntigenSpecificAutoimmuneSignals || hasAntibodyMediatedSignals) {
    addBucket(
      buckets,
      buildAntigenSpecificAutoimmuneBucket(
        abstraction,
        evidenceObjects,
        hasAntigenSpecificAutoimmuneSignals,
      ),
    );
  }

  if (hasBCellOrPlasmaSignals) {
    addBucket(buckets, buildBucket({
      label: "b-cell / plasma-cell modulation",
      whyPlausible:
        "the autoimmune disease frame can include ongoing humoral-cell contribution, so selective b-cell or plasma-cell modulation should remain a separate lane from generic inflammation control.",
      entryHandleLogic:
        "this bucket needs a selective b-cell target, plasma-cell target, or humoral-immune entry handle that can shift pathogenic antibody production without treating broad cytotoxic depletion as the default move.",
      requiredAssumptions: [
        "b-cell or plasma-cell persistence is a meaningful contributor to disease maintenance",
        "selective humoral-cell modulation would improve disease biology more than diffuse immune suppression alone",
      ],
      mainFailureMode:
        "this bucket weakens if humoral-cell biology is not the dominant maintenance driver or the selective handle is too blunt for chronic use.",
      diseaseSpecificConstraints: [
        "humoral-cell contribution",
        "chronic dosing tolerability",
        "non-cytotoxic fit",
      ],
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          textIncludesAny(
            [item.label, item.claim, item.rationale, ...item.themes].join(" "),
            [/\bb cell\b/i, /\bb-cell\b/i, /\bplasma cell\b/i, /\bplasmablast\b/i],
          ),
      ),
      suggestedModalities: ["adc", "pdc"],
    }, abstraction));
  }

  if (!isNeuroBarrierCase && isMixedPathologyCase && (hasMitochondrialSignals || hasProteostasisSignals)) {
    addBucket(buckets, buildBucket({
      label: hasMitochondrialSignals
        ? "mitochondrial / protective payload conjugates"
        : "proteostasis / stress-response support conjugates",
      whyPlausible:
        "the evidence surface includes stressed-tissue biology like mitochondrial dysfunction, aggregate pressure, or broader proteostasis strain, so a protective targeted-payload lane should stay visible instead of being overwritten by the immune lane.",
      entryHandleLogic:
        isMuscleDeliveryContext
          ? "this lane needs a tissue-biased delivery handle, uptake route, or receptor-mediated entry path that can reach stressed muscle fibers without broad systemic burden."
          : "this lane needs a compact uptake handle, receptor-mediated entry route, organelle-biased motif, or tissue-localizing delivery handle that can reach the stressed compartment without broad systemic burden.",
      requiredAssumptions: uniqueStrings([
        "the stress-response biology is upstream enough to matter therapeutically and not only a downstream marker",
        "the construct can deliver a protective payload without exhausting chronic tolerability",
        isMuscleDeliveryContext ? "the delivery handle actually improves exposure in the affected tissue compartment" : undefined,
      ]),
      mainFailureMode:
        "this lane fails if the stress-response biology is mostly downstream noise or if the conjugate never reaches the relevant compartment with enough activity to change tissue function.",
      diseaseSpecificConstraints: [
        "mixed inflammatory + degenerative biology",
        isMuscleDeliveryContext ? "muscle delivery" : "",
        "chronic dosing tolerability",
        "non-cytotoxic fit",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          textIncludesAny(
            [
              item.label,
              item.claim,
              item.rationale,
              ...item.themes,
              ...item.mechanismHints,
              ...item.sourceLabels,
            ].join(" "),
            [/\bmitochond/i, /\bproteostasis\b/i, /\bautophagy\b/i, /\blysosom/i, /\baggregat/i, /\bstress\b/i],
          ),
      ),
      suggestedModalities: ["smdc", "pdc", "oligo conjugate"],
    }, abstraction));
  }

  if (!isNeuroBarrierCase && isMixedPathologyCase && hasAutophagySignals) {
    addBucket(buckets, buildBucket({
      label: "proteostasis / autophagy / lysosomal modulation",
      whyPlausible:
        "when the disease frame includes aggregate pressure, autophagy, or lysosomal dysfunction, a useful lane is targeted modulation of proteostasis rather than treating the whole case like simple extracellular inflammation.",
      entryHandleLogic:
        isMuscleDeliveryContext
          ? "this lane needs a tissue-targeted uptake route that can deliver a proteostasis-modulating active species into affected muscle tissue while preserving chronic tolerability."
          : "this lane needs a delivery handle or localizing route that can push a proteostasis-modulating active species into the right cells or subcellular setting.",
      requiredAssumptions: uniqueStrings([
        "autophagy or lysosomal dysfunction is close enough to the causal biology to matter therapeutically",
        "the active species can modulate proteostasis without worsening tissue stress or causing broad systemic effects",
      ]),
      mainFailureMode:
        "this lane fails if autophagy or lysosomal modulation is too indirect, too nonspecific, or too toxic under chronic dosing.",
      diseaseSpecificConstraints: [
        "mixed inflammatory + degenerative biology",
        isMuscleDeliveryContext ? "muscle delivery" : "",
        "productive intracellular routing",
        "chronic dosing tolerability",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          textIncludesAny(
            [
              item.label,
              item.claim,
              item.rationale,
              ...item.themes,
              ...item.mechanismHints,
              ...item.sourceLabels,
            ].join(" "),
            [/\bautophagy\b/i, /\blysosom/i, /\bproteostasis\b/i, /\baggregate\b/i],
          ),
      ),
      suggestedModalities: ["oligo conjugate", "pdc", "smdc"],
    }, abstraction));
  }

  if (!isNeuroBarrierCase && isMixedPathologyCase && (hasAtrophyOrRemodelingSignals || isMuscleDeliveryContext)) {
    addBucket(buckets, buildBucket({
      label: "supportive anabolic / anti-atrophy biologic logic",
      whyPlausible:
        "if the disease frame includes chronic tissue loss, weakness, or remodeling pressure, a supportive anabolic or anti-atrophy lane can be a useful conditional strategy even if it is not the whole disease-modifying story.",
      entryHandleLogic:
        "this lane needs either a tissue-biased biologic handle, a selective receptor axis, or a half-life / localization strategy that can support the affected tissue without pretending to solve every upstream mechanism at once.",
      requiredAssumptions: uniqueStrings([
        "preserving tissue mass or function would still be clinically meaningful even if the root disease biology remains only partly addressed",
        "the supportive lane can be delivered chronically without losing too much selectivity or tolerability",
      ]),
      mainFailureMode:
        "this lane fails if it only improves a downstream wasting phenotype without changing meaningful function, or if the supportive biology adds systemic liability under chronic dosing.",
      diseaseSpecificConstraints: [
        "mixed inflammatory + degenerative biology",
        isMuscleDeliveryContext ? "muscle delivery" : "tissue remodeling pressure",
        "chronic dosing tolerability",
        "non-cytotoxic fit",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          textIncludesAny(
            [
              item.label,
              item.claim,
              item.rationale,
              ...item.themes,
              ...item.mechanismHints,
              ...item.sourceLabels,
            ].join(" "),
            [/\batrophy\b/i, /\bwasting\b/i, /\bfibrosis\b/i, /\bmuscle\b/i, /\bremodel/i],
          ),
      ),
      suggestedModalities: ["adc", "pdc", "oligo conjugate"],
    }, abstraction));
  }

  if (!isNeuroBarrierCase && abstraction.cytotoxicFit === "discouraged" && abstraction.pathologyType !== "oncology") {
    addBucket(buckets, buildBucket({
      label: "classical cytotoxic conjugates are a weak-fit comparator",
      whyPlausible:
        "it is still useful to state this lane explicitly because the disease frame is chronic and non-oncologic, which makes classical cell-killing payload logic a weak default fit unless the biology shifts toward selective cell depletion.",
      entryHandleLogic:
        "this lane would only become viable if there were a selective cell-depletion target or entry handle that could justify cytotoxic delivery without worsening chronic tissue injury or broad immune depletion.",
      requiredAssumptions: [
        "the real therapeutic intent has changed from modulation or interception to selective cell depletion",
        "a sufficiently selective target or entry handle exists to support cytotoxic delivery safely",
      ],
      mainFailureMode:
        "this lane is usually the wrong fit because the same payload logic that works in oncology can create avoidable chronic toxicity when there is no true cell-depletion rationale.",
      diseaseSpecificConstraints: [
        "non-cytotoxic fit",
        abstraction.treatmentContext === "chronic" ? "chronic dosing tolerability" : "",
        abstraction.pathologyType === "autoimmune/inflammatory" ? "immune-inflammatory selectivity" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.themes.some((theme) =>
            ["chronic non-oncology", "autoimmune/inflammatory", "immune modulation", "non-cytotoxic fit"].includes(theme),
          ),
      ),
      suggestedModalities: ["adc", "rdc", "smdc"],
    }, abstraction));
  }

  if (abstraction.pathologyType === "oncology" && abstraction.cytotoxicFit !== "discouraged") {
    addBucket(buckets, buildBucket({
      label: "target-conditioned payload delivery",
      whyPlausible:
        "the disease context supports payload delivery only after a real accessible target and payload mechanism are chosen.",
      entryHandleLogic:
        "this bucket needs a selective tumor-associated target or ligand handle with enough accessibility, retention, and when relevant internalization to justify the payload logic.",
      requiredAssumptions: uniqueStrings([
        "there is a selective and usable tumor-associated target",
        abstraction.internalizationRequirement === "required"
          ? "the target can support productive internalization"
          : undefined,
        "the therapeutic window can tolerate the intended payload mechanism",
      ]),
      mainFailureMode:
        "this bucket drops away if selectivity, internalization or retention, payload sensitivity, or safety-window logic does not hold once the target is made explicit.",
      diseaseSpecificConstraints: [
        "tumor selectivity and target window",
        abstraction.internalizationRequirement === "required" ? "productive internalization" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) =>
          item.mechanismHints.includes("cytotoxic delivery") ||
          item.themes.some((theme) => ["oncology", "cell-surface targeting", "internalization"].includes(theme)),
      ),
      suggestedModalities: ["adc", "pdc", "smdc"],
    }, abstraction));
  }

  if (abstraction.therapeuticIntent === "localized radiobiology") {
    addBucket(buckets, buildBucket({
      label: "radioligand localization",
      whyPlausible:
        "the active payload logic here is localization plus isotope effect, not classical free-drug release.",
      entryHandleLogic:
        "this bucket needs a target-retention handle or ligand that can localize isotope exposure where dosimetry can actually do the therapeutic work.",
      requiredAssumptions: [
        "the biology benefits from localization and dosimetry rather than pathway modulation alone",
        "a suitable ligand or target handle exists for isotope delivery",
      ],
      mainFailureMode:
        "this bucket fails if isotope localization is not actually aligned with the disease mechanism or tissue-access problem.",
      diseaseSpecificConstraints: [
        abstraction.deliveryAccessibility === "barrier-limited" ? "bbb / barrier-limited exposure" : "",
        "localization and dosimetry fit",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) => item.mechanismHints.includes("radiobiology"),
      ),
      suggestedModalities: ["rdc"],
    }, abstraction));
  }

  if (abstraction.therapeuticIntent === "enzyme/prodrug activation") {
    addBucket(buckets, buildBucket({
      label: "local activation / enzyme-prodrug logic",
      whyPlausible:
        "the biology suggests selectivity may come from local activation chemistry rather than the carrier alone.",
      entryHandleLogic:
        "this bucket needs a way to localize the catalytic or prodrug-activation step to the relevant tissue, microenvironment, or cell compartment.",
      requiredAssumptions: [
        "the activation step survives conjugation",
        "local activation is strong enough to beat background activity",
      ],
      mainFailureMode:
        "this bucket fails if catalytic competence or local activation selectivity does not survive real biological conditions.",
      diseaseSpecificConstraints: [
        "local activation selectivity",
        abstraction.treatmentContext === "chronic" ? "repeat-dosing tolerability" : "",
      ].filter(Boolean),
      supportingEvidenceIds: findEvidenceIds(
        evidenceObjects,
        (item) => item.mechanismHints.includes("enzyme/prodrug"),
      ),
      suggestedModalities: ["enzyme conjugate"],
    }, abstraction));
  }

  return buckets.slice(0, 5);
}

function buildDominantConstraints(
  input: NormalizedCase,
  abstraction: BiologicalAbstraction,
): string[] {
  const promptText = `${input.prompt} ${input.parsed.cleanedPrompt}`.toLowerCase();
  if (input.broadOncologyNoTarget) {
    return [
      "tumor antigen selection is the main unresolved design decision",
      "tumor-normal expression separation decides the therapeutic window",
      "internalization, retention, shedding, and heterogeneity decide class fit",
      "payload sensitivity and bystander need must match the tumor biology",
      "normal GI, liver, marrow, and on-target/off-tumor risk need early testing",
      "no final conjugate winner is responsible until target and payload logic are named",
    ];
  }

  const hasNeuromuscularOligoFamilySignals =
    input.diseaseArea === "neuromuscular" &&
    abstraction.pathologyType === "genetic/rna-driven" &&
    abstraction.therapeuticIntent === "gene/rna modulation" &&
    /\bduchenne\b|\bdmd\b|\bmuscular dystrophy\b|\bmyotonic\b|\bfshd\b|\bmuscle\b/.test(promptText);
  const hasSpliceCorrectionSignals =
    abstraction.therapeuticIntent === "gene/rna modulation" &&
    abstraction.compartmentNeed === "nuclear" &&
    /\bsplice\b|\bexon\b|transcript correction|transcript rescue|splice-switching|exon skipping|exon-skipping|51st exon|exon 51/.test(
      promptText,
    );
  return uniqueStrings([
    ...abstraction.deliveryBarriers,
    abstraction.deliveryAccessibility !== "unknown"
      ? abstraction.deliveryAccessibility === "barrier-limited"
        ? "brain or tissue exposure is a major delivery barrier"
        : abstraction.deliveryAccessibility === "intracellular difficult"
          ? "productive intracellular routing is still unsolved"
          : "systemic exposure alone may not solve the delivery problem"
      : undefined,
    abstraction.compartmentNeed !== "unknown"
      ? abstraction.compartmentNeed === "mixed"
        ? "the biology spans more than one compartment or cell state"
        : abstraction.compartmentNeed === "nuclear"
          ? "the active species has to reach the nucleus"
          : abstraction.compartmentNeed === "cytosolic"
            ? "the active species has to reach the cytosol"
            : abstraction.compartmentNeed === "extracellular"
              ? "the relevant biology looks more extracellular than intracellular"
              : "the construct has to work after cellular uptake and processing"
      : undefined,
    abstraction.treatmentContext !== "unknown"
      ? abstraction.treatmentContext === "chronic"
        ? "the disease likely needs chronic dosing and tolerability"
        : "the setting may allow a shorter or more aggressive treatment window"
      : undefined,
    abstraction.cytotoxicFit !== "unknown"
      ? abstraction.cytotoxicFit === "discouraged"
        ? "classical cytotoxic payload logic is a poor fit"
        : abstraction.cytotoxicFit === "favored"
          ? "cell-killing payload logic is biologically plausible"
          : "cytotoxic logic is conditional rather than default"
      : undefined,
    abstraction.pathologyType === "mixed"
      ? "mixed inflammatory + degenerative biology"
      : undefined,
    hasSpliceCorrectionSignals && input.diseaseArea === "neuromuscular"
      ? "muscle delivery and productive nuclear routing"
      : undefined,
    hasNeuromuscularOligoFamilySignals
      ? "muscle delivery and productive intracellular routing"
      : undefined,
    !input.target?.canonical ? "the target or entry handle is still unresolved" : undefined,
  ]).slice(0, 6);
}

function buildMostInformativeClarifier(
  input: NormalizedCase,
  abstraction: BiologicalAbstraction,
  interpretationMode: "tentative" | "grounded",
): string {
  const promptText = `${input.prompt} ${input.parsed.cleanedPrompt}`.toLowerCase();
  const hasNeuromuscularOligoFamilySignals =
    input.diseaseArea === "neuromuscular" &&
    abstraction.pathologyType === "genetic/rna-driven" &&
    abstraction.therapeuticIntent === "gene/rna modulation" &&
    /\bduchenne\b|\bdmd\b|\bmuscular dystrophy\b|\bmyotonic\b|\bfshd\b|\bmuscle\b/.test(promptText);
  const hasSpliceCorrectionSignals =
    abstraction.therapeuticIntent === "gene/rna modulation" &&
    abstraction.compartmentNeed === "nuclear" &&
    /\bsplice\b|\bexon\b|transcript correction|transcript rescue|splice-switching|exon skipping|exon-skipping|51st exon|exon 51/.test(
      promptText,
    );

  if (interpretationMode === "tentative") {
    if (input.broadOncologyNoTarget) {
      const diseaseLabel = input.disease?.canonical ?? input.disease?.raw ?? "this cancer";
      return `which ${diseaseLabel} biology should we ground first: disease-specific surface antigen, cell-of-origin, immune microenvironment, localization route, payload sensitivity, or another mechanism?`;
    }

    if (!input.target?.canonical && input.parsed.mechanismHints.length === 0) {
      return "what do you want the conjugate to do first: improve delivery, change the biology, compare conjugate classes, or sketch a starting construct?";
    }

    if (!input.target?.canonical) {
      return "which missing piece matters most here: the target or entry handle, the active mechanism, or the format/linker/payload build itself?";
    }
  }

  if (hasSpliceCorrectionSignals && input.diseaseArea === "neuromuscular") {
    return "which delivery handle do you want to prioritize first: peptide-conjugated oligo uptake, receptor-mediated muscle delivery, or a plain pmo/aso reference comparator?";
  }

  if (hasNeuromuscularOligoFamilySignals) {
    return "which part do you want to collapse first: the transcript-modulating oligo scaffold itself, peptide-assisted muscle uptake, or receptor-mediated muscle delivery?";
  }

  if (
    !input.target?.canonical &&
    abstraction.pathologyType === "mixed" &&
    /\bmuscle\b|\bmyositis\b|\bmyopathy\b/.test(promptText)
  ) {
    return "which biology lane do you want to collapse first: immune-cell modulation, muscle-targeted oligo or pathway delivery, or proteostasis / mitochondrial support?";
  }

  if (!input.target?.canonical && abstraction.pathologyType === "mixed") {
    return "which biology lane do you want to collapse first: immune modulation, tissue-targeted pathway or oligo delivery, or protective proteostasis support?";
  }

  if (!input.target?.canonical && abstraction.deliveryAccessibility === "barrier-limited") {
    return "what brain-entry route or transport handle do you actually want to leverage?";
  }

  if (!input.target?.canonical && abstraction.mechanismLocation === "intracellular") {
    return "what target or uptake handle do you want to use for productive intracellular delivery?";
  }

  if (!input.target?.canonical && abstraction.mechanismLocation === "extracellular") {
    return "is the real plan extracellular occupancy/localization, or do you actually need intracellular pathway control?";
  }

  if (abstraction.therapeuticIntent === "unknown") {
    return "what therapeutic mechanism matters most here: pathway modulation, gene/rna modulation, cytotoxic delivery, radioligand localization, or local activation?";
  }

  return "what single target or entry handle would collapse the most uncertainty in this case?";
}

export function buildDiseaseExploration(
  input: NormalizedCase,
  context: {
    abstraction: BiologicalAbstraction;
    mechanismInference: MechanismInference;
    evidenceObjects: EvidenceObject[];
  },
): DiseaseExploration | null {
  if (input.recommendationScope !== "disease-level") {
    return null;
  }

  const { abstraction, mechanismInference, evidenceObjects } = context;
  const antibodyMediatedAutoimmune =
    abstraction.pathologyType === "autoimmune/inflammatory" &&
    [
      input.prompt,
      input.parsed.cleanedPrompt,
      input.disease?.canonical ?? "",
      ...evidenceObjects.flatMap((item) => [item.label, item.claim, item.rationale, ...item.themes]),
    ]
      .join(" ")
      .match(/\b(autoantibody|pathogenic igg|fcrn|complement|myasthenia gravis|pemphigus|musk|acetylcholine receptor|lrp4|desmoglein)\b/i) !== null;
  const receptorDefinedAutoimmuneFamily =
    [input.prompt, input.parsed.cleanedPrompt, input.disease?.canonical ?? ""]
      .join(" ")
      .match(/\b(myasthenia gravis|pemphigus|neuromyelitis optica|autoimmune encephalitis)\b/i) !== null;

  const strategyBuckets = buildStrategyBuckets(input, abstraction, mechanismInference, evidenceObjects);

  if (
    abstraction.pathologyType === "autoimmune/inflammatory" &&
    receptorDefinedAutoimmuneFamily &&
    !strategyBuckets.some((bucket) => bucket.label === "antigen-specific immune modulation / tolerance")
  ) {
    strategyBuckets.push(
      buildAntigenSpecificAutoimmuneBucket(
        abstraction,
        evidenceObjects,
        true,
      ),
    );
  }

  const prioritizedStrategyBuckets = prioritizeStrategyBuckets(strategyBuckets, {
    antibodyMediatedAutoimmune,
  });

  if (!prioritizedStrategyBuckets.length && abstraction.source === "fallback") {
    return null;
  }

  const source =
    prioritizedStrategyBuckets.some((bucket) => bucket.supportingEvidenceIds.length > 0) || abstraction.source === "evidence-driven"
      ? "evidence-driven"
      : abstraction.source === "normalized-context"
        ? "normalized-context"
        : "fallback";
  const interpretationMode = getInterpretationMode(input, abstraction, mechanismInference, evidenceObjects);

  return {
    diseaseFrame: buildDiseaseFrame(input, abstraction, mechanismInference, { interpretationMode }),
    interpretationMode,
    understandingSignals: buildUnderstandingSignals(input, abstraction, mechanismInference),
    strategyBuckets: prioritizedStrategyBuckets,
    dominantConstraints: buildDominantConstraints(input, abstraction),
    mostInformativeClarifier: buildMostInformativeClarifier(input, abstraction, interpretationMode),
    source,
  };
}
