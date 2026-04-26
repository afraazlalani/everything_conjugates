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
  return /^(biology|mechanism|pathway|payload|linker|format|delivery|strategy|approach|problem|case|construct|conjugate|conjugates|entry handle|target|target biology)$/.test(
    normalized,
  );
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

function detectQuestionType(text: string): QuestionType {
  if (
    /(what\s+(is|are)|explain|define|tell me about)\s+(an?\s+|the\s+)?(adc|adcs|antibody[- ]drug conjugates?|pdc|pdcs|peptide[- ]drug conjugates?|smdc|smdcs|small[- ]molecule[- ]drug conjugates?|rdc|rdcs|radioconjugates?|radioligands?|oligo conjugates?|oligonucleotide conjugates?|enzyme conjugates?)/i.test(
      text,
    )
  ) {
    return "modality explainer";
  }
  if (/(why not|why wouldn'?t|why does .* lose)/i.test(text)) return "why not";
  if (/(compare|versus|vs\b|rank)/i.test(text)) return "compare modalities";
  if (/(what linker|which linker)/i.test(text)) return "linker strategy";
  if (/(what payload|which payload)/i.test(text)) return "payload strategy";
  if (/(what format|which format|delivery format|antibody format|binder format)/i.test(text)) return "targeting format";
  if (/(what chemistr(?:y|ies)|which chemistr(?:y|ies)|what conjugation chemistry|which conjugation chemistry|lysine or cysteine|site-specific conjugation|enzymatic conjugation)/i.test(text)) {
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
  const targetPhrase = text.match(/^([a-z0-9\-+/αβ ]+?)\s+(?:for|in)\s+([a-z0-9\-+/αβ ,()]+)$/i);
  if (targetPhrase?.[1]) {
    const left = trimPromptShapedSuffix(targetPhrase[1].trim());
    if (!isGenericConjugateLead(left) && !looksLikeGenericTargetPhrase(left)) {
      return left;
    }
  }
  return "";
}

function extractDiseaseMention(text: string) {
  const knownDisease = findKnownEntityMention(text, DISEASE_ALIAS_TABLE);
  if (knownDisease) return knownDisease;
  const direct = text.match(/for\s+([a-z0-9\-+/' ,()]+)$/i);
  if (direct?.[1]) return trimPromptShapedSuffix(direct[1].trim());
  const trailing = text.match(/(?:for|in)\s+([a-z0-9\-+/' ,()]+)[?.!]?$/i);
  if (trailing?.[1]) return trimPromptShapedSuffix(trailing[1].trim());
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
    "disulfide",
    "non-cleavable",
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
