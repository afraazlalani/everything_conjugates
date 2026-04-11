"use client";

import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
  Spinner,
  Tab,
  Tabs,
  Textarea,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
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
};

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
  validationPasses?: {
    name: string;
    passed: boolean;
    note: string;
  }[];
  innovativeIdeas?: {
    title: string;
    rationale: string;
    whatMustChange: string;
    whyNotDefault: string;
    sourceLabels: string[];
  }[];
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
};

type StrategyCard = {
  title: string;
  body: string;
};

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
  const ordered: Array<[string, string]> = [
    ["target and indication", state.target],
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

function buildFallbackBiologySections(state: PlannerState, topOption?: RankedOption): BiologyPanelSection[] {
  const targetText = state.target
    ? `${state.target} is the current biological entry point. we still need to know whether it is disease-relevant, accessible, and selective enough to carry the strategy.`
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
  if (state.target) bits.push(`target: ${state.target}`);
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
        `${option.rank}. ${option.name}\n${getScore(option.name) !== null ? `score: ${getScore(option.name)}/10\n` : ""}why it fits: ${option.fitReason ?? option.summary}\nbest evidence for: ${
          option.bestEvidenceFor ?? option.fitReason ?? option.summary
        }\nmain reason against: ${option.mainReasonAgainst ?? option.limitReason ?? option.cons[0]}\nwhat would have to be true for this to win: ${
          option.whatMustBeTrue ?? "the remaining biology and delivery assumptions would have to hold."
        }`
    )
    .join("\n\n");

  const notViableText = buckets.notViable
    .map(
      ({ option, reason, score }) =>
        `${option.name}\n${typeof score === "number" ? `score: ${score}\n` : ""}why it drops out: ${reason}`
    )
    .join("\n\n");

  return [
    feasibleText ? `feasible and worth ranking\n${feasibleText}` : "",
    notViableText ? `not really viable here\n${notViableText}` : "",
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

function buildOptionDesignPriorities(option: RankedOption, state: PlannerState): DesignSuggestion[] {
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

  if (option.name === "adc") {
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
      text: `top recommendation\n${topOption?.name ?? "the strongest-ranked class"}\n\nwhy this is leading\n${topOption?.fitReason ?? planner.recommendation}\n\nwhy the others are behind\n${ranked
        .slice(1)
        .map((item) => `- ${item.name}: ${item.limitReason}`)
        .join("\n")}\n\nfirst move\n${distinctMove}`,
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
      text: `recommendation\n${planner.recommendation}\n\nranking right now\n${readableRankingText}\n\nmain watchout\n${primaryRisk}`,
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
    text: `clean read for ${targetLabel}\n\nbest current fit\n${topOption?.name ?? ranked[0]?.name ?? "adc"}\n\nwhy this is leading\n${topOption?.fitReason ?? planner.recommendation}\n\nfull ranking\n${readableRankingText}\n\nmain watchout\n${primaryRisk}\n\nfirst move\n${distinctMove}`,
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

  const explicitTarget = text.match(/target\s*:\s*([^\n]+)/i);
  if (explicitTarget?.[1]) {
    inferred.target = explicitTarget[1].trim();
  } else {
    const targetPhrase = text.match(/([a-z0-9\-+/ ]+?)\s+for\s+([a-z0-9\-+/ ]+)/i);
    if (targetPhrase?.[1] && targetPhrase?.[2]) {
      inferred.target = `${targetPhrase[1].trim()} for ${targetPhrase[2].trim()}`;
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

  if (normalized.includes("microtubule") || normalized.includes("mmae") || normalized.includes("dm1")) inferred.payloadClass = "microtubule inhibitor";
  if (normalized.includes("topo") || normalized.includes("sn-38") || normalized.includes("exatecan")) inferred.payloadClass = "topo I inhibitor";
  if (normalized.includes("dna-damaging") || normalized.includes("pbd") || normalized.includes("duocarmycin")) inferred.payloadClass = "DNA-damaging payload";
  if (normalized.includes("radionuclide") || normalized.includes("lu-177") || normalized.includes("ac-225")) inferred.payloadClass = "radionuclide";
  if (normalized.includes("oligo")) inferred.payloadClass = "oligo";
  if (isDuchenneCase) inferred.payloadClass = "oligo";

  if (isDuchenneCase) inferred.modality = "Oligo";

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

  const corrected = `best current fit\n${topOption.name}\n\nwhy this is leading\n${topOption.fitReason ?? topOption.summary}\n\n${rankingText}\n\nmain watchout\n${primaryRisk}\n\nfirst move\n${distinctMove}`;

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
  };
}

async function fetchDesignResearch(prompt: string, state: PlannerState) {
  const response = await fetch("/api/design-research", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      state,
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
  const [outputMode, setOutputMode] = useState("ranked suggestions");
  const [showFullRanking, setShowFullRanking] = useState(false);
  const [chatDerivedState, setChatDerivedState] = useState<Partial<PlannerState>>({});
  const [hasOutputInteraction, setHasOutputInteraction] = useState(false);
  const [isStreamingReply, setIsStreamingReply] = useState(false);
  const [chatPinnedToBottom, setChatPinnedToBottom] = useState(true);
  const [chatView, setChatView] = useState<"planner" | "biology">("planner");
  const [researchResult, setResearchResult] = useState<ResearchResponse | null>(null);
  const streamTokenRef = useRef(0);
  const chatViewportRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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
  const briefRead = buildBriefRead(effectivePlannerState);
  const quickPrompts = buildQuickPrompts(effectivePlannerState);
  const activeRankedOptions =
    hasOutputInteraction && researchResult?.ranking?.length
      ? dedupeRankedOptions(researchResult.ranking)
      : hasOutputInteraction
        ? dedupeRankedOptions(planner.rankedOptions)
        : [];
  const rankedBuckets = bucketRankedOptions(activeRankedOptions, researchResult?.matrix);
  const visibleFeasibleOptions =
    outputMode === "ranked suggestions" && !showFullRanking
      ? rankedBuckets.feasible.slice(0, 3)
      : rankedBuckets.feasible;
  const activeTopOption = activeRankedOptions[0];
  const designSuggestions = !hasOutputInteraction
    ? EMPTY_DESIGN_SUGGESTIONS
    : activeTopOption
      ? buildOptionDesignPriorities(activeTopOption, effectivePlannerState)
      : buildDesignSuggestions(effectivePlannerState, planner);
  const activeSources = researchResult?.sources?.length
    ? researchResult.sources
    : planner.evidence.map((cue) => ({
        label: cue.label,
        href: undefined,
        why: cue.why,
        type: cue.type,
      }));
  const evidenceGroups = bucketEvidenceSources(activeSources);
  const biologySections =
    researchResult?.biology?.length
      ? researchResult.biology
      : buildFallbackBiologySections(effectivePlannerState, activeTopOption);
  const activeRiskList = researchResult ? [researchResult.biggestRisk] : planner.risks;
  const activePlanList = researchResult ? [researchResult.firstMove, ...researchResult.nextSteps] : planner.plan;

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
        };
        return next;
      });
      await streamStep(index + 3);
    };

    await streamStep(3);

    setIsStreamingReply(false);
  }

  async function handleSend() {
    if (isStreamingReply) return;
    const message = chatInput.trim() || context;
    if (!message) return;

    const inferredState = shouldPersistInferredState(message, inferStateFromText(message));
    const mergedState = mergePlannerState(plannerState, {
      ...chatDerivedState,
      ...inferredState,
    });
    const userMsg: ChatMessage = { role: "user", text: message };
    setChatView("planner");
    setChatPinnedToBottom(true);
    setHasOutputInteraction(true);
    setShowFullRanking(false);
    setChatDerivedState((prev) => ({
      ...prev,
      ...inferredState,
    }));
    setChatLog((prev) => [...prev, userMsg]);
    try {
      const result = await fetchDesignResearch(message, mergedState);
      setResearchResult(result);
      await streamAssistantMessage(buildResearchMessage(result));
    } catch {
      const fallback = validateAssistantResponse(buildAssistantResponse(message, mergedState), mergedState);
      setResearchResult(null);
      await streamAssistantMessage(fallback);
    }
    setChatInput("");
  }

  async function handleOption(choice: string) {
    if (isStreamingReply) return;
    const userMsg: ChatMessage = { role: "user", text: choice };
    setChatView("planner");
    setChatPinnedToBottom(true);
    setHasOutputInteraction(true);
    setChatLog((prev) => [...prev, userMsg]);
    try {
      const result = await fetchDesignResearch(choice, effectivePlannerState);
      setResearchResult(result);
      await streamAssistantMessage(buildResearchMessage(result));
    } catch {
      const assistantMsg = buildOptionReply(choice, effectivePlannerState);
      setResearchResult(null);
      await streamAssistantMessage(assistantMsg);
    }
  }

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

      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            design workspace
          </Chip>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold sm:text-5xl">
            build the strategy before the chemistry
          </h1>
          <p className="max-w-4xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            pick the pieces that matter, write the messy version of your idea, and we’ll turn
            it into a cleaner strategy. this version uses your inputs plus the evidence already
            wired into the site to suggest what fits, what looks risky, and what to test first.
          </p>
          <p className="max-w-3xl text-sm leading-7 text-zinc-500">
            start in chat, let the planner pull out the important bits, then open the extra detail only if you want to tighten the recommendation.
          </p>
        </motion.section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/45 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <Card className="border border-emerald-100 bg-white/88">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                planner chat
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                ask for ranking, tradeoffs, or a build plan
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex h-full flex-col gap-4">
              {hasOutputInteraction ? (
                <Tabs
                  selectedKey={chatView}
                  onSelectionChange={(key) => setChatView((key as "planner" | "biology") ?? "planner")}
                  radius="full"
                  color="primary"
                  classNames={{
                    tabList: "bg-slate-100/80 p-1",
                    cursor: "bg-sky-600",
                    tab: "px-4",
                    tabContent: "text-sm font-medium",
                  }}
                >
                  <Tab key="planner" title="planner" />
                  <Tab key="biology" title="biology" />
                </Tabs>
              ) : null}
              <div className="rounded-[1.5rem] border border-white/70 bg-white/60 p-3">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
                  <span>{chatView === "biology" && hasOutputInteraction ? "biology read" : "conversation"}</span>
                  <span>{chatView === "planner" && isStreamingReply ? "thinking..." : "ready"}</span>
                </div>
                {chatView === "biology" && hasOutputInteraction ? (
                  <div className="flex h-[34rem] flex-col gap-3 overflow-y-auto pr-1">
                    {researchResult?.biologyValidationPasses?.length ? (
                      <div className="grid gap-3 md:grid-cols-3">
                        {researchResult.biologyValidationPasses.map((pass) => (
                          <div
                            key={`bio-pass-${pass.name}`}
                            className={`rounded-2xl border p-4 ${
                              pass.passed
                                ? "border-emerald-200 bg-emerald-50/75"
                                : "border-amber-200 bg-amber-50/75"
                            }`}
                          >
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                              {pass.name}
                            </p>
                            <Chip
                              size="sm"
                              className={`mt-2 w-fit ${
                                pass.passed
                                  ? "border border-emerald-200 bg-white text-emerald-700"
                                  : "border border-amber-200 bg-white text-amber-700"
                              }`}
                            >
                              {pass.passed ? "passed" : "softened"}
                            </Chip>
                            <p className="mt-3 text-sm leading-7 text-zinc-700">{pass.note}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {biologySections.map((section) => (
                      <div key={section.title} className="rounded-2xl border border-white/80 bg-white/85 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-600">
                          {section.title}
                        </p>
                        <p className="mt-2 text-[1rem] leading-8 text-zinc-800">{section.body}</p>
                        {section.sources?.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {section.sources.map((src) =>
                              src.href ? (
                                <Link
                                  key={`${section.title}-${src.label}-${src.href}`}
                                  href={src.href}
                                  className="text-sm text-sky-700"
                                >
                                  {src.label}
                                </Link>
                              ) : (
                                <Chip
                                  key={`${section.title}-${src.label}`}
                                  size="sm"
                                  className="border border-slate-200 bg-white text-slate-700"
                                >
                                  {src.label}
                                </Chip>
                              ),
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {activeSources.length ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          biology references
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeSources.slice(0, 6).map((src) => (
                            src.href ? (
                              <Link key={`${src.label}-${src.href}-biology`} href={src.href} className="text-sky-700">
                                {src.label}
                              </Link>
                            ) : (
                              <Chip
                                key={`${src.label}-biology`}
                                size="sm"
                                className="border border-slate-200 bg-white text-slate-700"
                              >
                                {src.label}
                              </Chip>
                            )
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div
                    ref={chatViewportRef}
                    className="flex h-[34rem] flex-col gap-3 overflow-y-auto pr-1"
                    onScroll={(event) => {
                      const viewport = event.currentTarget;
                      const distanceFromBottom =
                        viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
                      setChatPinnedToBottom(distanceFromBottom < 96);
                    }}
                  >
                      {chatLog.map((msg, index) => (
                        <div
                          key={index}
                          className={`rounded-[1.6rem] px-4 py-4 text-sm leading-7 ${
                            msg.role === "user"
                              ? "self-end max-w-[78%] bg-sky-100 text-sky-900 shadow-[0_10px_25px_rgba(14,165,233,0.08)]"
                              : "w-full border border-white/80 bg-white text-zinc-700 shadow-[0_10px_25px_rgba(15,23,42,0.04)]"
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
                )}
              </div>

              <div className="mt-auto rounded-[1.5rem] border border-sky-100 bg-white p-3 shadow-[0_10px_25px_rgba(14,165,233,0.04)]">
                <Textarea
                  label="message the planner"
                  labelPlacement="outside"
                  placeholder="e.g. for egfr in colorectal cancer, what antibody format, linker, and payload would you start with?"
                  value={chatInput}
                  onValueChange={setChatInput}
                  minRows={3}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                />
                <p className="mt-2 text-xs text-zinc-500">
                  press enter to send. use shift + enter for a new line.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {quickPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      size="sm"
                      radius="full"
                      variant="bordered"
                      className="border-emerald-200 bg-white text-emerald-700"
                      onPress={() => setChatInput(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button className="bg-sky-600 text-white" radius="full" isLoading={isStreamingReply} onPress={handleSend}>
                    send
                  </Button>
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
                      setChatView("planner");
                      setShowFullRanking(false);
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
            </CardBody>
          </Card>
        </section>

        <section className="rounded-[2rem] border border-slate-200/80 bg-white/50 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <Card className="border border-sky-100 bg-white/85">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                parsed brief
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                what the planner picked up
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-5">
              <Card className="border border-sky-200 bg-sky-50/70">
                <CardBody className="grid gap-3 text-sm text-sky-900">
                  <p className="font-semibold">current read</p>
                  <p>{planner.summary}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {briefRead.length ? (
                      briefRead.map((item) => (
                        <div
                          key={`${item.label}-${item.value}`}
                          className="rounded-2xl border border-sky-200 bg-white/85 p-3"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700">
                            {item.label}
                          </p>
                          <p className="mt-1 text-[0.98rem] leading-7 text-zinc-800">{item.value}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-sky-200 bg-white/85 p-3 text-sky-700 md:col-span-2">
                        ask in plain language and the planner will pull the key target, modality, linker, and payload cues out here for you.
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-sky-700">
                    {context ? (
                      context.split(" | ").map((item) => (
                        <Chip key={item} size="sm" className="border border-sky-200 bg-white/80 text-sky-700">
                          {item}
                        </Chip>
                      ))
                    ) : (
                      <Chip size="sm" className="border border-sky-200 bg-white/80 text-sky-700">
                        no strong brief signals yet
                      </Chip>
                    )}
                  </div>
                </CardBody>
              </Card>

              <Accordion variant="splitted" className="px-0">
                <AccordionItem
                  key="optional-brief"
                  aria-label="optional-brief"
                  title="add optional extra detail"
                  classNames={{ trigger: "text-sm font-medium text-zinc-700" }}
                >
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border border-sky-100 bg-white">
                      <CardBody className="gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">
                          1. core brief
                        </p>
                        <Input
                          label="one-line idea"
                          labelPlacement="outside"
                          placeholder="what are we trying to build?"
                          value={idea}
                          onValueChange={setIdea}
                        />
                        <Input
                          label="target and indication"
                          labelPlacement="outside"
                          placeholder="e.g. HER2 in breast cancer"
                          value={target}
                          onValueChange={setTarget}
                        />
                        <Select
                          label="modality"
                          labelPlacement="outside"
                          selectedKeys={modality ? [modality] : []}
                          onSelectionChange={(keys) => setModality(Array.from(keys)[0]?.toString() ?? "")}
                        >
                          {modalities.map((item) => (
                            <SelectItem key={item}>{item}</SelectItem>
                          ))}
                        </Select>
                        <Select
                          label="main goal"
                          labelPlacement="outside"
                          selectedKeys={goal ? [goal] : []}
                          onSelectionChange={(keys) => setGoal(Array.from(keys)[0]?.toString() ?? "")}
                        >
                          {goals.map((item) => (
                            <SelectItem key={item}>{item}</SelectItem>
                          ))}
                        </Select>
                      </CardBody>
                    </Card>

                    <Card className="border border-sky-100 bg-white">
                      <CardBody className="gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">
                          2. target biology
                        </p>
                        <Select
                          label="target class"
                          labelPlacement="outside"
                          selectedKeys={targetClass ? [targetClass] : []}
                          onSelectionChange={(keys) => setTargetClass(Array.from(keys)[0]?.toString() ?? "")}
                        >
                          {targetClasses.map((item) => (
                            <SelectItem key={item}>{item}</SelectItem>
                          ))}
                        </Select>
                        <Select
                          label="target expression"
                          labelPlacement="outside"
                          selectedKeys={targetExpression ? [targetExpression] : []}
                          onSelectionChange={(keys) =>
                            setTargetExpression(Array.from(keys)[0]?.toString() ?? "")
                          }
                        >
                          {["high + homogeneous", "high + heterogeneous", "low / sparse", "unknown"].map(
                            (item) => (
                              <SelectItem key={item}>{item}</SelectItem>
                            )
                          )}
                        </Select>
                        <Select
                          label="internalization"
                          labelPlacement="outside"
                          selectedKeys={internalization ? [internalization] : []}
                          onSelectionChange={(keys) =>
                            setInternalization(Array.from(keys)[0]?.toString() ?? "")
                          }
                        >
                          {["fast", "moderate", "slow", "unknown"].map((item) => (
                            <SelectItem key={item}>{item}</SelectItem>
                          ))}
                        </Select>
                        <Textarea
                          label="must-have requirement"
                          labelPlacement="outside"
                          placeholder="what does this design absolutely need to do?"
                          value={mustHave}
                          onValueChange={setMustHave}
                          minRows={3}
                        />
                      </CardBody>
                    </Card>

                    <Card className="border border-sky-100 bg-white">
                      <CardBody className="gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">
                          3. chemistry + constraints
                        </p>
                        <Select
                          label="payload class"
                          labelPlacement="outside"
                          selectedKeys={payloadClass ? [payloadClass] : []}
                          onSelectionChange={(keys) =>
                            setPayloadClass(Array.from(keys)[0]?.toString() ?? "")
                          }
                        >
                          {[
                            "microtubule inhibitor",
                            "topo I inhibitor",
                            "DNA-damaging payload",
                            "oligo",
                            "radionuclide",
                            "enzyme / substrate logic",
                            "unknown",
                          ].map((item) => (
                            <SelectItem key={item}>{item}</SelectItem>
                          ))}
                        </Select>
                        <Select
                          label="linker type"
                          labelPlacement="outside"
                          selectedKeys={linkerType ? [linkerType] : []}
                          onSelectionChange={(keys) =>
                            setLinkerType(Array.from(keys)[0]?.toString() ?? "")
                          }
                        >
                          {[
                            "cleavable (protease)",
                            "cleavable (pH)",
                            "cleavable (reducible)",
                            "non-cleavable",
                            "chelator / spacer system",
                            "unknown",
                          ].map((item) => (
                            <SelectItem key={item}>{item}</SelectItem>
                          ))}
                        </Select>
                        <Select
                          label="release goal"
                          labelPlacement="outside"
                          selectedKeys={releaseGoal ? [releaseGoal] : []}
                          onSelectionChange={(keys) =>
                            setReleaseGoal(Array.from(keys)[0]?.toString() ?? "")
                          }
                        >
                          {releaseGoals.map((item) => (
                            <SelectItem key={item}>{item}</SelectItem>
                          ))}
                        </Select>
                        <Select
                          label="bystander effect"
                          labelPlacement="outside"
                          selectedKeys={bystander ? [bystander] : []}
                          onSelectionChange={(keys) => setBystander(Array.from(keys)[0]?.toString() ?? "")}
                        >
                          {["yes", "no", "unsure"].map((item) => (
                            <SelectItem key={item}>{item}</SelectItem>
                          ))}
                        </Select>
                      </CardBody>
                    </Card>
                  </div>
                </AccordionItem>
                <AccordionItem
                  key="constraints"
                  aria-label="constraints"
                  title="advanced constraints and things to avoid"
                  classNames={{ trigger: "text-sm font-medium text-zinc-700" }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <Textarea
                      label="what to avoid"
                      labelPlacement="outside"
                      placeholder="payload classes, toxicities, chemistries, or constraints we should steer away from"
                      value={avoid}
                      onValueChange={setAvoid}
                      minRows={3}
                    />
                    <Textarea
                      label="extra constraints"
                      labelPlacement="outside"
                      placeholder="analytics available, manufacturability limits, dar limits, assay limits, anything else"
                      value={constraints}
                      onValueChange={setConstraints}
                      minRows={3}
                    />
                  </div>
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>
        </section>

        {hasOutputInteraction ? (
        <>
        <section className="grid gap-6">
          <Card className="border border-emerald-100 bg-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                output
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                what looks strongest right now
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-[1fr,16rem]">
                <Card className="border border-emerald-200 bg-emerald-50/70">
                  <CardBody className="text-sm leading-7 text-emerald-900">
                    <p className="font-semibold">most likely fit</p>
                    <p className="mt-2">{researchResult?.topPickWhy ?? planner.recommendation}</p>
                  </CardBody>
                </Card>
                <Select
                  label="output view"
                  labelPlacement="outside"
                  selectedKeys={[outputMode]}
                  onSelectionChange={(keys) =>
                    setOutputMode(Array.from(keys)[0]?.toString() || "ranked suggestions")
                  }
                >
                  {["ranked suggestions", "pros + cons"].map((item) => (
                    <SelectItem key={item}>{item}</SelectItem>
                  ))}
                </Select>
              </div>
              <Card className="border border-emerald-100 bg-white/75">
                <CardHeader className="flex flex-col items-start gap-2">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                    recommended parts
                  </p>
                  <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold">
                    what i’d choose first
                  </h3>
                </CardHeader>
                <Divider />
                <CardBody className="grid gap-4 md:grid-cols-3">
                  {designSuggestions.map((item) => (
                    <Card key={item.label} className={`border ${item.accent}`}>
                      <CardBody className="gap-3 text-sm leading-7 text-zinc-700">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          {item.label}
                        </p>
                        <p className="font-semibold text-zinc-900">{item.title}</p>
                        <p>{item.body}</p>
                      </CardBody>
                    </Card>
                  ))}
                </CardBody>
              </Card>
              {outputMode === "ranked suggestions" ? (
                <div className="grid gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm leading-7 text-zinc-600">
                      {showFullRanking
                        ? "all feasible options plus the filtered-out ones"
                        : "showing the top feasible options first so the recommendation is easier to scan"}
                    </p>
                    {rankedBuckets.feasible.length > 3 || rankedBuckets.notViable.length > 0 ? (
                      <Button
                        size="sm"
                        radius="full"
                        variant="bordered"
                        className="border-sky-200 text-sky-700"
                        onPress={() => setShowFullRanking((value) => !value)}
                      >
                        {showFullRanking ? "show top 3 only" : "show full ranking"}
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                        feasible and worth ranking
                      </p>
                      <p className="mt-1 text-sm leading-7 text-zinc-700">
                        these are the options that still look biologically and mechanically legitimate for the current brief.
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleFeasibleOptions.map((item) => (
                      <Card key={item.name} className={`border bg-white/90 ${
                        item.rank === 1
                          ? "border-emerald-200"
                          : item.rank === 2
                          ? "border-sky-200"
                          : "border-slate-200"
                      }`}>
                        <CardBody className="gap-4 text-sm leading-7 text-zinc-600">
                          <div className="flex items-center justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
                                conjugate class
                              </p>
                              <p className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-zinc-900">
                                {item.name}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Chip className="border border-sky-200 bg-sky-50 text-sky-700">
                                rank {item.rank}
                              </Chip>
                              {modalityScoreOutOfTen(item.name, researchResult?.matrix) !== null ? (
                                <Chip className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                                  {modalityScoreOutOfTen(item.name, researchResult?.matrix)}/10
                                </Chip>
                              ) : null}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              quick read
                            </p>
                            <p className="mt-1 text-zinc-700">{item.summary}</p>
                          </div>
                          <div className="grid gap-3">
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                                why this is a fit
                              </p>
                              <p className="mt-1 text-zinc-700">{item.fitReason ?? item.summary}</p>
                            </div>
                            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                                why not
                              </p>
                              <p className="mt-1 text-zinc-700">{item.limitReason ?? item.cons[0]}</p>
                            </div>
                          </div>
                          <div className="grid gap-3">
                            {buildOptionDesignPriorities(item, effectivePlannerState).map((part) => (
                              <div key={`${item.name}-${part.label}`} className={`rounded-2xl border p-3 ${part.accent}`}>
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                  {part.label}
                                </p>
                                <p className="mt-1 font-semibold text-zinc-900">{part.title}</p>
                                <p className="mt-1 text-zinc-700">{part.body}</p>
                              </div>
                            ))}
                          </div>
                          {(item.bestEvidenceFor || item.mainReasonAgainst || item.whatMustBeTrue) ? (
                            <Accordion variant="light" className="px-0">
                              <AccordionItem
                                key={`${item.name}-details`}
                                aria-label={`${item.name} details`}
                                title="see deeper reasoning"
                                classNames={{ title: "text-sm font-medium text-zinc-700" }}
                              >
                                <div className="grid gap-3">
                                  {item.bestEvidenceFor ? (
                                    <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                                        best evidence for
                                      </p>
                                      <p className="mt-1 text-zinc-700">{item.bestEvidenceFor}</p>
                                    </div>
                                  ) : null}
                                  {item.mainReasonAgainst ? (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                                        main reason against
                                      </p>
                                      <p className="mt-1 text-zinc-700">{item.mainReasonAgainst}</p>
                                    </div>
                                  ) : null}
                                  {item.whatMustBeTrue ? (
                                    <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-3">
                                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">
                                        what would have to be true
                                      </p>
                                      <p className="mt-1 text-zinc-700">{item.whatMustBeTrue}</p>
                                    </div>
                                  ) : null}
                                </div>
                              </AccordionItem>
                            </Accordion>
                          ) : null}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  </div>
                  {rankedBuckets.notViable.length ? (
                    <div className="grid gap-3">
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                          not really viable here
                        </p>
                        <p className="mt-1 text-sm leading-7 text-zinc-700">
                          these options are being filtered out because the current biology, release logic, or delivery cues point the wrong way.
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {rankedBuckets.notViable.map(({ option, reason, score }) => (
                          <Card key={`${option.name}-not-viable`} className="border border-amber-200 bg-white/90">
                            <CardBody className="gap-3 text-sm leading-7 text-zinc-700">
                              <div className="flex items-center justify-between gap-3">
                                <p className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-zinc-900">
                                  {option.name}
                                </p>
                                {typeof score === "number" ? (
                                  <Chip className="border border-amber-200 bg-amber-50 text-amber-700">
                                    {Math.max(0, Math.min(10, Math.round(((score + 15) / 30) * 10)))}/10
                                  </Chip>
                                ) : null}
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  why it drops out
                                </p>
                                <p className="mt-1">{reason}</p>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-4">
                  {activeRankedOptions.map((item) => (
                    <Card key={item.name} className="border border-white/80 bg-white/85">
                      <CardBody className="grid gap-4 lg:grid-cols-[14rem,1fr,1fr]">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Chip className="border border-sky-200 bg-sky-50 text-sky-700">
                              rank {item.rank}
                            </Chip>
                            <p className="font-semibold text-zinc-900">{item.name}</p>
                          </div>
                          <p className="text-sm leading-7 text-zinc-600">{item.summary}</p>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 text-sm leading-7 text-zinc-700">
                            <p><span className="font-semibold text-zinc-900">why it fits:</span> {item.fitReason ?? item.summary}</p>
                            <p><span className="font-semibold text-zinc-900">why it may not:</span> {item.limitReason ?? item.cons[0]}</p>
                            {item.bestEvidenceFor ? <p><span className="font-semibold text-zinc-900">best evidence for:</span> {item.bestEvidenceFor}</p> : null}
                            {item.mainReasonAgainst ? <p><span className="font-semibold text-zinc-900">main reason against:</span> {item.mainReasonAgainst}</p> : null}
                            {item.whatMustBeTrue ? <p><span className="font-semibold text-zinc-900">what would have to be true:</span> {item.whatMustBeTrue}</p> : null}
                          </div>
                        </div>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm leading-7 text-zinc-700">
                          <p className="font-semibold text-zinc-900">pros</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {item.pros.map((pro) => (
                              <li key={pro}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-sm leading-7 text-zinc-700">
                          <p className="font-semibold text-zinc-900">cons</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {item.cons.map((con) => (
                              <li key={con}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
              <Accordion variant="splitted" className="px-0">
                <AccordionItem
                  key="strategy-notes"
                  aria-label="strategy notes"
                  title="see extra strategy notes"
                  classNames={{ trigger: "text-sm font-medium text-zinc-700" }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    {planner.strategyCards.map((item) => (
                      <Card key={item.title} className="border border-white/80 bg-white/80">
                        <CardBody className="gap-2 text-sm leading-7 text-zinc-600">
                          <p className="font-semibold text-zinc-900">{item.title}</p>
                          <p>{item.body}</p>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  {planner.decisionSignals.length ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {planner.decisionSignals.map((item) => (
                        <Card key={item.title} className="border border-blue-100 bg-blue-50/70">
                          <CardBody className="gap-2 text-sm leading-7 text-zinc-700">
                            <p className="font-semibold text-zinc-900">{item.title}</p>
                            <p>{item.body}</p>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  ) : null}
                </AccordionItem>
              </Accordion>
            </CardBody>
          </Card>

          <div className="grid gap-6">
            <Card className="border border-amber-100 bg-white/80">
              <CardHeader className="flex flex-col items-start gap-2">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                  biggest watchouts
                </p>
                <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                  what could break this first
                </h2>
              </CardHeader>
              <Divider />
              <CardBody className="grid gap-3">
                {activeRiskList.map((risk, index) => (
                  <div
                    key={`${risk}-${index}`}
                    className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm leading-7 text-zinc-700"
                  >
                    <span className="font-semibold text-zinc-900">risk {index + 1}:</span> {risk}
                  </div>
                ))}
              </CardBody>
            </Card>

            <Card className="border border-blue-100 bg-white/80">
              <CardHeader className="flex flex-col items-start gap-2">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                  plan
                </p>
                <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                  how we’d go build it
                </h2>
              </CardHeader>
              <Divider />
              <CardBody className="grid gap-3">
                {activePlanList.map((step, index) => (
                  <div
                    key={`${step}-${index}`}
                    className="rounded-xl border border-white/80 bg-white/85 p-4 text-sm leading-7 text-zinc-700"
                  >
                    <span className="font-semibold text-zinc-900">{index + 1}.</span> {step}
                  </div>
                ))}
              </CardBody>
            </Card>
          </div>
        </section>

        <Accordion variant="splitted" className="px-0">
          {researchResult?.innovativeIdeas?.length ? (
            <AccordionItem
              key="innovative"
              aria-label="innovative"
              title="innovative conjugates"
              classNames={{ trigger: "text-sm font-medium text-zinc-700" }}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {researchResult.innovativeIdeas.map((idea) => (
                  <Card key={idea.title} className="border border-fuchsia-200 bg-white/90">
                    <CardBody className="gap-3 text-sm leading-7 text-zinc-700">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700">
                          stretch option
                        </p>
                        <p className="mt-1 font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-zinc-900">
                          {idea.title}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-fuchsia-700">
                          why it could be interesting
                        </p>
                        <p className="mt-1">{idea.rationale}</p>
                      </div>
                      <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                          what would have to change
                        </p>
                        <p className="mt-1">{idea.whatMustChange}</p>
                      </div>
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                          why this is not the default
                        </p>
                        <p className="mt-1">{idea.whyNotDefault}</p>
                      </div>
                      {idea.sourceLabels.length ? (
                        <div className="flex flex-wrap gap-2">
                          {idea.sourceLabels.map((label) => (
                            <Chip
                              key={`${idea.title}-${label}`}
                              size="sm"
                              className="border border-slate-200 bg-slate-50 text-slate-700"
                            >
                              {label}
                            </Chip>
                          ))}
                        </div>
                      ) : null}
                    </CardBody>
                  </Card>
                ))}
              </div>
            </AccordionItem>
          ) : null}

          <AccordionItem
            key="fallbacks"
            aria-label="fallbacks"
            title="fallback paths and closest playbooks"
            classNames={{ trigger: "text-sm font-medium text-zinc-700" }}
          >
            <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
              <Card className="border border-white/80 bg-white/75">
                <CardHeader className="flex flex-col items-start gap-2">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                    compare paths
                  </p>
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                    what we’d pivot to if this stops working
                  </h2>
                </CardHeader>
                <Divider />
                <CardBody className="grid gap-4 md:grid-cols-2">
                  {planner.alternatives.map((item) => (
                    <Card key={item.title} className="border border-white/80 bg-white/85">
                      <CardBody className="gap-2 text-sm leading-7 text-zinc-600">
                        <p className="font-semibold text-zinc-900">{item.title}</p>
                        <p>{item.body}</p>
                      </CardBody>
                    </Card>
                  ))}
                  {!planner.alternatives.length ? (
                    <Card className="border border-white/80 bg-white/85 md:col-span-2">
                      <CardBody className="text-sm leading-7 text-zinc-600">
                        once you lock a modality, this section will show the most realistic fallback paths instead of only repeating the main recommendation.
                      </CardBody>
                    </Card>
                  ) : null}
                </CardBody>
              </Card>

              <Card className="border border-white/80 bg-white/75">
                <CardHeader className="flex flex-col items-start gap-2">
                  <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                    closest playbooks
                  </p>
                  <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                    what this most resembles
                  </h2>
                </CardHeader>
                <Divider />
                <CardBody className="grid gap-3">
                  {planner.comparablePrograms.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-xl border border-white/80 bg-white/85 p-4 text-sm leading-7 text-zinc-700"
                    >
                      <p className="font-semibold text-zinc-900">{item.name}</p>
                      <p>{item.reason}</p>
                    </div>
                  ))}
                  {!planner.comparablePrograms.length ? (
                    <div className="rounded-xl border border-white/80 bg-white/85 p-4 text-sm leading-7 text-zinc-600">
                      once the modality is clearer, we’ll surface the most comparable approved or well-known platform playbooks here.
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            </div>
          </AccordionItem>
        </Accordion>

        <Card className="border border-white/80 bg-white/75">
          <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                output
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                why these options are showing up
              </h2>
            </CardHeader>
            <Divider />
          <CardBody className="grid gap-6">
            {evidenceGroups.map((group) => (
              <div key={group.key} className="grid gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    {group.title}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((item) => (
                    <Card key={`${group.key}-${item.label}`} className="border border-white/80 bg-white/85">
                      <CardBody className="gap-3 text-sm leading-7 text-zinc-600">
                        <p className="font-semibold text-zinc-900">{item.label}</p>
                        <p>{item.why}</p>
                        <Chip className="w-fit border border-slate-200 bg-slate-50 text-slate-700">
                          {item.type}
                        </Chip>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {(researchResult?.validationPasses?.length || researchResult?.matrix?.length) ? (
          <Accordion variant="splitted" className="px-0">
            {researchResult?.validationPasses?.length ? (
              <AccordionItem
                key="validation"
                aria-label="validation"
                title="anti-hallucination check"
                classNames={{ trigger: "text-sm font-medium text-zinc-700" }}
              >
                <div className="grid gap-4 md:grid-cols-3">
                  {researchResult.validationPasses.map((pass) => (
                    <Card
                      key={pass.name}
                      className={`border ${
                        pass.passed
                          ? "border-emerald-200 bg-emerald-50/70"
                          : "border-amber-200 bg-amber-50/70"
                      }`}
                    >
                      <CardBody className="gap-2 text-sm leading-7 text-zinc-700">
                        <p className="font-semibold text-zinc-900">{pass.name}</p>
                        <Chip
                          size="sm"
                          className={`w-fit ${
                            pass.passed
                              ? "border border-emerald-200 bg-white text-emerald-700"
                              : "border border-amber-200 bg-white text-amber-700"
                          }`}
                        >
                          {pass.passed ? "passed" : "adjusted"}
                        </Chip>
                        <p>{pass.note}</p>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </AccordionItem>
            ) : null}

            {researchResult?.matrix?.length ? (
              <AccordionItem
                key="matrix"
                aria-label="matrix"
                title="evidence by modality"
                classNames={{ trigger: "text-sm font-medium text-zinc-700" }}
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {researchResult.matrix.map((row, index) => (
                    <Card
                      key={row.modality}
                      className={`border bg-white/90 ${
                        index === 0 ? "border-emerald-200" : "border-slate-200"
                      }`}
                    >
                      <CardBody className="gap-3 text-sm leading-7 text-zinc-700">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold text-zinc-900">
                            {row.modality}
                          </p>
                          <Chip className="border border-sky-200 bg-sky-50 text-sky-700">
                            score {row.total}
                          </Chip>
                        </div>
                        <div className="grid gap-2">
                          {row.cells.map((cell) => (
                            <div key={`${row.modality}-${cell.category}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  {cell.category}
                                </p>
                                <p className="text-xs font-semibold text-zinc-900">{cell.score}</p>
                              </div>
                              <p className="mt-1 text-zinc-700">{cell.reason}</p>
                            </div>
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </AccordionItem>
            ) : null}
          </Accordion>
        ) : null}
        </>
        ) : (
          <Card className="border border-emerald-100 bg-white/80">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                output
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                output stays blank until you ask for it
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4 md:grid-cols-3">
              <Card className="border border-emerald-200 bg-emerald-50/70">
                <CardBody className="gap-2 text-sm leading-7 text-zinc-700">
                  <p className="font-semibold text-zinc-900">top pick</p>
                  <p>once you ask for a recommendation, this will rank all conjugate classes from best fit to weakest fit.</p>
                </CardBody>
              </Card>
              <Card className="border border-amber-200 bg-amber-50/70">
                <CardBody className="gap-2 text-sm leading-7 text-zinc-700">
                  <p className="font-semibold text-zinc-900">biggest risk</p>
                  <p>this stays empty until the planner has a real brief to pressure-test.</p>
                </CardBody>
              </Card>
              <Card className="border border-blue-200 bg-blue-50/70">
                <CardBody className="gap-2 text-sm leading-7 text-zinc-700">
                  <p className="font-semibold text-zinc-900">first move</p>
                  <p>after output interaction, this turns into the first concrete experiment or de-risking step.</p>
                </CardBody>
              </Card>
            </CardBody>
          </Card>
        )}

        <Card id="figure-studio" className="border border-sky-100 bg-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              figure studio
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
              need a visual too?
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 lg:grid-cols-[1.1fr,auto] lg:items-center">
            <div className="grid gap-3 text-sm leading-7 text-zinc-600">
              <p>
                figure studio lives on its own page now, so people can find it as a separate tool instead of missing it inside the conjugate planner.
              </p>
              <p>
                use it when the strategy is already clear and you want a mechanism figure, architecture panel, trafficking view, biology map, or risk figure.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                as={Link}
                href="/figure-studio"
                className="bg-sky-600 text-white"
                radius="full"
              >
                open figure studio
              </Button>
              <Button
                as={Link}
                href="/figure-studio"
                variant="bordered"
                radius="full"
                className="border-sky-200 text-sky-700"
              >
                build a figure
              </Button>
            </div>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
