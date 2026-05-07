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
  DiseaseExplorationStrategyBucket,
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
      mode: "parameter-framework";
      title: string;
      status: string;
      confidence: string;
      rationale: string;
      bestClarifier: string;
      mainMissingEvidence?: string;
      parameterBuckets: string[];
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
    | "parameter-framework"
    | "design-decision"
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
    | "pkpd-pressures"
    | "trafficking-bottlenecks"
    | "experimental-tradeoffs"
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
  if (requestedMode === "deep" || requestedMode === "max-depth") return "deep";
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
    effectiveMode === "deep"
        ? [
            "parsing the brief",
            "checking biology and delivery fit",
            "stress-testing trafficking and exposure",
            "building visuals, source anchors, and design tradeoffs",
            "ranking plausible strategies",
            "assembling the deep answer",
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
  | { kind: "parameter-framework" }
  | { kind: "design-decision" }
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
  return /^(that|this|it|this disease|that disease|the disease|same disease|this case|that case|the case|the answer|the last answer|that more clearly|this more clearly|more clearly|that part|this part|will work best|work best|works best|best option|best one|give me|show me|tell me|one paragraph|final recommendation|final design recommendation|safest provisional strategy)$/.test(cleaned);
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

function getReferenceTargetLabel(state: PlannerState, normalizedCase?: NormalizedCase) {
  const rawTarget = cleanTopic(
    normalizedCase?.target?.canonical ??
      normalizedCase?.target?.raw ??
      state.target ??
      "",
  );
  if (!rawTarget) return null;
  const firstToken = rawTarget.split(/\s+/)[0];
  if (!firstToken || firstToken.length < 2) return null;
  if (/^(conjugate|conjugates|muscular|dystrophy|cancer|disease)$/i.test(firstToken)) return null;
  if (/\bfor\b/i.test(rawTarget)) return null;
  return firstToken;
}

function buildTargetRepositorySources(state: PlannerState, normalizedCase?: NormalizedCase): EvidenceSource[] {
  const target = getReferenceTargetLabel(state, normalizedCase);
  if (!target) return [];
  const encoded = encodeURIComponent(target);

  return [
    {
      label: `Human Protein Atlas: ${target}`,
      href: `https://www.proteinatlas.org/search/${encoded}`,
      why: "target-biology repository for tissue expression, cell-type expression, pathology expression, and protein localization context.",
      type: "target biology",
    },
    {
      label: `UniProt: ${target}`,
      href: `https://www.uniprot.org/uniprotkb?query=${encoded}`,
      why: "protein-function repository for aliases, domains, subcellular location, variants, and functional annotation.",
      type: "target biology",
    },
    {
      label: `Open Targets: ${target}`,
      href: `https://platform.opentargets.org/search?q=${encoded}`,
      why: "target-disease association repository for genetics, known drugs, pathways, and disease-link evidence.",
      type: "target biology",
    },
    {
      label: `Reactome: ${target}`,
      href: `https://reactome.org/content/query?q=${encoded}`,
      why: "pathway repository for placing the target inside biological pathways and mechanism families.",
      type: "target biology",
    },
    {
      label: `Expression Atlas: ${target}`,
      href: `https://www.ebi.ac.uk/gxa/search?query=${encoded}`,
      why: "expression repository for baseline and experiment-linked RNA expression context.",
      type: "target biology",
    },
    {
      label: `NCBI Gene: ${target}`,
      href: `https://www.ncbi.nlm.nih.gov/gene/?term=${encoded}`,
      why: "gene repository for nomenclature, orthologs, genomic context, and linked literature.",
      type: "target biology",
    },
    {
      label: `OMIM: ${target}`,
      href: `https://www.omim.org/search?index=entry&search=${encoded}`,
      why: "gene-disease repository for inherited disease associations and phenotype context.",
      type: "target biology",
    },
  ];
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
  normalizedCase?: NormalizedCase,
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

  sources.push(...buildTargetRepositorySources(state, normalizedCase).slice(0, 5));

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

function buildLinkerDecisionPrinciples(
  prompt: string,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top?: RankedOption,
) {
  const normalizedPrompt = normalize(`${prompt} ${normalizedCase.prompt}`);
  const modality = normalize(String(top?.name ?? ""));
  const rdcCase = modality === "rdc" || abstraction.therapeuticIntent === "localized radiobiology";
  const oligoCase = modality === "oligo conjugate" || abstraction.therapeuticIntent === "gene/rna modulation";
  const internalizingCase =
    abstraction.internalizationRequirement === "required" ||
    /(internaliz|lysosom|endosom|cathepsin|protease|payload release|adc|pdc|smdc)/.test(normalizedPrompt);
  const bystanderNeed = /(bystander|heterogen|target[- ]low|payload diffusion|nearby cells)/.test(normalizedPrompt);
  const microenvironmentCue =
    /(microenvironment|hypoxi|acidic|low ph|protease|cathepsin|cathapsin|legumain|stroma|fibrosis|necrosis|immune infiltrate)/.test(normalizedPrompt) ||
    Boolean(abstraction.microenvironmentPressures?.length);
  const hydrophobicityCue = /(hydrophobic|aggregation|dar|high dar|vcp|val[- ]?cit|peg|solubility|clearance)/.test(normalizedPrompt);
  const prematureCleavageCue = /(premature|plasma instability|serum instability|cleavage before|deconjugation|off[- ]target release)/.test(normalizedPrompt);

  if (rdcCase) {
    return [
      "for radioconjugates, the linker decision is mostly chelator stability, spacer distance, charge, renal/hepatic clearance, target retention, and isotope half-life fit rather than free-drug cleavage.",
      "do not add a cleavable drug-release motif unless radiolocalization is not the actual therapeutic engine.",
      "first assays: serum metal stability, transchelation, biodistribution, tumor-to-organ dosimetry, and retained target binding after chelator-spacer attachment.",
    ];
  }

  if (oligoCase) {
    return [
      "for oligo conjugates, default to handle-preserving stable attachment unless the carrier must be released to recover hybridization, RISC/RNase-H access, splice activity, or nuclear/cytosolic trafficking.",
      "cleavable disulfide, enzyme-cleavable, or self-immolative designs are conditional tools, not defaults; they must improve productive intracellular activity over a stable comparator.",
      "first assays: serum stability, active oligo integrity, uptake, endosomal escape, nuclear/cytosolic delivery, target knockdown/splice correction, and whether the linker blocks hybridization or trafficking.",
    ];
  }

  return [
    internalizingCase
      ? "if the payload needs intracellular release, pick the linker from the actual trafficking route: uptake, endosome, lysosome, cathepsin/legumain exposure, carrier catabolism, and active payload escape."
      : "if the biology is extracellular, retention-driven, or immune-modulatory, prioritize plasma stability and target engagement before adding cleavage complexity.",
    bystanderNeed
      ? "if bystander activity is required, a cleavable linker plus membrane-permeable released payload becomes more attractive, but only if normal-tissue release and systemic exposure stay controlled."
      : "if bystander activity is not required, non-cleavable or more stable tuned-cleavable logic can reduce premature free-payload exposure.",
    microenvironmentCue
      ? "microenvironment triggers such as proteases, acidic pH, hypoxia, stroma, necrosis, and immune infiltrates should be treated as measured release gates, not assumed selectivity."
      : "do not assume the microenvironment will rescue release; measure whether the target-bearing cell and tissue context actually provide the trigger.",
    hydrophobicityCue
      ? "if linker-payload hydrophobicity, high DAR, or VCP-like payload burden hurts PK/solubility, consider PEG or polar spacers, site-specific loading, lower DAR, or payload-masking designs before blaming the target."
      : "watch linker-payload polarity, steric bulk, and DAR because they can change binding, aggregation, clearance, internalization, and payload potency.",
    prematureCleavageCue
      ? "if premature cleavage appears, compare more stable peptide sequences, sterically shielded or exosite-aware designs, tandem cleavage sites, self-immolative spacers, or a non-cleavable comparator."
      : "always benchmark against serum/plasma stability and normal-cell processing so a clever cleavable linker does not create off-target release.",
  ];
}

function buildLinkerDecisionBody(
  prompt: string,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top?: RankedOption,
) {
  return buildLinkerDecisionPrinciples(prompt, normalizedCase, abstraction, top).join(" ");
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
  const proteinFormatCue =
    /(what protein|which protein|protein format|protein scaffold|what binder|which binder|what carrier|which carrier|what antibody|which antibody|nanobody|vhh|scfv|fab\b|f\(ab|igg|kappa|lambda|fc\b|minibody|half antibody|sip\b|small immunoprotein|affibody|adnectin|anticalin|darpin|knottin|abdurin|bispecific|trispecific|multispecific|tandem scfv|igg-scfv|igg-dab|scfv-fc-scfv|kih|kappa-lambda|cyclic peptide)/.test(normalizedPrompt);
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
    proteinFormatCue ||
    /(what would you build|what should i build|what linker|which linker|what payload|which payload|what format|which format|what protein|which protein|what binder|which binder|what carrier|which carrier|what antibody|which antibody|what nanobody|which nanobody|what scfv|which scfv|what fab|which fab|what vhh|which vhh)/.test(
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
  const formatRequested = parsedQuery.questionType === "targeting format" || proteinFormatCue || /(what format|which format|antibody format|binder format|delivery format|what protein|which protein|what binder|which binder|what carrier|which carrier|what antibody|which antibody|what nanobody|which nanobody|what scfv|which scfv|what fab|which fab|what vhh|which vhh)/.test(normalizedPrompt);
  const linkerRequested = parsedQuery.questionType === "linker strategy" || /(what linker|which linker)/.test(normalizedPrompt);
  const payloadRequested = parsedQuery.questionType === "payload strategy" || /(what payload|which payload)/.test(normalizedPrompt);
  const proteinCarrierRequested = proteinFormatCue;
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
      : proteinCarrierRequested && abstraction.deliveryAccessibility === "barrier-limited"
        ? "compact shuttle-guided protein carrier"
        : proteinCarrierRequested
          ? "compact protein-guided oligo carrier"
          : conditional
            ? "delivery-handle-led oligo format"
            : "oligo-first delivery format";
    formatBody =
      spliceOligoCase && muscleDeliveryContext
        ? "start from a splice-switching oligo format that preserves pmo or aso activity, then pressure-test peptide-conjugated pmo, antibody/fab-oligo, or receptor-mediated muscle-delivery handles around that active cargo."
        : proteinCarrierRequested && abstraction.deliveryAccessibility === "barrier-limited"
          ? "if the question is specifically which protein carrier to use in a barrier-limited setting, start with a compact shuttle-guided protein format such as a vhh, scfv, fab, or other small binder fused to a validated brain-entry or receptor-mediated transport handle, rather than defaulting straight to a full igg."
          : proteinCarrierRequested
            ? "if the question is specifically which protein carrier to use, start with a compact protein-guided carrier such as a vhh, scfv, fab, or other smaller binder before escalating to a full igg, because trafficking and productive uptake matter more than raw carrier size here."
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
  } else if (proteinCarrierRequested && abstraction.deliveryAccessibility === "barrier-limited") {
    formatTitle = "compact shuttle-guided protein carrier";
    formatBody =
      "if the question is specifically which protein carrier to use in a barrier-limited cns setting, start by comparing vhh, scfv, and fab-style binders paired with a believable brain-entry or receptor-mediated transport handle, rather than defaulting straight to a full igg.";
    linkerTitle = "handle-preserving protein attachment";
    linkerBody =
      "keep the attachment chemistry simple and position-aware so the transport handle and the payload-facing biology both survive binding, uptake, and trafficking.";
    if (abstraction.cytotoxicFit === "discouraged") {
      payloadTitle = "non-cytotoxic active species";
      payloadBody =
        "in a chronic barrier-limited setting, the payload should usually stay non-cytotoxic unless there is an explicit cell-ablation hypothesis that truly fits the disease.";
    }
  } else if (proteinCarrierRequested) {
    formatTitle = "compact protein carrier first";
    formatBody =
      "if the question is specifically which protein carrier to use, start by comparing vhh, scfv, and fab-style binders before escalating to a full igg, because trafficking, tissue penetration, and productive uptake often matter more than maximum carrier size.";
    linkerTitle = "handle-preserving protein attachment";
    linkerBody =
      "keep the attachment chemistry simple and position-aware so the carrier still binds, internalizes, and tolerates the payload load after conjugation.";
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

  if (linkerRequested) {
    const detailedLinkerBody = buildLinkerDecisionBody(prompt, normalizedCase, abstraction, top);
    linkerBody = `${linkerBody} ${detailedLinkerBody}`.replace(/\s+/g, " ").trim();
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
    ...(abstraction.cellProcessingGates ?? []).slice(0, 2),
    ...(abstraction.microenvironmentPressures ?? []).slice(0, 2),
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
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  precedentPlaybook?: OncologyPrecedentPlaybook | null,
  chemistryDirection?: ConstructBlueprintField | null,
) {
  if (isBroadFormatComparatorPrompt(parsedQuery.cleanedPrompt)) {
    return [
      "this is a format-comparison question, not a request to crown the first modality mentioned.",
      "start with monospecific monoclonal or full IgG logic only when one selective internalizing target and payload mechanism are already strong.",
      "move to bispecific or multispecific formats when dual binding improves tumor-normal discrimination, retention, or shuttle-plus-target delivery.",
      "use smaller carriers such as VHH/nanobody, scFv, Fab, F(ab')2, or minibody when access, penetration, or modularity matter more than maximum half-life.",
      "enzyme conjugate, masked/probody, immune-engager, degrader, molecular-glue, or other newer modality logic should stay conditional until the biology shows the special mechanism is actually needed.",
    ]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (!top || !constructGuidance) return "";

  if (parsedQuery.questionType === "linker strategy") {
    const linkerDirection = constructGuidance.linker?.title ?? "the linker still needs to stay conditional";
    const linkerPrinciples = buildLinkerDecisionPrinciples(
      parsedQuery.cleanedPrompt,
      normalizedCase,
      abstraction,
      top,
    );
    if (precedentPlaybook?.modality === "adc" && /cleavable/i.test(linkerDirection)) {
      const comparatorClause = precedentPlaybook.comparatorProduct
        ? `use ${precedentPlaybook.comparatorProduct.label} as the non-cleavable comparator if you want to test whether freer release or bystander behavior is actually earning its keep.`
        : "";
      return [
        `${linkerDirection} is the best current linker direction.`,
        ...linkerPrinciples.slice(0, 4),
        `hydrazone-style acid-labile logic should stay a deliberate exception, because acidic microenvironment release is often noisier than measured lysosomal or enzyme-gated release.`,
        comparatorClause,
      ]
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }

    if (abstraction.mechanismLocation === "extracellular") {
      return `${linkerDirection} is the best current linker direction. because the biology looks more extracellular, the linker should prioritize stability and target engagement over clever cleavage unless the active mechanism truly needs release. ${linkerPrinciples.join(" ")}`.replace(/\s+/g, " ").trim();
    }

    const linkerReason = constructGuidance.linker?.body ?? "the linker should follow the active-species logic and release route.";
    return `${linkerDirection} is the best current linker direction. ${linkerReason} ${linkerPrinciples.join(" ")}`.replace(/\s+/g, " ").trim();
  }

  if (parsedQuery.questionType === "payload strategy") {
    const payloadDirection = constructGuidance.payload?.title ?? "the payload still needs to stay conditional";
    const payloadReason = constructGuidance.payload?.body ?? "the payload should follow the therapeutic mechanism.";
    return `${payloadDirection} is the best current payload direction. start there because ${payloadReason.charAt(0).toLowerCase()}${payloadReason.slice(1)}`.replace(/\s+/g, " ").trim();
  }

  if (parsedQuery.questionType === "targeting format") {
    const formatDirection = constructGuidance.format?.title ?? "the format still needs to stay conditional";
    const formatReason = constructGuidance.format?.body ?? "the carrier format should preserve the biology that is doing the real work.";
    if (/(what protein|which protein|what binder|which binder|what carrier|which carrier|what antibody|which antibody|what nanobody|which nanobody|what scfv|which scfv|what fab|which fab|what vhh|which vhh)/i.test(parsedQuery.cleanedPrompt)) {
      return `${formatDirection} is the best current protein-carrier direction. start there because ${formatReason.charAt(0).toLowerCase()}${formatReason.slice(1)}`.replace(/\s+/g, " ").trim();
    }
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
    return `compare the proposed linker against a stability-first comparator and, when relevant, a non-cleavable comparator. run plasma/serum stability, disease-cell internalization, subcellular trafficking, trigger-specific cleavage, released-active-species potency, normal-cell processing, and PK/clearance assays in the same decision package.`;
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
  if (isBroadFormatComparatorPrompt(parsedQuery.cleanedPrompt)) return "format";
  if (parsedQuery.questionType === "linker strategy") return "linker";
  if (parsedQuery.questionType === "payload strategy") return "payload";
  if (parsedQuery.questionType === "targeting format") return "format";
  if (parsedQuery.questionType === "chemistry strategy") return "chemistry";
  return "class";
}

function isBroadFormatComparatorPrompt(prompt: string) {
  const normalizedPrompt = normalize(prompt);
  const hasComparatorCue = /\b(compare|versus|vs|should i use|which format|what format|monoclonal|monospecific|bispecific|trispecific|multispecific)\b/.test(
    normalizedPrompt,
  );
  const formatFamilies = [
    /\bfull igg\b|\bigg\b|\bfc\b|\bfc[- ]?fusion\b/,
    /\bfab\b|\bf\(ab\)|\bf\(ab'\)2\b|\bminibody\b/,
    /\bscfv\b|\bvhh\b|\bnanobody\b/,
    /\bmonoclonal\b|\bmonospecific\b|\bbispecific\b|\btrispecific\b|\bmultispecific\b/,
    /\benzyme conjugate\b|\benzyme format\b|\bcatalytic\b|\bprodrug\b/,
    /\bprobody\b|\bmasked\b|\bconditionall?y activated\b|\bimmune engager\b|\bdegrader\b|\bmolecular glue\b|\bnewer modalit|\binnovative modalit/,
  ];
  const hits = formatFamilies.filter((pattern) => pattern.test(normalizedPrompt)).length;
  return hasComparatorCue && hits >= 2;
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
  const requestedBuildDimension =
    Boolean(top) &&
    (
      isBroadFormatComparatorPrompt(parsedQuery.cleanedPrompt) ||
      (
        constructGuidance?.explicitlyRequested &&
        (
          parsedQuery.questionType === "targeting format" ||
          parsedQuery.questionType === "linker strategy" ||
          parsedQuery.questionType === "payload strategy" ||
          parsedQuery.questionType === "chemistry strategy" ||
          parsedQuery.questionType === "build blueprint"
        )
      )
    );

  if (parsedQuery.questionType === "parameter framework") {
    return {
      mode: "parameter-framework",
      title: "parameter framework",
      status: "checklist mode — optimize the biology before over-optimizing the chemistry",
      confidence: confidence.level,
      rationale: buildParameterFrameworkRationale(normalizedCase, abstraction, exploration, top),
      bestClarifier:
        exploration?.mostInformativeClarifier ??
        "what target, entry handle, or delivery route do you actually want to lock first?",
      mainMissingEvidence: buildMainMissingEvidence(normalizedCase, abstraction, top, exploration),
      parameterBuckets: buildParameterBuckets(normalizedCase, abstraction),
    };
  }

  if (parsedQuery.questionType === "biology strategy") {
    return {
      mode: "parameter-framework",
      title: "biology strategy map",
      status: "biology-first mode — translate disease and antigen biology into exploitable conjugate mechanisms",
      confidence: confidence.level,
      rationale: buildBiologyStrategyRationale(normalizedCase, abstraction, exploration, top),
      bestClarifier:
        normalizedCase.target?.canonical || normalizedCase.target?.raw
          ? "which mechanism do you want to exploit first: internalization, local release, immune modulation, degradation, radiolocalization, or gene/RNA modulation?"
          : "which target, antigen, cell type, or disease-driving pathway should the biology map focus on first?",
      mainMissingEvidence: buildMainMissingEvidence(normalizedCase, abstraction, top, exploration),
      parameterBuckets: buildBiologyStrategyBuckets(normalizedCase, abstraction),
    };
  }

  if ((confidence.abstain || !top || targetConditionedNeedsComparison) && !requestedBuildDimension) {
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
        : "exploration mode — no final recommendation yet";
    const exploratoryClarifier =
      targetConditionedNeedsComparison
        ? constructGuidance?.explicitlyRequested
          ? "which build choice do you want to collapse first: format, linker, payload, or entry handle?"
          : "which disease setting, payload logic, or internalization assumption should lead this target-conditioned case?"
        : normalizedCase.broadOncologyNoTarget
          ? buildOncologyTargetClarifier(normalizedCase)
          : isCnsNeurodegenerationCase(normalizedCase, abstraction)
            ? buildCnsNeuroClarifier(normalizedCase)
          : isAutoimmuneExplorationCase(normalizedCase, abstraction)
            ? buildAutoimmuneClarifier(normalizedCase)
          : exploration?.mostInformativeClarifier ?? "what single target, mechanism, or entry handle do you actually want to leverage?";
    const exploratoryRationale =
      targetConditionedNeedsComparison
        ? [
            `${normalizedCase.target?.canonical ?? normalizedCase.target?.raw ?? "this target"} is a real target-conditioned handle, but the disease setting, payload logic, and internalization story are still too partial to collapse the answer into one recommendation card yet.`,
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
        normalizedCase.broadOncologyNoTarget
          ? buildOncologyDominantConstraints(normalizedCase)
          : isCnsNeurodegenerationCase(normalizedCase, abstraction)
            ? buildCnsNeuroDominantConstraints(normalizedCase)
          : isAutoimmuneExplorationCase(normalizedCase, abstraction)
            ? buildAutoimmuneDominantConstraints(normalizedCase)
          : exploration?.dominantConstraints ??
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

  const targetCandidate =
    normalizedCase.target?.canonical ??
    normalizedCase.target?.raw ??
    "";
  const targetOrEntryHandle =
    !looksLikePlaceholderTargetLabel(targetCandidate)
      ? targetCandidate
      : normalizedCase.disease?.canonical ??
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
  const broadFormatComparison = isBroadFormatComparatorPrompt(parsedQuery.cleanedPrompt);
  const focusedRequestedDimensionAnswer = buildFocusedRequestedDimensionAnswer(
    parsedQuery,
    normalizedCase,
    abstraction,
    top,
    constructGuidance,
    precedentPlaybook,
    recommendedChemistry,
  );
  const focusedTitle =
    broadFormatComparison
      ? "format comparison"
      : decisionFocus === "linker"
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
    broadFormatComparison
      ? "target/payload-gated format comparison"
      : decisionFocus === "linker"
      ? recommendedLinker || top?.name || "conditional linker direction"
      : decisionFocus === "payload"
        ? recommendedPayload || top?.name || "conditional payload direction"
        : decisionFocus === "format"
          ? recommendedFormat || top?.name || "conditional format direction"
          : decisionFocus === "chemistry"
            ? recommendedChemistry?.title || top?.name || "conditional chemistry direction"
            : viabilityBuckets.noStrongClassYet
              ? `least-bad option right now: ${top?.name ?? "still conditional"}`
              : viabilityBuckets.leadStrength === "provisional"
                ? `weak lead: ${top?.name ?? "still conditional"}`
                : top?.name ?? "still conditional";

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

const PLANNER_TERMINAL_WORD_REPAIRS = [
  "format",
  "construct",
  "biology",
  "payload",
  "linker",
  "chemistry",
  "internalization",
  "exposure",
  "delivery",
  "mechanism",
  "comparator",
  "toxicity",
  "antibody",
  "scaffold",
  "receptor",
  "intracellular",
  "therapeutic",
  "validation",
  "experiment",
  "trafficking",
  "endosomal",
  "release",
  "tolerability",
] as const;

function repairTruncatedTerminalWord(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned || /[.!?…]$/.test(cleaned)) return cleaned;
  const parts = cleaned.split(" ");
  const last = parts.at(-1) ?? "";
  if (last.length < 4) return cleaned;

  const repaired = PLANNER_TERMINAL_WORD_REPAIRS.find(
    (candidate) =>
      candidate.startsWith(last.toLowerCase()) &&
      candidate.length > last.length &&
      candidate.length - last.length <= 4,
  );

  if (!repaired) return cleaned;
  parts[parts.length - 1] = repaired;
  return parts.join(" ");
}

function completeSentence(text: string) {
  const cleaned = repairTruncatedTerminalWord(text);
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
  if (isUnprofiledNamedDisease(normalizedCase)) {
    return "disease-specific biology grounding is missing: validated target, cell type, pathway, compartment, expression window, and mechanism evidence";
  }

  if (normalizedCase.broadOncologyNoTarget) {
    return "a named tumor antigen with expression separation, accessibility, internalization or retention, and payload sensitivity";
  }

  if (isCnsNeurodegenerationCase(normalizedCase, abstraction)) {
    return "a named CNS entry route plus a disease-driving biology choice such as protein clearance, lysosomal/autophagy rescue, mitochondrial support, neuroinflammation control, or gene/RNA modulation";
  }

  if (isAutoimmuneExplorationCase(normalizedCase, abstraction)) {
    return "a named immune mechanism such as pathogenic IgG, FcRn recycling, complement injury, B/plasma-cell contribution, antigen-specific tolerance, or tissue-functional rescue";
  }

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

function getOncologyTargetShortlist(normalizedCase: NormalizedCase) {
  const diseaseLabel = (
    normalizedCase.disease?.canonical ??
    normalizedCase.disease?.raw ??
    ""
  ).toLowerCase();
  const explicitTargetLabel = getExplicitTargetLabel(normalizedCase);

  if (isUnprofiledNamedDisease(normalizedCase)) {
    return [
      explicitTargetLabel,
      "disease-specific surface antigens from literature or omics",
      "lineage or cell-state markers with normal-tissue separation",
      "internalizing receptors validated in the disease compartment",
      "microenvironment or stromal-localized handles",
      "retained targets suitable for radioligand or local activation logic",
    ].filter(Boolean) as string[];
  }

  if (explicitTargetLabel) {
    return [
      explicitTargetLabel,
      "disease-specific comparator antigens",
      "same-pathway or resistance-context targets",
      "normal-tissue safety comparators",
      "payload-compatible internalizing or retained alternatives",
    ];
  }

  return [
    "disease-enriched surface antigens found from current evidence",
    "internalizing or payload-processing receptors",
    "retained localization handles for radioligand or local-activation logic",
    "microenvironment or stromal-localized handles",
    "normal-tissue safety comparators",
  ];
}

function getExplicitTargetLabel(normalizedCase: NormalizedCase) {
  const targetLabel = normalizedCase.target?.canonical ?? normalizedCase.target?.raw ?? "";
  const cleaned = cleanTopic(targetLabel);
  if (!cleaned) return "";
  if (/^(target|antigen|target antigen|conjugate|conjugates|possible|best|what|which)$/i.test(cleaned)) return "";
  return cleaned;
}

function isUnprofiledNamedDisease(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "";
  if (!diseaseLabel) return false;
  const normalizedDisease = normalize(diseaseLabel);
  if (!normalizedDisease) return false;
  if (/^(cancer|solid tumor|tumor|tumour|carcinoma|lymphoma|autoimmune disease|neuromuscular disease|metabolic disease|rare disease)$/.test(normalizedDisease)) {
    return false;
  }
  const hasCuratedProfile = Boolean(
    DISEASE_MECHANISM_PROFILES[diseaseLabel] ??
      DISEASE_MECHANISM_PROFILES[normalizedDisease],
  );
  return !hasCuratedProfile && normalizedCase.disease?.confidence === "low";
}

function hasExplicitBiologyOrDesignOverride(normalizedCase: NormalizedCase) {
  const prompt = normalize(normalizedCase.parsed.cleanedPrompt);
  return Boolean(
    getExplicitTargetLabel(normalizedCase) ||
      normalizedCase.modalityIntent?.canonical ||
      normalizedCase.payloadIntent?.canonical ||
      normalizedCase.linkerIntent?.canonical ||
      normalizedCase.parsed.mechanismHints.length ||
      normalizedCase.explicitPeptideSupport ||
      normalizedCase.explicitLigandSupport ||
      /\b(amplified|amplification|mutant|mutation|variant|subtype|refractory|relapsed|resistant|metastatic|localized|early-stage|late-stage|internalizing|non-internalizing|bystander|bispecific|multispecific|probody|masked|degrader|glue|enzyme|radioligand|oligo|sirna|aso|pmo|transcript|pathway|payload|linker|shuttle|transport|csf|intrathecal|bbb)\b/.test(prompt),
  );
}

function buildProfileUseNote(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this disease";
  const hasProfile =
    Boolean(normalizedCase.disease?.canonical && DISEASE_MECHANISM_PROFILES[normalizedCase.disease.canonical]) ||
    Boolean(normalizedCase.disease?.raw && DISEASE_MECHANISM_PROFILES[normalize(normalizedCase.disease.raw)]);
  if (!hasProfile) return "";
  if (hasExplicitBiologyOrDesignOverride(normalizedCase)) {
    return `profile use: ${diseaseLabel} metadata is only starter context; the explicit target, mechanism, payload, modality, route, or subtype in this prompt overrides the profile.`;
  }
  return `profile use: ${diseaseLabel} metadata is a starting map, not a saved response; the answer still has to be generated from the current prompt and evidence.`;
}

function isHematologicOncologyCase(normalizedCase: NormalizedCase) {
  const diseaseLabel = (
    normalizedCase.disease?.canonical ??
    normalizedCase.disease?.raw ??
    ""
  ).toLowerCase();
  return /\b(hodgkin|lymphoma|leukemia|myeloma|aml|cll|dlbcl|b-cell|t-cell)\b/.test(diseaseLabel);
}

function buildOncologyTargetClarifier(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this cancer";
  if (isUnprofiledNamedDisease(normalizedCase)) {
    return `what disease-specific biology should we ground first for ${diseaseLabel}: surface antigen, disease-driving pathway, cell type, immune context, or delivery compartment?`;
  }
  const shortlist = getOncologyTargetShortlist(normalizedCase);
  return `which ${diseaseLabel} target should we evaluate first: ${shortlist.slice(0, 5).join(", ")}, or another antigen?`;
}

function buildOncologyDominantConstraints(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "the tumor";
  if (isUnprofiledNamedDisease(normalizedCase)) {
    return [
      `${diseaseLabel} was named by the user, so the planner must ground this disease directly instead of borrowing antigen lists from another disease`,
      "first ground the biology from current literature, disease subtype, cell-of-origin, surfaceome, omics, pathology, or clinical precedent",
      "only rank ADC/PDC/SMDC/RDC/oligo/enzyme logic after a real target, entry handle, pathway, or localization mechanism is identified",
      "separate disease-specific evidence from analogy evidence so a familiar modality does not masquerade as proof",
      "map normal-tissue expression and high-exposure organ risk before naming a payload or format",
      "if evidence is thin, the correct output is a discovery plan and clarifier, not a confident conjugate recommendation",
    ];
  }
  if (isHematologicOncologyCase(normalizedCase)) {
    return [
      `${diseaseLabel} is hematology-first: antigen expression on malignant and normal immune cells decides the therapeutic window`,
      "target density, lineage restriction, internalization or retention, and circulating versus nodal exposure decide class fit",
      "marrow, lymphoid, infection, cytokine, and repeat-treatment safety need earlier pressure-testing than epithelial tumor assumptions",
      "payload sensitivity and bystander need should be tested in target-high, target-low, and target-negative hematologic models",
      "immune-microenvironment biology can be as important as direct tumor-cell killing",
      "no final winner should be named until target and payload mechanism are specified",
    ];
  }
  return [
    `${diseaseLabel} is target-first: antigen choice decides the construct class more than the cancer label alone`,
    "tumor-normal expression separation and high-exposure normal tissues decide therapeutic window",
    "internalization, retention, shedding, and antigen heterogeneity decide ADC/PDC/SMDC/RDC fit",
    "payload sensitivity and bystander need should be matched to tumor heterogeneity and microenvironment",
    "normal GI, liver, marrow, and on-target/off-tumor risk need early safety pressure-testing",
    "no final winner should be named until the target and payload logic are specified",
  ];
}

function isCnsNeurodegenerationCase(
  normalizedCase: NormalizedCase,
  abstraction?: BiologicalAbstraction,
) {
  const diseaseLabel = normalize(
    [
      normalizedCase.disease?.canonical,
      normalizedCase.disease?.raw,
      normalizedCase.parsed.diseaseMention,
      normalizedCase.prompt,
    ]
      .filter(Boolean)
      .join(" "),
  );
  const cnsDiseaseCue =
    /(parkinson|alzheimer|huntington|als|amyotrophic|frontotemporal|ftd|dementia|tauopathy|synuclein|neurodegeneration|neurodegenerative|dopaminergic|cns|brain)/.test(diseaseLabel);
  const cnsBiologyCue =
    abstraction?.deliveryAccessibility === "barrier-limited" ||
    abstraction?.pathologyType === "neurodegeneration" ||
    abstraction?.therapeuticIntent === "gene/rna modulation" ||
    normalizedCase.diseaseArea === "neuromuscular";

  return (
    normalizedCase.diseaseArea !== "oncology" &&
    normalizedCase.mechanismClass !== "cytotoxic delivery" &&
    (cnsDiseaseCue || (normalizedCase.diseaseArea === "other" && cnsBiologyCue))
  );
}

function getCnsNeurobiologyShortlist(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalize(
    `${normalizedCase.disease?.canonical ?? ""} ${normalizedCase.disease?.raw ?? ""} ${normalizedCase.prompt}`,
  );

  if (/parkinson/.test(diseaseLabel)) {
    return [
      "alpha-synuclein / proteostasis",
      "LRRK2 or GBA-linked lysosomal-autophagy biology",
      "mitochondrial stress and mitophagy support",
      "neuroinflammation / glial modulation",
      "dopaminergic-neuron vulnerability",
      "BBB, receptor-mediated transport, or CSF delivery route",
    ];
  }

  if (/alzheimer|dementia|tau/.test(diseaseLabel)) {
    return [
      "amyloid / tau burden",
      "microglial inflammation",
      "synaptic or neuronal support",
      "lysosomal-autophagy and proteostasis",
      "BBB, receptor-mediated transport, or CSF delivery route",
    ];
  }

  if (/huntington|htt/.test(diseaseLabel)) {
    return [
      "HTT lowering or transcript modulation",
      "striatal-neuron delivery",
      "protein aggregation / proteostasis",
      "neuroinflammation",
      "BBB, receptor-mediated transport, or CSF delivery route",
    ];
  }

  if (/\bals\b|amyotrophic/.test(diseaseLabel)) {
    return [
      "motor-neuron vulnerability",
      "SOD1 / C9orf72 / TDP-43 biology where relevant",
      "neuroinflammation and glial support",
      "axon / neuromuscular-junction exposure",
      "BBB, blood-spinal-cord-barrier, or intrathecal route",
    ];
  }

  return [
    "pathogenic protein burden",
    "gene/RNA modulation",
    "lysosomal-autophagy and proteostasis",
    "mitochondrial stress",
    "neuroinflammation / glial biology",
    "BBB, receptor-mediated transport, or CSF delivery route",
  ];
}

function buildCnsNeuroClarifier(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this neurodegenerative disease";
  const shortlist = getCnsNeurobiologyShortlist(normalizedCase).slice(0, 6);
  return `which ${diseaseLabel} biology should we exploit first: ${shortlist.join(", ")}?`;
}

function buildCnsNeuroDominantConstraints(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "the disease";
  return [
    `${diseaseLabel} should be biology-first: the target must connect to a disease-driving process, not only bind a CNS cell`,
    "BBB, CSF, or local delivery route decides whether any conjugate can reach the right tissue",
    "productive intracellular delivery matters for oligos, protein-clearance, lysosomal, and mitochondrial strategies",
    "chronic dosing means tolerability, accumulation, immunogenicity, and receptor desensitization matter early",
    "classical cytotoxic payload logic is usually a poor default unless the user explicitly wants selective cell ablation",
    "cell-type context matters: neurons, microglia, astrocytes, endothelium, and peripheral immune cells create different conjugate designs",
  ];
}

function buildCnsNeuroDirectAnswer(
  normalizedCase: NormalizedCase,
  presentation?: Extract<PresentationSummary, { mode: "best-current-strategy-direction" }>,
) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this neurodegenerative disease";
  return `${diseaseLabel} is not a “pick an ADC target” problem by default. the useful starting point is to choose the disease biology first, then match a delivery route and conjugate class to that biology. right now the most plausible lanes are BBB/CSF-enabled oligo or gene-modulation delivery, neuroprotective compact biologic or peptide delivery, mitochondrial/proteostasis support, and neuron- or glia-biased delivery. no final winner is responsible until one biology choice and one CNS entry route are named.`;
}

function isAutoimmuneExplorationCase(
  normalizedCase: NormalizedCase,
  abstraction?: BiologicalAbstraction,
) {
  const diseaseLabel = normalize(
    [
      normalizedCase.disease?.canonical,
      normalizedCase.disease?.raw,
      normalizedCase.parsed.diseaseMention,
      normalizedCase.prompt,
    ]
      .filter(Boolean)
      .join(" "),
  );
  const autoimmuneCue =
    /(myasthenia|myastheenia|gravis|autoimmune|lupus|sle|rheumatoid|arthritis|pemphigus|cidp|neuromyelitis|autoantibody|fcrn|complement|achr|acetylcholine|musk|lrp4|b cell|plasma cell)/.test(diseaseLabel);

  return (
    normalizedCase.diseaseArea === "autoimmune" ||
    abstraction?.pathologyType === "autoimmune/inflammatory" ||
    autoimmuneCue
  ) && normalizedCase.diseaseArea !== "oncology";
}

function getAutoimmuneMechanismShortlist(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalize(
    `${normalizedCase.disease?.canonical ?? ""} ${normalizedCase.disease?.raw ?? ""} ${normalizedCase.prompt}`,
  );

  if (/myasthenia|myastheenia|gravis/.test(diseaseLabel)) {
    return [
      "pathogenic IgG / autoantibody burden",
      "FcRn-mediated IgG recycling",
      "AChR, MuSK, or LRP4 autoantigen biology",
      "complement-mediated neuromuscular-junction injury",
      "B-cell or plasma-cell contribution",
      "neuromuscular-junction functional rescue",
    ];
  }

  return [
    "pathogenic IgG / autoantibody burden",
    "FcRn-mediated IgG recycling",
    "complement-mediated tissue injury",
    "B-cell or plasma-cell contribution",
    "antigen-specific immune tolerance",
    "local tissue protection or functional rescue",
  ];
}

function buildAutoimmuneClarifier(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this autoimmune disease";
  return `which ${diseaseLabel} mechanism should we exploit first: ${getAutoimmuneMechanismShortlist(normalizedCase).slice(0, 6).join(", ")}?`;
}

function buildAutoimmuneDominantConstraints(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "the autoimmune disease";
  return [
    `${diseaseLabel} should be mechanism-first: decide whether pathogenic IgG, FcRn recycling, complement, B/plasma cells, or antigen-specific tolerance is the real lever`,
    "extracellular immune biology is more important than intracellular tumor-style internalization for many autoimmune conjugate ideas",
    "chronic dosing and infection risk make broad cytotoxic payload logic a poor default",
    "selectivity has to come from immune mechanism, tissue localization, antigen specificity, or transient pathway control",
    "functional disease readouts matter more than uptake alone",
    "normal immune function, IgG levels, complement tone, and neuromuscular function need early safety pressure-testing",
  ];
}

function buildAutoimmuneDirectAnswer(normalizedCase: NormalizedCase) {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this autoimmune disease";
  return `${diseaseLabel} is not a classical released-warhead conjugate problem by default. the useful starting point is to decide which immune mechanism the conjugate should exploit: lowering pathogenic IgG, blocking FcRn recycling, intercepting complement injury, modulating B/plasma-cell biology, inducing antigen-specific tolerance, or protecting the affected tissue. cytotoxic ADC-style logic should stay out of the lead set unless the user explicitly wants selective immune-cell depletion.`;
}

function buildParameterBuckets(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
) {
  const buckets = [
    normalizedCase.recommendationScope === "disease-level"
      ? "target or entry-handle definition"
      : "target relevance and access window",
    abstraction.deliveryAccessibility === "barrier-limited"
      ? "brain entry and tissue exposure"
      : "tissue exposure and route fit",
    normalizedCase.needsIntracellularAccess || abstraction.deliveryAccessibility === "intracellular difficult"
      ? "productive trafficking and compartment access"
      : "uptake and mechanism execution",
    "target-bearing cell processing",
    "microenvironment and tissue-context pressure",
    normalizedCase.chronicContext ? "repeat-dose pk / pd and safety window" : "exposure window and tolerability",
    "payload-active species fit",
    "linker and attachment logic",
  ].filter(Boolean) as string[];

  return Array.from(new Set(buckets)).slice(0, 6);
}

function buildParameterFrameworkRationale(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
  top?: RankedOption,
) {
  const diseaseLabel =
    normalizedCase.disease?.canonical ??
    normalizedCase.disease?.raw ??
    "this case";
  const laneLabel =
    exploration?.strategyBuckets?.[0]?.label ??
    top?.name ??
    "the current lead lane";
  const mechanismLabel =
    abstraction.therapeuticIntent ||
    normalizedCase.mechanismClass ||
    "the intended therapeutic mechanism";

  return completeSentence(
    `${diseaseLabel} should be approached as a parameter framework, not as a one-line modality pick. The first job is to lock the therapeutic event, entry handle, target-bearing cell processing, microenvironment pressure, delivery route, trafficking path, and safety window before over-optimizing linker or chemistry details. From the current read, ${laneLabel} is the most useful lane to organize the checklist around, but the decisive parameters are still ${mechanismLabel}, entry-handle quality, and productive exposure in the right compartment.`,
  );
}

function buildBiologyStrategyBuckets(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
) {
  if (isCnsNeurodegenerationCase(normalizedCase, abstraction)) {
    return [
      "disease biology we can exploit",
      "delivery mechanism into CNS tissue",
      "payload mechanism and active compartment",
      "cell type and compartment routing",
      "practical versus speculative strategy lanes",
      "experiments that prove disease modification",
    ];
  }

  const buckets = [
    "disease-driving biology and causal pathway",
    normalizedCase.target?.canonical || normalizedCase.target?.raw
      ? "antigen / target biology and accessibility"
      : "target, antigen, or entry-handle discovery",
    "mechanisms that can be exploited by a conjugate",
    abstraction.deliveryAccessibility === "barrier-limited"
      ? "barrier crossing, tissue exposure, and cell-type access"
      : "tissue exposure, cellular access, and trafficking",
    "target-bearing cell processing and microenvironment pressure",
    "payload mechanism and active compartment",
    "failure modes, biomarkers, and first experiments",
  ];

  return Array.from(new Set(buckets)).slice(0, 6);
}

function buildCnsBiologyStrategySections(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  presentation: Extract<PresentationSummary, { mode: "parameter-framework" }>,
): DocumentSection[] {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this neurodegenerative disease";
  const biologyChoices = getCnsNeurobiologyShortlist(normalizedCase);

  return [
    {
      title: "Direct Answer",
      body: `${diseaseLabel} cannot be responsibly framed as “one conjugate cures the disease” yet. the realistic path is to exploit one disease-driving mechanism at a time, deliver a non-cytotoxic active species into the right CNS compartment, and prove disease-modifying biology with functional readouts. the strongest starting mechanisms are protein/proteostasis control, lysosomal-autophagy rescue, mitochondrial support, neuroinflammation/glial modulation, gene/RNA modulation, and BBB/CSF delivery engineering.`,
      bullets: [
        "best current direction: biology-matched CNS delivery, with BBB/CSF-enabled oligo or pathway-modulating cargo as the most practical first organizing lane.",
        "what would make it curative-like: durable modification of a causal disease driver, not symptomatic dopamine replacement or generic neuroprotection.",
        `main missing evidence: ${presentation.mainMissingEvidence ?? buildMainMissingEvidence(normalizedCase, abstraction)}`,
        `best next choice: ${buildCnsNeuroClarifier(normalizedCase)}`,
      ],
    },
    {
      title: "Biology To Exploit",
      body: "these are the biologic levers a conjugate could try to exploit. none is automatically curative; each needs a matching delivery mechanism and disease-relevant readout.",
      bullets: biologyChoices.map((choice) => {
        if (/alpha-synuclein|protein burden|proteostasis/i.test(choice)) return `${choice}: exploit misfolded-protein burden by lowering SNCA expression, improving clearance, blocking spread, or biasing degradation/proteostasis pathways.`;
        if (/LRRK2|GBA|lysosomal|autophagy/i.test(choice)) return `${choice}: exploit lysosomal/autophagy failure with cargo that reaches lysosomes or cells controlling protein clearance.`;
        if (/mitochondrial|mitophagy/i.test(choice)) return `${choice}: exploit energy stress and mitophagy vulnerability with organelle-aware protective or pathway-modulating payloads.`;
        if (/inflammation|glial|microglial/i.test(choice)) return `${choice}: exploit glial inflammatory state, but avoid broad immune suppression that worsens chronic CNS safety.`;
        if (/dopaminergic|neuron/i.test(choice)) return `${choice}: exploit cell vulnerability only if the handle improves delivery or protection without damaging surviving neurons.`;
        return `${choice}: exploit transport biology because no payload matters if it never reaches the relevant brain tissue and cell compartment.`;
      }),
    },
    {
      title: "Delivery Mechanism Map",
      body: "for Parkinson’s, delivery mechanism is as important as payload mechanism. the construct has to solve brain entry, tissue distribution, cell uptake, and active-compartment access.",
      bullets: [
        "receptor-mediated BBB shuttle: use a transferrin-receptor, insulin-receptor, or other transport handle only if it creates productive brain exposure after transcytosis.",
        "CSF / intrathecal route: useful if systemic BBB crossing is weak, but tissue spread and neuronal/glial uptake still need proof.",
        "compact protein or peptide carrier: VHH, scFv, Fab, peptide, or ligand formats may beat full IgG when penetration and trafficking matter more than half-life.",
        "oligo or RNA cargo delivery: ASO, siRNA, or PMO logic only works if the active strand reaches nuclear or cytosolic machinery in the relevant CNS cells.",
        "organelle or lysosomal routing: useful only when the therapeutic event actually needs lysosomal, mitochondrial, or proteostasis-compartment access.",
      ],
    },
    {
      title: "Mechanism-To-Conjugate Options",
      body: "the conjugate class should be chosen after the mechanism, not before it.",
      bullets: [
        "alpha-synuclein lowering: BBB/CSF-enabled ASO or siRNA conjugate; readout is SNCA lowering plus functional rescue, not uptake alone.",
        "lysosomal/autophagy rescue: compact biologic, peptide, enzyme-like, or small-molecule conjugate routed toward clearance biology; readout is restored clearance and reduced toxic protein stress.",
        "mitochondrial support: SMDC/PDC-style organelle-biased support cargo; readout is mitochondrial function and neuronal stress rescue.",
        "glial inflammation modulation: glia-biased immune/pathway-modulating conjugate; readout is inflammatory-state shift without broad CNS immune toxicity.",
        "neuron protection or replacement support: targeted trophic/pathway payloads are speculative unless delivery to vulnerable dopaminergic neurons is proven.",
        "classical cytotoxic ADC/RDC: usually wrong for disease modification because the goal is preserving neurons, not killing cells.",
      ],
    },
    {
      title: "Practical Versus Speculative",
      body: "this is where the planner should be honest. some possibilities are testable now, while others are exciting but still fragile.",
      bullets: [
        "most practical first: ASO/siRNA-style biology plus a credible CNS route, because target engagement can be measured directly.",
        "practical but hard: BBB shuttle or CSF delivery with compact carrier formats, because exposure and trafficking can be benchmarked against controls.",
        "conditional: lysosomal/autophagy or mitochondrial conjugates, because the mechanism is relevant but compartment-correct delivery is hard.",
        "high-upside speculative: antigen-specific neuron or glia targeting, because selectivity and safety are still difficult.",
        "poor default: cytotoxic payload conjugates, because they conflict with the goal of preserving CNS cells in chronic neurodegeneration.",
      ],
    },
    {
      title: "Experiments That Would Prove It",
      body: "the first experiments should test disease modification, not just beautiful delivery.",
      bullets: [
        "pick one biology first: alpha-synuclein, LRRK2/GBA lysosomal biology, mitochondrial stress, glial inflammation, or CNS transport.",
        "measure CNS exposure by compartment: blood, CSF, brain region, cell type, endosome/lysosome, cytosol, nucleus, or mitochondria.",
        "measure mechanism execution: SNCA knockdown, lysosomal rescue, mitophagy rescue, inflammatory-state shift, or neuronal stress reduction.",
        "compare naked/minimally modified cargo against shuttle-decorated or compact-carrier cargo.",
        "test repeat-dose safety: microglial activation, neuronal stress, immunogenicity, receptor desensitization, and off-tissue exposure.",
        "only call it disease-modifying if functional rescue follows target engagement in disease-relevant models.",
      ],
    },
  ];
}

function buildBiologyStrategyRationale(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
  top?: RankedOption,
) {
  const diseaseLabel =
    normalizedCase.disease?.canonical ??
    normalizedCase.disease?.raw ??
    "this disease";
  const targetLabel =
    normalizedCase.target?.canonical ??
    normalizedCase.target?.raw;
  const mechanismLabel =
    abstraction.therapeuticIntent !== "unknown"
      ? abstraction.therapeuticIntent
      : normalizedCase.mechanismClass !== "unknown"
        ? normalizedCase.mechanismClass
        : "the therapeutic mechanism";
  const firstLane =
    exploration?.strategyBuckets?.[0]?.label ??
    top?.name ??
    "the first plausible biology lane";

  if (isUnprofiledNamedDisease(normalizedCase)) {
    return completeSentence(
      `${diseaseLabel} is being treated as a named but unprofiled disease, so the planner should not transfer a target list or construct playbook from a different disease. The first job is disease-biology grounding: identify the disease-driving cell type, targetable surface or compartment handle, pathway dependency, normal-tissue overlap, delivery route, and payload-compatible mechanism. From the current read, ${firstLane} can stay visible only as a provisional lane until disease-specific evidence makes it rankable.`,
    );
  }

  return completeSentence(
    targetLabel
      ? `${diseaseLabel} with ${targetLabel} should be reasoned from antigen biology first: disease relevance, surface or compartment access, internalization or retention, heterogeneity, normal-tissue expression, and whether ${mechanismLabel} can actually be executed after conjugation. Any curated disease profile should act only as background context here, because the named target or mechanism in the prompt is more specific than the profile. From the current read, ${firstLane} is the most useful lane to pressure-test, but the answer should stay mechanism-gated rather than format-first.`
      : `${diseaseLabel} should be approached by mapping the disease-driving biology before choosing a conjugate class. Curated disease metadata can orient the answer, but it should not behave like a canned response or override newer evidence, subtype details, or user-specified mechanisms. The planner should ask which pathway, cell state, antigen, compartment, or delivery barrier can be exploited, then translate that into payload, carrier, linker, and experiment choices. From the current read, ${firstLane} is the most useful provisional lane, but no final construct should be named until the exploitable biology is sharper.`,
  );
}

function buildParameterFrameworkSections(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
  strategyTable: StrategyTableRow[],
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  top?: RankedOption,
): DocumentSection[] {
  const leadingStrategy = strategyTable[0];
  const experimentBullets = buildDefaultExperimentList(normalizedCase, abstraction, top).slice(0, 6);
  const diseaseMechanism =
    exploration?.diseaseFrame ??
    "the disease mechanism still needs to be translated into a tractable therapeutic event.";
  const biggestGap =
    buildMainMissingEvidence(normalizedCase, abstraction, top, exploration);
  const formatDirection =
    constructGuidance?.format?.title ??
    leadingStrategy?.bestFormat ??
    "format still depends on the target, compartment, and payload logic";
  const linkerDirection =
    constructGuidance?.linker?.title ??
    leadingStrategy?.linkerOrDeliveryLogic ??
    "linker logic should follow the release and trafficking hypothesis";
  const payloadDirection =
    constructGuidance?.payload?.title ??
    leadingStrategy?.payloadOrActiveSpecies ??
    "payload should be matched to the therapeutic event, not chosen in isolation";
  const diseaseProfile =
    normalizedCase.disease?.canonical
      ? DISEASE_MECHANISM_PROFILES[normalizedCase.disease.canonical]
      : undefined;

  return [
    {
      title: "Direct Answer",
      body:
        normalizedCase.parsed.questionType === "biology strategy"
          ? buildBiologyStrategyRationale(normalizedCase, abstraction, exploration, top)
          : buildParameterFrameworkRationale(normalizedCase, abstraction, exploration, top),
      bullets: [
        buildProfileUseNote(normalizedCase),
        diseaseProfile?.summary ? `biology anchor: ${diseaseProfile.summary}` : "",
        `start with this lane: ${leadingStrategy?.strategy ?? exploration?.strategyBuckets?.[0]?.label ?? "still exploratory"}`,
        ...(normalizedCase.parsed.questionType === "biology strategy" && diseaseProfile?.plausibleDirections?.length
          ? diseaseProfile.plausibleDirections.slice(0, 4).map((direction) => `possibility: ${direction}`)
          : []),
        `main missing evidence: ${biggestGap}`,
        `best clarifier: ${exploration?.mostInformativeClarifier ?? "what target, entry handle, or route do you actually want to leverage?"}`,
      ].filter(Boolean),
    },
    {
      title: "Biology Parameters",
      body: "before choosing a carrier or linker, make the biological job explicit so the construct is solving the right problem.",
      bullets: [
        `therapeutic event: ${normalizedCase.mechanismClass !== "unknown" ? normalizedCase.mechanismClass : "still needs to be defined more sharply"}`,
        `disease mechanism read: ${completeSentence(diseaseMechanism)}`,
        normalizedCase.chronicContext
          ? "dosing logic: assume repeat-dosing tolerance matters unless the program proves otherwise"
          : "dosing logic: decide whether the window is acute, chronic, or intermittent before locking the payload",
        abstraction.compartmentNeed === "mixed"
          ? "relevant compartment: map which cells and compartments actually need exposure, because a mixed biology cannot be solved by one generic surface binder"
          : `relevant compartment: ${abstraction.compartmentNeed} biology looks most relevant right now`,
      ].filter(Boolean),
    },
    {
      title: "Target / Entry-Handle Parameters",
      body: "the construct only becomes rankable once the entry handle is real enough to support access, selectivity, and mechanism execution.",
      bullets: [
        normalizedCase.target?.canonical || normalizedCase.target?.raw
          ? `target relevance: confirm that ${normalizedCase.target?.canonical ?? normalizedCase.target?.raw} is disease-relevant in the cells that matter`
          : "target relevance: define the target, receptor, transport handle, or cell-type bias that will actually drive the construct",
        normalizedCase.hasSelectiveSurfaceTarget
          ? "surface access: confirm expression separation and whether the target is truly reachable in the disease tissue"
          : "surface or transport access: do not assume a real entry handle exists until expression, accessibility, or transport biology supports it",
        normalizedCase.targetInternalizationKnown !== "unknown"
          ? `internalization: current read is ${normalizedCase.targetInternalizationKnown}, but productive trafficking still needs to be measured`
          : "internalization: measure whether binding turns into productive uptake and processing, not only surface occupancy",
        abstraction.deliveryAccessibility === "barrier-limited"
          ? "brain-entry route: decide whether you are using receptor-mediated transport, csf dosing, local delivery, or another brain-exposure strategy"
          : "tissue-route fit: make sure the chosen route actually supports the tissues and cell states that matter",
      ].filter(Boolean),
    },
    {
      title: "Exploitable Biology Map",
      body: "translate the disease into mechanisms a conjugate can realistically exploit, then let the mechanism choose the modality rather than forcing a favorite platform.",
      bullets: buildExploitableBiologyBullets(normalizedCase, abstraction, exploration),
    },
    {
      title: "Antigen / Target Biology",
      body: "a target is not automatically a good conjugate antigen. it has to create a usable biological window for the exact payload and compartment.",
      bullets: buildAntigenBiologyBullets(normalizedCase, abstraction),
    },
    {
      title: "Cell Processing And Microenvironment",
      body: "the planner should connect antigen biology to how the target-bearing cell and tissue environment will actually process the construct.",
      bullets: [
        ...(abstraction.cellProcessingGates ?? [
          "target-bearing cell identity and disease state",
          "uptake, recycling, degradation, transcytosis, and active-compartment access",
        ]).slice(0, 4).map((gate) => `cell-processing gate: ${gate}`),
        ...(abstraction.microenvironmentPressures ?? [
          "target density, tissue access, normal-tissue exposure, and repeat-dose safety",
        ]).slice(0, 4).map((pressure) => `microenvironment / pk-pd pressure: ${pressure}`),
        "decision rule: do not let clean binding data alone choose the protein, linker, DAR, payload, or chemistry.",
      ],
    },
    {
      title: "Delivery / Trafficking Parameters",
      body: "delivery is often where good-looking conjugates fail, so treat exposure and intracellular routing as first-order design variables.",
      bullets: [
        abstraction.deliveryAccessibility === "barrier-limited"
          ? "exposure: quantify brain or csf access before claiming the payload or format is the bottleneck"
          : "exposure: quantify tissue access in the real disease compartment before over-optimizing chemistry",
        normalizedCase.needsIntracellularAccess || abstraction.deliveryAccessibility === "intracellular difficult"
          ? "productive intracellular delivery: distinguish total uptake from real delivery into the compartment where the active species has to work"
          : "mechanism execution: make sure the active species reaches the compartment that actually drives efficacy",
        "trafficking route: measure whether the construct goes through a usable processing path or disappears into a dead-end vesicle / lysosomal trap",
        normalizedCase.needsNuclearAccess
          ? "nuclear access: if the mechanism depends on nuclear biology, treat endosomal escape plus nuclear delivery as separate hurdles"
          : "release compartment: choose release logic that matches the compartment where the active species has to be liberated or stay attached",
      ].filter(Boolean),
    },
    {
      title: "Construct Parameters",
      body: "once the biology and route are believable, tune the actual construct around the active species instead of treating format, linker, and chemistry as independent knobs.",
      bullets: [
        `format: ${formatDirection}`,
        `payload / active species: ${payloadDirection}`,
        `linker or delivery logic: ${linkerDirection}`,
        "conjugation chemistry: preserve binding, transport, and active-species function while keeping attachment simple enough to learn from early prototypes",
        "loading / stoichiometry: control payload burden, attachment site, and heterogeneity early enough that pk and activity data stay interpretable",
      ].filter(Boolean),
    },
    {
      title: "Conjugate Mechanism Translation",
      body: "each conjugate class should map to a biological mechanism, not only to a familiar abbreviation.",
      bullets: buildConjugateMechanismTranslationBullets(normalizedCase, abstraction),
    },
    {
      title: "PK / PD, Safety, And Translation Parameters",
      body: "the program has to survive real exposure, repeat dosing, and off-target pressure, not only in vitro binding or uptake.",
      bullets: [
        normalizedCase.chronicContext
          ? "repeat-dose tolerability: watch accumulation, chronic on-target pressure, and changes in uptake or receptor behavior over time"
          : "exposure window: decide what margin is acceptable between efficacy exposure and normal-tissue exposure",
        "off-target burden: identify the tissues most likely to see the construct even if the intended biology does not",
        "immunogenicity and scaffold risk: smaller or engineered carriers can help access but may create new developability tradeoffs",
        "manufacturability / cmc: keep an eye on attachment heterogeneity, stability, and whether the chosen format can actually scale into a real program",
      ],
    },
    {
      title: "Key Experiments",
      body: "the first experiments should collapse the highest-risk assumptions one layer at a time instead of changing five parameters per round.",
      bullets: experimentBullets,
    },
  ];
}

function isProteinFormatQuestion(prompt: string, presentation?: PresentationSummary) {
  const text = normalize(prompt);
  return presentation?.mode === "recommended-starting-point" && presentation.decisionFocus === "format" ||
    /(what protein|which protein|protein format|protein scaffold|binder format|small[- ]format|small format|nanobody|vhh|scfv|fab\b|f\(ab|igg|kappa|lambda|fc\b|minibody|half antibody|sip\b|small immunoprotein|affibody|adnectin|anticalin|darpin|knottin|abdurin|bispecific|trispecific|multispecific|tandem scfv|igg-scfv|igg-dab|scfv-fc-scfv|kih|kappa-lambda|cyclic peptide|affinity|avidity|sparse antigen|sparsely expressed|low antigen|high antigen|heavily expressed|antigen density|antigen location|antigen localization|antigen is everywhere|normal tissue expression|surface antigen|extracellular antigen|secreted antigen|shed antigen|shedding|target[- ]bearing cell|cell type|cell state|internalization biology|interernalization|receptor biology|endocytosis|clathrin|caveolin|macropinocytosis|recycling|degradation|lysosomal|endosomal|transcytosis|microenvironment|hypoxia|acidic|protease|stroma|fibrosis|interstitial pressure|vascular permeability|necrosis|immune microenvironment|tumor microenvironment)/i.test(text);
}

function buildProteinFormatDecisionSections(
  prompt: string,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  presentation?: PresentationSummary,
): DocumentSection[] {
  if (!isProteinFormatQuestion(prompt, presentation)) return [];

  const targetLabel =
    normalizedCase.target?.canonical ?? normalizedCase.target?.raw ?? "the target / entry handle";
  const formatDirection = constructGuidance?.format?.title ?? "format still depends on the biology and route";
  const barrierLimited =
    abstraction.deliveryAccessibility === "barrier-limited" ||
    /brain|cns|bbb|csf|tumor penetration|barrier/i.test(prompt);
  const oncologyCytotoxic =
    abstraction.pathologyType === "oncology" ||
    abstraction.therapeuticIntent === "cytotoxic elimination" ||
    normalizedCase.mechanismClass === "cytotoxic delivery";
  const chronicNonCytotoxic =
    normalizedCase.chronicContext ||
    /autoimmune|neuro|metabolic|fabry|myasthenia|mash|nash|parkinson|alzheimer/i.test(
      `${prompt} ${normalizedCase.disease?.canonical ?? ""}`,
    );
  const promptLower = normalize(prompt);
  const sparseAntigen =
    normalizedCase.targetDensityKnown === "low" ||
    /\b(sparse|sparsely|low|dim|rare)\b.*\b(antigen|target|expression|density)\b|\b(antigen|target)\b.*\b(sparse|sparsely|low|dim|rare)\b/i.test(promptLower);
  const denseAntigen =
    normalizedCase.targetDensityKnown === "high" ||
    /\b(high|dense|heavy|heavily expressed|overexpressed|abundant|uniform|homogeneous)\b.*\b(antigen|target|expression|density)\b|\b(antigen|target)\b.*\b(high|dense|heavy|heavily expressed|overexpressed|abundant|uniform|homogeneous)\b/i.test(promptLower);
  const heterogeneousAntigen =
    normalizedCase.targetDensityKnown === "mixed" ||
    /\b(heterogeneous|mixed|patchy|variable|target-low|antigen-low)\b/i.test(promptLower);
  const broadNormalExpression =
    /\b(everywhere|widely expressed|broadly expressed|normal tissue|normal tissues|essential tissue|on-target off-tumor|on target off tumor)\b/i.test(promptLower);
  const secretedOrShed =
    /\b(secreted|soluble|shed|shedding|extracellular antigen|circulating antigen)\b/i.test(promptLower);
  const surfaceAccessible =
    normalizedCase.hasSelectiveSurfaceTarget ||
    /\b(surface|membrane|cell-surface|extracellular domain|accessible)\b/i.test(promptLower);
  const cellBiologyCue =
    /\b(target[- ]bearing cell|cell type|cell state|disease[- ]state|activation state|internalization biology|interernalization|perceive internalization|receptor biology|endocytosis|endocytic|clathrin|caveolin|macropinocytosis|recycling|recycle|degradation|degrade|lysosomal|endosomal|transcytosis|transcytosing)\b/i.test(promptLower);
  const microenvironmentCue =
    /\b(microenvironment|hypoxia|hypoxic|acidic|low ph|ph\b|protease|protease-rich|stroma|stromal|fibrosis|fibrotic|interstitial pressure|vascular permeability|necrosis|necrotic|immune microenvironment|tumor microenvironment|immune infiltrate|myeloid|caf|matrix)\b/i.test(promptLower);

  return [
    {
      title: "Protein Format Decision",
      body: `protein choice should follow biology, not habit. for ${targetLabel}, the current first-pass direction is ${formatDirection}, but that should be pressure-tested against IgG, smaller antibody fragments, non-antibody scaffolds, cyclic peptides, and multispecific formats before it becomes a final build.`,
      bullets: [
        barrierLimited
          ? "access-biased rule: if tissue penetration, BBB/CSF movement, endosomal escape, or fast distribution is the bottleneck, compare VHH/nanobody, scFv, Fab, minibody, SIP, affibody, adnectin, anticalin, DARPin, knottin, or cyclic-peptide formats against full IgG."
          : "window-biased rule: if the target window is clean and half-life, FcRn recycling, manufacturability, and mature developability matter most, IgG or Fc-containing formats stay strong comparators.",
        oncologyCytotoxic
          ? "cytotoxic conjugate rule: IgG ADCs usually tolerate controlled DAR best, but smaller formats can help penetration or clearance if antigen heterogeneity, normal-tissue exposure, or tumor access is the limiting risk."
          : "non-cytotoxic rule: do not choose a big carrier only because it is familiar; pathway, enzyme, immune, oligo, or delivery-shuttle biology may prefer compact or modular formats.",
        chronicNonCytotoxic
          ? "chronic-use rule: repeat dosing, immunogenicity, renal clearance, target-mediated sink, and accumulation can matter more than maximum potency."
          : "acute/intensive-use rule: exposure window and payload class can justify a larger carrier if the safety margin is measurable.",
      ],
    },
    {
      title: "Antigen Properties That Change The Protein",
      body: "antigen density, location, distribution, and trafficking can flip the protein-format recommendation even when the payload and disease are unchanged.",
      bullets: [
        sparseAntigen
          ? "sparse-antigen rule: avoid assuming a bulky IgG ADC with low payload delivery will be enough. consider higher-affinity or avidity-tuned binders, bispecific retention, bystander-capable payloads, local activation, or compact formats only after proving target-low disease cells still receive enough active species."
          : denseAntigen
            ? "dense-antigen rule: high target density can support IgG/Fc exposure, avidity, internalization, and controlled DAR, but very high affinity or valency can still create a binding-site barrier, target sink, receptor downmodulation, or normal-tissue trapping."
            : heterogeneousAntigen
              ? "heterogeneous-antigen rule: patchy expression pushes toward bystander payload, dual-antigen or bispecific logic, local activation, or non-cytotoxic mechanisms that do not require every disease cell to express the same antigen."
              : "unknown-density rule: do not pick a final protein format until antigen density, receptor number, and target-low disease fraction are measured.",
        broadNormalExpression
          ? "broad-normal-expression rule: if the antigen is everywhere and the disease biology wants a cytotoxic payload, PK/PD becomes dominated by the protein carrier. long-lived IgG may increase normal-tissue exposure; smaller formats may clear faster but can lose tumor exposure; masking, lower affinity, local activation, or an alternate antigen may be needed."
          : "selectivity rule: compare disease tissue, normal tissue, and high-exposure organs before increasing affinity, avidity, half-life, or DAR.",
        secretedOrShed
          ? "shed/secreted-antigen rule: soluble antigen can create a peripheral sink, consume the protein, alter PK, and reduce target-site delivery; format, affinity, Fc half-life, and dose need to be stress-tested against soluble target."
          : surfaceAccessible
            ? "surface-location rule: surface-accessible antigen keeps antibody, fragment, scaffold, peptide, ADC/PDC/SMDC/RDC, and bispecific options alive, but internalization or retention decides which one actually fits."
            : "location rule: if the antigen is intracellular, nuclear, mitochondrial, secreted, or inaccessible, the protein part must target a different entry handle or the modality should shift away from direct antigen binding.",
        normalizedCase.targetInternalizationKnown === "slow"
          ? "slow-internalization rule: downgrade lysosomal ADC release, and consider retention-driven RDC, membrane-permeable bystander payload, local activation, or non-internalizing pathway/immune mechanisms."
          : normalizedCase.targetInternalizationKnown === "fast"
            ? "fast-internalization rule: intracellular payload release, non-cleavable or cleavable linker screens, and controlled DAR become more plausible, but trafficking still has to reach the productive compartment."
            : "trafficking rule: binding is not enough; measure internalization, recycling, lysosomal routing, shedding, retention, and active-species release separately.",
      ],
    },
    {
      title: "Cell Biology And Microenvironment Gates",
      body: "internalization is not a fixed property of an antigen. the target-bearing cell, receptor state, endocytic route, and local microenvironment decide whether a protein format produces useful delivery or a misleading binding signal.",
      bullets: [
        cellBiologyCue
          ? "cell-specific internalization rule: ask which cell is carrying the antigen. tumor cells, immune cells, endothelial cells, neurons, glia, hepatocytes, stromal cells, and normal epithelial cells can route the same target through different uptake, recycling, degradation, or transcytosis programs."
          : "target-bearing-cell rule: do not assume one trafficking route across all cells. measure the antigen on the disease-driving cell type and the highest-risk normal cell type before choosing IgG, Fab, VHH, scaffold, peptide, or multispecific logic.",
        "endocytic-route rule: clathrin-mediated uptake, caveolin routing, macropinocytosis, FcRn recycling, lysosomal degradation, endosomal escape, and transcytosis are different gates. a protein that binds well can still recycle out, degrade too early, or never reach the active compartment.",
        microenvironmentCue
          ? "microenvironment rule: hypoxia, acidic pH, proteases, stromal density, fibrosis, interstitial pressure, necrosis, vascular leak, and immune-cell infiltration can change penetration, retention, linker cleavage, payload release, and whether a compact format beats IgG."
          : "microenvironment rule: choose format against the real tissue context, not clean-cell binding alone. dense stroma can favor compact formats; vascular or peripheral sink can favor tuned affinity; protease-rich or acidic compartments can justify conditional release only if measured.",
        "protein-choice consequence: compact proteins may penetrate better but clear faster and carry less payload; IgG/Fc formats may hold exposure but can trap perivascularly, bind normal tissue longer, or amplify antigen sink; multispecific or masked formats should be used only when they solve a measured cell-state or microenvironment problem.",
        "no-hallucination gate: label cell trafficking and microenvironment effects as measured, inferred, or speculative. require cell-type-specific internalization/trafficking assays and microenvironment-matched models before claiming the protein format is optimal.",
      ],
    },
    {
      title: "Format Families To Compare",
      body: "each protein family solves a different problem and creates a different chemistry, PK/PD, affinity, avidity, and manufacturability tradeoff.",
      bullets: [
        "IgG / Fc formats: best for long half-life, FcRn recycling, mature CMC, Fc engineering, and DAR 2-4 style ADC control; watch slow penetration, long normal-tissue exposure, Fc effects, and antigen-sink risk. kappa versus lambda light chain is usually a pairing/manufacturing and developability choice unless the binding clone demands one.",
        "Fab, scFv, VHH/nanobody, half antibody, minibody, and SIP: useful when penetration, faster distribution, modularity, or lower systemic exposure matters; watch renal clearance, lower avidity, stability, aggregation, and limited payload capacity.",
        "Affibody, adnectin, anticalin, DARPin, knottin, abdurin-like or other engineered scaffolds: useful only when a validated binder exists and compactness solves a real delivery problem; watch immunogenicity, off-target stickiness, payload tolerance, and CMC maturity.",
        "Cyclic peptides: attractive for compact PDC-style targeting, fast tissue access, and tunable chemistry; watch affinity, plasma stability, renal clearance, target retention, and whether payload attachment ruins binding.",
        "Enzymes: choose only if catalytic turnover, enzyme replacement, local prodrug activation, or lysosomal/cellular rescue is the therapeutic engine; random conjugation can destroy active-site, glycan, or uptake biology.",
      ],
    },
    {
      title: "Multispecific And Avidity Logic",
      body: "bispecific, trispecific, and multispecific formats should be used to solve a precise biological problem, not as automatic upgrades.",
      bullets: [
        "use monospecific IgG when one antigen has enough expression separation, accessibility, and internalization or retention by itself.",
        "use bispecific logic when one arm improves delivery or transport and the other arm supplies disease targeting, or when dual-antigen gating improves disease-versus-normal selectivity.",
        "possible formats to compare: IgG-scFv, IgG-dAb, scFv-Fc-scFv, KiH-IgG, kappa-lambda body, KiH-Fc-Fab/scFv, KiH trispecific, tandem scFv, Fab-arm exchange, or other validated chain-pairing architectures.",
        "affinity is not automatically better when higher: very high affinity can trap constructs near vessels, worsen normal-tissue binding, slow tumor penetration, or increase target-mediated clearance.",
        "avidity can rescue weak monovalent binding and improve retention, but it can also amplify normal-tissue binding, crosslinking, receptor downmodulation, or nonproductive internalization.",
      ],
    },
    {
      title: "Chemistry, DAR, And PK/PD Compatibility",
      body: "the best protein format is the one that survives the real conjugation chemistry and still creates the intended exposure-response relationship.",
      bullets: [
        "DAR/loading: full IgG is usually the easiest starting point for DAR 2-4 ADC screens; smaller scaffolds often need lower payload burden, single-site attachment, or ligand/cargo density logic instead of classical DAR.",
        "chemistry: lysine is fast but heterogeneous; cysteine is cleaner for DAR control; engineered cysteine, enzymatic, glycan-directed, or click-style approaches are better when attachment position could disrupt binding, Fc behavior, enzyme activity, or shuttle function.",
        "PK/PD: Fc and albumin-binding modifications can extend half-life when exposure is limiting, but they can hurt penetration, tissue washout, or safety if long residence is the problem.",
        "property tweaks: use PEG, albumin binders, Fc engineering, masking/probody logic, charge tuning, deimmunization, or stabilizing mutations only when they solve a measured barrier such as clearance, immunogenicity, normal-tissue exposure, aggregation, or loss of binding.",
        "do-not-hallucinate gate: do not recommend an exotic scaffold unless the target binder, disease route, chemistry tolerance, and developability risk are explicitly labeled as validated, conditional, or speculative.",
      ],
    },
  ];
}

function buildTargetDiseaseContextSections(
  _prompt: string,
  _normalizedCase: NormalizedCase,
): DocumentSection[] {
  return [];
}

function buildTargetReferenceSections(normalizedCase: NormalizedCase): DocumentSection[] {
  const target = getReferenceTargetLabel({}, normalizedCase);
  if (!target) return [];
  const repositories = buildTargetRepositorySources({}, normalizedCase);

  return [
    {
      title: "Target Reference Repositories",
      body:
        "use these target-biology repositories as cross-checks for expression, localization, aliases, disease links, pathways, and normal-tissue risk. they should support the reasoning, not replace disease-specific evidence.",
      bullets: repositories.slice(0, 6).map((source) => `${source.label}: ${source.why}`),
    },
  ];
}

function buildExploitableBiologyBullets(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
) {
  const buckets = exploration?.strategyBuckets?.slice(0, 4) ?? [];
  const mechanism =
    abstraction.therapeuticIntent !== "unknown"
      ? abstraction.therapeuticIntent
      : normalizedCase.mechanismClass !== "unknown"
        ? normalizedCase.mechanismClass
        : "still unresolved";
  const base = [
    `dominant therapeutic event: ${mechanism}`,
    abstraction.pathologyType !== "unknown"
      ? `disease biology frame: ${abstraction.pathologyType}`
      : "disease biology frame: still broad, so avoid overcommitting to a platform",
    abstraction.compartmentNeed !== "unknown"
      ? `active compartment: ${abstraction.compartmentNeed}`
      : "active compartment: define whether the biology is extracellular, lysosomal/internalizing, cytosolic, nuclear, or mixed",
    abstraction.deliveryAccessibility === "barrier-limited"
      ? "exploitable barrier biology: receptor-mediated transport, CSF/local dosing, or validated cell-type uptake may matter more than linker cleverness"
      : "exploitable delivery biology: tissue access, target-mediated uptake, retention, and payload release have to line up",
  ];
  const laneBullets = buckets.map(
    (bucket) =>
      `${bucket.label}: ${bucket.whyPlausible} assumption: ${bucket.requiredAssumptions[0] ?? "the biology is causal enough to exploit"}`,
  );

  return [...base, ...laneBullets].slice(0, 8);
}

function buildAntigenBiologyBullets(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
) {
  const targetLabel =
    normalizedCase.target?.canonical ??
    normalizedCase.target?.raw;
  const oncologyNoTarget =
    normalizedCase.diseaseArea === "oncology" && !targetLabel;
  const shortlist = getOncologyTargetShortlist(normalizedCase);

  return [
    targetLabel
      ? `disease relevance: prove ${targetLabel} is present on the disease-driving cells, not only detectable somewhere in the tissue`
      : oncologyNoTarget
        ? `candidate-antigen shortlist: compare ${shortlist.slice(0, 5).join(", ")} before naming one best antigen`
        : "entry-handle discovery: define the antigen, receptor, transport handle, pathway marker, or cell-state handle before ranking classes",
    "selectivity window: compare disease tissue, normal tissue, and high-exposure organs, not only target-positive disease cells",
    normalizedCase.targetDensityKnown === "high"
      ? "density: high or homogeneous antigen can support avidity, internalization, and antibody-sized formats, but may also create target sink or binding-site barrier if affinity and valency are too aggressive"
      : normalizedCase.targetDensityKnown === "mixed"
        ? "density: heterogeneous antigen should trigger bystander, bispecific, dual-target, local-activation, or non-uniform-expression strategy thinking"
        : normalizedCase.targetDensityKnown === "low"
          ? "density: sparse antigen makes payload delivery, avidity, and PK/PD harder; the format may need stronger retention, higher sensitivity, or a different antigen rather than simply more DAR"
          : "density: antigen copy number, target-low fraction, and disease-vs-normal expression separation still need to be measured",
    "accessibility: decide whether the antigen is surface-accessible, extracellular, internalizing, retained, shed, heterogeneous, or hidden behind a barrier",
    abstraction.internalizationRequirement === "required"
      ? "internalization: quantify productive uptake and processing because the payload needs intracellular access"
      : "internalization / retention: measure the route anyway; binding alone is not enough for most conjugate mechanisms",
    "target-bearing cell biology: the same antigen can internalize, recycle, degrade, or transcytose differently depending on whether it sits on tumor cells, immune cells, endothelium, neurons, glia, stroma, or high-risk normal tissue",
    "microenvironment: hypoxia, pH, proteases, stroma, fibrosis, vascular access, necrosis, and immune infiltrates can change penetration, retention, linker cleavage, payload release, and the ideal protein size or valency",
    "heterogeneity: decide whether bystander payload, dual targeting, bispecific logic, or local activation is needed to handle target-low cells",
    "payload compatibility: the antigen biology must match the active species, whether that is cytotoxic release, RNA modulation, immune modulation, radiobiology, catalysis, or pathway support",
  ];
}

function buildBiologyToConstructLogicSections(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
): DocumentSection[] {
  const diseaseLabel =
    normalizedCase.disease?.canonical ??
    normalizedCase.disease?.raw ??
    "this disease";
  const targetLabel =
    normalizedCase.target?.canonical ??
    normalizedCase.target?.raw ??
    "the target / entry handle";
  const therapeuticEvent =
    abstraction.therapeuticIntent !== "unknown"
      ? abstraction.therapeuticIntent
      : normalizedCase.mechanismClass !== "unknown"
        ? normalizedCase.mechanismClass
        : "still unresolved";
  const cellGates = abstraction.cellProcessingGates?.length
    ? abstraction.cellProcessingGates
    : [
        "target-bearing cell identity and disease state",
        "uptake, recycling, degradation, transcytosis, and active-compartment access",
      ];
  const microenvironmentPressures = abstraction.microenvironmentPressures?.length
    ? abstraction.microenvironmentPressures
    : [
        "target density, tissue access, normal-tissue exposure, and repeat-dose safety",
      ];

  return [
    {
      title: "Biology-To-Construct Logic",
      body: `the planner should reason from ${diseaseLabel} biology into construct design in one chain: therapeutic event, ${targetLabel} biology, target-bearing cell processing, microenvironment pressure, then format, linker, payload, DAR/loading, chemistry, PK/PD, and validation.`,
      bullets: [
        `therapeutic event: ${therapeuticEvent}.`,
        `target / entry handle: ${targetLabel}; rank it by disease relevance, accessibility, density, heterogeneity, normal-tissue overlap, and payload compatibility.`,
        `cell-processing gates: ${cellGates.slice(0, 4).join("; ")}.`,
        `microenvironment / PK-PD pressures: ${microenvironmentPressures.slice(0, 4).join("; ")}.`,
        constructGuidance
          ? `construct translation: format ${constructGuidance.format.title}; linker ${constructGuidance.linker.title}; payload ${constructGuidance.payload.title}.`
          : "construct translation: keep format, linker, payload, DAR/loading, and chemistry conditional until the biology gates are explicit.",
        "no-hallucination rule: separate measured facts from inferred or speculative assumptions before calling one modality or protein format best.",
      ],
    },
  ];
}

function buildConjugateMechanismTranslationBullets(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
) {
  const chronicOrNonCytotoxic =
    normalizedCase.chronicContext ||
    abstraction.cytotoxicFit === "discouraged" ||
    abstraction.therapeuticIntent === "pathway modulation" ||
    abstraction.therapeuticIntent === "immune modulation";

  return [
    chronicOrNonCytotoxic
      ? "ADC / cytotoxic conjugate logic: keep out of the lead set unless the biology truly supports selective cell depletion or a non-cytotoxic ADC-like payload"
      : "ADC logic: viable only when antigen density, internalization, tumor-normal separation, linker release, and payload sensitivity all line up",
    "PDC logic: becomes attractive when a peptide or compact biologic has real binding, stability, localization, and uptake evidence",
    "SMDC logic: becomes attractive when a small ligand has selective binding and survives linker-payload attachment without losing the pharmacophore",
    "RDC logic: becomes attractive when target localization, retention, isotope range, dosimetry, and organ exposure are the therapeutic engine",
    "Oligo / gene-modulation logic: becomes attractive when a transcript, splice event, or pathway target is causal and productive intracellular delivery is plausible",
    "Enzyme / prodrug logic: becomes attractive when local catalysis, enzyme replacement, or prodrug activation creates selectivity that binding alone cannot",
    "Newer modalities: masked/probody, bispecific, multispecific, degrader, glue, or immune-engager logic should be justified by the biological problem they uniquely solve",
  ];
}

function buildDefaultExperimentList(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top?: RankedOption,
) {
  if (normalizedCase.broadOncologyNoTarget) {
    if (isHematologicOncologyCase(normalizedCase)) {
      return [
        "build a hematologic target shortlist and map malignant versus normal immune-cell expression before choosing the conjugate class",
        "measure target density, heterogeneity, soluble target, internalization, recycling, and retention in disease-relevant blood, marrow, and nodal models",
        "test payload sensitivity and bystander need across target-high, target-low, and target-negative hematologic cells",
        "compare antibody-sized and compact formats if tissue distribution, circulating target sink, or normal immune-cell exposure is a concern",
        "run early safety-window screens for marrow, lymphoid, cytokine, infection-risk, and repeat-dose liabilities",
        "only then optimize linker, DAR, chelator, or attachment chemistry around the winning antigen biology",
      ];
    }
    return [
      "build a target shortlist and map tumor versus normal tissue expression before choosing the conjugate class",
      "measure antigen density, heterogeneity, shedding, internalization, recycling, and retention in disease-relevant models",
      "test payload sensitivity and bystander need across target-high, target-low, and target-negative cells",
      "compare antibody-sized and compact formats if tissue penetration or normal-tissue exposure is a concern",
      "run early safety-window screens in the most relevant normal epithelial, liver, marrow, and high-exposure systems",
      "only then optimize linker, DAR, chelator, or attachment chemistry around the winning antigen biology",
    ];
  }

  const experiments = [
    "map target expression and the relevant cell types before locking the carrier format",
    "compare target-bearing disease cells and high-risk normal cells so internalization is not treated as one universal antigen property",
    "run internalization and trafficking assays in the disease-relevant cells",
    "measure recycling, lysosomal degradation, transcytosis, endosomal escape, or retention according to the active species and protein format",
    abstraction.microenvironmentPressures?.length
      ? "stress-test the construct in a microenvironment-matched model for pH, proteases, stroma, vascular access, target density, or tissue-sink effects"
      : "",
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

function buildGeneralConjugateExplainerResponse(responseFlow: ResponseFlow) {
  const documentSections: DocumentSection[] = [
    {
      title: "What Conjugates Are",
      body: "A therapeutic conjugate is a deliberately linked construct: one part helps the medicine get to the right biology, and another part creates the therapeutic effect. The point is not just to attach two molecules; it is to make delivery, exposure, release, and mechanism work better together.",
    },
    {
      title: "The Basic Architecture",
      body: "Most conjugates can be understood as carrier plus linker plus active species, even though the exact parts change by modality.",
      bullets: [
        "carrier or targeting handle: antibody, peptide, small molecule, oligo, enzyme, ligand, shuttle, or other scaffold that gives binding, localization, or delivery.",
        "linker or attachment chemistry: the connection that controls stability, release, spacing, and whether the active species survives delivery.",
        "payload or active species: cytotoxic drug, isotope, oligo, enzyme, immune modulator, degrader, pathway modulator, or other functional cargo.",
      ],
    },
    {
      title: "Why They Are Useful",
      body: "Conjugates are useful when free drug exposure is not enough, too toxic, too poorly targeted, or unable to reach the compartment where the biology happens.",
      bullets: [
        "They can improve localization to a disease tissue, target, receptor, or transport pathway.",
        "They can change PK/PD by altering half-life, biodistribution, uptake, retention, or release.",
        "They can make a payload usable by matching it to antigen biology, tissue access, internalization, or local activation.",
      ],
    },
    {
      title: "Main Families",
      body: "Different conjugate families solve different biological problems, so the class should follow the mechanism rather than the abbreviation.",
      bullets: [
        "ADC: antibody plus payload, usually strongest when a selective internalizing surface antigen supports payload delivery.",
        "PDC or SMDC: peptide or small-molecule targeting handle plus payload, useful when compact access or ligand biology matters.",
        "RDC: targeting handle plus radionuclide, useful when localization, retention, isotope range, and dosimetry are the therapeutic engine.",
        "Oligo conjugate: delivery handle plus ASO, siRNA, PMO, or related cargo, useful when transcript or RNA biology is the therapeutic event.",
        "Enzyme or prodrug conjugate: useful when catalysis, local activation, or enzyme replacement is the real selectivity mechanism.",
      ],
    },
    {
      title: "Where They Fail",
      body: "Conjugates fail when the biology and the construct do not match. Binding alone is not enough if the payload cannot reach the right compartment or the safety window collapses.",
      bullets: [
        "wrong target: poor disease relevance, weak expression separation, or unsafe normal-tissue overlap.",
        "wrong trafficking: binds well but does not internalize, release, escape, localize, or retain where the active species works.",
        "wrong chemistry: attachment damages binding, stability, PK, release, payload activity, or manufacturability.",
        "wrong mechanism: using cytotoxic payload logic when the disease needs pathway modulation, immune reset, RNA modulation, or tissue protection.",
      ],
    },
  ];
  const presentation: PresentationSummary = {
    mode: "concept-explainer",
    title: "Conjugates = targeted linked medicines",
    bestConjugateClass: "Conjugates",
    confidence: "high",
    rationale: "this is a concept-definition question, so the answer should explain the platform idea directly instead of asking for a disease or target.",
    whatItIs: "a conjugate is a linked therapeutic construct that combines a targeting or delivery element with an active species.",
    bestFit: "best when delivery, localization, release, or PK/PD can make the therapeutic mechanism better than the unconjugated active species.",
    mainWatchout: "the class only works when the target biology, trafficking, payload mechanism, linker chemistry, and safety window line up.",
    bestClarifier: "do you want examples, a simple diagram, or a comparison between ADC, PDC, SMDC, RDC, oligo, and enzyme conjugates?",
  };

  return {
    topPick: "Conjugates",
    topPickWhy: "a conjugate is a linked therapeutic construct that combines a targeting or delivery element with an active species.",
    biggestRisk: "binding or attachment can look good while real delivery, payload execution, PK/PD, or safety fails.",
    firstMove: "decide whether you want the explanation by class, mechanism, disease example, or construct architecture.",
    nextSteps: [
      "ask for a simple diagram of carrier-linker-payload logic",
      "ask for ADC vs PDC vs SMDC vs RDC vs oligo conjugates",
      "ask how to choose a conjugate class for a disease or antigen",
    ],
    ranking: [],
    matrix: [],
    sources: [],
    presentation,
    evidenceAnchors: [],
    uncertainties: [
      "the definition is general; the best conjugate type depends on disease biology, target biology, payload mechanism, and delivery route.",
    ],
    sectionOrder: buildSectionOrder("document-brief"),
    presentationVariant: "document-brief" as const,
    documentSections,
    text: `direct answer\nA therapeutic conjugate is a linked construct that joins a targeting or delivery element to an active species.\n\n${buildDocumentText(documentSections)}`,
    summary: "conjugates are targeted linked medicines built to connect delivery, linker chemistry, and therapeutic mechanism.",
    topic: "Conjugates",
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
      evidenceVisualization: false,
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
      topic: "Conjugates",
      topModality: "Conjugates",
      questionFrame: "concept",
      pendingClarifier: presentation.bestClarifier,
    },
    suggestedFollowUps: [
      "show me a simple diagram",
      "compare ADC, PDC, SMDC, RDC, oligo, and enzyme conjugates",
      "what makes a good conjugate target?",
      "how do linker and payload choices work?",
      "give me real examples",
    ],
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
      factors: [
        {
          label: "concept-level definition",
          impact: "positive" as const,
          note: "this is a generic explainer, not a disease-ranking question.",
        },
      ],
      missingEvidence: [],
    },
  };
}

function isGenericChemistryExplainerPrompt(prompt: string, parsedQuery: ParsedQuery) {
  const normalizedPrompt = normalize(prompt);
  return (
    parsedQuery.questionType === "chemistry strategy" &&
    !parsedQuery.diseaseMention &&
    !parsedQuery.targetMention &&
    /(describe|explain|overview|pros|cons|advantages|disadvantages|various|different|compare|chemistr(?:y|ies)|conjugation)/i.test(normalizedPrompt)
  );
}

function buildGeneralChemistryExplainerResponse(responseFlow: ResponseFlow) {
  const documentSections: DocumentSection[] = [
    {
      title: "What Conjugation Chemistry Decides",
      body: "Conjugation chemistry is the way the carrier and active species are attached. It controls heterogeneity, stability, loading, release, PK/PD, manufacturability, and whether the construct still binds and functions after payload attachment.",
    },
    {
      title: "Lysine Conjugation",
      body: "Lysine chemistry is the fast, practical, high-throughput route, but it is usually heterogeneous because proteins have many accessible lysines.",
      bullets: [
        "pros: fast screening, simple reagents such as NHS or TFP esters, broad protein compatibility, useful for early feasibility.",
        "cons: mixed attachment sites, wider DAR distribution, harder structure-function interpretation, possible binding or PK changes if important lysines are modified.",
        "best use: quick first-pass prototypes when speed matters more than perfect site control.",
      ],
    },
    {
      title: "Cysteine Conjugation",
      body: "Cysteine chemistry is often cleaner than lysine chemistry because reduced interchain or engineered cysteines give more controllable loading.",
      bullets: [
        "pros: better DAR control, easier analytics, strong ADC precedent, useful balance of speed and interpretability.",
        "cons: reduction can disturb disulfides, maleimide-style linkages may need stability tuning, engineered cysteines add development work.",
        "best use: antibody-style builds where DAR, PK, and stability need to be more interpretable.",
      ],
    },
    {
      title: "Site-Specific Conjugation",
      body: "Site-specific chemistry tries to put the payload in a defined position so the construct is more reproducible and easier to optimize.",
      bullets: [
        "pros: cleaner DAR, more predictable PK, easier comparison across payloads, lower risk of damaging binding sites.",
        "cons: needs engineering or specialized handles, slower setup, more CMC complexity, each site still needs validation.",
        "best use: polished leads or programs where heterogeneity is hiding the true biology.",
      ],
    },
    {
      title: "Enzymatic Or Glycan-Directed Chemistry",
      body: "Enzymatic and glycan-remodeling approaches use biological or glycan handles to install payloads more selectively.",
      bullets: [
        "pros: cleaner placement than random lysine chemistry, useful for antibodies and proteins, can preserve binding domains.",
        "cons: extra process steps, enzyme/substrate constraints, glycan remodeling complexity, scale-up and analytics need attention.",
        "best use: when site control matters but fully custom protein engineering is too heavy for the first build.",
      ],
    },
    {
      title: "Click And Bioorthogonal Chemistry",
      body: "Click-style chemistry is useful when modular assembly, speed, or orthogonal handles matter, especially for complex payloads or staged constructs.",
      bullets: [
        "pros: modular, selective, useful for rapid payload swaps, compatible with some oligo and imaging workflows.",
        "cons: handle installation is still required, spacer bulk can change binding or PK, residual metals or unusual motifs may create developability concerns depending on route.",
        "best use: modular discovery, imaging/probe workflows, or cases where carrier and payload need to be optimized independently.",
      ],
    },
    {
      title: "How To Choose",
      body: "The best chemistry is the one that preserves the biology while giving interpretable data. Do not optimize elegant chemistry before proving target binding, trafficking, active-species function, PK/PD, and safety.",
      bullets: [
        "early screen: lysine for speed, cysteine for cleaner DAR, site-specific if noisy heterogeneity would mislead decisions.",
        "lead optimization: move toward site-specific, enzymatic, glycan-directed, or engineered-cysteine routes when reproducibility and PK matter.",
        "must-test gates: binding retention, aggregation, plasma stability, release or retained activity, payload potency, PK, immunogenicity risk, and manufacturability.",
      ],
    },
  ];
  const presentation: PresentationSummary = {
    mode: "concept-explainer",
    title: "Conjugation Chemistry Overview",
    bestConjugateClass: "Chemistry",
    confidence: "high",
    rationale: "this is a generic chemistry explainer, so the answer should compare attachment strategies rather than ask for a disease or target.",
    whatItIs: "conjugation chemistry is the attachment strategy that connects carrier, linker, and active species.",
    bestFit: "best chemistry depends on whether the program needs speed, DAR control, site control, stability, modularity, or manufacturability.",
    mainWatchout: "a beautiful chemistry can still fail if it damages binding, active-species function, PK/PD, release, or safety.",
    bestClarifier: "do you want a table comparing lysine, cysteine, site-specific, enzymatic, glycan, and click chemistry?",
  };

  return {
    topPick: "Conjugation Chemistry",
    topPickWhy: "chemistry controls how the carrier and active species are attached, which directly affects DAR, stability, PK/PD, release, activity, and manufacturability.",
    biggestRisk: "attachment can damage binding, create heterogeneity, destabilize the construct, or make early biology data hard to interpret.",
    firstMove: "pick chemistry based on the decision you need: speed, DAR control, site control, stability, modular swapping, or CMC readiness.",
    nextSteps: [
      "ask for a table of chemistry options",
      "ask which chemistry fits ADCs versus oligo conjugates",
      "ask how DAR and site of attachment affect PK/PD",
    ],
    ranking: [],
    matrix: [],
    sources: [],
    presentation,
    evidenceAnchors: [],
    uncertainties: [
      "the best route depends on carrier format, payload class, desired DAR/loading, release mechanism, and manufacturability constraints.",
    ],
    sectionOrder: buildSectionOrder("document-brief"),
    presentationVariant: "document-brief" as const,
    documentSections,
    text: `direct answer\nConjugation chemistry is the attachment strategy that connects carrier, linker, and active species.\n\n${buildDocumentText(documentSections)}`,
    summary: "conjugation chemistry choices trade speed, heterogeneity, DAR control, site specificity, stability, PK/PD, and manufacturability.",
    topic: "Conjugation Chemistry",
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
      evidenceVisualization: false,
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
      topic: "Conjugation Chemistry",
      topModality: "Chemistry",
      questionFrame: "concept",
      pendingClarifier: presentation.bestClarifier,
    },
    suggestedFollowUps: [
      "make this a table",
      "which chemistry should an ADC start with?",
      "how does DAR affect PK/PD?",
      "compare lysine vs cysteine",
      "when should we use site-specific conjugation?",
    ],
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
      factors: [
        {
          label: "concept-level chemistry overview",
          impact: "positive" as const,
          note: "this is an educational chemistry question, not a disease-ranking question.",
        },
      ],
      missingEvidence: [],
    },
  };
}

function isGenericLinkerExplainerPrompt(prompt: string, parsedQuery: ParsedQuery) {
  const normalizedPrompt = normalize(prompt);
  return (
    parsedQuery.questionType === "linker strategy" &&
    !parsedQuery.diseaseMention &&
    !parsedQuery.targetMention &&
    /(describe|explain|overview|pros|cons|advantages|disadvantages|various|different|compare|linker|linkers|cleavable|non[- ]?cleavable|hydrazone|hydrozone|disulfide|protease|cathepsin|cathapsin|legumain|vcp|pabc)/i.test(
      normalizedPrompt,
    )
  );
}

function buildGeneralLinkerExplainerResponse(responseFlow: ResponseFlow) {
  const documentSections: DocumentSection[] = [
    {
      title: "What Linkers Decide",
      body: "A linker is the design layer between the carrier and active species. It controls plasma stability, release location, payload potency after release, DAR behavior, hydrophobicity, PK/PD, internalization dependency, and safety.",
    },
    {
      title: "Non-Cleavable Linkers",
      body: "Non-cleavable linkers prioritize stability. The payload usually becomes active after the carrier is internalized and degraded into a payload-linker-catabolite.",
      bullets: [
        "best when target-positive cells internalize and catabolize well, bystander killing is not essential, and free-payload exposure needs to stay low.",
        "risk: weak activity if the payload needs clean free release or target heterogeneity requires diffusion into nearby target-low cells.",
        "key tests: internalization, lysosomal degradation, catabolite potency, plasma stability, and normal-cell uptake.",
      ],
    },
    {
      title: "Protease-Cleavable Linkers",
      body: "Protease-cleavable linkers use enzyme processing to release payload, most often after endosomal or lysosomal trafficking.",
      bullets: [
        "common motifs include Val-Cit, Val-Ala, cathepsin-tuned peptides, legumain-sensitive motifs, and other enzyme-biased sequences.",
        "best when the target-bearing cell actually traffics the construct to the enzyme-rich compartment that can release an active payload.",
        "risk: premature plasma or normal-tissue cleavage if the enzyme window is not compartment-biased.",
      ],
    },
    {
      title: "Disulfide / Redox-Cleavable Linkers",
      body: "Disulfide linkers exploit reducing environments to release the active species after cellular entry.",
      bullets: [
        "best when intracellular reduction is part of the real release mechanism and faster release is useful.",
        "risk: premature deconjugation in circulation or high-exposure normal tissues if stability is not tuned.",
        "key tests: serum stability, intracellular release kinetics, normal-cell reduction, and payload activity after release.",
      ],
    },
    {
      title: "Hydrazone / Acid-Labile Linkers",
      body: "Hydrazone or acid-labile linkers are pH-triggered options. They should be treated as conditional, not default.",
      bullets: [
        "best only when acidic endosomal, lysosomal, or microenvironment release is measured and meaningfully selective.",
        "risk: noisy pH selectivity, premature release, and weaker robustness versus enzyme-cleavable or non-cleavable designs.",
        "use as a comparator when acid-triggered release is specifically part of the hypothesis.",
      ],
    },
    {
      title: "Self-Immolative And Stabilized Designs",
      body: "Self-immolative spacers and protected cleavage architectures help translate a trigger event into clean active-species release.",
      bullets: [
        "PABC-style spacers can help generate a clean free payload after protease or chemical trigger.",
        "tandem cleavage sites, exosite-aware motifs, steric shielding, or exoskeleton-like protection can reduce premature cleavage when instability is measured.",
        "risk: extra architecture can slow desired release, block enzyme access, or add developability burden.",
      ],
    },
    {
      title: "PEG And Polarity Tuning",
      body: "PEG, polar spacers, or hydrophilic linker elements can compensate for hydrophobic linker-payloads, high DAR, aggregation, or poor exposure.",
      bullets: [
        "useful when VCP-like or other hydrophobic payload-linker systems hurt solubility, PK, or clearance.",
        "risk: too much PEG or spacer length can reduce potency, internalization, penetration, or clean payload release.",
        "treat spacer length and polarity as biological variables, not cosmetic chemistry.",
      ],
    },
    {
      title: "Payload-Specific Rules",
      body: "The right linker depends on what the active species needs after delivery.",
      bullets: [
        "small-molecule cytotoxics: decide whether free payload, catabolite payload, or bystander-capable release is needed.",
        "oligos: preserve active strand integrity, hybridization, trafficking, and nuclear/cytosolic access; stable attachment is often the first comparator.",
        "radionuclides: focus on chelator stability, spacer charge, target retention, isotope half-life, and dosimetry rather than classical cleavage.",
      ],
    },
    {
      title: "How To Choose",
      body: "Choose the linker by matching biology to release logic: target location, internalization speed, trafficking route, microenvironment triggers, active-species needs, DAR/hydrophobicity, PK/PD, and safety window.",
      bullets: [
        "first compare: non-cleavable stability-first, one mechanism-matched cleavable linker, and one payload-compatible comparator.",
        "must-test gates: plasma stability, disease-cell processing, normal-cell processing, released-species identity, payload potency, PK/clearance, and repeat-dose safety.",
        "do not optimize fancy linker architecture until target biology, trafficking, and active-species function are real.",
      ],
    },
  ];

  const presentation: PresentationSummary = {
    mode: "concept-explainer",
    title: "Linker Selection Overview",
    bestConjugateClass: "Linker strategy",
    confidence: "high",
    rationale: "this is a generic linker explainer, so the answer should compare release mechanisms rather than ask for a disease or target.",
    whatItIs: "a linker controls how the carrier stays attached to, releases, or presents the active species.",
    bestFit: "best linker depends on internalization, microenvironment, active-species class, stability, hydrophobicity, DAR/loading, PK/PD, and safety.",
    mainWatchout: "premature cleavage or wrong-compartment release can make a beautiful construct fail before it reaches the disease biology.",
    bestClarifier: "do you want this turned into a linker decision table for ADC, PDC, SMDC, oligo, and RDC separately?",
  };

  return {
    topPick: "Linker Strategy",
    topPickWhy: "linker choice should follow biology: release route, payload class, microenvironment trigger, internalization, stability, and PK/PD.",
    biggestRisk: "the biggest risk is premature release, no productive release, payload inactivation, hydrophobicity-driven PK failure, or normal-tissue processing.",
    firstMove: "compare a stability-first linker against the most biology-matched cleavable linker, then measure release and activity in disease and normal systems.",
    nextSteps: [
      "ask for a linker decision table",
      "ask which linker fits ADC versus oligo conjugates",
      "ask how hydrophobicity and DAR change linker choice",
    ],
    ranking: [],
    matrix: [],
    sources: [],
    presentation,
    evidenceAnchors: [],
    uncertainties: [
      "the best linker cannot be selected without carrier format, active species, release compartment, internalization, and safety-window assumptions.",
    ],
    sectionOrder: buildSectionOrder("document-brief"),
    presentationVariant: "document-brief" as const,
    documentSections,
    text: `direct answer\nA linker controls how the carrier stays attached to, releases, or presents the active species.\n\n${buildDocumentText(documentSections)}`,
    summary: "linker selection trades stability, release trigger, payload compatibility, microenvironment processing, hydrophobicity, PK/PD, and safety.",
    topic: "Linker Strategy",
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
      evidenceVisualization: false,
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
      topic: "Linker Strategy",
      topModality: "Linker strategy",
      questionFrame: "concept",
      pendingClarifier: presentation.bestClarifier,
    },
    suggestedFollowUps: [
      "make this a table",
      "which linker for an internalizing ADC?",
      "which linker for oligo conjugates?",
      "how do PEG spacers change PK?",
      "how do we test premature cleavage?",
    ],
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
      factors: [
        {
          label: "concept-level linker overview",
          impact: "positive" as const,
          note: "this is an educational linker question, not a disease-ranking question.",
        },
      ],
      missingEvidence: [],
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
    if (normalizedCase.broadOncologyNoTarget) {
      const shortlist = getOncologyTargetShortlist(normalizedCase).slice(0, 5).join(", ");
      return `${diseaseLabel} is an under-specified oncology prompt, so the useful answer is target-first rather than winner-first. ADC logic is a plausible class-level starting lane, but it should not become a final recommendation until one target is selected from candidates such as ${shortlist} and checked for expression separation, internalization or retention, payload sensitivity, heterogeneity, and normal-tissue risk. confidence is still insufficient because ${missing}.`;
    }
    if (isCnsNeurodegenerationCase(normalizedCase, abstraction)) {
      return buildCnsNeuroDirectAnswer(normalizedCase);
    }
    if (isAutoimmuneExplorationCase(normalizedCase, abstraction)) {
      return buildAutoimmuneDirectAnswer(normalizedCase);
    }
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
  const cnsChronicDiseaseLevel =
    normalizedCase.recommendationScope === "disease-level" &&
    normalizedCase.diseaseArea === "other" &&
    normalizedCase.mechanismClass !== "cytotoxic delivery";

  if (item.gateStatus === "gated out") return "not viable";
  if (
    normalizedCase.broadOncologyNoTarget &&
    normalizedCase.diseaseArea === "oncology"
  ) {
    if (item.name === "adc") return confidence.abstain ? "provisional" : "conditional";
    return "conditional";
  }
  if (isCnsNeurodegenerationCase(normalizedCase)) {
    if (item.name === "oligo conjugate") return confidence.abstain ? "provisional" : item.name === topName ? "lead" : "conditional";
    if (item.name === "pdc" || item.name === "smdc" || item.name === "enzyme conjugate") return "conditional";
    if (item.name === "adc") return "not viable";
    if (item.name === "rdc") return "not viable";
  }
  if (isAutoimmuneExplorationCase(normalizedCase)) {
    if (item.name === "pdc" || item.name === "smdc" || item.name === "enzyme conjugate" || item.name === "oligo conjugate") return "conditional";
    if (item.name === "adc") return "not viable";
    if (item.name === "rdc") return "not viable";
  }
  if (confidence.abstain) {
    if (item.name === topName && item.gateStatus === "allowed") return "provisional";
    if (item.gateStatus === "allowed") return "conditional";
    if (item.gateStatus === "penalized") return "not viable";
    return "abstain";
  }

  if (
    cnsChronicDiseaseLevel &&
    ["adc", "pdc", "smdc", "rdc", "enzyme conjugate"].includes(item.name) &&
    item.name !== topName
  ) {
    return item.gateStatus === "allowed" ? "conditional" : "not viable";
  }

  if (item.name === topName) {
    return item.gateStatus === "allowed" ? "lead" : "provisional";
  }

  if (item.gateStatus === "allowed") return "conditional";
  if (item.gateStatus === "penalized") return "not viable";
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
      normalizedCase.broadOncologyNoTarget
        ? buildBroadOncologyModalityGateReason(item.name)
        : isCnsNeurodegenerationCase(normalizedCase)
          ? buildCnsNeuroModalityGateReason(item.name)
        : isAutoimmuneExplorationCase(normalizedCase)
          ? buildAutoimmuneModalityGateReason(item.name)
        : item.gateStatus === "allowed"
        ? item.fitReason
        : item.gateReasons?.[0] ?? item.fitReason,
    ),
    missingEvidence: completeSentence(
      normalizedCase.broadOncologyNoTarget
        ? buildBroadOncologyModalityMissingEvidence(item.name)
        : isCnsNeurodegenerationCase(normalizedCase)
          ? buildCnsNeuroModalityMissingEvidence(item.name)
        : isAutoimmuneExplorationCase(normalizedCase)
          ? buildAutoimmuneModalityMissingEvidence(item.name)
        : item.missingEvidence?.[0] ??
        (item.gateStatus === "allowed"
          ? "the target, delivery route, or payload logic is still not specific enough to lock this in"
          : "stronger disease, target, delivery, or payload evidence is still missing."),
    ),
    upgradeEvidence: completeSentence(
      normalizedCase.broadOncologyNoTarget
        ? buildBroadOncologyModalityUpgradeEvidence(item.name)
        : isCnsNeurodegenerationCase(normalizedCase)
          ? buildCnsNeuroModalityUpgradeEvidence(item.name)
        : isAutoimmuneExplorationCase(normalizedCase)
          ? buildAutoimmuneModalityUpgradeEvidence(item.name)
        : item.upgradeEvidence?.[0] ?? item.whatMustBeTrue ?? "show the missing biology and delivery assumptions directly.",
    ),
  }));
}

function buildBroadOncologyModalityGateReason(modality: string) {
  switch (modality) {
    case "adc":
      return "provisional oncology lane only: an ADC becomes credible if the tumor antigen is surface-accessible, sufficiently separated from normal tissue, and internalizes or processes payload well enough.";
    case "pdc":
      return "conditional lane only: a PDC needs a peptide or compact binder with real tumor localization, stability, and payload-tolerant uptake evidence.";
    case "smdc":
      return "conditional lane only: an SMDC needs a selective ligandable tumor handle that still binds after linker-payload attachment.";
    case "rdc":
      return "conditional lane only: an RDC needs target localization, retention, isotope choice, and dosimetry to be the therapeutic engine.";
    case "oligo conjugate":
      return "conditional lane only: an oligo conjugate becomes relevant if the cancer strategy is RNA, splice, gene-silencing, or pathway modulation rather than released cytotoxic payload.";
    case "enzyme conjugate":
      return "conditional lane only: an enzyme conjugate needs local catalysis, enzyme replacement, or prodrug activation to create selectivity.";
    default:
      return "conditional lane only: the class needs a named target, payload mechanism, and delivery route before it can be ranked responsibly.";
  }
}

function buildBroadOncologyModalityMissingEvidence(modality: string) {
  switch (modality) {
    case "adc":
      return "a named internalizing or processable surface antigen, tumor-normal expression window, payload sensitivity, and linker-release rationale";
    case "pdc":
      return "a tumor-localizing peptide or compact binder with stability, uptake/localization, and payload-tolerance data";
    case "smdc":
      return "a selective small-molecule ligandable tumor handle with linker-payload tolerance";
    case "rdc":
      return "a retained target plus isotope, chelator, range, and organ-dosimetry rationale";
    case "oligo conjugate":
      return "a causal transcript, splice event, or intracellular pathway plus productive delivery evidence";
    case "enzyme conjugate":
      return "a local catalytic or prodrug-activation mechanism that beats background activity";
    default:
      return "target, payload, and delivery evidence";
  }
}

function buildBroadOncologyModalityUpgradeEvidence(modality: string) {
  switch (modality) {
    case "adc":
      return "show antigen expression separation, internalization/lysosomal processing, payload sensitivity, bystander need, and normal-tissue safety window";
    case "pdc":
      return "show peptide binding/localization, plasma stability, tumor uptake, payload-tolerant attachment, and activity versus free payload";
    case "smdc":
      return "show ligand binding after conjugation, tumor retention, PK/clearance profile, and activity in target-positive versus target-negative models";
    case "rdc":
      return "show target retention, isotope range fit, tumor-to-organ dosimetry, and whether radiobiology rather than free-drug release drives efficacy";
    case "oligo conjugate":
      return "show target transcript dependency, productive intracellular delivery, and functional knockdown/splice/pathway activity in tumor-relevant cells";
    case "enzyme conjugate":
      return "show localized activation, catalytic turnover in the disease compartment, low background activation, and a safety advantage over direct payload delivery";
    default:
      return "show the missing target, payload, and delivery assumptions directly";
  }
}

function buildCnsNeuroModalityGateReason(modality: string) {
  switch (modality) {
    case "oligo conjugate":
      return "provisional CNS lane: strongest when the biology is sequence-directed, splice-directed, or gene/pathway modulation and the delivery route can create productive CNS cell exposure.";
    case "pdc":
      return "conditional CNS lane: a peptide or compact binder can help only if it brings real BBB/CSF transport, cell-type bias, uptake, or endosomal escape instead of generic binding.";
    case "smdc":
      return "conditional CNS lane: a small-molecule conjugate is worth testing when the ligand gives a real transport, organelle, or disease-compartment handle and still works after conjugation.";
    case "enzyme conjugate":
      return "conditional CNS lane: an enzyme strategy needs enzyme replacement, local prodrug activation, lysosomal rescue, or another catalytic mechanism that is central to the disease biology.";
    case "adc":
      return "usually not the lead in neurodegeneration: classical cytotoxic ADC logic does not fit chronic neuronal disease unless there is an explicit selective cell-ablation hypothesis.";
    case "rdc":
      return "usually not the lead in neurodegeneration: radioligand logic needs retention and isotope dosimetry to be the therapeutic engine, which is uncommon for broad chronic CNS pathway modulation.";
    default:
      return "rank only after the CNS biology, entry route, and active species are made explicit.";
  }
}

function buildCnsNeuroModalityMissingEvidence(modality: string) {
  switch (modality) {
    case "oligo conjugate":
      return "the disease-driving transcript or splice/pathway target, CNS delivery route, relevant cell type, and productive intracellular exposure";
    case "pdc":
      return "a peptide or compact binder with believable BBB/CSF transport, neuron/glia localization, uptake, stability, and payload-tolerant activity";
    case "smdc":
      return "a ligandable CNS entry, cell-type, organelle, or disease-compartment handle that keeps binding and exposure after linker-payload attachment";
    case "enzyme conjugate":
      return "a catalytic, lysosomal, enzyme-replacement, or local prodrug-activation rationale tied to the disease mechanism";
    case "adc":
      return "a non-cytotoxic antibody-like delivery hypothesis or a justified selective cell-ablation target with a chronic safety window";
    case "rdc":
      return "target retention, isotope choice, brain or lesion dosimetry, and a reason radiobiology is preferable to pathway modulation";
    default:
      return "a named CNS entry route, target biology, trafficking route, and active species";
  }
}

function buildCnsNeuroModalityUpgradeEvidence(modality: string) {
  switch (modality) {
    case "oligo conjugate":
      return "show target transcript dependency, CNS exposure, cell-compartment delivery, and functional knockdown, splice correction, or pathway rescue";
    case "pdc":
      return "show peptide binding or transport, plasma/CSF stability, CNS cell uptake, intracellular activity, and tolerability under repeat dosing";
    case "smdc":
      return "show ligand retention after conjugation, brain or compartment exposure, functional activity, and safety against high-exposure normal tissues";
    case "enzyme conjugate":
      return "show local catalytic turnover or replacement benefit, low background activation, CNS exposure, and disease-relevant rescue";
    case "adc":
      return "show that the antibody format is being used for non-cytotoxic delivery or that selective cell depletion is both disease-relevant and safe";
    case "rdc":
      return "show lesion localization, retention, isotope range fit, dosimetry, and a therapeutic window that beats non-radioactive strategies";
    default:
      return "show the CNS delivery assumption and disease mechanism directly in disease-relevant models";
  }
}

function buildAutoimmuneModalityGateReason(modality: string) {
  switch (modality) {
    case "pdc":
      return "conditional autoimmune lane: useful only if a peptide, compact binder, or ligand can bias exposure toward FcRn, complement, immune-cell, autoantigen, or tissue-protective biology.";
    case "smdc":
      return "conditional autoimmune lane: useful only if a small ligand can selectively modulate an immune pathway or tissue compartment without broad immune toxicity.";
    case "oligo conjugate":
      return "conditional autoimmune lane: relevant when the strategy is transcript or pathway modulation in immune cells or affected tissue, not when the main job is extracellular antibody neutralization.";
    case "enzyme conjugate":
      return "conditional autoimmune lane: relevant if local catalytic control, prodrug activation, complement processing, or enzyme-like immune reset is the selectivity engine.";
    case "adc":
      return "usually not the lead in chronic autoimmune disease: classical cytotoxic ADC logic risks broad immune depletion unless selective cell ablation is explicitly the goal.";
    case "rdc":
      return "usually not the lead in autoimmune disease: radioligand logic needs target retention and dosimetry to be the therapeutic engine, which rarely matches chronic immune modulation.";
    default:
      return "rank only after the immune mechanism, tissue compartment, and active species are explicit.";
  }
}

function buildAutoimmuneModalityMissingEvidence(modality: string) {
  switch (modality) {
    case "pdc":
      return "a peptide or compact binder with immune-mechanism selectivity, tissue localization, stability, and functional immune readout.";
    case "smdc":
      return "a ligandable immune or tissue-protective handle that keeps potency and selectivity after conjugation.";
    case "oligo conjugate":
      return "a causal transcript or pathway in immune cells or affected tissue plus productive delivery and functional modulation.";
    case "enzyme conjugate":
      return "a catalytic, prodrug, complement-processing, or enzyme-replacement rationale tied to autoimmune mechanism execution.";
    case "adc":
      return "a selective immune-cell depletion target, non-cytotoxic antibody-like delivery role, or strong reason broad immune depletion is safe.";
    case "rdc":
      return "target retention, isotope choice, dosimetry, and a reason radiobiology fits better than immune modulation.";
    default:
      return "a named immune mechanism, target or compartment, active species, and functional disease readout.";
  }
}

function buildAutoimmuneModalityUpgradeEvidence(modality: string) {
  switch (modality) {
    case "pdc":
      return "show binding or localization, immune-pathway engagement, functional disease rescue, stability, and repeat-dose tolerability.";
    case "smdc":
      return "show ligand selectivity after conjugation, pathway modulation, tissue exposure, and preserved normal immune function.";
    case "oligo conjugate":
      return "show target transcript dependency, delivery to the relevant immune or tissue cell, and functional pathway modulation.";
    case "enzyme conjugate":
      return "show localized catalytic turnover or activation, low background activity, functional rescue, and a safety advantage over direct dosing.";
    case "adc":
      return "show selective depletion is disease-relevant, durable, and safer than existing immune-targeted biologics.";
    case "rdc":
      return "show target retention, organ dosimetry, and a therapeutic window that makes radiobiology central.";
    default:
      return "show the autoimmune mechanism and functional disease readout directly.";
  }
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

function looksLikePlaceholderTargetLabel(value?: string | null) {
  const text = String(value ?? "")
    .trim()
    .toLowerCase();

  if (!text) return true;

  return /^(i have|we have|there is|there's|a|an)\s+(a\s+)?target antigen(\s+and\s+a\s+payload)?(\s+for\s+.+)?$/.test(text) ||
    /^(target antigen|target antigen and payload|payload|target biology|entry handle|target)$/.test(text);
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

  return cleaned;
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

  return /^(protein|target protein|target density|density|cell-type trafficking|cell trafficking|trafficking|linker|payload|oligo|oligonucleotide|antibody|peptide|carrier|dar|drug antibody ratio|chemistry|chemistries|format|construct|selection|recommendation)$/.test(
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

function looksLikeExplicitConstructQuestion(prompt: string) {
  return /(what protein|which protein|what binder|which binder|what carrier|which carrier|what antibody|which antibody|what nanobody|which nanobody|what scfv|which scfv|what fab|which fab|what vhh|which vhh|what format|which format|what linker|which linker|what payload|which payload|what chemistr(?:y|ies)|which chemistr(?:y|ies)|what conjugation chemistry|which conjugation chemistry|what oligo|which oligo|what dar|which dar|drug[- ]?to[- ]antibody ratio|drug antibody ratio)/i.test(
    prompt,
  );
}

function detectContextualRefinement(
  prompt: string,
  previousResult?: PreviousPlannerResult | null,
): ContextualRefinementIntent | null {
  if (!previousResult) return null;
  const explicitConstructQuestion = looksLikeExplicitConstructQuestion(prompt);

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
  if (/(make this into a table|make this a table|make it a table|summari[sz]e in a table|show a table|put this in a table|make a table|mechanism table|strategy table|comparison table|checklist|go\/no-go|go no go|what experiment|which assay|test first|give me links|evidence links|show sources|show evidence|no papers|why not|why avoid|why wouldn'?t)/i.test(normalizedPrompt)) {
    return null;
  }
  if (!explicitConstructQuestion && detectFollowUpIntent(prompt, previousResult)) return null;

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
  const parsedPrompt = parseConjugateQuery(prompt, {});
  const normalizedPromptCase = normalizeConjugateCase(parsedPrompt, {});
  const introducesFreshDiseaseOrTarget =
    (Boolean(parsedPrompt.diseaseMention) &&
      !looksLikeConversationPhrase(parsedPrompt.diseaseMention) &&
      normalize(normalizedPromptCase.disease?.canonical ?? parsedPrompt.diseaseMention ?? "") !== normalize(slots.disease ?? "")) ||
    (Boolean(parsedPrompt.targetMention) &&
      !looksLikeConversationPhrase(parsedPrompt.targetMention) &&
      !looksLikeGenericConstructNoun(parsedPrompt.targetMention) &&
      normalize(normalizedPromptCase.target?.canonical ?? parsedPrompt.targetMention ?? "") !== normalize(slots.target ?? "")) ||
    (Boolean(normalizedPromptCase.disease?.canonical) &&
      !looksLikeConversationPhrase(normalizedPromptCase.disease?.canonical) &&
      normalize(normalizedPromptCase.disease?.canonical ?? "") !== normalize(slots.disease ?? "")) ||
    (Boolean(normalizedPromptCase.target?.canonical) &&
      !looksLikeGenericConstructNoun(normalizedPromptCase.target?.canonical) &&
      normalize(normalizedPromptCase.target?.canonical ?? "") !== normalize(slots.target ?? ""));

  if (/(why is .* both|both .* not really viable|contradict|inconsistent|doesn.t make sense)/i.test(normalized)) {
    return { kind: "contradiction" };
  }
  if (
    /pmp22/i.test(slots.target ?? "") &&
    /(cmt1a|hnpp|same construct|same conjugate|same strategy|same one|work for both)/i.test(normalized)
  ) {
    return { kind: "design-decision" };
  }
  if (
    modality &&
    !/(checklist|go\/no-go|go no go|parameter)/i.test(normalized) &&
    /(toxicity|toxic|off-target|unsafe|safety|wouldn.?t|would not|cause harm|too risky)/i.test(normalized)
  ) {
    return { kind: "why-not", modality };
  }
  if (/(why not|why avoid|why wouldn'?t|why would not).*(cytotoxic|cell kill|cell-kill|cell killing|warhead)/i.test(normalized)) {
    return { kind: "why-not", modality: "adc" };
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
  if (/(make this into a table|make this a table|make it a table|summari[sz]e in a table|show a table|put this in a table|make a table|compact table|ranked .*table|conditional .*table|row must include|mechanism table|strategy table|comparison table)/i.test(normalized)) {
    return { kind: "table" };
  }
  if (/(no[- ]?hallucination|hallucinat|hypothesis.*evidence|evidence.*hypothesis)/i.test(normalized)) {
    return { kind: "design-decision" };
  }
  if (
    /(checklist|parameter checklist|parameters|design checklist|go\/no-go checklist|go no go checklist|decision checklist|no[- ]?hallucination checklist|what should i consider|what do i need to take care of|what should i optimize|focus only on .*parameters)/i.test(
      normalized,
    )
  ) {
    return { kind: "parameter-framework" };
  }
  if (/(hpa|human protein atlas|open targets|uniprot|reactome|expression atlas|ncbi gene|omim|repositories?|repository|no entry|no hit|not found)/i.test(normalized)) {
    return { kind: "design-decision" };
  }
  if (/(protein recommendation|protein[- ]format|protein scaffold|nanobody|vhh|scfv|fab\b|igg|kappa|lambda|fc\b|minibody|half antibody|sip\b|small immunoprotein|affibody|adnectin|anticalin|darpin|knottin|abdurin|bispecific|trispecific|multispecific|tandem scfv|igg-scfv|igg-dab|scfv-fc-scfv|kih|kappa-lambda|cyclic peptide|affinity|avidity|sparse antigen|sparsely expressed|low antigen|high antigen|heavily expressed|antigen density|antigen location|antigen localization|antigen is everywhere|normal tissue expression|surface antigen|extracellular antigen|secreted antigen|shed antigen|shedding|target[- ]bearing cell|cell type|cell state|activation state|internalization biology|interernalization|receptor biology|endocytosis|clathrin|caveolin|macropinocytosis|recycling|degradation|lysosomal|endosomal|transcytosis|hypoxia|hypoxic|acidic|low ph|ph\b|protease|protease-rich|stroma|stromal|fibrosis|fibrotic|interstitial pressure|vascular permeability|necrosis|necrotic|immune microenvironment|tumor microenvironment)/i.test(normalized)) {
    return { kind: "design-decision" };
  }
  if (/(give me links|evidence links|show sources|show evidence|show me the evidence|show the evidence|what evidence|evidence anchors?|precedent anchor|source)/i.test(normalized)) {
    return { kind: "evidence" };
  }
  if (/(explain the ranking|what does .*score mean|why did you choose|why .* lead|explain this ranking)/i.test(normalized)) {
    return { kind: "ranking" };
  }
  if (/(make it simpler|make this simpler|simplify|tl;dr|short enough|short for|compress for)/i.test(normalized)) {
    return { kind: "simplify" };
  }
  if (/(make it more technical|more technical|for a scientist|scientist version|go deeper technically|technical explanation)/i.test(normalized)) {
    return matchedLane || promptKeepsCurrentLane
      ? { kind: "lane-detail", laneLabel: matchedLane?.label ?? latestLaneLabel ?? "current lane" }
      : { kind: "design-decision" };
  }
  if (/(what would you test first|what do you test first|what should i test first|first validation step|what first experiment|what experiment|which assay|assay plan)/i.test(normalized)) {
    return { kind: "first-test" };
  }
  if (
    /(microenvironment|hypoxia|hypoxic|acidic|low ph|ph\b|protease|protease-rich|stroma|stromal|interstitial pressure|vascular permeability|necrosis|necrotic|heterogeneous|heterogeneity|target-low|bystander|kadcyla|construct recommendation|toxicity risks?|normal[- ]tissue|normal tissue|normal bone|normal muscle|normal organ|gut epithelium|marrow|sparse antigen|sparsely expressed|low antigen|high antigen|heavily expressed|antigen density|antigen location|antigen localization|antigen is everywhere|normal tissue expression|surface antigen|extracellular antigen|secreted antigen|shed antigen|shedding|target[- ]bearing cell|cell type|cell state|activation state|transport handle|receptor|receptor downmodulation|downmodulation|desensitization|receptor saturation|uptake handle|delivery handle|entry handle|brain[- ]?entry|csf|bbb|bulk brain|brain homogenate|homogenate exposure|target engagement|cell compartment|compartment matters|active species|selection rule|decision tree|failure tree|failure analysis|red-team|first[- ]?90|90[- ]?days|alpha[- ]?synuclein|synuclein|lysosomal|lysosomes?|autophagy|mitochondrial|neuroinflammation|antigen biology|target biology|disease biology|biological point|biology point|biology .*proven|biology should be proven|no papers|no literature|without making up|making up facts|analogy|hallucinating equivalence|mechanisms? can .*exploit|exploit .*mechanism|fcrn|complement|autoantigen|tolerance|immune[- ]cell depletion|intracellular|mutational|surface antigen|surface-expressed|cell-state|kras|braf|mapk|macrophage|histiocyte|neoplastic|lesion|patient-derived|stellate|kupffer|hepatocyte|galnac|fibrosis|liver uptake|off-liver|enzyme activity|glycan|chaperone|substrate clearance|plasma half-life|tissue uptake|kidney|heart|endothelial|nervous-system|compare .*fcrn|compare .*complement|compare .*egfr|compare .*her2|compare .*cd30|compare .*target|compare .*antigen|compare .*carrier|compare .*antibody|compare .*mechanism|immune.*neuronal.*metabolic|enzyme replacement.*oligo|antibody.*peptide.*oligo|rdc .*adc|adc .*rdc|better than adc|better than rdc|egfr .*her2|her2 .*egfr|fcrn .*complement|complement .*fcrn|what target would make|what would make .* viable|what makes .* viable|make .* viable|upgrade .* viable|best antigen|which antigen|what antigen|best target|which target|what target|tarhet|payload class|payload mechanisms?|payload release|cytotoxic payload|what linker|which linker|what payload|which payload|what carrier|which carrier|carriers|what format|which format|what chemistr|which chemistr|what conjugation chemistry|which conjugation chemistry|step[- ]?by[- ]?step|stepwise|design .*modality|design .*construct|how .*design .*modality|how .*final product|final product|construct specification|product specification|what to add|how much to add|order to add|loading|stoichiometry|valency|ligand density|cargo density|antigen density|linker would you avoid|what protein will work best|which binder|full antibody|full igg|antibody|peptide|small molecule|nanoparticle|fc\b|fc[- ]?fusion|fav\b|minibody|nanobody|monoclonal|monospecific|bispecific|trispecific|multispecific|probody|masked|conditionall?y activated|immune engager|degrader|molecular glue|enzyme format|enzyme conjugate|enzyme or prodrug|prodrug logic|could oligo|oligo conjugate|oligo conjugates? work|aso\b|sirna|pmo\b|newer modalit|innovative modalit|innovation|innovative|next[- ]?gen|local[- ]activation|cautious construct|hypothesis|evidence|hallucinat|scfv|vhh|fab|dar\b|drug[- ]?to[- ]?antibody|moa\b|mechanism of action|pk\/pd|pkpd|\bpk\b|\bpd\b|adverse|side effects?|dose[- ]limiting|dlt\b|chelator|radionuclide|radioligand|peripheral nerve|off-organ|off organ|internalization|retention|trafficking risks?|uptake risks?|escape risks?|uptake assays?|endosome|endosomal|why can'?t you pick|why cant you pick|pick .* analogy|by analogy|sponsor insists|shortest recommendation|final design recommendation|final recommendation|safest provisional strategy|one paragraph|keep uncertainty)/i.test(
      normalized,
    )
  ) {
    return { kind: "design-decision" };
  }
  if (
    !introducesFreshDiseaseOrTarget &&
    promptWords.length <= 22 &&
    /^(if|what|which|how|give|make|now|compare|compress|summarize|summarise|design)\b/i.test(prompt.trim())
  ) {
    return { kind: "design-decision" };
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
        /toxicity|toxic|off-target|unsafe|safety|wouldn.?t|would not|cytotoxic|cell kill|cell-kill|cell killing|warhead/i.test(normalizedPrompt);
      const cytotoxicPayloadChallenge = /cytotoxic payload|cell[- ]?killing payload|warhead/i.test(normalizedPrompt);
      const chronicNonOncologyContext =
        contextResult.trace?.normalization?.diseaseArea !== "oncology" ||
        /storage syndrome|cardiomyopathy|autoimmune|neuropathy|chronic|non-cytotoxic/i.test(getPreviousContextLabel(contextResult));
      const chronicTargetAdcChallenge = intent.modality === "adc" && chronicNonOncologyContext;
      followUpAnswer = {
        kind: "why-not",
        title: cytotoxicPayloadChallenge ? "why not a cytotoxic payload" : `why not ${intent.modality}`,
        answer:
          chronicTargetAdcChallenge
            ? "ADC is the wrong default when the disease biology calls for chronic mechanism correction rather than selective cell killing. a cytotoxic payload can damage useful cells, narrow the safety window, and miss the actual disease mechanism."
            : cytotoxicPayloadChallenge && chronicNonOncologyContext
            ? "a cytotoxic payload is usually the wrong default here because the disease goal is mechanism correction, pathway support, enzyme or lysosomal rescue, or immune modulation, not selective cell killing. in a chronic non-oncology setting, cytotoxic exposure can destroy useful cells, narrow the safety window, and distract from the actual disease mechanism."
            : toxicityChallenge && intent.modality === "adc" && cnsChronicCase
            ? "yes — adc-style cytotoxicity is a major concern here. chronic cns neurodegeneration is not a cell-ablation setting, so a classical antibody-plus-cytotoxic payload program would usually create toxicity pressure without solving the real biology or brain-delivery problem."
            : whyNotMatch
              ? whyNotMatch.primaryReason
              : rankingMatch?.mainReasonAgainst ?? rankingMatch?.limitReason ?? `there still is not enough from the last answer to make ${intent.modality} a confident lead.`,
        bullets: [
          chronicTargetAdcChallenge
            ? "better fit: non-cytotoxic delivery, RNA/pathway modulation, enzyme/supportive biology, or immune-state control only if the mechanism supports it."
            : "",
          chronicTargetAdcChallenge
            ? "core readout: disease-relevant functional rescue, not target binding alone."
            : "",
          chronicTargetAdcChallenge
            ? "upgrade ADC only if there is a separate, selective cell-ablation hypothesis with a strong normal-tissue safety window."
            : "",
          cytotoxicPayloadChallenge && chronicNonOncologyContext
            ? "first ask what mechanism needs correction: lysosomal trafficking, enzyme activity, transcript modulation, pathway support, or immune-state control."
            : "",
          cytotoxicPayloadChallenge && chronicNonOncologyContext
            ? "upgrade cytotoxic logic only if there is a real disease-relevant cell-ablation hypothesis and a strong normal-tissue safety window."
            : "",
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
        bullets: (contextResult.evidenceAnchors ?? [])
          .slice(0, 6)
          .map((item) => item.href ? `${item.label}: ${item.href}` : item.label),
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
          : latestFollowUp && latestFollowUp.kind !== "clarify"
            ? `i’m still talking about the same case. to make ${latestFollowUpFocus} clearer: ${latestFollowUp.answer}`
            : contextResult.presentation?.mode === "recommended-starting-point"
              ? `i’m still talking about the same recommendation: ${contextResult.topPick ?? "the current lead"} is ahead because it matches the biology and delivery logic from the last answer better than the other classes.`
              : `i’m still talking about the same case: there isn’t a final recommendation yet, but the last answer narrowed the field to the most plausible strategy lanes without pretending the missing biology is already solved.`,
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
    case "parameter-framework": {
      const contextLabel = getPreviousContextLabel(contextResult);
      const normalizedPrompt = normalize(prompt);
      const focus =
        /protein|carrier|binder|vhh|scfv|fab|igg|fc\b|fc[- ]?fusion|minibody|nanobody/.test(normalizedPrompt)
          ? "protein carrier and format parameters"
          : /linker/.test(normalizedPrompt)
            ? "linker and release parameters"
            : /payload/.test(normalizedPrompt)
              ? "payload and active-species parameters"
              : /traffic|escape|uptake|internalization/.test(normalizedPrompt)
                ? "trafficking and compartment-access parameters"
                : /go\/no-go|go no go|decision/.test(normalizedPrompt)
                  ? "go/no-go decision parameters"
                  : "the key design parameters";
      const parameterRows =
        focus === "protein carrier and format parameters"
          ? [
              "carrier size: compare vhh/nanobody, scfv, fab, f(ab')2, minibody, fc-fusion, and full igg only after deciding whether access or half-life is the limiting factor.",
              "brain-entry handle: define whether receptor-mediated transport, csf dosing, or another route is supposed to create exposure.",
              "binding after attachment: confirm the payload/linker does not destroy antigen binding or transport-handle function.",
              "productive trafficking: measure whether binding becomes useful intracellular or tissue exposure, not just uptake.",
            ]
          : focus === "linker and release parameters"
            ? [
                "plasma stability: make sure the construct survives circulation or dosing long enough to reach the intended tissue.",
                "release compartment: choose release logic only after deciding whether activity needs lysosomal processing, cytosolic release, or stable attachment.",
                "payload compatibility: verify that the linker leaves the active species usable after processing.",
                "safety window: avoid release logic that creates broad normal-tissue exposure before target engagement.",
              ]
            : focus === "payload and active-species parameters"
              ? [
                  "therapeutic event: define whether the payload is gene modulation, pathway modulation, cytotoxicity, radiobiology, or catalysis.",
                  "compartment need: choose payload chemistry around where the active species has to work.",
                  "payload burden: check whether payload size or charge breaks binding, exposure, or transport.",
                  "comparator: keep a simpler payload or unconjugated control visible so the conjugate earns its complexity.",
                ]
              : focus === "trafficking and compartment-access parameters"
                ? [
                    "binding-to-uptake conversion: separate surface binding from internalization.",
                    "processing route: measure whether the construct reaches the compartment that can release or activate the payload.",
                    "productive escape: for oligo or intracellular cargo, quantify activity in the right compartment rather than total uptake.",
                    "cell-state variability: test the route in disease-relevant cells, not only an easy overexpression model.",
                  ]
                : [
                    "biology fit: the therapeutic mechanism must match the disease problem.",
                    "entry handle: the target, receptor, transport route, or localization handle has to be real.",
                    "delivery execution: exposure must reach the disease-relevant tissue and compartment.",
                    "active-species logic: payload, linker, and carrier have to preserve the mechanism after conjugation.",
                    "safety window: repeat dosing, off-target exposure, and normal-tissue expression must remain acceptable.",
                  ];

      followUpAnswer = {
        kind: "parameter-framework",
        title: focus,
        answer: `staying on ${contextLabel}, here is the parameter view instead of another ranking. use this as the checklist for deciding what to optimize next.`,
        bullets: parameterRows,
        usedPreviousResult: true,
      };
      break;
    }
    case "design-decision": {
      const contextLabel = getPreviousContextLabel(contextResult);
      const normalizedPrompt = normalize(prompt);
      const requestedModality = findFollowUpModality(prompt);
      const requestedWhyNot = requestedModality
        ? previousWhyNot.find((item) => item.modality.toLowerCase().trim() === requestedModality)
        : undefined;
      const requestedRanking = requestedModality
        ? previousRanking.find((item) => item.name.toLowerCase().trim() === requestedModality)
        : undefined;
      const mentionedTargetNames = [
        ["HER2", /\bher2\b|\berbb2\b/i],
        ["EGFR", /\begfr\b|\berbb1\b/i],
        ["TROP2", /\btrop[- ]?2\b|\btacstd2\b/i],
        ["CEACAM5", /\bceacam5\b/i],
        ["B7-H3", /\bb7[- ]?h3\b|\bcd276\b/i],
        ["CD30", /\bcd30\b|\btnfrsf8\b/i],
      ]
        .filter(([, pattern]) => (pattern as RegExp).test(prompt))
        .map(([label]) => label as string);
      const targetOptions = "ADC becomes much more credible when the target is a selective cell-surface antigen with meaningful disease-vs-normal expression separation, productive internalization or retention, and a therapeutic rationale for the payload.";
      const contextTarget = slots.target ?? contextResult.trace?.normalization?.target?.canonical ?? "";
      const contextLower = normalize(`${contextLabel} ${contextTarget}`);
      const leadModality = normalize(String(requestedModality ?? contextResult.topPick ?? contextResult.ranking?.[0]?.name ?? ""));
      const designContext = normalize(
        [
          leadModality,
          contextLower,
          contextResult.presentation?.rationale,
          contextResult.topPickWhy,
          ...(contextResult.presentation?.mode === "best-current-strategy-direction"
            ? contextResult.presentation.strategyLanes ?? []
            : []),
          ...(contextResult.exploration?.strategyBuckets ?? []).map((bucket) => bucket.label),
        ].filter(Boolean).join(" "),
      );
      const adcLikeDesign = /adc|antibody|targeted cytotoxic|cytotoxic delivery|cell[- ]?killing|payload delivery|cd30|cldn18|her2|egfr|trop2|ceacam5|b7-h3|oncology/i.test(designContext);
      const rdcLikeDesign = /rdc|radioligand|radioconjugate|psma|chelator|radionuclide|dosimetry/i.test(designContext);
      const oligoLikeDesign = /oligo|aso|sirna|pmo|rna|pmp22|gene|transcript/i.test(designContext);
      const nonCytotoxicDesign = /non-cytotoxic|immune|fcrn|complement|myasthenia|parkinson|neuropathy|pmp22|xyzr17/i.test(designContext);
      const answerParts =
        /(step[- ]?by[- ]?step|design .*modality|design .*construct|how .*design .*modality|how .*final product|final product|construct specification|product specification|what to add|how much to add|order to add)/i.test(normalizedPrompt)
          ? {
              title: "step-by-step construct design plan",
              answer: `for ${contextLabel}, i would turn the suggested modality into a build plan by moving from biology to construct, not the other way around. the order should be: prove the target and trafficking logic, choose the active species, choose linker/release behavior, set loading or DAR, pick chemistry that preserves the MOA, then stress-test PK/PD and safety before polishing the final product.`,
              bullets: [
                `1. lock the biological job: define the disease-driving cell, target or entry handle, active compartment, and expected MOA. if internalization is weak, avoid designs that require lysosomal payload release; prefer retention, bystander, radiolocalization, shuttle, or non-cytotoxic pathway logic only if those fit the biology.`,
                adcLikeDesign
                  ? "2. choose the carrier: start with full IgG or engineered antibody only if target density, tumor-normal separation, and internalization support it; move to Fab, scFv, VHH, bispecific, or masked formats if penetration, heterogeneity, or normal-tissue expression is the real barrier."
                  : rdcLikeDesign
                    ? "2. choose the targeting format: start with ligand, peptide, antibody fragment, or antibody only after target localization and retention are proven; compact formats often win if fast clearance improves tumor-to-organ dosimetry."
                    : oligoLikeDesign
                      ? "2. choose the delivery format: start with the active oligo/RNA cargo, then add the smallest credible shuttle, peptide, antibody fragment, ligand, or receptor handle that improves productive intracellular delivery."
                      : "2. choose the carrier: use the smallest format that can reach the relevant tissue and preserve the mechanism; do not default to full IgG unless half-life and binding are more important than access or trafficking.",
                adcLikeDesign
                  ? "3. choose payload and linker together: use a cytotoxic payload only if cell killing is the intended MOA; use cleavable linker plus membrane-permeable payload when bystander effect is needed, and non-cleavable or more stable linker when target cells internalize well and safety is tight."
                  : rdcLikeDesign
                    ? "3. choose isotope and chelator together: match isotope range and half-life to lesion size and target retention; choose chelator/spacer chemistry that keeps metal stability, affinity, clearance, and organ dosimetry interpretable."
                    : oligoLikeDesign
                      ? "3. choose cargo chemistry and release logic: ASO, siRNA, or PMO choice depends on nuclear RNase-H/splice logic versus cytosolic RISC logic; the attachment should preserve nuclease stability, uptake, endosomal escape, and active strand function."
                      : "3. choose the active species: keep it non-cytotoxic unless selective cell depletion is the actual disease mechanism; match release or retained-attachment logic to where the payload must work.",
                adcLikeDesign
                  ? "4. set DAR/loading: start around DAR 2-4 for an ADC first pass, then compare lower and higher loading only after binding, aggregation, plasma stability, internalization, release, PK, and safety stay acceptable."
                  : rdcLikeDesign
                    ? "4. set loading/labeling: for RDCs, think chelator-to-carrier ratio and radiolabeling efficiency rather than DAR; keep specific activity high enough for efficacy without creating instability or off-organ isotope exposure."
                    : oligoLikeDesign
                      ? "4. set cargo stoichiometry: translate DAR into oligo copy number or ligand density; start low enough that uptake, PK, and intracellular activity are interpretable before increasing valency."
                      : "4. set loading: use the minimum loading that gives mechanism engagement, because excess payload, ligand density, or cargo valency can hurt PK, tissue access, aggregation, and safety.",
                adcLikeDesign
                  ? "5. pick chemistry: use cysteine or site-specific chemistry first when DAR control and PK interpretability matter; use lysine only for fast feasibility. avoid any chemistry that reduces antigen binding, blocks internalization, changes Fc behavior, or creates unstable deconjugation."
                  : rdcLikeDesign
                    ? "5. pick chemistry: prioritize chelator stability and spacer effects over classical release chemistry. the wrong chelator or spacer can ruin affinity, clearance, kidney/salivary exposure, or isotope retention even if target binding looks good."
                    : oligoLikeDesign
                      ? "5. pick chemistry: use handle-preserving oligo attachment, peptide/ligand conjugation, or click-style modular chemistry only if it preserves active oligo function. reject chemistry that traps cargo in endosomes or kills transcript activity."
                      : "5. pick chemistry: choose the simplest attachment that preserves binding, active-species function, stability, and PK. chemistry is not neutral; it can make the intended MOA impossible.",
                "6. build in this order: unconjugated carrier or binder first, carrier plus linker/handle second, loaded conjugate third, then matched low/mid/high loading variants. do not vary carrier, linker, payload, and loading all at once.",
                "7. prove function: run binding, internalization or retention, trafficking, release/active-species activity, PK stability, target-positive versus target-negative activity, and normal-cell safety in the same decision package.",
                "8. final product shape: a named carrier plus named target/entry handle plus linker/release logic plus active species plus loading/DAR/chelator ratio plus chemistry route, with a short reason each part is included and a kill criterion for removing it.",
              ],
            }
          : /(protein recommendation|provisional protein|safest .*protein|final protein|final design recommendation|final recommendation|safest provisional strategy|one paragraph|keep uncertainty|shortest recommendation|honest provisional|provisional direction|practical provisional|safest answer)/i.test(normalizedPrompt)
          ? {
              title: /protein/i.test(normalizedPrompt) ? "safest provisional protein-format recommendation" : "safest provisional recommendation",
              answer: /protein/i.test(normalizedPrompt)
                ? `for ${contextLabel}, the safest protein recommendation is conditional: compare the simplest binder or carrier formats that match the current biology, then upgrade only if expression, binding-after-conjugation, target-bearing cell processing, PK/PD, and safety data justify it. do not choose IgG, compact scaffolds, peptides, Fc extension, multispecifics, enzymes, PEG, albumin binding, or other modifications from a saved playbook.`
                : `for ${contextLabel}, the safest provisional recommendation is to keep the current lead as a hypothesis, not a winner. choose the construct family by the current disease mechanism, entry handle, target-bearing cell processing, microenvironment pressure, payload compartment, PK/PD, and safety window, then upgrade confidence only after direct target and functional evidence.`,
              bullets: [
                "keep uncertainty visible: label the lead provisional until target expression, trafficking, mechanism execution, PK/PD, and safety are measured.",
                "do not borrow a target list, protein format, payload, or disease playbook from a familiar case unless direct evidence supports it here.",
                "next experiment: test the highest-risk biology gate first, then optimize chemistry, DAR, linker, or isotope only after the mechanism survives.",
              ],
            }
          : /(target[- ]?validation cascade|validation cascade|before naming adc|before naming .*modality)/i.test(normalizedPrompt)
            ? {
                title: "target-validation cascade before modality ranking",
                answer: `for ${contextLabel}, validate the target before naming ADC, PDC, SMDC, RDC, oligo, or enzyme as the lead. the cascade is disease biology, target presence, normal-tissue window, accessibility, internalization or retention, payload compatibility, PK/PD, and functional rescue.`,
                bullets: [
                  "1. disease biology: define the causal cell, compartment, and therapeutic event.",
                  "2. target biology: verify expression with Human Protein Atlas, UniProt, Open Targets, omics/surfaceome data, and disease-relevant samples.",
                  "3. modality gate: ADC needs internalization/release, RDC needs retention/dosimetry, oligo needs productive intracellular delivery, enzyme needs catalytic or replacement logic.",
                  "4. safety gate: map normal tissue, repeat dosing, payload toxicity, immunogenicity, and off-target exposure before optimization.",
                ],
              }
          : /(decide between|choose between|which logic).*?(igg|compact protein|compact|peptide|oligo|enzyme|radioligand)|igg.*compact.*peptide.*oligo.*enzyme.*radioligand/i.test(normalizedPrompt)
            ? {
                title: "modality and format decision rule",
                answer: `for ${contextLabel}, decide between IgG, compact protein, peptide, oligo, enzyme, or radioligand logic by matching each option to the biology gate it uniquely solves. do not let the abbreviation lead; let disease mechanism, target biology, target-bearing cell processing, microenvironment, PK/PD, and active-compartment access choose the construct family.`,
                bullets: [
                  "IgG / Fc: strongest when half-life, mature CMC, valency, and controlled DAR matter more than penetration or rapid clearance.",
                  "compact protein or peptide: stronger when tissue access, barrier pressure, fast distribution, or reduced residence is more important than long exposure.",
                  "oligo: choose only when transcript, splice, RNA, or gene/pathway modulation is the therapeutic event and productive intracellular delivery is plausible.",
                  "enzyme: choose only when catalysis, replacement, local processing, or prodrug activation is the selectivity engine.",
                  "radioligand: choose only when localization, retention, isotope range, chelator stability, and organ dosimetry are the therapeutic engine.",
                  "unknown-target rule: keep every branch conditional until expression, density, trafficking, microenvironment fit, PK/PD, and safety are measured.",
                ],
              }
          : /(homogenate exposure|neuronal target engagement|bulk brain|brain homogenate)/i.test(normalizedPrompt)
            ? {
                title: "bulk exposure versus neuronal target engagement",
                answer: `for ${contextLabel}, if a shuttle improves brain homogenate exposure but not neuronal target engagement, the failure is productive delivery. the construct may cross endothelium or raise bulk brain signal without reaching the relevant neuron, glial cell, cytosol, nucleus, lysosome, or target compartment where the active species works.`,
                bullets: [
                  "separate BBB transcytosis, tissue spread, cell-type uptake, endosomal escape, and molecular target engagement.",
                  "brain homogenate is not enough: require neuronal or glial PD readouts such as tau lowering, APP-pathway movement, TREM2-state shift, lysosomal rescue, or functional rescue.",
                  "kill criterion: drop shuttles that improve exposure but do not improve compartment-correct activity.",
                ],
              }
          : /(tau[- ]?lowering|trem2[- ]?modulating|tau .*trem2|trem2 .*tau)/i.test(normalizedPrompt)
            ? {
                title: "tau-lowering versus TREM2-modulating design path",
                answer: `for ${contextLabel}, tau/MAPT lowering and TREM2 glial modulation need different payloads and compartments. tau lowering is usually sequence- or protein-burden directed; TREM2 modulation is immune-state and glial-function directed, so the carrier, chemistry, and PD readout should diverge early.`,
                bullets: [
                  "tau/MAPT lane: ASO/siRNA or protein-clearance cargo; gate on CNS delivery, nuclear/cytosolic access, tau reduction, and neuronal functional rescue.",
                  "TREM2 lane: glia-biased binder or pathway-modulating cargo; gate on microglial state shift, inflammation safety, and disease-relevant functional readouts.",
                  "do not optimize linker or carrier until the payload-specific compartment and PD marker are chosen.",
                ],
              }
          : /(speculative idea|high-upside|first experiment .*kill|experiment .*kill)/i.test(normalizedPrompt)
            ? {
                title: "high-upside idea with a kill experiment",
                answer: `for ${contextLabel}, a high-upside idea is allowed only as a falsifiable hypothesis. pick one biology bottleneck, state why the conjugate might solve it, then name the first experiment that would kill the concept if it fails.`,
                bullets: [
                  "CNS example: a compact BBB-shuttle oligo or glia-biased cargo could be tested if it creates cell-compartment target engagement, not just brain exposure.",
                  "kill experiment: no disease-relevant PD movement in the target cell or compartment despite improved exposure.",
                  "keep it speculative until target, compartment, mechanism, PK/PD, and safety data line up.",
                ],
              }
          : /(first[- ]?90|90[- ]?days|90 days)/i.test(normalizedPrompt)
            ? {
                title: "first-90-days plan",
                answer: `for ${contextLabel}, the first 90 days should collapse biology, delivery, and safety uncertainty before chemistry polish. the goal is not a perfect construct; it is a defensible decision about whether the target and route are real.`,
                bullets: [
                  "days 0-30: confirm disease biology, target expression, compartment need, and normal-tissue risk with repository and model checks.",
                  "days 30-60: compare minimal carrier, decorated carrier, and active cargo for exposure, trafficking, and target engagement.",
                  "days 60-90: run functional PD, repeat-dose tolerability, and go/no-go criteria before optimizing linker, DAR, valency, or chemistry.",
                ],
              }
          : /(stellate|kupffer|hepatocyte|asgpr mostly targets hepatocytes)/i.test(normalizedPrompt)
            ? {
                title: "cell-type mismatch gate",
                answer: `for ${contextLabel}, if the delivery handle enters one cell population but the disease biology is driven by another, the conjugate has a cell-type mismatch. that handle is useful only if activity in the entered cell type can plausibly move the disease-driving readout.`,
                bullets: [
                  "entered-cell lane: use the handle only if target engagement in that cell type changes the disease mechanism.",
                  "driver-cell lane: look for a separate cell-type handle when the current route misses the disease-driving compartment.",
                  "first experiment: cell-type-resolved uptake plus mechanism marker movement, not tissue uptake alone.",
                ],
              }
          : /(liver[- ]?targeted oligo|released small-molecule|linker stability.*liver|liver.*linker)/i.test(normalizedPrompt)
            ? {
                title: "liver linker stability: oligo versus released payload",
                answer: `for ${contextLabel}, liver-targeted oligo conjugates usually need attachment chemistry that preserves nuclease stability, receptor recognition, endosomal escape, and active strand function. a released small-molecule payload instead needs linker stability and release timing that avoid broad liver toxicity while delivering active species to the disease compartment.`,
                bullets: [
                  "oligo/GalNAc lane: prioritize stable conjugation and productive intracellular delivery over classical warhead release.",
                  "released-payload lane: prove compartment-biased release and pathway selectivity before increasing potency.",
                  "test ligand recognition, oligo potency, plasma stability, hepatocyte uptake, and fibrosis/inflammation PD separately.",
                ],
              }
          : /(braf.*intracellular|intracellular.*braf|mutational|cell-state handle|surface .*handle)/i.test(normalizedPrompt)
            ? {
                title: "intracellular mutation versus surface handle",
                answer: `for ${contextLabel}, an intracellular mutation or pathway driver is not automatically a surface antigen. a conjugate becomes feasible only if a separate disease-relevant surface, uptake, lesion-localizing, or cell-state handle can deliver the active species better than a simpler comparator.`,
                bullets: [
                  "do not call the intracellular driver the entry antigen unless there is a separate delivery mechanism.",
                  "possible handles: validated cell-type uptake, lesion retention, inflammatory-cell bias, or a surface marker proven in the disease tissue.",
                  "first experiment: target-handle expression, uptake/retention, pathway suppression, and lesion-relevant safety in the same sample set.",
                ],
              }
          : /(surface-expressed|does not internalize|doesn.?t internalize|not internalize)/i.test(normalizedPrompt)
            ? {
                title: "surface target without internalization",
                answer: `for ${contextLabel}, if the target is surface-expressed but does not internalize, classical lysosomal ADC release becomes weak. remaining mechanisms include retention-driven RDC, extracellular/local activation, immune-engager or complement-style logic, masking/local activation, or a non-internalizing binder that changes biology directly.`,
                bullets: [
                  "downgrade: cleavable ADC logic that requires uptake and lysosomal processing.",
                  "keep conditional: RDC if retention/dosimetry work, local enzyme/prodrug activation if activation is disease-biased, or immune/pathway modulation if surface binding itself changes biology.",
                  "first experiment: retention, shedding, proximity to active compartment, and normal-tissue exposure.",
                ],
              }
          : /(red[- ]?team|binding assay looks good|ways .*fail)/i.test(normalizedPrompt)
            ? {
                title: "red-team failure list",
                answer: `for ${contextLabel}, a good binding assay is only the first gate. the construct can still fail through expression mismatch, normal-tissue binding, weak internalization, wrong trafficking, payload inactivation, bad PK, immunogenicity, or no functional disease rescue.`,
                bullets: [
                  "target risk: disease samples do not express the handle consistently or normal tissue expresses it too strongly.",
                  "delivery risk: binding does not become productive uptake, retention, release, escape, or target engagement.",
                  "translation risk: PK/PD, repeat-dose safety, immunogenicity, or manufacturing heterogeneity overwhelms the biology.",
                ],
              }
          : /(internalization|payload release|retention|trafficking|uptake|escape|endosome|endosomal)/i.test(normalizedPrompt)
            ? {
                title: "trafficking and mechanism-execution gate",
                answer: `for ${contextLabel}, the design should treat binding, internalization, retention, escape, and payload release as separate gates. a construct can bind the right target and still fail if it routes into the wrong compartment, releases too early, releases too late, or traps the active species away from the MOA.`,
                bullets: [
                  /parkinson|cns|brain/i.test(contextLower)
                      ? "CNS risk: brain or CSF exposure can look good while endosomal escape, nuclear/cytosolic access, or neuron/glia delivery remains poor."
                      : "target risk: measure surface binding, internalization, recycling, degradation, retention, and active-species release separately.",
                  "if internalization is weak, avoid relying only on lysosomal cleavable-linker payload release; consider retention-driven, bystander, radiolocalization, shuttle, or non-cytotoxic pathway logic only if the biology supports it.",
                  "first experiment: pair live-cell trafficking with payload-release or active-species activity in target-high, target-low, and normal-cell comparators.",
                ],
              }
          : /(brain[- ]?entry|bbb|csf|transport route|delivery route|route should)/i.test(normalizedPrompt)
            ? {
                title: "route-first delivery choice",
                answer: `for ${contextLabel}, choose the delivery route before polishing the construct. the right route is the one that creates productive exposure in the disease-relevant tissue, cell type, and compartment, not merely better plasma PK or bulk tissue signal.`,
                bullets: [
                  "systemic BBB shuttle: pressure-test receptor-mediated transport only if transcytosis leads to active cargo in brain cells rather than endothelial trapping or peripheral sink.",
                  "CSF or intrathecal route: useful when BBB crossing is weak, but tissue spread, repeat dosing, and cell uptake still need proof.",
                  "local or tissue-biased route: consider only if distribution and repeat-dose tolerability are compatible with the disease biology.",
                ],
              }
          : /(fcrn|complement|autoantigen|tolerance)/i.test(normalizedPrompt) && /target|first|secondary|causal|compare|should/i.test(normalizedPrompt)
            ? {
                title: "immune-mechanism priority",
                answer: `for ${contextLabel}, choose the immune mechanism before choosing the conjugate format. FcRn/IgG lowering is the cleanest starting lane when pathogenic antibody burden is the main driver; complement modulation becomes stronger only if complement injury is causal and close to the functional deficit; autoantigen-specific tolerance is higher-upside but needs much stronger subset and antigen-specific evidence.`,
                bullets: [
                  "FcRn / IgG lane: prioritize if pathogenic IgG reduction is the desired PD marker and chronic tolerability is acceptable.",
                  "complement lane: prioritize only if complement markers move with disease activity and functional rescue, not if complement is only a secondary injury marker.",
                  "autoantigen / tolerance lane: keep as a precision hypothesis until AChR, MuSK, LRP4, or another antigen-specific readout is defined.",
                ],
              }
          : /(immune[- ]cell depletion|cytotoxic.*immune|cell depletion)/i.test(normalizedPrompt)
            ? {
                title: "why not cytotoxic immune-cell depletion by default",
                answer: `for ${contextLabel}, cytotoxic immune-cell depletion should not be the default because the disease logic is chronic immune modulation, not broad cell killing. depletion only becomes credible if a disease-driving immune population has a selective target and the safety window beats FcRn, complement, tolerance, or other non-cytotoxic strategies.`,
                bullets: [
                  "main risk: infection, immune suppression, loss of useful immune cells, and poor repeat-dose tolerability.",
                  "upgrade only if selective depletion is disease-relevant, measurable, durable, and safer than non-cytotoxic immune modulation.",
                  "first experiment: compare mechanism rescue and immune safety against a non-depleting comparator.",
                ],
              }
          : /(innovation|innovative|next[- ]?gen|local[- ]activation|cautious construct|hallucinat|hypothesis.*evidence|evidence.*hypothesis)/i.test(normalizedPrompt)
            ? {
                title: "innovation without hallucination",
                answer: `for ${contextLabel}, keep innovation as clearly labeled hypotheses, not claims. the planner can suggest next-generation formats, local activation, bispecific gating, masked activation, shuttle logic, degrader-style cargo, or unusual chemistry, but each idea has to be tied to direct evidence that the target, compartment, mechanism, and safety window are real.`,
                bullets: [
                  "separate direct evidence from analogy: repositories and precedent can suggest hypotheses, but they cannot prove the target works in this disease.",
                  "require a falsifiable gate for every innovative idea: expression, localization, uptake or retention, active-species function, PK/PD, and safety.",
                  /local[- ]activation|risk/i.test(normalizedPrompt)
                    ? "local-activation risk: the activation trigger has to be disease-biased; otherwise the concept only adds complexity and off-tissue safety risk."
                    : "next-gen risk: added format complexity has to solve a real blocker such as normal-tissue exposure, heterogeneity, barrier access, or compartment delivery.",
                  "use speculative language until the data exists: say possible, hypothesis, unvalidated, not yet validated, or would become viable if; do not call it best or curative.",
                ],
              }
            : /(dar\b|drug[- ]?to[- ]?antibody|loading|stoichiometry|valency|ligand density|cargo density|how much)/i.test(normalizedPrompt)
          ? {
              title: "loading, valency, and DAR strategy",
              answer: `for ${contextLabel}, loading should be treated as an exposure and safety variable, not a potency dial. start with the lowest interpretable loading or valency that can move the mechanism, then increase only if PK, aggregation, trafficking, active-species function, and tolerability still hold.`,
              bullets: [
                /pmp22|xyzr17|non-cytotoxic|oligo|rna/i.test(`${contextLower} ${normalizedPrompt}`)
                  ? "non-cytotoxic or oligo-style cargo: translate DAR into cargo stoichiometry/loading, and keep it low enough that delivery, stability, and functional activity remain interpretable."
                  : /fcrn|igg|complement|immune|myasthenia/i.test(`${contextLower} ${normalizedPrompt}`)
                    ? "immune-modulating cargo: control valency or loading so receptor engagement is tunable and reversible; avoid avidity-driven broad immune sink or chronic over-suppression."
                  : "ADC-style first pass: DAR 2-4 is usually the cleaner starting pressure-test before exploring higher loading.",
                "higher DAR can improve apparent potency but often worsens hydrophobicity, aggregation, clearance, exposure, and therapeutic window.",
                "first experiment: compare low, middle, and high loading in matched binding, internalization, PK/stability, payload-release, and safety assays.",
              ],
            }
          : /(moa\b|mechanism of action|expected mechanism|prove it)/i.test(normalizedPrompt)
            ? {
                title: "expected MOA and proof plan",
                answer: `for ${contextLabel}, the expected MOA has to connect target engagement to active-species execution and then to a disease-relevant functional readout. binding alone is not proof; the construct has to reach the right compartment and move the mechanism that should change the phenotype.`,
                bullets: [
                  /autoimmune|neuropathy/i.test(contextLower)
                      ? "unvalidated immune-neuropathy MOA: start non-cytotoxic, prove antigen expression and immune/pathway modulation before any cell-killing logic."
                      : /rdc|radioligand/i.test(`${contextLower} ${normalizedPrompt}`)
                        ? "RDC MOA: target localization plus retention creates lesion radiation dose; prove dosimetry and organ safety."
                        : "ADC-like MOA: antigen binding, internalization/processing, payload release, target-cell killing, and bystander effect only if needed.",
                  "proof stack: target expression, binding, uptake or retention, active-species release/exposure, mechanism marker, functional disease or killing readout, and safety counter-screen.",
                  "drop the construct if uptake improves but the disease-relevant PD marker does not move.",
                ],
              }
          : /(pk\/pd|pkpd|\bpk\b|\bpd\b|exposure|clearance|dose|peripheral nerve)/i.test(normalizedPrompt)
            ? {
                title: "PK/PD and exposure logic",
                answer: `for ${contextLabel}, PK/PD should ask whether exposure reaches the right tissue and then executes the intended mechanism, not merely whether plasma half-life looks good.`,
                bullets: [
                  /peripheral nerve/i.test(`${contextLower} ${normalizedPrompt}`)
                    ? "peripheral nerve gate: quantify relevant nerve-cell exposure, duration of modulation, tissue-function readouts, and reversibility if dosing overshoots."
                    : /radioligand|rdc/i.test(`${contextLower} ${normalizedPrompt}`)
                      ? "radioligand gate: track lesion uptake, retention, isotope half-life, kidney/marrow dose, and lesion-to-organ dosimetry."
                      : "ADC/antigen gate: separate total plasma exposure, target-mediated uptake, released payload exposure, and target-tissue PD.",
                  "repeat-dose gate: watch accumulation, receptor handling, immune response, delayed toxicity, and loss of target-mediated uptake over cycles.",
                  "first model: link exposure to a PD marker and a safety marker in the same experiment so potency does not outrun tolerability.",
                ],
              }
          : /(chelator|radionuclide|radioligand|lutetium|actinium|dosimetry)/i.test(normalizedPrompt)
            ? {
                title: "chelator / radionuclide design logic",
                answer: `for ${contextLabel}, radioconjugate design starts with localization, retention, isotope range, chelator stability, and organ dosimetry. this is different from classical linker-release logic because the radiation field is the active payload.`,
                bullets: [
                  "chelator gate: prove in-vivo metal stability and avoid free-isotope organ exposure.",
                  "isotope gate: match range and half-life to lesion size, target retention, tumor dose, marrow dose, kidney dose, and salivary or other off-organ exposure.",
                  "first experiment: biodistribution plus dosimetry before optimizing spacer, affinity, or potency.",
                ],
              }
	          : /(adverse|side effects?|dose[- ]limiting|dlt|toxicit)/i.test(normalizedPrompt)
	            ? {
	                title: /cns|brain|transport/i.test(`${contextLower} ${normalizedPrompt}`)
                    ? "chronic CNS transport-handle safety"
                    : "adverse-effect and safety gates",
	                answer: /cns|brain|transport/i.test(`${contextLower} ${normalizedPrompt}`)
                    ? `for ${contextLabel}, chronic CNS transport handles can fail through receptor saturation, receptor downmodulation, endothelial trapping, peripheral sink, microglial activation, neuronal stress, immunogenicity, cytokine shift, or off-brain organ exposure.`
                    : `for ${contextLabel}, adverse effects should be predicted from target biology, payload class, exposure route, and repeat dosing. the safety screen should run before potency optimization, not after.`,
	                bullets: [
	                  /cns|brain|transport/i.test(`${contextLower} ${normalizedPrompt}`)
                      ? "CNS transport gate: separate shuttle toxicity from payload toxicity and measure brain-region, CSF, cell-type, and compartment activity under repeat dosing."
                    : /rdc|radioligand/i.test(contextLower)
                      ? "RDC risk: high-exposure organ dose, marrow dose, cumulative dosimetry, and isotope-release risk should dominate escalation decisions."
                      : /hodgkin|lymphoma|hematologic|blood|marrow/i.test(contextLower)
                        ? "hematology risk: marrow suppression, infection risk, cytokine shift, liver signals, and payload-driven toxicity should be watched early."
                          : "unvalidated target risk: immune activation, normal-tissue binding, off-target payload exposure, and repeat-dose tolerability should block escalation.",
                  "dose-limiting signal: any normal-tissue target engagement that appears before disease-relevant PD should stop optimization.",
                  "safety experiment: target-positive disease cells, target-low disease cells, relevant normal cells, and exposure-relevant organ systems in the same screen.",
                ],
              }
          : /(chemistry|conjugation|linker logic|oligo or rna|rna cargo)/i.test(normalizedPrompt)
            ? {
                title: "chemistry and attachment logic",
                answer: `for ${contextLabel}, chemistry should preserve target binding, active-species function, stability, and PK while keeping the first experiment interpretable. do not let elegant chemistry hide whether the biology works.`,
                bullets: [
                  /oligo|rna|aso|sirna|pmo|pmp22/i.test(`${contextLower} ${normalizedPrompt}`)
                    ? "oligo/RNA cargo: prioritize handle-preserving attachment, nuclease stability, productive cell uptake, endosomal escape or nuclear/cytosolic access, and activity retention after conjugation."
                    : /rdc|radioligand|chelator|radionuclide|psma/i.test(`${contextLower} ${normalizedPrompt}`)
                      ? "RDC cargo: prioritize chelator stability, labeling conditions, spacer effect on affinity/clearance, and isotope retention in vivo."
                      : "ADC cargo: start with cysteine or site-specific chemistry when DAR control and PK interpretability matter; use lysine only when speed matters more than heterogeneity.",
                  "screen: binding retention, aggregation, plasma stability, release or active-species function, PK behavior, and manufacturability.",
                  "decision rule: choose the simplest chemistry that answers the biology question cleanly before optimizing polished developability.",
                ],
              }
          : /(same construct|same conjugate|same strategy|work for both|opposite disease directions|loss[- ]of[- ]function|gain[- ]of[- ]function|overexpression|deletion)/i.test(normalizedPrompt)
          ? {
              title: "disease-directionality gate",
              answer: `for ${contextLabel}, do not assume the same construct works across disease settings if the biology can point in opposite directions. a lowering, blocking, activating, restoring, or stabilizing construct should be chosen only after the disease direction is explicit.`,
              bullets: [
                "gain or overexpression biology: lowering or pathway-normalizing logic may be plausible only if functional rescue is shown.",
                "loss or deletion biology: lowering logic can be harmful; consider restoration, stabilization, replacement, or supportive biology only if evidence supports it.",
                "shared gate: require target directionality, relevant-cell delivery, functional rescue, and repeat-dose safety before calling one construct broadly useful.",
              ],
            }
          : /(no entry|no hit|not found|repositories? have no|repository has no)/i.test(normalizedPrompt)
            ? {
                title: "if target repositories have no entry",
                answer: `for ${contextLabel}, no repository entry should lower confidence rather than trigger analogy-based target selection. treat the target as unvalidated, state that direct target evidence is missing, and move into discovery mode before ranking a conjugate class.`,
                bullets: [
                  "do first: verify nomenclature and aliases in UniProt, NCBI Gene, OMIM, Human Protein Atlas, and Open Targets.",
                  "if still empty: require disease-specific expression, cell-type localization, normal-tissue mapping, and a functional mechanism readout before ranking.",
                  "do not borrow targets from a familiar disease; use analogy only to generate hypotheses that still need direct evidence.",
                ],
              }
          : /(hpa|human protein atlas|open targets|uniprot|reactome|expression atlas|ncbi gene|omim|repositories?|repository)/i.test(normalizedPrompt)
            ? {
                title: "what target repositories should verify",
                answer: `for ${contextLabel}, Human Protein Atlas, UniProt, Open Targets, Reactome, Expression Atlas, NCBI Gene, and OMIM should be used as target-biology cross-checks. They help verify expression, localization, aliases, pathway context, disease links, and normal-tissue risk before the planner treats the target as a real conjugate entry handle.`,
                bullets: [
                  "Human Protein Atlas: tissue expression, cell-type expression, pathology expression, and protein localization.",
                  "Open Targets and OMIM: genetic or curated target-disease evidence, known drugs, phenotypes, and confidence of disease association.",
                  "UniProt, Reactome, Expression Atlas, and NCBI Gene: aliases, protein function, pathway biology, RNA expression, variants, and linked literature.",
                  "decision gate: repositories can support a hypothesis, but disease-specific expression, mechanism, and functional rescue data still decide whether the conjugate is rankable.",
                ],
              }
          : /(make it more technical|more technical|for a scientist|scientist version|go deeper technically|technical explanation)/.test(normalizedPrompt)
          ? {
              title: "technical version",
              answer: `for ${contextLabel}, the technical read is: separate the biological mechanism, the delivery route, and the payload execution gate before ranking classes. a good answer should name the active compartment, the trafficking requirement, the target-expression window, and the experiment that proves mechanism execution rather than just binding.`,
              bullets: [
                "mechanism gate: define whether the therapeutic event is cytotoxicity, gene/RNA modulation, immune modulation, catalysis, radiobiology, or pathway support.",
                "delivery gate: prove tissue access, internalization or retention, processing route, and productive compartment exposure.",
                "evidence gate: upgrade only with target-expression separation, trafficking data, payload activity after conjugation, and a disease-relevant functional assay.",
              ],
            }
          : /\bcompare\b/.test(normalizedPrompt) && mentionedTargetNames.length >= 2
            ? {
                title: `${mentionedTargetNames.slice(0, 2).join(" vs ")} target comparison`,
                answer: `for ${contextLabel}, compare ${mentionedTargetNames.slice(0, 2).join(" and ")} as explicit target options in the same disease setting, not as a generic disease-profile shortlist. the useful comparison is expression separation, normal-tissue risk, internalization or retention, payload sensitivity, heterogeneity, and whether the chosen payload mechanism can create a real therapeutic window.`,
                bullets: [
                  `${mentionedTargetNames[0]}: upgrade if disease-subtype expression is strong enough, normal-tissue exposure is manageable, and processing or retention supports the payload.`,
                  `${mentionedTargetNames[1]}: keep as a comparator only if expression, accessibility, and safety are measured in the same disease context.`,
                  "first experiment: run matched tumor-vs-normal expression plus internalization/retention and payload-sensitivity assays before ranking either target.",
                ],
              }
          : /enzyme replacement.*oligo|oligo.*gene|gene-modulating|gene modulation/.test(normalizedPrompt)
            ? {
                title: "enzyme versus oligo / gene-modulation logic",
                answer: `for ${contextLabel}, compare these as mechanism hypotheses, not as platform favorites. enzyme replacement makes sense if missing catalytic activity is extracellular, lysosomal, or otherwise deliverable; oligo logic makes sense if transcript modulation can change the disease biology; gene-modulating cargo makes sense only if durable intracellular delivery and safety are credible.`,
                bullets: [
                  "enzyme lane: needs enzyme activity after delivery, correct compartment access, and a functional disease readout.",
                  "oligo / gene-modulation lane: needs a causal transcript or pathway plus productive intracellular delivery.",
                  "first experiment: hold the disease readout constant and compare mechanism engagement for enzyme activity, transcript change, and functional rescue.",
                ],
              }
          : /(aso\b|sirna|pmo\b|could oligo|oligo conjugates? work|oligo logic|oligo strategy)/.test(normalizedPrompt)
            ? {
                title: "oligo conjugate viability",
                answer: `for ${contextLabel}, ASO, siRNA, PMO, or broader oligo conjugate logic can make sense only if there is a causal transcript, splice event, or pathway node and the delivery system can put the active oligo into the productive intracellular compartment. without that, oligo is just another platform label, not a disease-grounded mechanism.`,
                bullets: [
                  "ASO: best when nuclear RNase-H, splice switching, or transcript blocking is the active mechanism.",
                  "siRNA: best when cytosolic RISC-mediated knockdown is plausible and delivery can reach cytosol.",
                  "PMO: useful when splice correction is central, but delivery chemistry must preserve activity and tissue exposure.",
                  "safety gate: compare target tissue activity against off-tissue exposure, immune-stimulation risk, and functional disease readout.",
                ],
              }
          : /antibody.*peptide.*oligo|antibody.*peptide.*small|compare .*antibody|compare .*carrier/.test(normalizedPrompt)
            ? {
                title: "carrier and modality comparison",
                answer: `for ${contextLabel}, antibody, peptide, oligo, small-molecule, and nanoparticle-like carrier logic should be compared by the biological job each one can actually do: target binding, tissue access, intracellular delivery, compartment routing, payload compatibility, and safety.`,
                bullets: [
                  "antibody lane: strongest when a surface target and exposure window are real.",
                  "peptide or small-molecule lane: useful when compact access, uptake bias, or ligandable biology matters.",
                  "oligo or nanoparticle-like lane: conditional on productive intracellular delivery and a causal transcript or pathway readout.",
                ],
              }
          : /cell compartment|compartment matters|active compartment/.test(normalizedPrompt)
            ? {
                title: "cell compartment gate",
                answer: `for ${contextLabel}, the key compartment is whatever compartment lets the active species execute the mechanism. the planner should separate extracellular binding, endosomal uptake, lysosomal routing, cytosolic activity, nuclear transcript modulation, and organelle-localized rescue instead of treating exposure as one number.`,
                bullets: [
                  "define where the active species must work before choosing carrier or linker chemistry.",
                  "measure compartment-correct activity, not just total uptake or tissue exposure.",
                  "drop designs that reach the tissue but miss the functional compartment.",
                ],
              }
          : /delivery handle|uptake handle|what delivery/.test(normalizedPrompt)
            ? {
                title: "delivery handle gate",
                answer: `for ${contextLabel}, a delivery handle becomes plausible only if it creates disease-relevant uptake, trafficking, and activity after conjugation. it should be chosen from the disease cell type and active compartment, not copied from a known-disease playbook.`,
                bullets: [
                  "rank handles by disease-cell expression, normal-tissue overlap, internalization or retention, and payload tolerance.",
                  "test binding, uptake, trafficking, and functional readout as separate gates.",
                  "keep an untargeted or minimally modified comparator so the handle has to earn its complexity.",
                ],
              }
          : /biology must be proven|biology .*proven|what biology/.test(normalizedPrompt)
            ? {
                title: "biology that must be proven first",
                answer: `for ${contextLabel}, the first biology to prove is the causal chain: disease cell type, target or pathway, active compartment, functional readout, and normal-tissue risk. without that, a conjugate recommendation would be platform-first guesswork.`,
                bullets: [
                  "prove the disease-relevant cell type or tissue compartment.",
                  "prove the target, pathway, or transcript is connected to the phenotype.",
                  "prove the active species changes a functional disease readout without an unacceptable safety signal.",
                ],
              }
          : /sponsor insists|sponsor-preferred|target_[a-z0-9]+/i.test(prompt)
            ? {
                title: "sponsor-preferred target safety handling",
                answer: `for ${contextLabel}, the sponsor-preferred target can be included as a hypothesis, but it should be labeled low-confidence until independent disease-specific evidence supports it. the planner should run it in parallel with unbiased discovery rather than letting it become target lock-in.`,
                bullets: [
                  "mark the sponsor target as requested, not validated.",
                  "require expression, mechanism, and functional validation before ranking it above alternatives.",
                  "keep a parallel discovery branch so bias does not erase better disease-grounded biology.",
                ],
              }
          : /no papers|no literature|none are available/.test(normalizedPrompt)
            ? {
                title: "how to behave when no papers exist",
                answer: `for ${contextLabel}, if there are no papers, the planner should say that directly and switch to a discovery plan. it should not import targets from nearby diseases, invent evidence, or rank a conjugate class as if the biology were known.`,
                bullets: [
                  "treat all targets as hypotheses until disease-specific expression and mechanism data exist.",
                  "start with phenotype, pathology, omics/surfaceome where available, normal-tissue mapping, and a functional readout.",
                  "separate no-evidence statements from analogy-based hypotheses so uncertainty stays visible.",
                ],
              }
          : /by analogy|pick .*analogy|target by analogy/.test(normalizedPrompt)
            ? {
                title: "why analogy cannot pick the target",
                answer: `for ${contextLabel}, analogy can generate hypotheses but should not pick the target. the risk is importing a familiar disease’s biology, antigen list, or modality logic into a case where disease-specific expression, mechanism, and safety evidence may be completely different.`,
                bullets: [
                  "use analogy only as a hypothesis source, never as proof.",
                  "require disease-specific expression, mechanism linkage, and normal-tissue safety data.",
                  "rank only after the evidence ledger separates direct evidence from borrowed precedent.",
                ],
              }
          : /heterogeneous|heterogeneity|target-low/.test(normalizedPrompt)
            ? {
                title: "antigen heterogeneity strategy",
                answer: `for ${contextLabel}, antigen heterogeneity means the target cannot be judged only by target-high cells. the design has to ask whether target-low disease cells are common enough to need bystander payload, dual targeting, local activation, or a non-cytotoxic mechanism that does not depend on uniform antigen density.`,
                bullets: [
                  "measure target-high, target-low, and target-negative disease cells in the same assay set.",
                  "upgrade bystander payload only if local disease exposure is selective enough to avoid normal-tissue toxicity.",
                  "consider bispecific, multispecific, masked, or local-activation logic only if it solves the heterogeneity problem better than a simpler construct.",
                ],
              }
          : /rdc .*adc|adc .*rdc|better than adc|better than rdc/.test(normalizedPrompt)
            ? {
                title: "RDC versus ADC logic",
                answer: `for ${contextLabel}, RDC can beat ADC only if localization, retention, isotope range, and organ dosimetry are the therapeutic engine. ADC can beat RDC only if the target internalizes or processes a payload well enough and the normal-tissue window is cleaner than the radiation exposure tradeoff.`,
                bullets: [
                  "RDC gate: target retention, lesion-to-organ dosimetry, isotope range fit, and hematologic or organ safety.",
                  "ADC gate: surface access, internalization or processing, payload sensitivity, bystander need, and normal-tissue expression.",
                  "first experiment: compare target retention/dosimetry assumptions against internalization/payload-release assumptions before choosing the class.",
                ],
              }
          : /(antigen biology|target biology)/.test(normalizedPrompt)
            ? {
                title: "antigen biology lens",
                answer: `for ${contextLabel}, antigen biology should be judged as a functional delivery-and-mechanism system, not as a marker name. the key question is whether the antigen gives enough disease relevance, accessibility, internalization or retention, heterogeneity handling, and normal-tissue separation for the payload mechanism you want.`,
                bullets: [
                  "disease relevance: confirm the antigen sits on the cells or compartment driving the phenotype.",
                  "access and trafficking: distinguish surface binding, internalization, retention, shedding, lysosomal routing, and productive payload release.",
                  "therapeutic window: compare tumor/disease tissue against normal tissue and high-exposure organs before choosing the modality.",
                ],
              }
          : /alpha[- ]?synuclein|synuclein/.test(normalizedPrompt)
            ? {
                title: "alpha-synuclein biology possibilities",
                answer: `for ${contextLabel}, alpha-synuclein biology is interesting because it connects protein misfolding, aggregation, lysosomal/autophagy stress, possible extracellular spread, and neuron/glia toxicity. conjugation technology could be exploited only if it solves brain exposure and gets the active species to the right compartment without cell-killing logic.`,
                bullets: [
                  "practical lane: BBB/CSF-enabled ASO/siRNA or pathway-modulating cargo if the goal is SNCA lowering or transcript/pathway modulation.",
                  "conditional lane: brain-penetrant antibody/fragment or shuttle format if extracellular alpha-synuclein species are targetable enough to matter.",
                  "high-risk lane: proteostasis, lysosomal, or degrader-like delivery if intracellular aggregate handling can be changed productively.",
                ],
              }
          : /active species.*lysosome|reach lysosomes?|lysosomes?.*active species/.test(normalizedPrompt)
            ? {
                title: "lysosomal active-species delivery",
                answer: `for ${contextLabel}, if the active species must reach lysosomes, the key design variable is compartment-correct trafficking. the uptake handle, linker, and carrier should be judged by whether they deliver active cargo to lysosomes in the relevant cell type, not by bulk tissue exposure or surface binding alone.`,
                bullets: [
                  "measure lysosomal colocalization plus functional activity, not only uptake.",
                  "choose release or attachment logic based on whether the active species should be liberated in the lysosome or remain carrier-associated.",
                  "drop formats that improve exposure but fail the lysosomal functional readout.",
                ],
              }
          : /lysosomal|autophagy/.test(normalizedPrompt)
            ? {
                title: "lysosomal / autophagy biology possibilities",
                answer: `for ${contextLabel}, lysosomal and autophagy biology matters because impaired protein clearance can amplify alpha-synuclein and broader neuronal stress. conjugates could help only if they deliver a non-cytotoxic active species into the cells and compartments that control clearance biology.`,
                bullets: [
                  "possible lane: delivery-decorated oligo or pathway modulator aimed at clearance, lysosomal, or autophagy-linked biology.",
                  "possible lane: compact peptide/small-molecule conjugate with organelle- or uptake-biased routing if the payload truly supports lysosomal function.",
                  "failure mode: better uptake can still fail if the active species stays trapped or changes only downstream stress markers.",
                ],
              }
          : /mitochondrial|mitochondria/.test(normalizedPrompt)
            ? {
                title: "mitochondrial biology possibilities",
                answer: `for ${contextLabel}, mitochondrial biology is a plausible supportive axis because dopaminergic neurons are vulnerable to energy stress and oxidative pressure. conjugation could be useful if it biases a protective, non-cytotoxic payload toward the relevant brain cells or subcellular compartment.`,
                bullets: [
                  "possible lane: mitochondria-supportive small-molecule or peptide conjugate with a validated uptake route.",
                  "possible lane: pathway-modulating oligo or biologic cargo if the biology is upstream enough to alter stress response.",
                  "failure mode: mitochondrial support may be too downstream or too broad unless the disease subtype and compartment are clear.",
                ],
              }
          : /(mechanisms? can .*exploit|exploit .*mechanism|disease biology|biological point|biology point)/.test(normalizedPrompt)
            ? {
                title: "mechanisms to exploit",
                answer: `for ${contextLabel}, the exploitable biology should be organized by mechanism: cell killing, gene/RNA modulation, immune modulation, protein clearance or degradation, radiolocalization, local catalytic activation, pathway support, and delivery-barrier solving. the best conjugate lane is the one where the disease biology, antigen biology, payload mechanism, and delivery route all agree.`,
                bullets: [
                  "cytotoxic delivery needs selective target expression plus internalization or release logic.",
                  "immune/pathway modulation needs chronic tolerability and a non-cytotoxic payload logic.",
                  "radioligand or enzyme/prodrug logic needs localization, retention, dosimetry or catalysis to be the actual selectivity engine.",
                ],
              }
          : requestedModality && /(what would make|what makes|make .* viable|upgrade .* viable)/.test(normalizedPrompt)
            ? {
                title: `what would make ${requestedModality} viable`,
                answer: `for ${contextLabel}, ${requestedModality} becomes viable only if its specific entry-handle and payload assumptions are proven, not just because the class exists. ${requestedWhyNot?.primaryReason ?? requestedRanking?.limitReason ?? "right now the missing piece is evidence that this modality solves the biology better than simpler options."}`,
                bullets: [
                  requestedRanking?.whatMustBeTrue ? `must be true: ${requestedRanking.whatMustBeTrue}` : "",
                  requestedWhyNot?.secondaryReason ? `secondary evidence gap: ${requestedWhyNot.secondaryReason}` : "",
                  requestedRanking?.fitReason ? `where it can fit: ${requestedRanking.fitReason}` : "",
                  `first check: show target binding/localization, productive uptake or retention, payload compatibility, and a safety window in the same disease context.`,
                ].filter(Boolean),
              }
            : /microenvironment/.test(normalizedPrompt)
          ? {
              title: "microenvironment assumptions that matter",
              answer: `for ${contextLabel}, the microenvironment only helps the design if it changes release, uptake, or payload exposure in a predictable way. prioritize protease/lysosomal processing after target-mediated uptake over a vague acidic-tumor-release story unless you have data that the pH or enzyme window is truly selective.`,
              bullets: [
                "check whether release is driven mainly by intracellular lysosomal processing or extracellular tumor conditions.",
                "ask whether antigen heterogeneity makes a bystander payload useful or dangerous.",
                "compare plasma stability, tumor-cell catabolism, and normal-tissue release in the same assay plan.",
              ],
            }
          : /bystander/.test(normalizedPrompt)
            ? {
                title: "how bystander effect changes the choice",
                answer: `for ${contextLabel}, bystander activity pushes the design toward a cleavable linker plus a membrane-permeable payload, because the released species has to leave the target-positive cell and affect nearby target-low cells. if the disease setting is homogeneous and safety is tight, a less bystander-heavy design becomes more attractive.`,
                bullets: [
                  "bystander helps most when target expression is heterogeneous but local tumor exposure is still selective.",
                  "it raises normal-tissue risk if linker release or payload diffusion is not compartment-biased.",
                  "test target-high and target-low mixed cultures rather than only a single target-high line.",
                ],
              }
            : /kadcyla|emtansine|t-dm1/.test(normalizedPrompt)
              ? {
                  title: "when kadcyla-like logic gets better",
                  answer: `for ${contextLabel}, Kadcyla-like non-cleavable logic gets better when HER2 expression is strong and fairly homogeneous, when you do not need much bystander spread, and when plasma stability matters more than free-payload release. it gets weaker when heterogeneous disease needs a membrane-permeable released species.`,
                  bullets: [
                    "upgrade it if target density and internalization are strong across the lesion.",
                    "downgrade it if target-low neighboring cells need to be reached.",
                    "compare non-cleavable catabolite activity against cleavable topo-I-style release in matched heterogeneous models.",
                  ],
                }
	              : /adverse.*cns|cns transport|chronic cns|transport handles/.test(normalizedPrompt)
	                ? {
	                    title: "chronic CNS transport-handle safety",
	                    answer: `for ${contextLabel}, chronic CNS transport handles can fail on safety even when delivery improves. watch receptor saturation or downregulation, endothelial trapping, peripheral sink effects, microglial activation, neuronal stress, immunogenicity, cytokine shifts, and off-brain organ exposure.`,
	                    bullets: [
	                      "separate shuttle-driven adverse effects from payload-driven toxicity.",
	                      "measure repeat-dose receptor handling, CSF/brain-region exposure, cell-type activity, and neuroinflammation markers together.",
	                      "stop escalation if transport improves exposure but worsens microglial activation, neuronal stress, or normal-tissue exposure.",
	                    ],
	                  }
	              : /toxicity|toxic|safety/.test(normalizedPrompt)
	                ? {
	                    title: /cns|brain|transport/i.test(`${contextLower} ${normalizedPrompt}`) ? "chronic CNS transport-handle safety" : "toxicity risks to watch",
	                    answer: /cns|brain|transport/i.test(`${contextLower} ${normalizedPrompt}`)
                        ? `for ${contextLabel}, chronic CNS transport handles can fail on safety even when delivery improves. watch receptor saturation or downregulation, endothelial trapping, peripheral sink effects, microglial activation, neuronal stress, immunogenicity, cytokine shifts, and off-brain organ exposure.`
                        : `for ${contextLabel}, the key toxicity question is whether normal tissue sees payload release, target-mediated uptake, immune activation, or organ exposure before the disease tissue gets enough useful activity. keep target-mediated toxicity, payload-class toxicity, repeat-dose tolerability, and high-exposure organ risk visible early.`,
	                    bullets: /cns|brain|transport/i.test(`${contextLower} ${normalizedPrompt}`)
                        ? [
                            "separate shuttle-driven adverse effects from payload-driven toxicity.",
                            "measure repeat-dose receptor handling, CSF/brain-region exposure, cell-type activity, and neuroinflammation markers together.",
                            "stop escalation if transport improves exposure but worsens microglial activation, neuronal stress, or normal-tissue exposure.",
                          ]
                        : [
	                          "separate target-mediated toxicity from payload-class toxicity.",
	                          "measure release stability in plasma and normal-cell uptake before optimizing potency.",
	                          "do not let a stronger bystander effect outrun the safety window.",
	                        ],
	                  }
                  : /transport handle|receptor|uptake handle/.test(normalizedPrompt)
                  ? {
                      title: "receptor or uptake handle that matters",
                      answer: `for ${contextLabel}, the receptor or uptake handle only matters if it creates productive exposure in the disease-relevant cell and compartment. start by identifying whether the handle is meant to drive tissue access, cell uptake, lysosomal routing, endosomal escape, or local retention.`,
                      bullets: [
                        "test binding, uptake, trafficking, and functional activity as separate gates.",
                        "measure whether the construct reaches the relevant cell type and compartment, not only the tissue homogenate.",
                        "watch for receptor saturation, peripheral sink, recycling into nonproductive compartments, and loss of payload activity after attachment.",
                      ],
                      }
                    : /normal[- ]tissue|normal tissue|normal bone|normal muscle|normal organ|on-target|off-target/.test(normalizedPrompt)
                      ? {
                          title: "normal-tissue risk",
                          answer: `for ${contextLabel}, if the tissue target is also present in normal bone, muscle, or another essential normal tissue, the blocking issue is on-target/off-disease toxicity. the planner should not escalate potency until it proves a therapeutic window through expression level, disease-state selectivity, local activation, delivery bias, or payload mechanism.`,
                          bullets: [
                            "separate target-mediated uptake from nonspecific exposure and payload toxicity.",
                            "watch normal bone, muscle, high-exposure organs, and any tissue where the target has essential biology.",
                            "require a safety-window assay before optimizing potency or payload loading.",
                          ],
                        }
                    : /target[- ]bearing cell|cell type|cell state|activation state|internalization biology|interernalization|perceive internalization|receptor biology|endocytosis|endocytic|clathrin|caveolin|macropinocytosis|recycling|recycle|degradation|degrade|lysosomal|endosomal|transcytosis|transcytosing|microenvironment|hypoxia|hypoxic|acidic|low ph|ph\b|protease|protease-rich|stroma|stromal|fibrosis|fibrotic|interstitial pressure|vascular permeability|necrosis|necrotic|immune microenvironment|tumor microenvironment|immune infiltrate|myeloid|caf|matrix/.test(normalizedPrompt)
                      ? {
                          title: "cell biology and microenvironment gates",
                          answer: `for ${contextLabel}, do not treat internalization as a universal antigen property. the same antigen can be processed differently by tumor cells, immune cells, endothelial cells, neurons, glia, stroma, or normal tissue, and the local microenvironment can change whether IgG, Fab, VHH, scaffold, peptide, or multispecific formats actually deliver useful active species.`,
                          bullets: [
                            "target-bearing cell: measure uptake, recycling, degradation, transcytosis, and active-compartment access in the disease-driving cell and the highest-risk normal cell.",
                            "endocytic route: separate clathrin/caveolin/macropinocytosis, FcRn recycling, lysosomal routing, endosomal escape, and transcytosis because each one favors different protein size, valency, affinity, and linker logic.",
                            "microenvironment: hypoxia, acidic pH, proteases, dense stroma/fibrosis, interstitial pressure, necrosis, vascular permeability, and immune infiltrates can change penetration, retention, linker cleavage, payload release, and safety.",
                            "format consequence: compact proteins may penetrate better but clear faster; IgG/Fc may sustain exposure but trap in normal tissue or perivascular regions; multispecific, masked, or conditionally activated formats need a measured reason.",
                            "no-hallucination rule: label trafficking and microenvironment assumptions as measured, inferred, or speculative before saying one protein format is best.",
                          ],
                        }
                    : /trafficking|uptake|escape/.test(normalizedPrompt)
                      ? {
                          title: "trafficking risks",
                          answer: `for ${contextLabel}, the trafficking risk is that binding or bulk uptake looks good while the active species never reaches the productive compartment. treat internalization, processing route, endosomal escape, and final compartment access as separate gates.`,
                          bullets: [
                            "measure productive activity, not only total uptake or surface binding.",
                            "check whether the construct is trapped in dead-end endosomes or lysosomes.",
                            "test disease-relevant cells because stressed or differentiated cells can traffic the same target differently.",
                          ],
                        }
                  : /monoclonal|monospecific|bispecific|trispecific|multispecific/.test(normalizedPrompt)
                    ? {
                        title: "specificity format selection",
                        answer: `for ${contextLabel}, monospecific is the default when one target is selective and internalizing enough by itself. bispecific or multispecific formats become worth the complexity when one antigen is too patchy, when dual binding improves disease-vs-normal discrimination, or when one arm is a transport/shuttle handle and the other is the disease target.`,
                        bullets: [
                          "monospecific / monoclonal: simplest biology, manufacturing, and interpretation.",
                          "bispecific: useful for dual-antigen gating, shuttle-plus-target designs, or improving retention.",
                          "multispecific: reserve for cases where added binding logic clearly improves selectivity or delivery enough to justify developability risk.",
                        ],
                      }
                    : /enzyme format|enzyme conjugate|prodrug|catalytic/.test(normalizedPrompt)
                      ? {
                          title: "enzyme or catalytic modality fit",
                          answer: `for ${contextLabel}, enzyme conjugate logic only becomes attractive when catalysis, enzyme replacement, or local prodrug activation is the actual selectivity engine. if the enzyme is only being used as a complicated carrier, a simpler binder, ligand, or payload-conjugate format is usually easier to justify.`,
                          bullets: [
                            "upgrade enzyme logic when local turnover creates selectivity that binding alone cannot.",
                            "de-risk enzyme activity after conjugation before optimizing targeting.",
                            "watch background activity, substrate exposure, immunogenicity, and catalytic loss during attachment.",
                          ],
                        }
                      : /probody|masked|conditionall?y activated|newer modalit|innovative modalit|immune engager|degrader|molecular glue/.test(normalizedPrompt)
                        ? {
                            title: "newer modality screen",
                            answer: `for ${contextLabel}, newer formats should be screened by the problem they uniquely solve: masking for normal-tissue safety, shuttle logic for access, immune engagers for cell recruitment, degraders for intracellular target pharmacology, and molecular-glue logic only when the biology is truly proximity-driven.`,
                            bullets: [
                              "use masked/probody logic when normal-tissue target expression is the main blocker.",
                              "use shuttle or transport logic when exposure, not potency, is the limiting variable.",
                              "use degrader or glue logic only when intracellular target engagement and ternary-complex biology are plausible.",
                            ],
                          }
	                  : /protein|binder|full antibody|full igg|igg|kappa|lambda|fc\b|fc[- ]?fusion|minibody|half antibody|sip\b|small immunoprotein|nanobody|scfv|vhh|fab\b|affibody|adnectin|anticalin|darpin|knottin|abdurin|bispecific|trispecific|multispecific|tandem scfv|igg-scfv|igg-dab|scfv-fc-scfv|kih|kappa-lambda|cyclic peptide|affinity|avidity/.test(normalizedPrompt)
	                    ? {
	                        title: "protein format selection",
	                        answer: `for ${contextLabel}, choose the protein format by the biological bottleneck, not by defaulting to IgG. compare full IgG/Fc formats, Fab/scFv/VHH/nanobody, minibody/SIP/half-antibody, engineered scaffolds such as affibody, adnectin, anticalin, DARPin, knottin or abdurin-like formats, cyclic peptides, and bispecific/trispecific/multispecific architectures only if each one solves a real delivery, avidity, PK/PD, or safety problem.`,
	                        bullets: [
	                          "IgG/Fc formats: strongest when half-life, FcRn recycling, mature CMC, effector/Fc engineering, and controlled DAR 2-4 are more valuable than fast penetration; kappa versus lambda is mainly clone/developability and pairing-driven.",
	                          "small antibody-derived formats: VHH/nanobody, scFv, Fab, minibody, SIP, and half-antibody can improve penetration, modularity, or clearance but may lose half-life, avidity, payload capacity, and stability.",
	                          "engineered scaffolds/cyclic peptides: affibody, adnectin, anticalin, DARPin, knottin, abdurin-like, or cyclic-peptide options are conditional on validated binding after payload attachment and acceptable immunogenicity/PK.",
	                          "multispecific formats: IgG-scFv, IgG-dAb, scFv-Fc-scFv, KiH-IgG, kappa-lambda body, KiH-Fc-Fab/scFv, KiH trispecific, or tandem scFv should solve dual-antigen gating, shuttle-plus-target delivery, or avidity/retention, not add complexity for its own sake.",
	                          "affinity/avidity rule: higher affinity is not always better; tune affinity and valency so the construct reaches the tissue, avoids normal-target trapping, internalizes or retains productively, and keeps PK/PD interpretable.",
	                        ],
	                      }
                    : /(best antigen|which antigen|what antigen|best target|which target|what target|tarhet)/.test(normalizedPrompt)
                      ? {
                          title: "target antigen shortlist",
                          answer: `for ${contextLabel}, do not pick a final antigen from disease name alone. the best first shortlist is the target set with the strongest tumor-normal separation, surface accessibility, internalization or retention, and payload-compatible biology in that exact subtype.`,
                          bullets: [
                            "oncology starting rule: compare the most disease-enriched surface antigens before choosing ADC, PDC, SMDC, or RDC logic.",
                            "rank antigens by expression separation, internalization/retention, heterogeneity, normal-tissue exposure, and whether the payload mechanism fits.",
                            "first experiment: run tumor-vs-normal expression plus internalization/trafficking in matched disease-relevant models before locking the construct.",
                          ],
                        }
                    : /what target would make|target would make/.test(normalizedPrompt)
                      ? {
                          title: "target that would make the class viable",
                          answer: targetOptions,
                          bullets: [
                            "for oncology ADCs: high target density, internalization, tumor-normal separation, and payload-sensitive disease biology.",
                            "for non-oncology: the target usually needs non-cytotoxic modulation or delivery logic, not classical cell killing.",
                            "upgrade confidence with expression maps, internalization data, and normal-tissue safety margins.",
                          ],
                        }
                      : /why can'?t you pick|why cant you pick/.test(normalizedPrompt)
                        ? {
                            title: "why i cannot responsibly pick one yet",
                            answer: `for ${contextLabel}, the missing piece is not the list of conjugate classes; it is the target, payload intent, and delivery route that would make one class biologically executable. without those, a confident recommendation would be a false precision answer.`,
                            bullets: [
                              "name the target or entry handle.",
                              "define whether the payload is cytotoxic, gene-modulating, immune-modulating, catalytic, radiologic, or supportive.",
                              "show the delivery route and compartment where the active species must work.",
                            ],
                          }
                        : {
                            title: "focused design decision",
                            answer: `for ${contextLabel}, answer the design decision by locking the biology first, then choosing the class, format, linker, and payload around that mechanism. the right next step is the one that removes the largest uncertainty in target access, active-species fit, or safety window.`,
                            bullets: [
                              "keep the answer tied to the prior disease and target context.",
                              "separate what is known from what would upgrade confidence.",
                              "test one design variable at a time so the result is interpretable.",
                            ],
                          };

      followUpAnswer = {
        kind: "design-decision",
        title: answerParts.title,
        answer: answerParts.answer,
        bullets: answerParts.bullets,
        usedPreviousResult: true,
      };
      break;
    }
    case "simplify":
      followUpAnswer = {
        kind: "simplify",
        title: "simple version",
        answer: /kras|non-small cell lung|nsclc/i.test(`${getPreviousContextLabel(contextResult)} ${slots.target ?? ""}`)
          ? "short version for the chemistry meeting: KRAS is intracellular, so do not frame it as a KRAS-surface ADC. pick a real lung-tumor entry handle, deliver a KRAS-pathway active species only if cytosolic or pathway engagement is proven, and benchmark against free KRAS inhibitor or oligo controls before optimizing linker, chemistry, or loading."
          : latestFollowUp
          ? `short version of ${latestFollowUpFocus}: ${latestFollowUp.answer}`
          : previousViability.noStrongClassYet
            ? "short version: there isn’t a strong conjugate class yet. the answer only supports a few provisional directions, and the missing target or entry handle is what would make it rankable."
            : `short version: ${contextResult.topPick ?? "the top class"} is leading, but it still depends on the biology and delivery assumptions from the last answer holding up.`,
        bullets: [
          /kras|non-small cell lung|nsclc/i.test(`${getPreviousContextLabel(contextResult)} ${slots.target ?? ""}`)
            ? "meeting takeaway: entry handle first, intracellular activity second, chemistry/loading third."
            : latestFollowUp?.title ? `based on: ${latestFollowUp.title}` : "",
          contextResult.presentation?.mode === "best-current-strategy-direction"
            ? `best current direction: ${(contextResult.presentation.strategyLanes ?? []).slice(0, 3).join(", ")}`
            : `top class: ${contextResult.topPick ?? "still conditional"}`,
        ],
        usedPreviousResult: true,
      };
      break;
    case "first-test":
      const keyExperimentSection = (contextResult.documentSections ?? []).find((section) =>
        /experiment|test|assay|validation/i.test(section.title),
      );
      const firstTestBullets =
        keyExperimentSection?.bullets?.slice(0, 4) ??
        (
          contextResult.presentation?.mode === "recommended-starting-point" && contextResult.presentation.firstValidationStep
            ? [contextResult.presentation.firstValidationStep]
            : []
        );
      followUpAnswer = {
        kind: "first-test",
        title: "first thing to test",
        answer: contextResult.presentation?.mode === "recommended-starting-point"
          ? `the first experiment is: ${contextResult.presentation.firstValidationStep ?? contextResult.constructBlueprint?.tradeoff ?? "run the core validation step from the previous answer."}`
          : "the first experiment should test the assumption that separates the top provisional lane from the rest: disease-specific target expression, normal-tissue separation, productive delivery, and active-species engagement.",
        bullets: firstTestBullets.length
          ? firstTestBullets
          : contextResult.innovativeIdeas?.[0]?.firstExperiment
            ? [contextResult.innovativeIdeas[0].firstExperiment]
            : [
                "map target or entry-handle expression in disease tissue versus normal tissue before locking the carrier.",
                "measure internalization, retention, trafficking, or compartment delivery in the relevant cell type.",
                "test payload or active-species activity in target-high, target-low, and target-negative models before optimizing chemistry.",
              ],
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
    trace: {
      ...contextResult.trace,
      normalization: {
        ...contextResult.trace?.normalization,
        mechanismClass: contextResult.trace?.normalization?.mechanismClass ?? "unknown",
        diseaseArea: contextResult.trace?.normalization?.diseaseArea ?? "unknown",
        diseaseSpecificity: contextResult.trace?.normalization?.diseaseSpecificity ?? "unknown",
        recommendationScope: contextResult.trace?.normalization?.recommendationScope ?? "disease-level",
        unknowns: contextResult.trace?.normalization?.unknowns ?? [],
        disease: slots.disease
          ? {
              ...(contextResult.trace?.normalization?.disease ?? {}),
              canonical: slots.disease,
              raw: contextResult.trace?.normalization?.disease?.raw ?? slots.disease,
              aliases: contextResult.trace?.normalization?.disease?.aliases ?? [],
              confidence: contextResult.trace?.normalization?.disease?.confidence ?? "medium",
            }
          : contextResult.trace?.normalization?.disease,
        target: slots.target
          ? {
              ...(contextResult.trace?.normalization?.target ?? {}),
              canonical: slots.target,
              raw: contextResult.trace?.normalization?.target?.raw ?? slots.target,
              aliases: contextResult.trace?.normalization?.target?.aliases ?? [],
              confidence: contextResult.trace?.normalization?.target?.confidence ?? "medium",
            }
          : contextResult.trace?.normalization?.target,
      },
    },
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

function defaultFormatForStrategyBucket(
  bucket: DiseaseExplorationStrategyBucket,
  primaryModality: string,
) {
  const label = normalize(bucket.label);
  if (/fcrn|igg-lowering|autoantibody/.test(label)) {
    return "FcRn-targeted biologic, Fc-engineered antibody, peptide, or compact binder format";
  }
  if (/complement/.test(label)) {
    return "complement-targeted antibody, Fab, peptide, or localized biologic format";
  }
  if (/antigen-specific|tolerance|autoantigen/.test(label)) {
    return "autoantigen-specific tolerance, peptide, nanoparticle, or compact biologic format";
  }
  if (/b-cell|plasma-cell|immune-targeted/.test(label)) {
    return "immune-cell targeted biologic or compact binder format";
  }
  return defaultFormatForModality(primaryModality);
}

function defaultPayloadForStrategyBucket(
  bucket: DiseaseExplorationStrategyBucket,
  primaryModality: string,
  abstraction: BiologicalAbstraction,
) {
  const label = normalize(bucket.label);
  if (/fcrn|igg-lowering|autoantibody/.test(label)) {
    return "non-cytotoxic IgG-lowering or pathogenic-antibody-reducing active species";
  }
  if (/complement/.test(label)) {
    return "non-cytotoxic complement-modulating active species";
  }
  if (/antigen-specific|tolerance|autoantigen/.test(label)) {
    return "antigen-specific immune-tolerance or receptor-protective active species";
  }
  if (/b-cell|plasma-cell/.test(label)) {
    return "selective humoral-source modulation only if chronic immune safety holds";
  }
  if (/immune-targeted|pathway-matched/.test(label) && abstraction.pathologyType === "autoimmune/inflammatory") {
    return "non-cytotoxic immune-modulating active species";
  }
  return defaultPayloadOrActiveSpecies(primaryModality, abstraction);
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
        bestFormat: compactTableText(defaultFormatForStrategyBucket(bucket, primaryModality)),
        linkerOrDeliveryLogic: compactTableText(bucket.entryHandleLogic),
        payloadOrActiveSpecies: compactTableText(defaultPayloadForStrategyBucket(bucket, primaryModality, abstraction)),
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
  if (presentation.mode === "parameter-framework") return "document-brief";
  if (strategyTable.length >= 3) return "table-first";
  return "document-brief";
}

function buildSuggestedFollowUps(
  normalizedCase: NormalizedCase,
  top?: RankedOption,
) {
  if (normalizedCase.broadOncologyNoTarget) {
    const shortlist = getOncologyTargetShortlist(normalizedCase);
    return [
      `Evaluate ${shortlist[0] ?? "the first target"}`,
      `Compare ${shortlist.slice(0, 4).join(" vs ")}`,
      "Which antigen would make ADC viable?",
      "Show a target-selection table",
      "What payload/linker would fit each target?",
      "What experiments validate the antigen window?",
    ];
  }

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
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
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

  if (followUpAnswer?.kind === "contextual-refinement") {
    const comparisonTension = buildComparisonTensionNote(prompt, top, ranking);
    const constructPresentation =
      presentation.mode === "recommended-starting-point" ? presentation : null;
    const missingEvidence =
      "mainMissingEvidence" in presentation ? presentation.mainMissingEvidence : undefined;
    const watchout =
      presentation.mode === "recommended-starting-point"
        ? presentation.biggestWatchout
        : "mainWatchout" in presentation
          ? presentation.mainWatchout
          : undefined;
    const refinementBullets = [
      constructPresentation?.recommendedFormat ? `best format: ${constructPresentation.recommendedFormat}` : "",
      constructPresentation?.recommendedLinker ? `linker context: ${constructPresentation.recommendedLinker}` : "",
      constructPresentation?.recommendedPayload ? `payload context: ${constructPresentation.recommendedPayload}` : "",
      constructPresentation?.recommendedChemistry ? `chemistry context: ${constructPresentation.recommendedChemistry}` : "",
      constructPresentation?.firstValidationStep ? `first validation step: ${constructPresentation.firstValidationStep}` : "",
      missingEvidence ? `main missing evidence: ${missingEvidence}` : "",
      ...(followUpAnswer.bullets ?? []),
    ].filter(Boolean);

    return [
      {
        title: "Direct Follow-Up Answer",
        body: followUpAnswer.answer,
        bullets: refinementBullets.slice(0, 6),
      },
      {
        title:
          presentation.mode === "recommended-starting-point"
            ? "Best Current Starting Point"
            : "Best Current Strategy",
        body:
          presentation.mode === "recommended-starting-point"
            ? topPickWhy
            : strategyTable[0]
              ? `provisional best exploratory lane: ${strategyTable[0].strategy}. this is still conditional, but it is the most useful place to pressure-test the next build decision.`
              : topPickWhy,
        bullets:
          presentation.mode === "recommended-starting-point"
            ? [
                constructGuidance?.format?.body ? `format rationale: ${takeLeadingSentences(constructGuidance.format.body, 2)}` : "",
                constructGuidance?.linker?.body ? `linker rationale: ${takeLeadingSentences(constructGuidance.linker.body, 2)}` : "",
                constructGuidance?.payload?.body ? `payload rationale: ${takeLeadingSentences(constructGuidance.payload.body, 2)}` : "",
              ].filter(Boolean)
            : strategyTable.slice(0, 2).map(
                (row) =>
                  `${row.strategy}: format ${row.bestFormat}; payload ${row.payloadOrActiveSpecies}; delivery logic ${row.linkerOrDeliveryLogic}.`,
              ),
      },
      {
        title: "Key Watchouts",
        body:
          [watchout, comparisonTension, missingEvidence]
            .filter(Boolean)
            .join(" ") || "the main remaining job is still to de-risk the biology, delivery, and exposure assumptions before over-optimizing chemistry.",
      },
    ];
  }

  const targetDiseaseSections = buildTargetDiseaseContextSections(prompt, normalizedCase);
  const targetReferenceSections = buildTargetReferenceSections(normalizedCase);
  const biologyToConstructSections =
    presentation.mode === "concept-explainer"
      ? []
      : buildBiologyToConstructLogicSections(normalizedCase, abstraction, constructGuidance);
  const proteinFormatSections = buildProteinFormatDecisionSections(
    prompt,
    normalizedCase,
    abstraction,
    constructGuidance,
    presentation,
  );
  const withReferenceSections = (sections: DocumentSection[]) => [
    ...targetDiseaseSections,
    ...targetReferenceSections,
    ...biologyToConstructSections,
    ...proteinFormatSections,
    ...sections,
  ];

  if (presentation.mode === "parameter-framework") {
    if (
      normalizedCase.parsed.questionType === "biology strategy" &&
      isCnsNeurodegenerationCase(normalizedCase, abstraction)
    ) {
      return withReferenceSections(buildCnsBiologyStrategySections(
        normalizedCase,
        abstraction,
        presentation,
      ));
    }

    return withReferenceSections(buildParameterFrameworkSections(
      normalizedCase,
      abstraction,
      exploration,
      strategyTable,
      constructGuidance,
      top,
    ));
  }

  if (presentation.mode === "best-current-strategy-direction" && normalizedCase.broadOncologyNoTarget) {
    return withReferenceSections(buildDiseaseOnlyOncologySections(
      normalizedCase,
      abstraction,
      presentation,
      strategyTable,
      top,
    ));
  }

  if (presentation.mode === "best-current-strategy-direction" && isCnsNeurodegenerationCase(normalizedCase, abstraction)) {
    return withReferenceSections(buildDiseaseOnlyCnsNeuroSections(
      normalizedCase,
      abstraction,
      presentation,
      strategyTable,
    ));
  }

  if (presentation.mode === "best-current-strategy-direction" && isAutoimmuneExplorationCase(normalizedCase, abstraction)) {
    return withReferenceSections(buildDiseaseOnlyAutoimmuneSections(
      normalizedCase,
      presentation,
      strategyTable,
    ));
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

      return withReferenceSections([
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
      ]);
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

    return withReferenceSections([
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
    ]);
  }

  if (presentation.mode === "concept-explainer") {
    return withReferenceSections([
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
    ]);
  }

  const strategyBullets =
    strategyTable.length
      ? strategyTable.slice(0, 4).map(
          (row) =>
            `${row.strategy}: ${row.whyItFits} main risk: ${row.riskOrFailureMode}`,
        )
      : (presentation.strategyLanes ?? []).slice(0, 4).map((lane) => `${lane}: worth pressure-testing before naming a final construct`);

  return withReferenceSections([
    {
      title: "Biology Read",
      body: presentation.rationale,
      bullets: [
        `confidence: ${presentation.confidence}`,
        presentation.explorationConfidence ? `exploration confidence: ${presentation.explorationConfidence}` : "",
        presentation.mainMissingEvidence ? `main missing evidence: ${presentation.mainMissingEvidence}` : "",
        `best next question: ${presentation.bestClarifier ?? exploration?.mostInformativeClarifier ?? "what single target or entry handle would collapse the most uncertainty here?"}`,
      ].filter(Boolean),
    },
    {
      title: "Most Plausible Strategy Lanes",
      body: "these are exploratory lanes, not final winners. the planner should keep them mechanism-gated until target, route, and payload biology are defined.",
      bullets: strategyBullets,
    },
    {
      title: "Dominant Constraints",
      body: "the answer should be constrained by biology and delivery execution, not by whichever conjugate abbreviation is most familiar.",
      bullets: [
        ...(presentation.dominantConstraints ?? exploration?.dominantConstraints ?? []).slice(0, 5),
        ...uncertainties.slice(0, 2),
      ].filter(Boolean),
    },
    ...(strategyTable.length
      ? [
          {
            title: "Best Current Strategy",
            body:
              strategyTable[0]
                ? `provisional best exploratory lane: ${strategyTable[0].strategy}. this is not a winner yet, but it is the most useful lane to pressure-test first from the current biology read.`
                : "no provisional exploratory lane is responsible yet.",
            bullets:
              strategyTable[0]
                ? [
                    `best format: ${strategyTable[0].bestFormat}`,
                    `payload / active species: ${strategyTable[0].payloadOrActiveSpecies}`,
                    `delivery logic: ${strategyTable[0].linkerOrDeliveryLogic}`,
                    `failure mode: ${strategyTable[0].riskOrFailureMode}`,
                  ]
                : [],
          },
        ]
      : []),
    {
      title: "Key Experiments",
      body: "the first experiments should collapse biology, delivery, and exposure uncertainty before over-optimizing chemistry.",
      bullets: buildDefaultExperimentList(normalizedCase, abstraction, top).slice(0, 5),
    },
  ]);
}

function buildContextualRefinementFollowUpAnswer(
  contextLabel: string,
  requestedFocus: string,
  presentation: PresentationSummary,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
  topPickWhy: string,
): FollowUpAnswer {
  const constructPresentation =
    presentation.mode === "recommended-starting-point" ? presentation : null;
  const missingEvidence =
    "mainMissingEvidence" in presentation ? presentation.mainMissingEvidence : undefined;
  const topLine =
    "topLine" in presentation
      ? presentation.topLine
      : "bestConjugateClass" in presentation
        ? presentation.bestConjugateClass
        : presentation.title;
  const decisionFocus = constructPresentation?.decisionFocus;
  const decisionFocusLabel =
    decisionFocus === "format"
      ? "format"
      : decisionFocus === "linker"
        ? "linker"
        : decisionFocus === "payload"
          ? "payload"
          : decisionFocus === "chemistry"
            ? "chemistry"
            : "design direction";
  const directChoice =
    decisionFocus === "format"
      ? constructPresentation?.recommendedFormat ?? constructGuidance?.format?.title
      : decisionFocus === "linker"
        ? constructPresentation?.recommendedLinker ?? constructGuidance?.linker?.title
        : decisionFocus === "payload"
          ? constructPresentation?.recommendedPayload ?? constructGuidance?.payload?.title
          : decisionFocus === "chemistry"
            ? constructPresentation?.recommendedChemistry
            : topLine;
  const rationale =
    decisionFocus === "format"
      ? constructGuidance?.format?.body
      : decisionFocus === "linker"
        ? constructGuidance?.linker?.body
        : decisionFocus === "payload"
          ? constructGuidance?.payload?.body
          : decisionFocus === "chemistry"
            ? topPickWhy
            : topPickWhy;

  return {
    kind: "contextual-refinement",
    title: `staying on ${contextLabel}`,
    answer: directChoice
      ? `staying on ${contextLabel}, the best current ${decisionFocusLabel} to try first is ${directChoice}. ${takeLeadingSentences(rationale ?? topPickWhy, 2)}`
      : `staying on ${contextLabel}, i treated ${requestedFocus} as a refinement of the same case rather than a brand-new prompt. ${takeLeadingSentences(topPickWhy, 2)}`,
    bullets: [
      `same context: ${contextLabel}`,
      `new requested focus: ${requestedFocus}`,
      constructPresentation?.firstValidationStep ? `first validation step: ${constructPresentation.firstValidationStep}` : "",
      missingEvidence ? `main missing evidence: ${missingEvidence}` : "",
    ].filter(Boolean),
    usedPreviousResult: true,
  };
}

function buildDiseaseOnlyOncologySections(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  presentation: Extract<PresentationSummary, { mode: "best-current-strategy-direction" }>,
  strategyTable: StrategyTableRow[],
  top?: RankedOption,
): DocumentSection[] {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this cancer";
  const shortlist = getOncologyTargetShortlist(normalizedCase);
  const leadingStrategy = strategyTable[0];
  const isHeme = isHematologicOncologyCase(normalizedCase);
  const isUnprofiled = isUnprofiledNamedDisease(normalizedCase);
  const directBody = isUnprofiled
    ? `${diseaseLabel} looks like a named disease prompt, but the responsible answer is not to reuse a familiar oncology target list or pretend one antigen is best. the planner should first ground the disease biology from current evidence: cell type, driver pathway, surface-accessible targets, normal-tissue overlap, disease compartment, payload sensitivity, and any clinical or translational precedent. only after that should ADC, PDC, SMDC, RDC, oligo, enzyme, bispecific, or newer modality logic be ranked.`
    : isHeme
      ? `${diseaseLabel} is an under-specified hematologic oncology prompt, so the useful answer is lineage/antigen-first rather than generic solid-tumor target-first. ADC or immune-targeted conjugate logic can be plausible, but it should not become a final recommendation until a disease-relevant antigen is checked for malignant-versus-normal immune-cell separation, internalization or retention, payload sensitivity, circulating target sink, and marrow/immune safety.`
      : `${diseaseLabel} is an under-specified oncology prompt, so the useful answer is evidence-first and target-first rather than winner-first. ADC logic can be a class-level starting lane, but it should not become a final recommendation until a target is selected from current disease evidence and checked for expression separation, internalization or retention, payload sensitivity, heterogeneity, and normal-tissue risk.`;
  const targetSectionBody = isUnprofiled
    ? "these are discovery buckets, not antigen recommendations. the point is to prevent template leakage from unrelated diseases while identifying the biology that could make a conjugate rankable."
    : "these are not automatic winners. they are discovery and comparison buckets that must be populated from current disease-specific evidence.";

  return [
    {
      title: "Direct Answer",
      body: directBody,
      bullets: [
        buildProfileUseNote(normalizedCase),
        `best current lane: ${leadingStrategy?.strategy ?? "target-conditioned payload delivery, but only after antigen selection"}`,
        `antigen shortlist to compare: ${shortlist.slice(0, 5).join(", ")}`,
        `main missing evidence: ${presentation.mainMissingEvidence ?? buildMainMissingEvidence(normalizedCase, abstraction, top, null)}`,
        `best next question: ${presentation.bestClarifier}`,
      ].filter(Boolean),
    },
    {
      title: "Why Target-First Matters",
      body: `${diseaseLabel} is not one conjugate biology. target expression, normal-tissue overlap, internalization, antigen shedding, tumor heterogeneity, and payload sensitivity decide whether ADC, PDC, SMDC, RDC, oligo, or enzyme logic is even worth ranking.`,
      bullets: buildOncologyDominantConstraints(normalizedCase).slice(0, 5),
    },
    {
      title: isUnprofiled ? "Biology Grounding Before Antigen Shortlist" : "Antigen Shortlist To Pressure-Test",
      body: targetSectionBody,
      bullets: shortlist.map((target) => {
        if (/disease-specific surface antigens/i.test(target)) return `${target}: retrieve or provide disease-specific evidence before treating any antigen as real.`;
        if (/lineage|cell-state/i.test(target)) return `${target}: rank only if malignant-cell enrichment and normal-tissue separation are shown.`;
        if (/internalizing receptors/i.test(target)) return `${target}: measure accessibility, uptake, trafficking, and payload-compatible processing before ADC/PDC/SMDC logic.`;
        if (/microenvironment|stromal/i.test(target)) return `${target}: useful only if localization changes exposure or mechanism beyond systemic treatment.`;
        if (/retained targets/i.test(target)) return `${target}: consider only if retention, dosimetry, or local activation is the therapeutic engine.`;
        return `${target}: rank only after expression window, accessibility, trafficking or retention, and payload compatibility are clear.`;
      }),
    },
    {
      title: "Best Current Strategy",
      body:
        leadingStrategy
          ? `${leadingStrategy.strategy} is the provisional organizing lane, not a final winner. It stays useful because oncology can support target-conditioned payload delivery, but the construct should not be locked until the antigen and payload mechanism are chosen.`
          : "the provisional organizing lane is target-conditioned payload delivery, but the target and payload mechanism have to be chosen before a final construct can be ranked.",
      bullets: [
        `format direction: ${leadingStrategy?.bestFormat ?? "antibody, fragment, peptide, small ligand, or radioligand format depends on the antigen"}`,
        `payload direction: ${leadingStrategy?.payloadOrActiveSpecies ?? "cytotoxic, radiotherapeutic, oligo, immune, or enzyme payload depends on the therapeutic event"}`,
        `delivery/release logic: ${leadingStrategy?.linkerOrDeliveryLogic ?? "match internalization, retention, and microenvironment processing to the payload"}`,
        `failure mode: ${leadingStrategy?.riskOrFailureMode ?? "the lane fails if antigen selectivity or payload sensitivity does not hold"}`,
      ],
    },
    {
      title: "Starting Construct Suggestions",
      body: isUnprofiled
        ? "start with a disease-biology discovery sequence rather than a construct. this keeps the planner useful for new diseases without hallucinating a known playbook."
        : `compare target-conditioned starting lanes instead of pretending ${diseaseLabel} has one default conjugate.`,
      bullets: isUnprofiled
        ? [
            "evidence-first lane: identify disease-driving cells, compartments, pathways, and surface-accessible or retained targets from current literature or user-provided data.",
            "target-validation lane: rank candidate handles by disease relevance, expression separation, accessibility, internalization/retention, heterogeneity, and normal-tissue risk.",
            "mechanism-matching lane: choose ADC, PDC, SMDC, RDC, oligo, enzyme/prodrug, bispecific, masked, or immune-engager logic only after the therapeutic event is clear.",
            "comparator lane: keep one simpler non-conjugate or standard-of-care comparator visible so conjugation has to prove added value.",
            "abstain lane: if disease evidence remains thin, provide a testing plan and clarifier instead of a final conjugate recommendation.",
          ]
        : [
            "ADC lane: full IgG or engineered antibody plus cleavable or non-cleavable linker only after antigen density and internalization are proven.",
            "RDC lane: ligand, antibody fragment, or peptide-chelator-isotope construct only if target retention and dosimetry are the therapeutic engine.",
            "SMDC/PDC lane: compact ligand or peptide format only if binding survives linker-payload attachment and tumor localization is strong.",
            "Oligo/gene-modulation lane: delivery-decorated oligo only if a causal transcript or pathway target is selected.",
            "Enzyme/prodrug lane: targeted enzyme or prodrug-activation construct only if local activation creates selectivity that binding alone cannot.",
          ],
    },
    {
      title: "Key Experiments",
      body: "the first experiments should identify which antigen biology can support a therapeutic window before chemistry is optimized.",
      bullets: buildDefaultExperimentList(normalizedCase, abstraction, top).slice(0, 5),
    },
  ];
}

function buildDiseaseOnlyCnsNeuroSections(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  presentation: Extract<PresentationSummary, { mode: "best-current-strategy-direction" }>,
  strategyTable: StrategyTableRow[],
): DocumentSection[] {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this neurodegenerative disease";
  const biologyChoices = getCnsNeurobiologyShortlist(normalizedCase);
  const leadingStrategy = strategyTable[0];

  return [
    {
      title: "Direct Answer",
      body: buildCnsNeuroDirectAnswer(normalizedCase, presentation),
      bullets: [
        `best current lane: ${leadingStrategy?.strategy ?? "BBB/CSF-enabled biology-matched delivery"}`,
        `biology choices to compare: ${biologyChoices.slice(0, 5).join(", ")}`,
        `main missing evidence: ${presentation.mainMissingEvidence}`,
        `best next question: ${presentation.bestClarifier}`,
      ],
    },
    {
      title: "Disease Biology Map",
      body: `${diseaseLabel} should be approached as a set of disease mechanisms, not as one default conjugate class. each mechanism points to a different active species, entry route, and safety risk.`,
      bullets: biologyChoices.map((choice) => {
        if (/alpha-synuclein|amyloid|tau|protein burden|proteostasis/i.test(choice)) return `${choice}: points toward clearance, proteostasis support, degradation, or RNA/protein-lowering strategies rather than classical released-warhead killing.`;
        if (/LRRK2|GBA|lysosomal|autophagy/i.test(choice)) return `${choice}: points toward lysosomal routing, enzyme/catalytic rescue, or pathway-modulating cargo if the target cell and compartment are reachable.`;
        if (/mitochondrial|mitophagy/i.test(choice)) return `${choice}: points toward organelle-aware small-molecule, peptide, or supportive payload logic, but exposure and off-tissue safety must be proven.`;
        if (/inflammation|glial|microglial/i.test(choice)) return `${choice}: points toward glia-biased delivery or immune-modulating payloads, with chronic immune and neuroinflammation risks tested early.`;
        if (/dopaminergic|neuron|striatal|motor/i.test(choice)) return `${choice}: points toward cell-type-biased delivery, but selective access and safety are the hard gates.`;
        return `${choice}: this is the delivery gate; without a real BBB, CSF, receptor-mediated transport, or local dosing route, the construct can look good in blood and fail in brain.`;
      }),
    },
    {
      title: "What A Conjugate Could Exploit",
      body: "the best possibilities are the ones where conjugation creates a biological advantage that free drug or naked oligo cannot: better CNS entry, better cell-type routing, better compartment delivery, or safer repeat dosing.",
      bullets: [
        "BBB-shuttled oligo or RNA-modulating cargo: useful if the disease driver is transcript, splice, or gene-expression biology and productive intracellular delivery can be measured.",
        "compact biologic or peptide delivery: useful if a VHH, Fab, scFv, peptide, receptor ligand, or shuttle improves CNS routing without losing activity.",
        "mitochondrial, lysosomal, or proteostasis-support conjugates: useful if the cargo reaches the stressed compartment and changes disease biology rather than only increasing uptake.",
        "glia- or neuron-biased delivery: useful if cell-type localization improves the therapeutic window and does not create broad normal-CNS liability.",
        "classical cytotoxic ADC logic: usually a poor default for chronic neurodegeneration unless there is a very explicit selective cell-depletion hypothesis.",
      ],
    },
    {
      title: "Best Current Strategy",
      body:
        leadingStrategy
          ? `${leadingStrategy.strategy} is the provisional organizing lane, not a final winner. it stays useful because ${diseaseLabel} is delivery-limited and biology-modulation-heavy, but the construct should not be locked until the biology and CNS entry route are chosen.`
          : "the provisional organizing lane is BBB/CSF-enabled biology-matched delivery, but the biology and CNS entry route have to be chosen before a final construct can be ranked.",
      bullets: [
        `format direction: ${leadingStrategy?.bestFormat ?? "oligo, compact biologic, peptide, small ligand, or enzyme format depending on the biology"}`,
        `payload direction: ${leadingStrategy?.payloadOrActiveSpecies ?? "non-cytotoxic oligo or pathway-modulating active species"}`,
        `delivery logic: ${leadingStrategy?.linkerOrDeliveryLogic ?? "match BBB/CSF entry, cell type, and intracellular compartment to the payload"}`,
        `failure mode: ${leadingStrategy?.riskOrFailureMode ?? "better uptake without productive CNS mechanism execution"}`,
      ],
    },
    {
      title: "First Experiments",
      body: "the first experiments should tell us whether the biology is movable and whether delivery is productive, not merely whether the construct binds.",
      bullets: [
        "choose one disease biology first, then map the relevant CNS cell type and active compartment.",
        "compare BBB/transcytosis, CSF-to-tissue, or local delivery routes before optimizing linker chemistry.",
        "measure productive intracellular exposure: knockdown, splice rescue, pathway rescue, lysosomal routing, mitochondrial effect, or inflammatory-state shift.",
        "run target-high, target-low, and normal-CNS comparator systems to catch false selectivity.",
        "test repeat-dose tolerability, accumulation, immune activation, and receptor handling early because the disease context is chronic.",
      ],
    },
  ];
}

function buildDiseaseOnlyAutoimmuneSections(
  normalizedCase: NormalizedCase,
  presentation: Extract<PresentationSummary, { mode: "best-current-strategy-direction" }>,
  strategyTable: StrategyTableRow[],
): DocumentSection[] {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this autoimmune disease";
  const mechanisms = getAutoimmuneMechanismShortlist(normalizedCase);
  const leadingStrategy = strategyTable[0];

  return [
    {
      title: "Direct Answer",
      body: buildAutoimmuneDirectAnswer(normalizedCase),
      bullets: [
        `best current lane: ${leadingStrategy?.strategy ?? "immune-mechanism-matched modulation"}`,
        `mechanisms to compare: ${mechanisms.slice(0, 5).join(", ")}`,
        `main missing evidence: ${presentation.mainMissingEvidence}`,
        `best next question: ${presentation.bestClarifier}`,
      ],
    },
    {
      title: "Disease Biology Map",
      body: `${diseaseLabel} should be broken into immune mechanisms before naming a conjugate class. each mechanism creates a different carrier, payload, and safety problem.`,
      bullets: mechanisms.map((mechanism) => {
        if (/IgG|FcRn/i.test(mechanism)) return `${mechanism}: points toward IgG-lowering or FcRn-blocking biology, where the readout is pathogenic antibody reduction and preserved tolerability.`;
        if (/AChR|MuSK|LRP4|autoantigen/i.test(mechanism)) return `${mechanism}: points toward antigen-specific modulation, receptor protection, or tolerance-style strategies rather than generic cytotoxic delivery.`;
        if (/complement/i.test(mechanism)) return `${mechanism}: points toward complement interception or localization; terminal complement, C3/C5, and tissue injury markers become key readouts.`;
        if (/B-cell|plasma/i.test(mechanism)) return `${mechanism}: points toward humoral-source modulation, but broad depletion and infection risk are the hard safety gates.`;
        return `${mechanism}: this should be measured as functional rescue, not only target binding or exposure.`;
      }),
    },
    {
      title: "What A Conjugate Could Exploit",
      body: "the strongest autoimmune conjugate ideas use conjugation to improve mechanism selectivity, localization, half-life, or immune-state control without importing oncology-style cytotoxic assumptions.",
      bullets: [
        "FcRn / IgG-lowering lane: biologic, peptide, or compact binder logic if pathogenic antibody burden is the organizing disease driver.",
        "complement-modulation lane: targeted or localized complement control if complement injury is central enough to justify intervention.",
        "autoantigen-specific lane: AChR, MuSK, LRP4, or other antigen-focused tolerance/modulation if the disease subset is defined.",
        "B/plasma-cell lane: conditional only if the target creates safer selectivity than broad depletion.",
        "oligo/pathway lane: conditional if a causal immune transcript or pathway is selected and delivery to the right immune cell is credible.",
      ],
    },
    {
      title: "Best Current Strategy",
      body:
        leadingStrategy
          ? `${leadingStrategy.strategy} is the provisional organizing lane, not a final winner. it stays useful because ${diseaseLabel} is immune-mechanism driven, but the construct should not be locked until the mechanism and readout are chosen.`
          : "the provisional organizing lane is immune-mechanism-matched modulation, but the mechanism and functional readout have to be chosen before a final construct can be ranked.",
      bullets: [
        `format direction: ${leadingStrategy?.bestFormat ?? "biologic, compact binder, peptide, ligand, oligo, or enzyme format depending on mechanism"}`,
        `payload direction: ${leadingStrategy?.payloadOrActiveSpecies ?? "non-cytotoxic immune-modulating active species"}`,
        `delivery logic: ${leadingStrategy?.linkerOrDeliveryLogic ?? "match FcRn, complement, autoantigen, immune-cell, or tissue-localized biology to the active species"}`,
        `failure mode: ${leadingStrategy?.riskOrFailureMode ?? "broad immune modulation without enough disease-specific benefit"}`,
      ],
    },
    {
      title: "First Experiments",
      body: "the first experiments should prove mechanism movement and functional rescue before linker or format optimization.",
      bullets: [
        "resolve the disease subset and driver: AChR-positive, MuSK-positive, LRP4-positive, complement-heavy, FcRn/IgG burden, or B/plasma-cell driven.",
        "measure pathogenic IgG, FcRn occupancy or IgG turnover, complement activation, and neuromuscular-junction functional rescue where relevant.",
        "compare target-positive and target-negative immune/tissue systems so localization does not get mistaken for selectivity.",
        "test normal immune function, infection-risk markers, total IgG, complement tone, and repeat-dose tolerability early.",
        "keep a standard biologic comparator visible so the conjugate must prove it adds value beyond existing immune modulation.",
      ],
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

  if (normalizedCase.broadOncologyNoTarget) {
    return [
      {
        title: "antibody-sized format",
        badge: "target-window dependent",
        body: "use a full IgG or engineered antibody only if the antigen has enough tumor-normal separation, target density, and processing to justify long exposure and payload load.",
        bullets: [
          "best for high-confidence targets with internalization or strong retention.",
          "watch normal GI, liver, and marrow exposure before assuming oncology makes the window acceptable.",
        ],
      },
      {
        title: "compact fragment / peptide / ligand format",
        badge: "access and heterogeneity",
        body: "use a smaller format when penetration, faster distribution, or tumor heterogeneity matters more than maximum half-life.",
        bullets: [
          "best for targets where tissue access or retention is the main design problem.",
          "watch rapid clearance, kidney exposure, and loss of binding after payload attachment.",
        ],
      },
      {
        title: "radioligand or local-activation format",
        badge: "non-adc branch",
        body: "keep this branch alive if localization, dosimetry, or local activation is a better selectivity engine than intracellular cytotoxic release.",
        bullets: [
          "RDC needs target retention and organ dosimetry.",
          "enzyme/prodrug logic needs local activation that beats background activity.",
        ],
      },
    ];
  }

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
  const normalizedPrompt = normalize(`${prompt} ${normalizedCase.prompt}`);
  const modality = top?.name?.toLowerCase().trim() ?? "";
  const oligoCase = modality === "oligo conjugate" || normalizedCase.mechanismClass === "gene modulation";
  const cytotoxicCase = abstraction.cytotoxicFit === "favored" || modality === "adc" || modality === "pdc" || modality === "smdc";
  const deepLinkerAsk =
    /(linker|hydrazone|hydrozone|disulfide|protease|cathepsin|cathapsin|legumain|vcp|val[- ]?cit|pabc|peg|tandem|exo[- ]?skeleton|premature|cleavage|microenvironment)/.test(
      normalizedPrompt,
    );

  if (normalizedCase.broadOncologyNoTarget) {
    const cards: DepthModuleCard[] = [
      {
        title: "cleavable linker for bystander need",
        badge: "heterogeneity-sensitive",
        body: "best when the selected antigen is heterogeneous and the payload needs controlled release to reach nearby target-low cells.",
        bullets: [
          "works only if tumor processing supports release faster than systemic deconjugation.",
          "match protease, lysosomal, or microenvironment trigger to the target biology.",
        ],
      },
      {
        title: "non-cleavable linker for stability",
        badge: "window-first",
        body: "best when antigen-positive cells internalize and catabolize the carrier well enough, and minimizing free payload exposure matters more than bystander spread.",
        bullets: [
          "useful if normal-tissue toxicity is the dominant risk.",
          "weaker if antigen heterogeneity demands payload diffusion.",
        ],
      },
      {
        title: "enzyme-cleavable peptide linker",
        badge: "trigger-gated",
        body: "use this branch only after the disease model shows productive lysosomal or microenvironmental processing by proteases such as cathepsin-family enzymes, legumain, or another measured disease-relevant enzyme.",
        bullets: [
          "tune peptide sequence, self-immolative spacer, and steric shielding around plasma stability versus intracellular release.",
          "avoid assuming tumor protease expression equals useful release; measure release in disease and normal cells.",
        ],
      },
    ];
    if (deepLinkerAsk) {
      cards.push(
        {
          title: "hydrazone / acid-labile branch",
          badge: "conditional",
          body: "consider only when acid-triggered release is measured and useful; it is not a safe default because pH differences can be noisy and plasma stability can suffer.",
          bullets: [
            "best framed as a comparator against lysosomal protease-cleavable and non-cleavable logic.",
            "drop it if normal-tissue or circulation release is not clean.",
          ],
        },
        {
          title: "stabilized cleavage architecture",
          badge: "premature-cleavage control",
          body: "if enzyme-cleavable linkers release too early, test steric shielding, exosite-aware peptide design, tandem cleavage sites, self-immolative PABC-style spacers, or a non-cleavable fallback.",
          bullets: [
            "use these modifications to solve a measured instability problem, not as decorative complexity.",
            "verify that shielding does not block the intended disease-cell processing route.",
          ],
        },
        {
          title: "chelator / spacer or prodrug-activation logic",
          badge: "alternative engines",
          body: "use this branch when the therapeutic engine is radiolocalization or local activation rather than classical released-drug ADC behavior.",
          bullets: [
            "RDC linker logic is chelator stability plus isotope fit.",
            "enzyme/prodrug linker logic is local activation selectivity.",
          ],
        },
      );
    }
    return cards.slice(0, deepLinkerAsk ? 6 : 3);
  }

  if (oligoCase) {
    const cards: DepthModuleCard[] = [
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
    if (deepLinkerAsk) {
      cards.push(
        {
          title: "self-immolative or releasable oligo spacer",
          badge: "activity rescue",
          body: "use when the carrier blocks hybridization, RNase-H/RISC access, splice activity, or nuclear/cytosolic trafficking and release is needed to recover the active oligo.",
          bullets: [
            "prove released oligo integrity and activity, not only cleavage.",
            "watch out for linkers that improve uptake but damage intracellular potency.",
          ],
        },
        {
          title: "PEG / polar spacer tuning",
          badge: "steric and PK tuning",
          body: "add PEG or polar spacers only when steric burden, aggregation, uptake, kidney/liver handling, or oligo-carrier geometry is the measured problem.",
          bullets: [
            "too much spacer can weaken uptake, receptor engagement, or endosomal escape.",
            "screen spacer length as a biology variable, not only a chemistry convenience.",
          ],
        },
      );
    }
    return cards.slice(0, deepLinkerAsk ? 5 : 3);
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
      body: "best when lysosomal or protease-heavy processing should actively help payload release inside the right cells, and the disease model proves the trigger is compartment-biased enough.",
      bullets: [
        "val-cit, val-ala, cathepsin-tuned, legumain-tuned, or other enzyme-specific motifs should be chosen from measured processing, not name recognition.",
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
    cards.push(
      {
        title: "hydrazone / acid-labile linker",
        badge: "legacy / high-risk",
        body: "only a conditional option when acidic release is a real part of the endosomal, lysosomal, or microenvironment story and simpler linker classes are failing.",
        bullets: [
          "use as a deliberate exception, not the default.",
          "watch out for historical stability problems, noisy pH selectivity, and off-target release.",
        ],
      },
      {
        title: "self-immolative spacer",
        badge: "release-quality control",
        body: "PABC-style or related self-immolative spacers matter when cleavage must cleanly generate the active payload rather than a weakly active stuck metabolite.",
        bullets: [
          "use when payload potency depends on clean liberation after enzyme or chemical trigger.",
          "confirm the released species, not only disappearance of the intact conjugate.",
        ],
      },
      {
        title: "PEG / polar spacer tuning",
        badge: "hydrophobicity control",
        body: "add PEG or polar spacers when linker-payload hydrophobicity, high DAR, aggregation, liver clearance, or poor exposure is the measured limitation.",
        bullets: [
          "useful for hydrophobic linker-payloads such as VCP-like designs when PK or solubility suffers.",
          "too much PEG can reduce potency, internalization, tissue penetration, or payload release kinetics.",
        ],
      },
      {
        title: "stabilized enzyme-cleavable architecture",
        badge: "premature-cleavage control",
        body: "if enzyme-cleavable designs release too early, test sterically protected sequences, exosite-aware motifs, tandem cleavage sites, or tuned peptide variants.",
        bullets: [
          "only add these modifications after serum or normal-tissue cleavage is actually observed.",
          "make sure the protection does not also block disease-cell cleavage.",
        ],
      },
    );
  }

  if (modality === "rdc") {
    cards.unshift({
      title: "chelator-spacer radiolinker",
      badge: "rdc-specific",
      body: "for radionuclides, the linker is mostly about chelator stability, charge, target retention, isotope half-life, and clearance route rather than cleavable drug release.",
      bullets: [
        "test serum stability, transchelation, biodistribution, and tumor-to-organ dosimetry first.",
        "avoid cleavable motifs unless a separate local-activation mechanism is truly intended.",
      ],
    });
  }

  return cards.slice(0, deepLinkerAsk ? 7 : 3);
}

function buildPayloadDepthCards(
  prompt: string,
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
): DepthModuleCard[] {
  const modality = top?.name?.toLowerCase().trim() ?? "";
  const oligoSubtype = detectOligoSubtype(prompt, normalizedCase, abstraction);

  if (normalizedCase.broadOncologyNoTarget) {
    return [
      {
        title: "cytotoxic ADC/PDC/SMDC payload",
        badge: "target-window dependent",
        body: "microtubule or topoisomerase payloads are plausible only after the antigen window, internalization or retention, and tumor payload sensitivity are clear.",
        bullets: [
          "topoisomerase payloads can help heterogeneous tumors if bystander effect is needed.",
          "tubulin payloads can be cleaner when target-positive cell killing is the main goal.",
        ],
      },
      {
        title: "radiotherapeutic payload",
        badge: "localization engine",
        body: "beta or alpha emitters become attractive when target retention, isotope range, and tumor-to-organ dosimetry are stronger than released-drug logic.",
        bullets: [
          "use imaging or biodistribution first if localization is uncertain.",
          "organ exposure can dominate even when target binding looks good.",
        ],
      },
      {
        title: "RNA / pathway / local activation payload",
        badge: "non-cytotoxic branch",
        body: "keep this branch conditional for KRAS/pathway, RNA, immune, or prodrug-activation hypotheses where cell killing is not the only therapeutic event.",
        bullets: [
          "requires a causal transcript, pathway, immune node, or activation chemistry.",
          "must prove productive intracellular delivery or local activation, not only binding.",
        ],
      },
    ];
  }

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

  if (normalizedCase.broadOncologyNoTarget) {
    const shortlist = getOncologyTargetShortlist(normalizedCase);
    return [
      {
        title: "antigen decision tree",
        badge: "deep map",
        body: "start by eliminating targets that cannot create a therapeutic window, then compare the surviving targets by what mechanism they can support.",
        bullets: [
          "first gate: tumor-normal expression and high-exposure organ risk.",
          "second gate: surface accessibility, shedding, internalization, recycling, or retention.",
          "third gate: payload sensitivity, bystander need, isotope dosimetry, or local activation fit.",
        ],
      },
      {
        title: "target comparison matrix",
        badge: "target shortlist",
        body: `compare ${shortlist.slice(0, 5).join(", ")} as different biological bets rather than treating them as interchangeable antigens.`,
        bullets: shortlist.slice(0, 5).map((target) => {
          return `${target}: rank only after local disease expression, normal-tissue overlap, accessibility, internalization or retention, payload compatibility, and safety-window validation.`;
        }),
      },
      {
        title: "tumor microenvironment pressure",
        badge: "biology pressure",
        body: "the disease microenvironment can change target access, retention, linker processing, payload spread, immune state, and normal-tissue risk; those features decide whether a payload reaches the cells that matter.",
        bullets: [
          "high heterogeneity pushes toward bystander-capable payloads, dual targeting, or local activation.",
          "poor penetration pushes toward compact formats or payloads that do not require every cell to be antigen-high.",
          "normal-tissue overlap pushes toward safer release, masking, local activation, or target-subset restriction.",
        ],
      },
    ];
  }

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

function buildCnsNeuroDepthModules(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  exploration: ReturnType<typeof buildDiseaseExploration> | null,
  top: RankedOption | undefined,
): DepthModule[] {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this neurodegenerative disease";
  const biologyChoices = getCnsNeurobiologyShortlist(normalizedCase);

  return [
    {
      key: "biology-pressures",
      title: "cns disease biology decision map",
      summary: "deep mode starts with the disease mechanism, vulnerable cell type, active compartment, and whether the biology is actually movable.",
      cards: [
        {
          title: "mechanism families to rank first",
          badge: "biology first",
          body: `${diseaseLabel} should be split into mechanism families before picking a conjugate class.`,
          bullets: biologyChoices.slice(0, 6),
        },
        {
          title: "what would make the biology actionable",
          badge: "rankability gate",
          body: "a conjugate becomes rankable only when the active species changes a disease-relevant mechanism in the right CNS cell and compartment.",
          bullets: [
            "define the causal target: transcript, protein burden, lysosomal pathway, mitochondrial stress, inflammatory state, or cell subtype.",
            "define where activity must happen: CSF, extracellular space, endosome/lysosome, cytosol, nucleus, mitochondria, neuron, glia, or endothelium.",
            `main current gap: ${buildMainMissingEvidence(normalizedCase, abstraction, top, exploration)}.`,
          ],
        },
      ],
    },
    {
      key: "format-options",
      title: "cns entry and carrier format map",
      summary: "format choice should follow the route into CNS tissue and the compartment where the active species must work.",
      cards: [
        {
          title: "BBB shuttle or receptor-mediated transport",
          badge: "systemic route",
          body: "best when the construct needs peripheral dosing but must cross brain endothelium without getting trapped in non-productive compartments.",
          bullets: [
            "pressure-test transferrin-receptor, insulin-receptor, or other shuttle logic only with productive CNS exposure assays.",
            "compare compact binders such as VHH, scFv, Fab, peptide, or ligand handles rather than assuming full IgG is best.",
          ],
        },
        {
          title: "CSF or local delivery",
          badge: "route shortcut",
          body: "useful when systemic BBB crossing is too weak, but tissue spread, repeat dosing, and cell uptake still have to be proven.",
          bullets: [
            "intrathecal or intracerebroventricular logic can bypass part of the BBB problem but not the cellular trafficking problem.",
            "distribution gradients and chronic tolerability become the key constraints.",
          ],
        },
        {
          title: "cell-type or compartment-biased carrier",
          badge: "precision route",
          body: "worth testing only if the handle improves neuron, glia, lysosomal, mitochondrial, or endothelial routing in a way that changes mechanism execution.",
          bullets: [
            "measure active cargo in the relevant compartment, not only total tissue uptake.",
            "keep a minimally decorated comparator visible so the carrier has to earn its complexity.",
          ],
        },
      ],
    },
    {
      key: "payload-options",
      title: "active species by neurobiology",
      summary: "deep mode should compare active species by disease mechanism, not list generic warheads.",
      cards: [
        {
          title: "oligo / RNA modulation",
          badge: "lead when sequence-directed",
          body: "best when the disease hypothesis is transcript lowering, splice correction, allele-selective modulation, or pathway reset.",
          bullets: [
            "ASO can fit nuclear or RNase-H logic; siRNA needs cytosolic RISC access; PMO is stronger when splice correction is central.",
            "the hard gate is productive intracellular exposure, not generic uptake.",
          ],
        },
        {
          title: "proteostasis, lysosomal, or enzyme-support cargo",
          badge: "conditional",
          body: "use when the disease mechanism is protein handling, lysosomal/autophagy failure, or catalytic rescue.",
          bullets: [
            "the carrier should route toward the processing compartment that makes the cargo work.",
            "enzyme/prodrug logic should stay conditional unless catalysis is the selectivity engine.",
          ],
        },
        {
          title: "mitochondrial or neuroinflammation modulators",
          badge: "supportive lane",
          body: "use when the payload can shift a stressed cellular state without needing cell killing.",
          bullets: [
            "mitochondrial support needs organelle-relevant exposure and off-tissue safety.",
            "glial or immune modulation needs chronic immune-state monitoring, not only acute efficacy.",
          ],
        },
      ],
    },
    {
      key: "trafficking-bottlenecks",
      title: "productive delivery and trafficking map",
      summary: "the main failure mode is confusing binding or uptake with useful disease-mechanism execution.",
      cards: [
        {
          title: "uptake is not enough",
          badge: "hidden trap",
          body: "whole-cell uptake, CSF signal, or brain homogenate exposure can look encouraging while the active compartment receives almost no usable cargo.",
          bullets: [
            "measure compartment-correct delivery: cytosolic, nuclear, lysosomal, mitochondrial, or extracellular depending on the payload.",
            "separate endothelial transport, tissue spread, cell uptake, endosomal escape, and target engagement as different gates.",
          ],
        },
        {
          title: "endosomal and lysosomal routing",
          badge: "compartment gate",
          body: "some payloads need lysosomal processing, while others fail if they remain trapped there.",
          bullets: [
            "ASO/siRNA often need escape or nuclear/cytosolic access.",
            "enzyme or proteostasis cargo may benefit from lysosomal routing if that is truly the mechanism.",
          ],
        },
      ],
    },
    {
      key: "pkpd-pressures",
      title: "cns pk / pd and chronic safety",
      summary: "deep mode should stress-test repeat dosing, tissue exposure, immune activation, and receptor handling before chemistry polish.",
      cards: [
        {
          title: "exposure versus mechanism execution",
          badge: "pk/pd",
          body: "good plasma PK or brain signal is only useful if it creates enough active species in the relevant CNS compartment.",
          bullets: [
            "track free active species, conjugated species, and functional PD marker separately.",
            "watch for receptor saturation, transcytosis desensitization, and peripheral sink effects.",
          ],
        },
        {
          title: "repeat dosing risk",
          badge: "chronic disease",
          body: "neurodegeneration programs must survive chronic exposure, accumulation, immune activation, and delayed toxicity.",
          bullets: [
            "test microglial activation, cytokine shifts, neuronal stress markers, and organ exposure early.",
            "watch for small improvements in delivery that create large tolerability problems.",
          ],
        },
      ],
    },
    {
      key: "experimental-tradeoffs",
      title: "first experiment sequence",
      summary: "the first round should identify whether disease biology, CNS entry, trafficking, or active species is the bottleneck.",
      cards: [
        {
          title: "round 1: biology and route",
          badge: "do first",
          body: "hold the active species constant where possible and vary the entry route or carrier so we can learn what is limiting.",
          bullets: [
            "pick one disease biology and one PD marker before building multiple formats.",
            "compare naked/minimally modified cargo, shuttle-decorated cargo, and one compact carrier.",
          ],
        },
        {
          title: "round 2: productive activity",
          badge: "decision point",
          body: "continue only if the construct creates target engagement or pathway rescue in the relevant cell type.",
          bullets: [
            "require a functional readout: knockdown, splice correction, lysosomal rescue, mitochondrial rescue, or inflammatory-state shift.",
            "drop formats that improve exposure but not mechanism execution.",
          ],
        },
      ],
    },
  ];
}

function buildAutoimmuneDepthModules(normalizedCase: NormalizedCase): DepthModule[] {
  const diseaseLabel = normalizedCase.disease?.canonical ?? normalizedCase.disease?.raw ?? "this autoimmune disease";
  const mechanisms = getAutoimmuneMechanismShortlist(normalizedCase);

  return [
    {
      key: "biology-pressures",
      title: "autoimmune mechanism decision map",
      summary: "deep mode starts with the immune driver, affected tissue, functional readout, and how selective the intervention can be.",
      cards: [
        {
          title: "mechanism families to rank first",
          badge: "biology first",
          body: `${diseaseLabel} should be split by immune mechanism before picking a conjugate class.`,
          bullets: mechanisms.slice(0, 6),
        },
        {
          title: "what makes it actionable",
          badge: "rankability gate",
          body: "a conjugate becomes rankable only when it moves a disease-driving immune mechanism with a measurable functional readout.",
          bullets: [
            "define whether the intervention is IgG lowering, FcRn blockade, complement interception, antigen-specific tolerance, B/plasma-cell modulation, or tissue protection.",
            "define the safety budget: total IgG, infection risk, complement tone, tissue function, and chronic repeat dosing.",
          ],
        },
      ],
    },
    {
      key: "format-options",
      title: "immune target and carrier format map",
      summary: "format choice should follow immune mechanism and exposure window, not default to ADC-style released payloads.",
      cards: [
        {
          title: "FcRn / IgG-lowering biologic logic",
          badge: "humoral lane",
          body: "best when pathogenic IgG burden is the organizing disease driver and the desired PD readout is reduced pathogenic antibody activity.",
          bullets: [
            "compare antibody, Fc-engineered, peptide, or compact binder logic against existing FcRn-style biologic benchmarks.",
            "watch total IgG reduction, infection risk, albumin/IgG handling, and rebound dynamics.",
          ],
        },
        {
          title: "complement-localized modulation",
          badge: "injury lane",
          body: "best when complement activation is close enough to the tissue injury mechanism that local or pathway-biased inhibition adds value.",
          bullets: [
            "measure complement activation and tissue-functional rescue together.",
            "avoid assuming complement is causal if it is only a downstream marker.",
          ],
        },
        {
          title: "autoantigen-specific or tolerance format",
          badge: "precision lane",
          body: "highest-upside but hardest lane: useful when AChR, MuSK, LRP4, or another autoantigen can focus the intervention more narrowly than broad immunosuppression.",
          bullets: [
            "requires subset definition and antigen-specific functional readouts.",
            "failure mode is weak selectivity or incomplete coverage of disease heterogeneity.",
          ],
        },
      ],
    },
    {
      key: "payload-options",
      title: "active species by immune mechanism",
      summary: "deep mode should compare immune-modulating payloads by mechanism, not generic oncology warheads.",
      cards: [
        {
          title: "non-cytotoxic immune modulation",
          badge: "default",
          body: "the safest default for chronic autoimmune disease is a non-cytotoxic active species that changes antibody recycling, complement activity, signaling, or tolerance.",
          bullets: [
            "payload success should be judged by disease mechanism movement and functional rescue.",
            "broad immune shutdown is a liability unless the disease biology truly requires depletion.",
          ],
        },
        {
          title: "pathway or RNA modulation",
          badge: "conditional",
          body: "use oligo or pathway cargo only if a causal immune transcript/pathway is selected and delivery to the relevant immune cell or tissue is credible.",
          bullets: [
            "measure productive intracellular delivery if the active species needs cell entry.",
            "keep a simpler biologic comparator so the delivery architecture has to earn its complexity.",
          ],
        },
        {
          title: "depletion or ablation payload",
          badge: "high risk",
          body: "selective immune-cell depletion can be considered only when the target creates a safety window better than broad immunosuppression.",
          bullets: [
            "classical cytotoxic ADC logic should not lead disease-only autoimmune prompts.",
            "infection risk and immune reconstitution must be part of the first screen.",
          ],
        },
      ],
    },
    {
      key: "pkpd-pressures",
      title: "autoimmune pk / pd and chronic safety",
      summary: "deep mode should stress-test immune PD, repeat dosing, rebound biology, and normal immune function.",
      cards: [
        {
          title: "pd marker hierarchy",
          badge: "readout map",
          body: "binding is not enough; the construct needs to move pathogenic antibody activity, complement injury, tissue function, or antigen-specific immune state.",
          bullets: [
            "track total IgG, pathogenic IgG, FcRn occupancy, complement markers, and functional rescue separately.",
            "for myasthenia gravis, neuromuscular-junction function matters more than generic uptake.",
          ],
        },
        {
          title: "repeat dosing and immune safety",
          badge: "chronic gate",
          body: "autoimmune treatment usually needs repeat dosing, so small mechanistic wins can be wiped out by infection risk, immunogenicity, or broad immune suppression.",
          bullets: [
            "monitor infection-risk proxies, cytokine shifts, complement tone, total immunoglobulin, and tissue function.",
            "watch for rebound after IgG-lowering or complement-targeted strategies.",
          ],
        },
      ],
    },
    {
      key: "experimental-tradeoffs",
      title: "first experiment sequence",
      summary: "the first round should decide whether the disease is antibody, complement, autoantigen, B/plasma-cell, or tissue-protection driven.",
      cards: [
        {
          title: "round 1: mechanism and subset",
          badge: "do first",
          body: "choose one immune mechanism and one functional readout before building multiple conjugate formats.",
          bullets: [
            "for MG, split AChR-positive, MuSK-positive, LRP4-positive, and seronegative assumptions when possible.",
            "compare a standard biologic-style comparator against the conjugate concept.",
          ],
        },
        {
          title: "round 2: functional rescue",
          badge: "decision point",
          body: "continue only if the construct improves the mechanism marker and the functional disease readout without unacceptable immune liability.",
          bullets: [
            "drop formats that look target-engaged but do not improve pathogenic antibody, complement, or tissue-function readouts.",
            "do not optimize linker chemistry until the immune mechanism is proven useful.",
          ],
        },
      ],
    },
  ];
}

function buildPkPdDepthCards(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
): DepthModuleCard[] {
  const modality = top?.name?.toLowerCase().trim() ?? "";
  const targetLabel =
    normalizedCase.target?.canonical ??
    normalizedCase.target?.raw ??
    "the target";
  const barrierLimited = abstraction.deliveryAccessibility === "barrier-limited";
  const intracellular = abstraction.deliveryAccessibility === "intracellular difficult";
  const chronic = abstraction.treatmentContext === "chronic";
  const oligoLike = modality === "oligo conjugate" || normalizedCase.mechanismClass === "gene modulation";

  const cards: DepthModuleCard[] = [];

  if (normalizedCase.broadOncologyNoTarget) {
    return [
      {
        title: "dose intensity versus toxicity window",
        badge: "oncology pk/pd",
        body: "for colorectal oncology conjugates, the key pk/pd issue is not generic chronic dosing; it is whether tumor exposure can be high enough across treatment cycles without marrow, GI, liver, or payload-driven toxicity dominating.",
        bullets: [
          "measure total conjugate, released payload or catabolite, and tumor exposure separately.",
          "watch cumulative payload exposure if the linker or clearance profile is not clean.",
        ],
      },
      {
        title: "tumor penetration and heterogeneity",
        badge: "distribution gate",
        body: "a construct can look good in plasma and still fail if antibody-sized delivery does not penetrate antigen-low or stromal-rich tumor regions.",
        bullets: [
          "compare antibody-sized and compact formats when heterogeneity or penetration is a concern.",
          "bystander payload can help target-low regions but can also narrow the safety window.",
        ],
      },
      {
        title: "organ exposure and clearance route",
        badge: "translation risk",
        body: "GI epithelium, liver, kidney, marrow, and antigen-positive normal tissues should be treated as active design constraints from the first screen.",
        bullets: [
          "RDC branches need tumor-to-organ dosimetry, not just target binding.",
          "SMDC/PDC branches need kidney and clearance profiling early.",
          "ADC branches need on-target/off-tumor and free-payload exposure control.",
        ],
      },
    ];
  }

  if (barrierLimited) {
    cards.push({
      title: "brain or barrier exposure",
      badge: "pk gate",
      body: "the main pk question is not only circulation time, it is whether enough construct ever gets across the barrier or into csf and then on to the actual cell type that matters.",
      bullets: [
        "pressure-test receptor-mediated transport, csf dosing, or local delivery before over-optimizing payload chemistry.",
        "watch out for plasma exposure looking healthy while tissue exposure stays trivial.",
      ],
    });
  }

  if (oligoLike) {
    cards.push({
      title: "productive intracellular exposure",
      badge: intracellular ? "pd-critical" : "delivery-sensitive",
      body: "for oligo or transcript-directed systems, the pk story only matters if it turns into real intracellular and compartment-correct exposure, not bulk uptake alone.",
      bullets: [
        "measure active strand delivery in the relevant compartment instead of trusting whole-tissue signal.",
        "watch out for exposure gains that never become target knockdown, splice rescue, or transcript correction.",
      ],
    });
    } else if (modality === "adc") {
      cards.push({
        title: "circulation versus tumor processing",
        badge: "exposure balance",
      body: `the pk/pd balance is between enough circulation stability to reach the tumor and enough intracellular processing to liberate the active payload after ${targetLabel} uptake.`,
        bullets: [
          "if plasma instability rises, you will see off-target payload pressure before you see better tumor pharmacology.",
          "if uptake is slow, a clever linker still will not rescue the pd story.",
        ],
      });
  } else {
    cards.push({
      title: "exposure versus mechanism execution",
      badge: "pk/pd balance",
      body: "the important question is whether the construct spends its exposure budget in the right tissue and then actually executes the intended mechanism once it gets there.",
      bullets: [
        "good plasma pk is not enough if the active compartment never sees the construct in a usable form.",
      ],
    });
  }

  cards.push({
    title: chronic ? "repeat-dosing tolerability" : "acute exposure window",
    badge: chronic ? "chronic pk/pd" : "window",
    body: chronic
      ? "because this looks like a chronic program, the exposure plan has to survive repeat dosing, accumulation, and chronic on-target or off-target pressure."
      : "the main question is whether the exposure window can be intense enough to work without overshooting safety.",
    bullets: [
      chronic
        ? "screen accumulation, delayed toxicity, and whether repeated exposure changes receptor handling or tissue uptake."
        : "check whether short exposure pulses still drive the intended biology.",
    ],
  });

  return cards.slice(0, 3);
}

function buildTraffickingDepthCards(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
): DepthModuleCard[] {
  const modality = top?.name?.toLowerCase().trim() ?? "";
  const oligoLike = modality === "oligo conjugate" || normalizedCase.mechanismClass === "gene modulation";
  const extracellular = abstraction.mechanismLocation === "extracellular";
  const barrierLimited = abstraction.deliveryAccessibility === "barrier-limited";

  if (oligoLike) {
    return [
      {
        title: "uptake is not enough",
        badge: "trafficking gate",
        body: "the key trafficking question is whether the construct escapes the endosomal route well enough to create real cytosolic or nuclear biology, not whether it merely enters the cell.",
        bullets: [
          "treat endosomal escape as a first-order variable, especially for sirna and many delivery-decorated aso builds.",
          "watch out for strong whole-cell uptake with flat target engagement.",
        ],
      },
      {
        title: "compartment-correct release",
        badge: abstraction.compartmentNeed === "nuclear" ? "nuclear access" : "cytosolic access",
        body: abstraction.compartmentNeed === "nuclear"
          ? "the route has to preserve the oligo long enough to reach the nucleus and still act there after any carrier processing."
          : "the route has to produce enough active species in the cytosol after uptake, not only in lysosomes or dead-end vesicles.",
        bullets: [
          "if the carrier comes off too early, you can lose targeting before uptake; too late, and activity can stay buried.",
        ],
      },
      {
        title: barrierLimited ? "transport then escape" : "entry then escape",
        badge: "sequence of failure",
        body: barrierLimited
          ? "for barrier-limited systems, you have two sequential trafficking risks: getting across the transport step and then escaping the intracellular trap."
          : "most failures here are sequential: binding looks fine, uptake looks decent, but endosomal escape or final compartment access collapses the biology.",
      },
    ];
  }

  if (extracellular) {
    return [
      {
        title: "avoid over-engineering uptake",
        badge: "extracellular biology",
        body: "if the biology is mostly extracellular, the trafficking goal is often to stay stable and present in the right place rather than forcing internalization for its own sake.",
        bullets: [
          "do not pay endosomal-complexity costs unless uptake is actually needed for the mechanism.",
        ],
      },
    ];
  }

  return [
    {
      title: "internalization quality",
      badge: "trafficking gate",
      body: "the main question is whether the target gives productive internalization and intracellular processing, not only surface binding.",
      bullets: [
        "measure the fraction that reaches a useful processing compartment, not only total uptake.",
      ],
    },
    {
      title: "processing route",
      badge: "release logic",
      body: "linker and payload choices only make sense if the trafficking route actually reaches the compartment that can process them the way the design assumes.",
      bullets: [
        "if lysosomal delivery is weak, protease-cleavable logic can look elegant and still underperform.",
      ],
    },
    {
      title: "heterogeneous cell-state handling",
      badge: "real tissue risk",
      body: "the same target can traffic differently across stressed, differentiated, or treatment-exposed cells, so one clean in-vitro route can overstate what happens in the real tissue.",
    },
  ];
}

function buildExperimentalTradeoffCards(
  normalizedCase: NormalizedCase,
  abstraction: BiologicalAbstraction,
  top: RankedOption | undefined,
  constructGuidance: ReturnType<typeof buildConstructGuidance> | null,
): DepthModuleCard[] {
  const modality = top?.name?.toLowerCase().trim() ?? "";
  const oligoLike = modality === "oligo conjugate" || normalizedCase.mechanismClass === "gene modulation";
  const formatTitle = constructGuidance?.format?.title ?? top?.name ?? "lead construct";
  const linkerTitle = constructGuidance?.linker?.title ?? "current linker direction";

  return [
    {
      title: "what to hold constant first",
      badge: "experimental discipline",
      body: oligoLike
        ? "hold the active oligo sequence constant while changing delivery handles, so you can tell whether the problem is biology fit or trafficking execution."
        : `hold the ${formatTitle.toLowerCase()} and payload class as stable as possible while you test the ${linkerTitle.toLowerCase()}, so the first comparison stays interpretable.`,
      bullets: [
        "change one variable per prototype round unless the current design is fundamentally incoherent.",
      ],
    },
    {
      title: "what comparator matters most",
      badge: "decision control",
      body: oligoLike
        ? "the most important comparator is usually the plain or minimally decorated oligo, because that tells you whether the extra delivery architecture is really buying productive biology."
        : "the most important comparator is usually the stability-first or older-playbook version, because it tells you whether the extra release or targeting complexity is actually earning its keep.",
      bullets: [
        "without a hard comparator, it is easy to overread fancy chemistry that only adds noise.",
      ],
    },
    {
      title: "where the program can fool you",
      badge: "failure analysis",
      body: abstraction.deliveryAccessibility === "barrier-limited"
        ? "you can get fooled by good plasma exposure, attractive receptor binding, or even transport-adjacent signal while the disease-relevant cell compartment still sees almost no useful drug."
        : oligoLike
          ? "you can get fooled by uptake, microscopy signal, or whole-tissue exposure while target knockdown or splice rescue stays flat."
          : "you can get fooled by binding and uptake while the real limiting step is intracellular release, catabolism, or safety margin.",
      bullets: [
        `best next test: ${buildFocusedValidationStep(
          { ...normalizedCase.parsed, questionType: normalizedCase.parsed.questionType },
          constructGuidance,
          buildDefaultExperimentList(normalizedCase, abstraction, top)[0] ?? "test the mechanism in the most disease-relevant assay first.",
        )}`,
      ],
    },
  ];
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

  if (normalizedCase.broadOncologyNoTarget) {
    const modules: DepthModule[] = [
      {
        key: "biology-pressures",
        title: "crc antigen and biology decision map",
        summary: "deep mode starts with antigen biology, tumor heterogeneity, normal-tissue window, and the mechanism each target can actually support.",
        cards: buildBiologyPressureCards(normalizedCase, abstraction, exploration, biology, uncertainties),
      },
      {
        key: "format-options",
        title: "format choices by target biology",
        summary: "the carrier format should follow antigen window, tissue access, retention, and internalization rather than defaulting to full IgG.",
        cards: buildFormatDepthCards(prompt, normalizedCase, abstraction, top),
      },
      {
        key: "payload-options",
        title: "payload strategy by mechanism",
        summary: "cytotoxic, radiotherapeutic, RNA/pathway, immune, and prodrug payloads are different biological bets.",
        cards: buildPayloadDepthCards(prompt, normalizedCase, abstraction, top),
      },
      {
        key: "linker-options",
        title: "linker / release strategy by tumor context",
        summary: "release logic should match internalization, bystander need, retention, microenvironment activation, or isotope chemistry.",
        cards: buildLinkerDepthCards(prompt, normalizedCase, abstraction, top),
      },
      {
        key: "pkpd-pressures",
        title: "oncology pk / pd and safety window",
        summary: "deep mode separates tumor exposure, released payload, organ exposure, and treatment-cycle tolerability.",
        cards: buildPkPdDepthCards(normalizedCase, abstraction, top),
      },
      {
        key: "experimental-tradeoffs",
        title: "first experiments and tradeoffs",
        summary: "the first experiments should decide whether antigen biology, payload choice, or format is the real bottleneck.",
        cards: buildExperimentalTradeoffCards(normalizedCase, abstraction, top, constructGuidance),
      },
      {
        key: "prototype-plan",
        title: "what i would prototype first",
        summary: "a practical sequence for testing the antigen-window hypothesis before over-optimizing chemistry.",
        cards: buildPrototypePlanCards(normalizedCase, constructGuidance, top, prompt),
      },
    ];
    return modules;
  }

  if (isCnsNeurodegenerationCase(normalizedCase, abstraction)) {
    return buildCnsNeuroDepthModules(normalizedCase, abstraction, exploration, top);
  }

  if (isAutoimmuneExplorationCase(normalizedCase, abstraction)) {
    return buildAutoimmuneDepthModules(normalizedCase);
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
      key: "pkpd-pressures",
      title: "pk / pd pressures",
      summary: "how exposure, repeat dosing, tissue access, and real mechanism execution could make a good-looking construct fail in vivo.",
      cards: buildPkPdDepthCards(normalizedCase, abstraction, top),
    },
    {
      key: "trafficking-bottlenecks",
      title: "trafficking and endosomal escape",
      summary: "where uptake, compartment access, lysosomal processing, or endosomal escape could become the real hidden bottleneck.",
      cards: buildTraffickingDepthCards(normalizedCase, abstraction, top),
    },
    {
      key: "experimental-tradeoffs",
      title: "experimental tradeoffs",
      summary: "how to structure the first experiments so we learn which assumption is breaking instead of changing five things at once.",
      cards: buildExperimentalTradeoffCards(normalizedCase, abstraction, top, constructGuidance),
    },
    {
      key: "creative-paths",
      title: "creative solution paths",
      summary: "higher-upside alternatives that stay anchored to the same biology instead of becoming random modality changes.",
      cards: buildCreativeDepthCards(innovativeIdeas),
    },
  ];

  modules.push({
    key: "prototype-plan",
    title: "what i would prototype first",
    summary: "a deeper build sequence for turning the current read into an actual experimental plan without pretending every parameter is already solved.",
    cards: buildPrototypePlanCards(normalizedCase, constructGuidance, top, prompt),
  });

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
  normalizedCase?: NormalizedCase,
): EvidenceSource[] {
  const broadOncologyContextOnly = Boolean(normalizedCase?.broadOncologyNoTarget && !precedentPlaybook);
  const cnsNeuroContextOnly = Boolean(normalizedCase && isCnsNeurodegenerationCase(normalizedCase) && !precedentPlaybook);
  const diseaseRoot = normalize(normalizedCase?.disease?.canonical ?? normalizedCase?.disease?.raw ?? "").split(/\s+/)[0] ?? "";
  const retrievalFallbackSources = retrievalSourceBuckets
    .flatMap((bucket) =>
      bucket.items.slice(0, 2).map((item) => ({
        label: item.label,
        href: item.href,
        why: broadOncologyContextOnly
          ? `${item.snippet || `retrieved from ${bucket.label}.`} this is supporting disease or target-context evidence, not direct proof that a conjugate class should win.`
          : cnsNeuroContextOnly && diseaseRoot && !normalize(item.label).includes(diseaseRoot)
            ? `${item.snippet || `retrieved from ${bucket.label}.`} this is cross-neurodegeneration context, not direct proof that it should win for ${normalizedCase?.disease?.canonical ?? normalizedCase?.disease?.raw ?? "this disease"}.`
          : item.snippet || `retrieved from ${bucket.label}.`,
        type: broadOncologyContextOnly || cnsNeuroContextOnly ? "supporting context" : item.sourceType,
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

  const normalizedTargetLabelCandidate = normalizedCase.target?.canonical ?? state.target?.trim() ?? "";
  const normalizedTargetLabel = looksLikePlaceholderTargetLabel(normalizedTargetLabelCandidate)
    ? ""
    : normalizedTargetLabelCandidate;
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

    const contextualRefinement = detectContextualRefinement(prompt, previousResult);
    const followUpIntent = detectFollowUpIntent(prompt, previousResult);
    if (followUpIntent && previousResult) {
      return NextResponse.json({
        ...buildFollowUpResponse(prompt, previousResult),
        responseFlow,
      });
    }

    const effectivePrompt = contextualRefinement?.mergedPrompt ?? prompt;

    const parsedQuery = parseConjugateQuery(effectivePrompt, state);
    if (parsedQuery.questionType === "modality explainer") {
      const explainerModality = detectExplainerModality(parsedQuery, effectivePrompt);
      if (explainerModality) {
        return NextResponse.json(buildModalityExplainerResponse(explainerModality, responseFlow));
      }
      return NextResponse.json(buildGeneralConjugateExplainerResponse(responseFlow));
    }
    if (isGenericLinkerExplainerPrompt(effectivePrompt, parsedQuery)) {
      return NextResponse.json(buildGeneralLinkerExplainerResponse(responseFlow));
    }
    if (isGenericChemistryExplainerPrompt(effectivePrompt, parsedQuery)) {
      return NextResponse.json(buildGeneralChemistryExplainerResponse(responseFlow));
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
    const explicitBuildRequest =
      parsedQuery.questionType === "targeting format" ||
      parsedQuery.questionType === "linker strategy" ||
      parsedQuery.questionType === "payload strategy" ||
      parsedQuery.questionType === "chemistry strategy" ||
      parsedQuery.questionType === "build blueprint";
    const finalRanking = confidence.abstain && !explicitBuildRequest ? [] : ranking;
    const finalTop = confidence.abstain && !explicitBuildRequest ? undefined : finalRanking[0];
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
    const biologySources = buildBiologySources(state, biologyLiterature, biologyReviews, clinicalTrials, groundedCase);
    const hasReferenceTarget = Boolean(getReferenceTargetLabel(state, groundedCase));
    const targetRepositorySources = biologySources.filter((source) => (source.type ?? "") === "target biology").slice(0, 3);
    const sources = confidence.abstain
      ? biologySources
          .filter((source) =>
            ((source.type ?? "") !== "target biology" || hasReferenceTarget) &&
            (source.type ?? "") !== "clinical context",
          )
          .slice(0, 4)
      : dedupeSources([...provisionalSources, ...targetRepositorySources]).slice(0, 6);
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
        ? "not enough mechanism, target, or trafficking biology is defined yet to choose a responsible recommendation. this should stay disease-level and provisional until the subtype, target, or active mechanism is clearer."
        : `${conflictSummary ? `${conflictSummary} ` : ""}${diseaseOnlyLeadSummary}${conflictClarifier ? ` ${conflictClarifier}` : ""} there still is not enough target, trafficking, or construct-level specificity to name a responsible final recommendation yet.`
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
      groundedCase,
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
      ? buildContextualRefinementFollowUpAnswer(
          contextualRefinement.contextLabel,
          contextualRefinement.requestedFocus,
          presentation,
          constructGuidance,
          topCardWhy,
        )
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
      groundedCase,
      biologicalAbstraction,
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
