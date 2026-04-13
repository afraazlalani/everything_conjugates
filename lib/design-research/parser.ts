import { ParsedQuery, PlannerState, QuestionType } from "./types";

function detectQuestionType(text: string): QuestionType {
  if (/(why not|why wouldn'?t|why does .* lose)/i.test(text)) return "why not";
  if (/(compare|versus|vs\b|rank)/i.test(text)) return "compare modalities";
  if (/(what linker|which linker)/i.test(text)) return "linker strategy";
  if (/(what payload|which payload)/i.test(text)) return "payload strategy";
  if (/(what format|which format|antibody format|binder format)/i.test(text)) return "targeting format";
  if (/(what would you build|what should i build|blueprint|construct)/i.test(text)) return "build blueprint";
  if (/(conjugate for|best conjugate|best modality|what conjugate)/i.test(text)) return "best conjugate class";
  return "general conjugate guidance";
}

function extractTargetMention(text: string, state: PlannerState) {
  if (
    state.target?.trim() &&
    !/^(possible\s+)?conjugates?\s+for\s+/i.test(state.target.trim()) &&
    !/^(best|what|which)\s+conjugates?\s+for\s+/i.test(state.target.trim())
  ) {
    return state.target.trim();
  }
  const explicitTarget = text.match(/target\s*:\s*([^\n]+)/i);
  if (explicitTarget?.[1]) return explicitTarget[1].trim();
  if (/^(possible\s+)?conjugates?\s+for\s+/i.test(text) || /^(best|what|which)\s+conjugates?\s+for\s+/i.test(text)) {
    return "";
  }
  const targetPhrase = text.match(/([a-z0-9\-+/αβ ]+?)\s+for\s+([a-z0-9\-+/αβ ,()]+)$/i);
  if (targetPhrase?.[1] && targetPhrase?.[2]) {
    const left = targetPhrase[1].trim().toLowerCase();
    if (
      !/^(possible conjugates|conjugate|conjugates|best conjugate|best conjugates|what conjugate|what conjugates|which conjugate|which conjugates)$/.test(
        left,
      )
    ) {
      return `${targetPhrase[1].trim()} for ${targetPhrase[2].trim()}`;
    }
  }
  return "";
}

function extractDiseaseMention(text: string) {
  const direct = text.match(/for\s+([a-z0-9\-+/ ,()]+)$/i);
  if (direct?.[1]) return direct[1].trim();
  return "";
}

function extractMatches(text: string, values: string[]) {
  const lower = text.toLowerCase();
  return values.filter((value) => lower.includes(value.toLowerCase()));
}

export function parseConjugateQuery(prompt: string, state: PlannerState): ParsedQuery {
  const cleanedPrompt = prompt.replace(/\s+/g, " ").trim();
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
