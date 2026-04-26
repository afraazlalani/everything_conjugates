import { NextRequest, NextResponse } from "next/server";
import { assessConfidence } from "@/lib/design-research/confidence";
import { analyzeConflictSignals } from "@/lib/design-research/conflict-analysis";
import { deriveBiologicalAbstraction } from "@/lib/design-research/biological-abstraction";
import { buildDiseaseExploration } from "@/lib/design-research/disease-exploration";
import { buildEvidenceObjects, buildThemeDiagnostics } from "@/lib/design-research/evidence-builder";
import { DISEASE_MECHANISM_PROFILES } from "@/lib/design-research/config";
import { buildDiseaseGrounding } from "@/lib/design-research/disease-grounding";
import { buildDiseaseBiologyQueries } from "@/lib/design-research/disease-biology";
import { inferMechanismFromEvidence } from "@/lib/design-research/mechanism-inference";
import { selectOncologyPrecedentPlaybook } from "@/lib/design-research/oncology-precedent";
import { selectOligoPrecedentAnchors } from "@/lib/design-research/oligo-precedent";
import { parseConjugateQuery } from "@/lib/design-research/parser";
import { normalizeConjugateCase } from "@/lib/design-research/normalizer";
import { evaluateMechanisticGates } from "@/lib/design-research/mechanistic-gates";
import { scoreModalities } from "@/lib/design-research/scorer";
import { buildWhyNotResults } from "@/lib/design-research/why-not-engine";
import type {
  BiologicalAbstraction,
  DiseaseGrounding,
  EvidenceObject,
  NormalizedCase,
  OligoPrecedentAnchorSet,
  OncologyPrecedentPlaybook,
  ParsedQuery,
  PlannerTrace as PipelineTrace,
  RetrievedSourceBucket,
} from "@/lib/design-research/types";

type PlannerState = {
  idea?: string;
  mustHave?: string;
  avoid?: string;
  target?: string;
  constraints?: string;
  modality?: string;
  goal?: string;
  targetClass?: string;
  targetExpression?: string;
  internalization?: string;
  payloadClass?: string;
  linkerType?: string;
  releaseGoal?: string;
  bystander?: string;
};

type ResponseMode = "normal" | "deep" | "max-depth";

type ResponseFlow = {
  requestedMode: ResponseMode;
  effectiveMode: ResponseMode;
  complexity: "simple" | "moderate" | "complex";
  stages: string[];
};

type RankedOption = {
  name: string;
  rank: number;
  summary: string;
  fitReason: string;
  limitReason: string;
  gateStatus?: "allowed" | "penalized" | "gated out";
  gateReasons?: string[];
  missingEvidence?: string[];
  upgradeEvidence?: string[];
  totalScore?: number;
  bestEvidenceFor?: string;
  mainReasonAgainst?: string;
  whatMustBeTrue?: string;
  pros: string[];
  cons: string[];
};

type EvidenceSource = {
  label: string;
  href?: string;
  why?: string;
  type?: string;
};

type PrecedentSource = {
  label: string;
  href: string;
  why: string;
  type:
    | "approved product"
    | "clinical candidate"
    | "company/platform precedent"
    | "official anchor"
    | "modality analog";
};

type MatrixCategory = string;

type MatrixCell = {
  category: MatrixCategory;
  score: number;
  reason: string;
};

type MatrixSummaryRow = {
  modality: string;
  total: number;
  cells: MatrixCell[];
};

type ValidationPass = {
  name: string;
  passed: boolean;
  note: string;
};

type EuropePmcResult = {
  id?: string;
  title?: string;
  journalTitle?: string;
  pubYear?: string;
  source?: string;
  pmid?: string;
  doi?: string;
  authorString?: string;
};

type ClinicalTrialResult = {
  nctId: string;
  briefTitle: string;
  condition?: string;
  intervention?: string;
};

type InnovativeIdea = {
  ideaName: string;
  whyInteresting: string;
  assumptionMustBeTrue: string;
  firstExperiment: string;
  whyItCouldFail: string;
  riskLevel: "practical" | "speculative" | "high-risk";
  sourceLabels: string[];
};

type ConstructBlueprintField = {
  title: string;
  body: string;
};

type ConstructBlueprint = {
  conditional: boolean;
  explicitlyRequested: boolean;
  format?: ConstructBlueprintField;
  linker?: ConstructBlueprintField;
  payload?: ConstructBlueprintField;
  constraints: string[];
  precedentNote?: string;
  tradeoff?: string;
};

type PresentationSummary =
  | {
      mode: "recommended-starting-point";
      title: string;
      bestConjugateClass: string;
      decisionFocus?: "class" | "format" | "linker" | "payload" | "chemistry";
      targetOrEntryHandle: string;
      recommendedFormat?: string;
      recommendedLinker?: string;
      recommendedPayload?: string;
      recommendedChemistry?: string;
      confidence: string;
      rationale: string;
      mainMissingEvidence?: string;
      biggestWatchout?: string;
      firstValidationStep?: string;
    }
  | {
      mode: "concept-explainer";
      title: string;
      bestConjugateClass: string;
      confidence: string;
      rationale: string;
      whatItIs: string;
      bestFit: string;
      mainWatchout: string;
      bestClarifier?: string;
    }
  | {
      mode: "best-current-strategy-direction";
      title: string;
      status: string;
      strategyLanes: string[];
      confidence: string;
      explorationConfidence: string;
      dominantConstraints: string[];
      bestClarifier: string;
      rationale: string;
      mainMissingEvidence?: string;
    };

type BiologySection = {
  title: string;
  body: string;
  sources?: EvidenceSource[];
};

type BiologyValidationPass = {
  name: string;
  passed: boolean;
  note: string;
};

type StrategyTableRow = {
  rank: string;
  strategy: string;
  bestFormat: string;
  linkerOrDeliveryLogic: string;
  payloadOrActiveSpecies: string;
  whyItFits: string;
  riskOrFailureMode: string;
  evidenceLabel?: string;
};

type ModalityViabilityRow = {
  modality: string;
  status: "lead" | "provisional" | "conditional" | "not viable" | "abstain";
  reason: string;
  missingEvidence: string;
  upgradeEvidence: string;
};

type RankingPreviewRow = {
  rank: string;
  strategy: string;
  score?: string;
  summary: string;
  whyItFits: string;
  risk?: string;
};

type UiContract = {
  plannerResponsePrimary: boolean;
  topCard: boolean;
  strategyTable: boolean;
  rankingSection: boolean;
  innovationSection: boolean;
  visualRanking: boolean;
  evidenceVisualization: boolean;
  debugCollapsedByDefault: boolean;
  compactRenderer: boolean;
  formatPayloadFieldsPresentWhenAvailable: boolean;
  noRecommendedNotViableOverlap?: boolean;
};

type ViabilityBuckets = {
  feasibleNames: string[];
  notViableNames: string[];
  leadStrength: "strong" | "provisional" | "none";
  noStrongClassYet: boolean;
  contradictionFree: boolean;
};

type FollowUpAnswer = {
  kind:
    | "contradiction"
    | "why-not"
    | "ranking"
    | "evidence"
    | "clarify"
    | "simplify"
    | "first-test"
    | "media"
    | "table"
    | "lane-detail"
    | "contextual-refinement";
  title: string;
  answer: string;
  bullets?: string[];
  usedPreviousResult: boolean;
  laneLabel?: string;
  externalImagesAvailable?: boolean;
};

type ConversationSlots = {
  disease?: string;
  target?: string;
  topic?: string;
  topModality?: string;
  activeLane?: string;
  questionFrame?: "concept" | "disease-level" | "target-conditioned" | "construct";
  therapeuticIntent?: string;
  pendingClarifier?: string;
};

type PresentationVariant =
  | "document-brief"
  | "blueprint-first"
  | "table-first"
  | "visual-follow-up";

type DocumentSection = {
  title: string;
  body: string;
  bullets?: string[];
};

type ModalityConceptKey = (typeof MODALITY_ORDER)[number];

type DepthModuleCard = {
  title: string;
  badge?: string;
  body: string;
  bullets?: string[];
};

type DepthModule = {
  key:
    | "format-options"
    | "linker-options"
    | "payload-options"
    | "chemistry-options"
    | "biology-pressures"
    | "creative-paths"
    | "prototype-plan";
  title: string;
  summary: string;
  cards: DepthModuleCard[];
};

type PreviousPlannerResult = {
  conversationBaseResult?: PreviousPlannerResult | null;
  conversationSlots?: ConversationSlots;
  topPick?: string;
  topPickWhy?: string;
  summary?: string;
  topic?: string;
  text?: string;
  ranking?: RankedOption[];
  matrix?: MatrixSummaryRow[];
  confidence?: {
    level?: string;
    explorationLevel?: string;
    winnerLevel?: string;
    abstain?: boolean;
    blueprintAllowed?: boolean;
    factors?: Array<{
      label: string;
      impact: "positive" | "negative" | "neutral";
      note: string;
    }>;
  };
  presentation?: PresentationSummary;
  constructBlueprint?: ConstructBlueprint;
  evidenceAnchors?: EvidenceSource[];
  uncertainties?: string[];
  sectionOrder?: string[];
  validationPasses?: ValidationPass[];
  innovativeIdeas?: InnovativeIdea[];
  strategyTable?: StrategyTableRow[];
  rankingPreview?: RankingPreviewRow[];
  uiContract?: UiContract;
  biology?: BiologySection[];
  biologyValidationPasses?: BiologyValidationPass[];
  exploration?: ReturnType<typeof buildDiseaseExploration> | null;
  trace?: Partial<PipelineTrace>;
  viabilityBuckets?: ViabilityBuckets;
  presentationVariant?: PresentationVariant;
  documentSections?: DocumentSection[];
  followUpAnswer?: FollowUpAnswer;
  responseFlow?: ResponseFlow;
};

function stripConversationState(result?: PreviousPlannerResult | null): PreviousPlannerResult | null {
  if (!result) return null;
  const { conversationBaseResult: _conversationBaseResult, followUpAnswer: _followUpAnswer, ...rest } = result;
  return rest;
}

function getConversationBaseResult(previousResult?: PreviousPlannerResult | null): PreviousPlannerResult | null {
  return previousResult?.conversationBaseResult ?? stripConversationState(previousResult);
}

function resolveConversationSlots(result?: PreviousPlannerResult | null): ConversationSlots {
  const baseResult = getConversationBaseResult(result) ?? result;
  if (!baseResult) return {};

  const disease =
    baseResult.conversationSlots?.disease ??
    baseResult.trace?.normalization?.disease?.canonical ??
    baseResult.trace?.parser?.diseaseMention;
  const target =
    baseResult.conversationSlots?.target ??
    baseResult.trace?.normalization?.target?.canonical ??
    baseResult.trace?.parser?.targetMention;
  const activeLane =
    result?.followUpAnswer?.kind === "lane-detail" && result.followUpAnswer.laneLabel
      ? result.followUpAnswer.laneLabel
      : baseResult.conversationSlots?.activeLane ??
        baseResult.exploration?.strategyBuckets?.[0]?.label;

  const questionFrame =
    baseResult.conversationSlots?.questionFrame ??
    (baseResult.presentation?.mode === "concept-explainer"
      ? "concept"
      : baseResult.presentation?.mode === "recommended-starting-point"
        ? "construct"
        : baseResult.trace?.normalization?.recommendationScope === "target-conditioned"
          ? "target-conditioned"
          : "disease-level");

  return {
    disease,
    target,
    topic: baseResult.conversationSlots?.topic ?? baseResult.topic,
    topModality: baseResult.conversationSlots?.topModality ?? baseResult.topPick,
    activeLane,
    questionFrame,
    therapeuticIntent:
      baseResult.conversationSlots?.therapeuticIntent ??
      baseResult.trace?.abstraction?.therapeuticIntent,
    pendingClarifier:
      baseResult.conversationSlots?.pendingClarifier ??
      (baseResult.presentation?.mode === "best-current-strategy-direction"
        ? baseResult.presentation.bestClarifier
        : baseResult.presentation?.mode === "concept-explainer"
          ? baseResult.presentation.bestClarifier
          : baseResult.exploration?.mostInformativeClarifier),
  };
}

function detectPromptComplexity(
  prompt: string,
  state: PlannerState,
  previousResult?: PreviousPlannerResult | null,
): ResponseFlow["complexity"] {
  const text = `${prompt} ${Object.values(state).join(" ")}`.toLowerCase();
  const wordCount = cleanTopic(prompt).split(/\s+/).filter(Boolean).length;
  const denseSignals = [
    /\bpk\b|\bpd\b|\bpkpd\b/i,
    /\binternalization\b/i,
    /\bphysicochemical\b/i,
    /\bdar\b/i,
    /\blinker\b/i,
    /\bpayload\b/i,
    /\bchemistr/i,
    /\bformat\b/i,
    /\bconstruct\b|\bbuild\b|\bblueprint\b/i,
    /\bstep by step\b/i,
    /\bcompare\b|\bversus\b|\bvs\b/i,
    /\bmechanism\b|\bbiology\b/i,
    /\btable\b|\bchart\b|\bplot\b|\bimage\b/i,
  ].filter((pattern) => pattern.test(text)).length;

  if (wordCount >= 24 || denseSignals >= 4 || Boolean(previousResult?.followUpAnswer)) return "complex";
  if (wordCount >= 10 || denseSignals >= 2) return "moderate";
  return "simple";
}

function resolveResponseMode(
  requestedMode: ResponseMode | undefined,
  complexity: ResponseFlow["complexity"],
): ResponseMode {
  if (requestedMode && requestedMode !== "normal") return requestedMode;
  if (complexity === "complex") return "deep";
  return "normal";
}

function buildResponseFlow(
  requestedMode: ResponseMode | undefined,
  prompt: string,
  state: PlannerState,
  previousResult?: PreviousPlannerResult | null,
): ResponseFlow {
  const complexity = detectPromptComplexity(prompt, state, previousResult);
  const effectiveMode = resolveResponseMode(requestedMode, complexity);
  const stages =
    effectiveMode === "max-depth"
      ? [
          "parsing the brief",
          "mapping biology and mechanism",
          "checking delivery and construct fit",
          "building ranking and tensions",
          "assembling visuals, tables, and evidence",
        ]
      : effectiveMode === "deep"
        ? [
            "parsing the brief",
            "checking biology and delivery fit",
            "ranking plausible strategies",
            "assembling the answer",
          ]
        : [
            "parsing the brief",
            "ranking plausible strategies",
            "assembling the answer",
          ];

  return {
    requestedMode: requestedMode ?? "normal",
    effectiveMode,
    complexity,
    stages,
  };
}

type FollowUpIntent =
  | { kind: "contradiction" }
  | { kind: "why-not"; modality: string }
  | { kind: "ranking" }
  | { kind: "evidence" }
  | { kind: "clarify" }
  | { kind: "simplify" }
  | { kind: "first-test" }
  | { kind: "media" }
  | { kind: "table" }
  | { kind: "lane-detail"; laneLabel: string };

type ContextualRefinementIntent = {
  kind: "contextual-refinement";
  mergedPrompt: string;
  contextLabel: string;
  requestedFocus: string;
};

type StructuredRefinementFields = Partial<
  Record<
    | "modality"
    | "goal"
    | "target"
    | "payload"
    | "linker"
    | "format"
    | "chemistry"
    | "dar"
    | "constraints"
    | "mechanism",
    string
  >
>;

const MODALITY_ORDER = [
  "adc",
  "pdc",
  "smdc",
  "oligo conjugate",
  "rdc",
  "enzyme conjugate",
] as const;

const MODALITY_QUERIES: Record<(typeof MODALITY_ORDER)[number], string[]> = {
  adc: ['"antibody-drug conjugate"', "ADC"],
  pdc: ['"peptide-drug conjugate"', "PDC"],
  smdc: ['"small molecule-drug conjugate"', '"small-molecule drug conjugate"', "SMDC"],
  "oligo conjugate": ['"oligonucleotide conjugate"', '"antibody-oligonucleotide conjugate"', '"siRNA conjugate"', '"antisense conjugate"'],
  rdc: ['radioligand', '"radionuclide drug conjugate"', '"radiopharmaceutical conjugate"'],
  "enzyme conjugate": ['"enzyme-prodrug"', '"enzyme conjugate"', '"enzyme-directed prodrug"'],
};

const OPTION_MAP: Record<(typeof MODALITY_ORDER)[number], Omit<RankedOption, "rank">> = {
  adc: {
    name: "adc",
    summary: "best when a clear surface target and an intracellular cytotoxic release story already make biological sense.",
    fitReason: "works best when the target window is strong enough to justify a large antibody carrier and classical payload release.",
    limitReason: "weak fit when the problem is really gene modulation, compact tissue access, or isotope localization rather than intracellular cytotoxic release.",
    pros: ["most mature cytotoxic conjugate toolkit", "strong half-life support", "broad linker and payload precedent"],
    cons: ["largest carrier", "needs a real target window", "penetration can lag smaller formats"],
  },
  pdc: {
    name: "pdc",
    summary: "best when a peptide can carry the targeting job and you want a compact middle ground between adc and smdc.",
    fitReason: "useful when a peptide already has believable binding biology and the construct needs to stay smaller than an antibody.",
    limitReason: "weak fit when peptide stability, short exposure, or payload mass quickly destroy the targeting element.",
    pros: ["compact", "modular", "good bridge between adc and smdc logic"],
    cons: ["proteolysis pressure", "payload bulk hurts quickly", "shorter systemic exposure"],
  },
  smdc: {
    name: "smdc",
    summary: "best when a true small-molecule ligand exists and compact chemistry-driven design is the main advantage.",
    fitReason: "strong when the targeting pharmacophore itself is small, validated, and tolerant of linker and payload attachment.",
    limitReason: "weak fit when conjugation quickly breaks ligand affinity or when the payload chemistry overwhelms the pharmacophore.",
    pros: ["smallest classical targeted-conjugate format", "fast tissue access", "fully medicinal-chemistry driven"],
    cons: ["pk and kidney issues show up early", "ligand tolerance can collapse", "payload bulk matters immediately"],
  },
  "oligo conjugate": {
    name: "oligo conjugate",
    summary: "best when the therapeutic mechanism is RNA-directed knockdown, splice switching, or antisense modulation.",
    fitReason: "strong when the disease biology is gene modulation and the construct is meant to deliver a functional oligo scaffold instead of a classical warhead.",
    limitReason: "weak fit when the real need is bystander cytotoxicity, extracellular pharmacology, or a free small-molecule payload.",
    pros: ["direct sequence-specific biology", "clear scaffold logic", "best fit for exon skipping and knockdown problems"],
    cons: ["productive trafficking is hard", "not a bystander platform", "uptake can overstate true activity"],
  },
  rdc: {
    name: "rdc",
    summary: "best when target localization plus isotope physics are the real efficacy engine.",
    fitReason: "strong when the payload is radiation itself and the design question is ligand-chelator-isotope fit rather than free-drug release.",
    limitReason: "weak fit when the desired biology depends on intracellular free payload release instead of radiobiology and dosimetry.",
    pros: ["does not need classical free-drug release", "can work with partial internalization", "clinically strong radioligand precedents exist"],
    cons: ["chelation and dosimetry dominate", "normal-organ exposure is central", "payload logic is completely different"],
  },
  "enzyme conjugate": {
    name: "enzyme conjugate",
    summary: "best when local catalysis or prodrug activation is the true source of selectivity.",
    fitReason: "strong when the therapeutic logic depends on an enzyme step rather than the carrier alone.",
    limitReason: "weak fit when catalytic competence and local activation are too fragile to survive the in vivo system.",
    pros: ["can create local activation logic", "useful for prodrug systems", "good when delivery alone is not enough"],
    cons: ["complex assays", "background activity can break selectivity", "catalytic competence is fragile"],
  },
};

const MODALITY_LONG_NAME: Record<ModalityConceptKey, string> = {
  adc: "antibody-drug conjugate",
  pdc: "peptide-drug conjugate",
  smdc: "small-molecule drug conjugate",
  "oligo conjugate": "oligonucleotide conjugate",
  rdc: "radioconjugate",
  "enzyme conjugate": "enzyme-based conjugate",
};

function toDisplayModalityName(modality: ModalityConceptKey) {
  if (modality === "oligo conjugate" || modality === "enzyme conjugate") {
    return modality.replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return modality.toUpperCase();
}

function detectExplainerModality(parsedQuery: ParsedQuery, prompt: string): ModalityConceptKey | null {
  const normalizedPrompt = normalize(prompt);
  if (/\bantibody[- ]drug conjugates?\b|\badcs?\b/.test(normalizedPrompt)) return "adc";
  if (/\bpeptide[- ]drug conjugates?\b|\bpdcs?\b/.test(normalizedPrompt)) return "pdc";
  if (/\bsmall[- ]molecule[- ]drug conjugates?\b|\bsmdcs?\b/.test(normalizedPrompt)) return "smdc";
  if (/\bradioconjugates?\b|\brdcs?\b|\bradioligands?\b/.test(normalizedPrompt)) return "rdc";
  if (/\benzyme conjugates?\b|\benzyme[- ]prodrug\b/.test(normalizedPrompt)) return "enzyme conjugate";
  if (/\boligo conjugates?\b|\boligonucleotide conjugates?\b|\bantisense conjugates?\b|\bsirna conjugates?\b/.test(normalizedPrompt)) {
    return "oligo conjugate";
  }

  const firstMentioned = parsedQuery.mentionedModalities.find((item) =>
    ["adc", "pdc", "smdc", "rdc", "oligo", "enzyme conjugate"].includes(item),
  );

  if (firstMentioned === "oligo") return "oligo conjugate";
  if (firstMentioned === "adc" || firstMentioned === "pdc" || firstMentioned === "smdc" || firstMentioned === "rdc") {
    return firstMentioned;
  }
  if (firstMentioned === "enzyme conjugate") return "enzyme conjugate";
  return null;
}

function buildConceptDocumentSections(modality: ModalityConceptKey): DocumentSection[] {
  const option = OPTION_MAP[modality];
  const displayName = toDisplayModalityName(modality);

  const corePartsBullets =
    modality === "rdc"
      ? [
          "targeting handle: the ligand, peptide, antibody fragment, or targeting scaffold that brings the isotope to the biology.",
          "linker / chelator system: the coordination chemistry that has to hold the radiometal cleanly in vivo.",
          "payload: the isotope itself, because radiation delivery is the therapeutic engine here.",
        ]
      : modality === "oligo conjugate"
        ? [
            "targeting or delivery handle: galnac, peptide, antibody fragment, or another carrier that improves productive uptake.",
            "linker or attachment logic: often designed to preserve the oligo pharmacology instead of releasing a classical free warhead.",
            "payload: the active oligo scaffold itself, such as aso, sirna, or pmo cargo.",
          ]
        : [
            "targeting carrier: the antibody, peptide, ligand, or enzyme system that gets the construct to the biology.",
            "linker or attachment logic: the chemistry that controls stability, release, and what survives after uptake.",
            "payload or active species: the warhead, oligo, isotope, or catalytic system that actually creates the therapeutic effect.",
          ];

  return [
    {
      title: "What It Is",
      body: `${displayName} means ${MODALITY_LONG_NAME[modality]}. ${completeSentence(option.summary)}`,
    },
    {
      title: "Core Parts",
      body: `${displayName} is usually easiest to understand as carrier plus linker plus active species, but what each part does depends on the class.`,
      bullets: corePartsBullets,
    },
    {
      title: "When It Fits Best",
      body: completeSentence(option.fitReason),
      bullets: option.pros.map((item) => completeSentence(item)),
    },
    {
      title: "Where It Breaks",
      body: completeSentence(option.limitReason),
      bullets: option.cons.map((item) => completeSentence(item)),
    },
  ];
}

function buildConceptSuggestedFollowUps(modality: ModalityConceptKey) {
  const label = toDisplayModalityName(modality);
  return [
    `when would you use ${label} instead of another class?`,
    `${label} examples`,
    `what are the main risks of ${label}?`,
    `show me a ${label} build table`,
    `compare ${label} vs PDC`,
    "make it simpler",
  ];
}

const APPROVAL_ANCHORS: Record<(typeof MODALITY_ORDER)[number], PrecedentSource[]> = {
  adc: [
    {
      label: "Trodelvy FDA approval",
      href: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-grants-regular-approval-sacituzumab-govitecan-triple-negative-breast-cancer",
      why: "commercial adc precedent showing a validated antibody-plus-cytotoxic playbook in oncology.",
      type: "official anchor",
    },
    {
      label: "Enhertu FDA approval",
      href: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-fam-trastuzumab-deruxtecan-nxki-unresectable-or-metastatic-her2-positive-breast-cancer",
      why: "commercial adc precedent for a high-potency antibody payload system with strong clinical validation.",
      type: "official anchor",
    },
  ],
  pdc: [
    {
      label: "Lutathera FDA approval",
      href: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-lutetium-lu-177-dotatate-gastroenteropancreatic-neuroendocrine-tumors",
      why: "approved somatostatin-peptide radioligand precedent for neuroendocrine disease, useful only when the prompt actually points to peptide-targeted radioligand logic.",
      type: "official anchor",
    },
  ],
  smdc: [
    {
      label: "Endocyte/Novartis SMDC platform review",
      href: "https://pubmed.ncbi.nlm.nih.gov/38396351/",
      why: "review anchor for modern small-molecule drug conjugate design logic and target classes.",
      type: "company/platform precedent",
    },
  ],
  "oligo conjugate": [
    {
      label: "Givlaari FDA approval",
      href: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-givosiran-acute-hepatic-porphyria",
      why: "approved GalNAc-siRNA precedent showing that conjugated oligo delivery can become a real marketed medicine.",
      type: "official anchor",
    },
    {
      label: "Leqvio FDA approval",
      href: "https://www.fda.gov/drugs/news-events-human-drugs/fda-approves-add-therapy-lower-cholesterol-among-certain-high-risk-adults",
      why: "approved GalNAc-siRNA precedent for durable liver-directed RNA interference in a broad commercial setting.",
      type: "official anchor",
    },
  ],
  rdc: [
    {
      label: "Pluvicto FDA approval",
      href: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-pluvicto-metastatic-castration-resistant-prostate-cancer",
      why: "approved radioligand precedent showing a validated ligand-chelator-isotope therapy path.",
      type: "official anchor",
    },
    {
      label: "Pluvicto FDA expanded indication",
      href: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-expands-pluvictos-metastatic-castration-resistant-prostate-cancer-indication",
      why: "shows continuing commercial expansion of the radioligand class in a major target setting.",
      type: "official anchor",
    },
  ],
  "enzyme conjugate": [
    {
      label: "MIP-1404 / iobenguane platform review",
      href: "https://pubmed.ncbi.nlm.nih.gov/38396351/",
      why: "broad review anchor when thinking about enzyme/prodrug and catalytic delivery logic as a less mature class.",
      type: "company/platform precedent",
    },
  ],
};

const OLIGO_DISEASE_CUE =
  /(duchenne|dmd|muscular dystrophy|myotonic dystrophy|myotonic dystrophy type 1|dm1|dm 1|cug repeat|repeat expansion|spliceopathy|exon skipping|splice switching|antisense|sirna|aso|pmo|gene modulation|knockdown|rna toxicity)/;
const DM1_CUE =
  /(myotonic dystrophy|myotonic dystrophy type 1|dm1|dm 1|cug repeat|repeat expansion|spliceopathy|rna toxicity)/;

function normalize(value: string) {
  return value.toLowerCase();
}

function cleanTopic(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[^\w\s/+()-]/g, " ")
    .trim();
}

function tokenize(text: string) {
  return cleanTopic(text)
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function looksLikeConversationPhrase(value?: string) {
  const cleaned = cleanTopic(String(value ?? "")).toLowerCase();
  if (!cleaned) return false;
  return /^(that|this|it|the answer|the last answer|that more clearly|this more clearly|more clearly|that part|this part)$/.test(cleaned);
}

function buildTopic(prompt: string, state: PlannerState) {
  const pieces = [
    prompt,
    state.target,
    state.idea,
    state.goal,
    state.mustHave,
    state.payloadClass,
  ]
    .filter(Boolean)
    .map((item) => cleanTopic(item as string))
    .filter((item) => item.length > 0);

  return pieces.join(" ").slice(0, 220);
}

function buildLimitReason(
  modality: (typeof MODALITY_ORDER)[number],
  prompt: string,
  state: PlannerState,
  fallback: string,
) {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.goal ?? ""} ${state.payloadClass ?? ""}`);

  if (OLIGO_DISEASE_CUE.test(text)) {
    if (modality === "rdc") {
      return DM1_CUE.test(text)
        ? "weak fit because myotonic dystrophy type 1 is usually an rna-toxicity and splice-biology problem, not a radiobiology problem."
        : "weak fit because this disease usually behaves like a gene-modulation problem, not a radiobiology problem.";
    }
    if (modality === "adc") {
      return DM1_CUE.test(text)
        ? "weak fit because myotonic dystrophy type 1 does not usually call for intracellular cytotoxic payload release from an antibody carrier."
        : "weak fit because this disease does not usually call for intracellular cytotoxic payload release from an antibody carrier.";
    }
    if (modality === "smdc") {
      return DM1_CUE.test(text)
        ? "weak fit because the core therapeutic event in myotonic dystrophy type 1 is usually toxic-rna correction or splice rescue, not a small-molecule payload story."
        : "weak fit because the core therapeutic event is usually oligo-mediated exon skipping or knockdown, not a small-molecule payload story.";
    }
  }

  if (/(radionuclide|radioligand|radiotherapy|theranostic|lu-177|lutetium|actinium|ac-225|y-90|yttrium)/.test(text)) {
    if (modality === "oligo conjugate") {
      return "weak fit because the active payload logic here is radiometal delivery, not rna-directed modulation.";
    }
  }

  return fallback;
}

async function searchEuropePmc(query: string, pageSize = 3): Promise<{
  endpoint: "europepmc";
  requestUrl: string;
  httpStatus?: number;
  hitCount: number;
  results: EuropePmcResult[];
}> {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=${pageSize}&sort=RELEVANCE`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error("europe pmc lookup failed");
  }

  const data = (await response.json()) as {
    hitCount?: number;
    resultList?: { result?: EuropePmcResult[] };
  };

  return {
    endpoint: "europepmc" as const,
    requestUrl: url,
    httpStatus: response.status,
    hitCount: typeof data.hitCount === "number" ? data.hitCount : 0,
    results: data.resultList?.result ?? [],
  };
}

type EuropePmcSearchResult = Awaited<ReturnType<typeof searchEuropePmc>>;
type PubMedDiseaseBiologyResult = Awaited<ReturnType<typeof searchPubMedDiseaseBiology>>;

function emptyEuropePmcResult(query: string, pageSize = 3): EuropePmcSearchResult {
  return {
    endpoint: "europepmc",
    requestUrl: `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=${pageSize}&sort=RELEVANCE`,
    httpStatus: undefined,
    hitCount: 0,
    results: [],
  };
}

async function searchPubMedDiseaseBiology(query: string, retmax = 3): Promise<{
  endpoint: "pubmed";
  requestUrl: string;
  httpStatus?: number;
  hitCount: number;
  results: Array<{ id: string; title: string; pubdate: string }>;
}> {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${retmax}&term=${encodeURIComponent(query)}`;
  const searchResponse = await fetch(searchUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!searchResponse.ok) {
    throw new Error("pubmed disease biology search failed");
  }

  const searchData = (await searchResponse.json()) as {
    esearchresult?: { idlist?: string[]; count?: string };
  };

  const ids = searchData.esearchresult?.idlist ?? [];
  if (!ids.length) {
    return {
      endpoint: "pubmed" as const,
      requestUrl: searchUrl,
      httpStatus: searchResponse.status,
      hitCount: Number(searchData.esearchresult?.count ?? 0),
      results: [] as Array<{ id: string; title: string; pubdate: string }>,
    };
  }

  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`;
  const summaryResponse = await fetch(summaryUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!summaryResponse.ok) {
    throw new Error("pubmed disease biology summary failed");
  }

  const summaryData = (await summaryResponse.json()) as {
    result?: Record<string, { title?: string; pubdate?: string }>;
  };

  return {
    endpoint: "pubmed" as const,
    requestUrl: summaryUrl,
    httpStatus: summaryResponse.status,
    hitCount: Number(searchData.esearchresult?.count ?? ids.length),
    results: ids
      .map((id) => ({
        id,
        title: summaryData.result?.[id]?.title ?? "",
        pubdate: summaryData.result?.[id]?.pubdate ?? "",
      }))
      .filter((item) => item.title),
  };
}

function emptyPubMedDiseaseBiologyResult(query: string, retmax = 3): PubMedDiseaseBiologyResult {
  return {
    endpoint: "pubmed",
    requestUrl: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${retmax}&term=${encodeURIComponent(query)}`,
    httpStatus: undefined,
    hitCount: 0,
    results: [],
  };
}

async function searchPubMedReviews(query: string, retmax = 3) {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=${retmax}&term=${encodeURIComponent(`${query} AND review[pt]`)}`;
  const searchResponse = await fetch(searchUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!searchResponse.ok) {
    throw new Error("pubmed search failed");
  }

  const searchData = (await searchResponse.json()) as {
    esearchresult?: { idlist?: string[] };
  };

  const ids = searchData.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`;
  const summaryResponse = await fetch(summaryUrl, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!summaryResponse.ok) {
    throw new Error("pubmed summary failed");
  }

  const summaryData = (await summaryResponse.json()) as {
    result?: Record<string, { title?: string; pubdate?: string }>;
  };

  return ids
    .map((id) => ({
      id,
      title: summaryData.result?.[id]?.title ?? "",
      pubdate: summaryData.result?.[id]?.pubdate ?? "",
    }))
    .filter((item) => item.title);
}

async function searchClinicalTrials(query: string) {
  const url = `https://clinicaltrials.gov/api/query/study_fields?expr=${encodeURIComponent(
    query,
  )}&fields=NCTId,BriefTitle,Condition,InterventionName&min_rnk=1&max_rnk=3&fmt=json`;
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error("clinicaltrials lookup failed");
  }

  const data = (await response.json()) as {
    StudyFieldsResponse?: {
      StudyFields?: Array<{
        NCTId?: string[];
        BriefTitle?: string[];
        Condition?: string[];
        InterventionName?: string[];
      }>;
    };
  };

  return (data.StudyFieldsResponse?.StudyFields ?? [])
    .map((item) => ({
      nctId: item.NCTId?.[0] ?? "",
      briefTitle: item.BriefTitle?.[0] ?? "",
      condition: item.Condition?.[0] ?? "",
      intervention: item.InterventionName?.[0] ?? "",
    }))
    .filter((item) => item.nctId && item.briefTitle);
}

function computeLiteratureBoost(topic: string, results: EuropePmcResult[]) {
  const topicTokens = new Set(tokenize(topic));
  if (!topicTokens.size || !results.length) return 0;

  const scored = results.map((item) => {
    const titleTokens = new Set(tokenize(item.title ?? ""));
    if (!titleTokens.size) return 0;
    const overlap = [...topicTokens].filter((token) => titleTokens.has(token)).length;
    return overlap / Math.max(topicTokens.size, 1);
  });

  const best = Math.max(...scored, 0);
  const average = scored.reduce((sum, value) => sum + value, 0) / scored.length;
  return Math.min(best * 4 + average * 2, 4);
}

function buildSources(
  topModality: (typeof MODALITY_ORDER)[number],
  topEuropePmc: Awaited<ReturnType<typeof searchEuropePmc>>,
  topPubmed: Awaited<ReturnType<typeof searchPubMedReviews>>,
): EvidenceSource[] {
  const sources: EvidenceSource[] = [];

  topEuropePmc.results.slice(0, 2).forEach((item) => {
    const href = item.pmid
      ? `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/`
      : item.doi
        ? `https://doi.org/${item.doi}`
        : item.id
          ? `https://europepmc.org/article/${item.source ?? "PMC"}/${item.id}`
          : undefined;
    sources.push({
      label: item.title || `${topModality} literature hit`,
      href,
      why: `supports the ${topModality} read with a directly relevant literature hit.`,
      type: "paper",
    });
  });

  topPubmed.slice(0, 2).forEach((item) => {
    sources.push({
      label: item.title,
      href: `https://pubmed.ncbi.nlm.nih.gov/${item.id}/`,
      why: `useful review anchor for the ${topModality} decision.`,
      type: "review",
    });
  });

  return sources.slice(0, 4);
}

function formatThemeList(themes: string[]) {
  return themes
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
}

function buildBiologyTopic(prompt: string, state: PlannerState, normalizedCase?: { disease?: { canonical?: string }; diseaseArea?: string; diseaseSpecificity?: string }) {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.goal ?? ""} ${normalizedCase?.disease?.canonical ?? ""}`);
  const diseaseProfile =
    Object.entries(DISEASE_MECHANISM_PROFILES).find(([canonical, profile]) => {
      void profile;
      return text.includes(canonical.toLowerCase());
    })?.[1];
  const dynamicTerms = (() => {
    if (/(alzheimer'?s|parkinson'?s|huntington'?s|neurodegenerative|brain|cns|amyloid|tau|neuronal)/.test(text)) {
      return [
        "neurodegeneration",
        "central nervous system",
        "blood-brain barrier",
        "brain delivery",
        "amyloid",
        "tau",
        "neuronal transport",
        "pathway modulation",
      ];
    }
    if (normalizedCase?.diseaseArea === "oncology" && normalizedCase?.diseaseSpecificity === "specific") {
      return ["tumor biology", "internalization", "target expression", "therapeutic window"];
    }
    if (normalizedCase?.diseaseArea === "autoimmune") {
      return ["immune mechanism", "autoantibody", "complement", "chronic dosing", "tolerability"];
    }
    return [];
  })();
  const pieces = [
    ...(diseaseProfile?.biologyQueryTerms ?? []),
    ...dynamicTerms,
    normalizedCase?.disease?.canonical,
    state.target,
    state.idea,
    prompt,
    state.goal,
    state.mustHave,
  ]
    .filter(Boolean)
    .map((item) => cleanTopic(item as string))
    .filter(Boolean);

  return `${pieces.join(" ")} biology mechanism pathogenesis therapeutic delivery tissue barrier expression internalization`.trim().slice(0, 320);
}

function buildHumanProteinAtlasSource(state: PlannerState): EvidenceSource | null {
  const rawTarget = cleanTopic(state.target ?? "");
  if (!rawTarget) return null;
  const firstToken = rawTarget.split(/\s+/)[0];
  if (!firstToken || firstToken.length < 2) return null;
  if (/^(conjugate|conjugates|muscular|dystrophy|cancer|disease)$/i.test(firstToken)) return null;
  if (/\bfor\b/i.test(rawTarget)) return null;

  return {
    label: `Human Protein Atlas: ${firstToken}`,
    href: `https://www.proteinatlas.org/search/${encodeURIComponent(firstToken)}`,
    why: "useful target-biology anchor for tissue and cell-type expression context.",
    type: "target biology",
  };
}

function dedupeSources(sources: EvidenceSource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = `${source.label}|${source.href ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildBiologySources(
  state: PlannerState,
  biologyLiterature: Awaited<ReturnType<typeof searchEuropePmc>>,
  biologyReviews: Awaited<ReturnType<typeof searchPubMedReviews>>,
  trialResults: ClinicalTrialResult[],
): EvidenceSource[] {
  const sources: EvidenceSource[] = [];

  biologyLiterature.results.slice(0, 2).forEach((item) => {
    const href = item.pmid
      ? `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/`
      : item.doi
        ? `https://doi.org/${item.doi}`
        : item.id
          ? `https://europepmc.org/article/${item.source ?? "PMC"}/${item.id}`
          : undefined;

    sources.push({
      label: item.title || "biology literature hit",
      href,
      why: "direct disease or target biology literature hit for the current brief.",
      type: "biology paper",
    });
  });

  biologyReviews.slice(0, 2).forEach((item) => {
    sources.push({
      label: item.title,
      href: `https://pubmed.ncbi.nlm.nih.gov/${item.id}/`,
      why: "review-level source for the disease or target biology behind the recommendation.",
      type: "biology review",
    });
  });

  trialResults.slice(0, 1).forEach((trial) => {
    sources.push({
      label: `${trial.briefTitle} (${trial.nctId})`,
      href: `https://clinicaltrials.gov/study/${trial.nctId}`,
      why: "live clinical context that can help show whether this biology is already being pursued in humans.",
      type: "clinical context",
    });
  });

  const hpa = buildHumanProteinAtlasSource(state);
  if (hpa) {
    sources.push(hpa);
  }

  return dedupeSources(sources).slice(0, 6);
}

function buildRetrievalSourceBuckets(
  diseaseBiologyResults: Array<{
    concept: string;
    variant?: string;
    query: string;
    europePmc: Awaited<ReturnType<typeof searchEuropePmc>>;
    pubmed: Awaited<ReturnType<typeof searchPubMedDiseaseBiology>>;
  }>,
  biologyLiterature: Awaited<ReturnType<typeof searchEuropePmc>>,
  biologyReviews: Awaited<ReturnType<typeof searchPubMedReviews>>,
  trialResults: ClinicalTrialResult[],
  literatureSignals: Array<{
    modality: (typeof MODALITY_ORDER)[number];
    literatureStrength: number;
    hitCount: number;
    literature: Awaited<ReturnType<typeof searchEuropePmc>>;
  }>,
): RetrievedSourceBucket[] {
  const diseaseBiologyItems = diseaseBiologyResults.flatMap((item) =>
    [
      ...item.europePmc.results.slice(0, 1).map((result) => ({
        label: result.title || "disease biology literature hit",
        href: result.pmid
          ? `https://pubmed.ncbi.nlm.nih.gov/${result.pmid}/`
          : result.doi
            ? `https://doi.org/${result.doi}`
            : undefined,
        snippet: `europe pmc · ${item.concept} · ${item.query}`,
        sourceType: "biology paper" as const,
      })),
      ...item.pubmed.results.slice(0, 1).map((result) => ({
        label: result.title || "pubmed disease biology hit",
        href: `https://pubmed.ncbi.nlm.nih.gov/${result.id}/`,
        snippet: `pubmed · ${item.concept} · ${item.query}`,
        sourceType: "biology paper" as const,
      })),
    ],
  );

  const modalityItems = literatureSignals
    .filter((item) => item.literature.results.length)
    .flatMap((item) =>
      item.literature.results.slice(0, 1).map((result) => ({
        label: `${item.modality}: ${result.title || `${item.modality} literature hit`}`,
        href: result.pmid
          ? `https://pubmed.ncbi.nlm.nih.gov/${result.pmid}/`
          : result.doi
            ? `https://doi.org/${result.doi}`
            : undefined,
        snippet: `hit count ${item.hitCount}, normalized strength ${item.literatureStrength.toFixed(1)}`,
        sourceType: "paper" as const,
      })),
    );

  const buckets: RetrievedSourceBucket[] = [
    {
      key: "disease biology",
      label: "disease biology",
      items: diseaseBiologyItems,
    },
    {
      key: "biology literature",
      label: "biology literature",
      items: biologyLiterature.results.slice(0, 3).map((item) => ({
        label: item.title || "biology literature hit",
        href: item.pmid
          ? `https://pubmed.ncbi.nlm.nih.gov/${item.pmid}/`
          : item.doi
            ? `https://doi.org/${item.doi}`
            : undefined,
        snippet: item.authorString || item.journalTitle || "",
        sourceType: "biology paper" as const,
      })),
    },
    {
      key: "biology reviews",
      label: "biology reviews",
      items: biologyReviews.slice(0, 3).map((item) => ({
        label: item.title,
        href: `https://pubmed.ncbi.nlm.nih.gov/${item.id}/`,
        snippet: item.pubdate || "",
        sourceType: "biology review" as const,
      })),
    },
    {
      key: "clinical context",
      label: "clinical context",
      items: trialResults.slice(0, 3).map((item) => ({
        label: `${item.briefTitle} (${item.nctId})`,
        href: `https://clinicaltrials.gov/study/${item.nctId}`,
        snippet: `${item.condition ?? ""} ${item.intervention ?? ""}`.trim(),
        sourceType: "clinical context" as const,
      })),
    },
    {
      key: "modality literature",
      label: "modality literature",
      items: modalityItems,
    },
  ];

  return buckets.filter((bucket) => bucket.items.length);
}

function groundingFromProfile(profile?: (typeof DISEASE_MECHANISM_PROFILES)[string]): DiseaseGrounding | null {
  if (!profile) return null;
  return {
    mechanismClass: profile.mechanismClass,
    summary: profile.summary,
    rationale: profile.rationale,
    plausibleDirections: profile.plausibleDirections,
    themes: ["fallback disease profile"],
    confidence: "low",
    supportingSignals: profile.biologyQueryTerms.slice(0, 3),
  };
}

function buildThemeCounts(evidenceObjects: EvidenceObject[]) {
  const counts = new Map<
    string,
    { theme: string; corpus: number; syntheticAggregate: number; fallback: number; total: number }
  >();

  evidenceObjects.forEach((item) => {
    item.themes.forEach((theme) => {
      const current =
        counts.get(theme) ?? { theme, corpus: 0, syntheticAggregate: 0, fallback: 0, total: 0 };
      if (item.origin === "corpus") current.corpus += 1;
      if (item.origin === "synthetic aggregate") current.syntheticAggregate += 1;
      if (item.origin === "fallback") current.fallback += 1;
      current.total += 1;
      counts.set(theme, current);
    });
  });

  return [...counts.values()].sort((left, right) => right.total - left.total || left.theme.localeCompare(right.theme));
}

function buildPrecedentSources(
  topModality: (typeof MODALITY_ORDER)[number],
  prompt: string,
  state: PlannerState,
  trialResults: ClinicalTrialResult[],
  precedentPlaybook?: OncologyPrecedentPlaybook | null,
  oligoPrecedentAnchors?: OligoPrecedentAnchorSet | null,
): PrecedentSource[] {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.goal ?? ""} ${state.idea ?? ""}`);
  const precedents: PrecedentSource[] = [];
  const hasExplicitDiseaseCue = /(disease|cancer|tumou?r|carcinoma|lymphoma|myasthenia|gravis|duchenne|dmd|muscular dystrophy|myotonic dystrophy|dm1|porphyria|cholesterol|prostate|ovarian|breast|lung|colorectal|bladder|urothelial|neuroendocrine)/.test(
    text,
  );
  const isOncologyContext = /(cancer|tumou?r|carcinoma|lymphoma|breast|lung|colorectal|bladder|urothelial|neuroendocrine|ovarian|solid tumor|metastatic|oncology)/.test(
    text,
  );

  trialResults.slice(0, 2).forEach((trial) => {
    precedents.push({
      label: `${trial.briefTitle} (${trial.nctId})`,
      href: `https://clinicaltrials.gov/study/${trial.nctId}`,
      why: `live clinical-trial precedent tied to this prompt through ${trial.condition || "the disease setting"} and ${trial.intervention || "the intervention design"}.`,
      type: "clinical candidate",
    });
  });

  if (precedentPlaybook && precedentPlaybook.modality === topModality) {
    precedents.unshift({
      label: precedentPlaybook.dominantProduct.label,
      href: precedentPlaybook.dominantProduct.href,
      why: `${precedentPlaybook.rationale} this is the dominant current approved-product playbook for this target-conditioned oncology setting.`,
      type: "approved product",
    });

    if (precedentPlaybook.comparatorProduct) {
      precedents.push({
        label: precedentPlaybook.comparatorProduct.label,
        href: precedentPlaybook.comparatorProduct.href,
        why: "useful older comparator product showing how the payload, linker, or therapeutic window logic differs from the current dominant playbook.",
        type: "approved product",
      });
    }
  }

  if (oligoPrecedentAnchors && topModality === "oligo conjugate") {
    const anchorItems = [
      oligoPrecedentAnchors.approvedComparator
        ? {
            label: oligoPrecedentAnchors.approvedComparator.label,
            href: oligoPrecedentAnchors.approvedComparator.href,
            why: oligoPrecedentAnchors.approvedComparator.role,
            type: "approved product" as const,
          }
        : null,
      oligoPrecedentAnchors.conjugatedExample
        ? {
            label: oligoPrecedentAnchors.conjugatedExample.label,
            href: oligoPrecedentAnchors.conjugatedExample.href,
            why: oligoPrecedentAnchors.conjugatedExample.role,
            type: "clinical candidate" as const,
          }
        : null,
      oligoPrecedentAnchors.targetedDeliveryExample
        ? {
            label: oligoPrecedentAnchors.targetedDeliveryExample.label,
            href: oligoPrecedentAnchors.targetedDeliveryExample.href,
            why: oligoPrecedentAnchors.targetedDeliveryExample.role,
            type: "company/platform precedent" as const,
          }
        : null,
      oligoPrecedentAnchors.platformAnchor
        ? {
            label: oligoPrecedentAnchors.platformAnchor.label,
            href: oligoPrecedentAnchors.platformAnchor.href,
            why: oligoPrecedentAnchors.platformAnchor.role,
            type: "company/platform precedent" as const,
          }
        : null,
    ].filter(Boolean) as PrecedentSource[];
    precedents.unshift(...anchorItems);
  }

  if (topModality === "rdc" && /(prostate|psma)/.test(text)) {
    precedents.unshift({
      label: "Novartis Pluvicto program page",
      href: "https://www.novartis.com/our-products/pipeline/pluvicto",
      why: "official company/product precedent for a PSMA-targeted radioligand therapy program.",
      type: "company/platform precedent",
    });
  }

  if (topModality === "pdc" && /(nectin-4|urothelial|bladder)/.test(text)) {
    precedents.unshift({
      label: "BT8009 Nectin-4 clinical program",
      href: "https://www.bicycletherapeutics.com/pipeline/bt8009/",
      why: "target-relevant peptide-drug conjugate clinical precedent for Nectin-4-directed delivery.",
      type: "clinical candidate",
    });
  }

  const hasDiseaseMatchedAnchors = (() => {
    if (!hasExplicitDiseaseCue) return true;
    if (topModality === "adc" || topModality === "rdc") return isOncologyContext;
    if (topModality === "pdc") return /(neuroendocrine|somatostatin|octreotide|dotatate|peptide|nectin-4|bt8009|bicycle)/.test(text);
    if (topModality === "oligo conjugate") {
      return /(duchenne|dmd|muscular dystrophy|myotonic dystrophy|dm1|porphyria|cholesterol|gene modulation|sirna|aso|pmo|antisense)/.test(
        text,
      );
    }
    if (topModality === "smdc") return isOncologyContext;
    return false;
  })();

  const approvalAnchors = (() => {
    if (!hasExplicitDiseaseCue) return APPROVAL_ANCHORS[topModality] ?? [];

    if (topModality === "adc" || topModality === "rdc") {
      return isOncologyContext ? APPROVAL_ANCHORS[topModality] ?? [] : [];
    }

    if (topModality === "pdc") {
      return /(neuroendocrine|somatostatin|octreotide|dotatate|peptide|nectin-4|bt8009|bicycle)/.test(text)
        ? APPROVAL_ANCHORS[topModality] ?? []
        : [];
    }

    if (topModality === "oligo conjugate") {
      if (/(duchenne|dmd|muscular dystrophy|myotonic dystrophy|dm1|porphyria|cholesterol|gene modulation|sirna|aso|pmo|antisense)/.test(text)) {
        return APPROVAL_ANCHORS[topModality] ?? [];
      }
      return [];
    }

    if (topModality === "smdc") {
      return isOncologyContext ? APPROVAL_ANCHORS[topModality] ?? [] : [];
    }

    return [];
  })();

  const modalityAnalogs =
    hasExplicitDiseaseCue && !hasDiseaseMatchedAnchors
      ? (APPROVAL_ANCHORS[topModality] ?? []).slice(0, 2).map((item) => ({
          ...item,
          type: "modality analog" as const,
          why: `${item.why} this is being shown as a class-level analog, not as a disease-matched precedent for the current indication.`,
        }))
      : [];

  return [...precedents, ...approvalAnchors, ...modalityAnalogs].slice(0, 5);
}

function buildRiskAndMove(topModality: (typeof MODALITY_ORDER)[number]) {
  if (topModality === "oligo conjugate") {
    return {
      biggestRisk: "the biggest real risk is confusing uptake with productive delivery. for oligo work, trafficking, endosomal escape, and scaffold choice usually matter more than generic target binding.",
      firstMove: "start by confirming the exact rna goal first: exon skipping vs knockdown vs antisense modulation, then choose pmo vs aso vs sirna around that biology.",
      nextSteps: [
        "confirm whether the disease biology really wants splice switching, knockdown, or antisense modulation.",
        "choose the oligo scaffold first, then pressure-test the delivery handle or conjugation strategy around it.",
        "screen productive activity, not uptake alone.",
      ],
    };
  }

  if (topModality === "rdc") {
    return {
      biggestRisk: "the biggest risk is assuming target binding alone solves the program. in radioligands, organ exposure, chelator fit, and isotope range can dominate the whole window.",
      firstMove: "confirm whether the target localizes strongly enough and whether beta vs alpha emitter logic actually matches the tumor and organ-exposure problem.",
      nextSteps: [
        "lock the target localization story first.",
        "pick the isotope around dosimetry and organ risk, not generic potency language.",
        "only after that optimize chelator and spacer behavior.",
      ],
    };
  }

  if (topModality === "smdc") {
    return {
      biggestRisk: "the biggest risk is that the ligand stops being the same ligand once the linker and payload are real. compact formats get punished early by pk and pharmacophore disruption.",
      firstMove: "prove that the small-molecule binder still keeps useful affinity after the real attachment vector is installed.",
      nextSteps: [
        "screen ligand tolerance to the intended exit vector first.",
        "then tune linker polarity and compactness.",
        "only then choose the payload that the ligand can actually carry.",
      ],
    };
  }

  if (topModality === "pdc") {
    return {
      biggestRisk: "the biggest risk is that the peptide works only as a clean peptide and falls apart as soon as the linker and payload are attached.",
      firstMove: "check whether the peptide still binds and survives long enough once real conjugation load is on it.",
      nextSteps: [
        "compare linear vs cyclic peptide options if stability looks fragile.",
        "keep linker and payload mass under tight control.",
        "screen proteolysis early.",
      ],
    };
  }

  if (topModality === "enzyme conjugate") {
    return {
      biggestRisk: "the biggest risk is background activity or loss of catalytic competence after conjugation.",
      firstMove: "prove that the enzyme or prodrug logic still works after conjugation before optimizing the rest of the platform.",
      nextSteps: [
        "measure catalytic competence after conjugation.",
        "check local activation versus background activation.",
        "only then optimize targeting and linker details.",
      ],
    };
  }

  return {
    biggestRisk: "the biggest risk is forcing adc logic onto a target window that cannot actually support antibody-sized delivery and intracellular cytotoxic release.",
    firstMove: "confirm the target window first: disease selectivity, internalization, and whether the released species really matches the biology you want.",
    nextSteps: [
      "confirm target expression and normal-tissue separation.",
      "check internalization and released-species logic.",
      "then choose linker and payload as a matched pair.",
    ],
  };
}

function isMechanismSpecificSpliceOligoCase(
  prompt: string,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
) {
  const text = normalize(`${prompt} ${normalizedCase.prompt} ${normalizedCase.parsed.cleanedPrompt}`);
  return (
    normalizedCase.mechanismClass === "gene modulation" &&
    abstraction.therapeuticIntent === "gene/rna modulation" &&
    abstraction.compartmentNeed === "nuclear" &&
    abstraction.cytotoxicFit === "discouraged" &&
    /(splice|exon|transcript correction|transcript rescue|splice-switching|exon skipping|exon-skipping|51st exon|exon 51|pmo|aso|antisense)/.test(
      text,
    )
  );
}

function buildConstructGuidance(
  prompt: string,
  parsedQuery: ParsedQuery,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  riskMove: ReturnType<typeof buildRiskAndMove>,
  top?: RankedOption,
  precedentPlaybook?: OncologyPrecedentPlaybook | null,
) {
  const normalizedPrompt = normalize(prompt);
  const constructBlueprintCue =
    /(step by step|how .* look like|how .* would look|what protein|which protein|what oligo|which oligo|what will be the dar|what would be the dar|dar\b|drug antibody ratio|drug-to-antibody ratio|what chemistr(?:y|ies)|which chemistr(?:y|ies)|conjugation)/.test(
      normalizedPrompt,
    );
  const explicitConstructAsk =
    parsedQuery.questionType === "build blueprint" ||
    parsedQuery.questionType === "targeting format" ||
    parsedQuery.questionType === "linker strategy" ||
    parsedQuery.questionType === "payload strategy" ||
    parsedQuery.questionType === "chemistry strategy" ||
    constructBlueprintCue ||
    /(what would you build|what should i build|what linker|which linker|what payload|which payload|what format|which format)/.test(
      normalizedPrompt,
    );

  if (!explicitConstructAsk) return null;

  const coherentEnough =
    normalizedCase.recommendationScope === "target-conditioned" ||
    abstraction.therapeuticIntent !== "unknown" ||
    abstraction.compartmentNeed !== "unknown" ||
    abstraction.deliveryAccessibility !== "unknown";

  if (!coherentEnough) return null;

  const bystanderCue = /(bystander)/.test(normalizedPrompt);
  const lysosomalCue = /(lysosomal|lysosome)/.test(normalizedPrompt);
  const releaseCue = /(release|cleavable)/.test(normalizedPrompt);
  const exonCue = /(splice|exon|splice rescue|exon skipping|exon-skipping|51st exon|exon 51)/.test(normalizedPrompt);
  const spliceOligoCase = isMechanismSpecificSpliceOligoCase(prompt, normalizedCase, abstraction);
  const muscleDeliveryContext =
    normalizedCase.diseaseArea === "neuromuscular" || /(muscle|duchenne|dmd)/.test(normalizedPrompt);
  const formatRequested = parsedQuery.questionType === "targeting format" || /(what format|which format|antibody format|binder format|delivery format)/.test(normalizedPrompt);
  const linkerRequested = parsedQuery.questionType === "linker strategy" || /(what linker|which linker)/.test(normalizedPrompt);
  const payloadRequested = parsedQuery.questionType === "payload strategy" || /(what payload|which payload)/.test(normalizedPrompt);
  const conditional = !top;
  const cnsOncologyBiomarkerCase =
    normalizedCase.recommendationScope === "target-conditioned" &&
    abstraction.pathologyType === "oncology" &&
    abstraction.deliveryAccessibility === "barrier-limited";

  let formatTitle = conditional ? "conditional delivery format" : "starting format";
  let formatBody = conditional
    ? "the build should stay format-conditional until the entry handle and trafficking route are sharper."
    : "the starting format should preserve the biology that is doing the real work.";

  let linkerTitle = conditional ? "conditional linker direction" : "starting linker direction";
  let linkerBody = conditional
    ? "linker logic should stay conditional until the active-species and trafficking story are better pinned down."
    : "the linker should follow the active-species logic, not the other way around.";

  let payloadTitle = conditional ? "conditional payload direction" : "starting payload direction";
  let payloadBody = conditional
    ? "payload direction should stay tied to the mechanism class rather than getting forced too early."
    : "payload choice should stay locked to the therapeutic mechanism.";

  if (abstraction.therapeuticIntent === "gene/rna modulation") {
    formatTitle = spliceOligoCase && muscleDeliveryContext
      ? "ppmo / muscle-targeted oligo format"
      : conditional
        ? "delivery-handle-led oligo format"
        : "oligo-first delivery format";
    formatBody =
      spliceOligoCase && muscleDeliveryContext
        ? "start from a splice-switching oligo format that preserves pmo or aso activity, then pressure-test peptide-conjugated pmo, antibody/fab-oligo, or receptor-mediated muscle-delivery handles around that active cargo."
        : abstraction.compartmentNeed === "nuclear"
          ? "start from an oligo delivery format that preserves nuclear splice or transcript-correction biology instead of forcing a classical released-warhead carrier."
          : "start from an oligo delivery format where productive intracellular routing matters more than a classical large-carrier payload workflow.";
    linkerTitle = spliceOligoCase ? "handle-preserving oligo attachment" : "handle-preserving attachment";
    linkerBody =
      spliceOligoCase
        ? "bias toward a stable attachment that preserves splice-switching pmo or aso activity through productive intracellular routing into the nucleus, rather than chasing free-payload release."
        : abstraction.compartmentNeed === "nuclear"
          ? "bias toward a stable attachment that preserves splice-switching or transcript-correction activity through trafficking into the nucleus."
          : "bias toward a stable attachment that preserves the active strand and delivery handle rather than classical free-payload release.";
    payloadTitle = spliceOligoCase
      ? "pmo / aso splice-switching oligo cargo"
      : abstraction.compartmentNeed === "nuclear"
        ? "splice-switching oligo cargo"
        : "rna-modulating oligo cargo";
    payloadBody =
      spliceOligoCase
        ? "the active species should stay in splice-switching pmo or aso territory, because the real job is nuclear pre-mrna correction rather than a classical cytotoxic or bystander payload event."
        : abstraction.compartmentNeed === "nuclear" || exonCue
          ? "the payload direction should stay in pmo or aso-style splice-switching territory if exon or transcript correction is the real job."
          : "the payload direction should stay in aso or sirna territory depending whether the biology wants modulation, blocking, or knockdown.";
  } else if ((top?.name ?? "") === "adc") {
    if (cnsOncologyBiomarkerCase) {
      formatTitle = conditional ? "smaller binder-first adc screen" : "fab / scfv-biased adc screen";
      formatBody =
        "start by screening smaller antibody-derived binders like fab, scfv, or nanobody-like formats against full igg, because blood-tumor barrier pressure, tumor penetration, and antigen heterogeneity can punish a bulky default format in brain tumors.";
      linkerTitle = "conditional cleavable linker";
      linkerBody =
        "use a cleavable linker only if internalization and intracellular release look believable enough to matter, because glioblastoma needs honest blood-tumor barrier, penetration, and cns safety discipline rather than generic adc cargo optimism.";
      payloadTitle = "conditional cytotoxic payload direction";
      payloadBody =
        "keep payload direction conditional around a membrane-permeable cytotoxic option only if the biomarker really supports uptake and heterogeneous-tumor coverage, while treating cns safety and off-tumor exposure as first-order constraints.";
    } else if (precedentPlaybook?.modality === "adc") {
      formatTitle = precedentPlaybook.dominantProduct.format;
      formatBody = `${precedentPlaybook.dominantProduct.label} is the dominant current playbook here, so the starting format should look like ${precedentPlaybook.dominantProduct.format} rather than a generic alternate carrier.`;
      linkerTitle =
        linkerRequested && /cleavable/i.test(precedentPlaybook.dominantProduct.linker)
          ? "protease-cleavable intracellular-release linker"
          : precedentPlaybook.dominantProduct.linker;
      linkerBody = `the strongest approved-product precedent here points toward ${precedentPlaybook.dominantProduct.linker}. ${
        precedentPlaybook.comparatorProduct
          ? `${precedentPlaybook.comparatorProduct.label} is the useful older comparator with ${precedentPlaybook.comparatorProduct.linker}.`
          : "that should set the default linker direction unless the prompt gives a strong reason to deviate."
      } ${
        linkerRequested && /cleavable/i.test(precedentPlaybook.dominantProduct.linker)
          ? "for a her2 solid-tumor setting, that usually means preferring a protease-cleavable lysosomal-release design over a non-cleavable or pH-fragile shortcut, because the payload still has to survive circulation and then release productively after internalization."
          : ""
      }`;
      payloadTitle = precedentPlaybook.dominantProduct.payload;
      payloadBody = `${precedentPlaybook.dominantProduct.label} makes ${precedentPlaybook.dominantProduct.payload} the leading payload direction here.${
        precedentPlaybook.dominantProduct.bystander ? ` ${precedentPlaybook.dominantProduct.bystander}` : ""
      }`;
    } else {
      formatTitle = "full antibody carrier first";
      formatBody = "start with a full antibody carrier if the target window and internalization story are actually strong enough to support intracellular payload delivery.";
      linkerTitle = bystanderCue || lysosomalCue || releaseCue ? "cleavable linker first" : "stable or tuned-cleavable linker";
      linkerBody =
        bystanderCue
          ? "a cleavable linker is the cleaner first direction if bystander spread is part of the intended biology."
          : lysosomalCue
            ? "a lysosome-aware cleavable linker is the cleaner first direction when the prompt already points to lysosomal processing."
            : "choose linker stability around whether the released species really needs to escape as a free payload or can stay metabolite-led.";
      payloadTitle = bystanderCue ? "membrane-permeable cytotoxic payload" : "classical cytotoxic payload";
      payloadBody =
        bystanderCue
          ? "payload direction should stay in topo-i or other membrane-permeable cytotoxic territory if bystander activity is a real design goal."
          : "payload direction should stay in the classical targeted-cytotoxic playbook only if the target biology really supports internalization and release.";
    }
  } else if ((top?.name ?? "") === "smdc") {
    formatTitle = "small-molecule ligand conjugate";
    formatBody = "start with a compact ligand-led format only if the pharmacophore still behaves like the same binder after real attachment chemistry is installed.";
    linkerTitle = lysosomalCue || releaseCue ? "compact tuned-cleavable linker" : "compact stable linker";
    linkerBody =
      lysosomalCue || releaseCue
        ? "keep the linker compact and tuned around the intended released species, because small-format systems feel bulk and polarity penalties early."
        : "keep the linker compact and polarity-aware so the pharmacophore does not collapse before the payload ever matters.";
    payloadTitle = "compact payload direction";
    payloadBody = "payload direction should stay compact and exposure-aware, because small-format systems get punished early by bulk, polarity, and off-target distribution.";
  } else if ((top?.name ?? "") === "oligo conjugate") {
    formatTitle = "oligo-first delivery format";
    formatBody = "start with the oligo scaffold and the delivery handle together, because the construct only works if the active strand and the trafficking module stay compatible.";
    linkerTitle = "stable terminal attachment";
    linkerBody = "keep the attachment stable and position-aware so the active oligo still does the biology after conjugation.";
    payloadTitle = abstraction.compartmentNeed === "nuclear" ? "nuclear-active oligo cargo" : "intracellular oligo cargo";
    payloadBody =
      abstraction.compartmentNeed === "nuclear"
        ? "payload direction should stay in splice-switching or transcript-correction cargo that can still act after nuclear delivery."
        : "payload direction should stay in the oligo scaffold itself rather than trying to smuggle in a classical released warhead.";
  }

  const tradeoff = riskMove.biggestRisk ? `construct tradeoff\n${riskMove.biggestRisk}` : "";
  const precedentSection =
    precedentPlaybook?.modality === (top?.name ?? "")
      ? [
          "dominant precedent playbook",
          `${precedentPlaybook.dominantProduct.label}: ${precedentPlaybook.rationale}`,
          precedentPlaybook.comparatorProduct
            ? `older comparator: ${precedentPlaybook.comparatorProduct.label} uses ${precedentPlaybook.comparatorProduct.linker} with ${precedentPlaybook.comparatorProduct.payload}.`
            : "",
          precedentPlaybook.dominantProduct.safetyWatchout
            ? `safety watchout: ${precedentPlaybook.dominantProduct.safetyWatchout}`
            : "",
        ]
          .filter(Boolean)
          .join("\n")
      : "";

  const constraints = [
    abstraction.deliveryAccessibility !== "unknown" ? abstraction.deliveryAccessibility : "",
    abstraction.compartmentNeed !== "unknown" ? abstraction.compartmentNeed : "",
    abstraction.internalizationRequirement !== "unknown" ? abstraction.internalizationRequirement : "",
    cnsOncologyBiomarkerCase ? "blood-tumor barrier / tumor penetration" : "",
    cnsOncologyBiomarkerCase ? "antigen heterogeneity / CNS safety window" : "",
  ].filter(Boolean);

  return {
    conditional,
    format: {
      title: formatTitle,
      body: formatBody,
    },
    linker: {
      title: linkerTitle,
      body: linkerBody,
    },
    payload: {
      title: payloadTitle,
      body: payloadBody,
    },
    constraints,
    precedentNote: precedentSection || undefined,
    tradeoff: tradeoff ? tradeoff.replace(/^construct tradeoff\n/i, "") : undefined,
    sections: [
      `${conditional ? "conditional build direction" : "what i’d choose first"}`,
      `format: ${formatTitle}\nwhy: ${formatBody}`,
      `linker: ${linkerTitle}\nwhy: ${linkerBody}`,
      `payload: ${payloadTitle}\nwhy: ${payloadBody}`,
      precedentSection,
      constraints.length ? `construct constraint\n${constraints.join(", ")}` : "",
      tradeoff,
    ].filter(Boolean),
    explicitlyRequested:
      formatRequested ||
      linkerRequested ||
      payloadRequested ||
      constructBlueprintCue ||
      parsedQuery.questionType === "build blueprint",
  };
}

function buildFocusedRequestedDimensionAnswer(
  parsedQuery: ParsedQuery,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  precedentPlaybook?: OncologyPrecedentPlaybook | null,
  chemistryDirection?: ConstructBlueprintField | null,
) {
  if (!top || !constructGuidance) return "";

  if (parsedQuery.questionType === "linker strategy") {
    const linkerDirection = constructGuidance.linker?.title ?? "the linker still needs to stay conditional";
    if (precedentPlaybook?.modality === "adc" && /cleavable/i.test(linkerDirection)) {
      const comparatorClause = precedentPlaybook.comparatorProduct
        ? `use ${precedentPlaybook.comparatorProduct.label} as the non-cleavable comparator if you want to test whether freer release or bystander behavior is actually earning its keep.`
        : "";
      return [
        `${linkerDirection} is the best current linker direction.`,
        `for an internalizing her2-style solid-tumor adc case, that is the cleanest first move because it keeps the construct stable in circulation and still gives you a believable lysosomal release path after uptake.`,
        `i would only reach for hydrazone-style acid-labile logic if you had a very specific reason, because it is usually the noisier and less robust microenvironment story.`,
        comparatorClause,
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (abstraction.mechanismLocation === "extracellular") {
      return `${linkerDirection} is the best current linker direction. because the biology looks more extracellular, the linker should prioritize stability and target engagement over clever cleavage unless the active mechanism truly needs release.`.replace(/\s+/g, " ").trim();
    }

    const linkerReason = constructGuidance.linker?.body ?? "the linker should follow the active-species logic and release route.";
    return `${linkerDirection} is the best current linker direction. ${linkerReason}`.replace(/\s+/g, " ").trim();
  }

  if (parsedQuery.questionType === "payload strategy") {
    const payloadDirection = constructGuidance.payload?.title ?? "the payload still needs to stay conditional";
    const payloadReason = constructGuidance.payload?.body ?? "the payload should follow the therapeutic mechanism.";
    return `${payloadDirection} is the best current payload direction. start there because ${payloadReason.charAt(0).toLowerCase()}${payloadReason.slice(1)}`.replace(/\s+/g, " ").trim();
  }

  if (parsedQuery.questionType === "targeting format") {
    const formatDirection = constructGuidance.format?.title ?? "the format still needs to stay conditional";
    const formatReason = constructGuidance.format?.body ?? "the carrier format should preserve the biology that is doing the real work.";
    return `${formatDirection} is the best current targeting format direction. start there because ${formatReason.charAt(0).toLowerCase()}${formatReason.slice(1)}`.replace(/\s+/g, " ").trim();
  }

  if (parsedQuery.questionType === "chemistry strategy") {
    const chemistryTitle = chemistryDirection?.title ?? "the conjugation chemistry still needs to stay conditional";
    const chemistryReason =
      chemistryDirection?.body ?? "the attachment chemistry should preserve the part of the construct that is doing the real biology.";
    return `${chemistryTitle} is the best current conjugation chemistry direction. start there because ${chemistryReason.charAt(0).toLowerCase()}${chemistryReason.slice(1)}`.replace(/\s+/g, " ").trim();
  }

  return "";
}

function takeLeadingSentences(text: string, maxSentences = 2) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (!sentences.length) return text.trim();
  return sentences.slice(0, maxSentences).join(" ").trim();
}

function buildFocusedValidationStep(
  parsedQuery: ParsedQuery,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  fallback: string,
) {
  if (!constructGuidance) return fallback;

  if (parsedQuery.questionType === "linker strategy") {
    return `compare the proposed linker direction against a stability-first comparator in serum plus an internalization-and-release assay, so you can see whether the release logic is real or only looks good on paper.`;
  }

  if (parsedQuery.questionType === "payload strategy") {
    return `test the proposed payload against the closest plausible comparator in the most disease-relevant activity assay before optimizing the rest of the construct.`;
  }

  if (parsedQuery.questionType === "targeting format") {
    return `compare the proposed carrier format against one larger and one smaller comparator in binding, internalization, and exposure before locking the format.`;
  }

  if (parsedQuery.questionType === "chemistry strategy") {
    return `compare the proposed chemistry against one simpler attachment route in stability, activity retention, and manufacturability before locking the conjugation platform.`;
  }

  return fallback;
}

function getRequestedDecisionFocus(
  parsedQuery: ParsedQuery,
): "class" | "format" | "linker" | "payload" | "chemistry" {
  if (parsedQuery.questionType === "linker strategy") return "linker";
  if (parsedQuery.questionType === "payload strategy") return "payload";
  if (parsedQuery.questionType === "targeting format") return "format";
  if (parsedQuery.questionType === "chemistry strategy") return "chemistry";
  return "class";
}

function buildChemistryDirection(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
): ConstructBlueprintField | null {
  const modality = top?.name?.toLowerCase().trim() ?? "";
  const oligoCase = modality === "oligo conjugate" || normalizedCase.mechanismClass === "gene modulation";

  if (oligoCase) {
    return {
      title: "site-defined bioorthogonal oligo ligation",
      body: "start with a modular click-style or other site-defined oligo attachment that preserves both the active oligo terminus and the delivery handle, because the real risk is breaking hybridization, uptake, or intracellular activity before the biology is even tested.",
    };
  }

  if (modality === "adc") {
    return {
      title: "interchain cysteine first, site-specific cysteine if the program tightens",
      body: "start with interchain cysteine conjugation for a practical first pass, then move to a site-specific cysteine route only if you need tighter DAR control, cleaner PK, or a more reproducible structure-function readout.",
    };
  }

  if (modality === "pdc" || modality === "smdc") {
    return {
      title: "handle-preserving attachment chemistry",
      body: "the chemistry should stay compact and attachment-site-aware, because the first failure mode is often loss of binding or exposure after hanging too much real chemistry off the targeting handle.",
    };
  }

  if (modality === "enzyme conjugate") {
    return {
      title: "site-specific enzymatic or glycan-directed attachment",
      body: "start with a cleaner site-specific attachment route when catalytic competence is part of the therapeutic engine, because random chemistry can break the exact protein surface that has to stay functional.",
    };
  }

  if (modality === "rdc") {
    return {
      title: "chelator-first radiochemistry",
      body: "the chemistry has to protect in-vivo metal coordination first, so the main decision is usually the chelator and labeling workflow rather than classical cleavable-versus-non-cleavable linker logic.",
    };
  }

  if (abstraction.cytotoxicFit === "favored") {
    return {
      title: "cysteine-led attachment with a stability comparator",
      body: "start with a chemistry route that gives cleaner DAR control and better stability discipline, because noisy heterogeneity can hide whether the payload logic is actually working.",
    };
  }

  return {
    title: "the simplest site-aware attachment that preserves biology first",
    body: "when the biology is still broader than the chemistry question, the safest move is to pick the attachment route that least disrupts binding, catalytic function, or active-species behavior before optimizing everything else.",
  };
}

function buildRecommendationText(
  prompt: string,
  parsedQuery: ParsedQuery,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption,
  ranking: RankedOption[],
  matrix: MatrixSummaryRow[],
  riskMove: ReturnType<typeof buildRiskAndMove>,
  sources: EvidenceSource[],
  precedentPlaybook?: OncologyPrecedentPlaybook | null,
  oligoPrecedentAnchors?: OligoPrecedentAnchorSet | null,
) {
  const spliceOligoCase = isMechanismSpecificSpliceOligoCase(prompt, normalizedCase, abstraction);
  const muscleDeliveryContext =
    normalizedCase.diseaseArea === "neuromuscular" || /(muscle|duchenne|dmd)/.test(normalize(prompt));
  const matrixMap = new Map(matrix.map((row) => [row.modality.toLowerCase().trim(), row]));
  const normalizedPrompt = normalize(prompt);
  const askedWhyNot = MODALITY_ORDER.find((modality) =>
    normalizedPrompt.includes(`why not ${modality}`) ||
    normalizedPrompt.includes(`not ${modality}`) ||
    normalizedPrompt.includes(`${modality} instead`)
  );
  const askedForBlueprint =
    /(what would you build|what should i build|what linker|which linker|what payload|which payload|what format|which format|what chemistr(?:y|ies)|which chemistr(?:y|ies)|what conjugation chemistry|which conjugation chemistry)/.test(
      normalizedPrompt
    );
  const viability = partitionRankingByViability(ranking, matrix);
  const feasible = viability.feasible;
  const provisional = !feasible.length && ranking.length ? [ranking[0]] : [];
  const notViable = viability.notViable.filter(
    ({ item }) => !feasible.some((feasibleItem) => feasibleItem.name === item.name) && !provisional.some((provisionalItem) => provisionalItem.name === item.name),
  );

  const feasibleText = [...feasible, ...provisional]
    .map((item) => {
      const score = scoreOutOfTen(matrixMap.get(item.name.toLowerCase().trim())?.total);
      return [
        `${item.rank}. ${item.name}${provisional.some((provisionalItem) => provisionalItem.name === item.name) ? " (provisional / weak lead)" : ""}`,
        typeof score === "number" ? `score: ${score}/10` : "",
        `why it fits: ${completeSentence(item.fitReason)}`,
        `best evidence for: ${completeSentence(item.bestEvidenceFor ?? item.fitReason)}`,
        `main reason against: ${completeSentence(item.mainReasonAgainst ?? item.limitReason)}`,
        `what would have to be true: ${completeSentence(item.whatMustBeTrue ?? "the remaining biology and delivery assumptions would have to hold")}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  const notViableText = notViable
    .map(({ item, reason, score }) =>
      [
        item.name,
        typeof scoreOutOfTen(score) === "number" ? `score: ${scoreOutOfTen(score)}/10` : "",
        `why it drops out: ${completeSentence(reason)}`,
      ]
        .filter(Boolean)
        .join("\n"))
    .join("\n\n");

  const questionedOption = askedWhyNot
    ? ranking.find((item) => item.name === askedWhyNot) ??
      feasible.find((item) => item.name === askedWhyNot) ??
      notViable.find(({ item }) => item.name === askedWhyNot)?.item
    : null;
  const questionedReason = askedWhyNot
    ? notViable.find(({ item }) => item.name === askedWhyNot)?.reason ??
      questionedOption?.mainReasonAgainst ??
      questionedOption?.limitReason
    : "";

  const constructGuidance = buildConstructGuidance(
    prompt,
    parsedQuery,
    normalizedCase,
    abstraction,
    riskMove,
    top,
    precedentPlaybook,
  );
  const precedentSummary =
    precedentPlaybook?.modality === (top.name as (typeof MODALITY_ORDER)[number])
      ? [
          `dominant current playbook\n${precedentPlaybook.dominantProduct.label} is the strongest approved-product anchor here.`,
          `why it matters\n${precedentPlaybook.rationale} the core construct logic is ${precedentPlaybook.dominantProduct.format}, ${precedentPlaybook.dominantProduct.linker}, and ${precedentPlaybook.dominantProduct.payload}.`,
          precedentPlaybook.dominantProduct.bystander
            ? `bystander logic\n${precedentPlaybook.dominantProduct.bystander}`
            : "",
          precedentPlaybook.comparatorProduct
            ? `older comparator\n${precedentPlaybook.comparatorProduct.label} is the older comparator with ${precedentPlaybook.comparatorProduct.linker} and ${precedentPlaybook.comparatorProduct.payload}.`
            : "",
          precedentPlaybook.dominantProduct.safetyWatchout
            ? `safety watchout\n${precedentPlaybook.dominantProduct.safetyWatchout}`
            : "",
        ]
          .filter(Boolean)
          .join("\n\n")
      : oligoPrecedentAnchors?.modality === (top.name as (typeof MODALITY_ORDER)[number])
        ? [
            "reference anchors",
            oligoPrecedentAnchors.approvedComparator
              ? `${oligoPrecedentAnchors.approvedComparator.label}: ${oligoPrecedentAnchors.approvedComparator.role}`
              : "",
            oligoPrecedentAnchors.conjugatedExample
              ? `${oligoPrecedentAnchors.conjugatedExample.label}: ${oligoPrecedentAnchors.conjugatedExample.role}`
              : "",
            oligoPrecedentAnchors.targetedDeliveryExample
              ? `${oligoPrecedentAnchors.targetedDeliveryExample.label}: ${oligoPrecedentAnchors.targetedDeliveryExample.role}`
              : "",
            oligoPrecedentAnchors.platformAnchor
              ? `${oligoPrecedentAnchors.platformAnchor.label}: ${oligoPrecedentAnchors.platformAnchor.role}`
              : "",
          ]
            .filter(Boolean)
            .join("\n")
      : "";

  const directAnswer = askedWhyNot && questionedOption
    ? `direct answer\n${questionedOption.name} is ${[...feasible, ...provisional].some((item) => item.name === questionedOption.name) ? "still viable, but not the best fit here" : "not a legitimate front-runner here"}.\n\nwhy not ${questionedOption.name}\n${questionedReason}\n\nwhy ${top.name} still leads\n${top.fitReason}`
    : spliceOligoCase && top.name === "oligo conjugate"
      ? `direct answer\noligo conjugate is the best current fit.\n\nwhy\nthis prompt already points to exon or splice correction, so the active species should be a splice-switching oligo working on nuclear pre-mrna rather than a classical released warhead.\n\nwhat matters most\n${muscleDeliveryContext ? "the key design constraint is muscle delivery plus productive intracellular routing into muscle nuclei." : "the key design constraint is productive intracellular routing into the nuclear compartment."}\n\nwhat this means\nstart from pmo or aso splice-switching cargo first, then decide whether peptide-conjugated oligo, antibody/fab-oligo delivery, or a simpler reference oligo is the right next lane.`
    : askedForBlueprint
      ? `direct answer\nif i had to build first, i’d start with ${top.name}.\n\nwhy\n${top.fitReason}\n\nwhat this means\nuse the top-ranked targeting, linker, and payload logic underneath as the first construct blueprint.`
      : viability.noStrongClassYet
        ? `direct answer\nthere is no strong conjugate class yet.\n\nwhy\nnone of the current classes clear the biology and delivery bar strongly enough to deserve a confident lead.\n\nwhat this means\nshow the least-bad or provisional options, but keep the answer explicitly conditional until the target, entry handle, or mechanism is sharper.`
        : viability.leadStrength === "provisional"
          ? `direct answer\n${top.name} is only a provisional / weak lead right now.\n\nwhy\n${top.fitReason}\n\nwhat this means\ntreat the ranking as a weak lean, not a settled winner.`
          : `direct answer\n${top.name} is the best current fit.\n\nwhy\n${top.fitReason}`;

  return {
    text: [
      directAnswer,
      precedentSummary,
      constructGuidance?.sections.join("\n\n") ?? "",
      viability.noStrongClassYet
        ? `best current fit\nno strong conjugate class yet`
        : viability.leadStrength === "provisional"
          ? `best current fit\nprovisional / weak lead: ${top.name}`
          : `best current fit\n${top.name}`,
      `why this is leading\n${top.fitReason}`,
      feasibleText
        ? `${viability.noStrongClassYet ? "least-bad / provisional options" : "feasible and worth ranking"}\n${feasibleText}`
        : "",
      notViableText ? `not really viable here\n${notViableText}` : "",
      `main watchout\n${completeSentence(riskMove.biggestRisk)}`,
      `first move\n${completeSentence(riskMove.firstMove)}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    sources,
  };
}

function buildPresentationSummary(
  parsedQuery: ParsedQuery,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  confidence: ReturnType<typeof assessConfidence>,
  top: RankedOption | undefined,
  ranking: RankedOption[],
  topPickWhy: string,
  riskMove: ReturnType<typeof buildRiskAndMove>,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  viabilityBuckets: ViabilityBuckets,
  precedentPlaybook?: OncologyPrecedentPlaybook | null,
): PresentationSummary {
  const targetConditionedNeedsComparison =
    normalizedCase.recommendationScope === "target-conditioned" &&
    !confidence.blueprintAllowed &&
    !constructGuidance?.explicitlyRequested &&
    (
      !normalizedCase.disease?.canonical ||
      normalizedCase.diseaseArea === "unknown" ||
      !precedentPlaybook ||
      viabilityBuckets.leadStrength !== "strong"
    );

  if (confidence.abstain || !top || targetConditionedNeedsComparison) {
    const diseaseBiologyRead =
      exploration
        ? [
            normalizedCase.diseaseArea !== "unknown" ? normalizedCase.diseaseArea : "",
            normalizedCase.mechanismClass !== "unknown" ? normalizedCase.mechanismClass : "",
            normalizedCase.diseaseSpecificity === "specific" ? "named disease" : "",
          ]
            .filter(Boolean)
            .join(" / ")
        : "";
    const exploratoryStrategyLanes =
      exploration?.strategyBuckets.slice(0, 4).map((bucket) => bucket.label) ??
      (
        normalizedCase.recommendationScope === "target-conditioned"
          ? Array.from(
              new Set(
                [
                  top?.name,
                  ...ranking
                    .slice(1, 4)
                    .map((item) => item.name),
                  ...viabilityBuckets.feasibleNames.slice(1, 4),
                ].filter((item): item is string => Boolean(item)),
              ),
            )
          : []
      );
    const exploratoryStatus =
      targetConditionedNeedsComparison
        ? "target-conditioned exploration — keep multiple construct paths open"
        : "exploration mode — no final winner yet";
    const exploratoryClarifier =
      targetConditionedNeedsComparison
        ? constructGuidance?.explicitlyRequested
          ? "which build choice do you want to collapse first: format, linker, payload, or entry handle?"
          : "which disease setting, payload logic, or internalization assumption should lead this target-conditioned case?"
        : exploration?.mostInformativeClarifier ?? "what single target, mechanism, or entry handle do you actually want to leverage?";
    const exploratoryRationale =
      targetConditionedNeedsComparison
        ? [
            `${normalizedCase.target?.canonical ?? normalizedCase.target?.raw ?? "this target"} is a real target-conditioned handle, but the disease setting, payload logic, and internalization story are still too partial to collapse the answer into one winner card yet.`,
            completeSentence(topPickWhy),
            diseaseBiologyRead ? `current biological read: ${diseaseBiologyRead}.` : "",
          ]
            .filter(Boolean)
            .join(" ")
        : [exploration?.diseaseFrame ?? topPickWhy, diseaseBiologyRead ? `current biological read: ${diseaseBiologyRead}.` : ""]
            .filter(Boolean)
            .join(" ");
    return {
      mode: "best-current-strategy-direction",
      title: "best current strategy direction",
      status:
        exploration?.interpretationMode === "tentative"
          ? "current read — still needs one key follow-up"
          : exploratoryStatus,
      strategyLanes: exploratoryStrategyLanes,
      confidence: confidence.level,
      explorationConfidence: confidence.explorationLevel,
      dominantConstraints:
        exploration?.dominantConstraints ??
        [
          normalizedCase.target?.canonical ?? normalizedCase.target?.raw
            ? `target-conditioned on ${normalizedCase.target?.canonical ?? normalizedCase.target?.raw}`
            : "",
          "payload mechanism still unresolved",
          "disease setting still under-specified",
          "internalization or trafficking still needs to be made explicit",
        ].filter(Boolean),
      bestClarifier: exploratoryClarifier,
      rationale: buildDirectAnswerParagraph(normalizedCase, abstraction, confidence, top, exploration),
      mainMissingEvidence: buildMainMissingEvidence(normalizedCase, abstraction, top, exploration),
    };
  }

  const targetOrEntryHandle =
    normalizedCase.target?.canonical ??
    normalizedCase.target?.raw ??
    normalizedCase.disease?.canonical ??
    normalizedCase.disease?.raw ??
    "still needs a sharper target or entry handle";

  const recommendedFormat =
    constructGuidance?.format?.title ??
    precedentPlaybook?.dominantProduct?.format;
  const recommendedLinker =
    constructGuidance?.linker?.title ??
    precedentPlaybook?.dominantProduct?.linker;
  const recommendedPayload =
    constructGuidance?.payload?.title ??
    precedentPlaybook?.dominantProduct?.payload;
  const recommendedChemistry = buildChemistryDirection(normalizedCase, abstraction, top);
  const biggestWatchout =
    riskMove.biggestRisk ||
    precedentPlaybook?.dominantProduct?.safetyWatchout;
  const decisionFocus = getRequestedDecisionFocus(parsedQuery);
  const focusedRequestedDimensionAnswer = buildFocusedRequestedDimensionAnswer(
    parsedQuery,
    abstraction,
    top,
    constructGuidance,
    precedentPlaybook,
    recommendedChemistry,
  );
  const focusedTitle =
    decisionFocus === "linker"
      ? "best linker direction"
      : decisionFocus === "payload"
        ? "best payload direction"
        : decisionFocus === "format"
          ? "best targeting format"
          : decisionFocus === "chemistry"
            ? "best conjugation chemistry direction"
            : viabilityBuckets.noStrongClassYet
              ? "no strong conjugate class yet"
              : viabilityBuckets.leadStrength === "provisional"
                ? "provisional starting point"
                : "recommended starting point";
  const focusedHeadline =
    decisionFocus === "linker"
      ? recommendedLinker || top.name
      : decisionFocus === "payload"
        ? recommendedPayload || top.name
        : decisionFocus === "format"
          ? recommendedFormat || top.name
          : decisionFocus === "chemistry"
            ? recommendedChemistry?.title || top.name
            : viabilityBuckets.noStrongClassYet
              ? `least-bad option right now: ${top.name}`
              : viabilityBuckets.leadStrength === "provisional"
                ? `weak lead: ${top.name}`
                : top.name;

  return {
    mode: "recommended-starting-point",
    title: focusedTitle,
    bestConjugateClass: focusedHeadline,
    decisionFocus,
    targetOrEntryHandle,
    recommendedFormat,
    recommendedLinker,
    recommendedPayload,
    recommendedChemistry: recommendedChemistry?.title,
    confidence: confidence.level,
    rationale:
      focusedRequestedDimensionAnswer ||
      buildDirectAnswerParagraph(normalizedCase, abstraction, confidence, top, exploration),
    mainMissingEvidence: buildMainMissingEvidence(normalizedCase, abstraction, top, exploration),
    biggestWatchout,
    firstValidationStep: buildFocusedValidationStep(parsedQuery, constructGuidance, riskMove.firstMove),
  };
}

function scoreOutOfTen(total?: number) {
  return typeof total === "number"
    ? Math.max(0, Math.min(10, Math.round(((total + 15) / 30) * 10)))
    : undefined;
}

function completeSentence(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function truncateAtWordBoundary(text: string, maxLength: number) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  const sliced = cleaned.slice(0, maxLength + 1);
  const boundary = sliced.lastIndexOf(" ");
  const safe = (boundary > Math.floor(maxLength * 0.65) ? sliced.slice(0, boundary) : cleaned.slice(0, maxLength)).trim();
  return `${safe}...`;
}

function buildMainMissingEvidence(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top?: RankedOption,
  exploration?: ReturnType<typeof buildDiseaseExploration> | null,
) {
  const explicitGap =
    top?.missingEvidence?.[0] ??
    normalizedCase.unknowns[0];

  if (explicitGap) return explicitGap;
  if (exploration?.mostInformativeClarifier) {
    if (abstraction.deliveryAccessibility === "barrier-limited") {
      return "a believable brain-entry route plus a disease-relevant target transcript, pathway, or cell-type handle";
    }
    if (normalizedCase.recommendationScope === "disease-level") {
      return "a real target or entry handle plus a clearer therapeutic mechanism";
    }
  }

  return "the target, delivery route, and active species still need sharper evidence";
}

function buildDefaultExperimentList(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top?: RankedOption,
) {
  const experiments = [
    "map target expression and the relevant cell types before locking the carrier format",
    "run internalization and trafficking assays in the disease-relevant cells",
    abstraction.deliveryAccessibility === "barrier-limited"
      ? "test BBB, transcytosis, or CSF-to-tissue exposure before optimizing chemistry"
      : "test whether the construct reaches the intended tissue compartment with enough exposure",
    abstraction.deliveryAccessibility === "intracellular difficult" || normalizedCase.needsIntracellularAccess
      ? "measure productive intracellular activity rather than uptake alone"
      : "measure whether the active species actually engages the intended biology",
    "run an early safety and tolerability screen in the most exposure-relevant system",
    "use a disease-relevant functional assay to see whether the mechanism changes the phenotype that matters",
  ].filter(Boolean) as string[];

  if (top?.name === "oligo conjugate") {
    experiments.unshift("confirm the target transcript or pathway and compare plain versus delivery-enhanced oligo activity");
  }

  if (top?.name === "adc") {
    experiments.unshift("confirm target density separation and internalization before locking linker-payload chemistry");
  }

  return Array.from(new Set(experiments)).slice(0, 6);
}

function buildModalityExplainerResponse(
  modality: ModalityConceptKey,
  responseFlow: ResponseFlow,
) {
  const displayName = toDisplayModalityName(modality);
  const longName = MODALITY_LONG_NAME[modality];
  const option = OPTION_MAP[modality];
  const evidenceAnchors = APPROVAL_ANCHORS[modality].slice(0, 3);
  const confidenceFactor = {
    label: "concept-level definition",
    impact: "positive" as const,
    note: "this is a modality-definition question, so the answer can be direct without disease-specific gating.",
  };
  const presentation: PresentationSummary = {
    mode: "concept-explainer",
    title: `${displayName} = ${longName}`,
    bestConjugateClass: displayName,
    confidence: "high",
    rationale: `${displayName} is a conjugate class definition question, not a disease-planning question. ${completeSentence(option.summary)}`,
    whatItIs: `${displayName} means ${longName}.`,
    bestFit: completeSentence(option.fitReason),
    mainWatchout: completeSentence(option.limitReason),
    bestClarifier: `do you want the next step to be biology fit, construct architecture, or real examples of ${displayName}?`,
  };
  const documentSections = buildConceptDocumentSections(modality);

  return {
    topPick: displayName,
    topPickWhy: `${displayName} means ${longName}. ${completeSentence(option.summary)}`,
    biggestRisk: option.limitReason,
    firstMove: `decide whether your real question is when to use ${displayName}, how to build one, or why it fails in a specific disease context.`,
    nextSteps: [
      `ask when ${displayName} is the right class versus other conjugate families`,
      `ask for a build table covering carrier, linker, payload, and conjugation chemistry`,
      "ask for real examples and why they worked",
    ],
    ranking: [],
    matrix: [],
    sources: evidenceAnchors,
    presentation,
    evidenceAnchors,
    uncertainties: [
      `the definition is clear, but the right use case still depends on target biology, delivery route, and payload logic.`,
    ],
    sectionOrder: buildSectionOrder("document-brief"),
    presentationVariant: "document-brief" as const,
    documentSections,
    text: `direct answer\n${displayName} means ${longName}. ${completeSentence(option.summary)}\n\n${buildDocumentText(documentSections)}`,
    summary: `${displayName} is a ${longName} class used when ${option.fitReason.toLowerCase()}`,
    topic: displayName,
    validationPasses: [],
    innovativeIdeas: [],
    modalityViability: [],
    strategyTable: [],
    rankingPreview: [],
    uiContract: {
      plannerResponsePrimary: true,
      topCard: true,
      strategyTable: false,
      rankingSection: false,
      innovationSection: false,
      visualRanking: false,
      evidenceVisualization: evidenceAnchors.length > 0,
      debugCollapsedByDefault: true,
      compactRenderer: true,
      formatPayloadFieldsPresentWhenAvailable: false,
    },
    viabilityBuckets: {
      feasibleNames: [],
      notViableNames: [],
      leadStrength: "none" as const,
      noStrongClassYet: false,
      contradictionFree: true,
    },
    conversationSlots: {
      topic: displayName,
      topModality: displayName,
      questionFrame: "concept",
      pendingClarifier: presentation.bestClarifier,
    },
    suggestedFollowUps: buildConceptSuggestedFollowUps(modality),
    responseFlow,
    depthModules: [],
    biology: [],
    biologyValidationPasses: [],
    confidence: {
      level: "high" as const,
      explorationLevel: "high" as const,
      winnerLevel: "high" as const,
      abstain: false,
      blueprintAllowed: false,
      factors: [confidenceFactor],
    },
    exploration: null,
    trace: {
      parser: {
        rawPrompt: displayName,
        cleanedPrompt: displayName,
        questionType: "modality explainer",
        diseaseMention: "",
        targetMention: "",
        mentionedModalities: [modality],
        mentionedPayloadTerms: [],
        mentionedLinkerTerms: [],
        mechanismHints: [],
      },
      normalization: {
        mechanismClass: "unknown",
        diseaseArea: "unknown",
        diseaseSpecificity: "unknown",
        recommendationScope: "disease-level",
        unknowns: [],
      },
      gates: [],
      scores: [],
      whyNot: [],
      confidence: {
        level: "high",
        explorationLevel: "high",
        winnerLevel: "high",
        factors: [confidenceFactor],
        abstain: false,
        blueprintAllowed: false,
      },
      unknownBiology: {
        insufficient: false,
        reasons: [],
      },
    },
  };
}

function buildDirectAnswerParagraph(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  confidence: ReturnType<typeof assessConfidence>,
  top: RankedOption | undefined,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this case";
  const missing = buildMainMissingEvidence(normalizedCase, abstraction, top, exploration);
  const topLane = exploration?.strategyBuckets[0]?.label ?? top?.name ?? "a more specific conjugate strategy";
  const intent =
    abstraction.therapeuticIntent === "gene/rna modulation"
      ? "gene or transcript modulation"
      : abstraction.therapeuticIntent === "pathway modulation"
        ? "non-cytotoxic pathway modulation"
      : abstraction.therapeuticIntent === "immune modulation"
          ? "immune modulation"
          : abstraction.therapeuticIntent === "cytotoxic elimination"
            ? "intracellular cytotoxic payload delivery"
          : "disease-matched targeted intervention";

  const barrierClause =
    abstraction.deliveryAccessibility === "barrier-limited"
      ? "brain or CSF exposure is a first-order delivery problem"
      : abstraction.deliveryAccessibility === "intracellular difficult"
        ? "productive intracellular routing is the main delivery problem"
        : abstraction.mechanismLocation === "extracellular"
          ? "the biology looks more extracellular than deep-intracellular"
        : "delivery constraints are still only partly defined";

  if (confidence.abstain) {
    return `${diseaseLabel} looks most like a ${intent} problem. the best exploratory direction right now is ${topLane}, and classes that fail the disease, payload, or delivery gates should stay out of the lead set. confidence is still insufficient because ${missing}.`;
  }

  return `${top?.name ?? "the current lead"} is the best current fit for ${diseaseLabel} because the biology reads most like ${intent}, and ${barrierClause}. this is still provisional enough that stronger target, trafficking, or payload evidence could move the recommendation.`;
}

function partitionRankingByViability(
  ranking: RankedOption[],
  matrix: MatrixSummaryRow[],
): {
  feasible: RankedOption[];
  notViable: Array<{ item: RankedOption; reason: string; score?: number }>;
  leadStrength: ViabilityBuckets["leadStrength"];
  noStrongClassYet: boolean;
} {
  const matrixMap = new Map(matrix.map((row) => [row.modality.toLowerCase().trim(), row]));
  const feasible: RankedOption[] = [];
  const notViable: Array<{ item: RankedOption; reason: string; score?: number }> = [];

  for (const item of ranking) {
    const row = matrixMap.get(item.name.toLowerCase().trim());
    const totalScore = row?.total ?? 0;
    const gateStatus = item.gateStatus ?? "allowed";
    const weakReason =
      item.gateReasons?.[0] ??
      item.mainReasonAgainst ??
      item.limitReason ??
      row?.cells.slice().sort((a, b) => a.score - b.score)[0]?.reason ??
      "the current biology and delivery cues do not support this class strongly enough.";

    if (gateStatus === "gated out" || (gateStatus === "penalized" && totalScore < 3) || totalScore < 0) {
      notViable.push({ item, reason: weakReason, score: row?.total });
      continue;
    }

    feasible.push(item);
  }

  const top = ranking[0];
  const topScore = scoreOutOfTen(matrixMap.get(top?.name?.toLowerCase().trim() ?? "")?.total);
  const noStrongClassYet = feasible.length === 0;
  const leadStrength: ViabilityBuckets["leadStrength"] =
    noStrongClassYet ? "none" : (topScore ?? 0) <= 5 ? "provisional" : "strong";

  return {
    feasible,
    notViable,
    leadStrength,
    noStrongClassYet,
  };
}

function classifyViabilityStatus(
  item: RankedOption,
  confidence: ReturnType<typeof assessConfidence>,
  normalizedCase: NormalizedCase,
  topName?: string,
): ModalityViabilityRow["status"] {
  if (item.gateStatus === "gated out") return "not viable";
  if (
    normalizedCase.broadOncologyNoTarget &&
    normalizedCase.diseaseArea === "oncology" &&
    item.name === "adc"
  ) {
    return confidence.abstain ? "provisional" : "conditional";
  }
  if (confidence.abstain) {
    if (item.name === topName && item.gateStatus === "allowed") return "provisional";
    if (item.gateStatus === "allowed") return "conditional";
    if (item.gateStatus === "penalized") return "not viable";
    return "abstain";
  }

  if (item.name === topName) {
    return item.gateStatus === "allowed" ? "lead" : "provisional";
  }

  if (item.gateStatus === "allowed") return "conditional";
  if (item.gateStatus === "penalized") return "conditional";
  return "not viable";
}

function buildModalityViabilityRows(
  ranking: RankedOption[],
  confidence: ReturnType<typeof assessConfidence>,
  normalizedCase: NormalizedCase,
): ModalityViabilityRow[] {
  const topName = ranking[0]?.name;
  return ranking.map((item) => ({
    modality: item.name,
    status: classifyViabilityStatus(item, confidence, normalizedCase, topName),
    reason: completeSentence(
      item.gateStatus === "allowed"
        ? item.fitReason
        : item.gateReasons?.[0] ?? item.fitReason,
    ),
    missingEvidence: completeSentence(
      item.missingEvidence?.[0] ??
        (item.gateStatus === "allowed"
          ? "the target, delivery route, or payload logic is still not specific enough to lock this in"
          : "stronger disease, target, delivery, or payload evidence is still missing."),
    ),
    upgradeEvidence: completeSentence(item.upgradeEvidence?.[0] ?? item.whatMustBeTrue ?? "show the missing biology and delivery assumptions directly."),
  }));
}

function findStrategyRowForLane(
  laneLabel: string,
  strategyTable: StrategyTableRow[] = [],
) {
  const normalizedLane = normalizeLaneLabel(laneLabel);
  return strategyTable.find((row) => {
    const strategy = normalizeLaneLabel(row.strategy);
    return strategy === normalizedLane || strategy.includes(normalizedLane) || normalizedLane.includes(strategy);
  });
}

function buildViabilityBuckets(
  ranking: RankedOption[],
  matrix: MatrixSummaryRow[],
): ViabilityBuckets {
  const partition = partitionRankingByViability(ranking, matrix);
  const feasibleNames = partition.feasible.map((item) => item.name);
  const notViableNames = partition.notViable.map(({ item }) => item.name);
  const feasibleSet = new Set(feasibleNames.map((item) => item.toLowerCase().trim()));
  const contradictionFree = notViableNames.every((item) => !feasibleSet.has(item.toLowerCase().trim()));

  return {
    feasibleNames,
    notViableNames,
    leadStrength: partition.leadStrength,
    noStrongClassYet: partition.noStrongClassYet,
    contradictionFree,
  };
}

function compactTableText(text?: string, fallback = "still conditional") {
  const cleaned = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallback;

  const sentence = cleaned.split(/(?<=[.!?])\s+/)[0]?.trim() ?? cleaned;
  if (sentence.length <= 150) return sentence;
  return truncateAtWordBoundary(sentence, 147);
}

function normalizeLaneLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function findFollowUpModality(prompt: string) {
  const normalizedPrompt = normalize(prompt);
  const aliasMap: Array<{ modality: (typeof MODALITY_ORDER)[number]; matcher: RegExp }> = [
    { modality: "adc", matcher: /\badc\b|\bantibody drug conjugate\b|\bantibody-drug conjugate\b/ },
    { modality: "pdc", matcher: /\bpdc\b|\bpeptide drug conjugate\b|\bpeptide-drug conjugate\b/ },
    { modality: "smdc", matcher: /\bsmdc\b|\bsmall molecule drug conjugate\b|\bsmall-molecule drug conjugate\b/ },
    { modality: "oligo conjugate", matcher: /\boligo\b|\boligonucleotide\b|\bantisense\b|\bsiRNA\b|\baso\b|\bpmo\b/i },
    { modality: "rdc", matcher: /\brdc\b|\bradioligand\b|\bradioconjugate\b|\bradiopharmaceutical\b/ },
    { modality: "enzyme conjugate", matcher: /\benzyme conjugate\b|\bprodrug\b|\benzyme\b/ },
  ];

  for (const entry of aliasMap) {
    if (entry.matcher.test(normalizedPrompt)) return entry.modality;
  }

  return MODALITY_ORDER.find((item) => normalizedPrompt.includes(`why not ${item}`) || normalizedPrompt.includes(`${item} `));
}

function findFollowUpLane(
  prompt: string,
  previousResult?: PreviousPlannerResult | null,
) {
  const normalizedPrompt = normalize(prompt);
  const normalizedPromptLane = normalizeLaneLabel(prompt);
  const baseResult = getConversationBaseResult(previousResult) ?? previousResult;
  const buckets = baseResult?.exploration?.strategyBuckets ?? [];
  const explicitLane = buckets.find((bucket) => {
    const label = normalizeLaneLabel(bucket.label);
    return label && (normalizedPrompt.includes(label) || normalizedPromptLane.includes(label));
  });

  if (explicitLane) return explicitLane;

  const laneMatchers: Array<{ matcher: RegExp; labelIncludes: string[] }> = [
    { matcher: /\bfcrn\b|\bigg\b|\bpathogenic antibody\b/, labelIncludes: ["fcrn", "igg"] },
    { matcher: /\bcomplement\b|\bc5\b|\bc3\b/, labelIncludes: ["complement"] },
    { matcher: /\bantigen\b|\btolerance\b|\bachr\b|\bmusk\b|\blrp4\b/, labelIncludes: ["antigen-specific", "tolerance"] },
    { matcher: /\bb cell\b|\bb-cell\b|\bplasma\b/, labelIncludes: ["b-cell", "plasma"] },
    { matcher: /\bantibody\b|\bantibodies\b|\bbiologic\b|\bbiologics\b/, labelIncludes: ["antibody", "biologic", "extracellular"] },
    { matcher: /\boligo\b|\brna\b|\bantisense\b|\bsiRNA\b|\bsplice\b/i, labelIncludes: ["oligo", "gene-modulation", "transcript"] },
    { matcher: /\bpathway\b|\bnon-cytotoxic\b|\bnon cytotoxic\b/, labelIncludes: ["pathway-matched", "non-cytotoxic"] },
  ];

  for (const candidate of laneMatchers) {
    if (!candidate.matcher.test(normalizedPrompt)) continue;
    const match = buckets.find((bucket) =>
      candidate.labelIncludes.some((term) => normalizeLaneLabel(bucket.label).includes(term)),
    );
    if (match) return match;
  }

  return null;
}

function inferLatestLaneLabel(previousResult?: PreviousPlannerResult | null) {
  const slotLane = resolveConversationSlots(previousResult).activeLane;
  if (slotLane) return slotLane;
  const latestFollowUp = previousResult?.followUpAnswer;
  if (latestFollowUp?.kind === "lane-detail" && latestFollowUp.laneLabel) {
    return latestFollowUp.laneLabel;
  }

  const title = String(latestFollowUp?.title ?? "").trim();
  if (/^why\s+/i.test(title)) {
    return title.replace(/^why\s+/i, "").trim();
  }

  return undefined;
}

function promptReferencesCurrentThing(prompt: string) {
  const cleaned = cleanTopic(prompt).toLowerCase();
  return /\b(this one|that one|this lane|that lane|this biology|that biology|this strategy|that strategy|this approach|that approach|here|on this one|on that one)\b/.test(
    cleaned,
  );
}

function getPreviousContextLabel(previousResult?: PreviousPlannerResult | null) {
  const baseResult = getConversationBaseResult(previousResult) ?? previousResult;
  const slots = resolveConversationSlots(previousResult);
  const disease = slots.disease;
  const target = slots.target;

  if (disease && target) return `${disease} with ${target}`;
  if (disease) return disease;
  if (target) return target;
  return slots.topic ?? baseResult?.topic ?? previousResult?.topic ?? "the last case";
}

function looksLikeGenericConstructNoun(value?: string | null) {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!text) return false;

  return /^(protein|target protein|linker|payload|oligo|oligonucleotide|antibody|peptide|carrier|dar|drug antibody ratio|chemistry|chemistries|format|construct)$/.test(
    text,
  );
}

function parseStructuredRefinementFields(prompt: string): StructuredRefinementFields {
  const entries = prompt
    .split(/\||\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  const result: StructuredRefinementFields = {};
  for (const entry of entries) {
    const match = entry.match(
      /^(modality|goal|target|payload|linker|format|chemistry|dar|constraints|mechanism)\s*:\s*(.+)$/i,
    );
    if (!match) continue;
    const key = match[1].toLowerCase() as keyof StructuredRefinementFields;
    result[key] = match[2].trim();
  }

  return result;
}

function looksLikeStructuredRefinementPrompt(prompt: string) {
  const fields = parseStructuredRefinementFields(prompt);
  return Object.keys(fields).length >= 2;
}

function detectContextualRefinement(
  prompt: string,
  previousResult?: PreviousPlannerResult | null,
): ContextualRefinementIntent | null {
  if (!previousResult) return null;

  const structuredFields = parseStructuredRefinementFields(prompt);
  if (Object.keys(structuredFields).length >= 2) {
    const contextLabel = getPreviousContextLabel(previousResult);
    const requestedFocus = Object.entries(structuredFields)
      .map(([key, value]) => `${key}: ${value}`)
      .join("; ");
    const mergedPrompt = [
      `for ${contextLabel}`,
      structuredFields.modality ? `modality intent: ${structuredFields.modality}` : "",
      structuredFields.goal ? `goal: ${structuredFields.goal}` : "",
      structuredFields.payload ? `payload intent: ${structuredFields.payload}` : "",
      structuredFields.linker ? `linker preference: ${structuredFields.linker}` : "",
      structuredFields.format ? `format preference: ${structuredFields.format}` : "",
      structuredFields.chemistry ? `chemistry preference: ${structuredFields.chemistry}` : "",
      structuredFields.dar ? `dar preference: ${structuredFields.dar}` : "",
      structuredFields.constraints ? `constraints: ${structuredFields.constraints}` : "",
      structuredFields.mechanism ? `mechanism preference: ${structuredFields.mechanism}` : "",
      structuredFields.target && !/biology for\b/i.test(structuredFields.target)
        ? `target or focus note: ${structuredFields.target}`
        : "focus note: keep the disease biology and delivery logic as the main target-setting context.",
    ]
      .filter(Boolean)
      .join(", ");

    return {
      kind: "contextual-refinement",
      mergedPrompt,
      contextLabel,
      requestedFocus,
    };
  }

  const normalizedPrompt = normalize(prompt);
  if (!normalizedPrompt.trim()) return null;
  if (detectFollowUpIntent(prompt, previousResult)) return null;

  const parsedPrompt = parseConjugateQuery(prompt, {});
  const normalizedPromptCase = normalizeConjugateCase(parsedPrompt, {});
  const introducesFreshDiseaseOrTarget =
    (Boolean(parsedPrompt.diseaseMention) && !looksLikeConversationPhrase(parsedPrompt.diseaseMention)) ||
    (Boolean(parsedPrompt.targetMention) &&
      !looksLikeConversationPhrase(parsedPrompt.targetMention) &&
      !looksLikeGenericConstructNoun(parsedPrompt.targetMention)) ||
    Boolean(normalizedPromptCase.disease?.canonical) ||
    (Boolean(normalizedPromptCase.target?.canonical) &&
      !looksLikeGenericConstructNoun(normalizedPromptCase.target?.canonical));

  if (introducesFreshDiseaseOrTarget) {
    return null;
  }

  const shortPrompt = cleanTopic(prompt).split(/\s+/).filter(Boolean).length <= 12;
  const preferenceLead =
    /^(i want to use|i want|use |let'?s use|let'?s try|try |prefer |focus on|go with|lean toward|what if we use|can we use|instead use)/i.test(
      prompt.trim(),
    ) || /\b(with|using)\b/.test(normalizedPrompt);
  const mechanismCue =
    OLIGO_DISEASE_CUE.test(normalizedPrompt) ||
    /(adc|pdc|smdc|rdc|oligo|enzyme conjugate|radioligand|fcrn|complement|achr|musk|lrp4|tolerance|linker|payload|nanobody|fab|scfv|cytotoxic|igg-lowering|immune modulation)/i.test(
      normalizedPrompt,
    );
  const constructDetailCue =
    /(step by step|how .* look like|protein|linker|payload|oligo|dar|drug-to-antibody ratio|drug antibody ratio|chemistr(?:y|ies)|conjugation|what .* use|which .* use)/i.test(
      normalizedPrompt,
    );
  const baseResult = getConversationBaseResult(previousResult) ?? previousResult;
  const matchedLane = findFollowUpLane(prompt, baseResult);
  const latestLaneLabel = inferLatestLaneLabel(previousResult);
  const laneForRefinement =
    matchedLane?.label ??
    latestLaneLabel ??
    (
      /oligo|antisense|splice|rna/i.test(normalizedPrompt)
        ? (baseResult.exploration?.strategyBuckets ?? []).find((bucket) => /oligo|splice|rna|transcript/i.test(bucket.label))?.label
        : undefined
    );

  if ((!shortPrompt && !constructDetailCue) || (!preferenceLead && !mechanismCue && !constructDetailCue)) {
    return null;
  }

  const contextLabel = getPreviousContextLabel(previousResult);
  const requestedFocus = cleanTopic(prompt);
  const mergedPrompt = laneForRefinement
    ? `for ${contextLabel}, staying on the ${laneForRefinement} lane, ${requestedFocus}`
    : `for ${contextLabel}, ${requestedFocus}`;

  return {
    kind: "contextual-refinement",
    mergedPrompt,
    contextLabel,
    requestedFocus,
  };
}

function detectFollowUpIntent(
  prompt: string,
  previousResult?: PreviousPlannerResult | null,
): FollowUpIntent | null {
  if (!previousResult) return null;
  if (looksLikeStructuredRefinementPrompt(prompt)) return null;

  const normalized = normalize(prompt);
  const baseResult = getConversationBaseResult(previousResult) ?? previousResult;
  const slots = resolveConversationSlots(previousResult);
  const promptWords = cleanTopic(prompt).split(/\s+/).filter(Boolean);
  const modality = findFollowUpModality(prompt);
  const matchedLane = findFollowUpLane(prompt, baseResult);
  const latestLaneLabel = slots.activeLane ?? inferLatestLaneLabel(previousResult);
  const promptKeepsCurrentLane = Boolean(latestLaneLabel && promptReferencesCurrentThing(prompt));

  if (/(why is .* both|both .* not really viable|contradict|inconsistent|doesn.t make sense)/i.test(normalized)) {
    return { kind: "contradiction" };
  }
  if (
    modality &&
    /(toxicity|toxic|off-target|unsafe|safety|wouldn.?t|would not|cause harm|too risky)/i.test(normalized)
  ) {
    return { kind: "why-not", modality };
  }
  if (/why not /i.test(normalized) && modality) {
    return { kind: "why-not", modality };
  }
  if (
    /(can you provide some images|show me images|show diagrams|can you make a chart|show me the mechanism|draw the construct|show the ranking visually|make this more visual|show visuals|visualize this)/i.test(
      normalized,
    )
  ) {
    return { kind: "media" };
  }
  if (/(make this into a table|summari[sz]e in a table|show a table|put this in a table|make a table)/i.test(normalized)) {
    return { kind: "table" };
  }
  if (/(give me links|show sources|show evidence|show me the evidence|show the evidence|what evidence|precedent anchor|source)/i.test(normalized)) {
    return { kind: "evidence" };
  }
  if (/(explain the ranking|what does .*score mean|why did you choose|why .* lead|explain this ranking)/i.test(normalized)) {
    return { kind: "ranking" };
  }
  if (/(make it simpler|make this simpler|simplify|tl;dr)/i.test(normalized)) {
    return { kind: "simplify" };
  }
  if (/(what would you test first|what do you test first|first validation step|what first experiment)/i.test(normalized)) {
    return { kind: "first-test" };
  }
  if (
    (matchedLane || promptKeepsCurrentLane) &&
    /(why|what about|explain|tell me more|expand|elaborate|biology|mechanism|how would|how does|how .* work|walk me through)/i.test(
      normalized,
    )
  ) {
    return { kind: "lane-detail", laneLabel: matchedLane?.label ?? latestLaneLabel ?? "current lane" };
  }
  if (
    /(can you explain|explain that|clarify|elaborate|go deeper|tell me more|expand on that|what do you mean|help me understand|walk me through that)/i.test(
      normalized,
    ) ||
    (
      promptWords.length <= 8 &&
      /^(why|how|what|which|can|could|would|should|is|are|do|does)\b/i.test(prompt.trim())
    )
  ) {
    return matchedLane || promptKeepsCurrentLane
      ? { kind: "lane-detail", laneLabel: matchedLane?.label ?? latestLaneLabel ?? "current lane" }
      : { kind: "clarify" };
  }

  const parsedPrompt = parseConjugateQuery(prompt, {});
  const normalizedPromptCase = normalizeConjugateCase(parsedPrompt, {});
  const introducesFreshDiseaseOrTarget =
    (Boolean(parsedPrompt.diseaseMention) && !looksLikeConversationPhrase(parsedPrompt.diseaseMention)) ||
    (Boolean(parsedPrompt.targetMention) &&
      !looksLikeConversationPhrase(parsedPrompt.targetMention) &&
      !looksLikeGenericConstructNoun(parsedPrompt.targetMention)) ||
    (Boolean(normalizedPromptCase.disease?.canonical) && !looksLikeConversationPhrase(normalizedPromptCase.disease?.canonical)) ||
    (Boolean(normalizedPromptCase.target?.canonical) &&
      !looksLikeGenericConstructNoun(normalizedPromptCase.target?.canonical));

  if (
    !introducesFreshDiseaseOrTarget &&
    slots.questionFrame &&
    /(wouldn.t|would not|what about|is that too|too toxic|too risky|too broad|too weak|why that|why this|what if)/i.test(normalized)
  ) {
    if (modality) return { kind: "why-not", modality };
    if (matchedLane || promptKeepsCurrentLane) {
      return { kind: "lane-detail", laneLabel: matchedLane?.label ?? latestLaneLabel ?? "current lane" };
    }
    return { kind: "clarify" };
  }

  if (!introducesFreshDiseaseOrTarget && promptWords.length <= 7 && (matchedLane || previousResult.followUpAnswer || promptKeepsCurrentLane)) {
    return matchedLane || promptKeepsCurrentLane
      ? { kind: "lane-detail", laneLabel: matchedLane?.label ?? latestLaneLabel ?? "current lane" }
      : { kind: "clarify" };
  }

  return null;
}

function buildFollowUpResponse(
  prompt: string,
  previousResult: PreviousPlannerResult,
): PreviousPlannerResult & { followUpAnswer: FollowUpAnswer } {
  const contextResult = getConversationBaseResult(previousResult) ?? previousResult;
  const slots = resolveConversationSlots(previousResult);
  const latestFollowUp = previousResult.followUpAnswer ?? null;
  const intent = detectFollowUpIntent(prompt, previousResult);
  if (!intent) {
    throw new Error("follow-up response requested without a follow-up intent");
  }

  const previousRanking = contextResult.ranking ?? [];
  const previousMatrix = contextResult.matrix ?? [];
  const previousViability = previousResult.viabilityBuckets ?? buildViabilityBuckets(previousRanking, previousMatrix);
  const previousWhyNot = contextResult.trace?.whyNot ?? [];
  const previousBuckets = contextResult.exploration?.strategyBuckets ?? [];
  const feasibleSet = new Set(previousViability.feasibleNames.map((item) => item.toLowerCase().trim()));
  const contradictoryOverlap = previousWhyNot.filter((item) => {
    const modality = item?.modality?.toLowerCase().trim();
    return modality && feasibleSet.has(modality) && item.outcome === "not viable";
  });

  let followUpAnswer: FollowUpAnswer;
  const latestFollowUpFocus =
    latestFollowUp?.kind === "media"
      ? "the visuals"
      : latestFollowUp?.kind === "evidence"
        ? "the evidence"
        : latestFollowUp?.kind === "table"
          ? "the table view"
          : latestFollowUp?.kind === "lane-detail"
            ? latestFollowUp.laneLabel ?? "that lane"
            : latestFollowUp?.kind === "clarify"
              ? "that point"
            : latestFollowUp?.title?.toLowerCase() ?? "the last point";

  switch (intent.kind) {
    case "contradiction": {
      const overlappingNames = contradictoryOverlap.map((item) => item.modality);
      const overlapText = overlappingNames.length ? overlappingNames.join(", ") : "the same modality";
      followUpAnswer = {
        kind: "contradiction",
        title: "that inconsistency is real",
        answer: `you’re right — that is inconsistent. ${overlapText} should not appear in both the recommended/feasible side and the not-viable side. this is a ranking/rendering contradiction, so the ui should either show it as a weak or provisional lead or remove it from the not-viable section entirely.`,
        bullets: [
          previousViability.noStrongClassYet
            ? "right now the better label is no strong conjugate class yet, with only least-bad provisional options."
            : previousViability.leadStrength === "provisional"
              ? "right now the better label is weak lead / provisional fit, not strong recommendation."
              : "the recommendation and exclusion buckets should be mutually exclusive.",
        ],
        usedPreviousResult: true,
      };
      break;
    }
    case "why-not": {
      const whyNotMatch = previousWhyNot.find((item) => item.modality.toLowerCase().trim() === intent.modality);
      const rankingMatch = previousRanking.find((item) => item.name.toLowerCase().trim() === intent.modality);
      const normalizedPrompt = normalize(prompt);
      const cnsChronicCase =
        /huntington|parkinson|alzheimer|als|brain|cns|neurodegeneration/i.test(getPreviousContextLabel(contextResult)) ||
        /barrier-limited|blood-brain barrier/i.test(contextResult.presentation?.rationale ?? "");
      const toxicityChallenge =
        /toxicity|toxic|off-target|unsafe|safety|wouldn.?t|would not/i.test(normalizedPrompt);
      followUpAnswer = {
        kind: "why-not",
        title: `why not ${intent.modality}`,
        answer:
          toxicityChallenge && intent.modality === "adc" && cnsChronicCase
            ? "yes — adc-style cytotoxicity is a major concern here. chronic cns neurodegeneration is not a cell-ablation setting, so a classical antibody-plus-cytotoxic payload program would usually create toxicity pressure without solving the real biology or brain-delivery problem."
            : whyNotMatch
              ? whyNotMatch.primaryReason
              : rankingMatch?.mainReasonAgainst ?? rankingMatch?.limitReason ?? `there still is not enough from the last answer to make ${intent.modality} a confident lead.`,
        bullets: [
          toxicityChallenge && intent.modality === "adc" && cnsChronicCase
            ? "the disease problem is chronic neuron and glia survival, not selective tumor-cell killing."
            : "",
          toxicityChallenge && intent.modality === "adc" && cnsChronicCase
            ? "even with a target, the construct would still have to solve brain exposure and non-cytotoxic biology before adc becomes attractive."
            : "",
          rankingMatch?.fitReason ? `what still helps it: ${rankingMatch.fitReason}` : "",
          rankingMatch?.whatMustBeTrue ? `what would have to be true: ${rankingMatch.whatMustBeTrue}` : "",
        ].filter(Boolean),
        usedPreviousResult: true,
      };
      break;
    }
    case "ranking":
      followUpAnswer = {
        kind: "ranking",
        title: "how the ranking was decided",
        answer: contextResult.topPickWhy ?? contextResult.summary ?? "the last answer ranked options by biology fit, delivery logic, and what would actually have to be true for each class to win.",
        bullets: (contextResult.rankingPreview ?? []).slice(0, 3).map((item) => `${item.strategy}: ${item.whyItFits}`),
        usedPreviousResult: true,
      };
      break;
    case "evidence":
      followUpAnswer = {
        kind: "evidence",
        title: "evidence behind the last answer",
        answer: `here are the main evidence and precedent links behind the last answer for ${getPreviousContextLabel(contextResult)}. i’m surfacing the same anchors the planner already used instead of recomputing a new recommendation.`,
        bullets: (contextResult.evidenceAnchors ?? []).slice(0, 6).map((item) => item.label),
        usedPreviousResult: true,
      };
      break;
    case "clarify":
      const visibleLaneOptions =
        (contextResult.exploration?.strategyBuckets ?? [])
          .slice(0, 4)
          .map((bucket) => bucket.label)
          .filter(Boolean);
      const ambiguousLaneReference =
        promptReferencesCurrentThing(prompt) &&
        !inferLatestLaneLabel(previousResult) &&
        visibleLaneOptions.length > 0;
      followUpAnswer = {
        kind: "clarify",
        title: "here’s the cleaner version",
        answer: ambiguousLaneReference
          ? `i’m still on the same case. if you mean one specific lane, name it and i’ll explain the biology behind that one directly. the main live lanes right now are the top strategy options from the last answer, not a brand-new recommendation.`
          : latestFollowUp
            ? `i’m still talking about the same case. to make ${latestFollowUpFocus} clearer: ${latestFollowUp.answer}`
            : contextResult.presentation?.mode === "recommended-starting-point"
              ? `i’m still talking about the same recommendation: ${contextResult.topPick ?? "the current lead"} is ahead because it matches the biology and delivery logic from the last answer better than the other classes.`
              : `i’m still talking about the same case: there isn’t a final winner yet, but the last answer narrowed the field to the most plausible strategy lanes without pretending the missing biology is already solved.`,
        bullets: [
          ambiguousLaneReference
            ? `pick one lane: ${visibleLaneOptions.join(", ")}`
            : "",
          latestFollowUp?.title ? `clarifying: ${latestFollowUp.title}` : "",
          slots.questionFrame ? `current frame: ${slots.questionFrame.replace(/-/g, " ")}` : "",
          contextResult.presentation?.mode === "recommended-starting-point"
            ? `current lead: ${contextResult.topPick ?? "still conditional"}`
            : contextResult.presentation?.mode === "best-current-strategy-direction"
              ? `best current direction: ${(contextResult.presentation.strategyLanes ?? []).slice(0, 3).join(", ") || "still exploratory"}`
              : contextResult.presentation?.mode === "concept-explainer"
                ? `concept in view: ${contextResult.topPick ?? "the current class"}`
                : "best current direction: still exploratory",
          contextResult.presentation?.mode === "best-current-strategy-direction"
            ? contextResult.presentation.bestClarifier ?? contextResult.exploration?.mostInformativeClarifier ?? ""
            : contextResult.presentation?.mode === "concept-explainer"
              ? contextResult.presentation.bestClarifier ?? ""
              : contextResult.exploration?.mostInformativeClarifier ?? "",
        ].filter(Boolean),
        usedPreviousResult: true,
      };
      break;
    case "media":
      followUpAnswer = {
        kind: "media",
        title: "visual companion for the last answer",
        answer:
          `i’m keeping the same ${getPreviousContextLabel(contextResult)} answer and switching the emphasis to visuals. real external image retrieval is not wired yet, so i’m showing generated schematic cards, strategy maps, ranking bars, and source cards from the previous result instead of pretending to fetch images.`,
        bullets: [
          "disease mechanism map",
          "strategy landscape",
          "construct logic sketch",
          "evidence and source cards",
        ],
        usedPreviousResult: true,
        externalImagesAvailable: false,
      };
      break;
    case "table":
      followUpAnswer = {
        kind: "table",
        title: "reformatted as a table",
        answer:
          `done — i’m reusing the previous ${getPreviousContextLabel(contextResult)} answer and surfacing it as a compact strategy table so the ranking, fit logic, and risks are easier to scan.`,
        bullets: (contextResult.strategyTable ?? []).slice(0, 4).map((item) => item.strategy),
        usedPreviousResult: true,
      };
      break;
    case "simplify":
      followUpAnswer = {
        kind: "simplify",
        title: "simple version",
        answer: latestFollowUp
          ? `short version of ${latestFollowUpFocus}: ${latestFollowUp.answer}`
          : previousViability.noStrongClassYet
            ? "short version: there isn’t a strong conjugate class yet. the answer only supports a few provisional directions, and the missing target or entry handle is what would make it rankable."
            : `short version: ${contextResult.topPick ?? "the top class"} is leading, but it still depends on the biology and delivery assumptions from the last answer holding up.`,
        bullets: [
          latestFollowUp?.title ? `based on: ${latestFollowUp.title}` : "",
          contextResult.presentation?.mode === "best-current-strategy-direction"
            ? `best current direction: ${(contextResult.presentation.strategyLanes ?? []).slice(0, 3).join(", ")}`
            : `top class: ${contextResult.topPick ?? "still conditional"}`,
        ],
        usedPreviousResult: true,
      };
      break;
    case "first-test":
      followUpAnswer = {
        kind: "first-test",
        title: "first thing to test",
        answer: contextResult.presentation?.mode === "recommended-starting-point"
          ? contextResult.presentation.firstValidationStep ?? contextResult.constructBlueprint?.tradeoff ?? "the first validation step is still the main de-risking experiment from the previous answer."
          : "before choosing a winner, test the assumption that separates the top provisional lane from the rest.",
        bullets: contextResult.innovativeIdeas?.[0]?.firstExperiment
          ? [contextResult.innovativeIdeas[0].firstExperiment]
          : [],
        usedPreviousResult: true,
      };
      break;
    case "lane-detail": {
      const lane = previousBuckets.find((bucket) => bucket.label === intent.laneLabel) ?? findFollowUpLane(prompt, contextResult);
      const laneRow = findStrategyRowForLane(lane?.label ?? intent.laneLabel, contextResult.strategyTable ?? []);
      const laneAssumptions = lane?.requiredAssumptions?.slice(0, 2) ?? [];
      const evidenceAnchors = (contextResult.evidenceAnchors ?? []).slice(0, 2).map((item) => item.label);
      const constructFamily =
        laneRow?.bestFormat ??
        (lane?.suggestedModalities?.length
          ? `pressure-test ${lane.suggestedModalities.slice(0, 3).join(", ")}`
          : "keep the construct family aligned with the lane biology");
      const firstExperiment =
        laneRow
          ? `first experiment: ${compactTableText(laneRow.linkerOrDeliveryLogic)}`
          : lane?.diseaseSpecificConstraints?.[0]
            ? `first experiment: de-risk ${compactTableText(lane.diseaseSpecificConstraints[0])}`
            : "";
      followUpAnswer = {
        kind: "lane-detail",
        title: `why ${intent.laneLabel}`,
        answer:
          lane
            ? `${lane.whyPlausible} the practical read is that this lane only works if the construct solves ${compactTableText(lane.entryHandleLogic, "the main delivery problem")} and keeps the active species aligned with the real disease mechanism, not merely the surface story.`
            : `that lane stays visible because it explains part of the disease biology from the previous answer better than generic immune modulation alone.`,
        bullets: [
          lane?.entryHandleLogic ? `entry handle / delivery logic: ${compactTableText(lane.entryHandleLogic)}` : "",
          laneRow?.payloadOrActiveSpecies ? `active species logic: ${compactTableText(laneRow.payloadOrActiveSpecies)}` : "",
          laneAssumptions[0] ? `required assumption: ${compactTableText(laneAssumptions[0])}` : "",
          laneAssumptions[1] ? `secondary assumption: ${compactTableText(laneAssumptions[1])}` : "",
          lane?.mainFailureMode ? `main failure mode: ${compactTableText(lane.mainFailureMode)}` : "",
          `best construct family to test next: ${constructFamily}`,
          firstExperiment,
          evidenceAnchors.length ? `anchors already in view: ${evidenceAnchors.join(", ")}` : "",
        ].filter(Boolean),
        usedPreviousResult: true,
        laneLabel: lane?.label ?? intent.laneLabel,
      };
      break;
    }
  }

  return {
    ...contextResult,
    conversationBaseResult: contextResult,
    conversationSlots: {
      ...slots,
      activeLane:
        followUpAnswer.kind === "lane-detail"
          ? followUpAnswer.laneLabel ?? slots.activeLane
          : slots.activeLane,
    },
    summary: followUpAnswer.answer,
    text: `follow-up answer\n${followUpAnswer.answer}`,
    followUpAnswer,
    uiContract: {
      plannerResponsePrimary: contextResult.uiContract?.plannerResponsePrimary ?? true,
      topCard: contextResult.uiContract?.topCard ?? true,
      strategyTable: contextResult.uiContract?.strategyTable ?? Boolean(contextResult.strategyTable?.length),
      rankingSection: contextResult.uiContract?.rankingSection ?? Boolean(contextResult.rankingPreview?.length),
      innovationSection: contextResult.uiContract?.innovationSection ?? Boolean(contextResult.innovativeIdeas?.length),
      visualRanking:
        contextResult.uiContract?.visualRanking ??
        Boolean(contextResult.rankingPreview?.some((item) => Boolean(item.score))),
      evidenceVisualization:
        contextResult.uiContract?.evidenceVisualization ??
        Boolean(contextResult.evidenceAnchors?.length),
      debugCollapsedByDefault: contextResult.uiContract?.debugCollapsedByDefault ?? true,
      compactRenderer: contextResult.uiContract?.compactRenderer ?? true,
      formatPayloadFieldsPresentWhenAvailable:
        contextResult.uiContract?.formatPayloadFieldsPresentWhenAvailable ?? true,
      noRecommendedNotViableOverlap: previousViability.contradictionFree,
    },
    viabilityBuckets: previousViability,
  };
}

function defaultFormatForModality(name: string) {
  switch (name.toLowerCase()) {
    case "adc":
      return "full igg or engineered antibody format";
    case "pdc":
      return "targeted peptide or compact biologic-peptide format";
    case "smdc":
      return "small-molecule ligand conjugate";
    case "oligo conjugate":
      return "oligo payload with shuttle, peptide, or targeted carrier";
    case "rdc":
      return "targeting ligand or antibody with chelator/isotope system";
    case "enzyme conjugate":
      return "targeted enzyme or enzyme-prodrug activation construct";
    default:
      return "still conditional";
  }
}

function defaultLinkerOrDeliveryLogic(
  name: string,
  abstraction: BiologicalAbstraction,
) {
  switch (name.toLowerCase()) {
    case "adc":
      return "internalization-aware release logic matched to target trafficking";
    case "pdc":
      return "compact delivery route with stability tuned to exposure window";
    case "smdc":
      return "ligand-preserving linker chemistry only if the targeting handle tolerates payload load";
    case "oligo conjugate":
      return abstraction.deliveryAccessibility === "barrier-limited"
        ? "shuttle or uptake-handle delivery logic matched to productive intracellular routing"
        : "delivery handle matched to productive intracellular routing";
    case "rdc":
      return "retention plus dosimetry logic, not only classical linker release";
    case "enzyme conjugate":
      return "local activation chemistry that only works if catalytic biology is real";
    default:
      return "still conditional";
  }
}

function defaultPayloadOrActiveSpecies(
  name: string,
  abstraction: BiologicalAbstraction,
) {
  if (name.toLowerCase() === "oligo conjugate") {
    if (abstraction.therapeuticIntent === "gene/rna modulation") {
      return abstraction.compartmentNeed === "nuclear"
        ? "splice-switching aso/pmo or other nuclear-active oligo cargo"
        : "rna-modulating active oligo cargo";
    }
    return "non-cytotoxic oligo or pathway-modulating active species";
  }

  if (name.toLowerCase() === "adc") {
    return abstraction.cytotoxicFit === "favored"
      ? "cytotoxic payload matched to target internalization"
      : "only if a real cell-killing hypothesis exists";
  }

  if (name.toLowerCase() === "rdc") {
    return "isotope / chelator payload matched to localization logic";
  }

  if (name.toLowerCase() === "enzyme conjugate") {
    return "enzyme cargo or activation substrate logic";
  }

  if (abstraction.therapeuticIntent === "pathway modulation") {
    return "non-cytotoxic pathway-modulating active species";
  }

  return "still conditional";
}

function buildStrategyTableRows(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  confidence: ReturnType<typeof assessConfidence>,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  ranking: RankedOption[],
  matrix: MatrixSummaryRow[],
  precedentPlaybook?: OncologyPrecedentPlaybook | null,
): StrategyTableRow[] {
  if (confidence.abstain || !ranking.length) {
    return (exploration?.strategyBuckets ?? []).slice(0, 4).map((bucket, index) => {
      const primaryModality = bucket.suggestedModalities?.[0] ?? "still conditional";
      return {
        rank: String(index + 1),
        strategy: bucket.label,
        bestFormat: compactTableText(defaultFormatForModality(primaryModality)),
        linkerOrDeliveryLogic: compactTableText(bucket.entryHandleLogic),
        payloadOrActiveSpecies: compactTableText(defaultPayloadOrActiveSpecies(primaryModality, abstraction)),
        whyItFits: compactTableText(bucket.whyPlausible),
        riskOrFailureMode: compactTableText(bucket.mainFailureMode),
        evidenceLabel: bucket.sourceLabels?.[0],
      };
    });
  }

  const scoreMap = new Map(
    matrix.map((row) => [
      row.modality.toLowerCase().trim(),
      Math.max(0, Math.min(10, Math.round(((row.total + 15) / 30) * 10))),
    ]),
  );

  return ranking.slice(0, 4).map((item, index) => {
    const isTop = index === 0;
    const topFormat =
      constructGuidance?.format?.title ??
      precedentPlaybook?.dominantProduct?.format;
    const topLinker =
      constructGuidance?.linker?.title ??
      precedentPlaybook?.dominantProduct?.linker;
    const topPayload =
      constructGuidance?.payload?.title ??
      precedentPlaybook?.dominantProduct?.payload;

    return {
      rank: `${item.rank}${typeof scoreMap.get(item.name.toLowerCase().trim()) === "number" ? ` (${scoreMap.get(item.name.toLowerCase().trim())}/10)` : ""}`,
      strategy: item.name,
      bestFormat: isTop ? topFormat ?? defaultFormatForModality(item.name) : defaultFormatForModality(item.name),
      linkerOrDeliveryLogic: isTop ? topLinker ?? defaultLinkerOrDeliveryLogic(item.name, abstraction) : defaultLinkerOrDeliveryLogic(item.name, abstraction),
      payloadOrActiveSpecies: isTop ? topPayload ?? defaultPayloadOrActiveSpecies(item.name, abstraction) : defaultPayloadOrActiveSpecies(item.name, abstraction),
      whyItFits: compactTableText(item.fitReason),
      riskOrFailureMode: compactTableText(item.mainReasonAgainst ?? item.limitReason ?? "still conditional on biology, delivery, and safety."),
      evidenceLabel: item.bestEvidenceFor,
    };
  });
}

function buildRankingPreviewRows(
  normalizedCase: NormalizedCase,
  confidence: ReturnType<typeof assessConfidence>,
  ranking: RankedOption[],
  matrix: MatrixSummaryRow[],
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
): RankingPreviewRow[] {
  const scoreOutOfTen = (total?: number) =>
    typeof total === "number" ? `${Math.max(0, Math.min(10, Math.round(((total + 15) / 30) * 10)))}/10` : undefined;

  if (!confidence.abstain && ranking.length) {
    const matrixMap = new Map(matrix.map((row) => [row.modality.toLowerCase().trim(), row]));
    return ranking.slice(0, 5).map((item) => ({
      rank: String(item.rank),
      strategy: item.name,
      score: scoreOutOfTen(matrixMap.get(item.name.toLowerCase().trim())?.total),
      summary: item.summary,
      whyItFits: item.fitReason,
      risk: item.mainReasonAgainst ?? item.limitReason,
    }));
  }

  if (ranking.length) {
    return ranking.slice(0, 5).map((item, index) => ({
      rank: classifyViabilityStatus(item, confidence, normalizedCase, ranking[0]?.name),
      strategy: item.name,
      score: undefined,
      summary: index === 0 ? "best provisional exploratory lane only — not a winner" : "kept visible only if the gates do not rule it out completely",
      whyItFits: item.fitReason,
      risk: item.gateReasons?.[0] ?? item.mainReasonAgainst ?? item.limitReason,
    }));
  }

  const provisionalLanes = (exploration?.strategyBuckets ?? []).slice(0, 4);
  return provisionalLanes.map((bucket, index) => ({
    rank: index === 0 ? "provisional" : "conditional",
    strategy: bucket.label,
    score: undefined,
    summary: "exploratory lane only — not a class ranking",
    whyItFits: bucket.whyPlausible,
    risk: bucket.mainFailureMode,
  }));
}

function buildUiContract(
  presentation: PresentationSummary,
  strategyTable: StrategyTableRow[],
  rankingPreview: RankingPreviewRow[],
  innovativeIdeas: InnovativeIdea[],
  evidenceAnchors: EvidenceSource[],
  viabilityBuckets?: ViabilityBuckets,
): UiContract {
  return {
    plannerResponsePrimary: true,
    topCard: true,
    strategyTable: strategyTable.length > 0,
    rankingSection: rankingPreview.length > 0,
    innovationSection: innovativeIdeas.length > 0,
    visualRanking: rankingPreview.length > 0,
    evidenceVisualization: evidenceAnchors.length > 0,
    debugCollapsedByDefault: true,
    compactRenderer: true,
    formatPayloadFieldsPresentWhenAvailable:
      presentation.mode !== "recommended-starting-point" ||
      Boolean(
        presentation.recommendedFormat &&
          presentation.recommendedLinker &&
          presentation.recommendedPayload,
      ),
    noRecommendedNotViableOverlap: viabilityBuckets ? viabilityBuckets.contradictionFree : true,
  };
}

function buildUncertaintyList(
  normalizedCase: NormalizedCase,
  confidence: ReturnType<typeof assessConfidence>,
  conflict: ReturnType<typeof analyzeConflictSignals>,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
): string[] {
  const mechanismExamples = "mechanism example: exon skipping, toxic-rna correction, cytotoxic delivery, radioligand localization, or enzyme/prodrug activation.";

  return Array.from(
    new Set([
      ...normalizedCase.unknowns,
      ...confidence.factors
        .filter((factor) => factor.impact === "negative")
        .map((factor) => factor.note),
      conflict.present ? conflict.summary : "",
      conflict.present && conflict.clarifier ? `clarifier: ${conflict.clarifier}` : "",
      confidence.abstain && normalizedCase.diseaseSpecificity !== "family"
        ? "name the target or entry handle that would actually drive the construct."
        : "",
      confidence.abstain && normalizedCase.diseaseSpecificity !== "family"
        ? mechanismExamples
        : "",
      confidence.abstain && exploration?.mostInformativeClarifier
        ? `highest-value clarifier: ${exploration.mostInformativeClarifier}`
        : "",
    ].filter(Boolean)),
  ).slice(0, 6);
}

function buildPresentationVariant(
  presentation: PresentationSummary,
  followUpAnswer: FollowUpAnswer | undefined,
  strategyTable: StrategyTableRow[],
): PresentationVariant {
  if (followUpAnswer?.kind === "media") return "visual-follow-up";
  if (presentation.mode === "recommended-starting-point") return "blueprint-first";
  if (strategyTable.length >= 3) return "table-first";
  return "document-brief";
}

function buildSuggestedFollowUps(
  normalizedCase: NormalizedCase,
  top?: RankedOption,
) {
  const suggestions = [
    "What would you try first?",
    top ? `Why not ${top.name.toUpperCase() === top.name ? top.name : top.name.replace(/\b\w/g, (char) => char.toUpperCase())}?` : "Why not ADC?",
    "Give me a construct table",
    "What experiments would validate this?",
    "Make it more technical",
    "Make it simpler",
  ];

  if (normalizedCase.recommendationScope === "disease-level") {
    suggestions.splice(1, 0, "What target or entry handle would make this rankable?");
  }

  return suggestions.slice(0, 6);
}

function buildComparisonTensionNote(
  prompt: string,
  top: RankedOption | undefined,
  ranking: RankedOption[],
) {
  if (!top) return "";

  const normalizedPrompt = normalize(prompt);
  const mentionedModalities = MODALITY_ORDER.filter((modality) => normalizedPrompt.includes(modality));
  if (mentionedModalities.length < 2) return "";

  const contrasted = ranking.find(
    (item) => item.name !== top.name && mentionedModalities.includes(item.name as (typeof MODALITY_ORDER)[number]),
  );

  if (!contrasted) return "";

  const contrastedReason = completeSentence(contrasted.mainReasonAgainst ?? contrasted.limitReason);
  if (!contrastedReason) return "";

  return `comparison tension: ${contrasted.name} is not a clean interchangeable alternative here. ${contrastedReason} that creates a biology mismatch rather than a simple format preference against ${top.name}.`;
}

function buildDocumentSections(
  prompt: string,
  presentation: PresentationSummary,
  topPickWhy: string,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
  top: RankedOption | undefined,
  ranking: RankedOption[],
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  strategyTable: StrategyTableRow[],
  uncertainties: string[],
  followUpAnswer?: FollowUpAnswer,
): DocumentSection[] {
  if (followUpAnswer?.kind === "media") {
    return [
      {
        title: "Visual Companion",
        body: followUpAnswer.answer,
        bullets: followUpAnswer.bullets,
      },
    ];
  }

  if (presentation.mode === "recommended-starting-point") {
    const focusTitle =
      presentation.decisionFocus === "linker"
        ? "Best Linker Direction"
        : presentation.decisionFocus === "payload"
          ? "Best Payload Direction"
          : presentation.decisionFocus === "format"
            ? "Best Targeting Format"
            : presentation.decisionFocus === "chemistry"
              ? "Best Conjugation Chemistry Direction"
              : "Recommended Starting Point";
    const comparisonTension = buildComparisonTensionNote(prompt, top, ranking);
    if (presentation.decisionFocus && presentation.decisionFocus !== "class") {
      const focusSpecificBullets =
        presentation.decisionFocus === "linker"
          ? [
              presentation.recommendedLinker ? `best linker: ${presentation.recommendedLinker}` : "",
              constructGuidance?.linker?.body ? `why it fits: ${takeLeadingSentences(constructGuidance.linker.body, 2)}` : "",
              presentation.recommendedFormat ? `best carrier context: ${presentation.recommendedFormat}` : "",
              presentation.recommendedPayload ? `payload context: ${presentation.recommendedPayload}` : "",
              `confidence: ${presentation.confidence}`,
            ]
          : presentation.decisionFocus === "payload"
            ? [
                presentation.recommendedPayload ? `best payload: ${presentation.recommendedPayload}` : "",
                constructGuidance?.payload?.body ? `why it fits: ${takeLeadingSentences(constructGuidance.payload.body, 2)}` : "",
                presentation.recommendedFormat ? `best carrier context: ${presentation.recommendedFormat}` : "",
                presentation.recommendedLinker ? `release context: ${presentation.recommendedLinker}` : "",
                `confidence: ${presentation.confidence}`,
              ]
            : presentation.decisionFocus === "format"
              ? [
                  presentation.recommendedFormat ? `best format: ${presentation.recommendedFormat}` : "",
                  constructGuidance?.format?.body ? `why it fits: ${takeLeadingSentences(constructGuidance.format.body, 2)}` : "",
                  presentation.recommendedLinker ? `linker context: ${presentation.recommendedLinker}` : "",
                  presentation.recommendedPayload ? `payload context: ${presentation.recommendedPayload}` : "",
                  `confidence: ${presentation.confidence}`,
                ]
              : [
                  presentation.recommendedChemistry ? `best chemistry: ${presentation.recommendedChemistry}` : "",
                  presentation.recommendedFormat ? `carrier context: ${presentation.recommendedFormat}` : "",
                  presentation.recommendedLinker ? `release context: ${presentation.recommendedLinker}` : "",
                  presentation.recommendedPayload ? `active-species context: ${presentation.recommendedPayload}` : "",
                  `confidence: ${presentation.confidence}`,
                ];

      return [
        {
          title: focusTitle,
          body: presentation.rationale,
          bullets: focusSpecificBullets.filter(Boolean),
        },
        {
          title: "How To Pressure-Test It",
          body:
            [presentation.biggestWatchout, comparisonTension, presentation.mainMissingEvidence]
              .filter(Boolean)
              .join(" ") || "the biology, release logic, and real therapeutic window still need to hold together in the actual disease setting.",
          bullets: [
            presentation.firstValidationStep ? `first validation step: ${presentation.firstValidationStep}` : "",
          ].filter(Boolean),
        },
      ];
    }

    const blueprintBullets = [
      `target / entry handle: ${presentation.targetOrEntryHandle}`,
      presentation.recommendedFormat ? `format: ${presentation.recommendedFormat}` : "",
      constructGuidance?.format?.body ? `format rationale: ${constructGuidance.format.body}` : "",
      presentation.recommendedLinker ? `linker: ${presentation.recommendedLinker}` : "",
      constructGuidance?.linker?.body ? `linker rationale: ${constructGuidance.linker.body}` : "",
      presentation.recommendedPayload ? `payload / active species: ${presentation.recommendedPayload}` : "",
      constructGuidance?.payload?.body ? `payload rationale: ${constructGuidance.payload.body}` : "",
      constructGuidance?.constraints?.length ? `construct constraints: ${constructGuidance.constraints.join(", ")}` : "",
      constructGuidance?.precedentNote ? `precedent anchors: ${constructGuidance.precedentNote.replace(/\n+/g, " | ")}` : "",
      `confidence: ${presentation.confidence}`,
    ].filter(Boolean);

    return [
      {
        title: focusTitle,
        body: topPickWhy,
        bullets: blueprintBullets,
      },
      {
        title: "Key Watchouts",
        body: [presentation.biggestWatchout, comparisonTension]
          .filter(Boolean)
          .join(" ") || "the therapeutic window and release logic still need to hold in the real disease setting.",
        bullets: [
          presentation.firstValidationStep ? `first validation step: ${presentation.firstValidationStep}` : "",
        ].filter(Boolean),
      },
    ];
  }

  if (presentation.mode === "concept-explainer") {
    return [
      {
        title: "Direct Answer",
        body: topPickWhy,
        bullets: [
          `what it is: ${presentation.whatItIs}`,
          `where it fits best: ${presentation.bestFit}`,
        ],
      },
      {
        title: "Main Watchout",
        body: presentation.mainWatchout,
      },
      {
        title: "Best Next Question",
        body: presentation.bestClarifier ?? `do you want biology fit, construct design, or real examples next?`,
      },
    ];
  }

  return [
    {
      title: "Disease-Level Exploration Summary",
      body: topPickWhy,
      bullets: [
        `confidence: ${presentation.confidence}`,
        presentation.explorationConfidence ? `exploration confidence: ${presentation.explorationConfidence}` : "",
      ].filter(Boolean),
    },
    {
      title: "Dominant Constraints",
      body: (presentation.dominantConstraints ?? exploration?.dominantConstraints ?? []).join("; ") || "the target, trafficking story, and construct logic are still underdefined.",
      bullets: uncertainties.slice(0, 3),
    },
    {
      title: "One Most Useful Clarifier",
      body: presentation.bestClarifier ?? exploration?.mostInformativeClarifier ?? "what single target or entry handle would collapse the most uncertainty here?",
    },
  ];
}

function buildDocumentText(sections: DocumentSection[]) {
  return sections
    .flatMap((section) => [
      section.title,
      completeSentence(section.body),
      ...(section.bullets?.length ? section.bullets.map((bullet) => `- ${completeSentence(bullet)}`) : []),
      "",
    ])
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function detectOligoSubtype(
  prompt: string,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
) {
  const text = normalize(`${prompt} ${normalizedCase.parsed.cleanedPrompt}`);
  if (/\bpmo\b|phosphorodiamidate|exon|splice|splice-switch|exon skipping/.test(text)) {
    return "pmo / splice-switching oligo";
  }
  if (/\bsirna\b|\bsi-rna\b|\brisc\b|\bmrna knockdown\b|\bduplex\b/.test(text)) {
    return "sirna cargo";
  }
  if (abstraction.compartmentNeed === "nuclear" || normalizedCase.mechanismClass === "gene modulation") {
    return "aso or pmo-class cargo";
  }
  return "aso / sirna / pmo only after the active compartment is clearer";
}

function buildFormatDepthCards(
  prompt: string,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
): DepthModuleCard[] {
  const modality = top?.name?.toLowerCase().trim() ?? "";
  const cards: DepthModuleCard[] = [];
  const oligoSubtype = detectOligoSubtype(prompt, normalizedCase, abstraction);
  const barrierLimited = abstraction.deliveryAccessibility === "barrier-limited";
  const intracellular = abstraction.deliveryAccessibility === "intracellular difficult";

  if (modality === "adc") {
    cards.push(
      {
        title: "full igg adc",
        badge: "default lead",
        body: "best when target separation, exposure, and manufacturing precedent matter more than penetration.",
        bullets: [
          "use when the biology truly wants intracellular payload release after target engagement.",
          "watch out for normal-tissue exposure if the antigen window is only moderate.",
        ],
      },
      {
        title: "fab / scfv / vhh drug conjugate",
        badge: "smaller format",
        body: "worth screening when tissue penetration, faster distribution, or barrier pressure matters more than maximum half-life.",
        bullets: [
          "vhh or scfv can help if the full igg is too bulky for the real tissue-access problem.",
          "watch out for faster clearance and more fragile developability.",
        ],
      },
      {
        title: "bispecific or multispecific binder",
        badge: "gated selectivity",
        body: "useful when one target alone does not give a clean enough safety window and dual recognition may rescue selectivity.",
        bullets: [
          "better for weak target windows than for already-clean single-target cases.",
          "watch out for format complexity before the biology truly justifies it.",
        ],
      },
    );
  } else if (modality === "oligo conjugate") {
    cards.push(
      {
        title: oligoSubtype,
        badge: "active species first",
        body: "start by picking the oligo scaffold from the biology first, then build delivery around that scaffold instead of the other way around.",
        bullets: [
          "aso is usually the first branch for sequence-directed modulation.",
          "sirna needs real cytosolic delivery and duplex-friendly chemistry.",
          "pmo is especially relevant when splice correction is the center of gravity.",
        ],
      },
      {
        title: "peptide-assisted oligo carrier",
        badge: intracellular ? "uptake-biased" : "delivery option",
        body: "best when the real bottleneck is productive uptake or endosomal escape rather than target recognition alone.",
        bullets: [
          "good when the case reads like a delivery problem more than a payload problem.",
          "watch out for improved uptake that still does not produce real intracellular activity.",
        ],
      },
      {
        title: "protein- or receptor-guided oligo carrier",
        badge: "targeted delivery",
        body: "useful when there is a believable uptake handle, tissue-bias handle, or receptor story that can do more than generic exposure gain.",
        bullets: [
          "compact proteins, fabs, or vhh carriers are often easier to justify than full igg if trafficking is the real job.",
          "watch out for attachment chemistry that blocks uptake or oligo activity.",
        ],
      },
    );
  } else if (modality === "pdc") {
    cards.push(
      {
        title: "linear peptide conjugate",
        badge: "fast screen",
        body: "good first if a peptide already has believable binding biology and the construct needs to stay smaller than an antibody.",
        bullets: [
          "use when smaller size is part of the actual delivery logic.",
          "watch out for proteolysis and weak residence time.",
        ],
      },
      {
        title: "cyclic peptide or stapled motif",
        badge: "stability-tuned",
        body: "better when the peptide concept works but the first risk is stability, affinity retention, or conformational control.",
        bullets: [
          "good if the biology likes a peptide but the linear version looks too fragile.",
          "watch out for synthesis and attachment complexity.",
        ],
      },
      {
        title: "fc- or albumin-extended peptide format",
        badge: "exposure-biased",
        body: "use only if the peptide biology is right and the missing piece is exposure rather than tissue penetration.",
        bullets: [
          "adds half-life and can stabilize the concept.",
          "watch out for losing the very size advantage that made pdc attractive.",
        ],
      },
    );
  } else if (modality === "smdc") {
    cards.push(
      {
        title: "small-molecule ligand conjugate",
        badge: "core format",
        body: "best when the targeting pharmacophore itself is compact, validated, and linker-tolerant.",
        bullets: [
          "good when the ligand already does the real targeting job.",
          "watch out for affinity loss after payload attachment.",
        ],
      },
      {
        title: "half-life tuned smdc",
        badge: "pk-tuned",
        body: "worth screening when the ligand biology is right but the cleanest small format clears too fast to matter in vivo.",
        bullets: [
          "can rescue exposure without abandoning the ligand-first architecture.",
          "watch out for kidney and off-target exposure as pk tuning grows.",
        ],
      },
    );
  } else if (modality === "rdc") {
    cards.push(
      {
        title: "ligand-chelator radioconjugate",
        badge: "default lead",
        body: "best when localization and dosimetry matter more than classical free-payload release.",
        bullets: [
          "use if the biology is really about retention and emitter choice.",
          "watch out for organ retention and isotope half-life mismatch.",
        ],
      },
      {
        title: "antibody or fragment radioconjugate",
        badge: barrierLimited ? "conditional" : "slower exposure",
        body: "better when the target window is real but slower localization or longer circulation is acceptable for the isotope plan.",
        bullets: [
          "good if the antigen window is stronger than the small-ligand chemistry.",
          "watch out for slow kinetics against short-lived isotopes.",
        ],
      },
    );
  } else {
    cards.push(
      {
        title: "full igg or larger biologic",
        badge: "when window is clean",
        body: "use when target separation, exposure, and classical delivery precedent matter most.",
        bullets: ["best if the biology already supports a large carrier."],
      },
      {
        title: "compact protein or peptide format",
        badge: "when access matters",
        body: "use when tissue access, barrier pressure, or faster distribution matters more than maximum half-life.",
        bullets: ["good for harder-access biology, but only if the smaller format still keeps the needed binding logic."],
      },
      {
        title: "oligo or active-cargo-led format",
        badge: intracellular ? "gene/rna-biased" : "conditional",
        body: "use when the real therapeutic event is sequence-directed or transcript-directed rather than classical released warhead biology.",
        bullets: ["pick the active species first, then the carrier and chemistry."],
      },
    );
  }

  return cards.slice(0, 3);
}

function buildLinkerDepthCards(
  prompt: string,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
): DepthModuleCard[] {
  const modality = top?.name?.toLowerCase().trim() ?? "";
  const oligoCase = modality === "oligo conjugate" || normalizedCase.mechanismClass === "gene modulation";
  const cytotoxicCase = abstraction.cytotoxicFit === "favored" || modality === "adc" || modality === "pdc" || modality === "smdc";

  if (oligoCase) {
    return [
      {
        title: "stable non-cleavable spacer",
        badge: "default first pass",
        body: "best when the targeting or uptake handle has to stay attached long enough to support uptake, trafficking, or residence.",
        bullets: [
          "good when the active oligo still works while attached or after predictable processing.",
          "watch out for bulky linkers that hurt hybridization or trafficking.",
        ],
      },
      {
        title: "reductively cleavable disulfide",
        badge: "release-triggered",
        body: "worth testing when the carrier must come off inside the cell to recover activity or reduce steric burden.",
        bullets: [
          "good if intracellular release is part of the mechanism hypothesis.",
          "watch out for serum instability and premature loss in circulation.",
        ],
      },
      {
        title: "enzyme-cleavable spacer",
        badge: "conditional",
        body: "use only if the biology really gives you a believable protease or lysosomal processing story that helps the active oligo.",
        bullets: [
          "cathepsin-tuned peptide spacers can make sense in trafficking-heavy designs.",
          "watch out for adding complexity without improving productive activity.",
        ],
      },
    ];
  }

  const cards: DepthModuleCard[] = [
    {
      title: "non-cleavable linker",
      badge: "catabolite-driven",
      body: "best when intracellular degradation of the carrier is enough to produce the active species and you want maximum plasma robustness.",
      bullets: [
        "often the safest starting point when bystander release is not required.",
        "watch out if the biology needs true free-payload release to work.",
      ],
    },
    {
      title: "protease-cleavable peptide linker",
      badge: "enzyme-cleavable",
      body: "best when lysosomal or protease-heavy processing should actively help payload release inside the right cells.",
      bullets: [
        "val-cit, val-ala, or more tuned peptide variants are usually better first passes than exotic chemistry.",
        "watch out for plasma instability if the protease window is not truly compartment-biased.",
      ],
    },
    {
      title: "disulfide or reduction-cleavable linker",
      badge: "redox-cleavable",
      body: "worth considering when intracellular reduction is the intended release trigger and you can control stability well enough in circulation.",
      bullets: [
        "good for fast intracellular release hypotheses.",
        "watch out for premature deconjugation before the construct reaches the real compartment.",
      ],
    },
  ];

  if (cytotoxicCase) {
    cards.push({
      title: "hydrazone / acid-labile linker",
      badge: "legacy / high-risk",
      body: "only a conditional option when acidic release is a real part of the microenvironment story and simpler linker classes are failing.",
      bullets: [
        "use as a deliberate exception, not the default.",
        "watch out for historical stability problems and noisy release.",
      ],
    });
  }

  return cards.slice(0, 3);
}

function buildPayloadDepthCards(
  prompt: string,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
): DepthModuleCard[] {
  const modality = top?.name?.toLowerCase().trim() ?? "";
  const oligoSubtype = detectOligoSubtype(prompt, normalizedCase, abstraction);

  if (modality === "oligo conjugate" || normalizedCase.mechanismClass === "gene modulation") {
    return [
      {
        title: oligoSubtype,
        badge: "lead active species",
        body: "this is the first payload family to pressure-test when the biology is sequence-directed, transcript-directed, or splice-directed.",
        bullets: [
          "pick the oligo chemistry from the compartment and mechanism, not from the carrier first.",
          "watch out for choosing a carrier before the active species is truly locked.",
        ],
      },
      {
        title: "plain comparator oligo",
        badge: "baseline control",
        body: "keep a simple unconjugated or minimally modified oligo visible so you can measure whether delivery architecture is truly earning its complexity.",
        bullets: [
          "useful as the honest benchmark for all enhanced-delivery ideas.",
        ],
      },
      {
        title: "delivery-decorated oligo",
        badge: "enhanced routing",
        body: "best when the base oligo biology is right but uptake, exposure, or endosomal escape is the real blocker.",
        bullets: [
          "worth testing against the plain comparator before over-optimizing chemistry.",
        ],
      },
    ];
  }

  if (modality === "adc" || modality === "pdc" || modality === "smdc") {
    return [
      {
        title: "tubulin inhibitor class",
        badge: "classical cytotoxic",
        body: "mmae or mmaf-style logic is still a practical first branch when the biology really wants cytotoxic intracellular release.",
        bullets: [
          "mmae helps if membrane-permeable bystander behavior is useful.",
          "mmaf is cleaner if you want less bystander spread.",
        ],
      },
      {
        title: "topoisomerase-i class",
        badge: "higher-potency option",
        body: "dxd or sn-38 style logic is worth testing when the target window can support it and the biology wants a stronger released-warhead story.",
        bullets: [
          "good when microtubule biology is not the cleanest fit.",
          "watch out for payload permeability and systemic exposure pressure.",
        ],
      },
      {
        title: "non-cytotoxic active species",
        badge: abstraction.cytotoxicFit === "discouraged" ? "important comparator" : "conditional",
        body: "keep this visible whenever the case may actually want pathway modulation, immune modulation, or local biology change rather than brute cell killing.",
        bullets: [
          "useful if the construct architecture is right but the warhead hypothesis is too aggressive.",
        ],
      },
    ];
  }

  if (modality === "rdc") {
    return [
      {
        title: "diagnostic isotope branch",
        badge: "imaging",
        body: "best if localization confidence has to come before committing to a therapeutic emitter.",
      },
      {
        title: "therapeutic beta or alpha emitter branch",
        badge: "therapy",
        body: "best when the target-retention story and organ dosimetry are already believable enough to justify therapeutic radiobiology.",
      },
    ];
  }

  return [
    {
      title: "active species matched to the biology",
      badge: "default rule",
      body: "choose the payload from the therapeutic event first: sequence-directed, pathway-directed, radiobiologic, catalytic, or cytotoxic.",
    },
    {
      title: "comparator payload branch",
      badge: "reality check",
      body: "keep one simpler comparator payload visible so you can separate real biology from payload overfitting.",
    },
  ];
}

function buildChemistryDepthCards(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
): DepthModuleCard[] {
  const modality = top?.name?.toLowerCase().trim() ?? "";
  const oligoCase = modality === "oligo conjugate" || normalizedCase.mechanismClass === "gene modulation";

  const cards: DepthModuleCard[] = [
    {
      title: "lysine conjugation",
      badge: "fast but heterogeneous",
      body: "good for quick first-pass feasibility when exact site control is less important than speed.",
      bullets: [
        "nhs esters are the default starting handle.",
        "tfp esters can help if you want a little more controlled reactivity.",
        "isothiocyanates stay worth considering for slower, handle-tolerant protein labeling.",
      ],
    },
    {
      title: "cysteine conjugation",
      badge: "cleaner dar control",
      body: "usually the better first path when dar control, stability, and exposure are more important than absolute simplicity.",
      bullets: [
        "interchain cysteine is the fast practical route for igg-style builds.",
        "site-specific cysteine is better when you need tighter dar and more predictable pk.",
      ],
    },
    {
      title: "enzymatic or glycan-directed conjugation",
      badge: "site-specific",
      body: "useful when you want cleaner attachment without inventing a fully custom engineered-cysteine program on day one.",
      bullets: [
        "sortase, transglutaminase, or glycan remodeling are the usual practical branches.",
        "best when the format and manufacturing plan can tolerate the extra process step.",
      ],
    },
  ];

  if (oligoCase) {
    cards.unshift({
      title: "bioorthogonal oligo ligation",
      badge: "modular",
      body: "usually the easiest chemistry family for protein-oligo or peptide-oligo modular builds where you need the scaffold and the active oligo preserved independently.",
      bullets: [
        "azide-alkyne click, strain-promoted click, or tetrazine ligation are the usual practical branches.",
        "watch out for handle placement that hurts hybridization or uptake.",
      ],
    });
  } else if (abstraction.cytotoxicFit === "favored") {
    cards.push({
      title: "engineered site-specific cysteine",
      badge: "best for polished builds",
      body: "worth the extra work when the project needs a more reproducible dar and cleaner structure-function readout than interchain conjugation can give.",
      bullets: [
        "use suggested sites only after checking they preserve binding, stability, and manufacturability for the actual format.",
      ],
    });
  }

  return cards.slice(0, 4);
}

function buildBiologyPressureCards(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
  biology: BiologySection[],
  uncertainties: string[],
): DepthModuleCard[] {
  const diseaseLabel =
    normalizedCase.disease?.canonical ??
    normalizedCase.target?.canonical ??
    "this case";
  const cards: DepthModuleCard[] = [
    {
      title: "current biology read",
      badge: exploration?.interpretationMode === "tentative" ? "provisional" : "grounded",
      body:
        exploration?.diseaseFrame ??
        `${diseaseLabel} still needs a cleaner biology read before one construct can lead responsibly.`,
      bullets: exploration?.understandingSignals ?? [],
    },
    {
      title: "main bottlenecks",
      badge: "design pressure",
      body:
        exploration?.dominantConstraints.join("; ") ||
        abstraction.translationalConstraints.join("; ") ||
        "the main design bottlenecks still need to be made explicit.",
      bullets: uncertainties.slice(0, 3),
    },
    {
      title: "how to approach the problem",
      badge: "next decision",
      body:
        exploration?.mostInformativeClarifier ??
        "pick the decision that collapses the most uncertainty first: target, compartment, active species, or chemistry.",
      bullets: biology.slice(0, 2).map((section) => `${section.title}: ${section.body}`),
    },
  ];

  return cards;
}

function buildCreativeDepthCards(innovativeIdeas: InnovativeIdea[]): DepthModuleCard[] {
  if (!innovativeIdeas.length) {
    return [
      {
        title: "creative branch still needs a clearer bottleneck",
        badge: "exploratory",
        body: "the first creative move should attack the actual blocker: access, selectivity, trafficking, release, or active-species fit.",
      },
    ];
  }

  return innovativeIdeas.slice(0, 3).map((idea) => ({
    title: idea.ideaName,
    badge: idea.riskLevel,
    body: idea.whyInteresting,
    bullets: [
      `assumption: ${idea.assumptionMustBeTrue}`,
      `first experiment: ${idea.firstExperiment}`,
      `failure mode: ${idea.whyItCouldFail}`,
    ],
  }));
}

function buildPrototypePlanCards(
  normalizedCase: NormalizedCase,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  top: RankedOption | undefined,
  prompt: string,
): DepthModuleCard[] {
  const oligoSubtype = detectOligoSubtype(
    prompt,
    normalizedCase,
    constructGuidance?.conditional
      ? {
          pathologyType: "unknown",
          therapeuticIntent: normalizedCase.mechanismClass === "gene modulation" ? "gene/rna modulation" : "unknown",
          targetClass: "unknown",
          deliveryAccessibility: normalizedCase.needsIntracellularAccess ? "intracellular difficult" : "unknown",
          deliveryBarriers: [],
          mechanismLocation: "unknown",
          treatmentContext: normalizedCase.chronicContext ? "chronic" : "acute",
          cytotoxicFit: normalizedCase.mechanismClass === "cytotoxic delivery" ? "favored" : "discouraged",
          internalizationRequirement: "unknown",
          compartmentNeed: normalizedCase.needsNuclearAccess ? "nuclear" : "unknown",
          translationalConstraints: [],
          abstractionRationale: [],
          source: "normalized-context",
        }
      : ({
          pathologyType: "unknown",
          therapeuticIntent: "unknown",
          targetClass: "unknown",
          deliveryAccessibility: "unknown",
          deliveryBarriers: [],
          mechanismLocation: "unknown",
          treatmentContext: "chronic",
          cytotoxicFit: "unknown",
          internalizationRequirement: "unknown",
          compartmentNeed: "unknown",
          translationalConstraints: [],
          abstractionRationale: [],
          source: "normalized-context",
        } as BiologicalAbstraction),
  );

  return [
    {
      title: "prototype 1",
      badge: "baseline",
      body: `build the simplest honest version first: ${constructGuidance?.format?.title ?? top?.name ?? "lead construct"} with ${constructGuidance?.linker?.title ?? "the most conservative attachment logic"}.`,
      bullets: [
        `payload / active species: ${constructGuidance?.payload?.title ?? oligoSubtype}`,
        "goal: learn whether the biology is right before optimizing complexity.",
      ],
    },
    {
      title: "prototype 2",
      badge: "improved delivery",
      body: "change one thing that directly attacks the bottleneck: uptake, exposure, release, or selectivity.",
      bullets: [
        "keep the active species constant so the delivery change is interpretable.",
        "use this to decide whether the problem is biology fit or construct execution.",
      ],
    },
    {
      title: "prototype 3",
      badge: "creative branch",
      body: "test the highest-upside alternative only after the baseline and improved-delivery versions tell you what is actually limiting the system.",
      bullets: [
        "this is where bispecific gating, shuttle logic, or creative chemistry becomes worth the complexity.",
      ],
    },
  ];
}

function buildDepthModules(
  mode: ResponseMode,
  prompt: string,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
  top: RankedOption | undefined,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  biology: BiologySection[],
  uncertainties: string[],
  innovativeIdeas: InnovativeIdea[],
): DepthModule[] {
  if (mode === "normal") {
    return [];
  }

  const modules: DepthModule[] = [
    {
      key: "format-options",
      title: "protein / targeting format options",
      summary: "the most believable carrier formats to pressure-test next, based on the biology and delivery problem rather than one rigid modality template.",
      cards: buildFormatDepthCards(prompt, normalizedCase, abstraction, top),
    },
    {
      key: "linker-options",
      title: "linker and release logic",
      summary: "how the release mechanism should match compartment, microenvironment, and whether the active species needs to stay attached or be liberated.",
      cards: buildLinkerDepthCards(prompt, normalizedCase, abstraction, top),
    },
    {
      key: "payload-options",
      title: "payload / active-species options",
      summary: "which payload families are actually worth comparing, based on whether the case wants cytotoxic release, radiobiology, catalytic function, or gene/rna modulation.",
      cards: buildPayloadDepthCards(prompt, normalizedCase, abstraction, top),
    },
    {
      key: "chemistry-options",
      title: "conjugation chemistry options",
      summary: "the most practical attachment chemistries to screen first, including when to use lysine, cysteine, site-specific, enzymatic, or modular click-style approaches.",
      cards: buildChemistryDepthCards(normalizedCase, abstraction, top),
    },
    {
      key: "biology-pressures",
      title: "biology and design pressures",
      summary: "the biological pressures shaping the construct, the biggest bottlenecks, and the one decision that would sharpen the design fastest.",
      cards: buildBiologyPressureCards(normalizedCase, abstraction, exploration, biology, uncertainties),
    },
    {
      key: "creative-paths",
      title: "creative solution paths",
      summary: "higher-upside alternatives that stay anchored to the same biology instead of becoming random modality changes.",
      cards: buildCreativeDepthCards(innovativeIdeas),
    },
  ];

  if (mode === "max-depth") {
    modules.push({
      key: "prototype-plan",
      title: "what i would prototype first",
      summary: "a deeper build sequence for turning the current read into an actual experimental plan without pretending every parameter is already solved.",
      cards: buildPrototypePlanCards(normalizedCase, constructGuidance, top, prompt),
    });
  }

  return modules;
}

function buildSectionOrder(variant: PresentationVariant): string[] {
  switch (variant) {
    case "visual-follow-up":
      return [
        "follow-up answer",
        "visual companion",
        "recommended construct / strategy table",
        "ranking / scores",
        "evidence / precedent anchors",
        "debug trace",
      ];
    case "blueprint-first":
      return [
        "recommended starting point",
        "construct blueprint",
        "recommended construct / strategy table",
        "ranking / scores",
        "innovative strategy ideas",
        "why not the other options",
        "evidence / precedent anchors",
        "what is still uncertain",
        "debug trace",
      ];
    default:
      return [
        "best current strategy direction",
        "document sections",
        "recommended construct / strategy table",
        "ranking / scores",
        "innovative strategy ideas",
        "why not the other options",
        "evidence / precedent anchors",
        "what is still uncertain",
        "debug trace",
      ];
  }
}

function buildEvidenceAnchors(
  sources: EvidenceSource[],
  retrievalSourceBuckets: RetrievedSourceBucket[],
  precedentPlaybook?: OncologyPrecedentPlaybook | null,
  oligoPrecedentAnchors?: OligoPrecedentAnchorSet | null,
): EvidenceSource[] {
  const retrievalFallbackSources = retrievalSourceBuckets
    .flatMap((bucket) =>
      bucket.items.slice(0, 2).map((item) => ({
        label: item.label,
        href: item.href,
        why: item.snippet || `retrieved from ${bucket.label}.`,
        type: item.sourceType,
      })),
    )
    .filter((item) => item.label);

  const anchorSources = [
    precedentPlaybook?.dominantProduct?.label
      ? {
          label: precedentPlaybook.dominantProduct.label,
          href: precedentPlaybook.dominantProduct.href,
          why: precedentPlaybook.rationale,
          type: "approved product",
        }
      : null,
    precedentPlaybook?.comparatorProduct?.label
      ? {
          label: precedentPlaybook.comparatorProduct.label,
          href: precedentPlaybook.comparatorProduct.href,
          why: "useful older comparator playbook for linker and payload context.",
          type: "clinical candidate",
        }
      : null,
    oligoPrecedentAnchors?.approvedComparator
      ? {
          label: oligoPrecedentAnchors.approvedComparator.label,
          href: oligoPrecedentAnchors.approvedComparator.href,
          why: oligoPrecedentAnchors.approvedComparator.role,
          type: "approved comparator",
        }
      : null,
    oligoPrecedentAnchors?.conjugatedExample
      ? {
          label: oligoPrecedentAnchors.conjugatedExample.label,
          href: oligoPrecedentAnchors.conjugatedExample.href,
          why: oligoPrecedentAnchors.conjugatedExample.role,
          type: "conjugated example",
        }
      : null,
    oligoPrecedentAnchors?.targetedDeliveryExample
      ? {
          label: oligoPrecedentAnchors.targetedDeliveryExample.label,
          href: oligoPrecedentAnchors.targetedDeliveryExample.href,
          why: oligoPrecedentAnchors.targetedDeliveryExample.role,
          type: "targeted delivery example",
        }
      : null,
    oligoPrecedentAnchors?.platformAnchor
      ? {
          label: oligoPrecedentAnchors.platformAnchor.label,
          href: oligoPrecedentAnchors.platformAnchor.href,
          why: oligoPrecedentAnchors.platformAnchor.role,
          type: "platform anchor",
        }
      : null,
  ].filter(Boolean) as EvidenceSource[];

  return Array.from(
    new Map(
      [...anchorSources, ...sources, ...retrievalFallbackSources].map((item) => [`${item.label}:${item.href ?? ""}`, item]),
    ).values(),
  ).slice(0, 8);
}

function buildTopPickWhy(
  top: RankedOption,
  validationPasses: ValidationPass[],
  precedentPlaybook?: OncologyPrecedentPlaybook | null,
  oligoPrecedentAnchors?: OligoPrecedentAnchorSet | null,
) {
  const softNote = validationPasses.some((pass) => !pass.passed && pass.name === "source support sanity")
    ? " confidence is softer than usual because direct support is still thin."
    : "";
  const precedentNote =
    precedentPlaybook?.modality === (top.name as (typeof MODALITY_ORDER)[number])
      ? ` the dominant approved-product playbook here is ${precedentPlaybook.dominantProduct.label}, which points toward ${precedentPlaybook.dominantProduct.linker} and ${precedentPlaybook.dominantProduct.payload}.${precedentPlaybook.dominantProduct.safetyWatchout ? ` safety watchout: ${precedentPlaybook.dominantProduct.safetyWatchout}` : ""}`
      : oligoPrecedentAnchors?.modality === (top.name as (typeof MODALITY_ORDER)[number])
        ? ` useful anchor examples here include ${[
            oligoPrecedentAnchors.approvedComparator?.label,
            oligoPrecedentAnchors.conjugatedExample?.label,
            oligoPrecedentAnchors.targetedDeliveryExample?.label,
          ]
            .filter(Boolean)
            .join(", ")}, but those anchors should stay as comparators and delivery examples rather than being treated as automatic winners for your exact construct.`
      : "";
  return `${top.fitReason} ${top.bestEvidenceFor ?? ""}${precedentNote}${softNote}`.trim();
}

function categoryWinLine(cell: MatrixCell) {
  if (cell.category === "biology fit") {
    return `the strongest support is the biology match: ${cell.reason}`;
  }
  if (cell.category === "delivery fit") {
    return `the strongest support is the delivery logic: ${cell.reason}`;
  }
  if (cell.category === "release fit") {
    return `the strongest support is the active-species logic: ${cell.reason}`;
  }
  if (cell.category === "safety fit") {
    return `the strongest support is the exposure and safety logic: ${cell.reason}`;
  }
  return `the strongest support is precedent: ${cell.reason}`;
}

function categoryMustBeTrueLine(cell: MatrixCell, modality: (typeof MODALITY_ORDER)[number]) {
  if (cell.category === "biology fit") {
    return `the underlying disease mechanism really has to belong in ${modality} territory.`;
  }
  if (cell.category === "delivery fit") {
    return "the construct has to reach the right tissue and compartment in a productive way.";
  }
  if (cell.category === "release fit") {
    return "the released or preserved active species has to match the therapeutic mechanism.";
  }
  if (cell.category === "safety fit") {
    return "the normal-tissue exposure pattern has to stay acceptable in the real dosing window.";
  }
  return "the literature and program precedent have to stay relevant to your exact target and disease setting.";
}

function categoryAgainstLine(cell: MatrixCell, modality: (typeof MODALITY_ORDER)[number]) {
  if (cell.category === "biology fit") {
    return `the main reason against ${modality} is still the biology mismatch: ${cell.reason}`;
  }
  if (cell.category === "delivery fit") {
    return `the main reason against ${modality} is the delivery problem: ${cell.reason}`;
  }
  if (cell.category === "release fit") {
    return `the main reason against ${modality} is the active-species mismatch: ${cell.reason}`;
  }
  if (cell.category === "safety fit") {
    return `the main reason against ${modality} is the safety and exposure problem: ${cell.reason}`;
  }
  return `the main reason against ${modality} is weak direct precedent: ${cell.reason}`;
}

function enrichRankingWithMatrix(
  ranking: RankedOption[],
  matrix: MatrixSummaryRow[],
  scored?: Array<{ modality: string; total: number; gate: { status: "allowed" | "penalized" | "gated out"; reasons: string[]; missingEvidence?: string[]; upgradeEvidence?: string[] } }>,
) {
  const scoreMap = new Map((scored ?? []).map((item) => [item.modality, item]));
  return ranking.map((item) => {
    const row = matrix.find((entry) => entry.modality === item.name);
    const scoredRow = scoreMap.get(item.name);
    if (!row) {
      return {
        ...item,
        gateStatus: scoredRow?.gate.status,
        gateReasons: scoredRow?.gate.reasons,
        missingEvidence: scoredRow?.gate.missingEvidence,
        upgradeEvidence: scoredRow?.gate.upgradeEvidence,
        totalScore: scoredRow?.total,
      };
    }

    const strongestCell = row.cells.slice().sort((a, b) => b.score - a.score)[0];
    const weakestCell = row.cells.slice().sort((a, b) => a.score - b.score)[0];

    return {
      ...item,
      gateStatus: scoredRow?.gate.status,
      gateReasons: scoredRow?.gate.reasons,
      missingEvidence: scoredRow?.gate.missingEvidence,
      upgradeEvidence: scoredRow?.gate.upgradeEvidence,
      totalScore: scoredRow?.total,
      bestEvidenceFor: strongestCell ? categoryWinLine(strongestCell) : item.fitReason,
      mainReasonAgainst: weakestCell ? categoryAgainstLine(weakestCell, item.name as (typeof MODALITY_ORDER)[number]) : item.limitReason,
      whatMustBeTrue: weakestCell ? categoryMustBeTrueLine(weakestCell, item.name as (typeof MODALITY_ORDER)[number]) : "the missing assumptions would have to hold in real biology.",
    };
  });
}

function buildInnovativeIdeas(
  prompt: string,
  state: PlannerState,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  confidence: ReturnType<typeof assessConfidence>,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
  ranking: RankedOption[],
  matrix: MatrixSummaryRow[],
  sources: EvidenceSource[],
): InnovativeIdea[] {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.goal ?? ""} ${state.constraints ?? ""} ${state.mustHave ?? ""} ${state.avoid ?? ""}`);
  const top = ranking[0];
  const ideas: InnovativeIdea[] = [];
  const sourceLabels = sources.slice(0, 3).map((item) => item.label);
  const isNeuroBarrierCase =
    abstraction.pathologyType === "neurodegeneration" && abstraction.deliveryAccessibility === "barrier-limited";
  const isMixedDegenerativeCase = abstraction.pathologyType === "mixed" && abstraction.cytotoxicFit === "discouraged";
  const isAutoimmuneNonCytotoxicCase =
    abstraction.pathologyType === "autoimmune/inflammatory" &&
    abstraction.cytotoxicFit === "discouraged";
  const isCnsOncologyCase =
    normalizedCase.recommendationScope === "target-conditioned" &&
    abstraction.pathologyType === "oncology" &&
    abstraction.deliveryAccessibility === "barrier-limited";
  const isSpliceOligoCase = isMechanismSpecificSpliceOligoCase(prompt, normalizedCase, abstraction);
  const isNeuromuscularGeneModulationCase =
    normalizedCase.diseaseArea === "neuromuscular" &&
    abstraction.pathologyType === "genetic/rna-driven" &&
    abstraction.therapeuticIntent === "gene/rna modulation";

  if (isNeuroBarrierCase) {
    ideas.push({
      ideaName: "bbb-shuttle oligo delivery lane",
      whyInteresting:
        "the disease frame already says barrier-limited chronic cns biology, so a shuttle-enabled oligo or rna-modulating construct could unlock a more direct disease-modulation path than generic extracellular dosing.",
      assumptionMustBeTrue:
        "a believable brain-entry route and a disease-relevant transcript or pathway handle actually exist for the subtype you care about.",
      firstExperiment:
        "test whether the chosen shuttle or uptake handle produces productive cns exposure and intracellular activity instead of only improving blood exposure.",
      whyItCouldFail:
        "the construct can still fail if brain exposure improves but active cargo never reaches the relevant cells or compartment in a useful way.",
      riskLevel: confidence.abstain ? "speculative" : "practical",
      sourceLabels,
    });
  }

  if (isMixedDegenerativeCase) {
    ideas.push({
      ideaName: "proteostasis or mitochondrial-supportive conjugate lane",
      whyInteresting:
        "mixed degenerative disease can leave room for a protective payload strategy that supports stressed tissue even when one clean upstream target has not resolved yet.",
      assumptionMustBeTrue:
        "stress-response biology is upstream enough to matter therapeutically and not only a downstream marker of damage.",
      firstExperiment:
        "run a simple stressed-tissue rescue assay to see whether a targeted protective payload changes function or stress markers before optimizing the whole construct.",
      whyItCouldFail:
        "this can fail if the protective lane only improves markers without changing the real driver of disease progression.",
      riskLevel: "speculative",
      sourceLabels,
    });
  }

  if (isAutoimmuneNonCytotoxicCase) {
    ideas.push({
      ideaName: "selective immune-reset or igg-lowering lane",
      whyInteresting:
        "in chronic autoimmune disease, a higher-upside move can be to selectively lower the pathogenic antibody or immune-cell signal rather than only adding another broad anti-inflammatory layer.",
      assumptionMustBeTrue:
        "the real disease driver is specific enough that a targeted immune-reset, igg-lowering, or complement-biased strategy would outperform generic immune suppression.",
      firstExperiment:
        "test whether a more selective antibody- or complement-lowering intervention changes the disease-relevant functional readout before optimizing the full conjugate format.",
      whyItCouldFail:
        "this falls apart if the biology is more heterogeneous than expected or the selective immune handle does not actually outperform a broader mechanism.",
      riskLevel: confidence.abstain ? "speculative" : "practical",
      sourceLabels,
    });
  }

  if (isSpliceOligoCase) {
    ideas.push({
      ideaName: "muscle-targeted splice-switching delivery beyond plain oligo",
      whyInteresting:
        "the mechanism is already specific enough that the interesting design question is no longer whether oligo biology matters, but which delivery handle gives the most productive muscle routing.",
      assumptionMustBeTrue:
        "the added delivery handle improves real intracellular routing without killing splice-switching activity.",
      firstExperiment:
        "compare plain oligo against peptide-conjugated and receptor-targeted delivery variants in a splice readout before committing to one chemistry stack.",
      whyItCouldFail:
        "delivery decoration can improve uptake on paper while still hurting the actual splice-correction biology or chronic tolerability.",
      riskLevel: "practical",
      sourceLabels,
    });
  }

  if (isNeuromuscularGeneModulationCase && !isSpliceOligoCase) {
    ideas.push({
      ideaName: "muscle-targeted transcript-delivery lane",
      whyInteresting:
        "the disease frame already points toward transcript-level muscle biology, so there may be more upside in solving productive muscle delivery for an oligo-class cargo than in forcing a generic peptide or small-molecule payload story.",
      assumptionMustBeTrue:
        "the disease can be shifted by a transcript-directed active species and the added delivery handle improves real muscle exposure rather than only circulation.",
      firstExperiment:
        "compare a plain transcript-directed scaffold against one peptide-assisted and one receptor-mediated muscle-delivery version in the most relevant cell or tissue model before optimizing the full chemistry stack.",
      whyItCouldFail:
        "this can fail if delivery decoration improves uptake on paper but never creates enough active intracellular biology in the muscle compartment that actually matters.",
      riskLevel: confidence.abstain ? "speculative" : "practical",
      sourceLabels,
    });
  }

  if (isCnsOncologyCase) {
    ideas.push({
      ideaName: "smaller-binder or shuttle-assisted brain tumor construct",
      whyInteresting:
        "cns oncology biomarker cases can reward smaller binders or shuttle-assisted formats when full-igg exposure, penetration, and heterogeneity all pull against each other.",
      assumptionMustBeTrue:
        "the smaller or shuttle-assisted format keeps enough binding and tumor exposure to beat a simpler full-igg baseline.",
      firstExperiment:
        "screen full igg versus fab/scfv or shuttle-assisted variants in a penetration and internalization setup before over-optimizing payload chemistry.",
      whyItCouldFail:
        "the format can become too unstable, too short-lived, or too distribution-limited to improve the real tumor-delivery problem.",
      riskLevel: "high-risk",
      sourceLabels,
    });
  }

  if (
    top &&
    top.name === "adc" &&
    /(penetration|solid tumor|heterogeneous|compact|smaller carrier|normal tissue|selectivity)/.test(text)
  ) {
    ideas.push({
      ideaName: "small-format protein conjugate instead of full igg",
      whyInteresting:
        "the core biology can still belong in payload-delivery territory, but a fab, scfv, vhh, or other smaller binding format may preserve the delivery logic while easing penetration or tissue-access pressure.",
      assumptionMustBeTrue:
        "the binder has to keep enough affinity and exposure after shrinking the carrier, and the conjugation chemistry has to avoid wrecking the smaller format.",
      firstExperiment:
        "compare target binding, penetration, and internalization for a smaller binder against the default full-igg format before finalizing linker and payload.",
      whyItCouldFail:
        "full igg is still the simpler default when the target window is clean and exposure matters more than penetration.",
      riskLevel: "speculative",
      sourceLabels,
    });
  }

  if (
    top &&
    (top.name === "adc" || top.name === "pdc") &&
    /(heterogeneous|normal tissue|safety|off target|weak window|dual target|selectivity|tumor versus normal)/.test(text)
  ) {
    ideas.push({
      ideaName: "bispecific or multispecific gated conjugate",
      whyInteresting:
        "if one target alone does not give a trustworthy window, a dual-recognition format can sometimes rescue selectivity by demanding a more tumor-specific binding context before payload delivery dominates.",
      assumptionMustBeTrue:
        "there has to be a believable pair of targets or epitopes that improves discrimination enough to justify the extra format complexity.",
      firstExperiment:
        "test whether dual binding really improves tumor-versus-normal discrimination before paying the full bispecific engineering cost.",
      whyItCouldFail:
        "this is more complex than a single-binder construct and only makes sense if the normal-tissue problem is the real blocker.",
      riskLevel: "high-risk",
      sourceLabels,
    });
  }

  if (
    top &&
    top.name === "rdc" &&
    /(kidney|salivary|dosimetry|off target|background exposure|circulation)/.test(text)
  ) {
    ideas.push({
      ideaName: "pretargeted radioligand workflow",
      whyInteresting:
        "if radionuclide logic is right but organ exposure is the weak spot, a pretargeted approach can separate targeting from isotope delivery instead of forcing both jobs into one construct at the same moment.",
      assumptionMustBeTrue:
        "the targeting and capture chemistry both have to be fast and specific enough for a staged workflow to beat the simpler direct-radioligand route.",
      firstExperiment:
        "measure target retention and background clearance in a staged localization study before trying to optimize the full radiochemistry package.",
      whyItCouldFail:
        "direct radioligands are still the default when localization and dosimetry are already acceptable.",
      riskLevel: "high-risk",
      sourceLabels,
    });
  }

  if (
    top &&
    top.name === "oligo conjugate" &&
    /(delivery|uptake|muscle|cns|trafficking|endosome|entry)/.test(text)
  ) {
    ideas.push({
      ideaName: "tissue-biased oligo hybrid rather than a plain oligo construct",
      whyInteresting:
        "if the therapeutic mechanism clearly belongs in oligo biology but delivery is the bottleneck, the more interesting move may be to keep the oligo payload while changing the entry handle or carrier logic rather than switching to a warhead platform.",
      assumptionMustBeTrue:
        "the added targeting or uptake handle has to improve productive trafficking without blocking the oligo’s actual sequence-driven activity.",
      firstExperiment:
        "benchmark plain oligo against one targeted-delivery hybrid in a productive activity assay rather than only an uptake assay.",
      whyItCouldFail:
        "plain oligo delivery remains simpler unless tissue access is obviously the real reason the baseline approach is failing.",
      riskLevel: "practical",
      sourceLabels,
    });
  }

  if (
    top &&
    top.name === "smdc" &&
    /(half life|clearance|kidney|exposure|short exposure|pk)/.test(text)
  ) {
    ideas.push({
      ideaName: "half-life tuned smdc instead of the leanest ligand-first build",
      whyInteresting:
        "if the ligand-first biology is right but exposure collapses too quickly, a more adventurous option is to preserve the smdc logic while adding a deliberate half-life-tuning element rather than abandoning the class.",
      assumptionMustBeTrue:
        "the pk-tuning element has to buy exposure without breaking target binding or pushing kidney and off-target liabilities too far.",
      firstExperiment:
        "run a simple pk and target-engagement comparison before assuming the tuned version still behaves like the original ligand-first construct.",
      whyItCouldFail:
        "the cleanest smdc is still better when compact size and fast tissue movement are the main reasons the class won in the first place.",
      riskLevel: "speculative",
      sourceLabels,
    });
  }

  if (
    top &&
    top.name === "enzyme conjugate" &&
    /(background|specificity|local activation|stroma|microenvironment)/.test(text)
  ) {
    ideas.push({
      ideaName: "microenvironment-gated activation instead of direct local catalysis alone",
      whyInteresting:
        "if enzyme or prodrug logic is attractive but background activity is the weak point, a more creative route is to make activation depend on an additional local cue rather than trusting one enzyme layer by itself.",
      assumptionMustBeTrue:
        "there has to be a real second gate in the disease setting, otherwise the extra cleverness only adds fragility.",
      firstExperiment:
        "test whether the second gate changes activation selectivity in a simple disease-mimicking condition before engineering the full construct.",
      whyItCouldFail:
        "plain enzyme or prodrug logic is still the better default when the local catalytic story is already selective enough.",
      riskLevel: "high-risk",
      sourceLabels,
    });
  }

  return ideas.slice(0, confidence.abstain ? 3 : 4);
}

function buildBiologySections(
  prompt: string,
  state: PlannerState,
  normalizedCase: NormalizedCase,
  top: RankedOption | undefined,
  matrix: MatrixSummaryRow[],
  biologySources: EvidenceSource[],
  diseaseGrounding?: {
    summary: string;
    rationale: string;
    plausibleDirections: string[];
  } | null,
): BiologySection[] {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.goal ?? ""} ${state.payloadClass ?? ""} ${state.releaseGoal ?? ""}`);
  const diseaseProfileEntry = Object.entries(DISEASE_MECHANISM_PROFILES).find(([canonical]) =>
    text.includes(canonical.toLowerCase()),
  );
  const diseaseProfile = diseaseGrounding ?? diseaseProfileEntry?.[1];
  const diseaseLevelOnly = normalizedCase.recommendationScope === "disease-level";
  const topRow = top ? matrix.find((row) => row.modality === top.name) : undefined;
  const biologyFit =
    topRow?.cells.find((cell) => cell.category === "biology fit")?.reason ??
    top?.fitReason ??
    "the biology is still too broad to support a responsible winner yet.";
  const deliveryFit = topRow?.cells.find((cell) => cell.category === "delivery fit")?.reason ?? "the delivery biology is still not sharply defined.";
  const releaseFit = topRow?.cells.find((cell) => cell.category === "release fit")?.reason ?? "the active-species biology still needs to be clarified.";
  const weakestCell =
    topRow?.cells.slice().sort((a, b) => a.score - b.score)[0] ??
    { category: "biology fit", reason: "the main biology unknown is still not obvious from the current brief." };

  const diseaseRead = (() => {
    if (diseaseProfile) {
      return `${diseaseProfile.summary} ${diseaseProfile.rationale}`;
    }
    if (/(muscular dystrophy)/.test(text) && !DM1_CUE.test(text) && !/(duchenne|dmd|facioscapulohumeral|fshd)/.test(text)) {
      return "muscular dystrophy is still a disease-family cue, not a precise mechanism call. the biology is too broad to jump straight to one conjugate class without knowing the subtype, target, or whether the intervention is really rna-directed.";
    }
    if (/(facioscapulohumeral|fshd)/.test(text)) {
      return "this is a named neuromuscular disease rather than a broad family prompt. the biology still needs sharper mechanism resolution, but sequence-directed oligo and delivery-handle logic are more plausible provisional routes than classical released-warhead platforms.";
    }
    if (/(myasthenia|gravis|autoimmune|complement|b cell|t cell|immune)/.test(text)) {
      return "this reads more like immune biology than classical oncology payload delivery, so mechanism-matched selectivity matters more than default cytotoxic playbooks.";
    }
    if (DM1_CUE.test(text)) {
      return "this disease cue points toward toxic-rna and splice-biology, which usually means the real question is sequence-directed rescue and productive intracellular routing rather than free-warhead release.";
    }
    if (/(duchenne|dmd|muscular dystrophy|exon skipping|splice switching|antisense|sirna|aso|pmo)/.test(text)) {
      return "this disease cue points toward gene modulation biology, which usually means the real question is rna mechanism and productive intracellular routing rather than free-warhead release.";
    }
    if (/(prostate|psma|radionuclide|radioligand|lu-177|ac-225|y-90)/.test(text)) {
      return "this reads like localization biology plus isotope physics, so target retention and organ exposure matter more than classical intracellular payload release.";
    }
    if (/(cancer|tumou?r|carcinoma|lymphoma|solid tumor|metastatic)/.test(text)) {
      return "this still reads like oncology biology, so target separation, internalization, and what active species reaches the tumor are likely the core biology gates.";
    }
    return "the disease biology still looks broad, so the safest read is to focus on what mechanism the construct must achieve before overcommitting to one chemistry style.";
  })();

  const normalizedTargetLabel = normalizedCase.target?.canonical ?? state.target?.trim() ?? "";
  const hasMeaningfulTarget =
    Boolean(normalizedTargetLabel) &&
    !/^(conjugate|conjugates|possible|best|what|which|why|show|give)\b/i.test(normalizedTargetLabel.trim());
  const targetRead = hasMeaningfulTarget
    ? `${normalizedTargetLabel} is the working biological entry point right now. the big question is whether it is truly disease-relevant, accessible where the construct needs it, and usable without creating a worse normal-tissue problem.`
    : diseaseProfile
      ? `this is still a disease-level read, not a target-conditioned one. the biology already supports ${diseaseProfile.plausibleDirections.join(", ")} as higher-level directions, but the missing piece is the actual entry handle, target, or transport route that would make one construct class responsibly lead.`
      : "this is still a disease-level prompt with no real target or entry handle yet. until that entry point is clear, chemistry choices will look more confident than they deserve.";

  const diseaseSources = biologySources.filter((source) =>
    /biology review|biology paper|clinical context/.test(source.type ?? ""),
  ).slice(0, 3);

  const targetSources = biologySources.filter((source) =>
    /target biology|biology paper|biology review/.test(source.type ?? ""),
  ).slice(0, 3);

  const deliverySources = biologySources.filter((source) =>
    /biology paper|biology review|clinical context/.test(source.type ?? ""),
  ).slice(0, 3);

  const unknownSources = biologySources.filter((source) =>
    /biology review|target biology/.test(source.type ?? ""),
  ).slice(0, 2);

  return [
    {
      title: "disease mechanism",
      body: diseaseRead,
      sources: diseaseSources,
    },
    {
      title: hasMeaningfulTarget ? "target biology" : "entry handle / target gap",
      body: targetRead,
      sources: targetSources,
    },
    {
      title: "delivery + active species biology",
      body: top
        ? `${biologyFit} ${deliveryFit} ${releaseFit}`.trim()
        : diseaseProfile
          ? `${diseaseProfile.summary} at disease level, ${diseaseProfile.plausibleDirections.join(", ")} now look more plausible than classical released-warhead logic. the remaining unknown is which entry handle, trafficking route, or target logic can turn that into a responsible conjugate strategy.`
          : "the delivery and active-species logic are still unresolved. until the subtype, target, or therapeutic mechanism is clearer, the safest read is to keep multiple biological routes open instead of forcing one modality winner.",
      sources: deliverySources,
    },
    {
      title: "biggest biology unknown",
      body: diseaseProfile
        ? `${diseaseLevelOnly ? "the main unresolved biology issue is target-conditioning and delivery execution" : "the main unresolved biology issue is delivery execution"}: the disease mechanism is more legible than the actual construct entry point, trafficking route, and translational handle.`
        : `the main unresolved biology issue right now is ${weakestCell.category}: ${weakestCell.reason}`,
      sources: unknownSources,
    },
  ];
}

function validateBiologySections(
  prompt: string,
  state: PlannerState,
  sections: BiologySection[],
  sources: EvidenceSource[],
): BiologyValidationPass[] {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.idea ?? ""} ${state.goal ?? ""}`);
  const diseaseText = sections.find((section) => section.title === "disease mechanism")?.body.toLowerCase() ?? "";
  const targetText = sections.find((section) => section.title === "target biology")?.body.toLowerCase() ?? "";

  const diseaseAligned =
    ((OLIGO_DISEASE_CUE.test(text)) &&
      /(gene modulation|rna|splice|intracellular routing)/.test(diseaseText)) ||
    (/(myasthenia|gravis|autoimmune|immune|complement|b cell|t cell)/.test(text) &&
      /(immune|autoimmune|mechanism-matched)/.test(diseaseText)) ||
    (/(radionuclide|radioligand|lu-177|actinium|ac-225|y-90|psma)/.test(text) &&
      /(isotope|radi|localization|organ exposure)/.test(diseaseText)) ||
    (/(cancer|tumou?r|carcinoma|lymphoma|solid tumor|metastatic)/.test(text) &&
      /(oncology|tumor|active species)/.test(diseaseText)) ||
    !/(duchenne|dmd|muscular dystrophy|myotonic dystrophy|dm1|myasthenia|gravis|autoimmune|immune|radionuclide|radioligand|lu-177|actinium|ac-225|y-90|psma|cancer|tumou?r|carcinoma|lymphoma|solid tumor|metastatic)/.test(text);

  const hasMeaningfulTarget = Boolean(state.target) && !/^(conjugate|conjugates)\b/i.test((state.target ?? "").trim());
  const targetSupported =
    hasMeaningfulTarget &&
    targetText.includes((state.target ?? "").split(/\s+/)[0].toLowerCase()) &&
    sources.some((source) => (source.type ?? "") === "target biology");

  const sourceSupported =
    sources.length >= 2 &&
    sources.some((source) => /biology review|biology paper/.test(source.type ?? ""));

  return [
    {
      name: "disease-mechanism alignment",
      passed: diseaseAligned,
      note: diseaseAligned
        ? "the disease read matches the dominant biology cues in the prompt."
        : "the disease read had to stay softer because the mechanism cues were mixed or thin.",
    },
    {
      name: "target-context support",
      passed: targetSupported,
      note: targetSupported
        ? "the target biology is anchored well enough to the current target context."
        : "the target view is still soft because there is no real target context yet or the support is too thin.",
    },
    {
      name: "biology source support sanity",
      passed: sourceSupported,
      note: sourceSupported
        ? "the biology view has enough direct disease or target support to show normally."
        : "biology evidence is still thin, so the biology panel should be read as provisional.",
    },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      state?: PlannerState;
      previousResult?: PreviousPlannerResult;
      responseMode?: ResponseMode;
    };

    const prompt = body.prompt?.trim() ?? "";
    const state = body.state ?? {};
    const previousResult = body.previousResult ?? null;
    const responseFlow = buildResponseFlow(body.responseMode, prompt, state, previousResult);

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const followUpIntent = detectFollowUpIntent(prompt, previousResult);
    if (followUpIntent && previousResult) {
      return NextResponse.json({
        ...buildFollowUpResponse(prompt, previousResult),
        responseFlow,
      });
    }

    const contextualRefinement = detectContextualRefinement(prompt, previousResult);
    const effectivePrompt = contextualRefinement?.mergedPrompt ?? prompt;

    const parsedQuery = parseConjugateQuery(effectivePrompt, state);
    if (parsedQuery.questionType === "modality explainer") {
      const explainerModality = detectExplainerModality(parsedQuery, effectivePrompt);
      if (explainerModality) {
        return NextResponse.json(buildModalityExplainerResponse(explainerModality, responseFlow));
      }
    }
    const normalizedCase = normalizeConjugateCase(parsedQuery, state);
    const biologyTopic = buildBiologyTopic(effectivePrompt, state, normalizedCase);
    const topic = buildTopic(effectivePrompt, state);
    const diseaseProfile = normalizedCase.disease?.canonical
      ? DISEASE_MECHANISM_PROFILES[normalizedCase.disease.canonical]
      : undefined;

    const diseaseBiologyQueries =
      normalizedCase.disease?.canonical && normalizedCase.diseaseSpecificity === "specific"
        ? buildDiseaseBiologyQueries(normalizedCase).slice(0, 6)
        : [];

    const [diseaseBiologyResults, biologyLiterature, biologyReviews, broadClinicalTrials, literatureResults] = await Promise.all([
      Promise.all(
        diseaseBiologyQueries.map(async (item) => {
          try {
            const [europePmc, pubmed] = await Promise.all([
              searchEuropePmc(item.query, 3).catch(() => ({
                ...emptyEuropePmcResult(item.query, 3),
              })),
              searchPubMedDiseaseBiology(item.query, 3).catch(() => ({
                ...emptyPubMedDiseaseBiologyResult(item.query, 3),
              })),
            ]);
            const combinedCount = europePmc.results.length + pubmed.results.length;
            return {
              ...item,
              europePmc,
              pubmed,
              requestStatus: (combinedCount ? "ok" : "empty") as "ok" | "empty",
            };
          } catch {
            return {
              ...item,
              europePmc: emptyEuropePmcResult(item.query, 3),
              pubmed: emptyPubMedDiseaseBiologyResult(item.query, 3),
              requestStatus: "error" as const,
            };
          }
        }),
      ),
      searchEuropePmc(biologyTopic, 5).catch(() => emptyEuropePmcResult(biologyTopic, 5)),
      searchPubMedReviews(biologyTopic, 5).catch(() => []),
      searchClinicalTrials(biologyTopic).catch(() => []),
      Promise.all(
      MODALITY_ORDER.map(async (modality) => {
        const query = `${topic} AND (${MODALITY_QUERIES[modality].join(" OR ")})`;
        try {
          const europePmc = await searchEuropePmc(query);
          return { modality, europePmc };
        } catch {
          return { modality, europePmc: emptyEuropePmcResult(query) };
        }
      }),
      ),
    ]);

    const literatureSignals = MODALITY_ORDER.map((modality) => {
      const literature = literatureResults.find((item) => item.modality === modality)?.europePmc;
      const literatureBoost = literature ? computeLiteratureBoost(topic, literature.results) : 0;
      return {
        modality,
        literatureStrength: literatureBoost,
        hitCount: literature?.hitCount ?? 0,
        literature: literature ?? emptyEuropePmcResult(topic),
      };
    });

    const retrievalSourceBuckets = buildRetrievalSourceBuckets(
      diseaseBiologyResults,
      biologyLiterature,
      biologyReviews,
      broadClinicalTrials,
      literatureSignals,
    );
    const evidenceObjects = buildEvidenceObjects(normalizedCase, retrievalSourceBuckets);
    const legacyGrounding = buildDiseaseGrounding(normalizedCase, [
      ...biologyLiterature.results,
      ...biologyReviews.map((item) => ({ title: item.title })),
      ...broadClinicalTrials.map((trial) => ({
        title: trial.briefTitle,
        condition: trial.condition,
        intervention: trial.intervention,
      })),
    ]);
    const mechanismInference = inferMechanismFromEvidence(
      normalizedCase,
      evidenceObjects,
      legacyGrounding ?? groundingFromProfile(diseaseProfile),
    );
    const groundedCase =
      normalizedCase.mechanismClass === "unknown" && mechanismInference.mechanismClass !== "unknown"
        ? {
            ...normalizedCase,
            mechanismClass: mechanismInference.mechanismClass,
            unknowns: normalizedCase.unknowns.filter((item) => item !== "mechanism class is still unclear"),
          }
        : normalizedCase;

    const biologicalAbstraction = deriveBiologicalAbstraction(
      groundedCase,
      evidenceObjects,
      mechanismInference,
    );
    const exploration = buildDiseaseExploration(groundedCase, {
      abstraction: biologicalAbstraction,
      mechanismInference,
      evidenceObjects,
    });
    const conflict = analyzeConflictSignals(groundedCase, {
      abstraction: biologicalAbstraction,
      mechanismInference,
      exploration,
    });

    const gates = evaluateMechanisticGates(groundedCase, {
      evidenceObjects,
      mechanismInference,
      abstraction: biologicalAbstraction,
    });
    let scored = scoreModalities(groundedCase, gates, literatureSignals, {
      evidenceObjects,
      mechanismInference,
      abstraction: biologicalAbstraction,
    });

    let matrix = scored.map((item) => ({
      modality: item.modality,
      total: Number(item.total.toFixed(1)),
      cells: item.components.map((component) => ({
        category: component.category,
        score: Number(component.weighted.toFixed(1)),
        reason: `${component.rationale} raw ${component.raw}, weight ${component.weight}.`,
      })),
    }));

    let rawRanking = scored.map((item, index) => ({
      rank: index + 1,
      ...OPTION_MAP[item.modality as (typeof MODALITY_ORDER)[number]],
      limitReason: buildLimitReason(
        item.modality as (typeof MODALITY_ORDER)[number],
        prompt,
        state,
        OPTION_MAP[item.modality as (typeof MODALITY_ORDER)[number]].limitReason,
      ),
    }));

    let enrichedRanking = enrichRankingWithMatrix(rawRanking, matrix, scored);
    let ranking = enrichedRanking;
    let top = ranking[0];
    const precedentPlaybook = selectOncologyPrecedentPlaybook(groundedCase, prompt, top?.name as (typeof MODALITY_ORDER)[number] | undefined);
    const oligoPrecedentAnchors = selectOligoPrecedentAnchors(
      groundedCase,
      prompt,
      biologicalAbstraction,
      top?.name as (typeof MODALITY_ORDER)[number] | undefined,
    );
    if (precedentPlaybook) {
      scored = scoreModalities(groundedCase, gates, literatureSignals, {
        evidenceObjects,
        mechanismInference,
        abstraction: biologicalAbstraction,
        precedentPlaybook,
      });
      matrix = scored.map((item) => ({
        modality: item.modality,
        total: Number(item.total.toFixed(1)),
        cells: item.components.map((component) => ({
          category: component.category,
          score: Number(component.weighted.toFixed(1)),
          reason: `${component.rationale} raw ${component.raw}, weight ${component.weight}.`,
        })),
      }));
      rawRanking = scored.map((item, index) => ({
        rank: index + 1,
        ...OPTION_MAP[item.modality as (typeof MODALITY_ORDER)[number]],
        limitReason: buildLimitReason(
          item.modality as (typeof MODALITY_ORDER)[number],
          prompt,
          state,
          OPTION_MAP[item.modality as (typeof MODALITY_ORDER)[number]].limitReason,
        ),
      }));
      enrichedRanking = enrichRankingWithMatrix(rawRanking, matrix, scored);
      ranking = enrichedRanking;
      top = ranking[0];
    }
    const viabilityBuckets = buildViabilityBuckets(ranking, matrix);
    const topLiterature = literatureSignals.find((item) => item.modality === top.name)?.literature ?? emptyEuropePmcResult(topic);
    const pubmed = await searchPubMedReviews(`${topic} ${MODALITY_QUERIES[top.name as (typeof MODALITY_ORDER)[number]]?.[0] ?? ""}`).catch(
      () => [],
    );
    const clinicalTrials = await searchClinicalTrials(
      `${topic} ${MODALITY_QUERIES[top.name as (typeof MODALITY_ORDER)[number]]?.[0] ?? ""}`,
    ).catch(() => broadClinicalTrials);
    const literatureSources = buildSources(top.name as (typeof MODALITY_ORDER)[number], topLiterature, pubmed);
    const precedentSources = buildPrecedentSources(
      top.name as (typeof MODALITY_ORDER)[number],
      prompt,
      state,
      clinicalTrials,
      precedentPlaybook,
      oligoPrecedentAnchors,
    );
    const whyNot = buildWhyNotResults(scored).filter(
      (item) => !viabilityBuckets.feasibleNames.some((name) => name.toLowerCase().trim() === item.modality.toLowerCase().trim()),
    );
    const provisionalSources = [...precedentSources, ...literatureSources].slice(0, 6);
    const confidence = assessConfidence(groundedCase, scored, provisionalSources, {
      sourceBuckets: retrievalSourceBuckets,
      evidenceObjects,
      mechanismInference,
      abstraction: biologicalAbstraction,
      conflict,
      precedentPlaybook,
    });
    const modalityViability = buildModalityViabilityRows(ranking, confidence, groundedCase);
    const visibleGrounding = mechanismInference.source === "none" ? null : mechanismInference;
    const visibleGroundingThemes = formatThemeList(visibleGrounding?.themes ?? []);
    const usingDiseaseSpecificAbstention = Boolean(
      confidence.abstain &&
        groundedCase.diseaseSpecificity !== "family" &&
        mechanismInference.source === "evidence" &&
        mechanismInference.themes.length,
    );
    const usingGenericAbstention = Boolean(confidence.abstain && !usingDiseaseSpecificAbstention);
    const conflictSummary = conflict.present ? `${conflict.summary} ${conflict.whyItMatters}` : "";
    const conflictClarifier = conflict.present && conflict.clarifier
      ? `the one clarifier that would resolve this fastest is: ${conflict.clarifier}`
      : "";
    const explorationLabelSummary = exploration?.strategyBuckets.length
      ? exploration.strategyBuckets.map((bucket) => bucket.label).join(", ")
      : "";
    const explorationUnderstandingSummary = exploration?.understandingSignals?.length
      ? ` what the planner could confidently pull out so far: ${exploration.understandingSignals.join("; ")}.`
      : "";
    const diseaseOnlyLeadSummary = exploration?.diseaseFrame
      ? `${exploration.diseaseFrame}${explorationUnderstandingSummary}${visibleGroundingThemes ? ` grounded themes: ${visibleGroundingThemes}.` : ""}${explorationLabelSummary ? ` the most plausible strategy lanes right now are ${explorationLabelSummary}.` : ""}`
      : visibleGrounding
        ? `${visibleGrounding.summary}${visibleGroundingThemes ? ` grounded themes: ${visibleGroundingThemes}.` : ""}`
        : diseaseProfile
          ? `${diseaseProfile.summary}`
          : "the prompt names a disease and supports disease-level exploratory reasoning, even though the construct choice is still open.";
    const validationPasses: ValidationPass[] = [
      {
        name: "query interpretation",
        passed: Boolean(parsedQuery.diseaseMention || parsedQuery.targetMention || parsedQuery.mechanismHints.length),
        note: parsedQuery.diseaseMention || parsedQuery.targetMention || parsedQuery.mechanismHints.length
          ? "the parser found enough biological structure to build a case."
          : "the parser found only a thin case, so the answer should stay softer.",
      },
      {
        name: "mechanistic gating",
        passed: !gates.find((gate) => gate.modality === scored[0]?.modality && gate.status !== "allowed"),
        note: !gates.find((gate) => gate.modality === scored[0]?.modality && gate.status !== "allowed")
          ? "the winning modality survived the hard mechanistic gates cleanly."
          : "the top-ranked modality still carries a mechanistic penalty, so confidence is reduced.",
      },
      {
        name: "evidence sufficiency",
        passed: confidence.level === "high" || confidence.level === "medium",
        note:
          confidence.level === "high" || confidence.level === "medium"
            ? "the current evidence surface is strong enough for a provisional ranking."
            : "the evidence surface is still thin, so the answer should not pretend to be more certain than it is.",
      },
    ];
    const finalRanking = confidence.abstain ? [] : ranking;
    const finalTop = confidence.abstain ? undefined : finalRanking[0];
    const riskMove = finalTop
      ? buildRiskAndMove(finalTop.name as (typeof MODALITY_ORDER)[number])
      : { biggestRisk: "", firstMove: "", nextSteps: [] as string[] };
    const constructGuidance = buildConstructGuidance(
      effectivePrompt,
      parsedQuery,
      groundedCase,
      biologicalAbstraction,
      riskMove,
      finalTop,
      precedentPlaybook,
    );
    const biologySources = buildBiologySources(state, biologyLiterature, biologyReviews, clinicalTrials);
    const sources = confidence.abstain
      ? biologySources
          .filter((source) => (source.type ?? "") !== "target biology" && (source.type ?? "") !== "clinical context")
          .slice(0, 4)
      : provisionalSources;
    const strategyTable = buildStrategyTableRows(
      groundedCase,
      biologicalAbstraction,
      confidence,
      exploration,
      constructGuidance,
      finalRanking,
      confidence.abstain ? [] : matrix,
      precedentPlaybook,
    );
    const recommendation = confidence.abstain
      ? {
          text: [
            "direct answer",
            buildDirectAnswerParagraph(groundedCase, biologicalAbstraction, confidence, ranking[0], exploration),
            "",
            "biological rationale",
            diseaseOnlyLeadSummary,
            "",
            "best current strategy",
            ranking[0]
              ? `provisional best exploratory lane: ${ranking[0].name}. best format: ${defaultFormatForModality(ranking[0].name)}. payload / active species: ${defaultPayloadOrActiveSpecies(ranking[0].name, biologicalAbstraction)}. delivery logic: ${defaultLinkerOrDeliveryLogic(ranking[0].name, biologicalAbstraction)}. why it fits: ${ranking[0].fitReason} what would make it fail: ${ranking[0].mainReasonAgainst ?? ranking[0].limitReason}`
              : "no provisional exploratory lane is responsible yet.",
            "",
            "modality viability",
            ...modalityViability.map(
              (row) =>
                `- ${row.modality}: ${row.status}. reason: ${row.reason} missing evidence: ${row.missingEvidence} what would upgrade it: ${row.upgradeEvidence}`,
            ),
            "",
            "starting construct suggestions",
            ...strategyTable.map(
              (row) =>
                `- ${row.strategy}: format ${row.bestFormat}; payload ${row.payloadOrActiveSpecies}; delivery logic ${row.linkerOrDeliveryLogic}; first failure mode ${row.riskOrFailureMode}`,
            ),
            "",
            "key experiments",
            ...buildDefaultExperimentList(groundedCase, biologicalAbstraction, ranking[0]).map((item) => `- ${item}`),
            "",
            "best clarifier",
            exploration?.mostInformativeClarifier ?? buildMainMissingEvidence(groundedCase, biologicalAbstraction, ranking[0], exploration),
          ].join("\n"),
        }
      : buildRecommendationText(
          prompt,
          parsedQuery,
          groundedCase,
          biologicalAbstraction,
          finalTop!,
          finalRanking,
          matrix,
          riskMove,
          sources,
          precedentPlaybook,
          oligoPrecedentAnchors,
        );
    const topCardWhy = confidence.abstain
      ? normalizedCase.diseaseSpecificity === "family"
        ? "not enough mechanism, target, or trafficking biology is defined yet to choose a responsible winner. this should stay disease-level and provisional until the subtype, target, or active mechanism is clearer."
        : `${conflictSummary ? `${conflictSummary} ` : ""}${diseaseOnlyLeadSummary}${conflictClarifier ? ` ${conflictClarifier}` : ""} there still is not enough target, trafficking, or construct-level specificity to name a responsible final winner yet.`
      : `${conflictSummary ? `${conflictSummary} ` : ""}${buildTopPickWhy(finalTop!, validationPasses, precedentPlaybook, oligoPrecedentAnchors)} ${conflictClarifier ? `${conflictClarifier} ` : ""}${groundedCase.recommendationScope === "disease-level" ? "this is still a disease-level read, not a target-conditioned construct call." : ""}`.trim();
    const presentation = buildPresentationSummary(
      parsedQuery,
      groundedCase,
      biologicalAbstraction,
      confidence,
      finalTop,
      finalRanking,
      topCardWhy,
      riskMove,
      exploration,
      constructGuidance,
      viabilityBuckets,
      precedentPlaybook,
    );
    const evidenceAnchors = buildEvidenceAnchors(
      sources,
      retrievalSourceBuckets,
      precedentPlaybook,
      oligoPrecedentAnchors,
    );
    const uncertainties = buildUncertaintyList(groundedCase, confidence, conflict, exploration);
    const innovativeIdeas = buildInnovativeIdeas(
      prompt,
      state,
      groundedCase,
      biologicalAbstraction,
      confidence,
      exploration,
      finalRanking,
      matrix,
      evidenceAnchors,
    );
    const rankingPreview = buildRankingPreviewRows(
      groundedCase,
      confidence,
      confidence.abstain ? ranking : finalRanking,
      matrix,
      exploration,
    );
    const uiContract = buildUiContract(
      presentation,
      strategyTable,
      rankingPreview,
      innovativeIdeas,
      evidenceAnchors,
      viabilityBuckets,
    );
    const biology = buildBiologySections(
      prompt,
      state,
      groundedCase,
      finalTop,
      confidence.abstain ? [] : matrix,
      biologySources,
      visibleGrounding,
    );
    const depthModules = buildDepthModules(
      responseFlow.effectiveMode,
      prompt,
      groundedCase,
      biologicalAbstraction,
      exploration,
      finalTop,
      constructGuidance,
      biology,
      uncertainties,
      innovativeIdeas,
    );
    const biologyValidationPasses = validateBiologySections(prompt, state, biology, biologySources);
    const abstentionPrefix = confidence.abstain
      ? `confidence\n${confidence.level}\n\nimportant note\nbiology is still too underdefined for a fully confident recommendation. the system is intentionally abstaining from a responsible winner and treating any ranking below as provisional only.\n\n`
      : `confidence\n${confidence.level}\n\nscope\nthis is a ${normalizedCase.recommendationScope} recommendation, so target-specific logic may still move the ranking.\n\n`;
    const trace: PipelineTrace = {
      parser: parsedQuery,
      normalization: {
        disease: groundedCase.disease,
        target: groundedCase.target,
        modalityIntent: groundedCase.modalityIntent,
        payloadIntent: groundedCase.payloadIntent,
        linkerIntent: groundedCase.linkerIntent,
        mechanismClass: groundedCase.mechanismClass,
        diseaseArea: groundedCase.diseaseArea,
        diseaseSpecificity: groundedCase.diseaseSpecificity,
        recommendationScope: groundedCase.recommendationScope,
        unknowns: groundedCase.unknowns,
      },
      grounding: {
        namedDiseaseRecognized: Boolean(groundedCase.disease?.canonical && groundedCase.diseaseSpecificity === "specific"),
        groundingObjectPresent: mechanismInference.source !== "none",
        groundingThemes: visibleGrounding?.themes ?? [],
        inferredMechanismFamily: visibleGrounding?.mechanismClass,
        groundingSource: mechanismInference.source,
        influencedMechanism: Boolean(mechanismInference.source !== "none" && normalizedCase.mechanismClass !== groundedCase.mechanismClass),
        influencedGates: Boolean(mechanismInference.source !== "none"),
        influencedScoring: Boolean(mechanismInference.source !== "none"),
        influencedConfidence: Boolean(mechanismInference.source !== "none"),
        genericAbstentionTemplateUsed: usingGenericAbstention,
        diseaseSpecificAbstentionTemplateUsed: usingDiseaseSpecificAbstention,
        fallbackReason: usingGenericAbstention
          ? groundedCase.diseaseSpecificity === "family"
            ? "generic abstention was used because the prompt still resolved as a disease-family query."
            : "generic abstention was used because evidence retrieval did not produce a strong enough disease-level mechanism read."
          : undefined,
      },
      abstraction: biologicalAbstraction,
      exploration: exploration ?? undefined,
      conflict,
      precedentPlaybook: precedentPlaybook ?? undefined,
      oligoPrecedentAnchors: oligoPrecedentAnchors ?? undefined,
      retrieval: {
        sourceBuckets: retrievalSourceBuckets,
        evidenceObjects,
        themeCounts: buildThemeCounts(evidenceObjects),
        diseaseBiologyDebug: diseaseBiologyResults.map((item) => ({
          concept: item.concept,
          variant: item.variant,
          query: item.query,
          hitCount: item.europePmc.hitCount + item.pubmed.hitCount,
          requestStatus: item.requestStatus,
          searches: [
            {
              source: "europepmc",
              endpoint: item.europePmc.endpoint,
              requestUrl: item.europePmc.requestUrl,
              httpStatus: item.europePmc.httpStatus,
              adapterStatus: item.europePmc.results.length ? "ok" : "empty",
              preFilterHitCount: item.europePmc.hitCount,
              postFilterHitCount: item.europePmc.results.length,
            },
            {
              source: "pubmed",
              endpoint: item.pubmed.endpoint,
              requestUrl: item.pubmed.requestUrl,
              httpStatus: item.pubmed.httpStatus,
              adapterStatus: item.pubmed.results.length ? "ok" : "empty",
              preFilterHitCount: item.pubmed.hitCount,
              postFilterHitCount: item.pubmed.results.length,
            },
          ],
          hits: [
            ...item.europePmc.results.slice(0, 2).map((result) => ({
              label: result.title || "disease biology literature hit",
              snippet: `europe pmc · ${result.authorString || result.journalTitle || result.pubYear || ""}`.trim(),
            })),
            ...item.pubmed.results.slice(0, 2).map((result) => ({
              label: result.title || "pubmed disease biology hit",
              snippet: `pubmed · ${result.pubdate || ""}`.trim(),
            })),
          ],
        })),
        themeDiagnostics: buildThemeDiagnostics(groundedCase, retrievalSourceBuckets, evidenceObjects),
      },
      gates,
      scores: scored,
      whyNot,
      confidence,
      unknownBiology: {
        insufficient: confidence.abstain,
        reasons: groundedCase.unknowns,
      },
    };

    const contextualFollowUpAnswer = contextualRefinement
      ? {
          kind: "contextual-refinement" as const,
          title: `keeping ${contextualRefinement.contextLabel} as the context`,
          answer: `i kept ${contextualRefinement.contextLabel} as the context and re-ran the planner around ${contextualRefinement.requestedFocus}. this is a refinement of the last answer, not a brand-new disease guess.`,
          bullets: [
            `same context: ${contextualRefinement.contextLabel}`,
            `new requested focus: ${contextualRefinement.requestedFocus}`,
          ],
          usedPreviousResult: true,
        }
      : undefined;
    const conversationSlots: ConversationSlots = {
      disease:
        groundedCase.disease?.canonical ??
        groundedCase.disease?.raw ??
        undefined,
      target:
        groundedCase.target?.canonical ??
        groundedCase.target?.raw ??
        undefined,
      topic,
      topModality: finalTop?.name ?? ranking[0]?.name ?? undefined,
      activeLane:
        exploration?.strategyBuckets?.[0]?.label ??
        undefined,
      questionFrame:
        presentation.mode === "concept-explainer"
          ? "concept"
          : presentation.mode === "recommended-starting-point"
            ? "construct"
            : groundedCase.recommendationScope === "target-conditioned"
              ? "target-conditioned"
              : "disease-level",
      therapeuticIntent: biologicalAbstraction.therapeuticIntent,
      pendingClarifier:
        presentation.mode === "best-current-strategy-direction"
          ? presentation.bestClarifier
          : presentation.mode === "concept-explainer"
            ? presentation.bestClarifier
            : undefined,
    };
    const presentationVariant = buildPresentationVariant(
      presentation,
      contextualFollowUpAnswer,
      strategyTable,
    );
    const documentSections = buildDocumentSections(
      prompt,
      presentation,
      topCardWhy,
      exploration,
      finalTop,
      finalRanking,
      constructGuidance,
      strategyTable,
      uncertainties,
      contextualFollowUpAnswer,
    );
    const documentText = buildDocumentText(documentSections);

    return NextResponse.json({
      topPick: confidence.abstain ? "under-specified" : finalTop?.name ?? "under-specified",
      topPickWhy: topCardWhy,
      biggestRisk: confidence.abstain ? "" : riskMove.biggestRisk,
      firstMove: confidence.abstain ? "" : riskMove.firstMove,
      nextSteps: confidence.abstain ? [] : riskMove.nextSteps,
      ranking: finalRanking,
      matrix: confidence.abstain ? [] : matrix,
      sources,
      presentation,
      constructBlueprint: constructGuidance
        ? {
            conditional: constructGuidance.conditional,
            explicitlyRequested: constructGuidance.explicitlyRequested,
            format: constructGuidance.format,
            linker: constructGuidance.linker,
            payload: constructGuidance.payload,
            constraints: constructGuidance.constraints,
            precedentNote: constructGuidance.precedentNote,
            tradeoff: constructGuidance.tradeoff,
          }
        : undefined,
      evidenceAnchors,
      uncertainties,
      sectionOrder: buildSectionOrder(presentationVariant),
      presentationVariant,
      documentSections,
      text: `${abstentionPrefix}${documentText || recommendation.text}`,
      summary: confidence.abstain
        ? usingDiseaseSpecificAbstention && visibleGrounding
          ? `${conflictSummary ? `${conflictSummary} ` : ""}${diseaseOnlyLeadSummary} ranking is still withheld because the target, entry handle, and construct logic are not yet specific enough.`
          : "the current prompt resolves to an abstaining disease-level read, not a target-conditioned construct decision."
        : `${conflictSummary ? `${conflictSummary} ` : ""}${finalTop?.summary ?? ""}`.trim(),
      topic,
      validationPasses,
      innovativeIdeas,
      modalityViability,
      strategyTable,
      rankingPreview,
      uiContract,
      viabilityBuckets,
      conversationSlots,
      followUpAnswer: contextualFollowUpAnswer,
      suggestedFollowUps: buildSuggestedFollowUps(groundedCase, finalTop ?? ranking[0]),
      responseFlow,
      depthModules,
      biology,
      biologyValidationPasses,
      confidence,
      exploration,
      trace,
    });
  } catch {
    return NextResponse.json(
      { error: "design research failed" },
      { status: 502 },
    );
  }
}
