import { DISEASE_ALIAS_TABLE, TARGET_ALIAS_TABLE } from "./config";
import { ParsedQuery, PlannerState, QuestionType } from "./types";

function normalizeText(text: string) {
  return text.replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
}

function isGenericConjugateLead(text: string) {
  const normalized = text.trim().toLowerCase();
  return /^(possible\s+)?conjugates?$/.test(normalized) ||
    /^(best|what|which)\s+conjugates?$/.test(normalized) ||
    /^conjugate\s+directions?$/.test(normalized) ||
    /^(best|what|which)\s+conjugate\s+directions?$/.test(normalized) ||
    /^conjugate\s+strategy$/.test(normalized) ||
    /^conjugate\s+strategies$/.test(normalized) ||
    /^what\s+conjugate\s+directions?$/.test(normalized) ||
    /^which\s+conjugate\s+directions?$/.test(normalized) ||
    /^possible\s+conjugate\s+directions?$/.test(normalized);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looksLikeGenericTargetPhrase(value: string) {
  const normalized = value.trim().toLowerCase();
  return /^(biology|mechanism|pathway|payload|linker|format|delivery|strategy|approach|problem|case|construct|conjugate|conjugates|entry handle|target|target biology|validation|evidence|engagement|or|and|other|meeting|plan|spec|cascade)$/.test(
    normalized,
  ) || /^(i have|we have|there is|there's|a|an)\s+(a\s+)?target antigen(\s+and\s+a\s+payload)?$/.test(normalized);
}

function findKnownEntityMention(text: string, table: Record<string, string[]>) {
  const normalizedText = text.toLowerCase().replace(/[’‘]/g, "'");
  let bestMatch = "";

  for (const [canonical, aliases] of Object.entries(table)) {
    const candidates = [canonical, ...aliases].filter(Boolean);

    for (const candidate of candidates) {
      const normalizedCandidate = candidate.toLowerCase().replace(/[’‘]/g, "'");
      const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedCandidate)}([^a-z0-9]|$)`, "i");

      if (pattern.test(normalizedText) && normalizedCandidate.length > bestMatch.length) {
        bestMatch = candidate;
      }
    }
  }

  return bestMatch;
}

function trimPromptShapedSuffix(text: string) {
  return text
    .replace(
      /\b(what|which)\s+(format|linker|payload|binder format|antibody format|delivery format)\b.*$/i,
      "",
    )
    .replace(/\bwould you try first\b.*$/i, "")
    .replace(/\bwould you start with\b.*$/i, "")
    .replace(/\bif you had to start somewhere\b.*$/i, "")
    .replace(/\bfocusing on\b.*$/i, "")
    .replace(/[?.!,;:]+$/g, "")
    .trim();
}

function trimTargetMention(text: string) {
  return trimPromptShapedSuffix(text)
    .replace(/\s+(?:and|then|while|but|so)\s+.*$/i, "")
    .replace(/\s+(?:for|in|with|using|use|to)\s+(?:what|which|how|a|an|the|disease|diseases|cancer|tumor|tumour|syndrome|disorder)\b.*$/i, "")
    .replace(/[?.!,;:]+$/g, "")
    .trim();
}

function trimDiseaseClause(text: string) {
  return trimPromptShapedSuffix(text)
    .replace(/,\s*(a|an|the|what|which|should|could|why|how|compare|make|give|show|explain|staying|grounded|derived|using|use)\b.*$/i, "")
    .replace(/\s+with\s+(what|which|should|could|why|how|compare|make|give|show|explain)\b.*$/i, "")
    .replace(/\s+with\s+(no|without|unknown|unvalidated|no\s+validated)\b.*$/i, "")
    .replace(/\b(and|then|while|but|so)\s+(use|using|deliver|exploit|treat|cure|approach|make|build|with|for)\b.*$/i, "")
    .replace(/\b(use|using|deliver|exploit|treat|cure|approach|make|build)\s+(what|which|how|mechanism|conjugate|payload|carrier|format)\b.*$/i, "")
    .replace(/\b(to|for)\s+(deliver|treat|cure|exploit|approach|build)\b.*$/i, "")
    .replace(/[?.!,;:]+$/g, "")
    .trim();
}

function detectQuestionType(text: string): QuestionType {
  if (
    /(what\s+(exactly\s+)?(?:is|are)|explain|define|tell me about)\s+(?:an?\s+|the\s+)?(?:therapeutic\s+|drug\s+|biologic\s+)?conjugates?\b/i.test(
      text,
    )
  ) {
    return "modality explainer";
  }
  if (
    /(what\s+(is|are)|explain|define|tell me about)\s+(an?\s+|the\s+)?(adc|adcs|antibody[- ]drug conjugates?|pdc|pdcs|peptide[- ]drug conjugates?|smdc|smdcs|small[- ]molecule[- ]drug conjugates?|rdc|rdcs|radioconjugates?|radioligands?|oligo conjugates?|oligonucleotide conjugates?|enzyme conjugates?)/i.test(
      text,
    )
  ) {
    return "modality explainer";
  }
  if (/(why not|why wouldn'?t|why does .* lose)/i.test(text)) return "why not";
  if (/(compare|versus|vs\b|rank)/i.test(text)) return "compare modalities";
  if (
    /(what parameters|which parameters|what should i consider|what do i need to take care of|give me a checklist|design checklist|parameter checklist|what factors matter|what should i optimize for|suggest everything pertaining to|walk me through everything i need to consider)/i.test(
      text,
    )
  ) {
    return "parameter framework";
  }
  if (
    /(biology behind|behind .*biology|disease biology|antigen biology|target biology|biological point of view|biology point of view|biological aspects|biology breakdown|possible ways .*approach|ways .*approach .*disease|approach .*disease .*biology|mechanisms? .*exploit|exploit .*mechanism|exploited .*conjugat|conjugat.* exploit|conjugation technolog.* exploit|conjugate mechanism|mechanism .*conjugate|pathways? .*target|biology .*strategy|how can .*conjugat.* (?:help|treat|cure|exploit)|possibilities)/i.test(
      text,
    )
  ) {
    return "biology strategy";
  }
  if (/(what linker|which linker|what linkers|which linkers|linker strategy|linker selection|linker type|linker types|non[- ]?cleavable|cleavable linker|hydrazone|hydrozone|acid[- ]?labile|disulfide|redox[- ]?cleavable|protease[- ]?cleavable|cathepsin|cathapsin|legumain|val[- ]?cit|val[- ]?ala|vcp|vc[- ]?pabc|pabc|self[- ]?immolative|tandem cleavage|exo[- ]?skeleton|peg.*linker|linker.*peg)/i.test(text)) return "linker strategy";
  if (/(what payload|which payload)/i.test(text)) return "payload strategy";
  if (/(what format|which format|delivery format|antibody format|binder format|what protein|which protein|what binder|which binder|what carrier|which carrier|what antibody|which antibody|what nanobody|which nanobody|what scfv|which scfv|what fab|which fab|what vhh|which vhh|igg|kappa|lambda|bispecific|trispecific|multispecific|minibody|half antibody|sip\b|small immunoprotein|affibody|adnectin|anticalin|darpin|knottin|abdurin|cyclic peptide|protein scaffold|protein format|sparse antigen|sparsely expressed|low antigen|high antigen|heavily expressed|antigen density|antigen location|antigen localization|antigen is everywhere|normal tissue expression|surface antigen|extracellular antigen|secreted antigen|shed antigen|shedding|target[- ]bearing cell|cell type|cell state|internalization biology|interernalization|receptor biology|endocytosis|clathrin|caveolin|macropinocytosis|recycling|degradation|lysosomal|endosomal|transcytosis|microenvironment|hypoxia|acidic|protease|stroma|fibrosis|interstitial pressure|vascular permeability|necrosis|immune microenvironment|tumor microenvironment)/i.test(text)) {
    return "targeting format";
  }
  if (/(what chemistr(?:y|ies)|which chemistr(?:y|ies)|what conjugation chemistry|which conjugation chemistry|describe .*conjugation chemistr(?:y|ies)|pros and cons .*conjugation chemistr(?:y|ies)|conjugation chemistr(?:y|ies).*pros and cons|various conjugation chemistr(?:y|ies)|lysine or cysteine|site-specific conjugation|enzymatic conjugation)/i.test(text)) {
    return "chemistry strategy";
  }
  if (/(what would you build|what should i build|blueprint|construct)/i.test(text)) return "build blueprint";
  if (/(conjugate for|best conjugate|best modality|what conjugate)/i.test(text)) return "best conjugate class";
  return "general conjugate guidance";
}

function extractTargetMention(text: string, state: PlannerState) {
  if (
    state.target?.trim() &&
    !looksLikeGenericTargetPhrase(state.target.trim()) &&
    !/^(possible\s+)?conjugates?\s+for\s+/i.test(state.target.trim()) &&
    !/^(best|what|which)\s+conjugates?\s+for\s+/i.test(state.target.trim())
  ) {
    return state.target.trim();
  }
  const explicitTarget = text.match(/target\s*:\s*([^\n]+)/i);
  if (explicitTarget?.[1] && !looksLikeGenericTargetPhrase(explicitTarget[1].trim())) return explicitTarget[1].trim();
  const antigenDefinition = text.match(/\b([a-z0-9][a-z0-9.\-+/αβ]{1,30})\s+is\s+(?:an?\s+)?(?:(?:unvalidated|validated|candidate|proposed|hypothetical)\s+)*(?:(?:surface|intracellular|secreted|extracellular)\s+)?(?:antigen|target|biomarker)\b/i);
  if (antigenDefinition?.[1]) {
    const target = trimTargetMention(antigenDefinition[1]);
    if (target && !looksLikeGenericTargetPhrase(target)) return target;
  }
  const targetVerb = text.match(
    /\b(?:target|targeting|against)\s+([a-z0-9][a-z0-9.\-+/αβ]{1,30})(?=\b|[?.!,;:])/i,
  );
  if (targetVerb?.[1]) {
    const target = trimTargetMention(targetVerb[1]);
    if (target && !looksLikeGenericTargetPhrase(target)) return target;
  }
  const knownTarget = findKnownEntityMention(text, TARGET_ALIAS_TABLE);
  if (knownTarget) return knownTarget;
  if (
    /^(possible\s+)?conjugates?\s+for\s+/i.test(text) ||
    /^(best|what|which)\s+conjugates?\s+for\s+/i.test(text) ||
    /^conjugate\s+directions?\s+for\s+/i.test(text) ||
    /^conjugate\s+strateg(?:y|ies)\s+for\s+/i.test(text) ||
    /^(what|which)\s+conjugate\s+directions?\s+for\s+/i.test(text)
  ) {
    return "";
  }
  const targetPhrase = text.match(/^([a-z0-9.\-+/αβ ]+?)\s+(?:for|in)\s+([a-z0-9.\-+/αβ ,()]+)$/i);
  if (targetPhrase?.[1]) {
    const left = trimPromptShapedSuffix(targetPhrase[1].trim());
    if (
      !/^(give|show|tell|make|write|summarize|summarise|explain|clarify|compare|rank|keep|final|safest|shortest|best)\b/i.test(left) &&
      !/^(what|which|why|how|can|could|should|would|do|does|is|are)\b/i.test(left) &&
      !/^(i have|we have|there is|there's)\s+(a\s+)?target antigen\b/i.test(left) &&
      !/^(a|an)\s+target antigen\b/i.test(left) &&
      !isGenericConjugateLead(left) &&
      !looksLikeGenericTargetPhrase(left)
    ) {
      return left;
    }
  }
  return "";
}

function extractDiseaseMention(text: string) {
  const knownDisease = findKnownEntityMention(text, DISEASE_ALIAS_TABLE);
  if (knownDisease) return knownDisease;
  const diseaseBeforeTarget = text.match(/\bfor\s+([a-z0-9\-+/' ,()]+?)\s+(?:targeting|against)\s+[a-z0-9.\-+/αβ]{2,30}\b/i);
  if (diseaseBeforeTarget?.[1]) return trimDiseaseClause(diseaseBeforeTarget[1].trim());
  const conjugateForDisease = text.match(
    /(?:possible conjugates?|conjugate strategies|conjugates?|conjugation technolog(?:y|ies)|creating a conjugate|build(?:ing)? a conjugate)\s+(?:for|in)\s+([a-z0-9\-+/' ,()]+?)(?:[?.!]|,\s*(?:a|an|the|grounded|using|use|derived|with|no|without)|\s+with\s+(?:no|without|unknown|unvalidated|a|an|the)|$)/i,
  );
  if (conjugateForDisease?.[1]) return trimDiseaseClause(conjugateForDisease[1].trim());
  const helpDisease = text.match(
    /(?:how can|how could|can)\s+conjugates?\s+(?:help|treat|address)\s+([a-z0-9\-+/' ,()]+?)(?:[?.!]|,\s*(?:a|an|the|grounded|using|use|derived|with|no|without)|\s+with\s+(?:no|without|unknown|unvalidated|a|an|the)|$)/i,
  );
  if (helpDisease?.[1]) return trimDiseaseClause(helpDisease[1].trim());
  const biologyDisease = text.match(
    /(?:biology\s+(?:of|behind)|disease\s+biology\s+(?:of|for)|exploit\s+the\s+biology\s+of|approach\s+the\s+biology\s+of)\s+([a-z0-9\-+/' ,()]+?)(?:\s+(?:and|then|while|but|so)\s+|\s+(?:to|for)\s+(?:deliver|treat|cure|exploit|approach|build)\b|[?.!]|$)/i,
  );
  if (biologyDisease?.[1]) return trimDiseaseClause(biologyDisease[1].trim());
  const approachDisease = text.match(/approach\s+([a-z0-9\-+/' ,()]+?)\s+(?:with|using|from|by|through)\b/i);
  if (approachDisease?.[1]) return trimDiseaseClause(approachDisease[1].trim());
  const direct = text.match(/for\s+([a-z0-9\-+/' ,()]+)$/i);
  if (direct?.[1]) return trimDiseaseClause(direct[1].trim());
  const trailing = text.match(/(?:for|in)\s+([a-z0-9\-+/' ,()]+)[?.!]?$/i);
  if (trailing?.[1]) return trimDiseaseClause(trailing[1].trim());
  return "";
}

function extractMatches(text: string, values: string[]) {
  const lower = text.toLowerCase();
  return values.filter((value) => lower.includes(value.toLowerCase()));
}

export function parseConjugateQuery(prompt: string, state: PlannerState): ParsedQuery {
  const cleanedPrompt = normalizeText(prompt);
  const lowered = cleanedPrompt.toLowerCase();
  const payloadTerms = extractMatches(lowered, [
    "mmae",
    "mertansine",
    "maytansinoid",
    "sn-38",
    "exatecan",
    "sirna",
    "aso",
    "pmo",
    "lu-177",
    "ac-225",
    "y-90",
  ]);
  const linkerTerms = extractMatches(lowered, [
    "val-cit",
    "val-ala",
    "vc-pabc",
    "vcp",
    "disulfide",
    "hydrazone",
    "hydrozone",
    "acid-labile",
    "cathepsin",
    "cathapsin",
    "legumain",
    "protease-cleavable",
    "enzyme-cleavable",
    "self-immolative",
    "pabc",
    "peg",
    "tandem cleavage",
    "exo skeleton",
    "non-cleavable",
    "cleavable",
    "dota",
    "nota",
  ]);
  const modalities = extractMatches(lowered, [
    "adc",
    "pdc",
    "smdc",
    "oligo",
    "radioligand",
    "rdc",
    "enzyme conjugate",
    "radioconjugate",
  ]);
  const mechanismHints = extractMatches(lowered, [
    "gene modulation",
    "splice",
    "knockdown",
    "rna",
    "cytotoxic",
    "radiotherapy",
    "radioligand",
    "enzyme",
    "prodrug",
    "autoimmune",
    "internalization",
  ]);

  return {
    rawPrompt: prompt,
    cleanedPrompt,
    questionType: detectQuestionType(cleanedPrompt),
    diseaseMention: extractDiseaseMention(cleanedPrompt),
    targetMention: extractTargetMention(cleanedPrompt, state),
    mentionedModalities: modalities,
    mentionedPayloadTerms: payloadTerms,
    mentionedLinkerTerms: linkerTerms,
    mechanismHints,
  };
}
