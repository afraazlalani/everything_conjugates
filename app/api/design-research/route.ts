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
  pros: string[];
  cons: string[];
};

type EvidenceSource = {
  label: string;
  href?: string;
  why?: string;
  type?: string;
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

function normalize(value: string) {
  return value.toLowerCase();
}

function cleanTopic(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/[^\w\s/+()-]/g, " ")
    .trim();
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

  if (/(duchenne|dmd|muscular dystrophy|exon skipping|splice switching|antisense|sirna|aso|pmo|gene modulation|knockdown)/.test(text)) {
    bump("oligo conjugate", 16);
    bump("adc", -4);
    bump("pdc", -1);
    bump("smdc", -2);
  }

  if (/(radionuclide|radioligand|radiotherapy|theranostic|lu-177|lutetium|actinium|ac-225|y-90|yttrium)/.test(text)) {
    bump("rdc", 16);
    bump("smdc", 3);
  }

  if (/(cytotoxic|tumor kill|cell kill|microtubule|mmae|dm1|sn-38|exatecan|duocarmycin|pbd)/.test(text)) {
    bump("adc", 8);
    bump("pdc", 5);
    bump("smdc", 5);
  }

  if (/(small molecule ligand|folate|psma|caix|fap|acetazolamide|integrin|small molecule)/.test(text)) {
    bump("smdc", 7);
    bump("rdc", 3);
  }

  if (/(peptide|rgd|somatostatin|octreotide|cyclic peptide)/.test(text)) {
    bump("pdc", 8);
    bump("rdc", 3);
  }

  if (/(enzyme|prodrug|catalytic|activation)/.test(text)) {
    bump("enzyme conjugate", 12);
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

  return scores;
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
        `${item.rank}. ${item.name}\nwhy it fits: ${item.fitReason}\nwhy it may not: ${item.limitReason}`,
    )
    .join("\n\n");

  return {
    text: `best current fit\n${top.name}\n\nwhy this is leading\n${top.fitReason}\n\nfull ranking\n${rankingText}\n\nmain watchout\n${riskMove.biggestRisk}\n\nfirst move\n${riskMove.firstMove}`,
    sources,
  };
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
      const literatureBoost = literature ? Math.min(Math.log10((literature.hitCount ?? 0) + 1), 3) : 0;
      return {
        modality,
        score: baseScores[modality] + literatureBoost,
        literature: literature ?? { hitCount: 0, results: [] },
      };
    }).sort((a, b) => b.score - a.score);

    const ranking = scored.map((item, index) => ({
      rank: index + 1,
      ...OPTION_MAP[item.modality],
    }));

    const top = ranking[0];
    const topLiterature = scored[0]?.literature ?? { hitCount: 0, results: [] };
    const pubmed = await searchPubMedReviews(`${topic} ${MODALITY_QUERIES[top.name as (typeof MODALITY_ORDER)[number]]?.[0] ?? ""}`).catch(
      () => [],
    );
    const sources = buildSources(top.name as (typeof MODALITY_ORDER)[number], topLiterature, pubmed);
    const riskMove = buildRiskAndMove(top.name as (typeof MODALITY_ORDER)[number]);
    const recommendation = buildRecommendationText(top, ranking, riskMove, sources);

    return NextResponse.json({
      topPick: top.name,
      topPickWhy: top.fitReason,
      biggestRisk: riskMove.biggestRisk,
      firstMove: riskMove.firstMove,
      nextSteps: riskMove.nextSteps,
      ranking,
      sources,
      text: recommendation.text,
      summary: top.summary,
      topic,
    });
  } catch {
    return NextResponse.json(
      { error: "design research failed" },
      { status: 502 },
    );
  }
}
