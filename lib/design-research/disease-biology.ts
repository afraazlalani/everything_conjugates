import type { NormalizedCase } from "./types";

type DiseaseBiologyQuery = {
  concept: string;
  variant: string;
  query: string;
};

function clean(text?: string) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

function stripPossessiveDisease(text: string) {
  return text.replace(/’/g, "'").replace(/'s disease/gi, " disease").trim();
}

function uniqueQueries(items: DiseaseBiologyQuery[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.concept}|${item.variant}|${item.query}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildNamedDiseaseVariants(disease: string) {
  const normalized = disease.replace(/’/g, "'").trim();
  const stripped = stripPossessiveDisease(normalized);
  const variants = [normalized, stripped].filter(Boolean);

  if (/(alzheimer)/i.test(normalized)) {
    variants.push("alzheimer disease", "alzheimer's disease", "alzheimer", "ad dementia");
  }

  if (/(parkinson)/i.test(normalized)) {
    variants.push("parkinson disease", "parkinson's disease", "parkinson");
  }

  if (/(huntington)/i.test(normalized)) {
    variants.push("huntington disease", "huntington's disease", "huntington");
  }

  return [...new Set(variants.map((item) => clean(item.toLowerCase())).filter(Boolean))];
}

function buildNeurodegenerationQueries(disease: string) {
  const variants = buildNamedDiseaseVariants(disease);
  const queries: DiseaseBiologyQuery[] = [];

  variants.forEach((variant) => {
    queries.push(
      { concept: "disease biology", variant, query: `${variant} neurodegeneration` },
      { concept: "disease biology", variant, query: `${variant} amyloid tau neuronal` },
      { concept: "delivery constraints", variant, query: `${variant} blood-brain barrier` },
      { concept: "delivery constraints", variant, query: `${variant} brain delivery transport` },
      { concept: "transport-aware implications", variant, query: `${variant} receptor-mediated transport brain uptake` },
      { concept: "treatment context", variant, query: `${variant} chronic treatment disease biology` },
    );
  });

  return uniqueQueries(queries);
}

function buildOncologyQueries(disease: string) {
  const variants = buildNamedDiseaseVariants(disease);
  const isCnsTumor = /(glioblastoma|gbm|glioma|brain tumor)/i.test(disease);
  return uniqueQueries(
    variants.flatMap((variant) => [
      { concept: "disease biology", variant, query: `${variant} tumor biology` },
      { concept: "target context", variant, query: `${variant} target expression` },
      { concept: "delivery constraints", variant, query: `${variant} internalization therapeutic target` },
      { concept: "treatment context", variant, query: `${variant} treatment biology` },
      ...(isCnsTumor
        ? [
            { concept: "delivery constraints", variant, query: `${variant} blood-tumor barrier tumor penetration` },
            { concept: "delivery constraints", variant, query: `${variant} brain tumor heterogeneity therapeutic delivery` },
          ]
        : []),
    ]),
  );
}

function buildAutoimmuneQueries(disease: string) {
  const variants = buildNamedDiseaseVariants(disease);
  return uniqueQueries(
    variants.flatMap((variant) => [
      { concept: "disease biology", variant, query: `${variant} immune mechanism` },
      { concept: "disease biology", variant, query: `${variant} autoantibody complement` },
      { concept: "treatment context", variant, query: `${variant} chronic treatment tolerability` },
      { concept: "delivery constraints", variant, query: `${variant} intervention biology` },
    ]),
  );
}

function buildNeuromuscularQueries(disease: string) {
  const variants = buildNamedDiseaseVariants(disease);
  return uniqueQueries(
    variants.flatMap((variant) => [
      { concept: "disease biology", variant, query: `${variant} disease mechanism` },
      { concept: "disease biology", variant, query: `${variant} muscle pathology` },
      { concept: "delivery constraints", variant, query: `${variant} intracellular delivery` },
      { concept: "treatment context", variant, query: `${variant} therapeutic oligonucleotide delivery` },
    ]),
  );
}

function buildGenericQueries(disease: string) {
  const variants = buildNamedDiseaseVariants(disease);
  return uniqueQueries(
    variants.flatMap((variant) => [
      { concept: "disease biology", variant, query: `${variant} disease mechanism` },
      { concept: "disease biology", variant, query: `${variant} pathogenesis biology` },
      { concept: "treatment context", variant, query: `${variant} therapeutic delivery` },
      { concept: "delivery constraints", variant, query: `${variant} treatment intervention` },
    ]),
  );
}

export function buildDiseaseBiologyQueries(input: NormalizedCase): DiseaseBiologyQuery[] {
  const disease = clean(input.disease?.canonical ?? input.parsed.diseaseMention ?? input.prompt);
  if (!disease) return [];

  if (/(alzheimer|parkinson|huntington|neurodegenerative|brain|cns)/i.test(disease)) {
    return buildNeurodegenerationQueries(disease);
  }

  if (input.diseaseArea === "oncology") {
    return buildOncologyQueries(disease);
  }

  if (input.diseaseArea === "autoimmune") {
    return buildAutoimmuneQueries(disease);
  }

  if (input.diseaseArea === "neuromuscular") {
    return buildNeuromuscularQueries(disease);
  }

  return buildGenericQueries(disease);
}

export type { DiseaseBiologyQuery };
