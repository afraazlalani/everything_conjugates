import {
  DISEASE_MECHANISM_PROFILES,
  DISEASE_ALIAS_TABLE,
  LINKER_ALIAS_TABLE,
  MODALITY_ALIAS_TABLE,
  PAYLOAD_ALIAS_TABLE,
  TARGET_ALIAS_TABLE,
} from "./config";
import {
  DiseaseArea,
  DiseaseSpecificity,
  MechanismClass,
  NormalizedCase,
  NormalizedEntity,
  ParsedQuery,
  PlannerState,
  RecommendationScope,
} from "./types";

const GENE_MODULATION_CUE =
  /(sirna|aso|pmo|antisense|gene modulation|splice|splice switching|splice rescue|exon skipping|exon-skipping|exon\s*\d+|skipping|transcript correction|transcript rescue|knockdown|rna toxicity|repeat expansion|cug repeat)/;

const NUCLEAR_DELIVERY_CUE =
  /(splice|splice switching|splice rescue|exon skipping|exon-skipping|exon\s*\d+|transcript correction|transcript rescue|pmo|aso)/;

function normalizePhrase(value: string) {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasWholePhrase(raw: string, candidate: string) {
  const normalizedRaw = normalizePhrase(raw);
  const normalizedCandidate = normalizePhrase(candidate);
  if (!normalizedRaw || !normalizedCandidate) return false;
  const pattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedCandidate)}(\\s|$)`, "i");
  return pattern.test(normalizedRaw);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array.from({ length: right.length + 1 }, () => 0),
  );

  for (let row = 0; row <= left.length; row += 1) matrix[row][0] = row;
  for (let col = 0; col <= right.length; col += 1) matrix[0][col] = col;

  for (let row = 1; row <= left.length; row += 1) {
    for (let col = 1; col <= right.length; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

function maxDiseaseEditDistance(candidate: string) {
  if (candidate.length >= 18) return 3;
  if (candidate.length >= 10) return 2;
  return 1;
}

function looksLikeNamedDisease(raw: string) {
  const normalized = normalizePhrase(raw);
  if (!normalized || normalized.length < 6) return false;
  if (normalized.split(" ").length >= 2) return true;
  return /(cancer|carcinoma|lymphoma|leukemia|leukaemia|myeloma|sarcoma|glioma|blastoma|disease|dystrophy|atrophy|degeneration|ataxia|palsy|arthritis|gravis|sclerosis|syndrome|disorder|glioblastoma|huntington|parkinson|alzheimer|lupus)/.test(
    normalized,
  );
}

function findCanonical(raw: string, table: Record<string, string[]>) {
  const candidates = Object.entries(table)
    .flatMap(([canonical, aliases]) => [canonical, ...aliases].filter(Boolean).map((candidate) => ({ canonical, candidate })))
    .sort((left, right) => right.candidate.length - left.candidate.length);

  for (const { canonical, candidate } of candidates) {
    if (hasWholePhrase(raw, candidate)) {
      return { canonical, confidence: "high" as const };
    }
  }

  return undefined;
}

function findAliasMention(raw: string, table: Record<string, string[]>) {
  const text = normalizePhrase(raw);

  for (const [canonical, aliases] of Object.entries(table)) {
    const candidates = [canonical, ...aliases].filter(Boolean);

    for (const candidate of candidates) {
      const normalizedCandidate = normalizePhrase(candidate);
      const pattern = new RegExp(`(^|\\s)${escapeRegExp(normalizedCandidate)}(\\s|$)`, "i");

      if (pattern.test(text)) {
        return {
          canonical,
          matched: candidate,
        };
      }
    }
  }

  return undefined;
}

function makeEntity(raw: string | undefined, table: Record<string, string[]>): NormalizedEntity | undefined {
  if (!raw) return undefined;
  const exactMatch = findCanonical(raw, table);
  const canonical = exactMatch?.canonical || raw.trim();
  const aliases = table[canonical] ?? [];
  return {
    raw,
    canonical,
    aliases,
    confidence:
      exactMatch?.confidence ??
      (normalizePhrase(canonical) === normalizePhrase(raw) ||
      aliases.some((alias) => hasWholePhrase(raw, alias))
        ? "high"
        : "medium"),
  };
}

function findFuzzyDisease(raw: string, table: Record<string, string[]>) {
  const normalizedRaw = normalizePhrase(raw);
  if (normalizedRaw.length < 8) return undefined;

  const scored = Object.entries(table)
    .flatMap(([canonical, aliases]) => [canonical, ...aliases].filter(Boolean).map((candidate) => ({ canonical, candidate })))
    .map(({ canonical, candidate }) => {
      const normalizedCandidate = normalizePhrase(candidate);
      if (normalizedCandidate.length < 5) return null;
      if (Math.abs(normalizedCandidate.length - normalizedRaw.length) > 4) return null;
      const distance = levenshteinDistance(normalizedRaw, normalizedCandidate);
      const maxDistance = maxDiseaseEditDistance(normalizedCandidate);
      if (distance > maxDistance) return null;
      return { canonical, candidate, distance, normalizedCandidate };
    })
    .filter(Boolean) as { canonical: string; candidate: string; distance: number; normalizedCandidate: string }[];

  if (!scored.length) return undefined;

  scored.sort((left, right) => {
    if (left.distance !== right.distance) return left.distance - right.distance;
    return right.normalizedCandidate.length - left.normalizedCandidate.length;
  });

  const best = scored[0];
  const runnerUp = scored[1];
  if (runnerUp && runnerUp.distance <= best.distance + 1) {
    return undefined;
  }

  return {
    canonical: best.canonical,
    matched: best.candidate,
    confidence: best.distance === 0 ? ("high" as const) : ("low" as const),
  };
}

function resolveDiseaseEntity(parsed: ParsedQuery, state: PlannerState) {
  if (parsed.diseaseMention) {
    const exactDisease = findCanonical(parsed.diseaseMention, DISEASE_ALIAS_TABLE);
    if (exactDisease) {
      return {
        raw: parsed.diseaseMention,
        canonical: exactDisease.canonical,
        aliases: DISEASE_ALIAS_TABLE[exactDisease.canonical] ?? [],
        confidence: exactDisease.confidence,
      } satisfies NormalizedEntity;
    }

    const fuzzyDisease = findFuzzyDisease(parsed.diseaseMention, DISEASE_ALIAS_TABLE);
    if (fuzzyDisease) {
      return {
        raw: parsed.diseaseMention,
        canonical: fuzzyDisease.canonical,
        aliases: DISEASE_ALIAS_TABLE[fuzzyDisease.canonical] ?? [],
        confidence: fuzzyDisease.confidence,
      } satisfies NormalizedEntity;
    }

    if (looksLikeNamedDisease(parsed.diseaseMention)) {
      return {
        raw: parsed.diseaseMention,
        canonical: parsed.diseaseMention.trim(),
        aliases: [],
        confidence: "low",
      } satisfies NormalizedEntity;
    }
  }

  const searchText = [
    parsed.cleanedPrompt,
    state.idea,
    state.goal,
    state.constraints,
    state.mustHave,
    state.avoid,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!searchText) {
    return undefined;
  }

  const aliasMatch = findAliasMention(searchText, DISEASE_ALIAS_TABLE);
  if (!aliasMatch) {
    return undefined;
  }

  return {
    raw: aliasMatch.matched,
    canonical: aliasMatch.canonical,
    aliases: DISEASE_ALIAS_TABLE[aliasMatch.canonical] ?? [],
    confidence: "medium",
  } satisfies NormalizedEntity;
}

function isValidTargetMention(rawTarget: string | undefined, diseaseRaw: string | undefined) {
  if (!rawTarget?.trim()) return false;
  const normalizedTarget = rawTarget.trim().toLowerCase();
  const normalizedDisease = diseaseRaw?.trim().toLowerCase() ?? "";

  if (
    /^(possible\s+)?conjugates?\s+for\s+/.test(normalizedTarget) ||
    /^(best|what|which)\s+conjugates?\s+for\s+/.test(normalizedTarget)
  ) {
    return false;
  }

  if (
    /^(biology|mechanism|pathway|payload|linker|format|delivery|strategy|approach|problem|case|construct|conjugate|conjugates|entry handle|target biology)$/.test(
      normalizedTarget,
    )
  ) {
    return false;
  }

  if (/^(i have|we have|there is|there's|a|an)\s+(a\s+)?target antigen(\s+and\s+a\s+payload)?$/.test(normalizedTarget)) {
    return false;
  }

  if (normalizedDisease && normalizedTarget === normalizedDisease) {
    return false;
  }

  if (normalizedDisease && normalizedTarget.includes(normalizedDisease)) {
    return false;
  }

  if (/disease|cancer|dystrophy|syndrome|disorder/.test(normalizedTarget) && !/(egfr|her2|trop2|folr1|frα|psma|mesothelin|nectin|target|receptor|antigen)/.test(normalizedTarget)) {
    return false;
  }

  return true;
}

function resolveTargetEntity(parsed: ParsedQuery, state: PlannerState, diseaseRaw: string | undefined) {
  const directTarget = isValidTargetMention(parsed.targetMention, diseaseRaw)
    ? makeEntity(parsed.targetMention, TARGET_ALIAS_TABLE)
    : undefined;

  if (directTarget) {
    return directTarget;
  }

  const searchText = [
    parsed.cleanedPrompt,
    parsed.diseaseMention,
    state.target,
    state.idea,
    state.goal,
    state.constraints,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!searchText) {
    return undefined;
  }

  const aliasMatch = findAliasMention(searchText, TARGET_ALIAS_TABLE);
  if (!aliasMatch) {
    return undefined;
  }

  return {
    raw: aliasMatch.matched,
    canonical: aliasMatch.canonical,
    aliases: TARGET_ALIAS_TABLE[aliasMatch.canonical] ?? [],
    confidence: "medium",
  } satisfies NormalizedEntity;
}

function inferMechanismClass(text: string): MechanismClass {
  if (GENE_MODULATION_CUE.test(text)) {
    return "gene modulation";
  }
  if (/(cytotoxic|tumor kill|cell kill|microtubule|mmae|mertansine|sn-38|duocarmycin|pbd)/.test(text)) {
    return "cytotoxic delivery";
  }
  if (/(radioligand|radionuclide|radiotherapy|lu-177|actinium|ac-225|y-90)/.test(text)) {
    return "radiobiology";
  }
  if (/(enzyme|prodrug|catalytic|activation)/.test(text)) {
    return "enzyme/prodrug";
  }
  if (/(autoimmune|immune|complement|b cell|t cell|blocking|neutralizing)/.test(text)) {
    return "immune modulation";
  }
  return "unknown";
}

function inferDiseaseArea(text: string): DiseaseArea {
  if (/(cancer|tumou?r|carcinoma|lymphoma|leukemia|leukaemia|myeloma|sarcoma|metastatic|oncology|glioblastoma|glioma|gbm|brain tumor)/.test(text)) return "oncology";
  if (/(duchenne|dmd|myotonic dystrophy|dm1|facioscapulohumeral|fshd|muscular dystrophy|neuromuscular|spinal muscular atrophy|sma)/.test(text)) return "neuromuscular";
  if (/(myasthenia|autoimmune|immune|lupus|arthritis)/.test(text)) return "autoimmune";
  if (/(cholesterol|porphyria|metabolic|liver disease)/.test(text)) return "metabolic";
  if (/(alzheimer|parkinson|huntington|amyotrophic lateral sclerosis|als|friedreich ataxia|progressive supranuclear palsy|multiple system atrophy|corticobasal degeneration|psp|msa|neurodegenerative)/.test(text)) return "other";
  if (text.trim().length) return "other";
  return "unknown";
}

function inferDiseaseSpecificity(disease: NormalizedEntity | undefined, text: string): DiseaseSpecificity {
  const canonical = disease?.canonical?.toLowerCase() ?? "";
  const diseaseText = `${canonical} ${text}`;
  const namedCancerPattern =
    /\b(breast|lung|ovarian|colorectal|colon|prostate|bladder|urothelial|pancreatic|gastric|endometrial|cervical|brain|glioblastoma|melanoma)\s+(cancer|carcinoma|tumou?r)\b/;
  const genericNamedOncologyPattern =
    /\b[a-z0-9][a-z0-9\- ]{2,}\s+(cancer|carcinoma|tumou?r|lymphoma|leukemia|leukaemia|sarcoma|myeloma)\b/;
  if (!canonical && !/(disease|cancer|dystrophy|syndrome|disorder|myasthenia|carcinoma|lymphoma|leukemia|leukaemia|sarcoma|myeloma|glioma|blastoma)/.test(text)) {
    return "unknown";
  }
  if (
    /^(muscular dystrophy|cancer|solid tumor|carcinoma|lymphoma|autoimmune disease|neuromuscular disease|inflammatory bowel disease)$/.test(canonical) ||
    /\bpossible conjugates for muscular dystrophy\b/.test(text) ||
    /\bconjugates for muscular dystrophy\b/.test(text) ||
    /\binflammatory bowel disease\b/.test(diseaseText)
  ) {
    return "family";
  }
  if (/(facioscapulohumeral|fshd|duchenne|dmd|myotonic dystrophy|dm1|myasthenia gravis|alzheimer disease|parkinson disease|amyotrophic lateral sclerosis|huntington disease|rheumatoid arthritis|systemic lupus erythematosus|glioblastoma|gbm)/.test(diseaseText)) {
    return "specific";
  }
  if (namedCancerPattern.test(diseaseText) || genericNamedOncologyPattern.test(diseaseText)) {
    return "specific";
  }
  if (disease?.canonical && !/(muscular dystrophy|cancer|tumou?r|autoimmune disease|neuromuscular disease|inflammatory bowel disease|solid tumor|carcinoma|lymphoma|leukemia|leukaemia|sarcoma|myeloma)$/.test(canonical)) {
    return "specific";
  }
  if (/(muscular dystrophy|cancer|tumou?r|autoimmune)/.test(diseaseText)) {
    return "family";
  }
  return disease?.canonical ? "specific" : "unknown";
}

export function normalizeConjugateCase(parsed: ParsedQuery, state: PlannerState): NormalizedCase {
  const text = `${parsed.cleanedPrompt} ${state.goal ?? ""} ${state.payloadClass ?? ""} ${state.releaseGoal ?? ""}`.toLowerCase();
  const disease = resolveDiseaseEntity(parsed, state);
  const target = resolveTargetEntity(parsed, state, parsed.diseaseMention);
  const modalityIntent = makeEntity(parsed.mentionedModalities.join(" "), MODALITY_ALIAS_TABLE);
  const payloadIntent = makeEntity(`${parsed.mentionedPayloadTerms.join(" ")} ${state.payloadClass ?? ""}`, PAYLOAD_ALIAS_TABLE);
  const linkerIntent = makeEntity(`${parsed.mentionedLinkerTerms.join(" ")} ${state.linkerType ?? ""}`, LINKER_ALIAS_TABLE);
  const mechanismClass = inferMechanismClass(text);
  const diseaseMechanismProfile = disease?.canonical ? DISEASE_MECHANISM_PROFILES[disease.canonical] : undefined;
  const resolvedMechanismClass =
    mechanismClass === "unknown" && diseaseMechanismProfile ? diseaseMechanismProfile.mechanismClass : mechanismClass;
  const diseaseArea = inferDiseaseArea(`${disease?.canonical ?? ""} ${text}`);
  const diseaseSpecificity = inferDiseaseSpecificity(disease, parsed.cleanedPrompt.toLowerCase());
  const recommendationScope: RecommendationScope = target?.canonical ? "target-conditioned" : "disease-level";
  const explicitPeptideSupport = /(peptide|rgd|somatostatin|octreotide|dotatate|bicycle|cyclic peptide)/.test(text);
  const explicitLigandSupport = /(small molecule ligand|folate|psma|caix|fap|acetazolamide|galnac)/.test(text);
  const broadOncologyNoTarget =
    diseaseArea === "oncology" &&
    recommendationScope === "disease-level" &&
    !explicitPeptideSupport &&
    !explicitLigandSupport &&
    mechanismClass === "unknown";

  const unknowns: string[] = [];
  if (!disease?.canonical && !target?.canonical) unknowns.push("no clear disease or target was identified");
  if (resolvedMechanismClass === "unknown") unknowns.push("mechanism class is still unclear");
  if (!target?.canonical) unknowns.push("no target-specific entry point is defined yet");
  if (!state.internalization && !/internal/i.test(text)) unknowns.push("internalization or trafficking behavior is not defined");
  const inferredTargetDensity =
    state.targetExpression === "high + homogeneous" ||
    /\b(high|dense|heavy|heavily expressed|overexpressed|abundant|uniform|homogeneous)\b.*\b(antigen|target|expression|density)\b|\b(antigen|target)\b.*\b(high|dense|heavy|heavily expressed|overexpressed|abundant|uniform|homogeneous)\b/.test(text)
      ? "high"
      : state.targetExpression === "high + heterogeneous" ||
        /\b(heterogeneous|mixed|patchy|variable|target-low|antigen-low)\b/.test(text)
        ? "mixed"
        : state.targetExpression === "low / sparse" ||
          /\b(sparse|sparsely|low|dim|rare)\b.*\b(antigen|target|expression|density)\b|\b(antigen|target)\b.*\b(sparse|sparsely|low|dim|rare)\b/.test(text)
          ? "low"
          : "unknown";
  if (inferredTargetDensity === "unknown") unknowns.push("target density or expression separation is not defined");
  if (broadOncologyNoTarget) unknowns.push("broad oncology prompt without target, mechanism, or carrier-specific support");
  if (diseaseSpecificity === "family") unknowns.push("the prompt is still at a disease-family level and needs subtype or mechanism clarification");

  return {
    prompt: parsed.cleanedPrompt,
    parsed,
    disease,
    target,
    modalityIntent,
    payloadIntent,
    linkerIntent,
    mechanismClass: resolvedMechanismClass,
    diseaseArea,
    diseaseSpecificity,
    recommendationScope,
    chronicContext: !/(acute|single dose|terminal oncology|salvage)/.test(text),
    needsInternalization: /(cytotoxic|adc|linker cleavage|lysosomal|internalization)/.test(text),
    needsIntracellularAccess: /(sirna|aso|pmo|gene modulation|rna|knockdown|splice|splice switching|splice rescue|exon skipping|exon-skipping|cytotoxic)/.test(text),
    needsNuclearAccess: NUCLEAR_DELIVERY_CUE.test(text),
    explicitPeptideSupport,
    explicitLigandSupport,
    broadOncologyNoTarget,
    hasSelectiveSurfaceTarget:
      Boolean(target?.canonical) &&
      (state.targetClass === "cell-surface receptor" ||
        state.targetClass === "tumor antigen" ||
        /(receptor|antigen|surface|psma|folate receptor|egfr|her2|trop2|nectin|mesothelin)/.test(text)),
    targetInternalizationKnown:
      state.internalization === "fast" || /\bfast internaliz|rapid internaliz|strong internaliz|internalizes well\b/.test(text)
        ? "fast"
        : state.internalization === "slow" || /\bslow internaliz|poor internaliz|does not internalize|non[- ]internalizing|weak internaliz\b/.test(text)
          ? "slow"
          : "unknown",
    targetDensityKnown: inferredTargetDensity,
    unknowns,
  };
}
