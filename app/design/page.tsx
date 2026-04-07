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
  Image,
  Input,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
  Spinner,
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
const POLLINATIONS_STYLE_PROMPTS: Record<string, string> = {
  "scientific schematic":
    "clean scientific schematic, white background, crisp shapes, minimal clutter, polished atlas style",
  "mechanism flow":
    "scientific mechanism flow diagram, compartments, arrows, labeled steps, clean infographic layout",
  "hero illustration":
    "premium scientific editorial illustration, polished lighting, depth, soft gradients, modern biotech style",
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
  sources?: { label: string; href?: string; why?: string; type?: string }[];
  options?: string[];
  isStreaming?: boolean;
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
  pros: string[];
  cons: string[];
};

type EvidenceCue = {
  label: string;
  why: string;
  type: string;
};

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

function buildRankingText(rankedOptions: RankedOption[]) {
  return rankedOptions
    .map(
      (option) =>
        `#${option.rank} ${option.name}\nwhy it fits: ${option.fitReason ?? option.summary}\nwhy it may not fit: ${
          option.limitReason ?? option.cons[0]
        }`
    )
    .join("\n");
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

function extractMentionedConjugateClasses(text: string) {
  const normalized = text.toLowerCase();
  return CONJUGATE_CLASSES.filter((label) => normalized.includes(label));
}

function softenConfidence(text: string) {
  return text
    .replace(/best current fit:/gi, "tentative best fit:")
    .replace(/full ranking right now:/gi, "tentative ranking right now:")
    .replace(/ranking right now:/gi, "tentative ranking right now:")
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
  const rankingText = buildRankingText(ranked);
  const { primaryRisk, distinctMove } = getDistinctRiskAndFirstMove(planner);

  const comparisonText = ranked
    .map((item) => `- ${item.name}: ${item.fitReason}`)
    .join("\n");

  if (
    normalized.includes("what should i build") ||
    normalized.includes("what would you build") ||
    normalized.includes("what do you recommend")
  ) {
    return {
      role: "assistant",
      text: `for ${targetLabel}, i’d start with ${topOption?.name ?? "the strongest-ranked class"}.\n\nwhy i’m leaning there: ${topOption?.fitReason ?? planner.recommendation}\n\nwhy i’m not leading with the others:\n${ranked
        .slice(1)
        .map((item) => `- ${item.name}: ${item.limitReason}`)
        .join("\n")}\n\nfirst move: ${distinctMove}`,
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  if (normalized.includes("risk")) {
    return {
      role: "assistant",
      text: `biggest things i’d de-risk first:\n${planner.risks
        .map((item, index) => `${index + 1}. ${item}`)
        .join("\n")}\n\nright now i’d rank the strategy options like this:\n${rankingText}`,
      sources: planner.evidence.slice(0, 3),
      options: quickReplies,
    };
  }

  if (normalized.includes("why")) {
    return {
      role: "assistant",
      text: `short answer: the ranking is being driven mostly by ${goalLabel} plus the biology implied by ${targetLabel}.\n\nright now the planner sees it like this:\n${comparisonText}\n\nmain watchout: ${primaryRisk}\n\nfirst move: ${distinctMove}`,
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
      text: `here’s the plan i’d use:\n${planner.plan
        .map((step, index) => `${index + 1}. ${step}`)
        .join("\n")}\n\nbest strategy order right now:\n${rankingText}`,
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
      text: `best current fit looks like ${best.name}.\n\npros:\n${best.pros
        .map((item) => `- ${item}`)
        .join("\n")}\n\ncons:\n${best.cons.map((item) => `- ${item}`).join("\n")}`,
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
      text: `${planner.recommendation}\n\nranking right now:\n${rankingText}\n\nmain watchout: ${primaryRisk}`,
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
    text: `here’s the clean read for ${targetLabel}.\n\nbest current fit: ${topOption?.name ?? ranked[0]?.name ?? "adc"}\nwhy: ${topOption?.fitReason ?? planner.recommendation}\n\nfull ranking right now:\n${rankingText}\n\nmain watchout: ${primaryRisk}\n\nfirst move: ${distinctMove}`,
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

function buildFigureSeed(state: PlannerState) {
  return `${state.modality || "conjugate"} design concept for ${state.target || "the selected target"}, ${state.goal || "clear therapeutic intent"}, ${state.linkerType || "linker logic to be defined"}, ${state.payloadClass || "payload to be defined"}`;
}

function inferStateFromText(text: string): Partial<PlannerState> {
  const normalized = text.toLowerCase();
  const inferred: Partial<PlannerState> = {};

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
  const rankingText = buildRankingText(planner.rankedOptions);
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

  const corrected = `best current fit: ${topOption.name}\nwhy: ${topOption.fitReason ?? topOption.summary}\n\nfull ranking right now:\n${rankingText}\n\nmain watchout: ${primaryRisk}\n\nfirst move: ${distinctMove}`;

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
  const [figurePrompt, setFigurePrompt] = useState("");
  const [figureStyle, setFigureStyle] = useState("scientific schematic");
  const [figureLoading, setFigureLoading] = useState(false);
  const [figureError, setFigureError] = useState("");
  const [figureUrl, setFigureUrl] = useState("");
  const [outputMode, setOutputMode] = useState("ranked suggestions");
  const [chatDerivedState, setChatDerivedState] = useState<Partial<PlannerState>>({});
  const [hasOutputInteraction, setHasOutputInteraction] = useState(false);
  const [isStreamingReply, setIsStreamingReply] = useState(false);
  const [chatPinnedToBottom, setChatPinnedToBottom] = useState(true);
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
  const { primaryRisk: displayRisk, distinctMove: displayFirstMove } = getDistinctRiskAndFirstMove(planner);
  const context = buildContext(effectivePlannerState);
  const quickPrompts = buildQuickPrompts(effectivePlannerState);
  const topPickText = !hasOutputInteraction ? "waiting for output interaction" : planner.rankedOptions[0]?.name ?? "need one real input";
  const topPickSummary = !hasOutputInteraction
    ? "ask for a recommendation and the planner will rank the full conjugate landscape here."
    : planner.signalCount < 2
      ? "early read only — the rank is tentative until the brief has a little more biology."
      : planner.rankedOptions[0]?.fitReason ?? "";
  const topRiskText = !hasOutputInteraction ? "this stays empty until you ask for output." : displayRisk;
  const firstMoveText = !hasOutputInteraction ? "once you ask a question, this turns into the first concrete next step." : displayFirstMove;

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chatLog));
  }, [chatLog]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FORM_KEY, JSON.stringify(plannerState));
  }, [plannerState]);

  useEffect(() => {
    if (!chatEndRef.current || !chatViewportRef.current) return;
    if (!chatPinnedToBottom) return;
    chatEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatLog, isStreamingReply, chatPinnedToBottom]);

  async function streamAssistantMessage(message: ChatMessage) {
    const token = ++streamTokenRef.current;
    setIsStreamingReply(true);
    setChatLog((prev) => [...prev, { role: "assistant", text: "", isStreaming: true }]);

    const streamStep = async (index: number): Promise<void> => {
      if (index > message.text.length) return;
      await new Promise((resolve) => window.setTimeout(resolve, 9));
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
      await streamStep(index + 1);
    };

    await streamStep(1);

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
    const assistantMsg = validateAssistantResponse(buildAssistantResponse(message, mergedState), mergedState);
    setHasOutputInteraction(true);
    setChatDerivedState((prev) => ({
      ...prev,
      ...inferredState,
    }));
    setChatLog((prev) => [...prev, userMsg]);
    await streamAssistantMessage(assistantMsg);
    setChatInput("");
  }

  async function handleOption(choice: string) {
    if (isStreamingReply) return;
    const userMsg: ChatMessage = { role: "user", text: choice };
    const assistantMsg = buildOptionReply(choice, effectivePlannerState);
    setHasOutputInteraction(true);
    setChatLog((prev) => [...prev, userMsg]);
    await streamAssistantMessage(assistantMsg);
  }

  function handleGenerateFigure() {
    if (!figurePrompt.trim()) return;
    setFigureLoading(true);
    setFigureError("");
    const stylePrompt =
      POLLINATIONS_STYLE_PROMPTS[figureStyle] ??
      POLLINATIONS_STYLE_PROMPTS["scientific schematic"];
    const composedPrompt = `${figurePrompt}. ${stylePrompt}. avoid watermarks, avoid extra paragraph text, avoid cluttered layout.`;
    setFigureUrl(
      `https://image.pollinations.ai/prompt/${encodeURIComponent(
        composedPrompt
      )}?model=flux&width=1280&height=896&seed=${Date.now()}&nologo=true`
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <NavbarContent justify="end" className="gap-4">
          {[
            { label: "home", href: "/" },
            { label: "vision", href: "/vision" },
            { label: "design", href: "/design" },
          ].map((item) => (
            <NavbarItem key={item.label}>
              <Link href={item.href} className="text-sm text-zinc-600">
                {item.label}
              </Link>
            </NavbarItem>
          ))}
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border border-sky-200 bg-sky-50/70">
              <CardBody className="gap-2 text-sm leading-7 text-zinc-700">
                <p className="font-semibold text-sky-900">input side</p>
                <p>
                  fill in the brief, choose the dropdowns, and add the real-world constraints you already know.
                </p>
              </CardBody>
            </Card>
            <Card className="border border-emerald-200 bg-emerald-50/70">
              <CardBody className="gap-2 text-sm leading-7 text-zinc-700">
                <p className="font-semibold text-emerald-900">output side</p>
                <p>
                  the planner ranks the most believable strategies, shows the risks, and lays out what to do next.
                </p>
              </CardBody>
            </Card>
          </div>
        </motion.section>

        <section className="grid gap-6 xl:grid-cols-[1fr,0.95fr]">
          <div className="rounded-[2rem] border border-sky-200/80 bg-sky-50/50 p-3 shadow-[0_10px_30px_rgba(14,165,233,0.06)]">
          <Card className="border border-sky-100 bg-white/85">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                input
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                tell the planner what you care about
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-5">
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

              <Accordion variant="splitted" className="px-0">
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

              <Card className="border border-sky-200 bg-sky-50/70">
                <CardBody className="grid gap-3 text-sm text-sky-900">
                  <p className="font-semibold">current read</p>
                  <p>{planner.summary}</p>
                  <div className="flex flex-wrap gap-2 text-xs text-sky-700">
                    {context ? (
                      context.split(" | ").map((item) => (
                        <Chip key={item} size="sm" className="border border-sky-200 bg-white/80 text-sky-700">
                          {item}
                        </Chip>
                      ))
                    ) : (
                      <Chip size="sm" className="border border-sky-200 bg-white/80 text-sky-700">
                        add a few selections and this summary gets sharper
                      </Chip>
                    )}
                  </div>
                </CardBody>
              </Card>
            </CardBody>
          </Card>
          </div>

          <div className="rounded-[2rem] border border-emerald-200/80 bg-emerald-50/45 p-3 shadow-[0_10px_30px_rgba(16,185,129,0.06)]">
          <Card className="border border-emerald-100 bg-white/88">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                output
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                chat with the planner
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="flex h-full flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="border border-emerald-200 bg-emerald-50/70">
                  <CardBody className="gap-1 py-4 text-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">top pick</p>
                    <p className="font-semibold text-zinc-900">{topPickText}</p>
                    <p className="text-xs leading-6 text-zinc-500">{topPickSummary}</p>
                  </CardBody>
                </Card>
                <Card className="border border-amber-200 bg-amber-50/70">
                  <CardBody className="gap-1 py-4 text-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-amber-700">biggest risk</p>
                    <p className="font-semibold text-zinc-900">{topRiskText}</p>
                  </CardBody>
                </Card>
                <Card className="border border-blue-200 bg-blue-50/70">
                  <CardBody className="gap-1 py-4 text-sm">
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-700">first move</p>
                    <p className="font-semibold text-zinc-900">{firstMoveText}</p>
                  </CardBody>
                </Card>
              </div>
              <div className="rounded-[1.5rem] border border-white/70 bg-white/60 p-3">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs text-zinc-500">
                  <span>conversation</span>
                  <span>{isStreamingReply ? "thinking..." : "ready"}</span>
                </div>
                <div
                  ref={chatViewportRef}
                  className="flex h-[26rem] flex-col gap-3 overflow-y-auto pr-1"
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
                    className={`rounded-2xl px-4 py-3 text-sm leading-7 ${
                      msg.role === "user"
                        ? "self-end bg-sky-100 text-sky-900"
                        : "border border-white/80 bg-white text-zinc-700"
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
                    <p className="whitespace-pre-line">{msg.text || (msg.isStreaming ? "thinking through the best fit..." : "")}</p>
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

              <div className="mt-auto rounded-[1.5rem] border border-sky-100 bg-white p-3 shadow-[0_10px_25px_rgba(14,165,233,0.04)]">
              <Textarea
                label="message the planner"
                labelPlacement="outside"
                placeholder="e.g. what would you actually build for this target if i care more about safety than bystander effect?"
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
                    setChatLog([defaultAssistantMessage]);
                    setChatInput("");
                    setFigurePrompt("");
                    setFigureUrl("");
                    setFigureError("");
                    setFigureLoading(false);
                    setChatDerivedState({});
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
          </div>
        </section>

        {hasOutputInteraction ? (
        <>
        <section className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
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
                    <p className="mt-2">{planner.recommendation}</p>
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
              {outputMode === "ranked suggestions" ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {planner.rankedOptions.map((item) => (
                    <Card key={item.name} className={`border bg-white/90 ${
                      item.rank === 1
                        ? "border-emerald-200"
                        : item.rank === 2
                        ? "border-sky-200"
                        : "border-slate-200"
                    }`}>
                      <CardBody className="gap-3 text-sm leading-7 text-zinc-600">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-zinc-900">{item.name}</p>
                          <Chip className="border border-sky-200 bg-sky-50 text-sky-700">
                            rank {item.rank}
                          </Chip>
                        </div>
                        <p>{item.summary}</p>
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                            why it fits
                          </p>
                          <p className="mt-1 text-zinc-700">{item.fitReason ?? item.summary}</p>
                        </div>
                        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                            why it may not
                          </p>
                          <p className="mt-1 text-zinc-700">{item.limitReason ?? item.cons[0]}</p>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {planner.rankedOptions.map((item) => (
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
              <div className="grid gap-4 md:grid-cols-2">
                {planner.decisionSignals.map((item) => (
                  <Card key={item.title} className="border border-blue-100 bg-blue-50/70">
                    <CardBody className="gap-2 text-sm leading-7 text-zinc-700">
                      <p className="font-semibold text-zinc-900">{item.title}</p>
                      <p>{item.body}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
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
                {planner.risks.map((risk, index) => (
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
                {planner.plan.map((step, index) => (
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

        <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
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
        </section>

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
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {planner.evidence.map((item) => (
              <Card key={item.label} className="border border-white/80 bg-white/85">
                <CardBody className="gap-3 text-sm leading-7 text-zinc-600">
                  <p className="font-semibold text-zinc-900">{item.label}</p>
                  <p>{item.why}</p>
                  <Chip className="w-fit border border-slate-200 bg-slate-50 text-slate-700">
                    {item.type}
                  </Chip>
                </CardBody>
              </Card>
            ))}
          </CardBody>
        </Card>
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

        <Card className="border border-white/80 bg-white/75">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              figure studio
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
              turn the strategy into a visual concept
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="grid gap-4">
              <p className="text-sm text-zinc-600">
                this is still the quick no-key figure lane. use it once the strategy above
                feels right and we want a rough concept image for a mechanism, chapter hero,
                or schematic direction.
              </p>
              <Textarea
                label="figure prompt"
                labelPlacement="outside"
                placeholder="e.g. clean scientific schematic of a psma radioligand with ligand, chelator, lu-177 payload, tumor binding, internalization, and kidney uptake caution"
                value={figurePrompt}
                onValueChange={setFigurePrompt}
                minRows={5}
              />
              <Select
                label="visual style"
                labelPlacement="outside"
                selectedKeys={[figureStyle]}
                onSelectionChange={(keys) =>
                  setFigureStyle(Array.from(keys)[0]?.toString() || "scientific schematic")
                }
              >
                {[
                  "scientific schematic",
                  "mechanism flow",
                  "hero illustration",
                ].map((item) => (
                  <SelectItem key={item}>{item}</SelectItem>
                ))}
              </Select>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-sky-600 text-white"
                  radius="full"
                  isLoading={figureLoading}
                  onPress={handleGenerateFigure}
                >
                  generate figure
                </Button>
                <Button
                  variant="bordered"
                  radius="full"
                  className="border-sky-200 text-sky-700"
                  onPress={() => setFigurePrompt(buildFigureSeed(plannerState))}
                >
                  build from current strategy
                </Button>
              </div>
              <p className="text-xs leading-6 text-zinc-500">
                this is still image-generation, not literature search. it’s best for rough
                visual direction after we’ve already chosen the scientific path.
              </p>
              {figureError ? (
                <Card className="border border-rose-200 bg-rose-50">
                  <CardBody className="text-sm text-rose-700">{figureError}</CardBody>
                </Card>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
              {figureUrl ? (
                <div className="grid gap-3">
                  <Image
                    src={figureUrl}
                    alt="Generated conjugate concept figure"
                    className="w-full rounded-[1rem] object-cover"
                    onLoad={() => {
                      setFigureLoading(false);
                      setFigureError("");
                    }}
                    onError={() => {
                      setFigureLoading(false);
                      setFigureError(
                        "the no-key image endpoint didn’t return an image this time. try again or tweak the prompt."
                      );
                    }}
                  />
                  <p className="text-sm text-zinc-500">
                    rough concept image generated from your prompt. tweak the wording if the
                    first pass misses the science or the vibe.
                  </p>
                </div>
              ) : (
                <div className="flex min-h-[24rem] items-center justify-center rounded-[1rem] border border-dashed border-sky-200 bg-sky-50/50 p-6 text-center text-sm leading-7 text-zinc-500">
                  {figureLoading
                    ? "loading your figure now..."
                    : "generated figures will show up here once you run the studio."}
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
