# Planner vs Baseline Pilot Review

This sheet is for manual review. All scoring fields are intentionally blank.

## eval-park-disease-only

**Prompt**

conjugates for Parkinson's disease

**Planner Output**

```text
confidence
insufficient

important note
biology is still too underdefined for a fully confident recommendation. the system is intentionally abstaining from a responsible winner and treating any ranking below as provisional only.

status
under-specified


disease-level exploration summary
parkinson disease currently reads like a neurodegeneration / pathway modulation / barrier-limited case. the current mechanism read leans toward pathway modulation. the main delivery constraints right now are blood-brain barrier access. grounded themes: cns / bbb, neurodegeneration, transport-aware implications. the most plausible strategy lanes right now are bbb-shuttled oligo / gene-modulation delivery, neuroprotective / pathway-modulating peptide or biologic logic, mitochondrial / proteostasis support conjugates, neuron- or glia-targeted delivery as a high-risk conditional lane, classical cytotoxic conjugates are a weak-fit comparator.

useful exploratory strategy buckets
- bbb-shuttled oligo / gene-modulation delivery: the grounded disease frame points to chronic cns biology where delivery is the bottleneck, so a shuttle-enabled oligo or gene-modulation lane is more plausible than free-warhead logic. entry handle / delivery logic: this bucket needs a believable receptor-mediated transport route, brain-endothelial shuttle, or other uptake handle that can create productive cns exposure instead of only peripheral binding. assumptions: there is a believable brain-entry route or transport receptor to exploit; the disease mechanism can actually be shifted by an oligo or gene/rna payload once it reaches the relevant compartment; a specific target or entry handle can later be chosen without breaking the disease-level frame failure mode: this lane collapses if the shuttle improves blood exposure but still does not deliver enough active oligo into the relevant cns cells or compartment.
- neuroprotective / pathway-modulating peptide or biologic logic: the disease frame looks more like chronic neuroprotection or pathway control than cell ablation, so a peptide-, fragment-, or compact-biologic lane is worth keeping alive if there is a tractable entry handle. entry handle / delivery logic: this lane needs a compact target, receptor, or tissue-localizing handle that can bias exposure toward the disease-setting cells without depending on broad cytotoxic payload release or oversized default formats. assumptions: the relevant disease driver can be shifted by pathway modulation rather than cell killing; a compact entry handle exists that does not make the construct too large for the access problem; the chosen format can still preserve enough exposure across the barrier failure mode: this lane fails if the entry handle is too weak or the construct becomes too large or too systemically exposed to create a useful therapeutic window.
- mitochondrial / proteostasis support conjugates: the evidence surface includes stress-response biology such as proteostasis, mitochondrial, lysosomal, or aggregate-control pressure, so a supportive targeted-conjugate lane is worth keeping conditional rather than treating every neuro case the same way. entry handle / delivery logic: this lane needs either a compact cell-entry route, organelle-biased motif, or tissue-localizing handle that can deliver a supportive payload into the stressed compartment without adding too much systemic burden. assumptions: the stress-response biology is upstream enough to matter therapeutically and not only a downstream marker; the construct can reach the relevant subcellular setting without overwhelming chronic tolerability failure mode: this lane fails if the stress-response biology is mostly secondary and the conjugate never reaches the relevant compartment with enough activity to change disease progression.
- neuron- or glia-targeted delivery as a high-risk conditional lane: the evidence surface points to specific neuronal or glial compartments, so a cell-type-targeted delivery lane is worth keeping visible as a higher-risk hypothesis rather than pretending all cns targeting is interchangeable. entry handle / delivery logic: this lane needs a truly selective neuron-, glia-, or subtype-biased entry handle that can improve exposure to the relevant cell compartment without worsening off-cell toxicity or losing too much brain penetration. assumptions: a cell-type-biased targeting handle actually exists and remains selective in vivo; the cell-type-focused lane adds something meaningful beyond a broader transport-only strategy failure mode: this lane fails if the cell-type handle is too weak, too unsafe, or too distribution-limited to improve on a broader cns delivery strategy.
- classical cytotoxic conjugates are a weak-fit comparator: it is still useful to state this lane explicitly because the disease frame is chronic, non-oncologic, and neurodegenerative, which makes classical cell-killing payload logic a generally weak default fit unless the hypothesis changes to selective cell ablation. entry handle / delivery logic: this lane would only become viable if the biology actually shifted toward a harmful cell population that should be ablated and there were a selective entry handle to do that safely. assumptions: the real therapeutic intent has changed from protection or modulation to selective ablation; a target exists that can support cytotoxic delivery without worsening vulnerable tissue loss failure mode: this lane is usually the wrong fit because the same payload logic that works in oncology can worsen chronic neurodegeneration if it is applied without a true cell-ablation rationale.

dominant constraints
blood-brain barrier access; delivery accessibility: barrier-limited; active biology location: mixed; treatment context: chronic; cytotoxic fit: discouraged; target or entry handle is still unresolved

one most useful clarifier
what brain-entry route or transport handle do you actually want to leverage?
why the planner is abstaining from a final winner
parkinson disease currently reads like a neurodegeneration / pathway modulation / barrier-limited case. the current mechanism read leans toward pathway modulation. the main delivery constraints right now are blood-brain barrier access. grounded themes: cns / bbb, neurodegeneration, transport-aware implications. the most plausible strategy lanes right now are bbb-shuttled oligo / gene-modulation delivery, neuroprotective / pathway-modulating peptide or biologic logic, mitochondrial / proteostasis support conjugates, neuron- or glia-targeted delivery as a high-risk conditional lane, classical cytotoxic conjugates are a weak-fit comparator. this is still not enough to name a responsible winner because the target, trafficking story, and exact construct logic are still underdefined.
what would make this rankable
add the subtype, target, or actual mechanism you want to leverage. for example: exon skipping, toxic-rna correction, cytotoxic delivery, radioligand localization, or enzyme/prodrug activation.
```

**Baseline Output**

```text
For **Parkinson’s disease**, the best conjugate strategies are probably **not classic ADC-style cytotoxic conjugates**. Parkinson’s is a CNS neurodegenerative disease, so the main design problem is:

**Can the conjugate reach the brain, enter the right cells, and modify disease biology without causing toxicity?**

## Best conjugate types for Parkinson’s

### 1. **BBB-shuttled oligonucleotide conjugates**

This is probably the most interesting conjugate class for Parkinson’s.

Possible payloads:

* **ASO against SNCA / alpha-synuclein**
* **siRNA against SNCA**
* ASO/siRNA against other genetic PD drivers depending on subtype, such as **LRRK2**, **GBA pathway modifiers**, or inflammatory targets

Possible conjugation formats:

* **Peptide–oligonucleotide conjugates**
* **Antibody–oligonucleotide conjugates**
* **Receptor-mediated BBB shuttle conjugates**, for example transferrin receptor, insulin receptor, or other brain endothelial transport systems
* **Nanoparticle / exosome-loaded oligonucleotide systems**

Why it makes sense: Parkinson’s is strongly linked to **alpha-synuclein aggregation/spread**, mitochondrial stress, lysosomal dysfunction, neuroinflammation, and dopaminergic neuron loss. Oligos can directly reduce disease-driving RNA/protein expression, but CNS delivery is the bottleneck. Recent reviews still identify the **blood–brain barrier as a major limitation for CNS oligonucleotide therapies**. ([PMC][1])

**My ranking:** very promising biologically, but delivery is the hardest part.

---

### 2. **Anti-alpha-synuclein antibody or antibody-like conjugates**

This is the closest clinically validated “conjugate-like” biologic direction.

Examples:

* **Prasinezumab**: monoclonal antibody against aggregated alpha-synuclein
* **Cinpanemab**: another anti-alpha-synuclein antibody, but clinical results were disappointing
* **Lu AF82422** and similar alpha-synuclein antibodies

Prasinezumab is especially relevant because it targets aggregated alpha-synuclein, a core Parkinson’s pathology. Roche/Genentech announced in 2025 that it planned to advance prasinezumab into Phase III after Phase IIb/long-term data suggested possible clinical benefit in early Parkinson’s. ([Roche][2])

The issue: antibodies usually have **poor brain penetration**, and alpha-synuclein biology is complicated because much of the pathology is intracellular, while antibodies mainly target extracellular or spreading forms. A Nature Medicine analysis reported that the PASADENA phase 2 primary endpoint was not met, although motor progression signals were observed. ([Nature][3])

**My ranking:** clinically relevant, but not clearly disease-modifying yet.

---

### 3. **GLP-1 / incretin-based conjugate or fusion approaches**

This is not a classic “conjugate” in the ADC sense, but it is very relevant for Parkinson’s therapeutic design.

GLP-1 receptor agonists are being studied because they may affect:

* neuroinflammation
* insulin signaling
* mitochondrial stress
* neuronal survival pathways

A 2024 NEJM phase 2 trial found that **lixisenatide** produced less progression of motor disability than placebo at 12 months in early Parkinson’s. ([New England Journal of Medicine][4])

Conjugate ideas:

* **GLP-1 analog–drug conjugates**
* **GLP-1 peptide–neuroprotective payload conjugates**
* **GLP-1 receptor-targeted nanoparticles**
* **dual incretin / neuroprotective constructs**

The concern is target specificity: GLP-1 biology is systemic, so side effects and peripheral pharmacology matter.

**My ranking:** promising disease-modifying direction, but more “neuroprotective biologic/platform” than precise targeted conjugate.

---

### 4. **Mitochondria-targeted antioxidant conjugates**

Parkinson’s involves mitochondrial dysfunction and oxidative stress, especially in dopaminergic neurons.

Possible conjugates:

* **Mitochondria-targeting peptide + antioxidant**
* **Triphenylphosphonium-linked antioxidant**
* **Peptide–mitochondrial stabilizer conjugate**
* **ROS-responsive nanoparticle conjugates**

Examples of payload logic:

* antioxidant
* mitophagy modulator
* mitochondrial membrane stabilizer
* Nrf2 pathway activator

This is mechanistically attractive, but Parkinson’s is not simply an oxidative stress disease. These approaches often look good preclinically but struggle clinically.

**My ranking:** good adjunct idea, lower confidence as a standalone disease-modifying therapy.

---

### 5. **Dopaminergic neuron-targeted conjugates**

In theory, you could target dopaminergic neurons using markers related to dopamine handling.

Possible targeting handles:

* dopamine transporter, **DAT/SLC6A3**
* VMAT2-related biology
* neuromelanin-associated delivery
* ligands enriched in substantia nigra dopaminergic neurons

Possible payloads:

* neuroprotective small molecules
* anti-inflammatory payloads
* mitochondrial stabilizers
* gene-regulatory oligos

The problem: DAT-targeting could disturb dopamine neuron function or concentrate toxicity in already vulnerable neurons. Also, Parkinson’s affects broader circuits beyond only dopaminergic neurons.

**My ranking:** scientifically interesting, but risky.

---

## What I would **not** prioritize

### Classic ADCs

I would **not** prioritize cytotoxic ADCs for Parkinson’s.

ADC logic works best when you want to kill a target cell, such as a cancer cell. In Parkinson’s, the goal is the opposite: **protect neurons**, reduce toxic protein biology, and modify degeneration. A cytotoxic payload would be the wrong therapeutic logic unless you were targeting a harmful immune-cell population outside the brain, which would be indirect.

### Radio-conjugates

Also not ideal. Radio-conjugates are useful for cancer imaging or killing tumor cells. For Parkinson’s, exposing vulnerable CNS tissue to radiation is not a good default therapeutic strategy. Radiotracers can be useful diagnostically, but therapeutic radio-conjugates are not a strong fit.

---

## Best overall answer

If I had to rank conjugate strategies for Parkinson’s:

| Rank | Strategy                                                                     | Confidence                     | Why                                                                           |
| ---: | ---------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
|    1 | **BBB-shuttled ASO/siRNA conjugate against SNCA or subtype-specific target** | High concept, medium execution | Best disease-biology match, but delivery is hard                              |
|    2 | **Anti-alpha-synuclein antibody / BBB-enhanced antibody**                    | Medium-high                    | Clinically advanced, but efficacy still uncertain                             |
|    3 | **GLP-1/neuroprotective peptide conjugate or targeted nanoparticle**         | Medium                         | Human signal exists for GLP-1 class, but not yet a precise conjugate solution |
|    4 | **Mitochondria-targeted antioxidant/neuroprotective conjugate**              | Medium-low                     | Mechanistically plausible but historically difficult                          |
|    5 | **DAT/dopaminergic neuron-targeted conjugate**                               | Low-medium                     | Interesting targeting, but safety concerns                                    |

## My best proposed construct

A strong Parkinson’s conjugate concept would be:

**BBB shuttle antibody or peptide + cleavable linker + SNCA-lowering ASO/siRNA**

Goal: deliver an oligo into the CNS to reduce pathological alpha-synuclein production/spread while avoiding broad systemic knockdown.

A second strong concept:

**BBB-enhanced anti-alpha-synuclein antibody**

Goal: improve brain exposure of alpha-synuclein antibodies like prasinezumab-like formats, especially for extracellular/pathology-spreading alpha-synuclein.

My honest take: for Parkinson’s, the winning conjugate is most likely to be an **oligonucleotide-delivery conjugate** or a **BBB-enhanced biologic**, not an ADC, PDC, SMDC, or radio-conjugate.

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC12242972?utm_source=chatgpt.com "Crossing the blood–brain barrier: emerging therapeutic ... - PMC"
[2]: https://www.roche.com/media/releases/med-cor-2025-06-16?utm_source=chatgpt.com "Roche to advance prasinezumab into Phase III ..."
[3]: https://www.nature.com/articles/s41591-024-02886-y?utm_source=chatgpt.com "Prasinezumab slows motor progression in rapidly ..."
[4]: https://www.nejm.org/doi/full/10.1056/NEJMoa2312323?utm_source=chatgpt.com "Trial of Lixisenatide in Early Parkinson's Disease"
```

| Field | Score |
| --- | --- |
| biological grounding |  |
| conjugation specificity |  |
| usefulness |  |
| uncertainty handling |  |
| novelty / strategy generation |  |
| hallucination risk |  |
| overall preference |  |
| notes |  |
| future benchmark idea |  |

## eval-her2-oncology

**Prompt**

best conjugate for HER2-positive breast cancer

**Planner Output**

```text
confidence
medium

scope
this is a target-conditioned recommendation, so target-specific logic may still move the ranking.

direct answer
adc is the best current fit.

why
works best when the target window is strong enough to justify a large antibody carrier and classical payload release.

dominant current playbook
Enhertu / trastuzumab deruxtecan is the strongest approved-product anchor here.

why it matters
HER2-positive breast oncology has mature adc precedent, and the current dominant playbook is no longer a generic antibody-plus-microtubule story. the core construct logic is trastuzumab-like full antibody carrier, cleavable linker, and topoisomerase I payload.

bystander logic
membrane-permeable bystander effect is part of the modern HER2 playbook, especially when HER2 expression is heterogeneous.

older comparator
Kadcyla / trastuzumab emtansine is the older comparator with non-cleavable linker and DM1 microtubule payload.

safety watchout
interstitial lung disease / pneumonitis is a major watchout in the current HER2 adc playbook.

best current fit
adc

why this is leading
works best when the target window is strong enough to justify a large antibody carrier and classical payload release.

feasible and worth ranking
1. adc
score: 10/10
why it fits: works best when the target window is strong enough to justify a large antibody carrier and classical payload release.
best evidence for: the strongest support is the biology match: a target-conditioned oncology prompt with a cell-surface biomarker still keeps adc biologically live, even if penetration and release remain hard constraints. raw 3, weight 3.
main reason against: the main reason against adc is weak direct precedent: adc linker logic usually depends on a believable internalization and release story. raw 0, weight 2.
what would have to be true for this to win: the literature and program precedent have to stay relevant to your exact target and disease setting.

not really viable here
pdc
score: 5/10
why it drops out: the main reason against pdc is still the biology mismatch: peptide-directed logic should stay conditional here unless the prompt or evidence actually gives a real peptide or shuttle reason to prefer it. raw -2, weight 3.

smdc
score: 5/10
why it drops out: the main reason against smdc is still the biology mismatch: without affirmative compact-ligand evidence, smdc should stay secondary in a target-conditioned oncology case even if the biomarker itself is real. raw -3, weight 3.

rdc
score: 3/10
why it drops out: the main reason against rdc is weak direct precedent: the payload is the radiometal system, not a classic released small-molecule payload. raw -2, weight 3.

oligo conjugate
score: 1/10
why it drops out: the main reason against oligo conjugate is still the biology mismatch: this class only makes sense when the active mechanism is sequence-directed. raw -2, weight 3.

enzyme conjugate
score: 0/10
why it drops out: the main reason against enzyme conjugate is still the biology mismatch: enzyme conjugates only win when local catalysis or prodrug activation is the real source of selectivity. raw -2, weight 3.

main watchout
the biggest risk is forcing adc logic onto a target window that cannot actually support antibody-sized delivery and intracellular cytotoxic release.

first move
confirm the target window first: disease selectivity, internalization, and whether the released species really matches the biology you want.
```

**Baseline Output**

```text
The **best conjugate for HER2-positive breast cancer is trastuzumab deruxtecan**, also called **T-DXd** or **Enhertu**.

For **unresectable or metastatic HER2-positive breast cancer**, the current strongest answer is:

## **T-DXd / Enhertu + pertuzumab**

In December 2025, the FDA approved **fam-trastuzumab deruxtecan-nxki + pertuzumab** as **first-line treatment** for adults with unresectable or metastatic **HER2-positive breast cancer** confirmed by IHC 3+ or ISH+ testing. ([U.S. Food and Drug Administration][1])

Mechanistically, this is a very strong conjugate because it combines:

**HER2 antibody targeting**
→ **cleavable linker**
→ **topoisomerase I inhibitor payload, deruxtecan**
→ **bystander killing effect**

That last part matters. HER2-positive tumors can be heterogeneous, so the membrane-permeable payload can kill nearby tumor cells even if HER2 expression is uneven.

## Why T-DXd beats T-DM1 in many metastatic settings

The older HER2 ADC is **T-DM1 / ado-trastuzumab emtansine / Kadcyla**.

T-DM1 is:

**trastuzumab + non-cleavable linker + DM1 microtubule inhibitor**

T-DXd is usually more powerful because it has:

* higher drug-to-antibody ratio
* cleavable linker
* topoisomerase I payload
* stronger bystander effect
* better activity in HER2-heterogeneous disease

In DESTINY-Breast03, T-DXd showed superior outcomes compared with T-DM1 in HER2-positive unresectable or metastatic breast cancer. ([Nature][2])

## Best answer by disease setting

| Setting                                                     | Best conjugate choice                                                  | Why                                                                                                   |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Metastatic, first-line**                                  | **T-DXd + pertuzumab**                                                 | FDA-approved first-line in Dec 2025; strongest current ADC-based option                               |
| **Metastatic after prior HER2 therapy**                     | **T-DXd**                                                              | Stronger than T-DM1 in major trials                                                                   |
| **Residual disease after neoadjuvant therapy, early-stage** | **T-DM1 historically; T-DXd emerging/possibly superior in newer data** | KATHERINE established T-DM1 benefit after residual disease; newer data suggest T-DXd may move earlier |
| **Brain metastases**                                        | T-DXd is active, but tucatinib-based HER2 therapy may be important     | CNS disease changes the choice                                                                        |
| **HER2-low / ultralow**                                     | T-DXd, not T-DM1                                                       | T-DXd works beyond classic HER2-positive disease                                                      |

## My ranking for HER2-positive breast cancer conjugates

### **1. T-DXd / Enhertu**

Best overall HER2 ADC. This is the one I would rank highest.

### **2. T-DM1 / Kadcyla**

Still important, especially historically and in early-stage residual disease. The KATHERINE trial showed that adjuvant T-DM1 improved invasive disease-free survival compared with trastuzumab in patients with residual HER2-positive early breast cancer after neoadjuvant therapy. ([New England Journal of Medicine][3])

### **3. HER2-targeted bispecific or biparatopic ADCs**

These are scientifically exciting but not the default clinical answer yet. They may improve internalization or overcome resistance.

### **4. HER2-targeted radio-conjugates**

Interesting mostly for imaging or special investigational settings, but not the best therapeutic fit compared with ADCs.

### **5. HER2 oligo conjugates**

Not the best fit right now. HER2-positive breast cancer already has very effective antibody/ADC biology, so oligo conjugation is not the first choice.

## Final answer

For **HER2-positive breast cancer**, the best conjugate is:

# **Trastuzumab deruxtecan / T-DXd / Enhertu**

And for **first-line metastatic HER2-positive breast cancer**, the best current conjugate-based regimen is:

# **T-DXd + pertuzumab**

The main caution is safety: T-DXd has an important risk of **interstitial lung disease/pneumonitis**, including severe or fatal cases, so monitoring is a major part of its use. ([ENHERTU HCP Site][4])

[1]: https://www.fda.gov/drugs/drug-approvals-and-databases/fda-approves-fam-trastuzumab-deruxtecan-nxki-pertuzumab-unresectable-or-metastatic-her2-positive?utm_source=chatgpt.com "FDA approves fam-trastuzumab-deruxtecan-nxki with ..."
[2]: https://www.nature.com/articles/s41591-024-03021-7?utm_source=chatgpt.com "long-term survival analysis of the DESTINY-Breast03 trial"
[3]: https://www.nejm.org/doi/full/10.1056/NEJMoa1814017?utm_source=chatgpt.com "Trastuzumab Emtansine for Residual Invasive HER2 ..."
[4]: https://www.enhertuhcp.com/en?utm_source=chatgpt.com "ENHERTU® (fam-trastuzumab deruxtecan-nxki) | Official HCP ..."
```

| Field | Score |
| --- | --- |
| biological grounding |  |
| conjugation specificity |  |
| usefulness |  |
| uncertainty handling |  |
| novelty / strategy generation |  |
| hallucination risk |  |
| overall preference |  |
| notes |  |
| future benchmark idea |  |

## eval-egfrviii-construct

**Prompt**

if you had to start somewhere for EGFRvIII gbm what format and linker would you try first

**Planner Output**

```text
confidence
medium

scope
this is a target-conditioned recommendation, so target-specific logic may still move the ranking.

direct answer
if i had to build first, i’d start with adc.

why
works best when the target window is strong enough to justify a large antibody carrier and classical payload release.

what this means
use the top-ranked targeting, linker, and payload logic underneath as the first construct blueprint.

what i’d choose first

format: fab / scfv-biased adc screen
why: start by screening smaller antibody-derived binders like fab, scfv, or nanobody-like formats against full igg, because blood-tumor barrier pressure, tumor penetration, and antigen heterogeneity can punish a bulky default format in brain tumors.

linker: conditional cleavable linker
why: use a cleavable linker only if internalization and intracellular release look believable enough to matter, because glioblastoma needs honest blood-tumor barrier, penetration, and cns safety discipline rather than generic adc cargo optimism.

payload: conditional cytotoxic payload direction
why: keep payload direction conditional around a membrane-permeable cytotoxic option only if the biomarker really supports uptake and heterogeneous-tumor coverage, while treating cns safety and off-tumor exposure as first-order constraints.

construct constraint
barrier-limited, helpful, blood-tumor barrier / tumor penetration, antigen heterogeneity / CNS safety window

construct tradeoff
the biggest risk is forcing adc logic onto a target window that cannot actually support antibody-sized delivery and intracellular cytotoxic release.

best current fit
adc

why this is leading
works best when the target window is strong enough to justify a large antibody carrier and classical payload release.

feasible and worth ranking
1. adc
score: 10/10
why it fits: works best when the target window is strong enough to justify a large antibody carrier and classical payload release.
best evidence for: the strongest support is the biology match: a target-conditioned oncology prompt with a cell-surface biomarker still keeps adc biologically live, even if penetration and release remain hard constraints. raw 3, weight 3.
main reason against: the main reason against adc is weak direct precedent: retrieved disease grounding points to a cns/barrier context, so safety and exposure constraints should stay front and center. raw -1, weight 2.
what would have to be true for this to win: the literature and program precedent have to stay relevant to your exact target and disease setting.

not really viable here
smdc
score: 6/10
why it drops out: the main reason against smdc is still the biology mismatch: without affirmative compact-ligand evidence, smdc should stay secondary in a target-conditioned oncology case even if the biomarker itself is real. raw -3, weight 3.

pdc
score: 5/10
why it drops out: the main reason against pdc is still the biology mismatch: peptide-directed logic should stay conditional here unless the prompt or evidence actually gives a real peptide or shuttle reason to prefer it. raw -2, weight 3.

rdc
score: 3/10
why it drops out: the main reason against rdc is weak direct precedent: the payload is the radiometal system, not a classic released small-molecule payload. raw -2, weight 3.

oligo conjugate
score: 1/10
why it drops out: the main reason against oligo conjugate is still the biology mismatch: this class only makes sense when the active mechanism is sequence-directed. raw -2, weight 3.

enzyme conjugate
score: 0/10
why it drops out: the main reason against enzyme conjugate is still the biology mismatch: enzyme conjugates only win when local catalysis or prodrug activation is the real source of selectivity. raw -2, weight 3.

main watchout
the biggest risk is forcing adc logic onto a target window that cannot actually support antibody-sized delivery and intracellular cytotoxic release.

first move
confirm the target window first: disease selectivity, internalization, and whether the released species really matches the biology you want.
```

**Baseline Output**

```text
If I had to start somewhere for **EGFRvIII glioblastoma**, I would **not start with a full IgG ADC using a classic MMAE linker-payload**.

I would start with:

# **EGFRvIII-targeted small antibody fragment or peptide-drug conjugate**

## with a **cleavable protease-sensitive linker**

## and a **membrane-permeable bystander-capable payload**

My first prototype would look like this:

> **EGFRvIII-specific scFv/Fab or high-affinity peptide ligand**
> **+ PEG/spacer-stabilized Val-Cit–PABC or tumor-protease-cleavable linker**
> **+ topoisomerase I inhibitor payload**

Something conceptually closer to a **brain-tumor-optimized mini-ADC / peptide-drug conjugate**, not a bulky conventional ADC.

---

## Why I would start there

EGFRvIII is attractive because it is tumor-specific and not normally found in healthy tissues, making it a strong GBM target in principle. But GBM creates several design problems: poor and heterogeneous blood–brain barrier/blood–tumor barrier delivery, antigen heterogeneity, infiltrative disease, and antigen escape.

A prior EGFR-directed GBM ADC, **depatuxizumab mafodotin / ABT-414**, did not improve survival in a phase 3 newly diagnosed EGFR-amplified GBM trial, so I would avoid simply copying “EGFR antibody + auristatin” as the first design.

# My first-choice format

## **Option A — EGFRvIII-specific Fab/scFv drug conjugate**

This would be my first serious format.

### Format

**Anti-EGFRvIII Fab or scFv**

* **site-specific conjugation**
* **cleavable linker**
* **bystander payload**

Why:

* Smaller than full IgG, so potentially better tumor penetration.
* More specific than broad EGFR targeting.
* Can be engineered for faster tissue distribution.
* Avoids long systemic exposure of a full IgG ADC.
* More controllable than a nanoparticle as a first mechanistic test.

I would prefer **Fab/scFv** over full IgG because GBM is infiltrative. A full IgG may bind well but distribute poorly. Also, EGFRvIII expression is heterogeneous, so deep tumor penetration matters.

## Linker I would try first

# **Protease-cleavable Val-Cit–PABC-type linker**

or a closely related **cathepsin/tumor-lysosomal cleavable linker**

Reason:

EGFRvIII internalizes, and a cleavable linker can release payload after endosomal/lysosomal processing. A non-cleavable linker may be too dependent on complete antibody degradation and may reduce bystander activity.

I would **not** start with a non-cleavable linker.

## Payload I would try first

# **Topoisomerase I inhibitor payload**

rather than MMAE, MMAF, or DM1.

Why:

* Topoisomerase I payloads can provide stronger bystander killing if membrane-permeable.
* They may handle antigen heterogeneity better.
* They are more aligned with modern ADC success.
* GBM heterogeneity argues for payload diffusion after release.

# My exact first design

## **EGFRvIII-specific Fab–Val-Cit–PABC–Topo-I ADC**

or:

## **EGFRvIII-binding peptide–cleavable linker–Topo-I payload**

The Fab version is more developable and specific.

The peptide version may penetrate better, but has higher risk around affinity, serum stability, rapid clearance, and tumor retention.

# What I would avoid first

## 1. **Full IgG + non-cleavable DM1**

Too dependent on antigen-positive cell killing. GBM has too much antigen heterogeneity.

## 2. **MMAF-style payload**

Poor bystander effect. Might be safer, but probably not aggressive enough for heterogeneous GBM.

## 3. **Pure EGFR wild-type targeting**

Riskier because wild-type EGFR is expressed in normal tissues. EGFRvIII specificity is the major advantage here.

## 4. **Radio-conjugate as first therapeutic format**

Could be interesting for imaging or local delivery, but I would not start there for systemic therapy.

# My final pick

For **EGFRvIII GBM**, I would start with:

# **EGFRvIII-specific Fab/scFv drug conjugate**

## **site-specific DAR 2–4**

## **cleavable Val-Cit–PABC or cathepsin-sensitive linker**

## **membrane-permeable topoisomerase I payload**

## **with a PEG/spacer tuned for solubility and tumor penetration**

The key design logic is:

**EGFRvIII specificity** for tumor selectivity

* **smaller format** for GBM penetration
* **cleavable linker** for intracellular release
* **bystander-capable payload** for heterogeneous tumors

That is where I would start before moving into more complex formats like bispecifics, nanoparticles, or BBB-shuttle systems.
```

| Field | Score |
| --- | --- |
| biological grounding |  |
| conjugation specificity |  |
| usefulness |  |
| uncertainty handling |  |
| novelty / strategy generation |  |
| hallucination risk |  |
| overall preference |  |
| notes |  |
| future benchmark idea |  |

## eval-dmd-exon-51

**Prompt**

best conjugates used for Duchenne muscular dystrophy focusing on the 51st exon error

**Planner Output**

```text
confidence
medium

scope
this is a target-conditioned recommendation, so target-specific logic may still move the ranking.

direct answer
oligo conjugate is the best current fit.

why
this prompt already points to exon or splice correction, so the active species should be a splice-switching oligo working on nuclear pre-mrna rather than a classical released warhead.

what matters most
the key design constraint is muscle delivery plus productive intracellular routing into muscle nuclei.

what this means
start from pmo or aso splice-switching cargo first, then decide whether peptide-conjugated oligo, antibody/fab-oligo delivery, or a simpler reference oligo is the right next lane.

reference anchors
Exondys 51 / eteplirsen: approved exon-skipping PMO comparator showing the unconjugated reference standard for exon 51 biology.
SRP-5051 / vesleteplirsen: peptide-conjugated PMO example showing the PPMO-style delivery evolution beyond a plain PMO comparator.
DYNE-251: antibody or Fab-directed oligo delivery example showing a receptor-mediated muscle-targeted lane rather than passive oligo uptake alone.
muscle-targeted oligo delivery platforms: platform-style anchor for antibody, Fab, or receptor-mediated muscle delivery architectures around splice-switching cargo.

best current fit
oligo conjugate

why this is leading
strong when the disease biology is gene modulation and the construct is meant to deliver a functional oligo scaffold instead of a classical warhead.

feasible and worth ranking
1. oligo conjugate
score: 10/10
why it fits: strong when the disease biology is gene modulation and the construct is meant to deliver a functional oligo scaffold instead of a classical warhead.
best evidence for: the strongest support is the biology match: the disease read points toward rna-directed biology. raw 3, weight 3.
main reason against: the main reason against oligo conjugate is weak direct precedent: productive trafficking is usually the main bottleneck for oligo programs. raw 0, weight 2.
what would have to be true for this to win: the literature and program precedent have to stay relevant to your exact target and disease setting.

not really viable here
enzyme conjugate
score: 0/10
why it drops out: the main reason against enzyme conjugate is still the biology mismatch: enzyme conjugates only win when local catalysis or prodrug activation is the real source of selectivity. raw -2, weight 3.

pdc
score: 0/10
why it drops out: the main reason against pdc is weak direct precedent: the safety window depends on disease context, payload mechanism, and whether chronic exposure is acceptable. raw -2, weight 2.

rdc
score: 0/10
why it drops out: the main reason against rdc is still the biology mismatch: rdc only wins when isotope localization is the real mechanism. raw -3, weight 3.

smdc
score: 0/10
why it drops out: the main reason against smdc is still the biology mismatch: smdc needs a believable compact ligand or pharmacophore entry point. raw -2, weight 3.

adc
score: 0/10
why it drops out: the main reason against adc is still the biology mismatch: adc only truly wins when the therapeutic event is intracellular payload delivery. raw -3, weight 3.

main watchout
the biggest real risk is confusing uptake with productive delivery. for oligo work, trafficking, endosomal escape, and scaffold choice usually matter more than generic target binding.

first move
start by confirming the exact rna goal first: exon skipping vs knockdown vs antisense modulation, then choose pmo vs aso vs sirna around that biology.
```

**Baseline Output**

```text
For **Duchenne muscular dystrophy caused by mutations amenable to exon 51 skipping**, the best conjugate class is:

# **Oligonucleotide conjugates / exon-skipping antisense therapies**

More specifically:

# **Peptide-conjugated PMO or antibody/fragment-conjugated exon 51 skipping oligos**

The goal is to make the DMD transcript skip **exon 51**, restore the reading frame, and allow production of a shorter but partially functional dystrophin protein.

## The clinically used standard: eteplirsen / Exondys 51

The currently established exon 51 therapy is **eteplirsen**, also called **Exondys 51**.

It is a **phosphorodiamidate morpholino oligomer**, or **PMO**, designed to bind dystrophin pre-mRNA and promote **exon 51 skipping**. It is indicated for DMD patients with a confirmed mutation amenable to exon 51 skipping.

However, eteplirsen is not really a “targeted conjugate” in the ADC sense. It is an oligonucleotide drug. Its biggest weakness is **limited muscle delivery**, especially to heart and diaphragm, so dystrophin restoration is generally modest.

## Best next-generation conjugate idea: peptide-conjugated PMO

The most biologically attractive conjugate for exon 51 DMD is:

# **PPMO: cell-penetrating peptide + PMO exon 51 oligo**

Example:

## **SRP-5051 / vesleteplirsen**

This is a **peptide-conjugated PMO** designed to improve delivery of an eteplirsen-like exon 51 skipping oligo into muscle cells. Sarepta’s SRP-5051 targets exon 51 and has been studied clinically in DMD patients amenable to exon 51 skipping.

Why it is better conceptually than eteplirsen:

| Feature | Eteplirsen PMO | Peptide-conjugated PMO |
| --- | --- | --- |
| Target | Exon 51 pre-mRNA | Exon 51 pre-mRNA |
| Delivery | Passive/limited muscle uptake | Improved muscle-cell penetration |
| Conjugate? | Not really | Yes |
| Expected dystrophin restoration | Modest | Potentially higher |
| Best use | Approved current option | Next-gen improvement |

So from a conjugation-science perspective, **PPMO is probably the best exon 51 conjugate strategy**.

## Other strong exon 51 conjugate approaches

### 1. **Antibody-oligonucleotide conjugates**

This is very interesting for DMD.

Possible format:

**anti-transferrin receptor antibody or Fab + exon 51 PMO/ASO**

Rationale:

* skeletal muscle and heart need better oligo exposure
* antibody/fragment delivery could increase tissue uptake
* transferrin receptor-mediated delivery has become a major strategy for muscle-targeted oligo delivery

For exon 51, this logic is represented by companies developing targeted oligo delivery platforms such as Dyne and Avidity-style approaches. Dyne has reported clinical exon 51 programs such as **DYNE-251**, designed to deliver exon 51 skipping therapy using an antibody-fragment conjugate approach.

My view: **this may be the most powerful long-term conjugate class** if it can deliver strongly to skeletal muscle, diaphragm, and heart safely.

### 2. **Cell-penetrating peptide–PMO conjugates**

This includes **PPMO** formats like SRP-5051/vesleteplirsen and similar next-generation peptide-oligo systems.

Best features:

* directly improves PMO uptake
* keeps the exon 51 skipping mechanism
* relatively simple conjugate design compared with antibody conjugates

Concern:

* peptide conjugation can increase kidney or safety liabilities depending on chemistry, dose, and exposure

### 3. **Engineered peptide-oligonucleotide conjugates**

These are conceptually similar to PPMOs: improve tissue penetration while keeping the exon-skipping payload.

## My ranking for exon 51 DMD

| Rank | Conjugate strategy | Example | Why |
| ---: | --- | --- | --- |
| 1 | **Antibody/Fab-oligo conjugate** | DYNE-251-like exon 51 approach | Best long-term delivery logic for muscle and possibly heart |
| 2 | **Peptide-conjugated PMO** | SRP-5051 / vesleteplirsen | Best near-term conjugate improvement over eteplirsen |
| 3 | **Engineered peptide-oligo conjugate** | PGN-EDO51-like approach | Strong delivery concept, still investigational |
| 4 | **Plain PMO** | Eteplirsen / Exondys 51 | Approved and exon-specific, but delivery is weak |
| 5 | **Gene therapy / microdystrophin** | Elevidys-type logic | Not exon 51-specific and not really a conjugate |

## Best answer

For **DMD exon 51**, the best conjugate is not an ADC, SMDC, PDC, or radio-conjugate.

The best answer is:

# **Peptide-conjugated or antibody-conjugated exon 51 skipping oligonucleotide**

If you want the **current approved reference molecule**, it is:

# **Eteplirsen / Exondys 51**

If you want the **best conjugate design scientifically**, I would pick:

# **Muscle-targeted exon 51 oligonucleotide conjugate**

with this structure:

**muscle-targeting antibody/Fab or cell-penetrating peptide**

* **stable linker**
* **PMO/ASO designed to skip exon 51**

The payload is not a toxin. The payload is the **splice-switching oligonucleotide**. The targeting/conjugation part is there to solve the real DMD problem: **getting enough oligo into skeletal muscle, diaphragm, and ideally heart to restore meaningful dystrophin.**
```

| Field | Score |
| --- | --- |
| biological grounding |  |
| conjugation specificity |  |
| usefulness |  |
| uncertainty handling |  |
| novelty / strategy generation |  |
| hallucination risk |  |
| overall preference |  |
| notes |  |
| future benchmark idea |  |

## eval-ibm-thin-evidence

**Prompt**

possible conjugates for inclusion body myositis

**Planner Output**

```text
confidence
insufficient

important note
biology is still too underdefined for a fully confident recommendation. the system is intentionally abstaining from a responsible winner and treating any ranking below as provisional only.

status
under-specified


disease-level exploration summary
inclusion body myositis currently reads like a mixed / immune modulation case. the current mechanism read leans toward immune modulation. grounded themes: immune biology. the most plausible strategy lanes right now are tissue-targeted oligo or pathway modulation, immune-modulatory targeted delivery, proteostasis / stress-response support conjugates, supportive anabolic / anti-atrophy biologic logic.

useful exploratory strategy buckets
- tissue-targeted oligo or pathway modulation: the disease frame is mixed rather than purely inflammatory, so a useful lane is tissue-targeted oligo or pathway modulation that can work inside stressed tissue instead of assuming extracellular immune modulation is the whole story. entry handle / delivery logic: this bucket needs a tissue-biased uptake route, receptor, or localizing handle that can bias delivery toward the affected tissue compartment rather than only circulating immune cells. assumptions: the disease can be shifted by tissue-directed pathway or oligo modulation rather than only systemic immune suppression; a target or entry handle can later be chosen without breaking the non-cytotoxic strategy; the delivery handle can create meaningful exposure in the affected muscle tissue failure mode: this bucket weakens if the tissue-directed lane never reaches the stressed compartment with enough productive exposure, or if the mixed pathology is actually dominated by a different biology lane.
- immune-modulatory targeted delivery: immune and inflammatory biology is still one real lane here, but it should stay alongside tissue-degenerative and stress-response lanes rather than swallowing the whole disease frame. entry handle / delivery logic: this bucket needs a selective immune-cell, stromal, or soluble-factor handle that can bias modulation toward the disease-driving compartment instead of broad systemic exposure. assumptions: the disease can be improved by modulating immune signaling or cell-state biology instead of killing tissue broadly; immune modulation is one useful lever even if it does not fully solve the degenerative tissue component; a target, cell subset, or delivery handle can be identified later for selective modulation failure mode: this bucket fails if the eventual target does not create enough selectivity or if the construct cannot shift immune biology without creating broader systemic toxicity.
- proteostasis / stress-response support conjugates: the evidence surface includes stressed-tissue biology like mitochondrial dysfunction, aggregate pressure, or broader proteostasis strain, so a protective targeted-payload lane should stay visible instead of being overwritten by the immune lane. entry handle / delivery logic: this lane needs a tissue-biased delivery handle or cell-entry route that can reach stressed muscle fibers without broad systemic burden. assumptions: the stress-response biology is upstream enough to matter therapeutically and not only a downstream marker; the construct can deliver a protective payload without exhausting chronic tolerability; the delivery handle actually improves exposure in the affected tissue compartment failure mode: this lane fails if the stress-response biology is mostly downstream noise or if the conjugate never reaches the relevant compartment with enough activity to change tissue function.
- supportive anabolic / anti-atrophy biologic logic: if the disease frame includes chronic tissue loss, weakness, or remodeling pressure, a supportive anabolic or anti-atrophy lane can be a useful conditional strategy even if it is not the whole disease-modifying story. entry handle / delivery logic: this lane needs either a tissue-biased biologic handle, a selective receptor axis, or a half-life / localization strategy that can support the affected tissue without pretending to solve every upstream mechanism at once. assumptions: preserving tissue mass or function would still be clinically meaningful even if the root disease biology remains only partly addressed; the supportive lane can be delivered chronically without losing too much selectivity or tolerability failure mode: this lane fails if it only improves a downstream wasting phenotype without changing meaningful function, or if the supportive biology adds systemic liability under chronic dosing.

dominant constraints
active biology location: mixed; treatment context: chronic; cytotoxic fit: discouraged; mixed inflammatory + degenerative biology; target or entry handle is still unresolved

one most useful clarifier
which biology lane do you want to collapse first: immune-cell modulation, muscle-targeted oligo or pathway delivery, or proteostasis / mitochondrial support?
why the planner is abstaining from a final winner
inclusion body myositis currently reads like a mixed / immune modulation case. the current mechanism read leans toward immune modulation. grounded themes: immune biology. the most plausible strategy lanes right now are tissue-targeted oligo or pathway modulation, immune-modulatory targeted delivery, proteostasis / stress-response support conjugates, supportive anabolic / anti-atrophy biologic logic. this is still not enough to name a responsible winner because the target, trafficking story, and exact construct logic are still underdefined.
what would make this rankable
add the subtype, target, or actual mechanism you want to leverage. for example: exon skipping, toxic-rna correction, cytotoxic delivery, radioligand localization, or enzyme/prodrug activation.
```

**Baseline Output**

```text

```

| Field | Score |
| --- | --- |
| biological grounding |  |
| conjugation specificity |  |
| usefulness |  |
| uncertainty handling |  |
| novelty / strategy generation |  |
| hallucination risk |  |
| overall preference |  |
| notes |  |
| future benchmark idea |  |
