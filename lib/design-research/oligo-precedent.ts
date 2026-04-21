import { BiologicalAbstraction, ModalityName, NormalizedCase, OligoPrecedentAnchorSet } from "./types";

type OligoPrecedentDefinition = OligoPrecedentAnchorSet & {
  diseaseMatch: RegExp;
};

const OLIGO_PRECEDENT_DEFINITIONS: OligoPrecedentDefinition[] = [
  {
    modality: "oligo conjugate",
    mechanismPattern: "splice-switching",
    strength: "high",
    diseaseMatch: /(duchenne|dmd|exon 51|51st exon)/i,
    approvedComparator: {
      label: "Exondys 51 / eteplirsen",
      href: "https://www.fda.gov/drugs/drug-safety-and-availability/fda-grants-accelerated-approval-first-drug-duchenne-muscular-dystrophy",
      role: "approved exon-skipping PMO comparator showing the unconjugated reference standard for exon 51 biology.",
    },
    conjugatedExample: {
      label: "SRP-5051 / vesleteplirsen",
      href: "https://clinicaltrials.gov/study/NCT05039710",
      role: "peptide-conjugated PMO example showing the PPMO-style delivery evolution beyond a plain PMO comparator.",
    },
    targetedDeliveryExample: {
      label: "DYNE-251",
      href: "https://clinicaltrials.gov/study/NCT05524883",
      role: "antibody or Fab-directed oligo delivery example showing a receptor-mediated muscle-targeted lane rather than passive oligo uptake alone.",
    },
    platformAnchor: {
      label: "muscle-targeted oligo delivery platforms",
      href: "https://pubmed.ncbi.nlm.nih.gov/39124468/",
      role: "platform-style anchor for antibody, Fab, or receptor-mediated muscle delivery architectures around splice-switching cargo.",
    },
    rationale:
      "high-specificity exon or splice prompts should not stop at generic oligo language when approved and investigational anchor examples already exist for comparator, conjugated, and targeted-delivery lanes.",
    sourceLabels: ["Exondys 51 FDA approval", "SRP-5051 clinical record", "DYNE-251 clinical record"],
  },
  {
    modality: "oligo conjugate",
    mechanismPattern: "splice-switching",
    strength: "medium",
    diseaseMatch: /(myotonic dystrophy|dm1|steinert)/i,
    approvedComparator: undefined,
    conjugatedExample: {
      label: "AOC 1001 / delpacibart etedesiran",
      href: "https://clinicaltrials.gov/study/NCT05479981",
      role: "AOC-style conjugated oligo example showing sequence-directed toxic-RNA biology moving into a targeted-delivery architecture.",
    },
    targetedDeliveryExample: {
      label: "AOC-style antibody-oligo delivery logic",
      href: "https://pubmed.ncbi.nlm.nih.gov/39126099/",
      role: "platform anchor for antibody-linked oligo delivery in splice or toxic-RNA disease settings.",
    },
    platformAnchor: {
      label: "DM1 antisense / splice-rescue review",
      href: "https://pubmed.ncbi.nlm.nih.gov/39126099/",
      role: "review anchor for splice-rescue and toxic-RNA correction logic in myotonic dystrophy type 1.",
    },
    rationale:
      "splice or toxic-RNA cases should surface real conjugated-oligo and platform anchors when the biology already points to sequence-directed rescue.",
    sourceLabels: ["AOC 1001 clinical record", "DM1 splice-rescue review"],
  },
];

function looksLikeSpliceCase(text: string, abstraction: BiologicalAbstraction) {
  return (
    abstraction.therapeuticIntent === "gene/rna modulation" &&
    abstraction.compartmentNeed === "nuclear" &&
    /(splice|exon|transcript correction|transcript rescue|splice-switching|exon skipping|exon-skipping|pmo|aso|antisense)/i.test(
      text,
    )
  );
}

export function selectOligoPrecedentAnchors(
  input: NormalizedCase,
  prompt: string,
  abstraction: BiologicalAbstraction,
  topModality?: ModalityName,
): OligoPrecedentAnchorSet | null {
  if (topModality !== "oligo conjugate") return null;

  const combinedText = `${prompt} ${input.prompt} ${input.disease?.canonical ?? ""} ${input.target?.canonical ?? ""}`;
  if (!looksLikeSpliceCase(combinedText, abstraction)) {
    return null;
  }

  const matched = OLIGO_PRECEDENT_DEFINITIONS.find((item) => item.diseaseMatch.test(combinedText));
  if (matched) {
    return matched;
  }

  return {
    modality: "oligo conjugate",
    mechanismPattern: "splice-switching",
    strength: "medium",
    approvedComparator: undefined,
    conjugatedExample: undefined,
    targetedDeliveryExample: undefined,
    platformAnchor: {
      label: "splice-switching oligo delivery review",
      href: "https://pubmed.ncbi.nlm.nih.gov/39124468/",
      role: "platform-style anchor for delivery-enhanced splice-switching oligo strategies when disease-specific product anchors are still sparse.",
    },
    rationale:
      "even when the disease-specific anchor set is thinner, mechanism-specific splice prompts can still surface platform-style delivery examples as concrete reference points.",
    sourceLabels: ["splice-switching oligo delivery review"],
  };
}
