"use client";

import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Spinner,
} from "@heroui/react";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const modalities = ["ADC", "PDC", "SMDC", "Oligo", "Enzyme", "RDC"];
const goals = [
  "max tumor cell killing",
  "gene modulation",
  "radiotherapy / theranostics",
  "better tissue penetration",
  "safer exposure window",
  "not sure yet",
];
const targetClasses = [
  "cell-surface receptor",
  "tumor antigen",
  "transporter / metabolic handle",
  "stromal target",
  "unknown",
];
const releaseGoals = [
  "release free payload",
  "release linker-payload fragment",
  "stay intact until degradation",
  "carry a radiometal / chelator system",
  "not sure yet",
];
type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: { label: string; href?: string; why?: string; type?: string }[];
  options?: string[];
  isStreaming?: boolean;
  researchResult?: ResearchResponse;
};

type PlannerDepthMode = "normal" | "deep" | "max-depth";

type ResearchResponse = {
  topPick: string;
  topPickWhy: string;
  biggestRisk: string;
  firstMove: string;
  nextSteps: string[];
  ranking: RankedOption[];
  matrix: {
    modality: string;
    total: number;
    summary: string;
    cells: {
      category: string;
      score: number;
      reason: string;
    }[];
  }[];
  sources: { label: string; href?: string; why?: string; type?: string }[];
  text: string;
  summary: string;
  topic: string;
  responseFlow?: {
    requestedMode: PlannerDepthMode;
    effectiveMode: PlannerDepthMode;
    complexity: "simple" | "moderate" | "complex";
    stages: string[];
  };
  depthModules?: {
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
    cards: {
      title: string;
      badge?: string;
      body: string;
      bullets?: string[];
    }[];
  }[];
  presentation?: {
    mode: "recommended-starting-point" | "best-current-strategy-direction" | "concept-explainer";
    title: string;
    bestConjugateClass?: string;
    decisionFocus?: "class" | "format" | "linker" | "payload" | "chemistry";
    targetOrEntryHandle?: string;
    recommendedFormat?: string;
    recommendedLinker?: string;
    recommendedPayload?: string;
    recommendedChemistry?: string;
    confidence: string;
    explorationConfidence?: string;
    status?: string;
    strategyLanes?: string[];
    dominantConstraints?: string[];
    bestClarifier?: string;
    rationale: string;
    mainMissingEvidence?: string;
    biggestWatchout?: string;
    firstValidationStep?: string;
    whatItIs?: string;
    bestFit?: string;
    mainWatchout?: string;
  };
  presentationVariant?: "document-brief" | "blueprint-first" | "table-first" | "visual-follow-up";
  documentSections?: {
    title: string;
    body: string;
    bullets?: string[];
  }[];
  constructBlueprint?: {
    conditional: boolean;
    explicitlyRequested: boolean;
    format?: { title: string; body: string };
    linker?: { title: string; body: string };
    payload?: { title: string; body: string };
    constraints: string[];
    precedentNote?: string;
    tradeoff?: string;
  };
  evidenceAnchors?: { label: string; href?: string; why?: string; type?: string }[];
  uncertainties?: string[];
  sectionOrder?: string[];
  validationPasses?: {
    name: string;
    passed: boolean;
    note: string;
  }[];
  innovativeIdeas?: {
    ideaName: string;
    whyInteresting: string;
    assumptionMustBeTrue: string;
    firstExperiment: string;
    whyItCouldFail: string;
    riskLevel: "practical" | "speculative" | "high-risk";
    sourceLabels: string[];
  }[];
  modalityViability?: {
    modality: string;
    status: "lead" | "provisional" | "conditional" | "not viable" | "abstain";
    reason: string;
    missingEvidence: string;
    upgradeEvidence: string;
  }[];
  strategyTable?: {
    rank: string;
    strategy: string;
    bestFormat: string;
    linkerOrDeliveryLogic: string;
    payloadOrActiveSpecies: string;
    whyItFits: string;
    riskOrFailureMode: string;
    evidenceLabel?: string;
  }[];
  rankingPreview?: {
    rank: string;
    strategy: string;
    score?: string;
    summary: string;
    whyItFits: string;
    risk?: string;
  }[];
  uiContract?: {
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
  viabilityBuckets?: {
    feasibleNames: string[];
    notViableNames: string[];
    leadStrength: "strong" | "provisional" | "none";
    noStrongClassYet: boolean;
    contradictionFree: boolean;
  };
  conversationBaseResult?: ResearchResponse | null;
  followUpAnswer?: {
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
  suggestedFollowUps?: string[];
  biology?: {
    title: string;
    body: string;
    sources?: { label: string; href?: string; why?: string; type?: string }[];
  }[];
  biologyValidationPasses?: {
    name: string;
    passed: boolean;
    note: string;
  }[];
  confidence?: {
    level: "high" | "medium" | "low" | "insufficient";
    explorationLevel: "high" | "medium" | "low" | "insufficient";
    winnerLevel: "high" | "medium" | "low" | "insufficient";
    abstain: boolean;
    blueprintAllowed: boolean;
    factors: {
      label: string;
      impact: "positive" | "negative" | "neutral";
      note: string;
    }[];
  };
  unknownBiology?: {
    reasons: string[];
  };
  exploration?: {
    diseaseFrame: string;
    interpretationMode?: "tentative" | "grounded";
    understandingSignals?: string[];
    strategyBuckets: {
      label: string;
      whyPlausible: string;
      entryHandleLogic: string;
      requiredAssumptions: string[];
      mainFailureMode: string;
      diseaseSpecificConstraints: string[];
      supportingEvidenceIds: string[];
      suggestedModalities: string[];
      sourceLabels?: string[];
    }[];
    dominantConstraints: string[];
    mostInformativeClarifier: string;
    source: "evidence-driven" | "normalized-context" | "fallback";
  };
  trace?: {
    parser: {
      rawPrompt: string;
      cleanedPrompt: string;
      questionType: string;
      diseaseMention?: string;
      targetMention?: string;
      mentionedModalities: string[];
      mentionedPayloadTerms: string[];
      mentionedLinkerTerms: string[];
      mechanismHints: string[];
    };
    normalization: {
      mechanismClass: string;
      diseaseArea: string;
      diseaseSpecificity?: string;
      recommendationScope: string;
      unknowns: string[];
      disease?: { canonical?: string; raw?: string; confidence: string };
      target?: { canonical?: string; raw?: string; confidence: string };
      modalityIntent?: { canonical?: string; raw?: string; confidence: string };
      payloadIntent?: { canonical?: string; raw?: string; confidence: string };
      linkerIntent?: { canonical?: string; raw?: string; confidence: string };
    };
    grounding?: {
      namedDiseaseRecognized: boolean;
      groundingObjectPresent?: boolean;
      groundingThemes: string[];
      inferredMechanismFamily?: string;
      groundingSource?: "evidence" | "fallback-profile" | "none";
      influencedMechanism: boolean;
      influencedGates: boolean;
      influencedScoring: boolean;
      influencedConfidence: boolean;
      genericAbstentionTemplateUsed?: boolean;
      diseaseSpecificAbstentionTemplateUsed?: boolean;
      fallbackReason?: string;
    };
    abstraction?: {
      pathologyType: string;
      therapeuticIntent: string;
      targetClass: string;
      deliveryAccessibility: string;
      deliveryBarriers: string[];
      mechanismLocation: string;
      treatmentContext: string;
      cytotoxicFit: string;
      internalizationRequirement: string;
      compartmentNeed: string;
      translationalConstraints: string[];
      abstractionRationale: string[];
      source: "evidence-driven" | "normalized-context" | "fallback";
    };
    exploration?: {
      diseaseFrame: string;
      strategyBuckets: {
        label: string;
        whyPlausible: string;
        entryHandleLogic: string;
        requiredAssumptions: string[];
        mainFailureMode: string;
        diseaseSpecificConstraints: string[];
        supportingEvidenceIds: string[];
        suggestedModalities: string[];
        sourceLabels?: string[];
      }[];
      dominantConstraints: string[];
      mostInformativeClarifier: string;
      source: "evidence-driven" | "normalized-context" | "fallback";
    };
    retrieval?: {
      sourceBuckets: {
        key: string;
        label: string;
        items: {
          label: string;
          href?: string;
          snippet?: string;
          sourceType: string;
        }[];
      }[];
      evidenceObjects: {
        id: string;
        type: string;
        label: string;
        claim: string;
        rationale: string;
        direction: "supports" | "penalizes" | "neutral";
        strength: "low" | "medium" | "high";
        mechanismHints: string[];
        themes: string[];
        sourceBucket: string;
        sourceLabels: string[];
        origin: "corpus" | "synthetic aggregate" | "fallback";
        modalityHints?: string[];
      }[];
      themeCounts?: {
        theme: string;
        corpus: number;
        syntheticAggregate: number;
        fallback: number;
        total: number;
      }[];
      diseaseBiologyDebug?: {
        concept: string;
        variant?: string;
        query: string;
        hitCount: number;
        requestStatus: "ok" | "empty" | "error";
        searches?: {
          source: "europepmc" | "pubmed";
          endpoint: string;
          requestUrl: string;
          httpStatus?: number;
          adapterStatus: "ok" | "empty" | "error";
          preFilterHitCount: number;
          postFilterHitCount: number;
        }[];
        hits: {
          label: string;
          snippet?: string;
        }[];
      }[];
      themeDiagnostics?: {
        theme: string;
        corpusMatches: number;
        syntheticAggregateObjects: number;
        fallbackObjects: number;
        matched: boolean;
        sourceLabels: string[];
      }[];
    };
    gates: {
      modality: string;
      status: string;
      reasons: string[];
      penalty: number;
    }[];
    whyNot: {
      modality: string;
      outcome: string;
      primaryReason: string;
      secondaryReason?: string;
    }[];
    precedentPlaybook?: {
      target: string;
      diseasePattern: string;
      modality: string;
      strength: "high" | "medium" | "low";
      dominantProduct: {
        label: string;
        href?: string;
        format: string;
        linker: string;
        payload: string;
        bystander?: string;
        safetyWatchout?: string;
      };
      comparatorProduct?: {
        label: string;
        href?: string;
        format: string;
        linker: string;
        payload: string;
      };
      rationale: string;
      sourceLabels: string[];
    };
  };
};

type StrategyCard = {
  title: string;
  body: string;
};

type TracePrecedentPlaybook = NonNullable<NonNullable<ResearchResponse["trace"]>["precedentPlaybook"]>;

type ComparableProgram = {
  name: string;
  reason: string;
};

type RankedOption = {
  name: string;
  rank: number;
  summary: string;
  fitReason?: string;
  limitReason?: string;
  bestEvidenceFor?: string;
  mainReasonAgainst?: string;
  whatMustBeTrue?: string;
  pros: string[];
  cons: string[];
};

type EvidenceCue = {
  label: string;
  why: string;
  type: string;
};

type DesignSuggestion = {
  label: string;
  title: string;
  body: string;
  accent: string;
};

type PlannerMessageSection = {
  title: string;
  body: string;
};

type RankingRow = {
  rank: string;
  name: string;
  score?: string;
  fit?: string;
  against?: string;
  evidence?: string;
  mustBeTrue?: string;
};

type NotViableRow = {
  name: string;
  reason?: string;
  score?: string;
};

type BriefReadItem = {
  label: string;
  value: string;
};

type BiologyPanelSection = {
  title: string;
  body: string;
  sources?: { label: string; href?: string; why?: string; type?: string }[];
};

type MatrixRow = ResearchResponse["matrix"][number];

type RankedBucket = {
  feasible: RankedOption[];
  notViable: Array<{
    option: RankedOption;
    reason: string;
    score?: number;
  }>;
};

const EMPTY_DESIGN_SUGGESTIONS: DesignSuggestion[] = [
  {
    label: "targeting",
    title: "waiting for a real brief",
    body: "ask for a recommendation and this turns into the targeting format we’d actually start with.",
    accent: "border-sky-200 bg-sky-50/70",
  },
  {
    label: "linker",
    title: "waiting for a real brief",
    body: "once there’s an output request, this becomes the linker logic we’d prioritize first.",
    accent: "border-violet-200 bg-violet-50/70",
  },
  {
    label: "payload",
    title: "waiting for a real brief",
    body: "after the first real recommendation, this becomes the payload family we’d screen first.",
    accent: "border-rose-200 bg-rose-50/70",
  },
];

const SECTION_STYLES: Record<
  string,
  {
    wrapper: string;
    label: string;
  }
> = {
  "direct answer": {
    wrapper: "border-slate-200 bg-slate-50/80",
    label: "text-slate-700",
  },
  "best current fit": {
    wrapper: "border-emerald-200 bg-emerald-50/80",
    label: "text-emerald-700",
  },
  "why this is leading": {
    wrapper: "border-sky-200 bg-sky-50/80",
    label: "text-sky-700",
  },
  "full ranking": {
    wrapper: "border-violet-200 bg-violet-50/80",
    label: "text-violet-700",
  },
  "feasible and worth ranking": {
    wrapper: "border-emerald-200 bg-emerald-50/80",
    label: "text-emerald-700",
  },
  "not really viable here": {
    wrapper: "border-amber-200 bg-amber-50/80",
    label: "text-amber-700",
  },
  "main watchout": {
    wrapper: "border-amber-200 bg-amber-50/80",
    label: "text-amber-700",
  },
  "first move": {
    wrapper: "border-blue-200 bg-blue-50/80",
    label: "text-blue-700",
  },
};

function parsePlannerSections(text: string): PlannerMessageSection[] {
  return text
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [firstLine, ...rest] = chunk.split("\n");
      const normalizedTitle = firstLine.trim().toLowerCase();
      if (!rest.length && !SECTION_STYLES[normalizedTitle]) {
        return {
          title: "",
          body: chunk,
        };
      }
      return {
        title: firstLine.trim(),
        body: rest.join("\n").trim(),
      };
    });
}

function parseRankingRows(body: string): RankingRow[] {
  const entries = body
    .split(/\n(?=(?:#?\d+[.)]?\s))/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return entries.map((entry) => {
    const lines = entry.split("\n").map((line) => line.trim()).filter(Boolean);
    const first = lines[0] ?? "";
    const firstMatch = first.match(/^#?(\d+)[.)]?\s+(.+)$/i);
    const details = lines.slice(1);
    const getField = (label: string) =>
      details.find((line) => line.toLowerCase().startsWith(label))?.split(":").slice(1).join(":").trim();

    return {
      rank: firstMatch?.[1] ?? "",
      name: firstMatch?.[2] ?? first,
      score: getField("score"),
      fit: getField("why it fits"),
      against: getField("main reason against") ?? getField("why it may not fit"),
      evidence: getField("best evidence for"),
      mustBeTrue: getField("what would have to be true for this to win"),
    };
  });
}

function parseNotViableRows(body: string): NotViableRow[] {
  const entries = body
    .split(/\n\s*\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return entries.map((entry) => {
    const lines = entry.split("\n").map((line) => line.trim()).filter(Boolean);
    const [name = "", ...rest] = lines;
    const scoreLine = rest.find((line) => line.toLowerCase().startsWith("score:"));
    const reasonLine =
      rest.find((line) => line.toLowerCase().startsWith("why it drops out:")) ??
      rest.find((line) => line.toLowerCase().startsWith("reason:"));

    return {
      name,
      score: scoreLine?.split(":").slice(1).join(":").trim(),
      reason: reasonLine?.split(":").slice(1).join(":").trim(),
    };
  });
}

function buildBriefRead(state: PlannerState): BriefReadItem[] {
  const safeTarget =
    state.target && !/^(possible|best|what|why|rank|show|give)\b/i.test(state.target.trim())
      ? state.target
      : "";
  const ordered: Array<[string, string]> = [
    ["target and indication", safeTarget],
    ["conjugate class hint", state.modality],
    ["main goal", state.goal],
    ["target class", state.targetClass],
    ["target expression", state.targetExpression],
    ["internalization", state.internalization],
    ["payload class", state.payloadClass],
    ["linker type", state.linkerType],
    ["release goal", state.releaseGoal],
    ["bystander effect", state.bystander],
    ["must-have", state.mustHave],
    ["avoid", state.avoid],
    ["constraints", state.constraints],
  ];

  return ordered
    .filter(([, value]) => value.trim().length > 0)
    .map(([label, value]) => ({ label, value }));
}

function confidenceAccent(level?: string) {
  switch ((level ?? "").toLowerCase()) {
    case "high":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "medium":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "low":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function ideaRiskAccent(level?: string) {
  switch ((level ?? "").toLowerCase()) {
    case "practical":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "speculative":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
  }
}

function viabilityAccent(status?: string) {
  switch ((status ?? "").toLowerCase()) {
    case "lead":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "provisional":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "conditional":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "not viable":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

const plannerSurface =
  "border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.98))] text-slate-900 shadow-[0_22px_60px_rgba(15,23,42,0.08)]";
const plannerPanel = "rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]";
const plannerPanelSoft = "rounded-2xl border border-slate-200 bg-slate-50/85";
const plannerInset = "rounded-2xl border border-slate-200 bg-white";
const plannerLabel = "text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600";
const plannerTitle =
  "mt-1 font-[family-name:var(--font-instrument-serif)] text-[1.45rem] font-semibold italic underline decoration-slate-400 underline-offset-4 text-slate-950";
const plannerKicker =
  "font-[family-name:var(--font-instrument-serif)] text-[1.02rem] font-semibold italic underline decoration-slate-400 underline-offset-4 text-slate-900";
const plannerBody = "font-[family-name:var(--font-instrument-serif)] text-[15px] leading-7 text-slate-800";
const plannerMuted = "font-[family-name:var(--font-instrument-serif)] text-[14px] leading-7 text-slate-600";
const plannerBodyStrong = "font-[family-name:var(--font-instrument-serif)] text-[15px] leading-7 text-slate-900";
const plannerTableShell = "overflow-x-auto rounded-2xl border border-slate-200 bg-white";
const plannerTableHead = "bg-slate-50 text-slate-600";
const plannerTableBody = "divide-y divide-slate-200 bg-white text-slate-700";

function buildFallbackBiologySections(state: PlannerState, topOption?: RankedOption): BiologyPanelSection[] {
  const safeTarget =
    state.target && !/^(possible|best|what|why|rank|show|give)\b/i.test(state.target.trim())
      ? state.target
      : "";
  const targetText = safeTarget
    ? `${safeTarget} is the current biological entry point. we still need to know whether it is disease-relevant, accessible, and selective enough to carry the strategy.`
    : "the target biology is still thin, so the chemistry ranking should be treated as provisional.";

  const diseaseText =
    state.goal === "gene modulation"
      ? "this reads like mechanism-first biology, where the real job is changing rna behavior rather than delivering a classical cytotoxic payload."
      : state.goal === "radiotherapy / theranostics"
        ? "this reads like localization biology plus emitter logic, where retention and organ exposure matter more than free-payload release."
        : state.goal === "max tumor cell killing"
          ? "this reads more like classical payload-delivery biology, where target separation and intracellular routing dominate."
          : "the disease mechanism is still broad, so the safest move is to keep the biology read slightly conditional.";

  const topRead = topOption
    ? `${topOption.fitReason ?? topOption.summary}`
    : "the modality read is still weak because the biology cues are not yet strong enough.";

  return [
    { title: "disease mechanism", body: diseaseText },
    { title: "target biology", body: targetText },
    { title: "delivery + active species biology", body: topRead },
    {
      title: "biggest biology unknown",
      body: state.internalization || state.targetExpression
        ? "the remaining biology unknown is whether the target and tissue context are strong enough to support the proposed delivery route in vivo."
        : "the biggest missing biology piece is still expression pattern plus what compartment the construct actually has to reach.",
    },
  ];
}

function dedupeRankedOptions(options: RankedOption[]) {
  const seen = new Set<string>();
  return options
    .slice()
    .sort((a, b) => a.rank - b.rank)
    .filter((item) => {
      const key = item.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

function getMatrixReason(row?: MatrixRow) {
  if (!row) return "";
  const orderedCategories = ["biology fit", "release fit", "delivery fit", "safety fit", "precedent fit"];
  for (const category of orderedCategories) {
    const cell = row.cells.find((item) => item.category.toLowerCase() === category);
    if (cell && cell.score <= -2) return cell.reason;
  }
  const lowest = row.cells.slice().sort((a, b) => a.score - b.score)[0];
  return lowest?.reason ?? "";
}

function bucketRankedOptions(options: RankedOption[], matrix?: MatrixRow[]): RankedBucket {
  const matrixMap = new Map(
    (matrix ?? []).map((row) => [row.modality.toLowerCase().trim(), row]),
  );

  const feasible: RankedOption[] = [];
  const notViable: RankedBucket["notViable"] = [];

  for (const option of options) {
    const row = matrixMap.get(option.name.toLowerCase().trim());
    const biologyScore = row?.cells.find((cell) => cell.category.toLowerCase() === "biology fit")?.score ?? 0;
    const releaseScore = row?.cells.find((cell) => cell.category.toLowerCase() === "release fit")?.score ?? 0;
    const totalScore = row?.total ?? 0;
    const failsCriticalFit = biologyScore <= -2 || releaseScore <= -2;
    const weakOverall = totalScore < 1;

    if (failsCriticalFit || weakOverall) {
      notViable.push({
        option,
        reason: option.mainReasonAgainst ?? option.limitReason ?? getMatrixReason(row) ?? "the current biology and delivery cues do not support this class well enough.",
        score: row?.total,
      });
      continue;
    }

    feasible.push(option);
  }

  if (!feasible.length && options.length) {
    const fallback = options[0];
    feasible.push(fallback);
    return {
      feasible,
      notViable: options.slice(1).map((option) => ({
        option,
        reason:
          option.mainReasonAgainst ??
          option.limitReason ??
          "this one is not convincing enough for the current biology and delivery brief.",
        score: matrixMap.get(option.name.toLowerCase().trim())?.total,
      })),
    };
  }

  return { feasible, notViable };
}

function modalityScoreOutOfTen(name: string, matrix?: MatrixRow[]) {
  const total = matrix?.find((row) => row.modality.toLowerCase().trim() === name.toLowerCase().trim())?.total;
  if (typeof total !== "number") return null;
  return Math.max(0, Math.min(10, Math.round(((total + 15) / 30) * 10)));
}

function compactBiologyRead(result: ResearchResponse) {
  const abstraction = result.trace?.abstraction;
  const parts = [
    abstraction?.pathologyType,
    abstraction?.therapeuticIntent,
    abstraction?.deliveryAccessibility,
    abstraction?.compartmentNeed && abstraction.compartmentNeed !== "unknown"
      ? `${abstraction.compartmentNeed} compartment`
      : "",
  ]
    .filter((item) => item && item !== "unknown")
    .slice(0, 4);

  return parts.length ? parts.join(" / ") : "disease-level biology still being resolved";
}

function buildRendererStrategyTable(result: ResearchResponse) {
  if (result.strategyTable?.length) return result.strategyTable;

  return (result.exploration?.strategyBuckets ?? []).slice(0, 4).map((bucket, index) => ({
    rank: String(index + 1),
    strategy: bucket.label,
    bestFormat: (bucket.suggestedModalities ?? []).join(", ") || "still conditional",
    linkerOrDeliveryLogic: bucket.entryHandleLogic,
    payloadOrActiveSpecies: "conditional active species",
    whyItFits: bucket.whyPlausible,
    riskOrFailureMode: bucket.mainFailureMode,
    evidenceLabel: bucket.sourceLabels?.[0],
  }));
}

function buildRendererRankingPreview(result: ResearchResponse) {
  if (result.rankingPreview?.length) return result.rankingPreview;

  const ranked = dedupeRankedOptions(result.ranking ?? []);
  if (ranked.length) {
    return ranked.slice(0, 5).map((item) => ({
      rank: String(item.rank),
      strategy: item.name,
      score:
        modalityScoreOutOfTen(item.name, result.matrix) !== null
          ? `${modalityScoreOutOfTen(item.name, result.matrix)}/10`
          : undefined,
      summary: item.summary,
      whyItFits: item.fitReason ?? item.summary,
      risk: item.mainReasonAgainst ?? item.limitReason,
    }));
  }

  return [];
}

function scoreToPercent(score?: string) {
  if (!score) return 0;
  const match = String(score).match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (match) {
    return Math.max(0, Math.min(100, Number(match[1]) * 10));
  }
  const raw = Number.parseFloat(String(score));
  if (Number.isFinite(raw)) {
    return Math.max(0, Math.min(100, raw * 10));
  }
  return 0;
}

function rankAccent(rank: string) {
  switch (rank) {
    case "1":
      return {
        bar: "from-sky-500 to-cyan-400",
        chip: "border border-sky-200 bg-sky-50 text-sky-700",
      };
    case "2":
      return {
        bar: "from-emerald-500 to-teal-400",
        chip: "border border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    case "3":
      return {
        bar: "from-violet-500 to-fuchsia-400",
        chip: "border border-violet-200 bg-violet-50 text-violet-700",
      };
    default:
      return {
        bar: "from-slate-500 to-slate-400",
        chip: "border border-slate-200 bg-slate-50 text-slate-700",
      };
  }
}

function renderEvidenceTypeBars(
  evidenceRows: { label: string; href?: string; why?: string; type?: string }[],
) {
  const grouped = new Map<string, number>();
  for (const item of evidenceRows) {
    const key = item.type?.trim() || "reference";
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  }

  const rows = [...grouped.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  if (!rows.length) return null;

  const maxCount = Math.max(...rows.map((item) => item.count), 1);

  return (
    <div className="grid gap-2">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1">
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
            <span className="truncate">{row.label}</span>
            <span>{row.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400"
              style={{ width: `${Math.max(16, (row.count / maxCount) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function compactCellText(value?: string, fallback = "still conditional") {
  const cleaned = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return fallback;
  if (cleaned.length <= 110) return cleaned;
  const sliced = cleaned.slice(0, 108);
  const boundary = sliced.lastIndexOf(" ");
  const safe = (boundary > 72 ? sliced.slice(0, boundary) : cleaned.slice(0, 107)).trim();
  return `${safe}...`;
}

function completeUiSentence(value?: string, fallback = "") {
  const cleaned = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return fallback;
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function repeatedParagraphRisk(text: string) {
  const sentences = text
    .split(/\n+/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length > 80);
  const seen = new Set<string>();
  let duplicates = 0;
  for (const sentence of sentences) {
    if (seen.has(sentence)) duplicates += 1;
    seen.add(sentence);
  }
  return duplicates;
}

function bucketEvidenceSources(
  sources: { label: string; href?: string; why?: string; type?: string }[]
) {
  const groups = [
    {
      key: "clinical",
      title: "clinical candidates",
      matcher: (type?: string) => type === "clinical candidate",
    },
    {
      key: "pipeline",
      title: "pipeline / platform precedents",
      matcher: (type?: string) => type === "company/platform precedent",
    },
    {
      key: "official",
      title: "approved products",
      matcher: (type?: string) =>
        type === "approved product" || type === "official anchor",
    },
    {
      key: "analog",
      title: "disease-agnostic modality analogs",
      matcher: (type?: string) => type === "modality analog",
    },
    {
      key: "literature",
      title: "papers and reviews",
      matcher: (type?: string) => type === "paper" || type === "review",
    },
  ];

  return groups
    .map((group) => ({
      ...group,
      items: sources.filter((item) => group.matcher(item.type)),
    }))
    .filter((group) => group.items.length > 0);
}

function evidenceTrustLabel(type?: string) {
  const normalized = (type ?? "").toLowerCase();
  if (normalized === "approved product" || normalized === "official anchor" || normalized === "approved comparator" || normalized === "approved drug") {
    return "approved / validated";
  }
  if (normalized === "clinical candidate" || normalized === "conjugated example" || normalized === "targeted delivery example") {
    return "investigational precedent";
  }
  if (normalized === "company/platform precedent" || normalized === "platform anchor" || normalized === "modality analog") {
    return "mechanistic extrapolation";
  }
  return "literature / supporting context";
}

function evidenceTrustAccent(label: string) {
  switch (label) {
    case "approved / validated":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "investigational precedent":
      return "border border-sky-200 bg-sky-50 text-sky-700";
    case "mechanistic extrapolation":
      return "border border-violet-200 bg-violet-50 text-violet-700";
    default:
      return "border border-slate-200 bg-slate-50 text-slate-700";
  }
}

type PlannerState = {
  idea: string;
  mustHave: string;
  avoid: string;
  target: string;
  constraints: string;
  modality: string;
  goal: string;
  targetClass: string;
  targetExpression: string;
  internalization: string;
  payloadClass: string;
  linkerType: string;
  releaseGoal: string;
  bystander: string;
};

const STORAGE_KEY = "design-chat";
const FORM_KEY = "design-form";
const quickReplies = [
  "show best-fit strategy",
  "show biggest risks",
  "show a step-by-step plan",
];

const defaultAssistantMessage: ChatMessage = {
  role: "assistant",
  text:
    "set a few inputs, then ask in plain language. i’ll use the selections plus your prompt to suggest a better strategy, flag weak spots, and lay out a build plan.",
  options: quickReplies,
};

function createDefaultForm(): PlannerState {
  return {
    idea: "",
    mustHave: "",
    avoid: "",
    target: "",
    constraints: "",
    modality: "",
    goal: "",
    targetClass: "",
    targetExpression: "",
    internalization: "",
    payloadClass: "",
    linkerType: "",
    releaseGoal: "",
    bystander: "",
  };
}

function getStoredChatLog(): ChatMessage[] {
  if (typeof window === "undefined") return [defaultAssistantMessage];
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return [defaultAssistantMessage];

  try {
    return JSON.parse(saved);
  } catch {
    return [defaultAssistantMessage];
  }
}

function getStoredForm(): PlannerState {
  if (typeof window === "undefined") return createDefaultForm();
  const saved = window.localStorage.getItem(FORM_KEY);
  if (!saved) return createDefaultForm();

  try {
    const data = JSON.parse(saved);
    return {
      idea: data.idea ?? "",
      mustHave: data.mustHave ?? "",
      avoid: data.avoid ?? "",
      target: data.target ?? "",
      constraints: data.constraints ?? "",
      modality: data.modality ?? "",
      goal: data.goal ?? "",
      targetClass: data.targetClass ?? "",
      targetExpression: data.targetExpression ?? "",
      internalization: data.internalization ?? "",
      payloadClass: data.payloadClass ?? "",
      linkerType: data.linkerType ?? "",
      releaseGoal: data.releaseGoal ?? "",
      bystander: data.bystander ?? "",
    };
  } catch {
    return createDefaultForm();
  }
}

function buildContext(state: PlannerState) {
  const bits: string[] = [];
  if (state.modality) bits.push(`modality: ${state.modality}`);
  if (state.goal) bits.push(`goal: ${state.goal}`);
  if (state.target && !/^(possible|best|what|why|rank|show|give)\b/i.test(state.target.trim())) bits.push(`target: ${state.target}`);
  if (state.targetClass) bits.push(`target class: ${state.targetClass}`);
  if (state.targetExpression) bits.push(`expression: ${state.targetExpression}`);
  if (state.internalization) bits.push(`internalization: ${state.internalization}`);
  if (state.payloadClass) bits.push(`payload: ${state.payloadClass}`);
  if (state.linkerType) bits.push(`linker: ${state.linkerType}`);
  if (state.releaseGoal) bits.push(`release goal: ${state.releaseGoal}`);
  if (state.bystander) bits.push(`bystander: ${state.bystander}`);
  if (state.mustHave) bits.push(`must-have: ${state.mustHave}`);
  if (state.avoid) bits.push(`avoid: ${state.avoid}`);
  if (state.constraints) bits.push(`constraints: ${state.constraints}`);
  return bits.join(" | ");
}

function countPlannerSignals(state: PlannerState) {
  return [
    state.modality,
    state.goal,
    state.target,
    state.targetClass,
    state.targetExpression,
    state.internalization,
    state.payloadClass,
    state.linkerType,
    state.releaseGoal,
    state.bystander,
    state.mustHave,
    state.avoid,
    state.constraints,
  ].filter((item) => item.trim().length > 0).length;
}

const CONJUGATE_CLASSES = [
  "adc",
  "pdc",
  "smdc",
  "oligo conjugate",
  "rdc",
  "enzyme conjugate",
] as const;

function completeSentence(text?: string | null) {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  return /[.!?]$/.test(cleaned) ? cleaned : `${cleaned}.`;
}

function buildReadableRankingText(rankedOptions: RankedOption[], matrix?: MatrixRow[]) {
  const buckets = bucketRankedOptions(rankedOptions, matrix);
  const getScore = (name: string) => {
    const total = matrix?.find((row) => row.modality.toLowerCase().trim() === name.toLowerCase().trim())?.total;
    if (typeof total !== "number") return null;
    return Math.max(0, Math.min(10, Math.round(((total + 15) / 30) * 10)));
  };
  const feasibleText = buckets.feasible
    .map(
      (option) =>
        `${option.rank}. ${option.name}\n${getScore(option.name) !== null ? `score: ${getScore(option.name)}/10\n` : ""}why it fits: ${completeSentence(
          option.fitReason ?? option.summary
        )}\nbest evidence for: ${
          completeSentence(option.bestEvidenceFor ?? option.fitReason ?? option.summary)
        }\nmain reason against: ${completeSentence(option.mainReasonAgainst ?? option.limitReason ?? option.cons[0])}\nwhat would have to be true: ${
          completeSentence(option.whatMustBeTrue ?? "the remaining biology and delivery assumptions would have to hold")
        }`
    )
    .join("\n\n");

  const notViableText = buckets.notViable
    .map(
      ({ option, reason, score }) =>
        `${option.name}\n${typeof score === "number" ? `score: ${score}\n` : ""}why it drops out: ${completeSentence(reason)}`
    )
    .join("\n\n");

  return [
    feasibleText ? `feasible and worth ranking\n${feasibleText}` : "",
    notViableText ? `not really viable here\n${notViableText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildConsistentFallbackText(options: {
  directAnswer?: string;
  bestCurrentFit?: string;
  whyLeading: string;
  rankingText?: string;
  primaryRisk: string;
  firstMove: string;
}) {
  return [
    options.directAnswer ? `direct answer\n${completeSentence(options.directAnswer)}` : "",
    options.bestCurrentFit ? `best current fit\n${options.bestCurrentFit}` : "",
    `why this is leading\n${completeSentence(options.whyLeading)}`,
    options.rankingText ?? "",
    `main watchout\n${completeSentence(options.primaryRisk)}`,
    `first move\n${completeSentence(options.firstMove)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildComparisonText(rankedOptions: RankedOption[], matrix?: MatrixRow[]) {
  const buckets = bucketRankedOptions(rankedOptions, matrix);
  const getScore = (name: string) => {
    const total = matrix?.find((row) => row.modality.toLowerCase().trim() === name.toLowerCase().trim())?.total;
    if (typeof total !== "number") return null;
    return Math.max(0, Math.min(10, Math.round(((total + 15) / 30) * 10)));
  };
  const feasible = buckets.feasible
    .map((item, index) => `${index + 1}. ${item.name}${getScore(item.name) !== null ? ` (${getScore(item.name)}/10)` : ""}: ${item.fitReason ?? item.summary}`)
    .join("\n");
  const notViable = buckets.notViable
    .slice(0, 3)
    .map(({ option, reason }) => `- ${option.name}: ${reason}`)
    .join("\n");

  return [
    feasible ? `feasible options\n${feasible}` : "",
    notViable ? `not really viable here\n${notViable}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function normalizeTextForComparison(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function getTextOverlapScore(a: string, b: string) {
  const aTokens = new Set(normalizeTextForComparison(a));
  const bTokens = new Set(normalizeTextForComparison(b));
  if (!aTokens.size || !bTokens.size) return 0;
  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  return overlap / Math.min(aTokens.size, bTokens.size);
}

function getDistinctRiskAndFirstMove(planner: ReturnType<typeof buildPlanner>) {
  const primaryRisk = planner.risks[0] ?? "the biology window still needs to be tightened before the chemistry can be trusted.";
  const distinctMove =
    planner.plan.find((step) => getTextOverlapScore(primaryRisk, step) < 0.35) ??
    planner.plan[1] ??
    planner.plan[0] ??
    "lock the target biology and payload intent first, then rerun the ranking with that added context.";

  return {
    primaryRisk,
    distinctMove,
  };
}

function buildDesignSuggestions(state: PlannerState, planner: ReturnType<typeof buildPlanner>): DesignSuggestion[] {
  const topOption = planner.rankedOptions[0]?.name ?? "";
  const goal = state.goal.toLowerCase();
  const payloadClass = state.payloadClass.toLowerCase();
  const releaseGoal = state.releaseGoal.toLowerCase();
  const bystander = state.bystander.toLowerCase();

  let targetingTitle = "need one real target format";
  let targetingBody = "once the target biology is clearer, this turns into the binding format we would actually build around first.";

  if (topOption === "adc") {
    if (goal.includes("better tissue penetration")) {
      targetingTitle = "smaller antibody format";
      targetingBody = "i’d pressure-test a fab or scfv-style binder first if penetration is part of the brief, then only stay with full igg if the exposure win is clearly worth it.";
    } else {
      targetingTitle = "full igg-like antibody";
      targetingBody = "if adc stays on top, i’d start with a full antibody-style carrier because it buys half-life, avidity, and the most established payload/linker workflow.";
    }
  } else if (topOption === "rdc") {
    targetingTitle = "small ligand or peptide first";
    targetingBody = "for an rdc, i’d usually start from the smallest targeting element that still localizes well, because the isotope is doing the killing and extra carrier bulk can become a pk penalty.";
  } else if (topOption === "pdc") {
    targetingTitle = "peptide binder";
    targetingBody = "for pdc logic, i’d start with a real peptide targeting element first and only keep it if the payload and linker still leave enough binding and stability.";
  } else if (topOption === "smdc") {
    targetingTitle = "small-molecule ligand";
    targetingBody = "if smdc is winning, the core bet is the ligand itself. i’d only keep this route if the pharmacophore survives linker and payload attachment without collapsing affinity.";
  } else if (topOption === "oligo conjugate") {
    targetingTitle = "delivery handle, not classic antibody";
    targetingBody = "if oligo is on top, the real targeting choice is usually a delivery module like galnac or a receptor-biased conjugation strategy, not a classic antibody format by default.";
  } else if (topOption === "enzyme conjugate") {
    targetingTitle = "localized carrier + enzyme logic";
    targetingBody = "here the targeting format has to preserve enzyme competence too, so i’d start with the simplest carrier that still gets the enzyme or prodrug system to the right place.";
  }

  let linkerTitle = "linker still needs to be chosen";
  let linkerBody = "the best linker depends on whether you need release, intact delivery, or a chelator-style build.";

  if (releaseGoal.includes("radiometal") || topOption === "rdc") {
    linkerTitle = "chelator / spacer system";
    linkerBody = "for radioligand logic, the linker is mostly a positioning and pk module. i’d think in terms of dota/nota plus spacer fit, not classical payload release.";
  } else if (topOption === "oligo conjugate") {
    linkerTitle = "stable terminal attachment";
    linkerBody = "for oligo conjugates, i’d bias toward a stable attachment that preserves the active strand or terminus instead of a classic free-drug release linker.";
  } else if (bystander === "yes" || payloadClass.includes("microtubule") || payloadClass.includes("topo")) {
    linkerTitle = "protease-cleavable linker";
    linkerBody = "if the goal is a classical cytotoxic payload with real release, i’d usually start with a protease-cleavable linker because it gives the clearest free-payload logic.";
  } else if (releaseGoal.includes("stay intact")) {
    linkerTitle = "non-cleavable / very stable linker";
    linkerBody = "if premature release is the main fear, i’d start from a more stable linker and accept that the active species may be a processed metabolite instead of the free drug.";
  } else if (payloadClass.includes("oligo")) {
    linkerTitle = "handle-preserving attachment linker";
    linkerBody = "the linker needs to preserve the part doing the biology first, so this should stay compact and attachment-position aware rather than bulky and release-heavy.";
  }

  let payloadTitle = "payload class still open";
  let payloadBody = "the payload choice should follow the therapeutic intent, not the other way around.";

  if (payloadClass.includes("microtubule")) {
    payloadTitle = "microtubule inhibitor";
    payloadBody = "this reads like an mmae/dm1-style cytotoxic logic case, where the main job is getting a potent mitotic payload into the right cells without blowing up the window.";
  } else if (payloadClass.includes("topo")) {
    payloadTitle = "topo-i inhibitor";
    payloadBody = "sn-38 or exatecan-style payload logic makes sense here if you want a potent dna-replication hit with a somewhat different permeability and release profile than tubulin payloads.";
  } else if (payloadClass.includes("dna-damaging")) {
    payloadTitle = "dna-damaging payload";
    payloadBody = "this is the most potency-heavy path, so i’d only keep it if the targeting window and release control are both unusually convincing.";
  } else if (payloadClass.includes("radionuclide") || topOption === "rdc") {
    payloadTitle = "radiometal payload";
    payloadBody = "here the payload is really the isotope-chelator system, so i’d choose lu-177 or ac-225 based on range, dosimetry, and organ-exposure tolerance.";
  } else if (payloadClass.includes("oligo") || goal.includes("gene modulation") || topOption === "oligo conjugate") {
    payloadTitle = "sirna / aso / pmo cargo";
    payloadBody = "if the biology is gene modulation, the payload recommendation should be an oligo class first, then the delivery logic gets built around that scaffold.";
  } else if (goal.includes("max tumor cell killing")) {
    payloadTitle = "classical cytotoxic payload";
    payloadBody = "for straight tumor killing, i’d start with microtubule or topo-i classes first because they have the clearest targeted-conjugate precedent.";
  }

  return [
    {
      label: "targeting format",
      title: targetingTitle,
      body: targetingBody,
      accent: "border-sky-200 bg-sky-50/70",
    },
    {
      label: "linker suggestion",
      title: linkerTitle,
      body: linkerBody,
      accent: "border-violet-200 bg-violet-50/70",
    },
    {
      label: "payload suggestion",
      title: payloadTitle,
      body: payloadBody,
      accent: "border-rose-200 bg-rose-50/70",
    },
  ];
}

function buildOptionDesignPriorities(
  option: RankedOption,
  state: PlannerState,
  precedentPlaybook?: TracePrecedentPlaybook | null,
): DesignSuggestion[] {
  const goal = state.goal.toLowerCase();
  const payloadClass = state.payloadClass.toLowerCase();
  const releaseGoal = state.releaseGoal.toLowerCase();
  const bystander = state.bystander.toLowerCase();
  const freeText = `${state.idea} ${state.mustHave} ${state.avoid} ${state.target} ${state.constraints}`.toLowerCase();
  const wantsCompactProteinFormat =
    goal.includes("better tissue penetration") ||
    freeText.includes("penetration") ||
    freeText.includes("solid tumor") ||
    freeText.includes("extravasation") ||
    freeText.includes("smaller format") ||
    freeText.includes("compact");
  const wantsMultiTargeting =
    state.targetExpression === "high + heterogeneous" ||
    freeText.includes("heterogeneous") ||
    freeText.includes("dual target") ||
    freeText.includes("bispecific") ||
    freeText.includes("multispecific") ||
    freeText.includes("two targets") ||
    freeText.includes("target escape");
  const matchedPlaybook =
    precedentPlaybook && precedentPlaybook.modality === option.name ? precedentPlaybook : null;

  if (option.name === "adc") {
    if (matchedPlaybook) {
      return [
        {
          label: "targeting",
          title: matchedPlaybook.dominantProduct.format,
          body: `${matchedPlaybook.dominantProduct.label} is the dominant current playbook here, so i’d start from ${matchedPlaybook.dominantProduct.format} instead of a generic alternate carrier.`,
          accent: "border-sky-200 bg-sky-50/70",
        },
        {
          label: "linker",
          title: matchedPlaybook.dominantProduct.linker,
          body: `i’d start with ${matchedPlaybook.dominantProduct.linker} because that is what the leading approved-product playbook already points to.${matchedPlaybook.comparatorProduct ? ` ${matchedPlaybook.comparatorProduct.label} is the older comparator with ${matchedPlaybook.comparatorProduct.linker}.` : ""}`,
          accent: "border-violet-200 bg-violet-50/70",
        },
        {
          label: "payload",
          title: matchedPlaybook.dominantProduct.payload,
          body: `${matchedPlaybook.dominantProduct.label} makes ${matchedPlaybook.dominantProduct.payload} the primary starting direction here.${matchedPlaybook.dominantProduct.bystander ? ` ${matchedPlaybook.dominantProduct.bystander}` : ""}${matchedPlaybook.comparatorProduct ? ` ${matchedPlaybook.comparatorProduct.label} is the older comparator with ${matchedPlaybook.comparatorProduct.payload}, so that should stay comparator logic rather than the first default screen.` : ""}`,
          accent: "border-rose-200 bg-rose-50/70",
        },
      ];
    }

    const targetingTitle = wantsMultiTargeting
      ? "bispecific / multispecific antibody format"
      : wantsCompactProteinFormat
        ? "fab / scfv / vhh-style smaller protein format"
        : "full igg or igg-like antibody";
    const targetingBody = wantsMultiTargeting
      ? "use a bispecific or multispecific format when one antigen is too patchy on its own or you need tighter disease discrimination than a single binder can give."
      : wantsCompactProteinFormat
        ? "use a smaller protein format when tumor penetration or dense solid-tumor access matters more than maximum half-life."
        : "start with the full igg playbook when exposure, manufacturing precedent, and classical adc biology matter most.";
    return [
      {
        label: "targeting",
        title: targetingTitle,
        body: targetingBody,
        accent: "border-sky-200 bg-sky-50/70",
      },
      {
        label: "linker",
        title: bystander === "yes" ? "protease-cleavable linker" : "stable or tuned-cleavable linker",
        body: bystander === "yes"
          ? "lean into free-payload release if bystander spread is part of the value."
          : "bias toward cleaner stability when the main goal is a tighter safety window.",
        accent: "border-violet-200 bg-violet-50/70",
      },
      {
        label: "payload",
        title: payloadClass.includes("topo") ? "topo-i payload" : "microtubule payload first",
        body: payloadClass.includes("topo")
          ? "sn-38 or exatecan-like logic makes sense if you already want topo chemistry."
          : "mmae/dm1-style payload logic is still the most straightforward first screen.",
        accent: "border-rose-200 bg-rose-50/70",
      },
    ];
  }

  if (option.name === "pdc") {
    return [
      {
        label: "targeting",
        title: "linear or cyclic peptide binder",
        body: "start with the smallest peptide that still survives conjugation without losing binding.",
        accent: "border-sky-200 bg-sky-50/70",
      },
      {
        label: "linker",
        title: "compact cleavable linker",
        body: "the linker usually has to stay smaller here because peptide stability gets fragile fast.",
        accent: "border-violet-200 bg-violet-50/70",
      },
      {
        label: "payload",
        title: payloadClass.includes("radionuclide") ? "radioligand payload" : "compact cytotoxic payload",
        body: "keep payload bulk under control or the peptide can stop behaving like the thing you selected it for.",
        accent: "border-rose-200 bg-rose-50/70",
      },
    ];
  }

  if (option.name === "smdc") {
    return [
      {
        label: "targeting",
        title: "validated small-molecule ligand",
        body: "only keep smdc if the ligand still binds once real linker and payload mass are attached.",
        accent: "border-sky-200 bg-sky-50/70",
      },
      {
        label: "linker",
        title: releaseGoal.includes("stay intact") ? "stable compact linker" : "minimal cleavable linker",
        body: "smdc linkers usually need to do pk work without making the pharmacophore collapse.",
        accent: "border-violet-200 bg-violet-50/70",
      },
      {
        label: "payload",
        title: payloadClass.includes("radionuclide") ? "radiometal system" : "small, potent payload",
        body: "smaller, cleaner payload classes usually hold up better in smdc architecture.",
        accent: "border-rose-200 bg-rose-50/70",
      },
    ];
  }

  if (option.name === "oligo conjugate") {
    return [
      {
        label: "targeting",
        title: "delivery-biased handle",
        body: "think galnac or receptor-biased delivery logic instead of a classic large targeting carrier first.",
        accent: "border-sky-200 bg-sky-50/70",
      },
      {
        label: "linker",
        title: "stable terminal attachment",
        body: "preserve the active strand or terminus before worrying about release chemistry.",
        accent: "border-violet-200 bg-violet-50/70",
      },
      {
        label: "payload",
        title: "sirna / aso / pmo scaffold",
        body: "pick the oligo class from the biology first, then adapt the delivery chemistry around it.",
        accent: "border-rose-200 bg-rose-50/70",
      },
    ];
  }

  if (option.name === "rdc") {
    return [
      {
        label: "targeting",
        title: wantsCompactProteinFormat ? "small protein / peptide / ligand vector" : "small ligand or peptide vector",
        body: wantsCompactProteinFormat
          ? "rdcs can absolutely use nanobodies or other small protein vectors when localization is strong and the extra protein size still pays for itself."
          : "the targeting job is localization first, not classic free-drug release biology.",
        accent: "border-sky-200 bg-sky-50/70",
      },
      {
        label: "linker",
        title: "chelator + spacer system",
        body: "dota/nota-style chemistry matters more than classical cleavable linker logic here.",
        accent: "border-violet-200 bg-violet-50/70",
      },
      {
        label: "payload",
        title: "lu-177 or ac-225 style isotope",
        body: "choose the isotope around range, dosimetry, and organ-tolerance, not generic potency language.",
        accent: "border-rose-200 bg-rose-50/70",
      },
    ];
  }

  return [
    {
      label: "targeting",
      title: wantsCompactProteinFormat ? "compact localized carrier" : "localized carrier",
      body: wantsCompactProteinFormat
        ? "small protein formats can be valid here too, as long as they do not break the enzyme or prodrug activation logic."
        : "keep the targeting piece as simple as possible while preserving enzyme or prodrug logic.",
      accent: "border-sky-200 bg-sky-50/70",
    },
    {
      label: "linker",
      title: "function-preserving connection",
      body: "the connector cannot destroy the catalytic or activation step the modality depends on.",
      accent: "border-violet-200 bg-violet-50/70",
    },
    {
      label: "payload",
      title: "substrate / prodrug logic",
      body: "the active chemistry here is usually local activation rather than a classic payload-release story.",
      accent: "border-rose-200 bg-rose-50/70",
    },
  ];
}

function extractMentionedConjugateClasses(text: string) {
  const normalized = text.toLowerCase();
  return CONJUGATE_CLASSES.filter((label) => normalized.includes(label));
}

function softenConfidence(text: string) {
  return text
    .replace(/best current fit:/gi, "tentative best fit:")
    .replace(/full ranking right now:/gi, "ranking right now (tentative):")
    .replace(/ranking right now:/gi, "ranking right now (tentative):")
    .replace(/main watchout:/gi, "main watchout so far:")
    .replace(/first move:/gi, "first move i’d take next:");
}

function buildGlobalRanking(state: PlannerState): RankedOption[] {
  const goal = state.goal.toLowerCase();
  const modality = state.modality.toLowerCase();
  const payload = state.payloadClass.toLowerCase();
  const release = state.releaseGoal.toLowerCase();
  const targetClass = state.targetClass.toLowerCase();
  const internalization = state.internalization.toLowerCase();
  const bystander = state.bystander.toLowerCase();
  const scores = {
    ADC: 0,
    PDC: 0,
    SMDC: 0,
    Oligo: 0,
    RDC: 0,
    Enzyme: 0,
  };

  const bump = (name: keyof typeof scores, amount: number) => {
    scores[name] += amount;
  };

  if (modality && scores[modality.toUpperCase() as keyof typeof scores] !== undefined) {
    bump(modality.toUpperCase() as keyof typeof scores, 5);
  }

  if (goal.includes("gene modulation") || payload.includes("oligo")) {
    bump("Oligo", 10);
    bump("PDC", 2);
    bump("ADC", -2);
  }

  if (
    goal.includes("radiotherapy") ||
    goal.includes("theranostics") ||
    payload.includes("radionuclide") ||
    release.includes("radiometal")
  ) {
    bump("RDC", 10);
    bump("SMDC", 3);
    bump("PDC", 2);
  }

  if (goal.includes("better tissue penetration")) {
    bump("SMDC", 6);
    bump("PDC", 5);
    bump("ADC", -1);
  }

  if (goal.includes("max tumor cell killing")) {
    bump("ADC", 6);
    bump("PDC", 4);
    bump("SMDC", 4);
  }

  if (goal.includes("safer exposure window")) {
    bump("RDC", 2);
    bump("Oligo", 2);
    bump("Enzyme", 2);
  }

  if (payload.includes("microtubule") || payload.includes("topo") || payload.includes("dna-damaging")) {
    bump("ADC", 5);
    bump("PDC", 4);
    bump("SMDC", 4);
  }

  if (payload.includes("enzyme")) {
    bump("Enzyme", 8);
  }

  if (targetClass.includes("transporter") || targetClass.includes("metabolic")) {
    bump("SMDC", 5);
  }

  if (targetClass.includes("cell-surface receptor")) {
    bump("ADC", 3);
    bump("PDC", 2);
    bump("RDC", 1);
  }

  if (targetClass.includes("tumor antigen")) {
    bump("ADC", 2);
    bump("RDC", 2);
  }

  if (targetClass.includes("stromal")) {
    bump("RDC", 3);
    bump("ADC", 2);
  }

  if (internalization === "fast") {
    bump("ADC", 3);
    bump("Oligo", 3);
    bump("PDC", 2);
  }

  if (internalization === "slow") {
    bump("RDC", 4);
    bump("SMDC", 2);
    bump("ADC", -2);
    bump("Oligo", -3);
  }

  if (bystander === "yes") {
    bump("ADC", 4);
    bump("PDC", 2);
    bump("Oligo", -3);
  }

  const optionMap: Record<keyof typeof scores, Omit<RankedOption, "rank">> = {
    ADC: {
      name: "adc",
      summary: "strongest when intracellular payload delivery and a mature cytotoxic toolkit matter most.",
      fitReason: "best when the target window is real, internalization is usable, and you want the most established cytotoxic delivery playbook.",
      limitReason: "less attractive when tissue penetration, carrier size, or weak target separation are the main problem.",
      pros: ["best-established payload/linker playbook", "good half-life support", "strong bystander options when needed"],
      cons: ["biggest carrier", "needs a believable target window", "penetration can lag smaller formats"],
    },
    PDC: {
      name: "pdc",
      summary: "best when you want a smaller targeted carrier but still need more modularity than a pure small-molecule ligand.",
      fitReason: "best when a peptide can give selective binding and you need a compact carrier with more targeting flexibility than an smdc.",
      limitReason: "less attractive when peptide stability, exposure time, or payload mass starts breaking the binding element.",
      pros: ["compact", "peptide recognition can be highly specific", "sits nicely between smdc and adc"],
      cons: ["peptide stability pressure", "payload load can disrupt binding fast", "shorter exposure than adc"],
    },
    SMDC: {
      name: "smdc",
      summary: "best when a real small-molecule targeting pharmacophore already exists and compact penetration matters.",
      fitReason: "best when a proven ligand already exists and small size, penetration, and medicinal chemistry control matter most.",
      limitReason: "less attractive when the ligand loses function after conjugation or when payload bulk and pk liabilities dominate quickly.",
      pros: ["smallest classical targeted-conjugate build", "fast tissue access", "medicinal chemistry is very tunable"],
      cons: ["ligand fit can break after conjugation", "kidney/pk issues show up early", "payload bulk hurts quickly"],
    },
    Oligo: {
      name: "oligo conjugate",
      summary: "best when the payload biology is sequence-specific gene modulation rather than classical cell killing.",
      fitReason: "best when the therapeutic effect is rna-directed knockdown, splice redirection, or antisense modulation.",
      limitReason: "less attractive when you need bystander killing, simple extracellular action, or a classic free-drug release story.",
      pros: ["direct rna-level mechanism", "clear scaffold-specific design logic", "high biological specificity"],
      cons: ["productive trafficking is hard", "not a bystander platform", "uptake can look better than real activity"],
    },
    RDC: {
      name: "rdc",
      summary: "best when target localization and isotope physics are doing the therapeutic work.",
      fitReason: "best when a radiometal payload, target localization, and dosimetry are the real efficacy engine.",
      limitReason: "less attractive when the whole idea depends on classic intracellular free-drug release rather than radiation delivery.",
      pros: ["does not depend on classic free-drug release", "approved precedents exist", "can work with weaker internalization"],
      cons: ["dosimetry and chelation dominate", "normal-organ exposure is central", "completely different payload logic"],
    },
    Enzyme: {
      name: "enzyme conjugate",
      summary: "best when local catalysis or prodrug activation is the real selectivity engine.",
      fitReason: "best when the enzyme step or local catalytic activation is what creates selectivity rather than the carrier alone.",
      limitReason: "less attractive when the enzyme, substrate, and local activation logic are all too fragile to co-exist in vivo.",
      pros: ["can create local activation logic", "good fit for prodrug systems", "useful when delivery alone is not enough"],
      cons: ["catalytic competence is fragile", "background activity can ruin selectivity", "assays are more complex"],
    },
  };

  return (Object.keys(scores) as Array<keyof typeof scores>)
    .sort((a, b) => scores[b] - scores[a])
    .map((key, index) => ({
      rank: index + 1,
      ...optionMap[key],
    }));
}

function buildPlanner(state: PlannerState) {
  const strategyCards: StrategyCard[] = [];
  const risks: string[] = [];
  const plan: string[] = [];
  const evidence: EvidenceCue[] = [];
  const alternatives: StrategyCard[] = [];
  const decisionSignals: StrategyCard[] = [];
  const comparablePrograms: ComparableProgram[] = [];
  const rankedOptions: RankedOption[] = [];
  const signalCount = countPlannerSignals(state);

  let recommendation =
    "start by locking the biology first. the fastest way to make this planner useful is to choose the target, the modality, and the one thing you absolutely need the construct to do.";

  let summary =
    "right now this reads like an early-stage concept, which is totally fine. the page should help you narrow the strategy instead of pretending the chemistry is decided already.";

  const addEvidence = (label: string, why: string, type: string) => {
    if (!evidence.some((item) => item.label === label)) {
      evidence.push({ label, why, type });
    }
  };

  if (state.modality === "ADC") {
    recommendation =
      "adc is the cleanest fit when you want intracellular cytotoxic delivery, real bystander optionality, and a bigger carrier that can buffer exposure and half-life.";
    summary =
      "this looks like adc territory if the target window is strong enough and the biology supports internalization. the main decisions are then payload permeability, linker behavior, and how much heterogeneity you can tolerate.";
    rankedOptions.push(
      {
        name: "adc",
        rank: 1,
        summary: "best fit if you want intracellular payload delivery with the most established targeted-conjugate playbook.",
        pros: [
          "strongest precedent for cytotoxic delivery",
          "better half-life buffering than smaller carriers",
          "flexible payload and linker toolkit",
        ],
        cons: [
          "bigger size can hurt tissue penetration",
          "target window has to be real",
          "chemistry heterogeneity still matters",
        ],
      },
      {
        name: "pdc",
        rank: 2,
        summary: "worth considering if the same biology wants a smaller carrier with better movement into tissue.",
        pros: ["smaller and faster through tissue", "more modular than most smdcs"],
        cons: ["less forgiving on stability", "peptide can lose function after conjugation"],
      },
      {
        name: "rdc",
        rank: 3,
        summary: "interesting fallback if target localization is good but free-drug release looks risky.",
        pros: ["does not rely on classical free payload release", "can work with non-internalizing logic"],
        cons: ["organ dosimetry becomes central", "isotope handling changes the whole program"],
      }
    );
    strategyCards.push(
      {
        title: "best-fit modality",
        body:
          "adc is strongest when target expression is useful, internalization is real, and you want a payload-driven efficacy model rather than pure ligand pharmacology.",
      },
      {
        title: "linker logic",
        body:
          state.bystander === "yes"
            ? "lean toward a cleavable linker plus a membrane-permeable payload if bystander activity is a real goal."
            : "if bystander is not needed, a more stable linker or a trapped payload can buy a cleaner safety window.",
      },
      {
        title: "payload logic",
        body:
          "microtubule and topo-i payloads are usually the most practical starting classes unless the target biology pushes you somewhere more specialized.",
      },
      {
        title: "what to de-risk first",
        body:
          "target expression window, internalization speed, and whether the released species actually matches the biology you want.",
      }
    );
    alternatives.push(
      {
        title: "if size starts hurting penetration",
        body:
          "move the concept toward pdc or smdc only if the target biology still works without antibody half-life and avidity.",
      },
      {
        title: "if internalization looks weak",
        body:
          "rdc or extracellularly active designs may be a better fit than forcing an intracellular adc story.",
      }
    );
    decisionSignals.push(
      {
        title: "go signal",
        body:
          "strong target expression, usable internalization, and a payload class that still makes sense after release.",
      },
      {
        title: "no-go signal",
        body:
          "weak target separation from normal tissue or a payload story that relies on release behavior the target biology cannot support.",
      }
    );
    comparablePrograms.push(
      { name: "trastuzumab deruxtecan", reason: "internalizing target plus cleavable topo-i payload logic." },
      { name: "datopotamab deruxtecan", reason: "same general payload-release logic but a different target window." }
    );
    addEvidence("adc modality review", "good reality check for when adc is actually the right size and biology match.", "review");
    addEvidence("payload permeability and bystander review", "helps validate whether the payload/release story matches the bystander goal.", "review");
    if (state.target.toLowerCase().includes("breast")) {
      addEvidence("adcs in breast cancer review", "useful disease-specific anchor if the target sits in breast-cancer programs.", "disease review");
    }
  }

  if (state.modality === "Oligo") {
    recommendation =
      "oligo is the right fit when the real goal is gene modulation, splice correction, or knockdown, not classical bystander killing.";
    summary =
      "this looks like an oligo design problem if the active event is intracellular rna biology. then the hard part becomes productive trafficking, not only target binding.";
    rankedOptions.push(
      {
        name: "oligo conjugate",
        rank: 1,
        summary: "best fit when the active biology is rna modulation rather than classical cytotoxic killing.",
        pros: [
          "sequence-specific biology",
          "can solve knockdown or splice-switching problems directly",
          "attachment strategy can be highly tailored",
        ],
        cons: [
          "productive trafficking is hard",
          "bystander logic usually does not apply",
          "uptake alone can look better than real activity",
        ],
      },
      {
        name: "adc",
        rank: 2,
        summary: "better if the real goal is cell kill and not gene modulation.",
        pros: ["more mature payload-release playbook", "better bystander options"],
        cons: ["does not answer sequence-specific biology", "larger carrier"],
      },
      {
        name: "pdc",
        rank: 3,
        summary: "possible when you still want compact targeting but the payload story is not truly oligo-native.",
        pros: ["smaller carrier", "modular peptide route"],
        cons: ["less direct than oligo for rna goals", "stability can become the main problem"],
      }
    );
    strategyCards.push(
      {
        title: "best-fit modality",
        body:
          "oligo conjugates win when you need sequence-specific biology. they are not a substitute for a cytotoxic payload if the goal is broad tumor kill.",
      },
      {
        title: "linker logic",
        body:
          "the linker is usually about spacing, attachment position, and preserving the active strand or scaffold rather than classical warhead-release logic.",
      },
      {
        title: "payload logic",
        body:
          "pick the oligo class first: siRNA, ASO, and PMO each change the productive compartment and the failure mode.",
      },
      {
        title: "what to de-risk first",
        body:
          "internalization is not enough. you need productive endosomal escape or the right nuclear routing, depending on the scaffold.",
      }
    );
    alternatives.push(
      {
        title: "if you need broad cell killing",
        body:
          "switch the concept back toward adc, pdc, or smdc. oligo only wins if the payload biology is genuinely sequence-directed.",
      },
      {
        title: "if uptake looks easy but activity is low",
        body:
          "the problem is usually productive trafficking or attachment position, not more target affinity.",
      }
    );
    decisionSignals.push(
      {
        title: "go signal",
        body:
          "clear rna-level biology, a scaffold that matches the compartment you need, and a delivery module that does not wreck productive processing.",
      },
      {
        title: "no-go signal",
        body:
          "trying to force cytotoxic-style goals onto a gene-modulation platform.",
      }
    );
    comparablePrograms.push(
      { name: "galnac-siRNA playbook", reason: "shows how productive delivery matters more than generic uptake." },
      { name: "aoc-style programs", reason: "good model for tissue-directed oligo conjugation when muscle or other hard tissues matter." }
    );
    addEvidence("galnac-siRNA and targeted oligo review", "good anchor for why productive delivery matters more than generic uptake.", "review");
    addEvidence("oligo conjugate review", "helps compare siRNA, aso, and pmo logic before overcommitting to one scaffold.", "review");
    addEvidence("aoc platform example", "industry example for how tissue-directed oligo conjugation is framed in practice.", "company platform");
  }

  if (state.modality === "PDC") {
    recommendation =
      "pdc is attractive when compact size, tissue movement, and a peptide-defined targeting motif matter more than long antibody-like exposure.";
    summary =
      "this reads like a pdc if you want a smaller targeted carrier but still need more modularity than a bare smdc ligand usually gives you.";
    rankedOptions.push(
      {
        name: "pdc",
        rank: 1,
        summary: "best fit when you want a compact targeted carrier but more modularity than a pure small-molecule ligand.",
        pros: [
          "smaller than adc",
          "peptide targeting can be highly specific",
          "good bridge between smdc and adc logic",
        ],
        cons: [
          "proteolysis can punish you early",
          "payload load can disrupt binding quickly",
          "shorter exposure window than adc",
        ],
      },
      {
        name: "smdc",
        rank: 2,
        summary: "strong alternative when the targeting pharmacophore is really a small molecule, not a peptide.",
        pros: ["fast tissue penetration", "clean medicinal chemistry tuning"],
        cons: ["ligand tolerance can collapse fast", "often harsher pk penalties"],
      },
      {
        name: "adc",
        rank: 3,
        summary: "fallback if the biology needs more half-life and a more forgiving carrier.",
        pros: ["more buffered exposure", "mature platform logic"],
        cons: ["bigger and slower into tissue", "less compact design"],
      }
    );
    strategyCards.push(
      {
        title: "best-fit modality",
        body:
          "pdcs are useful when a peptide can give you the right binding biology without the bulk of an antibody scaffold.",
      },
      {
        title: "linker logic",
        body:
          "because the carrier is small, linker behavior shows up early. stability, proteolysis, and the exact released species matter fast.",
      },
      {
        title: "payload logic",
        body:
          "cytotoxic, imaging, and radiometal systems all work here, but the peptide has less room to hide hydrophobicity or bad release behavior.",
      },
      {
        title: "what to de-risk first",
        body:
          "carrier proteolysis, target residence, and whether the peptide still binds once you hang real chemistry off it.",
      }
    );
    alternatives.push(
      {
        title: "if the peptide keeps falling apart",
        body:
          "cyclic peptides or a jump to smdc can sometimes buy stability without moving all the way to adc.",
      },
      {
        title: "if the payload dominates the whole molecule",
        body:
          "shorten the linker, rebalance polarity, or use a payload class that is less punishing on a compact carrier.",
      }
    );
    decisionSignals.push(
      {
        title: "go signal",
        body:
          "the peptide still binds with real conjugation load on it, and the linker does not turn the whole construct into a proteolysis problem.",
      },
      {
        title: "no-go signal",
        body:
          "a targeting motif that only works when it is still a clean standalone peptide.",
      }
    );
    comparablePrograms.push(
      { name: "somatostatin-radioligand logic", reason: "good anchor for peptide-directed delivery when receptor biology is strong." },
      { name: "integrin-directed pdc concepts", reason: "useful when tissue movement and receptor bias matter more than antibody exposure." }
    );
    addEvidence("pdc review", "broad overview for when peptide carriers actually improve the strategy.", "review");
    addEvidence("pdc linker and payload review", "useful for matching peptide stability to linker and payload choices.", "review");
  }

  if (state.modality === "SMDC") {
    recommendation =
      "smdc is strongest when you already have a real small-molecule ligand and you want a compact construct with fast tissue penetration and tunable medicinal chemistry.";
    summary =
      "this looks like an smdc problem when the targeting pharmacophore is itself a small molecule. then ligand tolerance, linker bulk, and exposed payload behavior dominate the design.";
    rankedOptions.push(
      {
        name: "smdc",
        rank: 1,
        summary: "best fit when you already trust the small-molecule binder and want compact tissue access.",
        pros: [
          "fast penetration",
          "fully medicinal-chemistry driven",
          "can be very modular if the ligand survives conjugation",
        ],
        cons: [
          "kidney and pk issues show up early",
          "ligand pharmacophore can break easily",
          "payload bulk matters a lot",
        ],
      },
      {
        name: "pdc",
        rank: 2,
        summary: "good alternative if you need slightly more carrier complexity without going full antibody.",
        pros: ["more room for tuning than many smdcs", "peptide targeting flexibility"],
        cons: ["can introduce proteolysis issues", "still less forgiving than adc"],
      },
      {
        name: "rdc",
        rank: 3,
        summary: "worth considering if the ligand is strong but a classical released-drug story keeps failing.",
        pros: ["can shift the efficacy logic to radiobiology", "strong fit for psma-style systems"],
        cons: ["chelator/isotope complexity", "normal-organ exposure becomes central"],
      }
    );
    strategyCards.push(
      {
        title: "best-fit modality",
        body:
          "smdcs work best when a real small-molecule binder already exists and can survive conjugation without losing target fit.",
      },
      {
        title: "linker logic",
        body:
          "in smdcs the linker is not only a release switch. it also sets spacing, polarity, and what chemical species actually reaches the tissue.",
      },
      {
        title: "payload logic",
        body:
          "use payload classes that still make sense under compact-carrier exposure. hydrophobicity and released-species identity matter earlier than they do in adcs.",
      },
      {
        title: "what to de-risk first",
        body:
          "loss of ligand affinity, kidney handling, plasma instability, and whether the payload chemistry wrecks the whole pharmacophore.",
      }
    );
    alternatives.push(
      {
        title: "if ligand fit collapses after conjugation",
        body:
          "revisit the attachment vector first. if that still fails, the target may want a peptide or antibody carrier instead.",
      },
      {
        title: "if kidney handling becomes the whole story",
        body:
          "shift the polarity, linker bulk, or payload class before you assume the ligand itself is wrong.",
      }
    );
    decisionSignals.push(
      {
        title: "go signal",
        body:
          "a real small-molecule pharmacophore survives conjugation and still gives selective uptake at a useful exposure window.",
      },
      {
        title: "no-go signal",
        body:
          "the ligand loses target fit as soon as the linker and payload are real, not hypothetical.",
      }
    );
    comparablePrograms.push(
      { name: "vintafolide-style folate smdc", reason: "classic proof that a very small ligand can still drive a full conjugate strategy." },
      { name: "psma radioligand logic", reason: "important reminder that compact ligand systems can also excel in radiopharmaceutical formats." }
    );
    addEvidence("smdc opportunities review", "good overview for choosing between ligand-first smdc logic and larger conjugate formats.", "review");
    addEvidence("small-molecule drug conjugates review", "helps validate linker, ligand, and payload trade-offs in compact scaffolds.", "review");
    addEvidence("folate-vinca conjugates", "classic example of how a very small ligand can still carry a full payload strategy.", "program example");
  }

  if (state.modality === "RDC") {
    recommendation =
      "rdc is the right bucket when the payload is radiation itself and the main build problem is ligand-chelator-radionuclide matching rather than classical free-drug release.";
    summary =
      "this is an rdc if the isotope is the business end of the construct. then target selection, organ exposure, chelation, and isotope path length become the real design levers.";
    rankedOptions.push(
      {
        name: "rdc",
        rank: 1,
        summary: "best fit when radiation is the real payload logic and target localization can do the work.",
        pros: [
          "does not require classical free-drug release",
          "clinically strong for psma and somatostatin settings",
          "can work even when internalization is imperfect",
        ],
        cons: [
          "organ dosimetry and chelation matter a lot",
          "not a shortcut around weak target biology",
          "safety window depends on isotope choice",
        ],
      },
      {
        name: "smdc-style radioligand",
        rank: 2,
        summary: "good when the ligand itself is already a known small-molecule binder.",
        pros: ["compact format", "fast target access"],
        cons: ["kidney/salivary exposure can stay difficult", "less room to hide bad pk"],
      },
      {
        name: "adc",
        rank: 3,
        summary: "only worth revisiting if you actually need a cytotoxic-release story rather than radiobiology.",
        pros: ["strong payload toolbox", "more half-life support"],
        cons: ["different modality logic entirely", "won’t solve isotope-specific issues"],
      }
    );
    strategyCards.push(
      {
        title: "best-fit modality",
        body:
          "rdcs win when target localization and radiobiology do more work than intracellular warhead release would.",
      },
      {
        title: "linker / chelator logic",
        body:
          "the structural module often exists to preserve binding and hold the metal securely, not to release a free payload in the usual conjugate sense.",
      },
      {
        title: "payload logic",
        body:
          "beta emitters are usually more forgiving for broader coverage, while alpha emitters push harder on local hit density and safety.",
      },
      {
        title: "what to de-risk first",
        body:
          "normal-organ uptake, chelator-isotope fit, and whether the target biology suits a short-range or longer-range radiation pattern.",
      }
    );
    alternatives.push(
      {
        title: "if organ uptake dominates",
        body:
          "do not force a hotter isotope first. fix ligand selectivity, chelator fit, and spacer behavior before escalating radiobiology.",
      },
      {
        title: "if internalization is weak",
        body:
          "that can still be workable, but the isotope choice has to match a more surface-localized exposure story.",
      }
    );
    decisionSignals.push(
      {
        title: "go signal",
        body:
          "target localization is strong enough that isotope physics can do the work without unacceptable normal-organ exposure.",
      },
      {
        title: "no-go signal",
        body:
          "kidney, salivary, or marrow exposure becomes the real dominant biology before tumor control does.",
      }
    );
    comparablePrograms.push(
      { name: "lutathera", reason: "good anchor for receptor-directed beta-emitter logic." },
      { name: "pluvicto", reason: "best current model for psma-directed radioligand strategy." }
    );
    addEvidence("lutathera label", "good approved anchor for somatostatin-radioligand design logic.", "approved drug");
    addEvidence("pluvicto label", "best approved anchor for psma-directed radioligand strategy.", "approved drug");
    addEvidence("pluvicto first approval review", "helpful bridge between label language and practical design framing.", "approval review");
  }

  if (state.modality === "Enzyme") {
    recommendation =
      "enzyme-directed conjugation or enzyme-prodrug logic is best when local catalytic activation is the real source of selectivity, not just passive delivery of a pre-activated payload.";
    summary =
      "this looks like an enzyme-conjugate problem if the point is to bring catalytic activity to the target site or to unlock a substrate locally.";
    rankedOptions.push(
      {
        name: "enzyme-directed conjugate",
        rank: 1,
        summary: "best fit when local catalysis or prodrug activation is really the selectivity engine.",
        pros: [
          "can create biology that simple delivery cannot",
          "useful when local activation matters more than carrier size",
          "good fit for prodrug logic",
        ],
        cons: [
          "catalytic competence after conjugation is fragile",
          "background activation can kill the concept",
          "assay setup is usually more complex",
        ],
      },
      {
        name: "oligo or pdc fallback",
        rank: 2,
        summary: "worth considering if the system is using the enzyme only as a complicated way to chase targeting.",
        pros: ["simpler readout", "cleaner delivery logic"],
        cons: ["loses catalytic selectivity concept", "may not answer the same biology"],
      },
      {
        name: "adc fallback",
        rank: 3,
        summary: "only useful if the catalytic logic is not carrying the real value anymore.",
        pros: ["mature payload toolkit", "clearer release logic"],
        cons: ["bigger carrier", "different biological mechanism"],
      }
    );
    strategyCards.push(
      {
        title: "best-fit modality",
        body:
          "enzyme systems shine when the catalyst itself is part of the therapeutic logic rather than a hidden manufacturing tool.",
      },
      {
        title: "linker logic",
        body:
          "here the connector often has to preserve both targeting and catalytic competence, so overly aggressive chemistry can break the whole platform.",
      },
      {
        title: "payload / substrate logic",
        body:
          "the active event is local catalytic turnover or prodrug activation, so substrate fit and local exposure usually matter more than classical bystander language.",
      },
      {
        title: "what to de-risk first",
        body:
          "enzyme activity after conjugation, target localization, and whether the substrate stays quiet until it reaches the right place.",
      }
    );
    alternatives.push(
      {
        title: "if enzyme activity drops after conjugation",
        body:
          "shift the attachment site or spacer first. if that still fails, the modality may need a more indirect prodrug logic.",
      },
      {
        title: "if local activation never outruns background",
        body:
          "the system may need stronger localization or a substrate that stays quieter off-target.",
      }
    );
    decisionSignals.push(
      {
        title: "go signal",
        body:
          "the catalyst still works after conjugation and the substrate or prodrug only becomes meaningful at the target site.",
      },
      {
        title: "no-go signal",
        body:
          "you need the whole system to be perfect at once just to get measurable activity.",
      }
    );
    comparablePrograms.push(
      { name: "enzyme-prodrug logic", reason: "best when local catalysis is the main selectivity engine." },
      { name: "site-specific enzyme conjugation", reason: "useful when catalytic competence matters as much as targeting." }
    );
  }

  if (state.bystander === "yes" && state.modality === "Oligo") {
    risks.push(
      "bystander killing and oligo logic usually do not belong in the same design story. if bystander is essential, adc or some pdc/smdc variants are usually a better fit."
    );
  }

  if (state.targetExpression === "low / sparse") {
    risks.push(
      "low or sparse target expression raises the bar for every modality. you may need stronger affinity, better residence, or a different target window."
    );
  }

  if (state.internalization === "slow") {
    risks.push(
      "slow internalization makes intracellular release strategies harder. that especially hurts adcs, many pdcs, and most oligo conjugates."
    );
  }

  if (
    state.linkerType === "non-cleavable" &&
    (state.bystander === "yes" || state.releaseGoal === "release free payload")
  ) {
    risks.push(
      "your linker intent is fighting your payload goal. a non-cleavable design usually does not pair naturally with a strong free-payload or bystander story."
    );
  }

  if (state.payloadClass === "radionuclide" && state.modality && state.modality !== "RDC") {
    risks.push(
      "if the payload is a radionuclide, think in rdc terms. the chelator and isotope fit become core design elements, not side details."
    );
  }

  if (!risks.length) {
    if (state.target && !state.goal) {
      risks.push(
        "we know the target, but the therapeutic intent is still too open. without deciding whether you want cell kill, radiotherapy, or gene modulation, multiple conjugate classes can look falsely interchangeable."
      );
    } else if (!state.target && state.goal) {
      risks.push(
        "the biology goal is clearer than the target window. until the target is defined, the chemistry ranking will stay broader than it should."
      );
    } else {
      risks.push(
        "the biggest generic risk right now is trying to rank chemistry before the biology window and payload intent are both clear."
      );
    }
  }

  if (!state.target && !state.goal) {
    plan.push(
      "pick one target and one therapeutic intent first, then we can rank the conjugate classes without guessing."
    );
  } else if (state.target && !state.goal) {
    plan.push(
      "decide what you want the target to do for you first: cytotoxic delivery, gene modulation, radiotherapy, or local catalytic logic."
    );
  } else if (!state.target && state.goal) {
    plan.push(
      "lock the target window first: which biology actually gives you a usable disease-selective path for the effect you want."
    );
  } else if (!state.targetExpression || !state.internalization) {
    plan.push(
      "run the first target-biology screen next: expression separation, internalization speed, and whether the target stays reachable where the payload needs to act."
    );
  } else {
    plan.push(
      "build the first modality screen next: take the top-ranked classes into a quick binding, trafficking, and released-species comparison instead of debating them abstractly."
    );
  }
  plan.push(
    "lock the payload intent before the linker: free-drug release, intact delivery, gene modulation, or radiopharmaceutical logic all want different architectures."
  );
  plan.push(
    "pick the attachment / linker strategy that preserves the thing doing the real biology, whether that is receptor binding, rna activity, chelation, or catalytic function."
  );
  plan.push(
    "define the first assay package early: binding, internalization or routing, plasma stability, and released-species readout should all show up in the first design cycle."
  );
  plan.push(
    "only after that should we optimize the chemistry for potency, exposure, and manufacturability."
  );

  if (!evidence.length) {
    addEvidence("small-molecule drug conjugates review", "good cross-modality anchor when the concept still feels underdefined.", "review");
    addEvidence("oligo conjugate review", "helps contrast delivery-driven and biology-driven design choices.", "review");
    addEvidence("pluvicto first approval review", "useful if the concept may actually be a radioligand story in disguise.", "approval review");
  }

  rankedOptions.push(...buildGlobalRanking(state));

  return {
    signalCount,
    summary,
    recommendation,
    strategyCards,
    rankedOptions,
    alternatives,
    decisionSignals,
    comparablePrograms,
    risks,
    plan,
    evidence,
  };
}

function buildAssistantResponse(input: string, state: PlannerState): ChatMessage {
  const planner = buildPlanner(state);
  const normalized = input.toLowerCase();
  const ranked = planner.rankedOptions
    .slice()
    .sort((a, b) => a.rank - b.rank);
  const targetLabel = state.target || "this target";
  const goalLabel = state.goal || "the current goal";
  const topOption = ranked[0];
  const rankingText = buildReadableRankingText(ranked);
  const readableRankingText = buildReadableRankingText(ranked);
  const { primaryRisk, distinctMove } = getDistinctRiskAndFirstMove(planner);
  const topDesignSuggestions = buildOptionDesignPriorities(topOption, state);
  const comparisonText = buildComparisonText(ranked);

  if (
    (normalized.includes("antibody format") ||
      normalized.includes("targeting format") ||
      normalized.includes("what format") ||
      normalized.includes("which format") ||
      normalized.includes("what linker") ||
      normalized.includes("which linker") ||
      normalized.includes("what payload") ||
      normalized.includes("which payload")) &&
    (normalized.includes("start with") || normalized.includes("would you use") || normalized.includes("would you start"))
  ) {
    return {
      role: "assistant",
      text: `best build direction\n${topOption?.name ?? "top-ranked class"}\n\nwhy this class is leading\n${topOption?.fitReason ?? planner.recommendation}\n\nwhat i’d choose first\nformat: ${topDesignSuggestions[0]?.title ?? "need more target context"}\nwhy: ${topDesignSuggestions[0]?.body ?? "the targeting format depends on the real target biology."}\n\nlinker: ${topDesignSuggestions[1]?.title ?? "need more linker context"}\nwhy: ${topDesignSuggestions[1]?.body ?? "the linker depends on the release logic."}\n\npayload: ${topDesignSuggestions[2]?.title ?? "need more payload context"}\nwhy: ${topDesignSuggestions[2]?.body ?? "the payload has to match the therapeutic intent."}\n\nmain watchout\n${primaryRisk}\n\nfirst move\n${distinctMove}`,
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  if (
    normalized.includes("what should i build") ||
    normalized.includes("what would you build") ||
    normalized.includes("what do you recommend")
  ) {
    return {
      role: "assistant",
      text: buildConsistentFallbackText({
        directAnswer: `${topOption?.name ?? "the strongest-ranked class"} is the best current fit.`,
        bestCurrentFit: topOption?.name ?? "the strongest-ranked class",
        whyLeading: topOption?.fitReason ?? planner.recommendation,
        rankingText: ranked.length
          ? `feasible and worth ranking\n${ranked
              .slice(1)
              .map((item, index) => `${index + 2}. ${item.name}\nmain reason against: ${completeSentence(item.limitReason)}`)
              .join("\n\n")}`
          : "",
        primaryRisk,
        firstMove: distinctMove,
      }),
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  if (normalized.includes("risk")) {
    return {
      role: "assistant",
      text: `biggest things i’d de-risk first:\n${planner.risks
        .map((item, index) => `${index + 1}. ${item}`)
        .join("\n")}\n\n${rankingText}`,
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  if (normalized.includes("why")) {
    return {
      role: "assistant",
      text: `why the ranking looks like this\nit’s being driven mostly by ${goalLabel} plus the biology implied by ${targetLabel}.\n\ncurrent read\n${comparisonText}\n\nmain watchout\n${primaryRisk}\n\nfirst move\n${distinctMove}`,
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  if (
    normalized.includes("plan") ||
    normalized.includes("steps") ||
    normalized.includes("how do i start")
  ) {
    return {
      role: "assistant",
      text: `build plan\n${planner.plan
        .map((step, index) => `${index + 1}. ${step}`)
        .join("\n")}\n\nstrategy order\n${readableRankingText}`,
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  if (
    normalized.includes("pros") ||
    normalized.includes("cons") ||
    normalized.includes("tradeoff")
  ) {
    const best = ranked[0];
    return {
      role: "assistant",
      text: `top option\n${best.name}\n\npros\n${best.pros
        .map((item) => `- ${item}`)
        .join("\n")}\n\ncons\n${best.cons.map((item) => `- ${item}`).join("\n")}`,
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  if (
    normalized.includes("best") ||
    normalized.includes("strategy") ||
    normalized.includes("modality") ||
    normalized.includes("rank")
  ) {
    return {
      role: "assistant",
      text: buildConsistentFallbackText({
        directAnswer: planner.recommendation,
        bestCurrentFit: topOption?.name ?? "top-ranked class",
        whyLeading: topOption?.fitReason ?? planner.recommendation,
        rankingText: readableRankingText,
        primaryRisk,
        firstMove: distinctMove,
      }),
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  if (normalized.includes("bystander") && state.modality === "Oligo") {
    return {
      role: "assistant",
      text:
        "that combo is the first thing i’d push back on. bystander effect usually belongs to membrane-permeable cytotoxic payloads, not oligo conjugates built for intracellular gene modulation.",
      sources: planner.evidence.slice(0, 3),
      options: ["switch to adc", "keep oligo, drop bystander", "show a step-by-step plan"],
    };
  }

  return {
    role: "assistant",
    text: buildConsistentFallbackText({
      directAnswer: `${topOption?.name ?? ranked[0]?.name ?? "adc"} is the best current fit for ${targetLabel}.`,
      bestCurrentFit: topOption?.name ?? ranked[0]?.name ?? "adc",
      whyLeading: topOption?.fitReason ?? planner.recommendation,
      rankingText: readableRankingText,
      primaryRisk,
      firstMove: distinctMove,
    }),
    sources: planner.evidence.slice(0, 3),
    options: quickReplies,
  };
}

function buildOptionReply(choice: string, state: PlannerState): ChatMessage {
  const planner = buildPlanner(state);
  const { distinctMove } = getDistinctRiskAndFirstMove(planner);

  if (choice === "show best-fit strategy" || choice === "switch to adc" || choice === "keep oligo, drop bystander") {
    return {
      role: "assistant",
      text: `${planner.recommendation} ${planner.summary}`,
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  if (choice === "show biggest risks") {
    return {
      role: "assistant",
      text: planner.risks.map((item, index) => `${index + 1}. ${item}`).join("\n"),
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  return {
    role: "assistant",
    text: [`1. ${distinctMove}`, ...planner.plan.slice(1).map((item, index) => `${index + 2}. ${item}`)].join("\n"),
    sources: planner.evidence.slice(0, 3),
    options: quickReplies,
  };
}

function inferStateFromText(text: string): Partial<PlannerState> {
  const normalized = text.toLowerCase();
  const inferred: Partial<PlannerState> = {};
  const isDuchenneCase =
    normalized.includes("duchenne muscular dystrophy") ||
    normalized.includes("duchenne") ||
    normalized.includes(" dmd") ||
    normalized.startsWith("dmd");
  const isDm1Case =
    normalized.includes("myotonic dystrophy type 1") ||
    normalized.includes("myotonic dystrophy") ||
    normalized.includes(" dm1") ||
    normalized.startsWith("dm1") ||
    normalized.includes("cug repeat") ||
    normalized.includes("spliceopathy") ||
    normalized.includes("rna toxicity");

  const explicitTarget = text.match(/target\s*:\s*([^\n]+)/i);
  if (explicitTarget?.[1]) {
    inferred.target = explicitTarget[1].trim();
  } else {
    const targetPhrase = text.match(/([a-z0-9\-+/ ]+?)\s+for\s+([a-z0-9\-+/ ]+)/i);
    if (targetPhrase?.[1] && targetPhrase?.[2]) {
      const left = targetPhrase[1].trim().toLowerCase();
      if (!/^(conjugate|conjugates|best conjugate|what conjugate|which conjugate)$/.test(left)) {
        inferred.target = `${targetPhrase[1].trim()} for ${targetPhrase[2].trim()}`;
      }
    }
  }

  if (normalized.includes("adc")) inferred.modality = "ADC";
  if (normalized.includes("pdc")) inferred.modality = "PDC";
  if (normalized.includes("smdc")) inferred.modality = "SMDC";
  if (normalized.includes("rdc") || normalized.includes("radioligand")) inferred.modality = "RDC";
  if (normalized.includes("oligo") || normalized.includes("sirna") || normalized.includes("aso") || normalized.includes("pmo")) inferred.modality = "Oligo";
  if (normalized.includes("enzyme") || normalized.includes("prodrug")) inferred.modality = "Enzyme";

  if (normalized.includes("gene modulation") || normalized.includes("splice") || normalized.includes("knockdown")) inferred.goal = "gene modulation";
  if (normalized.includes("radiotherapy") || normalized.includes("theranostic")) inferred.goal = "radiotherapy / theranostics";
  if (normalized.includes("penetration")) inferred.goal = "better tissue penetration";
  if (normalized.includes("safer") || normalized.includes("safety")) inferred.goal = "safer exposure window";
  if (normalized.includes("cytotoxic") || normalized.includes("tumor killing") || normalized.includes("cell killing")) inferred.goal = "max tumor cell killing";
  if (isDuchenneCase) inferred.goal = "gene modulation";
  if (isDm1Case) inferred.goal = "gene modulation";

  if (normalized.includes("egfr") || normalized.includes("her2") || normalized.includes("trop2") || normalized.includes("frα") || normalized.includes("fralpha")) {
    inferred.targetClass = "cell-surface receptor";
  }
  if (normalized.includes("psma") || normalized.includes("caix") || normalized.includes("fap")) {
    inferred.targetClass = "tumor antigen";
  }
  if (normalized.includes("transporter") || normalized.includes("lat1") || normalized.includes("glut")) {
    inferred.targetClass = "transporter / metabolic handle";
  }

  if (normalized.includes("high expression")) inferred.targetExpression = "high + homogeneous";
  if (normalized.includes("heterogeneous")) inferred.targetExpression = "high + heterogeneous";
  if (normalized.includes("low expression")) inferred.targetExpression = "low / sparse";
  if (normalized.includes("fast internalization")) inferred.internalization = "fast";
  if (normalized.includes("slow internalization")) inferred.internalization = "slow";

  if (
    normalized.includes("microtubule") ||
    normalized.includes("mmae") ||
    normalized.includes("mertansine") ||
    normalized.includes("maytansinoid")
  ) inferred.payloadClass = "microtubule inhibitor";
  if (normalized.includes("topo") || normalized.includes("sn-38") || normalized.includes("exatecan")) inferred.payloadClass = "topo I inhibitor";
  if (normalized.includes("dna-damaging") || normalized.includes("pbd") || normalized.includes("duocarmycin")) inferred.payloadClass = "DNA-damaging payload";
  if (normalized.includes("radionuclide") || normalized.includes("lu-177") || normalized.includes("ac-225")) inferred.payloadClass = "radionuclide";
  if (normalized.includes("oligo")) inferred.payloadClass = "oligo";
  if (isDuchenneCase) inferred.payloadClass = "oligo";
  if (isDm1Case) inferred.payloadClass = "oligo";

  if (isDuchenneCase) inferred.modality = "Oligo";
  if (isDm1Case) inferred.modality = "Oligo";

  if (normalized.includes("val-cit") || normalized.includes("protease-cleavable")) inferred.linkerType = "cleavable (protease)";
  if (normalized.includes("disulfide") || normalized.includes("reducible")) inferred.linkerType = "cleavable (reducible)";
  if (normalized.includes("non-cleavable")) inferred.linkerType = "non-cleavable";
  if (normalized.includes("chelator")) inferred.linkerType = "chelator / spacer system";

  if (normalized.includes("free payload")) inferred.releaseGoal = "release free payload";
  if (normalized.includes("stay intact")) inferred.releaseGoal = "stay intact until degradation";
  if (normalized.includes("radiometal")) inferred.releaseGoal = "carry a radiometal / chelator system";

  if (normalized.includes("no bystander")) inferred.bystander = "no";
  else if (normalized.includes("bystander")) inferred.bystander = "yes";

  return inferred;
}

function shouldPersistInferredState(text: string, inferred: Partial<PlannerState>) {
  const normalized = text.toLowerCase();
  const isComparativeQuestion =
    normalized.includes("why not") ||
    normalized.includes("vs ") ||
    normalized.includes(" versus ") ||
    normalized.includes("compare ") ||
    normalized.includes("pros and cons") ||
    normalized.includes("rank ");

  if (!isComparativeQuestion) return inferred;

  return {
    ...inferred,
    modality:
      /(?:modality|build|use|choose|go with|pick)\s*:\s*/i.test(text) ||
      /(?:build|use|choose|pick|go with)\s+(adc|pdc|smdc|oligo|enzyme|rdc)/i.test(normalized)
        ? inferred.modality
        : "",
    payloadClass: "",
    linkerType: "",
    releaseGoal: "",
    bystander: inferred.bystander,
  };
}

function validateAssistantResponse(message: ChatMessage, state: PlannerState) {
  const planner = buildPlanner(state);
  const topOption = planner.rankedOptions[0];
  const { primaryRisk, distinctMove } = getDistinctRiskAndFirstMove(planner);
  const rankingText = buildReadableRankingText(planner.rankedOptions);
  const signalCount = planner.signalCount;

  if (!topOption) return message;

  const normalized = message.text.toLowerCase();
  const mentionedClasses = extractMentionedConjugateClasses(message.text);
  const allowedClasses = new Set(planner.rankedOptions.map((item) => item.name));
  const mentionsBestFit =
    normalized.includes("best current fit") ||
    normalized.includes("i’d start with") ||
    normalized.includes("best current") ||
    normalized.includes("ranking right now");

  const hasRankingMismatch = mentionsBestFit && !normalized.includes(topOption.name.toLowerCase());
  const hasUnknownClassMention = mentionedClasses.some((label) => !allowedClasses.has(label));
  const hasRiskMoveOverlap = getTextOverlapScore(primaryRisk, distinctMove) >= 0.35;
  const needsLowConfidenceTone = signalCount < 2;

  if (!hasRankingMismatch && !hasUnknownClassMention && !hasRiskMoveOverlap && !needsLowConfidenceTone) return message;

  const corrected = buildConsistentFallbackText({
    directAnswer: `${topOption.name} is the best current fit.`,
    bestCurrentFit: topOption.name,
    whyLeading: topOption.fitReason ?? topOption.summary,
    rankingText,
    primaryRisk,
    firstMove: distinctMove,
  });

  return {
    ...message,
    text: needsLowConfidenceTone ? softenConfidence(corrected) : corrected,
  };
}

function mergePlannerState(base: PlannerState, override: Partial<PlannerState>): PlannerState {
  return {
    ...base,
    ...Object.fromEntries(
      Object.entries(override).filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    ),
  } as PlannerState;
}

function buildQuickPrompts(state: PlannerState) {
  const targetLabel = state.target || "this target";
  const modalityLabel = state.modality || "this modality";
  return [
    `rank the best strategy for ${targetLabel}`,
    `what would you de-risk first for ${modalityLabel}`,
    `show pros and cons for the top option`,
    `give me the first assay plan`,
  ];
}

function buildResearchMessage(result: ResearchResponse): ChatMessage {
  return {
    role: "assistant",
    text: result.text,
    sources: result.sources,
    options: quickReplies,
    researchResult: result,
  };
}

async function fetchDesignResearch(
  prompt: string,
  state: PlannerState,
  previousResult?: ResearchResponse | null,
  responseMode: PlannerDepthMode = "normal",
) {
  const response = await fetch("/api/design-research", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      state,
      previousResult: previousResult ?? undefined,
      responseMode,
    }),
  });

  if (!response.ok) {
    throw new Error("design research failed");
  }

  return (await response.json()) as ResearchResponse;
}

function resetPlannerForm(
  setters: {
    setIdea: (value: string) => void;
    setMustHave: (value: string) => void;
    setAvoid: (value: string) => void;
    setTarget: (value: string) => void;
    setConstraints: (value: string) => void;
    setModality: (value: string) => void;
    setGoal: (value: string) => void;
    setTargetClass: (value: string) => void;
    setTargetExpression: (value: string) => void;
    setInternalization: (value: string) => void;
    setPayloadClass: (value: string) => void;
    setLinkerType: (value: string) => void;
    setReleaseGoal: (value: string) => void;
    setBystander: (value: string) => void;
  }
) {
  setters.setIdea("");
  setters.setMustHave("");
  setters.setAvoid("");
  setters.setTarget("");
  setters.setConstraints("");
  setters.setModality("");
  setters.setGoal("");
  setters.setTargetClass("");
  setters.setTargetExpression("");
  setters.setInternalization("");
  setters.setPayloadClass("");
  setters.setLinkerType("");
  setters.setReleaseGoal("");
  setters.setBystander("");
}

export default function DesignPage() {
  const storedForm = getStoredForm();

  const [idea, setIdea] = useState(storedForm.idea);
  const [mustHave, setMustHave] = useState(storedForm.mustHave);
  const [avoid, setAvoid] = useState(storedForm.avoid);
  const [target, setTarget] = useState(storedForm.target);
  const [constraints, setConstraints] = useState(storedForm.constraints);
  const [modality, setModality] = useState(storedForm.modality);
  const [goal, setGoal] = useState(storedForm.goal);
  const [targetClass, setTargetClass] = useState(storedForm.targetClass);
  const [targetExpression, setTargetExpression] = useState(storedForm.targetExpression);
  const [internalization, setInternalization] = useState(storedForm.internalization);
  const [payloadClass, setPayloadClass] = useState(storedForm.payloadClass);
  const [linkerType, setLinkerType] = useState(storedForm.linkerType);
  const [releaseGoal, setReleaseGoal] = useState(storedForm.releaseGoal);
  const [bystander, setBystander] = useState(storedForm.bystander);

  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatMessage[]>(() => getStoredChatLog());
  const [chatDerivedState, setChatDerivedState] = useState<Partial<PlannerState>>({});
  const [plannerDepthMode, setPlannerDepthMode] = useState<PlannerDepthMode>("normal");
  const [hasOutputInteraction, setHasOutputInteraction] = useState(false);
  const [isStreamingReply, setIsStreamingReply] = useState(false);
  const [chatPinnedToBottom, setChatPinnedToBottom] = useState(true);
  const [researchResult, setResearchResult] = useState<ResearchResponse | null>(null);
  const [thinkingStages, setThinkingStages] = useState<string[]>([]);
  const [activeThinkingStage, setActiveThinkingStage] = useState(0);
  const streamTokenRef = useRef(0);
  const thinkingTimerRef = useRef<number | null>(null);
  const autoRunKeyRef = useRef<string | null>(null);
  const chatViewportRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const allowComposerLineBreakRef = useRef(false);
  const chatInputDraftRef = useRef("");
  const streamEnabled =
    typeof window === "undefined"
      ? true
      : new URLSearchParams(window.location.search).get("stream") !== "0";

  const plannerState: PlannerState = useMemo(
    () => ({
      idea,
      mustHave,
      avoid,
      target,
      constraints,
      modality,
      goal,
      targetClass,
      targetExpression,
      internalization,
      payloadClass,
      linkerType,
      releaseGoal,
      bystander,
    }),
    [
      idea,
      mustHave,
      avoid,
      target,
      constraints,
      modality,
      goal,
      targetClass,
      targetExpression,
      internalization,
      payloadClass,
      linkerType,
      releaseGoal,
      bystander,
    ]
  );

  const effectivePlannerState = useMemo(
    () => mergePlannerState(plannerState, chatDerivedState),
    [plannerState, chatDerivedState]
  );

  const planner = buildPlanner(effectivePlannerState);
  const context = buildContext(effectivePlannerState);
  const quickPrompts = buildQuickPrompts(effectivePlannerState);
  const isAbstaining = Boolean(researchResult?.confidence?.abstain);
  const activeRankedOptions =
    hasOutputInteraction && researchResult
      ? isAbstaining
        ? []
        : dedupeRankedOptions(researchResult.ranking ?? [])
      : hasOutputInteraction
        ? dedupeRankedOptions(planner.rankedOptions)
        : [];
  const activeTopOption = activeRankedOptions[0];
  const biologySections =
    researchResult?.biology?.length
      ? researchResult.biology
      : buildFallbackBiologySections(effectivePlannerState, activeTopOption);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chatLog));
  }, [chatLog]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FORM_KEY, JSON.stringify(plannerState));
  }, [plannerState]);

  useEffect(() => {
    const viewport = chatViewportRef.current;
    if (!viewport) return;
    if (!chatPinnedToBottom) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [chatLog, isStreamingReply, chatPinnedToBottom]);

  useEffect(() => {
    return () => {
      if (thinkingTimerRef.current) {
        window.clearInterval(thinkingTimerRef.current);
      }
    };
  }, []);

  function beginThinkingStages(mode: PlannerDepthMode) {
    const stages =
      mode === "max-depth"
        ? [
            "parsing the brief",
            "mapping biology and mechanism",
            "checking delivery and construct fit",
            "building ranking and tensions",
            "assembling visuals, tables, and evidence",
          ]
        : mode === "deep"
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

    if (thinkingTimerRef.current) window.clearInterval(thinkingTimerRef.current);
    setThinkingStages(stages);
    setActiveThinkingStage(0);
    thinkingTimerRef.current = window.setInterval(() => {
      setActiveThinkingStage((current) => {
        if (current >= stages.length - 1) return current;
        return current + 1;
      });
    }, mode === "max-depth" ? 1200 : mode === "deep" ? 900 : 700);
  }

  function endThinkingStages() {
    if (thinkingTimerRef.current) {
      window.clearInterval(thinkingTimerRef.current);
      thinkingTimerRef.current = null;
    }
    setThinkingStages([]);
    setActiveThinkingStage(0);
  }

  async function streamAssistantMessage(message: ChatMessage) {
    const token = ++streamTokenRef.current;
    setIsStreamingReply(true);
    setChatLog((prev) => [...prev, { role: "assistant", text: "", isStreaming: true }]);

    const streamStep = async (index: number): Promise<void> => {
      if (index > message.text.length) return;
      await new Promise((resolve) => window.setTimeout(resolve, 2));
      if (streamTokenRef.current !== token) return;
      const partialText = message.text.slice(0, index);
      setChatLog((prev) => {
        const next = [...prev];
        const lastIndex = next.length - 1;
        if (lastIndex < 0 || next[lastIndex]?.role !== "assistant") return prev;
        next[lastIndex] = {
          ...next[lastIndex],
          text: partialText,
          isStreaming: index < message.text.length,
          sources: index === message.text.length ? message.sources : undefined,
          options: index === message.text.length ? message.options : undefined,
          researchResult: index === message.text.length ? message.researchResult : undefined,
        };
        return next;
      });
      await streamStep(index + 3);
    };

    await streamStep(3);

    setIsStreamingReply(false);
  }

  async function deliverAssistantMessage(message: ChatMessage) {
    if (!streamEnabled) {
      setIsStreamingReply(false);
      setChatLog((prev) => [...prev, { ...message, isStreaming: false }]);
      return;
    }

    await streamAssistantMessage(message);
  }

  async function submitPlannerMessage(
    message: string,
    mergedState: PlannerState,
    previousResultOverride?: ResearchResponse | null,
  ) {
    const userMsg: ChatMessage = { role: "user", text: message };
    setChatPinnedToBottom(true);
    setHasOutputInteraction(true);
    setChatLog((prev) => [...prev, userMsg]);
    beginThinkingStages(plannerDepthMode);
    try {
      const result = await fetchDesignResearch(
        message,
        mergedState,
        previousResultOverride ?? researchResult,
        plannerDepthMode,
      );
      if (result.responseFlow?.stages?.length) {
        setThinkingStages(result.responseFlow.stages);
      }
      setResearchResult(result);
      await deliverAssistantMessage(buildResearchMessage(result));
      endThinkingStages();
      return result;
    } catch {
      endThinkingStages();
      const fallback = validateAssistantResponse(buildAssistantResponse(message, mergedState), mergedState);
      setResearchResult(null);
      await deliverAssistantMessage(fallback);
      return null;
    }
  }

  async function sendPlannerDraft(rawMessage: string) {
    if (isStreamingReply) return;
    const message = rawMessage.trim() || context;
    if (!message) return;

    const inferredState = shouldPersistInferredState(message, inferStateFromText(message));
    const mergedState = mergePlannerState(plannerState, {
      ...chatDerivedState,
      ...inferredState,
    });
    setChatDerivedState((prev) => ({
      ...prev,
      ...inferredState,
    }));
    await submitPlannerMessage(message, mergedState);
    chatInputDraftRef.current = "";
    setChatInput("");
  }

  async function handleSend() {
    await sendPlannerDraft(chatInputDraftRef.current || chatInput);
  }

  async function handleOption(choice: string) {
    if (isStreamingReply) return;
    const userMsg: ChatMessage = { role: "user", text: choice };
    setChatPinnedToBottom(true);
    setHasOutputInteraction(true);
    setChatLog((prev) => [...prev, userMsg]);
    try {
      beginThinkingStages(plannerDepthMode);
      const result = await fetchDesignResearch(choice, effectivePlannerState, researchResult, plannerDepthMode);
      if (result.responseFlow?.stages?.length) {
        setThinkingStages(result.responseFlow.stages);
      }
      setResearchResult(result);
      await deliverAssistantMessage(buildResearchMessage(result));
      endThinkingStages();
    } catch {
      endThinkingStages();
      const assistantMsg = buildOptionReply(choice, effectivePlannerState);
      setResearchResult(null);
      await deliverAssistantMessage(assistantMsg);
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const deepLinkPrompts = params
      .getAll("prompt")
      .map((item) => item.trim())
      .filter(Boolean);
    const autoRun = params.get("autorun");
    if (!deepLinkPrompts.length || autoRun !== "1") return;
    if (isStreamingReply) return;

    const runKey = `${deepLinkPrompts.join("||")}::${params.toString()}`;
    if (autoRunKeyRef.current === runKey) return;
    autoRunKeyRef.current = runKey;

    void (async () => {
      let derivedState = { ...chatDerivedState };
      let previousResult: ResearchResponse | null = researchResult;
      for (const prompt of deepLinkPrompts) {
        const inferredState = shouldPersistInferredState(prompt, inferStateFromText(prompt));
        derivedState = {
          ...derivedState,
          ...inferredState,
        };
        const mergedState = mergePlannerState(plannerState, derivedState);
        startTransition(() => {
          setChatDerivedState(derivedState);
        });
        previousResult = await submitPlannerMessage(prompt, mergedState, previousResult);
      }
    })();
  }, [chatDerivedState, isStreamingReply, plannerState, researchResult]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <NavbarContent justify="end" className="gap-4">
          <NavbarItem>
            <Link href="/" className="text-sm text-zinc-600">
              home
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Link href="/vision" className="text-sm text-zinc-600">
              vision
            </Link>
          </NavbarItem>
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Button
                  variant="light"
                  radius="full"
                  className="h-auto min-w-0 gap-2 px-3 text-sm font-normal text-zinc-600"
                >
                  <span>design</span>
                  <span className="text-xs text-zinc-400">▾</span>
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="design navigation">
                <DropdownItem key="conjugates" href="/design">
                  conjugates
                </DropdownItem>
                <DropdownItem key="figure-studio" href="/figure-studio">
                  figure studio
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-[1440px] flex-col px-4 pb-8 pt-4 sm:px-6">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-2 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          <Card className="border border-white/80 bg-white/96 shadow-none">
            <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-sky-500">
                  design planner
                </p>
                <h1 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">
                  ask a messy question, get a usable answer
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip className="border border-slate-200 bg-white text-slate-700">
                  {isStreamingReply ? "thinking..." : "ready"}
                </Chip>
                <Chip className="border border-slate-200 bg-white text-slate-700">
                  mode {plannerDepthMode === "max-depth" ? "max depth" : plannerDepthMode}
                </Chip>
                <Chip className="border border-slate-200 bg-white text-slate-700">
                  {countPlannerSignals(effectivePlannerState)} signals
                </Chip>
              </div>
            </CardHeader>
            <CardBody className="flex min-h-[calc(100vh-10rem)] flex-col gap-3 p-3 sm:p-4">
              <div className="rounded-[1.5rem] border border-slate-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.92))] p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
                  <span>{chatLog.length ? "conversation" : "start here"}</span>
                  {context ? (
                    <div className="flex flex-wrap gap-2">
                      {context.split(" | ").slice(0, 3).map((item) => (
                        <Chip key={item} size="sm" className="border border-slate-200 bg-white text-slate-600">
                          {item}
                        </Chip>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div
                  ref={chatViewportRef}
                  className="flex h-[min(76vh,1040px)] min-h-[46rem] flex-col gap-4 overflow-y-auto pr-1"
                  onScroll={(event) => {
                    const viewport = event.currentTarget;
                    const distanceFromBottom =
                      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
                    setChatPinnedToBottom(distanceFromBottom < 96);
                  }}
                >
                      {!chatLog.length ? (
                        <div className="flex min-h-[32rem] flex-1 flex-col items-center justify-center px-4 text-center">
                          <div className="max-w-3xl space-y-4">
                            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                              what do you want to figure out?
                            </h2>
                            <p className="mx-auto max-w-2xl text-base leading-7 text-zinc-500">
                              ask for a starting construct, compare conjugate classes, pressure-test a mechanism, or turn a rough disease idea into strategy lanes.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 pt-2">
                              {quickPrompts.slice(0, 6).map((prompt) => (
                                <Button
                                  key={prompt}
                                  size="sm"
                                  radius="full"
                                  variant="bordered"
                                  className="border-slate-200 bg-white text-slate-700"
                                  onPress={() => setChatInput(prompt)}
                                >
                                  {prompt}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {isStreamingReply && thinkingStages.length ? (
                        <div className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
                          <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                            <span>planner</span>
                            <Spinner size="sm" className="scale-75" />
                          </div>
                          <div className="space-y-3">
                            <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-zinc-950">
                              {plannerDepthMode === "normal"
                                ? "thinking through the best fit"
                                : plannerDepthMode === "deep"
                                  ? "running a deeper analysis pass"
                                  : "running max-depth analysis"}
                            </p>
                            <div className="grid gap-2">
                              {thinkingStages.map((stage, stageIndex) => (
                                <div
                                  key={`${stage}-${stageIndex}`}
                                  className={`rounded-xl border px-3 py-2 text-sm ${
                                    stageIndex < activeThinkingStage
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                      : stageIndex === activeThinkingStage
                                        ? "border-sky-200 bg-sky-50 text-sky-700"
                                        : "border-slate-200 bg-slate-50 text-slate-500"
                                  }`}
                                >
                                  {stage}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {chatLog.map((msg, index) => (
                        <div
                          key={index}
                          className={`rounded-[1.6rem] px-4 py-4 text-sm leading-7 ${
                            msg.role === "user"
                              ? "self-end max-w-[78%] bg-sky-100 text-sky-900 shadow-[0_10px_25px_rgba(14,165,233,0.08)]"
                              : "w-full bg-transparent text-zinc-700"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-400">
                              <span>planner</span>
                              {msg.isStreaming ? <Spinner size="sm" className="scale-75" /> : null}
                            </div>
                          ) : (
                            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-500">
                              you
                            </div>
                          )}
                          {msg.role === "assistant" ? (
                            msg.researchResult ? (
                              (() => {
                                const result = msg.researchResult;
                                const isConstructReady = result.presentation?.mode === "recommended-starting-point";
                                const isConceptExplainer = result.presentation?.mode === "concept-explainer";
                                const strategyRows = buildRendererStrategyTable(result);
                                const rankingRows = buildRendererRankingPreview(result);
                                const detectedDisease = result.trace?.normalization?.disease?.canonical;
                                const detectedTarget = result.trace?.normalization?.target?.canonical;
                                const likelyBiology = compactBiologyRead(result);
                                const dominantConstraints =
                                  result.presentation?.mode === "best-current-strategy-direction"
                                    ? result.presentation.dominantConstraints
                                    : result.exploration?.dominantConstraints ?? [];
                                const likelyLanes =
                                  result.presentation?.mode === "best-current-strategy-direction"
                                    ? result.presentation.strategyLanes
                                    : result.exploration?.strategyBuckets.map((bucket) => bucket.label) ?? [];
                                const localViableSet = new Set((result.viabilityBuckets?.feasibleNames ?? []).map((item) => item.toLowerCase().trim()));
                                const whyNotRows = (result.trace?.whyNot ?? [])
                                  .filter((item) => !localViableSet.has(item.modality.toLowerCase().trim()))
                                  .slice(0, 6);
                                const modalityViabilityRows = (result.modalityViability ?? []).slice(0, 6);
                                const evidenceRows = (result.evidenceAnchors ?? []).slice(0, 6);
                                const biologySections = result.biology ?? [];
                                const depthModules = result.depthModules ?? [];
                                const safeLikelyLanes = likelyLanes ?? [];
                                const safeDominantConstraints = dominantConstraints ?? [];
                                const followUpKind = result.followUpAnswer?.kind ?? null;
                                const presentationVariant = result.presentationVariant ?? (isConstructReady ? "blueprint-first" : "table-first");
                                const documentSections = result.documentSections ?? [];
                                const isPureFollowUp = Boolean(followUpKind && followUpKind !== "contextual-refinement");
                                const showPrimaryTopCard = !isPureFollowUp;
                                const showVisualSnapshot =
                                  !isPureFollowUp
                                  ? Boolean((!isConceptExplainer && safeLikelyLanes.length) || (isConstructReady && (result.presentation?.recommendedFormat || detectedTarget)))
                                  : followUpKind === "media";
                                const showStrategyTable =
                                  strategyRows.length > 0 &&
                                  (
                                    !isPureFollowUp ||
                                    followUpKind === "table" ||
                                    followUpKind === "ranking" ||
                                    followUpKind === "contextual-refinement"
                                  );
                                const showViabilitySection =
                                  modalityViabilityRows.length > 0 &&
                                  (
                                    !isPureFollowUp ||
                                    followUpKind === "why-not" ||
                                    followUpKind === "ranking" ||
                                    followUpKind === "table" ||
                                    followUpKind === "contextual-refinement"
                                  );
                                const showRankingSection =
                                  rankingRows.length > 0 &&
                                  (
                                    !isPureFollowUp ||
                                    followUpKind === "ranking" ||
                                    followUpKind === "table" ||
                                    followUpKind === "media"
                                  );
                                const showConstructBlueprint =
                                  Boolean(result.constructBlueprint) &&
                                  (!isPureFollowUp || followUpKind === "contextual-refinement");
                                const showDepthModules =
                                  depthModules.length > 0 &&
                                  (
                                    !isPureFollowUp ||
                                    followUpKind === "contextual-refinement" ||
                                    followUpKind === "lane-detail" ||
                                    followUpKind === "first-test" ||
                                    followUpKind === "clarify"
                                  );
                                const showInnovationSection =
                                  Boolean(result.innovativeIdeas?.length) &&
                                  !isPureFollowUp;
                                const showWhyNotSection =
                                  whyNotRows.length > 0 &&
                                  (
                                    !isPureFollowUp ||
                                    followUpKind === "why-not" ||
                                    followUpKind === "contradiction"
                                  );
                                const showEvidenceSection =
                                  evidenceRows.length > 0 &&
                                  (
                                    !isPureFollowUp ||
                                    followUpKind === "evidence" ||
                                    followUpKind === "media"
                                  );
                                const showUncertaintySection =
                                  Boolean(result.uncertainties?.length) &&
                                  (
                                    !isPureFollowUp ||
                                    followUpKind === "first-test" ||
                                    followUpKind === "clarify"
                                  );
                                const showBiologyPanel =
                                  biologySections.length > 0 &&
                                  !isPureFollowUp;
                                const showApproachPanel =
                                  (!isPureFollowUp && strategyRows.length > 0) ||
                                  (!isPureFollowUp && safeLikelyLanes.length > 0);
                                const showDocumentSections =
                                  !isPureFollowUp &&
                                  documentSections.length > 0 &&
                                  presentationVariant === "document-brief" &&
                                  strategyRows.length <= 2 &&
                                  biologySections.length === 0;

                                return (
                                  <div className="grid gap-4">
                                    {result.followUpAnswer ? (
                                      <Card className={`${plannerPanel} border-amber-200 bg-amber-50/80 shadow-none`}>
                                        <CardBody className="gap-3 text-sm text-slate-800">
                                          <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">follow-up answer</p>
                                            <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-slate-950">
                                              {result.followUpAnswer.title}
                                            </p>
                                          </div>
                                          <p className={plannerBodyStrong}>{completeUiSentence(result.followUpAnswer.answer)}</p>
                                          {result.followUpAnswer.bullets?.length ? (
                                            <ul className="grid gap-2">
                                              {result.followUpAnswer.bullets.map((item) => (
                                                <li key={`${index}-${item}-followup`} className={`${plannerInset} px-3 py-2 text-sm leading-7 text-slate-700`}>
                                                  {item}
                                                </li>
                                              ))}
                                            </ul>
                                          ) : null}
                                        </CardBody>
                                      </Card>
                                    ) : null}

                                    {showPrimaryTopCard ? (
                                    <Card className={`${plannerSurface} shadow-none`}>
                                      <CardBody className="gap-4 text-sm text-slate-800">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                          <div className="space-y-2">
                                            <p className={plannerLabel}>
                                              {isConstructReady ? result.presentation?.title ?? "recommended starting point" : "direct answer"}
                                            </p>
                                            <h3 className="font-[family-name:var(--font-space-grotesk)] text-[1.85rem] font-semibold leading-tight text-slate-950">
                                              {isConstructReady
                                                ? result.presentation?.bestConjugateClass ?? result.topPick
                                                : isConceptExplainer
                                                  ? result.presentation?.title ?? result.topPick
                                                  : result.presentation?.status ?? "exploration mode — no final winner yet"}
                                            </h3>
                                            {result.viabilityBuckets?.leadStrength && isConstructReady ? (
                                              <div className="flex flex-wrap gap-2">
                                                {result.viabilityBuckets.noStrongClassYet ? (
                                                  <Chip className="border border-amber-200 bg-amber-50 text-amber-700">no strong class yet</Chip>
                                                ) : result.viabilityBuckets.leadStrength === "provisional" ? (
                                                  <Chip className="border border-amber-200 bg-amber-50 text-amber-700">provisional / weak lead</Chip>
                                                ) : null}
                                              </div>
                                            ) : null}
                                          </div>
                                        <div className="flex flex-wrap gap-2">
                                            {detectedDisease ? (
                                              <Chip className="border border-slate-200 bg-slate-50 text-slate-700">
                                                disease: {detectedDisease}
                                              </Chip>
                                            ) : null}
                                            {detectedTarget ? (
                                              <Chip className="border border-slate-200 bg-slate-50 text-slate-700">
                                                target: {detectedTarget}
                                              </Chip>
                                            ) : null}
                                            <Chip className={confidenceAccent(result.presentation?.confidence ?? result.confidence?.level)}>
                                              confidence {result.presentation?.confidence ?? result.confidence?.level}
                                            </Chip>
                                            {result.presentation?.mode === "best-current-strategy-direction" ? (
                                              <Chip className={confidenceAccent(result.presentation?.explorationConfidence ?? result.confidence?.explorationLevel)}>
                                                exploration {result.presentation?.explorationConfidence ?? result.confidence?.explorationLevel}
                                              </Chip>
                                            ) : null}
                                          </div>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                          {isConstructReady ? (
                                            <>
                                              {[
                                                ["target / entry handle", result.presentation?.targetOrEntryHandle ?? detectedTarget ?? "still conditional"],
                                                result.presentation?.decisionFocus === "chemistry"
                                                  ? ["chemistry", result.presentation?.recommendedChemistry ?? "still conditional"]
                                                  : ["format", result.presentation?.recommendedFormat ?? "still conditional"],
                                                ["linker", result.presentation?.recommendedLinker ?? "still conditional"],
                                                ["payload / active species", result.presentation?.recommendedPayload ?? "still conditional"],
                                              ].map(([label, value]) => (
                                                <div key={`${index}-${label}`} className={`${plannerPanelSoft} p-3`}>
                                                  <p className={plannerKicker}>{label}</p>
                                                  <p className="mt-1 font-[family-name:var(--font-instrument-serif)] text-[15px] font-semibold leading-6 text-slate-900">{value}</p>
                                                </div>
                                              ))}
                                            </>
                                          ) : isConceptExplainer ? (
                                            <>
                                              <div className={`${plannerPanelSoft} p-3 xl:col-span-2`}>
                                                <p className={plannerKicker}>what it is</p>
                                                <p className="mt-1 font-[family-name:var(--font-instrument-serif)] text-[15px] font-semibold leading-6 text-slate-900">
                                                  {completeUiSentence(result.presentation?.whatItIs ?? result.topPickWhy)}
                                                </p>
                                              </div>
                                              <div className={`${plannerPanelSoft} p-3 xl:col-span-2`}>
                                                <p className={plannerKicker}>where it fits best</p>
                                                <p className="mt-1 font-[family-name:var(--font-instrument-serif)] text-[15px] font-semibold leading-6 text-slate-900">
                                                  {completeUiSentence(result.presentation?.bestFit ?? result.presentation?.bestClarifier ?? "ask for a disease or target context next and we can pressure-test the class.")}
                                                </p>
                                              </div>
                                            </>
                                          ) : (
                                            <>
                                              <div className={`${plannerPanelSoft} p-3 xl:col-span-2`}>
                                                <p className={plannerKicker}>likely disease biology</p>
                                                <p className="mt-1 font-[family-name:var(--font-instrument-serif)] text-[15px] font-semibold leading-6 text-slate-900">{likelyBiology}</p>
                                              </div>
                                              <div className={`${plannerPanelSoft} p-3 xl:col-span-2`}>
                                                <p className={plannerKicker}>one best clarifier</p>
                                                <p className="mt-1 font-[family-name:var(--font-instrument-serif)] text-[15px] font-semibold leading-6 text-slate-900">
                                                  {completeUiSentence(result.presentation?.bestClarifier ?? result.exploration?.mostInformativeClarifier ?? "what single target or entry handle do you want to lean on?")}
                                                </p>
                                              </div>
                                            </>
                                          )}
                                        </div>

                                        <div className={`${plannerPanelSoft} p-3`}>
                                          <p className={plannerKicker}>{isConceptExplainer ? "why this class matters" : "why this is the current read"}</p>
                                          <p className={`mt-1 ${plannerBody}`}>
                                            {completeUiSentence(result.presentation?.rationale ?? result.topPickWhy)}
                                          </p>
                                          {result.presentation?.mainMissingEvidence ? (
                                            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                                              <span className="font-semibold">main missing evidence:</span> {completeUiSentence(result.presentation.mainMissingEvidence)}
                                            </div>
                                          ) : null}
                                          {evidenceRows.length ? (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                              {evidenceRows.slice(0, 3).map((item) => (
                                                <Chip
                                                  key={`${index}-${item.label}-top-chip`}
                                                  className="border border-slate-200 bg-white text-slate-700"
                                                >
                                                  {item.label}
                                                </Chip>
                                              ))}
                                            </div>
                                          ) : null}
                                        </div>

                                        {isConstructReady ? (
                                          <div className="grid gap-3 md:grid-cols-2">
                                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">biggest watchout</p>
                                              <p className={`mt-1 ${plannerBody}`}>{completeUiSentence(result.presentation?.biggestWatchout ?? "still pressure-testing safety, exposure, and window.")}</p>
                                            </div>
                                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">first validation step</p>
                                              <p className={`mt-1 ${plannerBody}`}>{completeUiSentence(result.presentation?.firstValidationStep ?? "run the first de-risking experiment against the core biology.")}</p>
                                            </div>
                                          </div>
                                        ) : isConceptExplainer ? (
                                          <div className="grid gap-3 md:grid-cols-2">
                                            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">main watchout</p>
                                              <p className={`mt-1 ${plannerBody}`}>{completeUiSentence(result.presentation?.mainWatchout ?? "the class only works when the biology, delivery route, and active-species logic all line up.")}</p>
                                            </div>
                                            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3">
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-300">best next question</p>
                                              <p className={`mt-1 ${plannerBody}`}>{completeUiSentence(result.presentation?.bestClarifier ?? "do you want biology fit, construct design, or real examples next?")}</p>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="grid gap-3 md:grid-cols-[1.2fr,0.8fr]">
                                            <div className={`${plannerPanelSoft} p-3`}>
                                              <p className={plannerKicker}>top strategy lanes</p>
                                              <div className="mt-2 flex flex-wrap gap-2">
                                                {safeLikelyLanes.slice(0, 4).map((lane) => (
                                                  <Chip key={`${index}-${lane}`} className="border border-sky-200 bg-sky-50 text-sky-700">
                                                    {lane}
                                                  </Chip>
                                                ))}
                                              </div>
                                            </div>
                                            <div className={`${plannerPanelSoft} p-3`}>
                                              <p className={plannerKicker}>dominant constraints</p>
                                              <div className="mt-2 flex flex-wrap gap-2">
                                                {safeDominantConstraints.slice(0, 6).map((item) => (
                                                  <Chip key={`${index}-${item}`} className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                                                    {item}
                                                  </Chip>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </CardBody>
                                    </Card>
                                    ) : null}

                                    {showViabilitySection ? (
                                      <Card className={`${plannerPanel} shadow-none`}>
                                        <CardBody className="gap-3">
                                          <div>
                                            <p className={plannerLabel}>modality viability table</p>
                                            <p className={plannerTitle}>which classes are live, conditional, or ruled out</p>
                                          </div>
                                          <div className={plannerTableShell}>
                                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                              <thead className={plannerTableHead}>
                                                <tr>
                                                  {["modality / class", "status", "reason", "missing evidence", "what would upgrade it"].map((label) => (
                                                    <th key={`${index}-${label}-viability`} className="px-3 py-2 font-semibold">
                                                      {label}
                                                    </th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody className={plannerTableBody}>
                                                {modalityViabilityRows.map((row) => (
                                                  <tr key={`${index}-${row.modality}-viability-row`} className="align-top">
                                                    <td className="px-3 py-3 font-semibold text-slate-900">{row.modality}</td>
                                                    <td className="px-3 py-3">
                                                      <Chip className={viabilityAccent(row.status)}>{row.status}</Chip>
                                                    </td>
                                                    <td className="px-3 py-3">{row.reason}</td>
                                                    <td className="px-3 py-3 text-amber-800">{row.missingEvidence}</td>
                                                    <td className="px-3 py-3 text-sky-800">{row.upgradeEvidence}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </CardBody>
                                      </Card>
                                    ) : null}

                                    {showBiologyPanel || showApproachPanel ? (
                                      <div className="grid gap-4 xl:grid-cols-[1.05fr,0.95fr]">
                                        {showBiologyPanel ? (
                                          <Card className={`${plannerPanel} shadow-none`}>
                                            <CardBody className="gap-3">
                                              <div>
                                                <p className={plannerLabel}>biology</p>
                                                <p className={plannerTitle}>what seems to matter biologically</p>
                                              </div>
                                              <div className="grid gap-3 md:grid-cols-2">
                                                {biologySections.slice(0, 4).map((section) => (
                                                  <div key={`${index}-${section.title}-visible-biology`} className={`${plannerPanelSoft} p-3`}>
                                                    <p className={plannerKicker}>{section.title}</p>
                                                    <p className={`mt-2 ${plannerMuted}`}>{section.body}</p>
                                                    {section.sources?.length ? (
                                                      <div className="mt-3 flex flex-wrap gap-2">
                                                        {section.sources.slice(0, 2).map((source) => (
                                                          <Chip
                                                            key={`${index}-${section.title}-${source.label}-source`}
                                                            className="border border-slate-200 bg-white text-slate-700"
                                                          >
                                                            {source.label}
                                                          </Chip>
                                                        ))}
                                                      </div>
                                                    ) : null}
                                                  </div>
                                                ))}
                                              </div>
                                            </CardBody>
                                          </Card>
                                        ) : null}

                                        {showApproachPanel ? (
                                          <Card className={`${plannerPanel} shadow-none`}>
                                            <CardBody className="gap-3">
                                              <div>
                                                <p className={plannerLabel}>ways to approach the problem</p>
                                                <p className={plannerTitle}>the most credible paths worth exploring next</p>
                                              </div>
                                              <div className="grid gap-3">
                                                {(strategyRows.length
                                                  ? strategyRows.slice(0, 4).map((row) => ({
                                                      title: row.strategy,
                                                      subtitle: row.bestFormat,
                                                      body: row.whyItFits,
                                                      risk: row.riskOrFailureMode,
                                                      evidenceLabel: row.evidenceLabel,
                                                      rank: row.rank,
                                                    }))
                                                  : safeLikelyLanes.slice(0, 4).map((lane, laneIndex) => ({
                                                      title: lane,
                                                      subtitle: "still conditional",
                                                      body: "this is a live lane worth pressure-testing next.",
                                                      risk: "the target, entry handle, or delivery logic is still unresolved.",
                                                      evidenceLabel: undefined,
                                                      rank: String(laneIndex + 1),
                                                    }))).map((lane) => (
                                                  <div
                                                    key={`${index}-${lane.rank}-${lane.title}-approach`}
                                                    className={`${plannerPanelSoft} p-3`}
                                                  >
                                                    <div className="flex items-start justify-between gap-3">
                                                      <div>
                                                        <p className="font-[family-name:var(--font-instrument-serif)] text-[1.05rem] font-semibold italic underline decoration-slate-400/70 underline-offset-4 text-slate-900">
                                                          {lane.title}
                                                        </p>
                                                        <p className="text-sm text-slate-500">{lane.subtitle}</p>
                                                      </div>
                                                      <Chip className={rankAccent(lane.rank).chip}>lane {lane.rank}</Chip>
                                                    </div>
                                                    <p className={`mt-3 ${plannerBody}`}>{completeUiSentence(lane.body)}</p>
                                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                                      {lane.evidenceLabel ? (
                                                        <Chip className="border border-slate-200 bg-white text-slate-700">
                                                          {lane.evidenceLabel}
                                                        </Chip>
                                                      ) : null}
                                                      <span className="text-xs text-slate-500">risk: {lane.risk}</span>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </CardBody>
                                          </Card>
                                        ) : null}
                                      </div>
                                    ) : null}

                                    {showDocumentSections ? (
                                      <Card className={`${plannerPanel} shadow-none`}>
                                        <CardBody className="gap-4 text-sm text-slate-800">
                                          <div>
                                            <p className={plannerLabel}>document view</p>
                                            <p className={plannerTitle}>formatted like a working memo, not a raw blob</p>
                                          </div>
                                          <div className="grid gap-4">
                                            {documentSections.map((section) => (
                                              <div key={`${index}-${section.title}-document`} className={`${plannerPanelSoft} p-4`}>
                                                <p className={plannerKicker}>{section.title}</p>
                                                <p className={`mt-2 ${plannerBody}`}>{completeUiSentence(section.body)}</p>
                                                {section.bullets?.length ? (
                                                  <ul className="mt-3 grid gap-2">
                                                    {section.bullets.map((bullet) => (
                                                      <li key={`${index}-${section.title}-${bullet}`} className={`pl-4 ${plannerMuted} relative`}>
                                                        <span className="absolute left-0 text-slate-400">•</span>
                                                        {bullet}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                ) : null}
                                              </div>
                                            ))}
                                          </div>
                                        </CardBody>
                                      </Card>
                                    ) : null}

                                    {showVisualSnapshot || showRankingSection ? (
                                    <div className="grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
                                      {showVisualSnapshot ? (
                                      <Card className={`${plannerPanel} shadow-none`}>
                                        <CardBody className="gap-4">
                                          <div>
                                            <p className={plannerLabel}>
                                              visual snapshot
                                            </p>
                                            <p className={plannerTitle}>
                                              {isConstructReady ? "construct map" : "strategy landscape"}
                                            </p>
                                          </div>

                                          {isConstructReady ? (
                                            <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-4">
                                              <div className="grid gap-4 md:grid-cols-4">
                                                {[
                                                  {
                                                    label: "target / handle",
                                                    value: result.presentation?.targetOrEntryHandle ?? detectedTarget ?? "conditional",
                                                    accent: "border-sky-200 bg-sky-50/70 text-sky-700",
                                                  },
                                                  {
                                                    label: "format",
                                                    value: result.presentation?.recommendedFormat ?? "conditional",
                                                    accent: "border-violet-200 bg-violet-50/70 text-violet-700",
                                                  },
                                                  {
                                                    label: "linker",
                                                    value: result.presentation?.recommendedLinker ?? "conditional",
                                                    accent: "border-fuchsia-200 bg-fuchsia-50/70 text-fuchsia-700",
                                                  },
                                                  {
                                                    label: "payload",
                                                    value: result.presentation?.recommendedPayload ?? "conditional",
                                                    accent: "border-emerald-200 bg-emerald-50/70 text-emerald-700",
                                                  },
                                                ].map((item, itemIndex) => (
                                                  <div key={`${index}-${item.label}-flow`} className="relative">
                                                    {itemIndex < 3 ? (
                                                      <div className="absolute -right-2 top-1/2 hidden h-[2px] w-4 -translate-y-1/2 rounded-full bg-slate-300 md:block" />
                                                    ) : null}
                                                    <div className={`rounded-2xl border p-3 ${item.accent}`}>
                                                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                                                        {item.label}
                                                      </p>
                                                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">
                                                        {item.value}
                                                      </p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="grid gap-3 md:grid-cols-2">
                                              {safeLikelyLanes.slice(0, 4).map((lane, laneIndex) => (
                                                <div
                                                  key={`${index}-${lane}-visual`}
                                                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                                                >
                                                  <div className="mb-3 flex items-center justify-between gap-3">
                                                    <Chip className={rankAccent(String(laneIndex + 1)).chip}>
                                                      lane {laneIndex + 1}
                                                    </Chip>
                                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                                      <div
                                                        className={`h-full rounded-full bg-gradient-to-r ${rankAccent(String(laneIndex + 1)).bar}`}
                                                        style={{ width: `${Math.max(38, 100 - laneIndex * 18)}%` }}
                                                      />
                                                    </div>
                                                  </div>
                                                  <p className="font-[family-name:var(--font-instrument-serif)] text-[15px] font-semibold leading-6 text-slate-900">
                                                    {lane}
                                                  </p>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </CardBody>
                                      </Card>
                                      ) : null}

                                      {showRankingSection ? (
                                      <Card className={`${plannerPanel} shadow-none`}>
                                        <CardBody className="gap-4">
                                          <div>
                                            <p className={plannerLabel}>
                                              visual ranking
                                            </p>
                                            <p className={plannerTitle}>
                                              modality plot
                                            </p>
                                          </div>
                                          <div className="grid gap-3">
                                            {rankingRows.slice(0, 5).map((row) => {
                                              const accent = rankAccent(row.rank);
                                              const width = scoreToPercent(row.score) || Math.max(22, 100 - Number(row.rank) * 14);
                                              return (
                                                <div key={`${index}-${row.rank}-${row.strategy}-plot`} className="grid gap-2">
                                                  <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                      <p className="truncate text-sm font-semibold text-zinc-950">
                                                        {row.strategy}
                                                      </p>
                                                      <p className="text-xs text-zinc-500">rank {row.rank}</p>
                                                    </div>
                                                    {row.score ? (
                                                      <Chip className={accent.chip}>{row.score}</Chip>
                                                    ) : null}
                                                  </div>
                                                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                                    <div
                                                      className={`h-full rounded-full bg-gradient-to-r ${accent.bar}`}
                                                      style={{ width: `${width}%` }}
                                                    />
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>

                                          {evidenceRows.length ? (
                                            <div className={`${plannerPanelSoft} p-3`}>
                                              <p className={plannerKicker}>
                                                evidence mix
                                              </p>
                                              <div className="mt-3">
                                                {renderEvidenceTypeBars(evidenceRows)}
                                              </div>
                                            </div>
                                          ) : null}
                                        </CardBody>
                                      </Card>
                                      ) : null}
                                    </div>
                                    ) : null}

                                    {showConstructBlueprint && result.constructBlueprint ? (
                                      <Card className={`${plannerPanel} shadow-none`}>
                                        <CardBody className="gap-3 text-sm text-slate-800">
                                          <div className="flex items-center justify-between gap-3">
                                            <div>
                                              <p className={plannerLabel}>construct blueprint</p>
                                              <p className={plannerTitle}>
                                                {result.constructBlueprint.conditional ? "best current build direction" : "construct blueprint"}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="grid gap-3 md:grid-cols-3">
                                            {[
                                              { label: "format", field: result.constructBlueprint.format },
                                              { label: "linker", field: result.constructBlueprint.linker },
                                              { label: "payload", field: result.constructBlueprint.payload },
                                            ].map(({ label, field }) => (
                                              <div key={`${index}-${label}-blueprint`} className={`${plannerPanelSoft} p-3`}>
                                                <p className={plannerKicker}>{label}</p>
                                                <p className="mt-1 font-semibold text-slate-900">{field?.title ?? "still conditional"}</p>
                                                {field?.body ? <p className={`mt-1 ${plannerMuted}`}>{field.body}</p> : null}
                                              </div>
                                            ))}
                                          </div>
                                        </CardBody>
                                      </Card>
                                    ) : null}

                                    {showDepthModules ? (
                                      <Card className={`${plannerPanel} shadow-none`}>
                                        <CardBody className="gap-4">
                                          <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                              <p className={plannerLabel}>
                                                {result.responseFlow?.effectiveMode === "max-depth" ? "max-depth build analysis" : "deep build analysis"}
                                              </p>
                                              <p className={plannerTitle}>
                                                deeper design options for this exact case
                                              </p>
                                            </div>
                                            <Chip className="border border-slate-200 bg-slate-50 text-slate-700">
                                              mode {result.responseFlow?.effectiveMode ?? "deep"}
                                            </Chip>
                                          </div>

                                          <div className="grid gap-4">
                                            {depthModules.map((module) => (
                                              <div key={`${index}-${module.key}-depth`} className={`${plannerPanelSoft} p-4`}>
                                                <div className="mb-3">
                                                  <p className={plannerKicker}>{module.title}</p>
                                                  <p className={`mt-1 ${plannerMuted}`}>{module.summary}</p>
                                                </div>
                                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                  {module.cards.map((card) => (
                                                    <div key={`${index}-${module.key}-${card.title}`} className={`${plannerInset} p-3`}>
                                                      <div className="flex items-start justify-between gap-3">
                                                        <p className="font-[family-name:var(--font-instrument-serif)] text-[1.02rem] font-semibold italic underline decoration-slate-400/70 underline-offset-4 text-slate-900">
                                                          {card.title}
                                                        </p>
                                                        {card.badge ? (
                                                          <Chip className="border border-slate-200 bg-slate-50 text-slate-700">
                                                            {card.badge}
                                                          </Chip>
                                                        ) : null}
                                                      </div>
                                                      <p className={`mt-2 ${plannerBody}`}>{completeUiSentence(card.body)}</p>
                                                      {card.bullets?.length ? (
                                                        <ul className="mt-3 grid gap-2">
                                                          {card.bullets.map((bullet) => (
                                                            <li key={`${index}-${module.key}-${card.title}-${bullet}`} className="text-sm leading-7 text-slate-700">
                                                              <span className="font-semibold text-slate-950">•</span> {bullet}
                                                            </li>
                                                          ))}
                                                        </ul>
                                                      ) : null}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </CardBody>
                                      </Card>
                                    ) : null}

                                    {result.followUpAnswer?.kind === "media" ? (
                                      <Card className={`${plannerPanel} border-indigo-200 bg-indigo-50/70 shadow-none`}>
                                        <CardBody className="gap-3">
                                          <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-700">visual companion</p>
                                              <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-slate-950">
                                                generated diagrams from the last answer
                                              </p>
                                            </div>
                                            <Chip className="border border-amber-200 bg-amber-50 text-amber-700">
                                              {result.followUpAnswer.externalImagesAvailable === false
                                                ? "external image retrieval not wired yet"
                                                : "visual mode"}
                                            </Chip>
                                          </div>
                                          <div className="grid gap-3 xl:grid-cols-3">
                                            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-3">
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-200">disease mechanism map</p>
                                              <div className="mt-3 grid gap-2">
                                                <div className={`${plannerInset} px-3 py-2 text-sm font-medium text-slate-900`}>
                                                  {detectedDisease ?? "disease context"}
                                                </div>
                                                <div className="text-center text-xs text-slate-500">↓</div>
                                                <div className={`${plannerInset} px-3 py-2 text-sm text-slate-700`}>
                                                  {likelyBiology}
                                                </div>
                                                <div className="text-center text-xs text-slate-500">↓</div>
                                                <div className={`${plannerInset} px-3 py-2 text-sm text-slate-700`}>
                                                  {(safeDominantConstraints ?? []).slice(0, 2).join(" • ") || "key constraints still being resolved"}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3">
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">strategy map</p>
                                              <div className="mt-3 grid gap-2">
                                                {safeLikelyLanes.slice(0, 4).map((lane, laneIndex) => (
                                                  <div key={`${index}-${lane}-media`} className={`flex items-center gap-2 ${plannerInset} px-3 py-2 text-sm text-slate-700`}>
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700">
                                                      {laneIndex + 1}
                                                    </span>
                                                    <span>{lane}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">construct logic sketch</p>
                                              <div className="mt-3 grid gap-2">
                                                {[
                                                  isConstructReady
                                                    ? result.presentation?.targetOrEntryHandle ?? detectedTarget ?? "target / entry handle still conditional"
                                                    : safeLikelyLanes[0] ?? "top lane still conditional",
                                                  isConstructReady
                                                    ? result.presentation?.recommendedLinker ?? "delivery logic still conditional"
                                                    : strategyRows[0]?.linkerOrDeliveryLogic ?? "delivery logic still conditional",
                                                  isConstructReady
                                                    ? result.presentation?.recommendedPayload ?? "active species still conditional"
                                                    : strategyRows[0]?.payloadOrActiveSpecies ?? "active species still conditional",
                                                  isConstructReady
                                                    ? result.presentation?.biggestWatchout ?? "main risk still conditional"
                                                    : strategyRows[0]?.riskOrFailureMode ?? "main risk still conditional",
                                                ].map((item, itemIndex) => (
                                                  <div key={`${index}-${itemIndex}-construct-media`} className={`${plannerInset} px-3 py-2 text-sm text-slate-700`}>
                                                    {item}
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </CardBody>
                                      </Card>
                                    ) : null}

                                    {showStrategyTable && strategyRows.length ? (
                                      <Card className={`${plannerPanel} shadow-none`}>
                                        <CardBody className="gap-3">
                                          <div>
                                            <p className={plannerLabel}>recommended construct / strategy table</p>
                                            <p className={plannerTitle}>what the planner would actually consider next</p>
                                          </div>
                                          <div className={plannerTableShell}>
                                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                              <thead className={plannerTableHead}>
                                                <tr>
                                                  {["rank", "strategy / class", "best format", "linker or delivery logic", "payload / active species", "why it fits", "risk / failure mode", "evidence"].map((label) => (
                                                    <th key={`${index}-${label}`} className="px-3 py-2 font-semibold">
                                                      {label}
                                                    </th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody className={plannerTableBody}>
                                                {strategyRows.map((row) => (
                                                  <tr key={`${index}-${row.rank}-${row.strategy}`} className="align-top">
                                                    <td className="px-3 py-3 font-semibold text-slate-900">{row.rank}</td>
                                                    <td className="px-3 py-3 font-[family-name:var(--font-instrument-serif)] text-[15px] font-semibold italic underline decoration-slate-400/70 underline-offset-4 text-slate-900">{row.strategy}</td>
                                                    <td className="px-3 py-3 font-[family-name:var(--font-instrument-serif)] text-[14px] leading-7">{compactCellText(row.bestFormat)}</td>
                                                    <td className="px-3 py-3 font-[family-name:var(--font-instrument-serif)] text-[14px] leading-7">{compactCellText(row.linkerOrDeliveryLogic)}</td>
                                                    <td className="px-3 py-3 font-[family-name:var(--font-instrument-serif)] text-[14px] leading-7">{compactCellText(row.payloadOrActiveSpecies)}</td>
                                                    <td className="px-3 py-3 font-[family-name:var(--font-instrument-serif)] text-[14px] leading-7">{compactCellText(row.whyItFits)}</td>
                                                    <td className="px-3 py-3 font-[family-name:var(--font-instrument-serif)] text-[14px] leading-7 text-amber-700">{compactCellText(row.riskOrFailureMode)}</td>
                                                    <td className="px-3 py-3">
                                                      {row.evidenceLabel ? (
                                                        <Chip className="border border-slate-200 bg-slate-50 text-slate-700">
                                                          {row.evidenceLabel}
                                                        </Chip>
                                                      ) : (
                                                        <span className="text-slate-500">—</span>
                                                      )}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </CardBody>
                                      </Card>
                                    ) : null}

                                    {showRankingSection && rankingRows.length ? (
                                      <Card className={`${plannerPanel} shadow-none`}>
                                        <CardBody className="gap-3">
                                          <div>
                                            <p className={plannerLabel}>ranking / scores</p>
                                            <p className={plannerTitle}>
                                              {result.confidence?.abstain ? "current class lean, without naming a final winner" : "ranked conjugate options"}
                                            </p>
                                          </div>
                                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {rankingRows.map((row) => (
                                              <div key={`${index}-${row.rank}-${row.strategy}-ranking`} className={`${plannerPanelSoft} p-3`}>
                                                <div className="flex items-start justify-between gap-3">
                                                  <div>
                                                    <p className="font-[family-name:var(--font-instrument-serif)] text-[1.12rem] font-semibold italic underline decoration-slate-400/70 underline-offset-4 text-slate-900">{row.strategy}</p>
                                                    <p className="text-sm text-slate-500">
                                                      {result.confidence?.abstain ? `status ${row.rank}` : `rank ${row.rank}`}
                                                    </p>
                                                  </div>
                                                  {row.score ? (
                                                    <Chip className="border border-sky-500/30 bg-sky-500/12 text-sky-200">
                                                      {row.score}
                                                    </Chip>
                                                  ) : null}
                                                </div>
                                                <div className="mt-3 grid gap-2 text-sm leading-7 text-slate-700">
                                                  <div>
                                                    <p className={plannerKicker}>why it fits</p>
                                                    <p className={plannerBody}>{completeUiSentence(row.whyItFits)}</p>
                                                  </div>
                                                  {row.risk ? (
                                                    <div>
                                                      <p className={plannerKicker}>main risk</p>
                                                      <p className={plannerBody}>{completeUiSentence(row.risk)}</p>
                                                    </div>
                                                  ) : null}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </CardBody>
                                      </Card>
                                    ) : null}

                                    {showInnovationSection && result.innovativeIdeas?.length ? (
                                      <Card className={`${plannerPanel} shadow-none`}>
                                        <CardBody className="gap-3">
                                          <div>
                                            <p className={plannerLabel}>innovative strategy ideas</p>
                                            <p className={plannerTitle}>high-upside ideas that are still exploratory</p>
                                          </div>
                                          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                            {result.innovativeIdeas.map((idea) => (
                                              <div key={`${index}-${idea.ideaName}`} className="rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                  <p className="font-[family-name:var(--font-instrument-serif)] text-[1.08rem] font-semibold italic underline decoration-slate-400/70 underline-offset-4 text-slate-900">{idea.ideaName}</p>
                                                  <Chip className={ideaRiskAccent(idea.riskLevel)}>{idea.riskLevel}</Chip>
                                                </div>
                                                <ul className="mt-3 grid gap-2 text-sm leading-7 text-slate-700">
                                                  <li><span className="font-semibold text-slate-950">why:</span> {idea.whyInteresting}</li>
                                                  <li><span className="font-semibold text-slate-950">assumption:</span> {idea.assumptionMustBeTrue}</li>
                                                  <li><span className="font-semibold text-slate-950">first experiment:</span> {idea.firstExperiment}</li>
                                                  <li><span className="font-semibold text-slate-950">risk:</span> {idea.whyItCouldFail}</li>
                                                </ul>
                                              </div>
                                            ))}
                                          </div>
                                        </CardBody>
                                      </Card>
                                    ) : null}

                                      <Accordion variant="splitted" className="px-0">
                                      {(!showBiologyPanel && (!isPureFollowUp || followUpKind === "clarify")) && biologySections.length ? (
                                        <AccordionItem key={`reasoning-${index}`} aria-label="deeper reasoning" title="deeper reasoning">
                                          <div className="grid gap-3 md:grid-cols-2">
                                            {biologySections.map((section) => (
                                              <div key={`${index}-${section.title}-biology`} className={`${plannerPanelSoft} p-3`}>
                                                <p className={plannerKicker}>
                                                  {section.title}
                                                </p>
                                                <p className={`mt-2 ${plannerMuted}`}>{section.body}</p>
                                              </div>
                                            ))}
                                          </div>
                                        </AccordionItem>
                                      ) : null}

                                      {showWhyNotSection && whyNotRows.length ? (
                                        <AccordionItem key={`whynot-${index}`} aria-label="why not" title="why not other options">
                                          <div className={plannerTableShell}>
                                            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                                              <thead className={plannerTableHead}>
                                                <tr>
                                                  {["class", "status", "why not"].map((label) => (
                                                    <th key={`${index}-${label}-whynot`} className="px-3 py-2 font-semibold">{label}</th>
                                                  ))}
                                                </tr>
                                              </thead>
                                              <tbody className={plannerTableBody}>
                                                {whyNotRows.map((item) => (
                                                  <tr key={`${index}-${item.modality}-whynot-row`}>
                                                    <td className="px-3 py-3 font-semibold text-slate-900">{item.modality}</td>
                                                    <td className="px-3 py-3">{item.outcome}</td>
                                                    <td className="px-3 py-3">{item.primaryReason}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          </div>
                                        </AccordionItem>
                                      ) : null}

                                      {showEvidenceSection && evidenceRows.length ? (
                                        <AccordionItem key={`anchors-${index}`} aria-label="evidence anchors" title="evidence / precedent anchors">
                                          <div className="grid gap-4">
                                            {[
                                              "approved / validated",
                                              "investigational precedent",
                                              "mechanistic extrapolation",
                                              "literature / supporting context",
                                            ]
                                              .map((trust) => ({
                                                trust,
                                                items: evidenceRows.filter((item) => evidenceTrustLabel(item.type) === trust),
                                              }))
                                              .filter((group) => group.items.length > 0)
                                              .map((group) => (
                                                <div key={`${index}-${group.trust}-evidence-group`} className={`${plannerPanelSoft} p-3`}>
                                                  <div className="mb-3 flex items-center justify-between gap-3">
                                                    <p className={plannerKicker}>{group.trust}</p>
                                                    <Chip className={evidenceTrustAccent(group.trust)}>
                                                      {group.items.length} source{group.items.length === 1 ? "" : "s"}
                                                    </Chip>
                                                  </div>
                                                  <div className="grid gap-3 md:grid-cols-2">
                                                    {group.items.map((item) => (
                                                      <div key={`${index}-${group.trust}-${item.label}-anchor`} className={`${plannerInset} p-3`}>
                                                        <div className="flex items-start justify-between gap-3">
                                                          <p className="font-semibold text-slate-900">{item.label}</p>
                                                          {item.type ? (
                                                            <Chip className="border border-slate-200 bg-slate-50 text-slate-700">{item.type}</Chip>
                                                          ) : null}
                                                        </div>
                                                        {item.why ? <p className={`mt-2 ${plannerMuted}`}>{item.why}</p> : null}
                                                        {item.href ? (
                                                          <Link
                                                            href={item.href}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="mt-3 inline-flex text-sm text-sky-700"
                                                          >
                                                            open source link
                                                          </Link>
                                                        ) : null}
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              ))}
                                          </div>
                                        </AccordionItem>
                                      ) : null}

                                      {showUncertaintySection && result.uncertainties?.length ? (
                                        <AccordionItem key={`uncertainty-${index}`} aria-label="uncertainty" title="uncertainty / what would make this rankable">
                                          <ul className="grid gap-2">
                                            {result.uncertainties.map((item) => (
                                              <li key={`${index}-${item}-uncertainty`} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-7 text-amber-800">
                                                {item}
                                              </li>
                                            ))}
                                          </ul>
                                        </AccordionItem>
                                      ) : null}

                                    {result.trace ? (
                                        <AccordionItem key={`trace-${index}`} aria-label="debug trace" title="debug trace">
                                          <pre className="overflow-x-auto rounded-xl border border-slate-700/70 bg-[#0a1324] p-4 text-xs leading-6 text-slate-300">
{JSON.stringify(
  {
    parser: result.trace.parser,
    normalization: result.trace.normalization,
    abstraction: result.trace.abstraction,
    confidence: result.confidence,
  },
  null,
  2,
)}
                                          </pre>
                                        </AccordionItem>
                                      ) : null}
                                    </Accordion>

                                    {result.suggestedFollowUps?.length ? (
                                      <Card className={`${plannerPanel} shadow-none`}>
                                        <CardBody className="gap-3">
                                          <div>
                                            <p className={plannerLabel}>chat follow-up suggestions</p>
                                            <p className={plannerTitle}>keep the conversation on the same scientific thread</p>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {result.suggestedFollowUps.map((suggestion) => (
                                              <Button
                                                key={`${index}-${suggestion}-suggested-followup`}
                                                size="sm"
                                                radius="full"
                                                variant="bordered"
                                                className="border-slate-200 bg-white text-slate-700"
                                                onPress={() => setChatInput(suggestion)}
                                              >
                                                {suggestion}
                                              </Button>
                                            ))}
                                          </div>
                                        </CardBody>
                                      </Card>
                                    ) : null}
                                  </div>
                                );
                              })()
                            ) : (
                            <div className="grid gap-3">
                              {parsePlannerSections(msg.text || (msg.isStreaming ? "thinking through the best fit..." : "")).map((section) => {
                                const normalizedTitle = section.title.toLowerCase();
                                const style = SECTION_STYLES[normalizedTitle] ?? {
                                  wrapper: "border-slate-200 bg-slate-50/70",
                                  label: "text-slate-700",
                                };
                                const rankingRows =
                                  normalizedTitle === "full ranking" || normalizedTitle === "feasible and worth ranking"
                                    ? parseRankingRows(section.body)
                                    : [];
                                const notViableRows =
                                  normalizedTitle === "not really viable here"
                                    ? parseNotViableRows(section.body)
                                    : [];

                                return (
                                  <div key={`${index}-${section.title}`} className={`rounded-2xl border p-4 ${style.wrapper}`}>
                                    {section.title ? (
                                      <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${style.label}`}>
                                        {section.title}
                                      </p>
                                    ) : null}
                                    {rankingRows.length ? (
                                      <div className="mt-3 grid gap-3">
                                        {rankingRows.map((row) => (
                                          <div key={`${row.rank}-${row.name}`} className="rounded-2xl border border-white/80 bg-white/85 p-4">
                                            <div className="flex items-center gap-2">
                                              <Chip size="sm" className="border border-sky-200 bg-sky-50 text-sky-700">
                                                #{row.rank}
                                              </Chip>
                                              {row.score ? (
                                                <Chip size="sm" className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                                                  {row.score}
                                                </Chip>
                                              ) : null}
                                              <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-zinc-950">
                                                {row.name}
                                              </p>
                                            </div>
                                            <div className="mt-3 grid gap-2 text-[0.95rem] leading-7 text-zinc-700">
                                              {row.fit ? (
                                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                                                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                                                    why it fits
                                                  </span>
                                                  <p className="mt-1">{row.fit}</p>
                                                </div>
                                              ) : null}
                                              {row.evidence ? (
                                                <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
                                                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                                                    best evidence for
                                                  </span>
                                                  <p className="mt-1">{row.evidence}</p>
                                                </div>
                                              ) : null}
                                              {row.against ? (
                                                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                                                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                                                    main reason against
                                                  </span>
                                                  <p className="mt-1">{row.against}</p>
                                                </div>
                                              ) : null}
                                              {row.mustBeTrue ? (
                                                <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3">
                                                  <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-700">
                                                    what would have to be true
                                                  </span>
                                                  <p className="mt-1">{row.mustBeTrue}</p>
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : notViableRows.length ? (
                                      <div className="mt-3 grid gap-3">
                                        {notViableRows.map((row) => (
                                          <div key={`${row.name}-${row.score ?? "nv"}`} className="rounded-2xl border border-white/80 bg-white/85 p-4">
                                            <div className="flex items-center justify-between gap-2">
                                              <p className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-zinc-950">
                                                {row.name}
                                              </p>
                                              {row.score ? (
                                                <Chip size="sm" className="border border-amber-200 bg-amber-50 text-amber-700">
                                                  score {row.score}
                                                </Chip>
                                              ) : null}
                                            </div>
                                            {row.reason ? (
                                              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[0.95rem] leading-7 text-zinc-700">
                                                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                                                  why it drops out
                                                </span>
                                                <p className="mt-1">{row.reason}</p>
                                              </div>
                                            ) : null}
                                          </div>
                                        ))}
                                      </div>
                                    ) : section.body ? (
                                      <p className={`${section.title ? "mt-2" : ""} whitespace-pre-line text-[1rem] leading-8 text-zinc-800`}>
                                        {section.body}
                                      </p>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                            )
                          ) : (
                            <p className="whitespace-pre-line text-[1.05rem] leading-8">
                              {msg.text || (msg.isStreaming ? "thinking through the best fit..." : "")}
                            </p>
                          )}
                          {msg.sources ? (
                            <div className="mt-3 flex flex-wrap gap-2 text-xs">
                              {msg.sources.map((src) => (
                                src.href ? (
                                  <Link key={`${src.label}-${src.href}`} href={src.href} className="text-sky-700">
                                    {src.label}
                                  </Link>
                                ) : (
                                  <Chip
                                    key={src.label}
                                    size="sm"
                                    className="border border-slate-200 bg-slate-50 text-slate-700"
                                  >
                                    {src.label}
                                  </Chip>
                                )
                              ))}
                            </div>
                          ) : null}
                          {msg.options ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {msg.options.map((opt) => (
                                <Button
                                  key={opt}
                                  size="sm"
                                  radius="full"
                                  className="border border-sky-200 bg-sky-50 text-sky-700"
                                  onPress={() => handleOption(opt)}
                                >
                                  {opt}
                                </Button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    <div ref={chatEndRef} />
                  </div>
              </div>

              <div className="mt-auto rounded-[1.75rem] border border-slate-200 bg-white/98 p-3 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSend();
                  }}
                >
                  <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50/80 px-3 py-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">design planner</span>
                      <span className="text-xs text-slate-400">enter sends · shift + enter makes a new line</span>
                    </div>
                    <div className="flex items-end gap-3">
                      <textarea
                        enterKeyHint="send"
                        rows={3}
                        className="min-h-[88px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-[15px] leading-7 text-zinc-900 outline-none placeholder:text-slate-400"
                        placeholder="ask like you would in codex — for egfr in colorectal cancer, what format, linker, and payload would you start with?"
                        value={chatInput}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          chatInputDraftRef.current = nextValue;
                          const appendedSingleNewline =
                            nextValue === `${chatInput}\n` || nextValue === `${chatInput}\r\n`;

                          if (appendedSingleNewline && nextValue.trim()) {
                            setChatInput(chatInput);
                            void sendPlannerDraft(chatInput);
                            return;
                          }

                          setChatInput(nextValue);
                        }}
                        onBeforeInput={(event) => {
                          const nativeEvent = event.nativeEvent as InputEvent;
                          if (
                            nativeEvent.inputType === "insertLineBreak" &&
                            !nativeEvent.isComposing &&
                            !allowComposerLineBreakRef.current
                          ) {
                            event.preventDefault();
                            void handleSend();
                          }
                        }}
                        onKeyDownCapture={(event) => {
                          allowComposerLineBreakRef.current = event.shiftKey;
                          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                            event.preventDefault();
                            void handleSend();
                          }
                        }}
                        onKeyUp={() => {
                          allowComposerLineBreakRef.current = false;
                        }}
                      />
                      <button
                        type="button"
                        className="h-11 min-w-[92px] rounded-full bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={isStreamingReply}
                        onClick={() => {
                          void handleSend();
                        }}
                        onTouchEnd={(event) => {
                          event.preventDefault();
                          void handleSend();
                        }}
                      >
                        send
                      </button>
                    </div>
                  </div>
                </form>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {(["normal", "deep", "max-depth"] as PlannerDepthMode[]).map((mode) => (
                      <Button
                        key={mode}
                        size="sm"
                        radius="full"
                        variant={plannerDepthMode === mode ? "solid" : "bordered"}
                        className={
                          plannerDepthMode === mode
                            ? "bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700"
                        }
                        onPress={() => setPlannerDepthMode(mode)}
                      >
                        {mode === "max-depth" ? "max depth" : mode}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.slice(0, 4).map((prompt) => (
                      <Button
                        key={prompt}
                        size="sm"
                        radius="full"
                        variant="bordered"
                        className="border-slate-200 bg-white text-slate-700"
                        onPress={() => setChatInput(prompt)}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                  <Button
                    variant="bordered"
                    radius="full"
                    className="border-sky-200 text-sky-700"
                    onPress={() => setChatInput(context)}
                  >
                    use selections in prompt
                  </Button>
                  <Button
                    variant="bordered"
                    radius="full"
                    className="border-sky-200 text-sky-700"
                    onPress={() => {
                      streamTokenRef.current += 1;
                      setHasOutputInteraction(false);
                      setIsStreamingReply(false);
                      setChatPinnedToBottom(true);
                      setChatLog([defaultAssistantMessage]);
                      setChatInput("");
                      setChatDerivedState({});
                      setResearchResult(null);
                      resetPlannerForm({
                        setIdea,
                        setMustHave,
                        setAvoid,
                        setTarget,
                        setConstraints,
                        setModality,
                        setGoal,
                        setTargetClass,
                        setTargetExpression,
                        setInternalization,
                        setPayloadClass,
                        setLinkerType,
                        setReleaseGoal,
                        setBystander,
                      });
                      if (typeof window !== "undefined") {
                        window.localStorage.removeItem(STORAGE_KEY);
                        window.localStorage.removeItem(FORM_KEY);
                      }
                    }}
                  >
                    clear chat
                  </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>
      </main>
    </div>
  );
}
