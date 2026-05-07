import { MechanismClass, ModalityName, ScoreCategory } from "./types";

export const DISEASE_ALIAS_TABLE: Record<string, string[]> = {
  "colorectal cancer": ["crc", "colon cancer", "rectal cancer", "bowel cancer"],
  "hodgkin lymphoma": ["hodgkin's lymphoma", "hodgkins lymphoma", "hodgkin disease", "hodgkin's disease", "classical hodgkin lymphoma", "chl"],
  "inflammatory bowel disease": ["ibd", "crohn's disease", "crohns disease", "ulcerative colitis", "colitis"],
  "multiple sclerosis": ["ms"],
  glioblastoma: ["gbm", "glioblastoma multiforme"],
  "myotonic dystrophy type 1": ["dm1", "dm 1", "myotonic dystrophy", "steinert disease"],
  "duchenne muscular dystrophy": ["dmd", "duchenne"],
  "facioscapulohumeral muscular dystrophy": ["fshd", "fshd1", "fshd2", "facioscapulohumeral dystrophy"],
  "myasthenia gravis": ["mg", "myasthenia", "myastheenia gravis", "myasthania gravis", "myasthenic gravis"],
  "parkinson disease": ["parkinson's disease", "parkinsons disease", "parkinson disease", "parkinson's", "parkinsons"],
  "huntington disease": ["huntington's disease", "huntingtons disease", "huntington"],
  "amyotrophic lateral sclerosis": ["als", "motor neuron disease", "lou gehrig disease"],
  "friedreich ataxia": ["frda"],
  "spinal muscular atrophy": ["sma"],
  "progressive supranuclear palsy": ["psp"],
  "multiple system atrophy": ["msa"],
  "corticobasal degeneration": [],
  "rheumatoid arthritis": ["ra"],
  "systemic lupus erythematosus": ["sle", "lupus"],
  "hutchinson-gilford progeria syndrome": ["hutchinson gilford progeria syndrome", "progeria", "hgps"],
  "fibrodysplasia ossificans progressiva": ["fop", "fibrodysplasia ossificans progressiva"],
  "breast cancer": ["her2-positive breast cancer", "her2-low breast cancer", "triple-negative breast cancer", "tnbc"],
  "non-small cell lung cancer": ["nsclc", "lung adenocarcinoma"],
  "alzheimer disease": ["alzheimer's disease", "alzheimers disease", "alzheimer disease", "alzheimer's", "alzheimers", "ad dementia"],
  "fabry disease": ["anderson-fabry disease", "fabry"],
  "erdheim-chester disease": ["erdheim chester disease", "ecd"],
  "metabolic dysfunction-associated steatohepatitis": ["mash", "nash", "nonalcoholic steatohepatitis", "steatohepatitis"],
};

export const TARGET_ALIAS_TABLE: Record<string, string[]> = {
  CD30: ["cd30", "tnfrsf8"],
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
  PMP22: ["pmp22", "peripheral myelin protein 22"],
  "CLDN18.2": ["cldn18.2", "claudin 18.2", "claudin18.2"],
  BCMA: ["bcma", "tnfrsf17"],
  LMNA: ["lmna", "lamin a", "lamin a/c", "progerin"],
  ACVR1: ["acvr1", "alk2", "activin a receptor type 1"],
  KRAS: ["kras", "kras g12c", "g12c"],
  TfR: ["tfr", "transferrin receptor", "tfr1", "tfhr"],
  GLA: ["gla", "alpha-galactosidase a", "alpha galactosidase a"],
  BRAF: ["braf", "braf v600e", "v600e"],
  ASGPR: ["asgpr", "asialoglycoprotein receptor", "asgr1"],
  APP: ["app", "amyloid precursor protein"],
  MAPT: ["mapt", "tau"],
  TREM2: ["trem2", "triggering receptor expressed on myeloid cells 2"],
  CD19: ["cd19"],
  CD20: ["cd20", "ms4a1"],
  CD79B: ["cd79b"],
  CD68: ["cd68"],
  VWSR1: ["vwsr1"],
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
      "parkinson disease biology is more naturally framed as chronic cns neurodegeneration involving dopaminergic-neuron vulnerability, alpha-synuclein / proteostasis stress, lysosomal-autophagy pressure, mitochondrial dysfunction, neuroinflammation, and barrier-limited brain delivery than as classical payload-release pharmacology.",
    rationale:
      "that keeps transport-aware, non-cytotoxic, gene/pathway-modulating, proteostasis-supportive, lysosomal, mitochondrial, and inflammation-modulating strategies more biologically plausible than default cytotoxic or radioligand classes at disease level.",
    plausibleDirections: [
      "bbb-shuttle or transport-aware delivery logic",
      "alpha-synuclein / proteostasis-modulating conjugate strategies",
      "lysosomal-autophagy or mitochondrial-support conjugates",
      "glia / neuroinflammation-modulating delivery",
      "non-cytotoxic gene or pathway modulation",
    ],
    biologyQueryTerms: [
      "parkinson disease alpha synuclein proteostasis biology",
      "parkinson disease lysosomal autophagy mitochondrial dysfunction",
      "parkinson disease neuroinflammation blood brain barrier delivery",
      "parkinson disease transport-mediated brain uptake",
    ],
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
