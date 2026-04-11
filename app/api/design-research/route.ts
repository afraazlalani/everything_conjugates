import { NextRequest, NextResponse } from "next/server";

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

type RankedOption = {
  name: string;
  rank: number;
  summary: string;
  fitReason: string;
  limitReason: string;
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
  type: "approved product" | "clinical candidate" | "company/platform precedent" | "official anchor";
};

type MatrixCategory =
  | "biology fit"
  | "delivery fit"
  | "release fit"
  | "safety fit"
  | "precedent fit";

type MatrixCell = {
  category: MatrixCategory;
  score: number;
  reason: string;
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
      why: "approved peptide-directed radioligand precedent showing how peptide vectors can work clinically.",
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

function makeBaseScores(prompt: string, state: PlannerState) {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.idea ?? ""} ${state.goal ?? ""} ${state.payloadClass ?? ""} ${state.releaseGoal ?? ""}`);
  const scores: Record<(typeof MODALITY_ORDER)[number], number> = {
    adc: 0,
    pdc: 0,
    smdc: 0,
    "oligo conjugate": 0,
    rdc: 0,
    "enzyme conjugate": 0,
  };

  const bump = (key: keyof typeof scores, amount: number) => {
    scores[key] += amount;
  };

  const strongOligoCue = /(duchenne|dmd|muscular dystrophy|exon skipping|splice switching|antisense|sirna|aso|pmo|gene modulation|knockdown)/.test(text);
  const strongRadioligandCue = /(radionuclide|radioligand|radiotherapy|theranostic|lu-177|lutetium|actinium|ac-225|y-90|yttrium)/.test(text);
  const strongCytotoxicCue = /(cytotoxic|tumor kill|cell kill|microtubule|mmae|dm1|sn-38|exatecan|duocarmycin|pbd)/.test(text);
  const strongEnzymeCue = /(enzyme|prodrug|catalytic|activation)/.test(text);

  if (strongOligoCue) {
    bump("oligo conjugate", 16);
    bump("adc", -8);
    bump("pdc", -4);
    bump("smdc", -5);
    bump("rdc", -8);
    bump("enzyme conjugate", -5);
  }

  if (strongRadioligandCue) {
    bump("rdc", 16);
    bump("smdc", 3);
    bump("oligo conjugate", -8);
    bump("enzyme conjugate", -4);
  }

  if (strongCytotoxicCue) {
    bump("adc", 8);
    bump("pdc", 5);
    bump("smdc", 5);
    bump("oligo conjugate", -6);
  }

  if (/(small molecule ligand|folate|psma|caix|fap|acetazolamide|integrin|small molecule)/.test(text)) {
    bump("smdc", 7);
    bump("rdc", 3);
  }

  if (/(peptide|rgd|somatostatin|octreotide|cyclic peptide)/.test(text)) {
    bump("pdc", 8);
    bump("rdc", 3);
  }

  if (strongEnzymeCue) {
    bump("enzyme conjugate", 12);
    bump("oligo conjugate", -3);
    bump("rdc", -3);
  }

  if (/(prostate|psma)/.test(text)) {
    bump("rdc", 7);
    bump("smdc", 4);
  }

  if (/(ovarian|frα|folate receptor|fralpha)/.test(text)) {
    bump("smdc", 5);
    bump("adc", 3);
  }

  if (/(egfr|her2|trop2|mesothelin|surface receptor|tumor antigen)/.test(text)) {
    bump("adc", 4);
  }

  if (/(better tissue penetration|compact|smaller carrier)/.test(text)) {
    bump("smdc", 4);
    bump("pdc", 4);
    bump("adc", -1);
  }

  if (strongOligoCue && !strongRadioligandCue && !strongCytotoxicCue) {
    bump("oligo conjugate", 8);
    bump("adc", -6);
    bump("rdc", -8);
    bump("enzyme conjugate", -4);
  }

  if (strongRadioligandCue && !strongOligoCue) {
    bump("rdc", 8);
    bump("adc", -3);
    bump("oligo conjugate", -6);
  }

  if (state.modality) {
    const chosen = normalize(state.modality);
    if (chosen === "oligo") bump("oligo conjugate", 10);
    if (chosen === "adc") bump("adc", 10);
    if (chosen === "pdc") bump("pdc", 10);
    if (chosen === "smdc") bump("smdc", 10);
    if (chosen === "rdc") bump("rdc", 10);
    if (chosen === "enzyme") bump("enzyme conjugate", 10);
  }

  return scores;
}

function buildLimitReason(
  modality: (typeof MODALITY_ORDER)[number],
  prompt: string,
  state: PlannerState,
  fallback: string,
) {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.goal ?? ""} ${state.payloadClass ?? ""}`);

  if (/(duchenne|dmd|muscular dystrophy|exon skipping|splice switching|antisense|sirna|aso|pmo|gene modulation|knockdown)/.test(text)) {
    if (modality === "rdc") {
      return "weak fit because duchenne is usually a gene-modulation problem, not a radiobiology problem.";
    }
    if (modality === "adc") {
      return "weak fit because duchenne does not usually call for intracellular cytotoxic payload release from an antibody carrier.";
    }
    if (modality === "smdc") {
      return "weak fit because the core therapeutic event is usually oligo-mediated exon skipping or knockdown, not a small-molecule payload story.";
    }
  }

  if (/(radionuclide|radioligand|radiotherapy|theranostic|lu-177|lutetium|actinium|ac-225|y-90|yttrium)/.test(text)) {
    if (modality === "oligo conjugate") {
      return "weak fit because the active payload logic here is radiometal delivery, not rna-directed modulation.";
    }
  }

  return fallback;
}

async function searchEuropePmc(query: string) {
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=3&sort=RELEVANCE`;
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
    hitCount: typeof data.hitCount === "number" ? data.hitCount : 0,
    results: data.resultList?.result ?? [],
  };
}

async function searchPubMedReviews(query: string) {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&sort=relevance&retmax=3&term=${encodeURIComponent(`${query} AND review[pt]`)}`;
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

function buildPrecedentSources(
  topModality: (typeof MODALITY_ORDER)[number],
  prompt: string,
  state: PlannerState,
  trialResults: ClinicalTrialResult[],
): PrecedentSource[] {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.goal ?? ""} ${state.idea ?? ""}`);
  const precedents: PrecedentSource[] = [];

  trialResults.slice(0, 2).forEach((trial) => {
    precedents.push({
      label: `${trial.briefTitle} (${trial.nctId})`,
      href: `https://clinicaltrials.gov/study/${trial.nctId}`,
      why: `live clinical-trial precedent tied to this prompt through ${trial.condition || "the disease setting"} and ${trial.intervention || "the intervention design"}.`,
      type: "clinical candidate",
    });
  });

  if (topModality === "oligo conjugate" && /(duchenne|dmd|muscular dystrophy)/.test(text)) {
    precedents.unshift(
      {
        label: "Exondys 51 FDA approval",
        href: "https://www.fda.gov/drugs/drug-safety-and-availability/fda-grants-accelerated-approval-first-drug-duchenne-muscular-dystrophy",
        why: "disease-specific approved exon-skipping precedent for duchenne muscular dystrophy.",
        type: "approved product",
      },
      {
        label: "SRP-5051 / peptide-conjugated PMO clinical record",
        href: "https://clinicaltrials.gov/study/NCT05039710",
        why: "disease-specific clinical precedent showing why conjugated oligo delivery is the relevant architecture family in duchenne.",
        type: "clinical candidate",
      },
    );
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

  return [...precedents, ...(APPROVAL_ANCHORS[topModality] ?? [])].slice(0, 4);
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

function buildRecommendationText(
  top: RankedOption,
  ranking: RankedOption[],
  riskMove: ReturnType<typeof buildRiskAndMove>,
  sources: EvidenceSource[],
) {
  const rankingText = ranking
    .map(
      (item) =>
        `${item.rank}. ${item.name}\nwhy it fits: ${item.fitReason}\nbest evidence for: ${item.bestEvidenceFor ?? item.fitReason}\nmain reason against: ${item.mainReasonAgainst ?? item.limitReason}\nwhat would have to be true for this to win: ${item.whatMustBeTrue ?? "the remaining biology and delivery assumptions would have to hold."}`,
    )
    .join("\n\n");

  return {
    text: `best current fit\n${top.name}\n\nwhy this is leading\n${top.fitReason}\n\nfull ranking\n${rankingText}\n\nmain watchout\n${riskMove.biggestRisk}\n\nfirst move\n${riskMove.firstMove}`,
    sources,
  };
}

function buildTopPickWhy(top: RankedOption, validationPasses: ValidationPass[]) {
  const softNote = validationPasses.some((pass) => !pass.passed && pass.name === "source support sanity")
    ? " confidence is softer than usual because direct support is still thin."
    : "";
  return `${top.fitReason} ${top.bestEvidenceFor ?? ""}${softNote}`.trim();
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
  matrix: ReturnType<typeof buildMatrix>,
) {
  return ranking.map((item) => {
    const row = matrix.find((entry) => entry.modality === item.name);
    if (!row) return item;

    const strongestCell = row.cells.slice().sort((a, b) => b.score - a.score)[0];
    const weakestCell = row.cells.slice().sort((a, b) => a.score - b.score)[0];

    return {
      ...item,
      bestEvidenceFor: strongestCell ? categoryWinLine(strongestCell) : item.fitReason,
      mainReasonAgainst: weakestCell ? categoryAgainstLine(weakestCell, item.name as (typeof MODALITY_ORDER)[number]) : item.limitReason,
      whatMustBeTrue: weakestCell ? categoryMustBeTrueLine(weakestCell, item.name as (typeof MODALITY_ORDER)[number]) : "the missing assumptions would have to hold in real biology.",
    };
  });
}

function inferDominantMechanismCue(prompt: string, state: PlannerState) {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.goal ?? ""} ${state.payloadClass ?? ""} ${state.releaseGoal ?? ""}`);
  if (/(duchenne|dmd|muscular dystrophy|exon skipping|splice switching|antisense|sirna|aso|pmo|gene modulation|knockdown)/.test(text)) {
    return "oligo conjugate" as const;
  }
  if (/(radionuclide|radioligand|radiotherapy|theranostic|lu-177|lutetium|actinium|ac-225|y-90|yttrium)/.test(text)) {
    return "rdc" as const;
  }
  if (/(enzyme|prodrug|catalytic|activation)/.test(text)) {
    return "enzyme conjugate" as const;
  }
  if (/(small molecule ligand|folate|psma|caix|fap|acetazolamide)/.test(text)) {
    return "smdc" as const;
  }
  if (/(peptide|rgd|somatostatin|octreotide|cyclic peptide)/.test(text)) {
    return "pdc" as const;
  }
  if (/(cytotoxic|tumor kill|cell kill|microtubule|mmae|dm1|sn-38|exatecan|duocarmycin|pbd)/.test(text)) {
    return "adc" as const;
  }
  return null;
}

function validateAndStabilizeResult(
  prompt: string,
  state: PlannerState,
  ranking: RankedOption[],
  matrix: ReturnType<typeof buildMatrix>,
  sources: EvidenceSource[],
) {
  let nextRanking = ranking.slice();
  const validationPasses: ValidationPass[] = [];

  const matrixWinner = matrix[0]?.modality;
  const matrixAligned = !matrixWinner || nextRanking[0]?.name === matrixWinner;
  if (!matrixAligned && matrixWinner) {
    nextRanking = nextRanking
      .slice()
      .sort((a, b) => {
        if (a.name === matrixWinner) return -1;
        if (b.name === matrixWinner) return 1;
        return a.rank - b.rank;
      })
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }
  validationPasses.push({
    name: "matrix consistency",
    passed: Boolean(matrixAligned),
    note: matrixAligned
      ? "the winner already matched the strongest overall matrix score."
      : "the ranking was realigned to the strongest matrix-supported winner.",
  });

  const dominantCue = inferDominantMechanismCue(prompt, state);
  const cueAligned = !dominantCue || nextRanking[0]?.name === dominantCue;
  if (!cueAligned && dominantCue) {
    nextRanking = nextRanking
      .slice()
      .sort((a, b) => {
        if (a.name === dominantCue) return -1;
        if (b.name === dominantCue) return 1;
        return a.rank - b.rank;
      })
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }
  validationPasses.push({
    name: "prompt-mechanism fit",
    passed: Boolean(cueAligned),
    note: cueAligned
      ? "the winner already matched the dominant mechanism cue in the prompt."
      : "the ranking was corrected to respect the dominant mechanism cue in the prompt.",
  });

  if (dominantCue) {
    const compatibleRows = matrix.filter((row) => (row.cells.find((cell) => cell.category === "biology fit")?.score ?? -99) >= 0);
    const compatibleSet = new Set<(typeof MODALITY_ORDER)[number]>(compatibleRows.map((row) => row.modality));
    nextRanking = nextRanking
      .slice()
      .sort((a, b) => {
        const aCompatible = compatibleSet.has(a.name as (typeof MODALITY_ORDER)[number]);
        const bCompatible = compatibleSet.has(b.name as (typeof MODALITY_ORDER)[number]);
        if (aCompatible !== bCompatible) return aCompatible ? -1 : 1;
        return a.rank - b.rank;
      })
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  const top = nextRanking[0];
  const topHasSourceSupport = sources.some((source) => (source.why ?? "").toLowerCase().includes(top?.name ?? ""));
  const sourceSupportPassed = topHasSourceSupport || sources.length >= 2;
  validationPasses.push({
    name: "source support sanity",
    passed: sourceSupportPassed,
    note: sourceSupportPassed
      ? "the current winner has enough direct support to answer with normal confidence."
      : "direct support is thin, so the answer should stay softer and more conditional.",
  });

  return {
    ranking: nextRanking,
    validationPasses,
  };
}

function buildMatrix(prompt: string, state: PlannerState, literatureResults: Array<{ modality: (typeof MODALITY_ORDER)[number]; europePmc: Awaited<ReturnType<typeof searchEuropePmc>> }>) {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.goal ?? ""} ${state.payloadClass ?? ""} ${state.releaseGoal ?? ""}`);
  const strongOligoCue = /(duchenne|dmd|muscular dystrophy|exon skipping|splice switching|antisense|sirna|aso|pmo|gene modulation|knockdown)/.test(text);
  const strongRadioligandCue = /(radionuclide|radioligand|radiotherapy|theranostic|lu-177|lutetium|actinium|ac-225|y-90|yttrium)/.test(text);
  const strongCytotoxicCue = /(cytotoxic|tumor kill|cell kill|microtubule|mmae|dm1|sn-38|exatecan|duocarmycin|pbd)/.test(text);
  const strongEnzymeCue = /(enzyme|prodrug|catalytic|activation)/.test(text);
  const compactCue = /(better tissue penetration|compact|smaller carrier|small molecule ligand|folate|psma|caix|fap|acetazolamide)/.test(text);

  const buildCell = (
    category: MatrixCategory,
    score: number,
    reason: string,
  ): MatrixCell => ({ category, score, reason });

  return MODALITY_ORDER.map((modality) => {
    const literature = literatureResults.find((item) => item.modality === modality)?.europePmc ?? { hitCount: 0, results: [] };
    const literatureStrength = computeLiteratureBoost(buildTopic(prompt, state), literature.results);
    let cells: MatrixCell[] = [];

    if (modality === "oligo conjugate") {
      cells = [
        buildCell("biology fit", strongOligoCue ? 3 : strongRadioligandCue || strongCytotoxicCue ? -2 : 0, strongOligoCue ? "the prompt points to gene modulation or splice biology, which is exactly where oligo conjugates belong." : "oligo only makes sense when the active biology is really rna-directed."),
        buildCell("delivery fit", strongOligoCue ? 2 : 0, "delivery is hard here, but the class is built for scaffold-specific intracellular routing rather than free-warhead release."),
        buildCell("release fit", strongOligoCue ? 3 : -1, "oligo programs usually want preserved scaffold function, not a classical free-payload release event."),
        buildCell("safety fit", strongOligoCue ? 2 : 0, "when the disease really wants gene modulation, oligo can be more mechanism-matched than cytotoxic platforms."),
        buildCell("precedent fit", literatureStrength > 0 ? Math.min(Math.round(literatureStrength), 3) : 0, "public literature support exists when the disease or payload logic already lives in the oligo world."),
      ];
    } else if (modality === "rdc") {
      cells = [
        buildCell("biology fit", strongRadioligandCue ? 3 : strongOligoCue ? -3 : 0, strongRadioligandCue ? "the prompt is explicitly about radiometal or radioligand logic." : "rdc is weak when the biology is gene modulation rather than radiobiology."),
        buildCell("delivery fit", strongRadioligandCue || compactCue ? 2 : 0, "rdcs care most about localization and chelator/isotope fit, not classical payload release."),
        buildCell("release fit", strongRadioligandCue ? 3 : strongOligoCue ? -2 : 0, "the active species is the isotope-chelator system, which only fits a radioligand-style prompt."),
        buildCell("safety fit", strongRadioligandCue ? 1 : strongOligoCue ? -2 : 0, "organ dosimetry becomes central, so this is a poor fallback for non-radioligand problems."),
        buildCell("precedent fit", literatureStrength > 0 ? Math.min(Math.round(literatureStrength), 3) : 0, "literature support matters here, but it should not override a clear mechanism mismatch."),
      ];
    } else if (modality === "adc") {
      cells = [
        buildCell("biology fit", strongCytotoxicCue ? 3 : strongOligoCue || strongRadioligandCue ? -3 : 1, strongCytotoxicCue ? "adc fits when the desired biology is intracellular cytotoxic payload delivery." : "adc is weak when the prompt is really about oligo or radioligand logic."),
        buildCell("delivery fit", compactCue ? -1 : 2, "adc buys exposure and carrier support, but loses points when compact penetration is the main need."),
        buildCell("release fit", strongCytotoxicCue ? 3 : strongOligoCue ? -3 : 1, "adc only fits when a classical released-warhead story makes sense."),
        buildCell("safety fit", strongCytotoxicCue ? 1 : strongOligoCue ? -2 : 0, "adc safety depends heavily on the target window and released-species behavior."),
        buildCell("precedent fit", literatureStrength > 0 ? Math.min(Math.round(literatureStrength), 3) : 1, "adc has broad precedent, but precedent alone should not win the wrong biological question."),
      ];
    } else if (modality === "pdc") {
      cells = [
        buildCell("biology fit", strongCytotoxicCue ? 2 : strongOligoCue ? -1 : compactCue ? 2 : 0, "pdc is a middle-ground class that only makes sense if peptide targeting adds something real."),
        buildCell("delivery fit", compactCue ? 2 : 1, "pdc can help when you want a smaller carrier than adc without going fully ligand-first."),
        buildCell("release fit", strongOligoCue ? -1 : strongRadioligandCue ? 0 : 1, "pdc usually still lives in a linker-plus-payload world, not an oligo or radioligand-first world."),
        buildCell("safety fit", 0, "safety depends heavily on peptide stability and whether payload load breaks the binder."),
        buildCell("precedent fit", literatureStrength > 0 ? Math.min(Math.round(literatureStrength), 2) : 0, "pdc precedent exists, but it is still much thinner than adc or major oligo/radioligand playbooks."),
      ];
    } else if (modality === "smdc") {
      cells = [
        buildCell("biology fit", compactCue ? 3 : strongOligoCue ? -2 : strongCytotoxicCue ? 1 : 0, "smdc only wins when a true small-molecule ligand and compact pharmacology are the point."),
        buildCell("delivery fit", compactCue ? 3 : 0, "smdc gets rewarded most when compact size and tissue movement are genuine advantages."),
        buildCell("release fit", strongOligoCue ? -2 : strongRadioligandCue ? 1 : 1, "smdc can carry cleavable or stable logic, but it is still a small-molecule payload platform."),
        buildCell("safety fit", compactCue ? 1 : 0, "safety often gets pressured by kidney handling and ligand disruption rather than by carrier bulk."),
        buildCell("precedent fit", literatureStrength > 0 ? Math.min(Math.round(literatureStrength), 3) : 0, "precedent helps only if the actual ligand or target class belongs in smdc territory."),
      ];
    } else {
      cells = [
        buildCell("biology fit", strongEnzymeCue ? 3 : strongOligoCue || strongRadioligandCue ? -2 : 0, "enzyme conjugates only fit when local catalysis or prodrug activation is the real selectivity engine."),
        buildCell("delivery fit", strongEnzymeCue ? 1 : 0, "delivery matters here, but catalytic competence matters just as much."),
        buildCell("release fit", strongEnzymeCue ? 2 : strongOligoCue ? -2 : 0, "the key event is activation or catalysis, not a standard payload release story."),
        buildCell("safety fit", strongEnzymeCue ? 0 : -1, "background activation can break the whole concept quickly."),
        buildCell("precedent fit", literatureStrength > 0 ? Math.min(Math.round(literatureStrength), 2) : 0, "there is precedent, but it is much more conditional than the larger platform families."),
      ];
    }

    return {
      modality,
      total: cells.reduce((sum, cell) => sum + cell.score, 0),
      cells,
    };
  }).sort((a, b) => b.total - a.total);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      state?: PlannerState;
    };

    const prompt = body.prompt?.trim() ?? "";
    const state = body.state ?? {};

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const topic = buildTopic(prompt, state);
    const baseScores = makeBaseScores(prompt, state);

    const literatureResults = await Promise.all(
      MODALITY_ORDER.map(async (modality) => {
        const query = `${topic} AND (${MODALITY_QUERIES[modality].join(" OR ")})`;
        try {
          const europePmc = await searchEuropePmc(query);
          return { modality, europePmc };
        } catch {
          return { modality, europePmc: { hitCount: 0, results: [] } };
        }
      }),
    );

    const scored = MODALITY_ORDER.map((modality) => {
      const literature = literatureResults.find((item) => item.modality === modality)?.europePmc;
      const literatureBoost = literature ? computeLiteratureBoost(topic, literature.results) : 0;
      return {
        modality,
        score: baseScores[modality] + literatureBoost,
        literature: literature ?? { hitCount: 0, results: [] },
      };
    }).sort((a, b) => b.score - a.score);

    const matrix = buildMatrix(prompt, state, literatureResults);

    const rawRanking = scored.map((item, index) => ({
      rank: index + 1,
      ...OPTION_MAP[item.modality],
      limitReason: buildLimitReason(
        item.modality,
        prompt,
        state,
        OPTION_MAP[item.modality].limitReason,
      ),
    }));

    const enrichedRanking = enrichRankingWithMatrix(rawRanking, matrix);
    const validated = validateAndStabilizeResult(prompt, state, enrichedRanking, matrix, []);
    const ranking = validated.ranking;
    const top = ranking[0];
    const topLiterature = scored.find((item) => item.modality === top.name)?.literature ?? { hitCount: 0, results: [] };
    const pubmed = await searchPubMedReviews(`${topic} ${MODALITY_QUERIES[top.name as (typeof MODALITY_ORDER)[number]]?.[0] ?? ""}`).catch(
      () => [],
    );
    const clinicalTrials = await searchClinicalTrials(
      `${topic} ${MODALITY_QUERIES[top.name as (typeof MODALITY_ORDER)[number]]?.[0] ?? ""}`,
    ).catch(() => []);
    const literatureSources = buildSources(top.name as (typeof MODALITY_ORDER)[number], topLiterature, pubmed);
    const precedentSources = buildPrecedentSources(top.name as (typeof MODALITY_ORDER)[number], prompt, state, clinicalTrials);
    const sources = [...precedentSources, ...literatureSources].slice(0, 6);
    const revalidated = validateAndStabilizeResult(prompt, state, ranking, matrix, sources);
    const finalRanking = revalidated.ranking;
    const finalTop = finalRanking[0];
    const riskMove = buildRiskAndMove(finalTop.name as (typeof MODALITY_ORDER)[number]);
    const recommendation = buildRecommendationText(finalTop, finalRanking, riskMove, sources);

    return NextResponse.json({
      topPick: finalTop.name,
      topPickWhy: buildTopPickWhy(finalTop, revalidated.validationPasses),
      biggestRisk: riskMove.biggestRisk,
      firstMove: riskMove.firstMove,
      nextSteps: riskMove.nextSteps,
      ranking: finalRanking,
      matrix,
      sources,
      text: recommendation.text,
      summary: finalTop.summary,
      topic,
      validationPasses: revalidated.validationPasses,
    });
  } catch {
    return NextResponse.json(
      { error: "design research failed" },
      { status: 502 },
    );
  }
}
