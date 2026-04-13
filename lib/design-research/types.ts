export type PlannerState = {
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

export const MODALITY_ORDER = [
  "adc",
  "pdc",
  "smdc",
  "oligo conjugate",
  "rdc",
  "enzyme conjugate",
] as const;

export type ModalityName = (typeof MODALITY_ORDER)[number];

export type QuestionType =
  | "best conjugate class"
  | "compare modalities"
  | "why not"
  | "linker strategy"
  | "payload strategy"
  | "targeting format"
  | "build blueprint"
  | "general conjugate guidance";

export type RecommendationScope = "disease-level" | "target-conditioned";

export type MechanismClass =
  | "gene modulation"
  | "pathway modulation"
  | "cytotoxic delivery"
  | "radiobiology"
  | "enzyme/prodrug"
  | "immune modulation"
  | "unknown";

export type DiseaseArea =
  | "oncology"
  | "neuromuscular"
  | "autoimmune"
  | "metabolic"
  | "other"
  | "unknown";

export type DiseaseSpecificity = "unknown" | "family" | "specific";

export type ParsedQuery = {
  rawPrompt: string;
  cleanedPrompt: string;
  questionType: QuestionType;
  diseaseMention?: string;
  targetMention?: string;
  mentionedModalities: string[];
  mentionedPayloadTerms: string[];
  mentionedLinkerTerms: string[];
  mechanismHints: string[];
};

export type NormalizedEntity = {
  raw?: string;
  canonical?: string;
  aliases: string[];
  confidence: "high" | "medium" | "low";
};

export type NormalizedCase = {
  prompt: string;
  parsed: ParsedQuery;
  disease?: NormalizedEntity;
  target?: NormalizedEntity;
  modalityIntent?: NormalizedEntity;
  payloadIntent?: NormalizedEntity;
  linkerIntent?: NormalizedEntity;
  mechanismClass: MechanismClass;
  diseaseArea: DiseaseArea;
  diseaseSpecificity: DiseaseSpecificity;
  recommendationScope: RecommendationScope;
  chronicContext: boolean;
  needsInternalization: boolean;
  needsIntracellularAccess: boolean;
  needsNuclearAccess: boolean;
  explicitPeptideSupport: boolean;
  explicitLigandSupport: boolean;
  broadOncologyNoTarget: boolean;
  hasSelectiveSurfaceTarget: boolean;
  targetInternalizationKnown: "fast" | "slow" | "unknown";
  targetDensityKnown: "high" | "mixed" | "low" | "unknown";
  unknowns: string[];
};

export type EvidenceType =
  | "paper"
  | "review"
  | "clinical candidate"
  | "approved product"
  | "official anchor"
  | "modality analog"
  | "target biology"
  | "biology paper"
  | "biology review"
  | "clinical context"
  | "company/platform precedent";

export type EvidenceSource = {
  label: string;
  href?: string;
  why?: string;
  type?: EvidenceType | string;
};

export type GateStatus = "allowed" | "penalized" | "gated out";

export type GateDecision = {
  modality: ModalityName;
  status: GateStatus;
  reasons: string[];
  penalty: number;
};

export type ScoreCategory =
  | "biology fit"
  | "payload mechanism compatibility"
  | "linker/release feasibility"
  | "target internalization/trafficking"
  | "intracellular compartment access"
  | "target density/turnover"
  | "conjugation/DAR/platform feasibility"
  | "PK/BD constraints"
  | "translational/species tractability"
  | "CMC/manufacturability complexity"
  | "precedent/evidence strength"
  | "safety/therapeutic-window fit";

export type ScoreComponent = {
  category: ScoreCategory;
  raw: number;
  weight: number;
  weighted: number;
  rationale: string;
};

export type ModalityScore = {
  modality: ModalityName;
  total: number;
  gate: GateDecision;
  components: ScoreComponent[];
  explainableTotal: {
    positive: number;
    negative: number;
    gatePenalty: number;
  };
};

export type WhyNotResult = {
  modality: ModalityName;
  outcome: "runner-up" | "viable but weaker" | "not viable";
  primaryReason: string;
  secondaryReason?: string;
};

export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient";

export type ConfidenceFactor = {
  label: string;
  impact: "positive" | "negative" | "neutral";
  note: string;
};

export type ConfidenceAssessment = {
  level: ConfidenceLevel;
  factors: ConfidenceFactor[];
  abstain: boolean;
  blueprintAllowed: boolean;
};

export type DiseaseGrounding = {
  mechanismClass: MechanismClass;
  summary: string;
  rationale: string;
  plausibleDirections: string[];
  themes: string[];
  confidence: "low" | "medium" | "high";
  supportingSignals: string[];
};

export type RetrievedSourceBucketKey =
  | "disease biology"
  | "biology literature"
  | "biology reviews"
  | "clinical context"
  | "modality literature"
  | "fallback profile";

export type RetrievedSourceItem = {
  label: string;
  href?: string;
  snippet?: string;
  sourceType: EvidenceType | "trace";
};

export type RetrievedSourceBucket = {
  key: RetrievedSourceBucketKey;
  label: string;
  items: RetrievedSourceItem[];
};

export type EvidenceObjectType =
  | "disease mechanism"
  | "delivery constraint"
  | "target context"
  | "clinical precedent"
  | "modality precedent"
  | "mechanism support"
  | "mechanism contradiction";

export type EvidenceDirection = "supports" | "penalizes" | "neutral";

export type EvidenceStrength = "low" | "medium" | "high";

export type EvidenceOrigin = "corpus" | "synthetic aggregate" | "fallback";

export type EvidenceObject = {
  id: string;
  type: EvidenceObjectType;
  label: string;
  claim: string;
  rationale: string;
  direction: EvidenceDirection;
  strength: EvidenceStrength;
  mechanismHints: MechanismClass[];
  themes: string[];
  sourceBucket: RetrievedSourceBucketKey;
  sourceLabels: string[];
  origin: EvidenceOrigin;
  modalityHints?: ModalityName[];
};

export type MechanismInference = {
  mechanismClass: MechanismClass;
  confidence: "low" | "medium" | "high";
  summary: string;
  rationale: string;
  plausibleDirections: string[];
  themes: string[];
  supportingEvidenceIds: string[];
  source: "evidence" | "fallback-profile" | "none";
};

export type PlannerTrace = {
  parser: ParsedQuery;
  normalization: {
    disease?: NormalizedEntity;
    target?: NormalizedEntity;
    modalityIntent?: NormalizedEntity;
    payloadIntent?: NormalizedEntity;
    linkerIntent?: NormalizedEntity;
    mechanismClass: MechanismClass;
    diseaseArea: DiseaseArea;
    diseaseSpecificity: DiseaseSpecificity;
    recommendationScope: RecommendationScope;
    unknowns: string[];
  };
  retrieval?: {
    sourceBuckets: RetrievedSourceBucket[];
    evidenceObjects: EvidenceObject[];
    themeCounts?: Array<{
      theme: string;
      corpus: number;
      syntheticAggregate: number;
      fallback: number;
      total: number;
    }>;
    diseaseBiologyDebug?: Array<{
      concept: string;
      variant?: string;
      query: string;
      hitCount: number;
      requestStatus: "ok" | "empty" | "error";
      hits: Array<{
        label: string;
        snippet?: string;
      }>;
    }>;
    themeDiagnostics?: Array<{
      theme: string;
      corpusMatches: number;
      syntheticAggregateObjects: number;
      fallbackObjects: number;
      matched: boolean;
      sourceLabels: string[];
    }>;
  };
  grounding?: {
    namedDiseaseRecognized: boolean;
    groundingObjectPresent?: boolean;
    groundingThemes: string[];
    inferredMechanismFamily?: MechanismClass;
    groundingSource?: MechanismInference["source"];
    influencedMechanism: boolean;
    influencedGates: boolean;
    influencedScoring: boolean;
    influencedConfidence: boolean;
    genericAbstentionTemplateUsed?: boolean;
    diseaseSpecificAbstentionTemplateUsed?: boolean;
    fallbackReason?: string;
  };
  gates: GateDecision[];
  scores: ModalityScore[];
  whyNot: WhyNotResult[];
  confidence: ConfidenceAssessment;
  unknownBiology: {
    insufficient: boolean;
    reasons: string[];
  };
};

export type LiteratureSignal = {
  modality: ModalityName;
  literatureStrength: number;
  hitCount: number;
};
