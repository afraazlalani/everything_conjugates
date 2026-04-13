import { NextRequest, NextResponse } from "next/server";
import { assessConfidence } from "@/lib/design-research/confidence";
import { buildEvidenceObjects, buildThemeDiagnostics } from "@/lib/design-research/evidence-builder";
import { DISEASE_MECHANISM_PROFILES } from "@/lib/design-research/config";
import { buildDiseaseGrounding } from "@/lib/design-research/disease-grounding";
import { buildDiseaseBiologyQueries } from "@/lib/design-research/disease-biology";
import { inferMechanismFromEvidence } from "@/lib/design-research/mechanism-inference";
import { parseConjugateQuery } from "@/lib/design-research/parser";
import { normalizeConjugateCase } from "@/lib/design-research/normalizer";
import { evaluateMechanisticGates } from "@/lib/design-research/mechanistic-gates";
import { scoreModalities } from "@/lib/design-research/scorer";
import { buildWhyNotResults } from "@/lib/design-research/why-not-engine";
import type { DiseaseGrounding, EvidenceObject, PlannerTrace as PipelineTrace, RetrievedSourceBucket } from "@/lib/design-research/types";

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
  title: string;
  rationale: string;
  whatMustChange: string;
  whyNotDefault: string;
  sourceLabels: string[];
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

async function searchEuropePmc(query: string, pageSize = 3) {
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
    hitCount: typeof data.hitCount === "number" ? data.hitCount : 0,
    results: data.resultList?.result ?? [],
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
    query: string;
    europePmc: Awaited<ReturnType<typeof searchEuropePmc>>;
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
    item.europePmc.results.slice(0, 1).map((result) => ({
      label: result.title || "disease biology literature hit",
      href: result.pmid
        ? `https://pubmed.ncbi.nlm.nih.gov/${result.pmid}/`
        : result.doi
          ? `https://doi.org/${result.doi}`
          : undefined,
      snippet: `retrieved via: ${item.query}`,
      sourceType: "biology paper" as const,
    })),
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

  if (topModality === "oligo conjugate" && /(duchenne|dmd)/.test(text)) {
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

  if (topModality === "oligo conjugate" && DM1_CUE.test(text)) {
    precedents.unshift(
      {
        label: "AOC 1001 / delpacibart etedesiran clinical record",
        href: "https://clinicaltrials.gov/study/NCT05479981",
        why: "disease-specific clinical precedent showing why conjugated oligo delivery is a serious architecture family in myotonic dystrophy type 1.",
        type: "clinical candidate",
      },
      {
        label: "myotonic dystrophy type 1 antisense review",
        href: "https://pubmed.ncbi.nlm.nih.gov/39126099/",
        why: "review-level disease anchor for why toxic-rna correction and splice rescue drive the therapeutic logic in dm1.",
        type: "company/platform precedent",
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

function buildRecommendationText(
  prompt: string,
  top: RankedOption,
  ranking: RankedOption[],
  matrix: MatrixSummaryRow[],
  riskMove: ReturnType<typeof buildRiskAndMove>,
  sources: EvidenceSource[],
) {
  const matrixMap = new Map(matrix.map((row) => [row.modality.toLowerCase().trim(), row]));
  const normalizedPrompt = normalize(prompt);
  const askedWhyNot = MODALITY_ORDER.find((modality) =>
    normalizedPrompt.includes(`why not ${modality}`) ||
    normalizedPrompt.includes(`not ${modality}`) ||
    normalizedPrompt.includes(`${modality} instead`)
  );
  const askedForBlueprint =
    /(what would you build|what should i build|what linker|which linker|what payload|which payload|what format|which format)/.test(
      normalizedPrompt
    );
  const feasible: RankedOption[] = [];
  const notViable: Array<{ item: RankedOption; reason: string; score?: number }> = [];
  const scoreOutOfTen = (total?: number) =>
    typeof total === "number" ? Math.max(0, Math.min(10, Math.round(((total + 15) / 30) * 10))) : undefined;

  for (const item of ranking) {
    const row = matrixMap.get(item.name.toLowerCase().trim());
    const biologyScore = row?.cells.find((cell) => cell.category === "biology fit")?.score ?? 0;
    const releaseScore = row?.cells.find((cell) => cell.category === "release fit")?.score ?? 0;
    const totalScore = row?.total ?? 0;
    const weakReason =
      item.mainReasonAgainst ??
      item.limitReason ??
      row?.cells.slice().sort((a, b) => a.score - b.score)[0]?.reason ??
      "the current biology and delivery cues do not support this class strongly enough.";

    if (biologyScore <= -2 || releaseScore <= -2 || totalScore < 1) {
      notViable.push({ item, reason: weakReason, score: row?.total });
    } else {
      feasible.push(item);
    }
  }

  if (!feasible.length && ranking.length) feasible.push(ranking[0]);

  const feasibleText = feasible
    .map(
      (item) =>
        `${item.rank}. ${item.name}\n${
          typeof scoreOutOfTen(matrixMap.get(item.name.toLowerCase().trim())?.total) === "number"
            ? `score: ${scoreOutOfTen(matrixMap.get(item.name.toLowerCase().trim())?.total)}/10\n`
            : ""
        }why it fits: ${item.fitReason}\nbest evidence for: ${item.bestEvidenceFor ?? item.fitReason}\nmain reason against: ${item.mainReasonAgainst ?? item.limitReason}\nwhat would have to be true for this to win: ${item.whatMustBeTrue ?? "the remaining biology and delivery assumptions would have to hold."}`,
    )
    .join("\n\n");

  const notViableText = notViable
    .map(
      ({ item, reason, score }) =>
        `${item.name}\n${typeof scoreOutOfTen(score) === "number" ? `score: ${scoreOutOfTen(score)}/10\n` : ""}why it drops out: ${reason}`,
    )
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

  const directAnswer = askedWhyNot && questionedOption
    ? `direct answer\n${questionedOption.name} is ${feasible.some((item) => item.name === questionedOption.name) ? "still viable, but not the best fit here" : "not a legitimate front-runner here"}.\n\nwhy not ${questionedOption.name}\n${questionedReason}\n\nwhy ${top.name} still leads\n${top.fitReason}`
    : askedForBlueprint
      ? `direct answer\nif i had to build first, i’d start with ${top.name}.\n\nwhy\n${top.fitReason}\n\nwhat this means\nuse the top-ranked targeting, linker, and payload logic underneath as the first construct blueprint.`
      : `direct answer\n${top.name} is the best current fit.\n\nwhy\n${top.fitReason}`;

  return {
    text: [
      directAnswer,
      `best current fit\n${top.name}`,
      `why this is leading\n${top.fitReason}`,
      feasibleText ? `feasible and worth ranking\n${feasibleText}` : "",
      notViableText ? `not really viable here\n${notViableText}` : "",
      `main watchout\n${riskMove.biggestRisk}`,
      `first move\n${riskMove.firstMove}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
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
  matrix: MatrixSummaryRow[],
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

function buildInnovativeIdeas(
  prompt: string,
  state: PlannerState,
  ranking: RankedOption[],
  matrix: MatrixSummaryRow[],
  sources: EvidenceSource[],
): InnovativeIdea[] {
  const text = normalize(`${prompt} ${state.target ?? ""} ${state.goal ?? ""} ${state.constraints ?? ""} ${state.mustHave ?? ""} ${state.avoid ?? ""}`);
  const top = ranking[0];
  if (!top) return [];

  const ideas: InnovativeIdea[] = [];
  const sourceLabels = sources.slice(0, 3).map((item) => item.label);

  if (
    top.name === "adc" &&
    /(penetration|solid tumor|heterogeneous|compact|smaller carrier|normal tissue|selectivity)/.test(text)
  ) {
    ideas.push({
      title: "small-format protein conjugate instead of full igg",
      rationale:
        "the core biology can still belong in payload-delivery territory, but a fab, scfv, vhh, or other smaller binding format may preserve the delivery logic while easing penetration or tissue-access pressure.",
      whatMustChange:
        "the binder has to keep enough affinity and exposure after shrinking the carrier, and the conjugation chemistry has to avoid wrecking the smaller format.",
      whyNotDefault:
        "full igg is still the simpler default when the target window is clean and exposure matters more than penetration.",
      sourceLabels,
    });
  }

  if (
    (top.name === "adc" || top.name === "pdc") &&
    /(heterogeneous|normal tissue|safety|off target|weak window|dual target|selectivity|tumor versus normal)/.test(text)
  ) {
    ideas.push({
      title: "bispecific or multispecific gated conjugate",
      rationale:
        "if one target alone does not give a trustworthy window, a dual-recognition format can sometimes rescue selectivity by demanding a more tumor-specific binding context before payload delivery dominates.",
      whatMustChange:
        "there has to be a believable pair of targets or epitopes that improves discrimination enough to justify the extra format complexity.",
      whyNotDefault:
        "this is more complex than a single-binder construct and only makes sense if the normal-tissue problem is the real blocker.",
      sourceLabels,
    });
  }

  if (
    top.name === "rdc" &&
    /(kidney|salivary|dosimetry|off target|background exposure|circulation)/.test(text)
  ) {
    ideas.push({
      title: "pretargeted radioligand workflow",
      rationale:
        "if radionuclide logic is right but organ exposure is the weak spot, a pretargeted approach can separate targeting from isotope delivery instead of forcing both jobs into one construct at the same moment.",
      whatMustChange:
        "the targeting and capture chemistry both have to be fast and specific enough for a staged workflow to beat the simpler direct-radioligand route.",
      whyNotDefault:
        "direct radioligands are still the default when localization and dosimetry are already acceptable.",
      sourceLabels,
    });
  }

  if (
    top.name === "oligo conjugate" &&
    /(delivery|uptake|muscle|cns|trafficking|endosome|entry)/.test(text)
  ) {
    ideas.push({
      title: "tissue-biased oligo hybrid rather than a plain oligo construct",
      rationale:
        "if the therapeutic mechanism clearly belongs in oligo biology but delivery is the bottleneck, the more interesting move may be to keep the oligo payload while changing the entry handle or carrier logic rather than switching to a warhead platform.",
      whatMustChange:
        "the added targeting or uptake handle has to improve productive trafficking without blocking the oligo’s actual sequence-driven activity.",
      whyNotDefault:
        "plain oligo delivery remains simpler unless tissue access is obviously the real reason the baseline approach is failing.",
      sourceLabels,
    });
  }

  if (
    top.name === "smdc" &&
    /(half life|clearance|kidney|exposure|short exposure|pk)/.test(text)
  ) {
    ideas.push({
      title: "half-life tuned smdc instead of the leanest ligand-first build",
      rationale:
        "if the ligand-first biology is right but exposure collapses too quickly, a more adventurous option is to preserve the smdc logic while adding a deliberate half-life-tuning element rather than abandoning the class.",
      whatMustChange:
        "the pk-tuning element has to buy exposure without breaking target binding or pushing kidney and off-target liabilities too far.",
      whyNotDefault:
        "the cleanest smdc is still better when compact size and fast tissue movement are the main reasons the class won in the first place.",
      sourceLabels,
    });
  }

  if (
    top.name === "enzyme conjugate" &&
    /(background|specificity|local activation|stroma|microenvironment)/.test(text)
  ) {
    ideas.push({
      title: "microenvironment-gated activation instead of direct local catalysis alone",
      rationale:
        "if enzyme or prodrug logic is attractive but background activity is the weak point, a more creative route is to make activation depend on an additional local cue rather than trusting one enzyme layer by itself.",
      whatMustChange:
        "there has to be a real second gate in the disease setting, otherwise the extra cleverness only adds fragility.",
      whyNotDefault:
        "plain enzyme or prodrug logic is still the better default when the local catalytic story is already selective enough.",
      sourceLabels,
    });
  }

  return ideas.slice(0, 3);
}

function buildBiologySections(
  prompt: string,
  state: PlannerState,
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

  const hasMeaningfulTarget = Boolean(state.target) && !/^(conjugate|conjugates)\b/i.test((state.target ?? "").trim());
  const targetRead = hasMeaningfulTarget
    ? `${state.target} is the working biological entry point right now. the big question is whether it is truly disease-relevant, accessible where the construct needs it, and usable without creating a worse normal-tissue problem.`
    : "the target biology is still underdefined. until the real entry point is clear, chemistry choices will look more confident than they deserve.";

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
      title: "target biology",
      body: targetRead,
      sources: targetSources,
    },
    {
      title: "delivery + active species biology",
      body: top
        ? `${biologyFit} ${deliveryFit} ${releaseFit}`.trim()
        : diseaseProfile
          ? `the disease-level mechanism already points toward ${diseaseProfile.plausibleDirections.join(", ")} as more biologically plausible directions. the remaining unknown is which entry handle, trafficking route, or target logic can turn that into a responsible conjugate strategy.`
          : "the delivery and active-species logic are still unresolved. until the subtype, target, or therapeutic mechanism is clearer, the safest read is to keep multiple biological routes open instead of forcing one modality winner.",
      sources: deliverySources,
    },
    {
      title: "biggest biology unknown",
      body: diseaseProfile
        ? `the main unresolved biology issue right now is target-conditioning and delivery execution: the disease mechanism is more legible than the actual construct entry point, trafficking route, and translational handle.`
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
    };

    const prompt = body.prompt?.trim() ?? "";
    const state = body.state ?? {};

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const parsedQuery = parseConjugateQuery(prompt, state);
    const normalizedCase = normalizeConjugateCase(parsedQuery, state);
    const biologyTopic = buildBiologyTopic(prompt, state, normalizedCase);
    const topic = buildTopic(prompt, state);
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
            const europePmc = await searchEuropePmc(item.query, 3);
            return {
              ...item,
              europePmc,
              requestStatus: (europePmc.results.length ? "ok" : "empty") as "ok" | "empty",
            };
          } catch {
            return {
              ...item,
              europePmc: { hitCount: 0, results: [] },
              requestStatus: "error" as const,
            };
          }
        }),
      ),
      searchEuropePmc(biologyTopic, 5).catch(() => ({ hitCount: 0, results: [] })),
      searchPubMedReviews(biologyTopic, 5).catch(() => []),
      searchClinicalTrials(biologyTopic).catch(() => []),
      Promise.all(
      MODALITY_ORDER.map(async (modality) => {
        const query = `${topic} AND (${MODALITY_QUERIES[modality].join(" OR ")})`;
        try {
          const europePmc = await searchEuropePmc(query);
          return { modality, europePmc };
        } catch {
          return { modality, europePmc: { hitCount: 0, results: [] } };
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
        literature: literature ?? { hitCount: 0, results: [] },
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

    const gates = evaluateMechanisticGates(groundedCase, {
      evidenceObjects,
      mechanismInference,
    });
    const scored = scoreModalities(groundedCase, gates, literatureSignals, {
      evidenceObjects,
      mechanismInference,
    });

    const matrix = scored.map((item) => ({
      modality: item.modality,
      total: Number(item.total.toFixed(1)),
      cells: item.components.map((component) => ({
        category: component.category,
        score: Number(component.weighted.toFixed(1)),
        reason: `${component.rationale} raw ${component.raw}, weight ${component.weight}.`,
      })),
    }));

    const rawRanking = scored.map((item, index) => ({
      rank: index + 1,
      ...OPTION_MAP[item.modality as (typeof MODALITY_ORDER)[number]],
      limitReason: buildLimitReason(
        item.modality as (typeof MODALITY_ORDER)[number],
        prompt,
        state,
        OPTION_MAP[item.modality as (typeof MODALITY_ORDER)[number]].limitReason,
      ),
    }));

    const enrichedRanking = enrichRankingWithMatrix(rawRanking, matrix);
    const ranking = enrichedRanking;
    const top = ranking[0];
    const topLiterature = literatureSignals.find((item) => item.modality === top.name)?.literature ?? { hitCount: 0, results: [] };
    const pubmed = await searchPubMedReviews(`${topic} ${MODALITY_QUERIES[top.name as (typeof MODALITY_ORDER)[number]]?.[0] ?? ""}`).catch(
      () => [],
    );
    const clinicalTrials = await searchClinicalTrials(
      `${topic} ${MODALITY_QUERIES[top.name as (typeof MODALITY_ORDER)[number]]?.[0] ?? ""}`,
    ).catch(() => broadClinicalTrials);
    const literatureSources = buildSources(top.name as (typeof MODALITY_ORDER)[number], topLiterature, pubmed);
    const precedentSources = buildPrecedentSources(top.name as (typeof MODALITY_ORDER)[number], prompt, state, clinicalTrials);
    const whyNot = buildWhyNotResults(scored);
    const provisionalSources = [...precedentSources, ...literatureSources].slice(0, 6);
    const confidence = assessConfidence(groundedCase, scored, provisionalSources, {
      sourceBuckets: retrievalSourceBuckets,
      evidenceObjects,
      mechanismInference,
    });
    const visibleGrounding = mechanismInference.source === "none" ? null : mechanismInference;
    const usingDiseaseSpecificAbstention = Boolean(
      confidence.abstain &&
        groundedCase.diseaseSpecificity !== "family" &&
        mechanismInference.source === "evidence" &&
        mechanismInference.themes.length,
    );
    const usingGenericAbstention = Boolean(confidence.abstain && !usingDiseaseSpecificAbstention);
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
    const biologySources = buildBiologySources(state, biologyLiterature, biologyReviews, clinicalTrials);
    const sources = confidence.abstain
      ? biologySources
          .filter((source) => (source.type ?? "") !== "target biology" && (source.type ?? "") !== "clinical context")
          .slice(0, 4)
      : provisionalSources;
    const recommendation = confidence.abstain
      ? {
          text: [
            "status",
            "under-specified",
            "",
            "why the planner is abstaining",
            groundedCase.diseaseSpecificity === "family"
              ? "the prompt names a disease family, but it does not identify the subtype, target, trafficking story, or therapeutic mechanism strongly enough to choose a responsible conjugate class."
              : visibleGrounding
                ? `the prompt names a specific disease, and the disease-level biology points toward ${visibleGrounding.plausibleDirections.join(", ")} as plausible directions. but the target, trafficking story, and exact construct logic are still too underdefined to choose a responsible winner.`
                : diseaseProfile
                  ? `the prompt names a specific disease, and the disease-level biology points toward ${diseaseProfile.plausibleDirections.join(", ")} as plausible directions. but the target, trafficking story, and exact construct logic are still too underdefined to choose a responsible winner.`
                : "the prompt names a disease, but it still does not identify the target, trafficking story, or therapeutic mechanism strongly enough to choose a responsible conjugate class.",
            "",
            ...(visibleGrounding
              ? [
                  "disease-level mechanistic read",
                  `${visibleGrounding.summary} ${visibleGrounding.rationale}`,
                  "",
                ]
              : diseaseProfile
                ? [
                    "disease-level mechanistic read",
                    `${diseaseProfile.summary} ${diseaseProfile.rationale}`,
                    "",
                  ]
                : []),
            "what would make this rankable",
            "add the subtype, target, or actual mechanism you want to leverage. for example: exon skipping, toxic-rna correction, cytotoxic delivery, radioligand localization, or enzyme/prodrug activation.",
          ].join("\n"),
        }
      : buildRecommendationText(prompt, finalTop!, finalRanking, matrix, riskMove, sources);
    const innovativeIdeas = confidence.abstain ? [] : buildInnovativeIdeas(prompt, state, finalRanking, matrix, sources);
    const biology = buildBiologySections(
      prompt,
      state,
      finalTop,
      confidence.abstain ? [] : matrix,
      biologySources,
      visibleGrounding,
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
      retrieval: {
        sourceBuckets: retrievalSourceBuckets,
        evidenceObjects,
        themeCounts: buildThemeCounts(evidenceObjects),
        diseaseBiologyDebug: diseaseBiologyResults.map((item) => ({
          concept: item.concept,
          variant: item.variant,
          query: item.query,
          hitCount: item.europePmc.hitCount,
          requestStatus: item.requestStatus,
          hits: item.europePmc.results.slice(0, 3).map((result) => ({
            label: result.title || "disease biology literature hit",
            snippet: result.authorString || result.journalTitle || result.pubYear || "",
          })),
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

    return NextResponse.json({
      topPick: confidence.abstain ? "under-specified" : finalTop?.name ?? "under-specified",
      topPickWhy: confidence.abstain
        ? normalizedCase.diseaseSpecificity === "family"
          ? "not enough mechanism, target, or trafficking biology is defined yet to choose a responsible winner. this should stay disease-level and provisional until the subtype, target, or active mechanism is clearer."
          : visibleGrounding
            ? `${visibleGrounding.summary} this is still not enough to name a responsible winner without target, trafficking, or construct-level clarification.`
          : diseaseProfile
            ? `${diseaseProfile.summary} this is still not enough to name a responsible winner without target, trafficking, or construct-level clarification.`
          : "this is a named disease case, but the target and exact therapeutic mechanism are still too underdefined for a responsible winner. the planner should stay provisional until the biology is sharper."
        : `${buildTopPickWhy(finalTop!, validationPasses)} ${groundedCase.recommendationScope === "disease-level" ? "this is still a disease-level read, not a target-conditioned construct call." : ""}`.trim(),
      biggestRisk: confidence.abstain ? "" : riskMove.biggestRisk,
      firstMove: confidence.abstain ? "" : riskMove.firstMove,
      nextSteps: confidence.abstain ? [] : riskMove.nextSteps,
      ranking: finalRanking,
      matrix: confidence.abstain ? [] : matrix,
      sources,
      text: `${abstentionPrefix}${recommendation.text}`,
      summary: confidence.abstain
        ? usingDiseaseSpecificAbstention && visibleGrounding
          ? `${visibleGrounding.summary} ranking is still withheld because the target, entry handle, and construct logic are not yet specific enough.`
          : "the current prompt resolves to an abstaining disease-level read, not a target-conditioned construct decision."
        : finalTop?.summary ?? "",
      topic,
      validationPasses,
      innovativeIdeas,
      biology,
      biologyValidationPasses,
      confidence,
      trace,
    });
  } catch {
    return NextResponse.json(
      { error: "design research failed" },
      { status: 502 },
    );
  }
}
