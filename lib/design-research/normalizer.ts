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

function findCanonical(raw: string, table: Record<string, string[]>) {
  const text = raw.toLowerCase().replace(/[’‘]/g, "'");
  for (const [canonical, aliases] of Object.entries(table)) {
    const normalizedCanonical = canonical.toLowerCase().replace(/[’‘]/g, "'");
    if (text.includes(normalizedCanonical) || aliases.some((alias) => text.includes(alias.toLowerCase().replace(/[’‘]/g, "'")))) {
      return canonical;
    }
  }
  return "";
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findAliasMention(raw: string, table: Record<string, string[]>) {
  const text = raw.toLowerCase().replace(/[’‘]/g, "'");

  for (const [canonical, aliases] of Object.entries(table)) {
    const candidates = [canonical, ...aliases].filter(Boolean);

    for (const candidate of candidates) {
      const normalizedCandidate = candidate.toLowerCase().replace(/[’‘]/g, "'");
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedCandidate)}([^a-z0-9]|$)`, "i");

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
  const canonical = findCanonical(raw, table) || raw.trim();
  const aliases = table[canonical] ?? [];
  return {
    raw,
    canonical,
    aliases,
    confidence: canonical.toLowerCase() === raw.toLowerCase() || aliases.some((alias) => raw.toLowerCase().includes(alias.toLowerCase())) ? "high" : "medium",
  };
}

function resolveDiseaseEntity(parsed: ParsedQuery, state: PlannerState) {
  const directDisease = makeEntity(parsed.diseaseMention, DISEASE_ALIAS_TABLE);
  if (directDisease) {
    return directDisease;
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
  if (/(cancer|tumou?r|carcinoma|lymphoma|metastatic|oncology)/.test(text)) return "oncology";
  if (/(duchenne|dmd|myotonic dystrophy|dm1|facioscapulohumeral|fshd|muscular dystrophy|neuromuscular)/.test(text)) return "neuromuscular";
  if (/(myasthenia|autoimmune|immune|lupus|arthritis)/.test(text)) return "autoimmune";
  if (/(cholesterol|porphyria|metabolic|liver disease)/.test(text)) return "metabolic";
  if (/(alzheimer|parkinson|huntington|amyotrophic lateral sclerosis|als|neurodegenerative)/.test(text)) return "other";
  if (text.trim().length) return "other";
  return "unknown";
}

function inferDiseaseSpecificity(disease: NormalizedEntity | undefined, text: string): DiseaseSpecificity {
  const canonical = disease?.canonical?.toLowerCase() ?? "";
  const diseaseText = `${canonical} ${text}`;
  const namedCancerPattern =
    /\b(breast|lung|ovarian|colorectal|colon|prostate|bladder|urothelial|pancreatic|gastric|endometrial|cervical|brain|glioblastoma|melanoma)\s+(cancer|carcinoma|tumou?r)\b/;
  if (!canonical && !/(disease|cancer|dystrophy|syndrome|disorder|myasthenia|carcinoma|lymphoma)/.test(text)) {
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
  if (/(facioscapulohumeral|fshd|duchenne|dmd|myotonic dystrophy|dm1|myasthenia gravis|alzheimer disease|parkinson disease|amyotrophic lateral sclerosis|huntington disease|rheumatoid arthritis|systemic lupus erythematosus)/.test(diseaseText)) {
    return "specific";
  }
  if (namedCancerPattern.test(diseaseText)) {
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
  if (!state.targetExpression) unknowns.push("target density or expression separation is not defined");
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
      state.internalization === "fast" ? "fast" : state.internalization === "slow" ? "slow" : "unknown",
    targetDensityKnown:
      state.targetExpression === "high + homogeneous"
        ? "high"
        : state.targetExpression === "high + heterogeneous"
          ? "mixed"
          : state.targetExpression === "low / sparse"
            ? "low"
            : "unknown",
    unknowns,
  };
}
