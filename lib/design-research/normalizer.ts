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

function findCanonical(raw: string, table: Record<string, string[]>) {
  const text = raw.toLowerCase();
  for (const [canonical, aliases] of Object.entries(table)) {
    if (text.includes(canonical.toLowerCase()) || aliases.some((alias) => text.includes(alias.toLowerCase()))) {
      return canonical;
    }
  }
  return "";
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

function inferMechanismClass(text: string): MechanismClass {
  if (/(sirna|aso|pmo|antisense|gene modulation|splice|knockdown|rna toxicity|repeat expansion|cug repeat)/.test(text)) {
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
    /^(muscular dystrophy|cancer|solid tumor|carcinoma|lymphoma|autoimmune disease|neuromuscular disease)$/.test(canonical) ||
    /\bpossible conjugates for muscular dystrophy\b/.test(text) ||
    /\bconjugates for muscular dystrophy\b/.test(text)
  ) {
    return "family";
  }
  if (/(facioscapulohumeral|fshd|duchenne|dmd|myotonic dystrophy|dm1|myasthenia gravis)/.test(diseaseText)) {
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
  const disease = makeEntity(parsed.diseaseMention, DISEASE_ALIAS_TABLE);
  const target = isValidTargetMention(parsed.targetMention, parsed.diseaseMention)
    ? makeEntity(parsed.targetMention, TARGET_ALIAS_TABLE)
    : undefined;
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
    needsIntracellularAccess: /(sirna|aso|pmo|gene modulation|rna|knockdown|splice|cytotoxic)/.test(text),
    needsNuclearAccess: /(splice|pmo|aso|splice switching)/.test(text),
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
