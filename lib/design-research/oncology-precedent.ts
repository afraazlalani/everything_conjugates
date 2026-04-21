import { ModalityName, NormalizedCase, OncologyPrecedentPlaybook } from "./types";

const ONCOLOGY_PLAYBOOKS: OncologyPrecedentPlaybook[] = [
  {
    target: "HER2",
    diseasePattern: "HER2-positive breast cancer",
    modality: "adc",
    strength: "high",
    dominantProduct: {
      label: "Enhertu / trastuzumab deruxtecan",
      href: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-fam-trastuzumab-deruxtecan-nxki-unresectable-or-metastatic-her2-positive-breast-cancer",
      format: "trastuzumab-like full antibody carrier",
      linker: "cleavable linker",
      payload: "topoisomerase I payload",
      bystander: "membrane-permeable bystander effect is part of the modern HER2 playbook, especially when HER2 expression is heterogeneous.",
      safetyWatchout: "interstitial lung disease / pneumonitis is a major watchout in the current HER2 adc playbook.",
    },
    comparatorProduct: {
      label: "Kadcyla / trastuzumab emtansine",
      href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2013/125427lbl.pdf",
      format: "trastuzumab-like full antibody carrier",
      linker: "non-cleavable linker",
      payload: "DM1 microtubule payload",
    },
    rationale:
      "HER2-positive breast oncology has mature adc precedent, and the current dominant playbook is no longer a generic antibody-plus-microtubule story.",
    sourceLabels: ["Enhertu FDA approval", "Kadcyla label"],
  },
  {
    target: "TROP2",
    diseasePattern: "TROP2-positive epithelial oncology",
    modality: "adc",
    strength: "high",
    dominantProduct: {
      label: "Trodelvy / sacituzumab govitecan",
      href: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-grants-regular-approval-sacituzumab-govitecan-triple-negative-breast-cancer",
      format: "full antibody carrier",
      linker: "hydrolyzable cleavable linker",
      payload: "SN-38 topoisomerase I payload",
      bystander: "the payload and linker combination supports bystander-style logic in heterogeneous epithelial tumors.",
      safetyWatchout: "neutropenia and diarrhea remain key watchouts in the TROP2 adc playbook.",
    },
    rationale:
      "TROP2-positive oncology already has a modern adc precedent built around a cleavable linker and topoisomerase I payload rather than a generic microtubule default.",
    sourceLabels: ["Trodelvy FDA approval"],
  },
  {
    target: "NECTIN4",
    diseasePattern: "Nectin-4 urothelial oncology",
    modality: "adc",
    strength: "high",
    dominantProduct: {
      label: "Padcev / enfortumab vedotin",
      href: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-enfortumab-vedotin-ejfv-locally-advanced-or-metastatic-urothelial-cancer",
      format: "full antibody carrier",
      linker: "protease-cleavable linker",
      payload: "MMAE microtubule payload",
      safetyWatchout: "neuropathy and skin toxicity remain important watchouts in the Nectin-4 adc playbook.",
    },
    rationale:
      "Nectin-4 oncology has real approved adc precedent, but the payload and safety logic are different from HER2 or TROP2 topoisomerase-first playbooks.",
    sourceLabels: ["Padcev FDA approval"],
  },
  {
    target: "FOLR1",
    diseasePattern: "FOLR1 ovarian oncology",
    modality: "adc",
    strength: "medium",
    dominantProduct: {
      label: "Elahere / mirvetuximab soravtansine",
      href: "https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-mirvetuximab-soravtansine-gynx-folate-receptor-alpha-positive-platinum-resistant",
      format: "full antibody carrier",
      linker: "cleavable disulfide linker",
      payload: "DM4 maytansinoid payload",
      safetyWatchout: "ocular toxicity remains a central watchout in the FOLR1 adc playbook.",
    },
    rationale:
      "FOLR1-positive ovarian oncology has meaningful adc precedent, but it does not automatically imply the same bystander-heavy topoisomerase logic as HER2 or TROP2.",
    sourceLabels: ["Elahere FDA approval"],
  },
];

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function targetMatches(playbook: OncologyPrecedentPlaybook, input: NormalizedCase, text: string) {
  const target = input.target?.canonical?.toUpperCase() ?? "";
  if (target && target === playbook.target) return true;
  return normalizeText(text).includes(normalizeText(playbook.target));
}

function diseaseContextMatches(playbook: OncologyPrecedentPlaybook, text: string) {
  const normalized = normalizeText(text);
  if (playbook.target === "HER2") return /breast/.test(normalized);
  if (playbook.target === "NECTIN4") return /urothelial|bladder/.test(normalized);
  if (playbook.target === "FOLR1") return /ovarian/.test(normalized);
  if (playbook.target === "TROP2") return /breast|lung|epithelial|solid tumor|tumor/.test(normalized);
  return false;
}

export function selectOncologyPrecedentPlaybook(
  input: NormalizedCase,
  prompt: string,
  topModality?: ModalityName,
): OncologyPrecedentPlaybook | null {
  if (
    input.diseaseArea !== "oncology" ||
    input.recommendationScope !== "target-conditioned" ||
    !input.target?.canonical ||
    !topModality
  ) {
    return null;
  }

  const combinedText = `${prompt} ${input.target.canonical} ${input.disease?.canonical ?? ""}`;
  const matches = ONCOLOGY_PLAYBOOKS.filter(
    (playbook) =>
      playbook.modality === topModality &&
      targetMatches(playbook, input, combinedText) &&
      diseaseContextMatches(playbook, combinedText),
  );

  return matches[0] ?? null;
}
