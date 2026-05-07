import type {
  BiologicalAbstraction,
  EvidenceObject,
  MechanismInference,
  NormalizedCase,
} from "./types";

function hasTheme(evidenceObjects: EvidenceObject[], theme: string) {
  return evidenceObjects.some((item) => item.themes.includes(theme));
}

function countTheme(evidenceObjects: EvidenceObject[], theme: string) {
  return evidenceObjects.filter((item) => item.themes.includes(theme)).length;
}

function evidenceText(evidenceObjects: EvidenceObject[]) {
  return evidenceObjects
    .map((item) =>
      [
        item.label,
        item.claim,
        item.rationale,
        ...item.themes,
        ...item.mechanismHints,
        ...(item.modalityHints ?? []),
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join(" ")
    .toLowerCase();
}

export function deriveBiologicalAbstraction(
  input: NormalizedCase,
  evidenceObjects: EvidenceObject[],
  mechanismInference?: MechanismInference | null,
): BiologicalAbstraction {
  const targetText = `${input.target?.canonical ?? ""} ${input.parsed.targetMention ?? ""} ${input.prompt}`.toLowerCase();
  const promptText = `${input.prompt} ${input.parsed.mechanismHints.join(" ")}`.toLowerCase();
  const diseaseText = `${input.disease?.canonical ?? ""} ${input.parsed.diseaseMention ?? ""}`.toLowerCase();
  const evidenceBlob = evidenceText(evidenceObjects);
  const resolvedMechanismClass = mechanismInference?.mechanismClass ?? input.mechanismClass;
  const cnsBarrier = hasTheme(evidenceObjects, "cns / bbb");
  const neurodegeneration = hasTheme(evidenceObjects, "neurodegeneration");
  const geneModulation = hasTheme(evidenceObjects, "gene modulation") || resolvedMechanismClass === "gene modulation";
  const immuneBiology = hasTheme(evidenceObjects, "immune biology") || resolvedMechanismClass === "immune modulation";
  const radiobiology = hasTheme(evidenceObjects, "radiobiology") || resolvedMechanismClass === "radiobiology";
  const enzymeProdrug = hasTheme(evidenceObjects, "enzyme / prodrug") || resolvedMechanismClass === "enzyme/prodrug";
  const targetMissing = hasTheme(evidenceObjects, "target missing");
  const chronicNonOncology = hasTheme(evidenceObjects, "chronic dosing") || hasTheme(evidenceObjects, "non-oncology");
  const extracellularCue = /(extracellular|soluble|neutralizing|neutralize|cytokine|tgf-beta|tgfb|amyloid plaque|plaque clearance|amyloid-beta|aβ|abeta)/i.test(targetText);
  const transportCue = /(transport|receptor-mediated|uptake|shuttle)/i.test(targetText);
  const smallMoleculeCue = /(ligand|folate|psma|caix|fap|acetazolamide|galnac)/i.test(targetText);
  const cnsDiseaseCue = /(glioblastoma|gbm|glioma|brain tumor|brain|cns|alzheimer|parkinson|huntington|amyloid|tau)/i.test(targetText);
  const namedNeurodegenerationCue =
    /(alzheimer|parkinson|huntington|amyotrophic lateral sclerosis|als|friedreich ataxia|progressive supranuclear palsy|multiple system atrophy|corticobasal degeneration|neurodegenerative)/i.test(
      `${promptText} ${diseaseText}`,
    );
  const nuclearCue = /(splice|splice switching|splice rescue|exon skipping|exon-skipping|exon 51|51st exon|exon error|pmo|antisense)/i.test(promptText);
  const cytosolicCue = /(sirna|rnai|knockdown|mrna silencing|cytosolic)/i.test(promptText);
  const proteostasisCue = /\bproteostasis\b|\baggregate\b|\bprotein aggregation\b|\bmisfold/i.test(evidenceBlob);
  const mitochondrialCue = /\bmitochond/i.test(evidenceBlob);
  const autophagyCue = /\bautophagy\b|\blysosom/i.test(evidenceBlob);
  const muscleDegenerationCue =
    /\bmuscle\b|\bmyofiber\b|\bmyogenic\b|\bmyositis\b|\bmyopathy\b/.test(promptText) ||
    /\bmuscle\b|\bmyofiber\b|\bmyogenic\b|\bmyopathy\b/.test(evidenceBlob);
  const supportiveRemodelingCue =
    /\batrophy\b|\bwasting\b|\bfibrosis\b|\bremodel/i.test(evidenceBlob);
  const cellProcessingCueText = `${promptText} ${targetText} ${evidenceBlob}`;
  const targetBearingCellCue = /\b(target[- ]bearing cell|cell type|cell state|tumou?r cell|cancer cell|immune cell|endothelial|neuron|glia|astrocyte|microglia|hepatocyte|stromal|fibroblast|epithelial)\b/i.test(cellProcessingCueText);
  const recyclingCue = /\b(recycl|fcrn|receptor recycling|recycling compartment)\b/i.test(cellProcessingCueText);
  const degradationCue = /\b(degrad|lysosom|catabol|proteostasis|autophagy)\b/i.test(cellProcessingCueText);
  const transcytosisCue = /\b(transcytos|bbb shuttle|brain[- ]?entry|receptor-mediated transport|transport receptor)\b/i.test(cellProcessingCueText);
  const endosomalCue = /\b(endosom|escape|clathrin|caveolin|macropinocytosis)\b/i.test(cellProcessingCueText);
  const microenvironmentCue = /\b(microenvironment|hypoxi|acidic|low ph|protease|stroma|stromal|fibrosis|fibrotic|interstitial pressure|necrosis|vascular permeability|immune infiltrate|myeloid|caf|matrix)\b/i.test(cellProcessingCueText);
  const mixedPathologyContext =
    immuneBiology &&
    (proteostasisCue || mitochondrialCue || autophagyCue || muscleDegenerationCue || supportiveRemodelingCue);

  const deliveryBarriers: string[] = [];
  const translationalConstraints: string[] = [];
  const abstractionRationale: string[] = [];

  let pathologyType: BiologicalAbstraction["pathologyType"] = "unknown";
  if (input.diseaseArea === "oncology") pathologyType = "oncology";
  else if (mixedPathologyContext) pathologyType = "mixed";
  else if (geneModulation || input.diseaseArea === "neuromuscular") pathologyType = "genetic/rna-driven";
  else if (neurodegeneration || cnsBarrier || namedNeurodegenerationCue) pathologyType = "neurodegeneration";
  else if (immuneBiology || input.diseaseArea === "autoimmune") pathologyType = "autoimmune/inflammatory";
  else if (input.diseaseArea === "metabolic") pathologyType = "metabolic";

  let therapeuticIntent: BiologicalAbstraction["therapeuticIntent"] = "unknown";
  switch (resolvedMechanismClass) {
    case "cytotoxic delivery":
      therapeuticIntent = "cytotoxic elimination";
      break;
    case "gene modulation":
      therapeuticIntent = "gene/rna modulation";
      break;
    case "pathway modulation":
      therapeuticIntent = "pathway modulation";
      break;
    case "immune modulation":
      therapeuticIntent = "immune modulation";
      break;
    case "radiobiology":
      therapeuticIntent = "localized radiobiology";
      break;
    case "enzyme/prodrug":
      therapeuticIntent = "enzyme/prodrug activation";
      break;
  }

  if (
    therapeuticIntent === "unknown" &&
    (pathologyType === "neurodegeneration" || namedNeurodegenerationCue) &&
    input.diseaseArea !== "oncology"
  ) {
    therapeuticIntent = geneModulation ? "gene/rna modulation" : "pathway modulation";
    abstractionRationale.push(
      "named neurodegenerative disease biology should stay in pathway- or gene-modulation territory rather than defaulting to unknown therapeutic intent.",
    );
  }

  let targetClass: BiologicalAbstraction["targetClass"] = "unknown";
  if (!input.target?.canonical) targetClass = "none yet";
  else if (input.explicitLigandSupport || smallMoleculeCue) targetClass = "small-molecule ligand handle";
  else if (transportCue) targetClass = "transport receptor/uptake handle";
  else if (extracellularCue) targetClass = "soluble/extracellular factor";
  else targetClass = "cell-surface protein";

  if (targetClass === "none yet" && extracellularCue) {
    targetClass = "soluble/extracellular factor";
    abstractionRationale.push("mechanism wording points to a soluble or extracellular target class even before full target normalization.");
  }

  let deliveryAccessibility: BiologicalAbstraction["deliveryAccessibility"] = "unknown";
  if (cnsBarrier) {
    deliveryAccessibility = "barrier-limited";
    deliveryBarriers.push("blood-brain barrier access");
    abstractionRationale.push("corpus-backed disease biology repeatedly points to cns / bbb constraints.");
  } else if (cnsDiseaseCue) {
    deliveryAccessibility = "barrier-limited";
    deliveryBarriers.push("central nervous system access");
    abstractionRationale.push("the prompt itself points to a brain or cns disease context, so delivery should stay barrier-aware.");
  } else if (input.needsIntracellularAccess) {
    deliveryAccessibility = "intracellular difficult";
    deliveryBarriers.push("productive intracellular routing");
    abstractionRationale.push("the biology still requires intracellular access rather than purely extracellular action.");
  } else if (input.target?.canonical) {
    deliveryAccessibility = "systemic accessible";
  }

  let mechanismLocation: BiologicalAbstraction["mechanismLocation"] = "unknown";
  if (geneModulation || input.needsIntracellularAccess || input.needsNuclearAccess) mechanismLocation = "intracellular";
  else if (mixedPathologyContext) mechanismLocation = "mixed";
  else if (immuneBiology || radiobiology) mechanismLocation = "mixed";
  else if (input.diseaseArea === "oncology") mechanismLocation = "mixed";

  let treatmentContext: BiologicalAbstraction["treatmentContext"] = input.chronicContext ? "chronic" : "acute";
  if (!input.chronicContext && !chronicNonOncology) {
    treatmentContext = "acute";
  }

  let cytotoxicFit: BiologicalAbstraction["cytotoxicFit"] = "unknown";
  if (therapeuticIntent === "cytotoxic elimination") cytotoxicFit = "favored";
  else if (cnsBarrier || neurodegeneration || chronicNonOncology || therapeuticIntent === "pathway modulation" || therapeuticIntent === "gene/rna modulation") {
    cytotoxicFit = "discouraged";
    abstractionRationale.push("the grounded disease biology is chronic and non-cytotoxic by default.");
  } else if (input.diseaseArea === "oncology") {
    cytotoxicFit = "conditional";
  }

  let internalizationRequirement: BiologicalAbstraction["internalizationRequirement"] = "unknown";
  if (input.needsInternalization) internalizationRequirement = "required";
  else if (input.hasSelectiveSurfaceTarget || input.targetInternalizationKnown !== "unknown") internalizationRequirement = "helpful";
  else if (cnsBarrier || radiobiology) internalizationRequirement = "not central";

  let compartmentNeed: BiologicalAbstraction["compartmentNeed"] = "unknown";
  if (input.needsNuclearAccess) compartmentNeed = "nuclear";
  else if (extracellularCue || targetClass === "soluble/extracellular factor") compartmentNeed = "extracellular";
  else if (nuclearCue) compartmentNeed = "nuclear";
  else if (cytosolicCue) compartmentNeed = "cytosolic";
  else if (input.needsInternalization) compartmentNeed = "lysosomal/internalizing";
  else if (mixedPathologyContext) compartmentNeed = "mixed";
  else if (immuneBiology) compartmentNeed = "extracellular";
  else if (cnsBarrier && therapeuticIntent === "pathway modulation") compartmentNeed = "mixed";

  if (targetMissing || targetClass === "none yet") {
    translationalConstraints.push("target or entry-handle is still undefined");
    abstractionRationale.push("the planner still lacks a real target-conditioned entry point.");
  }
  if (cnsBarrier) {
    translationalConstraints.push("brain exposure and transport feasibility");
  }
  if (chronicNonOncology || treatmentContext === "chronic") {
    translationalConstraints.push("repeat-dosing tolerability");
  }
  if (input.targetDensityKnown === "unknown") {
    translationalConstraints.push("target density / turnover unknown");
  }

  const cellProcessingGates = Array.from(new Set([
    targetBearingCellCue || input.target?.canonical
      ? "target-bearing cell identity and disease state"
      : "disease-driving cell type still undefined",
    recyclingCue
      ? "receptor recycling and target-mediated sink"
      : "recycling versus degradation still unmeasured",
    degradationCue
      ? "lysosomal degradation or proteostasis routing"
      : "lysosomal routing and active-compartment delivery still unmeasured",
    transcytosisCue || deliveryAccessibility === "barrier-limited"
      ? "transcytosis / barrier transport execution"
      : "productive uptake versus nonproductive binding",
    endosomalCue || input.needsIntracellularAccess
      ? "endosomal escape or endosomal sorting"
      : "",
  ].filter(Boolean)));

  const microenvironmentPressures = Array.from(new Set([
    microenvironmentCue ? "microenvironment-specific exposure and release pressure" : "",
    input.diseaseArea === "oncology" ? "heterogeneity, stroma, vascular access, and normal-tissue exposure" : "",
    input.targetDensityKnown !== "unknown"
      ? `target density state: ${input.targetDensityKnown}`
      : "target density state: unknown",
    deliveryAccessibility === "barrier-limited" ? "barrier and tissue-distribution gradients" : "",
    chronicNonOncology || treatmentContext === "chronic" ? "repeat-dose tissue accumulation and tolerability" : "",
  ].filter(Boolean)));

  const decisionLogicFrame = [
    "start with disease-driving biology and therapeutic event",
    "map antigen or entry-handle relevance, expression, accessibility, and normal-tissue overlap",
    "test target-bearing cell processing: uptake, recycling, degradation, transcytosis, and active-compartment access",
    "stress-test microenvironment, PK/PD, and safety before choosing format, linker, payload, DAR, or chemistry",
    "label each step as measured, inferred, or speculative before making a recommendation",
  ];

  if (geneModulation) {
    abstractionRationale.push("retrieved evidence and mechanism grounding support sequence- or pathway-modulation logic more than released-warhead biology.");
  } else if (therapeuticIntent === "pathway modulation") {
    abstractionRationale.push("mechanism inference now points to pathway modulation rather than cytotoxic elimination.");
  }
  if (mixedPathologyContext) {
    abstractionRationale.push("the evidence surface shows mixed inflammatory plus degenerative or proteostasis biology, so the planner should preserve multiple non-cytotoxic lanes instead of collapsing into a single extracellular immune story.");
  }

  const evidenceDrivenSignals =
    countTheme(evidenceObjects, "cns / bbb") +
    countTheme(evidenceObjects, "neurodegeneration") +
    countTheme(evidenceObjects, "gene modulation") +
    countTheme(evidenceObjects, "immune biology");

  const source: BiologicalAbstraction["source"] =
    evidenceDrivenSignals > 0
      ? "evidence-driven"
      : mechanismInference?.source === "evidence"
        ? "evidence-driven"
        : mechanismInference?.source === "fallback-profile"
          ? "fallback"
          : "normalized-context";

  return {
    pathologyType,
    therapeuticIntent,
    targetClass,
    deliveryAccessibility,
    deliveryBarriers,
    mechanismLocation,
    treatmentContext,
    cytotoxicFit,
    internalizationRequirement,
    compartmentNeed,
    cellProcessingGates,
    microenvironmentPressures,
    decisionLogicFrame,
    translationalConstraints,
    abstractionRationale,
    source,
  };
}
