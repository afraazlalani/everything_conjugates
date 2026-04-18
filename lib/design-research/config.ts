import { MechanismClass, ModalityName, ScoreCategory } from "./types";

export const DISEASE_ALIAS_TABLE: Record<string, string[]> = {
  "inflammatory bowel disease": ["ibd", "crohn's disease", "crohns disease", "ulcerative colitis", "colitis"],
  "multiple sclerosis": ["ms"],
  "myotonic dystrophy type 1": ["dm1", "dm 1", "myotonic dystrophy", "steinert disease"],
  "duchenne muscular dystrophy": ["dmd", "duchenne"],
  "facioscapulohumeral muscular dystrophy": ["fshd", "fshd1", "fshd2", "facioscapulohumeral dystrophy"],
  "myasthenia gravis": ["mg"],
  "alzheimer disease": ["alzheimer's disease", "alzheimers disease", "alzheimer disease", "alzheimer's", "alzheimers", "ad dementia"],
  "parkinson disease": ["parkinson's disease", "parkinsons disease", "parkinson disease", "parkinson's", "parkinsons", "pd"],
  "amyotrophic lateral sclerosis": ["als", "motor neuron disease", "lou gehrig disease"],
  "rheumatoid arthritis": ["ra"],
  "systemic lupus erythematosus": ["sle", "lupus"],
};

export const TARGET_ALIAS_TABLE: Record<string, string[]> = {
  DLL3: ["dll3", "delta-like ligand 3"],
  EGFRvIII: ["egfrviii", "egfr viii", "egfr-viii"],
  "frα": ["fralpha", "folate receptor alpha", "folr1"],
  EGFR: ["erbb1"],
  HER2: ["erbb2"],
  PSMA: ["psma", "prostate-specific membrane antigen", "fOLH1", "folh1"],
  TROP2: ["trop-2", "tacstd2"],
  "Nectin-4": ["nectin4", "nectin 4", "pvrl4"],
  Mesothelin: ["msln"],
  "AChR": ["acetylcholine receptor", "achr"],
  FcRn: ["fcrn", "fcgrt"],
};

export const MODALITY_ALIAS_TABLE: Record<string, string[]> = {
  adc: ["antibody drug conjugate", "antibody-drug conjugate"],
  pdc: ["peptide drug conjugate", "peptide-drug conjugate"],
  smdc: ["small molecule drug conjugate", "small-molecule drug conjugate"],
  "oligo conjugate": ["oligonucleotide conjugate", "siRNA conjugate", "antisense conjugate", "aoc"],
  rdc: ["radioconjugate", "radioligand", "radiopharmaceutical conjugate"],
  "enzyme conjugate": ["enzyme prodrug", "enzyme-directed prodrug", "catalytic conjugate"],
};

export const PAYLOAD_ALIAS_TABLE: Record<string, string[]> = {
  "microtubule inhibitor": ["mmae", "mmaf", "mertansine", "maytansinoid"],
  radionuclide: ["lu-177", "lutetium", "actinium", "ac-225", "y-90"],
  oligo: ["sirna", "aso", "pmo", "antisense"],
};

export const LINKER_ALIAS_TABLE: Record<string, string[]> = {
  "cleavable (protease)": ["val-cit", "val-ala", "protease-cleavable"],
  "cleavable (reducible)": ["disulfide", "reducible"],
  "non-cleavable": ["non-cleavable", "stable linker"],
  "chelator / spacer system": ["chelator", "dota", "nota", "dtpa"],
};

export const SCORE_WEIGHTS: Record<ScoreCategory, number> = {
  "biology fit": 3,
  "payload mechanism compatibility": 3,
  "linker/release feasibility": 2,
  "target internalization/trafficking": 2,
  "intracellular compartment access": 2,
  "target density/turnover": 1.5,
  "conjugation/DAR/platform feasibility": 1.5,
  "PK/BD constraints": 1.5,
  "translational/species tractability": 1,
  "CMC/manufacturability complexity": 1,
  "precedent/evidence strength": 1.5,
  "safety/therapeutic-window fit": 2,
};

export const GATE_PENALTIES = {
  gatedOut: -12,
  majorPenalty: -8,
  mediumPenalty: -5,
  minorPenalty: -2,
};

export const CONFIDENCE_THRESHOLDS = {
  high: 10,
  medium: 5,
  low: 1,
  blueprintLeadGap: 4,
  insufficientUnknownCount: 3,
};

export const VIABILITY_THRESHOLDS = {
  viable: 2,
  weakBiologyCutoff: -2,
};

export const TRACE_MODE_DEFAULT = true;

export const DISEASE_MECHANISM_PROFILES: Record<
  string,
  {
    mechanismClass: MechanismClass;
    summary: string;
    rationale: string;
    plausibleDirections: string[];
    biologyQueryTerms: string[];
  }
> = {
  "facioscapulohumeral muscular dystrophy": {
    mechanismClass: "gene modulation",
    summary:
      "fshd biology is usually framed around aberrant dux4 expression and downstream muscle-toxicity programs rather than classical extracellular payload delivery.",
    rationale:
      "that makes sequence-directed oligo and delivery-handle strategies biologically more plausible than released-warhead platforms, even before a target-conditioned construct is chosen.",
    plausibleDirections: [
      "oligo conjugate / aoc-style delivery",
      "antisense or sirna logic",
      "muscle-biased uptake handles",
    ],
    biologyQueryTerms: ["fshd dux4 muscle biology", "facioscapulohumeral muscular dystrophy antisense", "fshd oligonucleotide therapy"],
  },
  "myotonic dystrophy type 1": {
    mechanismClass: "gene modulation",
    summary:
      "dm1 is usually a toxic-rna and splice-biology problem, so the mechanistic center of gravity is sequence-directed rescue rather than a classical released payload.",
    rationale:
      "that keeps oligo and conjugated oligo delivery architectures biologically plausible even before the exact scaffold or entry handle is chosen.",
    plausibleDirections: [
      "antisense / splice-rescue oligo",
      "aoc-style delivery",
      "productive intracellular routing strategies",
    ],
    biologyQueryTerms: ["myotonic dystrophy type 1 toxic rna biology", "dm1 antisense therapy", "dm1 oligonucleotide delivery"],
  },
  "duchenne muscular dystrophy": {
    mechanismClass: "gene modulation",
    summary:
      "dmd biology often points toward exon-skipping or related gene-modulation logic rather than classical cytotoxic or radiobiology payload logic.",
    rationale:
      "that makes oligo scaffolds, pmo/aso strategies, and delivery-enhanced oligo constructs much more biologically plausible than released-warhead conjugate classes.",
    plausibleDirections: [
      "exon-skipping oligo",
      "pmo / aso delivery handle",
      "peptide-conjugated oligo / aoc logic",
    ],
    biologyQueryTerms: ["duchenne exon skipping biology", "duchenne peptide conjugated pmo", "dmd oligonucleotide delivery"],
  },
  "alzheimer disease": {
    mechanismClass: "pathway modulation",
    summary:
      "alzheimer disease biology is more naturally framed as chronic cns neurodegeneration with brain-delivery and pathway-modulation constraints than as classical released-warhead payload delivery.",
    rationale:
      "that keeps transport-aware, non-cytotoxic, and pathway-matched strategies more biologically plausible than default cytotoxic or isotope-first conjugate classes at disease level.",
    plausibleDirections: [
      "bbb-shuttle or transport-aware logic",
      "small-format non-cytotoxic targeting",
      "pathway-matched conjugate strategies",
    ],
    biologyQueryTerms: ["alzheimer disease blood brain barrier", "alzheimer neurodegeneration brain delivery", "alzheimer transport-mediated therapeutic delivery"],
  },
  "parkinson disease": {
    mechanismClass: "pathway modulation",
    summary:
      "parkinson disease biology is more naturally framed as chronic cns neurodegeneration with barrier-limited delivery and pathway-matched intervention logic than as classical payload-release pharmacology.",
    rationale:
      "that keeps transport-aware, non-cytotoxic, and pathway-modulating strategies more biologically plausible than default cytotoxic or radioligand classes at disease level.",
    plausibleDirections: [
      "bbb-shuttle or transport-aware logic",
      "small-format non-cytotoxic targeting",
      "pathway-matched conjugate strategies",
    ],
    biologyQueryTerms: ["parkinson disease blood brain barrier", "parkinson neurodegeneration therapeutic delivery", "parkinson transport-mediated brain uptake"],
  },
  "amyotrophic lateral sclerosis": {
    mechanismClass: "pathway modulation",
    summary:
      "als biology is more naturally framed as chronic neurodegeneration with delivery and pathway-matched intervention constraints than as classical released-warhead payload biology.",
    rationale:
      "that keeps non-cytotoxic, transport-aware, and pathway-matched conjugate strategies more plausible than default cytotoxic classes at disease level.",
    plausibleDirections: [
      "transport-aware logic",
      "small-format non-cytotoxic targeting",
      "pathway-matched conjugate strategies"
    ],
    biologyQueryTerms: ["amyotrophic lateral sclerosis neurodegeneration", "als therapeutic delivery", "als transport-mediated cns uptake"],
  },
};
