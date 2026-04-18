# Planner vs Baseline Pilot Review

Use this sheet to score the first 5 pilot cases manually. Planner outputs and baseline outputs are shown side by side below. Human scoring fields are intentionally left blank.

## 1. `eval-park-disease-only`

**Prompt**  
`conjugates for Parkinson's disease`

**Planner Output**

```text
confidence
insufficient

important note
biology is still too underdefined for a fully confident recommendation. the system is intentionally abstaining from a responsible winner and treating any ranking below as provisional only.

status
under-specified

why the planner is abstaining
the prompt names a specific disease, and the disease-level biology now points toward bbb-shuttle or transport-aware logic, small-format or pathway-matched conjugate strategies, non-cytotoxic targeted architectures as plausible directions. the strongest grounded themes right now are cns / bbb, neurodegeneration, transport-aware implications. but the target, trafficking story, and exact construct logic are still too underdefined to choose a responsible winner.

disease-level mechanistic read
the retrieved evidence points toward pathway- or transport-aware disease biology rather than classical released-warhead delivery. that makes non-cytotoxic, transport-aware, or pathway-matched conjugate strategies more plausible at disease level, while still leaving the final construct open until target and entry-handle details are clearer.

what would make this rankable
add the subtype, target, or actual mechanism you want to leverage. for example: exon skipping, toxic-rna correction, cytotoxic delivery, radioligand localization, or enzyme/prodrug activation.

useful exploratory strategy buckets
- transport-aware non-cytotoxic targeting: the grounded biology points to a barrier-limited chronic disease context, so transport-aware delivery and non-cytotoxic mechanism logic are more plausible than classical free-warhead release.
- non-cytotoxic pathway-matched targeting: the disease frame looks more like chronic pathway control than kill-and-release payload logic, so a non-cytotoxic targeted architecture is a more plausible starting bucket.
```

**Baseline Output**

```text
For Parkinson’s disease, the best conjugate strategies are probably not classic ADC-style cytotoxic conjugates. Parkinson’s is a CNS neurodegenerative disease, so the main design problem is:

Can the conjugate reach the brain, enter the right cells, and modify disease biology without causing toxicity?

Best conjugate types for Parkinson’s

1. BBB-shuttled oligonucleotide conjugates

This is probably the most interesting conjugate class for Parkinson’s.

Possible payloads:

- ASO against SNCA / alpha-synuclein
- siRNA against SNCA
- ASO/siRNA against other genetic PD drivers depending on subtype, such as LRRK2, GBA pathway modifiers, or inflammatory targets

Possible conjugation formats:

- Peptide–oligonucleotide conjugates
- Antibody–oligonucleotide conjugates
- Receptor-mediated BBB shuttle conjugates, for example transferrin receptor, insulin receptor, or other brain endothelial transport systems
- Nanoparticle / exosome-loaded oligonucleotide systems

Why it makes sense: Parkinson’s is strongly linked to alpha-synuclein aggregation/spread, mitochondrial stress, lysosomal dysfunction, neuroinflammation, and dopaminergic neuron loss. Oligos can directly reduce disease-driving RNA/protein expression, but CNS delivery is the bottleneck. Recent reviews still identify the blood–brain barrier as a major limitation for CNS oligonucleotide therapies. ([PMC][1])

My ranking: very promising biologically, but delivery is the hardest part.

2. Anti-alpha-synuclein antibody or antibody-like conjugates

This is the closest clinically validated “conjugate-like” biologic direction.

Examples:

- Prasinezumab: monoclonal antibody against aggregated alpha-synuclein
- Cinpanemab: another anti-alpha-synuclein antibody, but clinical results were disappointing
- Lu AF82422 and similar alpha-synuclein antibodies

Prasinezumab is especially relevant because it targets aggregated alpha-synuclein, a core Parkinson’s pathology. Roche/Genentech announced in 2025 that it planned to advance prasinezumab into Phase III after Phase IIb/long-term data suggested possible clinical benefit in early Parkinson’s. ([Roche][2])

The issue: antibodies usually have poor brain penetration, and alpha-synuclein biology is complicated because much of the pathology is intracellular, while antibodies mainly target extracellular or spreading forms. A Nature Medicine analysis reported that the PASADENA phase 2 primary endpoint was not met, although motor progression signals were observed. ([Nature][3])

My ranking: clinically relevant, but not clearly disease-modifying yet.

3. GLP-1 / incretin-based conjugate or fusion approaches

This is not a classic “conjugate” in the ADC sense, but it is very relevant for Parkinson’s therapeutic design.

GLP-1 receptor agonists are being studied because they may affect:

- neuroinflammation
- insulin signaling
- mitochondrial stress
- neuronal survival pathways

A 2024 NEJM phase 2 trial found that lixisenatide produced less progression of motor disability than placebo at 12 months in early Parkinson’s. ([New England Journal of Medicine][4])

Conjugate ideas:

- GLP-1 analog–drug conjugates
- GLP-1 peptide–neuroprotective payload conjugates
- GLP-1 receptor-targeted nanoparticles
- dual incretin / neuroprotective constructs

The concern is target specificity: GLP-1 biology is systemic, so side effects and peripheral pharmacology matter.

My ranking: promising disease-modifying direction, but more “neuroprotective biologic/platform” than precise targeted conjugate.

4. Mitochondria-targeted antioxidant conjugates

Parkinson’s involves mitochondrial dysfunction and oxidative stress, especially in dopaminergic neurons.

Possible conjugates:

- Mitochondria-targeting peptide + antioxidant
- Triphenylphosphonium-linked antioxidant
- Peptide–mitochondrial stabilizer conjugate
- ROS-responsive nanoparticle conjugates

Examples of payload logic:

- antioxidant
- mitophagy modulator
- mitochondrial membrane stabilizer
- Nrf2 pathway activator

This is mechanistically attractive, but Parkinson’s is not simply an oxidative stress disease. These approaches often look good preclinically but struggle clinically.

My ranking: good adjunct idea, lower confidence as a standalone disease-modifying therapy.

5. Dopaminergic neuron-targeted conjugates

In theory, you could target dopaminergic neurons using markers related to dopamine handling.

Possible targeting handles:

- dopamine transporter, DAT/SLC6A3
- VMAT2-related biology
- neuromelanin-associated delivery
- ligands enriched in substantia nigra dopaminergic neurons

Possible payloads:

- neuroprotective small molecules
- anti-inflammatory payloads
- mitochondrial stabilizers
- gene-regulatory oligos

The problem: DAT-targeting could disturb dopamine neuron function or concentrate toxicity in already vulnerable neurons. Also, Parkinson’s affects broader circuits beyond only dopaminergic neurons.

My ranking: scientifically interesting, but risky.

What I would not prioritize

Classic ADCs

I would not prioritize cytotoxic ADCs for Parkinson’s.

ADC logic works best when you want to kill a target cell, such as a cancer cell. In Parkinson’s, the goal is the opposite: protect neurons, reduce toxic protein biology, and modify degeneration. A cytotoxic payload would be the wrong therapeutic logic unless you were targeting a harmful immune-cell population outside the brain, which would be indirect.

Radio-conjugates

Also not ideal. Radio-conjugates are useful for cancer imaging or killing tumor cells. For Parkinson’s, exposing vulnerable CNS tissue to radiation is not a good default therapeutic strategy. Radiotracers can be useful diagnostically, but therapeutic radio-conjugates are not a strong fit.

Best overall answer

If I had to rank conjugate strategies for Parkinson’s:

1. BBB-shuttled ASO/siRNA conjugate against SNCA or subtype-specific target
2. Anti-alpha-synuclein antibody / BBB-enhanced antibody
3. GLP-1/neuroprotective peptide conjugate or targeted nanoparticle
4. Mitochondria-targeted antioxidant/neuroprotective conjugate
5. DAT/dopaminergic neuron-targeted conjugate

My best proposed construct

A strong Parkinson’s conjugate concept would be:

BBB shuttle antibody or peptide + cleavable linker + SNCA-lowering ASO/siRNA

Goal: deliver an oligo into the CNS to reduce pathological alpha-synuclein production/spread while avoiding broad systemic knockdown.

A second strong concept:

BBB-enhanced anti-alpha-synuclein antibody

Goal: improve brain exposure of alpha-synuclein antibodies like prasinezumab-like formats, especially for extracellular/pathology-spreading alpha-synuclein.

My honest take: for Parkinson’s, the winning conjugate is most likely to be an oligonucleotide-delivery conjugate or a BBB-enhanced biologic, not an ADC, PDC, SMDC, or radio-conjugate.
```

**Scoring**

| field | score / note |
|---|---|
| biological grounding | |
| conjugation specificity | |
| usefulness | |
| uncertainty handling | |
| novelty / strategy generation | |
| hallucination risk | |
| overall preference (`planner` / `baseline` / `tie` / `both-weak`) | |
| notes | |
| future benchmark idea | |

## 2. `eval-her2-oncology`

**Prompt**  
`best conjugate for HER2-positive breast cancer`

**Planner Output**

```text
confidence
low

scope
this is a target-conditioned recommendation, so target-specific logic may still move the ranking.

direct answer
if i had to build first, i’d start with smdc.

why
strong when the targeting pharmacophore itself is small, validated, and tolerant of linker and payload attachment.

what this means
use the top-ranked targeting, linker, and payload logic underneath as the first construct blueprint.

what i’d choose first

format: small-molecule ligand conjugate
why: start with a compact ligand-led format only if the pharmacophore still behaves like the same binder after real attachment chemistry is installed.

linker: compact stable linker
why: keep the linker compact and polarity-aware so the pharmacophore does not collapse before the payload ever matters.

payload: compact payload direction
why: payload direction should stay compact and exposure-aware, because small-format systems get punished early by bulk, polarity, and off-target distribution.

construct constraint
systemic accessible, helpful

construct tradeoff
the biggest risk is that the ligand stops being the same ligand once the linker and payload are real. compact formats get punished early by pk and pharmacophore disruption.

best current fit
smdc

why this is leading
strong when the targeting pharmacophore itself is small, validated, and tolerant of linker and payload attachment.

feasible and worth ranking
1. smdc
score: 3/10
why it fits: strong when the targeting pharmacophore itself is small, validated, and tolerant of linker and payload attachment.
best evidence for: the strongest support is the biology match: smdc needs a believable compact ligand or pharmacophore entry point. raw 1, weight 3.
main reason against: the main reason against smdc is weak direct precedent: the safety window depends on disease context, payload mechanism, and whether chronic exposure is acceptable. raw -2, weight 2.
what would have to be true for this to win: the literature and program precedent have to stay relevant to your exact target and disease setting.

not really viable here
smdc
score: 3/10
why it drops out: the main reason against smdc is weak direct precedent: the safety window depends on disease context, payload mechanism, and whether chronic exposure is acceptable. raw -2, weight 2.

pdc
score: 3/10
why it drops out: the main reason against pdc is weak direct precedent: the safety window depends on disease context, payload mechanism, and whether chronic exposure is acceptable. raw -2, weight 2.

rdc
score: 3/10
why it drops out: the main reason against rdc is weak direct precedent: the payload is the radiometal system, not a classic released small-molecule payload. raw -2, weight 3.

adc
score: 2/10
why it drops out: the main reason against adc is weak direct precedent: antibody-drug conjugates are optimized for warhead delivery, not sequence rescue. raw -2, weight 3.

oligo conjugate
score: 1/10
why it drops out: the main reason against oligo conjugate is still the biology mismatch: this class only makes sense when the active mechanism is sequence-directed. raw -2, weight 3.

enzyme conjugate
score: 0/10
why it drops out: the main reason against enzyme conjugate is still the biology mismatch: enzyme conjugates only win when local catalysis or prodrug activation is the real source of selectivity. raw -2, weight 3.

main watchout
the biggest risk is that the ligand stops being the same ligand once the linker and payload are real. compact formats get punished early by pk and pharmacophore disruption.

first move
prove that the small-molecule binder still keeps useful affinity after the real attachment vector is installed.
```

**Baseline Output**

```text
The best conjugate for HER2-positive breast cancer is trastuzumab deruxtecan, also called T-DXd or Enhertu.

For unresectable or metastatic HER2-positive breast cancer, the current strongest answer is:

T-DXd / Enhertu + pertuzumab

In December 2025, the FDA approved fam-trastuzumab deruxtecan-nxki + pertuzumab as first-line treatment for adults with unresectable or metastatic HER2-positive breast cancer confirmed by IHC 3+ or ISH+ testing.

Mechanistically, this is a very strong conjugate because it combines:

HER2 antibody targeting
→ cleavable linker
→ topoisomerase I inhibitor payload, deruxtecan
→ bystander killing effect

That last part matters. HER2-positive tumors can be heterogeneous, so the membrane-permeable payload can kill nearby tumor cells even if HER2 expression is uneven.

Why T-DXd beats T-DM1 in many metastatic settings

The older HER2 ADC is T-DM1 / ado-trastuzumab emtansine / Kadcyla.

T-DM1 is:

trastuzumab + non-cleavable linker + DM1 microtubule inhibitor

T-DXd is usually more powerful because it has:

- higher drug-to-antibody ratio
- cleavable linker
- topoisomerase I payload
- stronger bystander effect
- better activity in HER2-heterogeneous disease

In DESTINY-Breast03, T-DXd showed superior outcomes compared with T-DM1 in HER2-positive unresectable or metastatic breast cancer.

Best answer by disease setting

- Metastatic, first-line: T-DXd + pertuzumab
- Metastatic after prior HER2 therapy: T-DXd
- Residual disease after neoadjuvant therapy, early-stage: T-DM1 historically; T-DXd emerging
- Brain metastases: T-DXd is active, but tucatinib-based HER2 therapy may be important
- HER2-low / ultralow: T-DXd

My ranking for HER2-positive breast cancer conjugates

1. T-DXd / Enhertu
2. T-DM1 / Kadcyla
3. HER2-targeted bispecific or biparatopic ADCs
4. HER2-targeted radio-conjugates
5. HER2 oligo conjugates

Final answer

For HER2-positive breast cancer, the best conjugate is:

Trastuzumab deruxtecan / T-DXd / Enhertu

And for first-line metastatic HER2-positive breast cancer, the best current conjugate-based regimen is:

T-DXd + pertuzumab

The main caution is safety: T-DXd has an important risk of interstitial lung disease/pneumonitis, including severe or fatal cases, so monitoring is a major part of its use.
```

**Scoring**

| field | score / note |
|---|---|
| biological grounding | |
| conjugation specificity | |
| usefulness | |
| uncertainty handling | |
| novelty / strategy generation | |
| hallucination risk | |
| overall preference (`planner` / `baseline` / `tie` / `both-weak`) | |
| notes | |
| future benchmark idea | |

## 3. `eval-dmd-exon-51`

**Prompt**  
`best conjugates used for Duchenne muscular dystrophy focusing on the 51st exon error`

**Planner Output**

```text
confidence
insufficient

important note
biology is still too underdefined for a fully confident recommendation. the system is intentionally abstaining from a responsible winner and treating any ranking below as provisional only.

status
under-specified

why the planner is abstaining
the prompt names a specific disease, and the disease-level biology now points toward oligo conjugate, aoc-style delivery, productive intracellular routing as plausible directions. the strongest grounded themes right now are chronic non-oncology, gene modulation, named disease. but the target, trafficking story, and exact construct logic are still too underdefined to choose a responsible winner.

disease-level mechanistic read
the retrieved evidence reads more like sequence-directed or rna-directed intervention biology than classical released-warhead delivery. that keeps oligo and delivery-handle strategies more plausible than cytotoxic, radioligand, or enzyme-first classes until target-conditioned details are added.

what would make this rankable
add the subtype, target, or actual mechanism you want to leverage. for example: exon skipping, toxic-rna correction, cytotoxic delivery, radioligand localization, or enzyme/prodrug activation.

useful exploratory strategy buckets
- non-cytotoxic pathway-matched targeting: the disease frame looks more like chronic pathway control than kill-and-release payload logic, so a non-cytotoxic targeted architecture is a more plausible starting bucket.
- intracellular gene / pathway modulation delivery: the current biological state points toward an active species that has to work inside the cell, so productive trafficking matters more than classical extracellular payload release.
```

**Baseline Output**

```text
For Duchenne muscular dystrophy caused by mutations amenable to exon 51 skipping, the best conjugate class is:

Oligonucleotide conjugates / exon-skipping antisense therapies

More specifically:

Peptide-conjugated PMO or antibody/fragment-conjugated exon 51 skipping oligos

The goal is to make the DMD transcript skip exon 51, restore the reading frame, and allow production of a shorter but partially functional dystrophin protein.

The clinically used standard: eteplirsen / Exondys 51

The currently established exon 51 therapy is eteplirsen, also called Exondys 51.

It is a phosphorodiamidate morpholino oligomer, or PMO, designed to bind dystrophin pre-mRNA and promote exon 51 skipping. It is indicated for DMD patients with a confirmed mutation amenable to exon 51 skipping.

However, eteplirsen is not really a “targeted conjugate” in the ADC sense. It is an oligonucleotide drug. Its biggest weakness is limited muscle delivery, especially to heart and diaphragm, so dystrophin restoration is generally modest.

Best next-generation conjugate idea: peptide-conjugated PMO

The most biologically attractive conjugate for exon 51 DMD is:

PPMO: cell-penetrating peptide + PMO exon 51 oligo

Example:

SRP-5051 / vesleteplirsen

This is a peptide-conjugated PMO designed to improve delivery of an eteplirsen-like exon 51 skipping oligo into muscle cells.

Other strong exon 51 conjugate approaches

1. Antibody-oligonucleotide conjugates
2. Cell-penetrating peptide–PMO conjugates
3. Engineered peptide-oligonucleotide conjugates

My ranking for exon 51 DMD

1. Antibody/Fab-oligo conjugate
2. Peptide-conjugated PMO
3. Engineered peptide-oligo conjugate
4. Plain PMO
5. Gene therapy / microdystrophin

Best answer

For DMD exon 51, the best conjugate is not an ADC, SMDC, PDC, or radio-conjugate.

The best answer is:

Peptide-conjugated or antibody-conjugated exon 51 skipping oligonucleotide

If you want the current approved reference molecule, it is:

Eteplirsen / Exondys 51

If you want the best conjugate design scientifically, I would pick:

Muscle-targeted exon 51 oligonucleotide conjugate

with this structure:

muscle-targeting antibody/Fab or cell-penetrating peptide
+ stable linker
+ PMO/ASO designed to skip exon 51

The payload is not a toxin. The payload is the splice-switching oligonucleotide. The targeting/conjugation part is there to solve the real DMD problem: getting enough oligo into skeletal muscle, diaphragm, and ideally heart to restore meaningful dystrophin.
```

**Scoring**

| field | score / note |
|---|---|
| biological grounding | |
| conjugation specificity | |
| usefulness | |
| uncertainty handling | |
| novelty / strategy generation | |
| hallucination risk | |
| overall preference (`planner` / `baseline` / `tie` / `both-weak`) | |
| notes | |
| future benchmark idea | |

## 4. `eval-egfrviii-construct`

**Prompt**  
`if you had to start somewhere for EGFRvIII gbm what format and linker would you try first`

**Planner Output**

```text
confidence
low

scope
this is a target-conditioned recommendation, so target-specific logic may still move the ranking.

direct answer
if i had to build first, i’d start with smdc.

why
strong when the targeting pharmacophore itself is small, validated, and tolerant of linker and payload attachment.

what this means
use the top-ranked targeting, linker, and payload logic underneath as the first construct blueprint.

what i’d choose first

format: small-molecule ligand conjugate
why: start with a compact ligand-led format only if the pharmacophore still behaves like the same binder after real attachment chemistry is installed.

linker: compact stable linker
why: keep the linker compact and polarity-aware so the pharmacophore does not collapse before the payload ever matters.

payload: compact payload direction
why: payload direction should stay compact and exposure-aware, because small-format systems get punished early by bulk, polarity, and off-target distribution.

construct constraint
systemic accessible, helpful

construct tradeoff
the biggest risk is that the ligand stops being the same ligand once the linker and payload are real. compact formats get punished early by pk and pharmacophore disruption.

best current fit
smdc

why this is leading
strong when the targeting pharmacophore itself is small, validated, and tolerant of linker and payload attachment.

feasible and worth ranking
1. smdc
score: 3/10
why it fits: strong when the targeting pharmacophore itself is small, validated, and tolerant of linker and payload attachment.
best evidence for: the strongest support is the biology match: smdc needs a believable compact ligand or pharmacophore entry point. raw 1, weight 3.
main reason against: the main reason against smdc is weak direct precedent: the safety window depends on disease context, payload mechanism, and whether chronic exposure is acceptable. raw -2, weight 2.
what would have to be true for this to win: the literature and program precedent have to stay relevant to your exact target and disease setting.

not really viable here
smdc
score: 3/10
why it drops out: the main reason against smdc is weak direct precedent: the safety window depends on disease context, payload mechanism, and whether chronic exposure is acceptable. raw -2, weight 2.

pdc
score: 3/10
why it drops out: the main reason against pdc is weak direct precedent: the safety window depends on disease context, payload mechanism, and whether chronic exposure is acceptable. raw -2, weight 2.

rdc
score: 3/10
why it drops out: the main reason against rdc is weak direct precedent: the payload is the radiometal system, not a classic released small-molecule payload. raw -2, weight 3.

adc
score: 2/10
why it drops out: the main reason against adc is weak direct precedent: antibody-drug conjugates are optimized for warhead delivery, not sequence rescue. raw -2, weight 3.

oligo conjugate
score: 1/10
why it drops out: the main reason against oligo conjugate is still the biology mismatch: this class only makes sense when the active mechanism is sequence-directed. raw -2, weight 3.

enzyme conjugate
score: 0/10
why it drops out: the main reason against enzyme conjugate is still the biology mismatch: enzyme conjugates only win when local catalysis or prodrug activation is the real source of selectivity. raw -2, weight 3.

main watchout
the biggest risk is that the ligand stops being the same ligand once the linker and payload are real. compact formats get punished early by pk and pharmacophore disruption.

first move
prove that the small-molecule binder still keeps useful affinity after the real attachment vector is installed.
```

**Baseline Output**

```text
If I had to start somewhere for EGFRvIII glioblastoma, I would not start with a full IgG ADC using a classic MMAE linker-payload.

I would start with:

EGFRvIII-targeted small antibody fragment or peptide-drug conjugate

with a cleavable protease-sensitive linker

and a membrane-permeable bystander-capable payload

My first prototype would look like this:

EGFRvIII-specific scFv/Fab or high-affinity peptide ligand
+ PEG/spacer-stabilized Val-Cit–PABC or tumor-protease-cleavable linker
+ topoisomerase I inhibitor payload

Something conceptually closer to a brain-tumor-optimized mini-ADC / peptide-drug conjugate, not a bulky conventional ADC.

Why I would start there

EGFRvIII is attractive because it is tumor-specific and not normally found in healthy tissues, making it a strong GBM target in principle. But GBM creates several design problems: poor and heterogeneous blood–brain barrier/blood–tumor barrier delivery, antigen heterogeneity, infiltrative disease, and antigen escape.

My first-choice format

Option A — EGFRvIII-specific Fab/scFv drug conjugate

Why:

- Smaller than full IgG, so potentially better tumor penetration.
- More specific than broad EGFR targeting.
- Can be engineered for faster tissue distribution.
- Avoids long systemic exposure of a full IgG ADC.
- More controllable than a nanoparticle as a first mechanistic test.

Linker I would try first

Protease-cleavable Val-Cit–PABC-type linker

or a closely related cathepsin/tumor-lysosomal cleavable linker

Payload I would try first

Topoisomerase I inhibitor payload

rather than MMAE, MMAF, or DM1.

Why:

- Topoisomerase I payloads can provide stronger bystander killing if membrane-permeable.
- They may handle antigen heterogeneity better.
- They are more aligned with modern ADC success.
- GBM heterogeneity argues for payload diffusion after release.

My exact first design

EGFRvIII-specific Fab–Val-Cit–PABC–Topo-I ADC

or:

EGFRvIII-binding peptide–cleavable linker–Topo-I payload

What I would avoid first

1. Full IgG + non-cleavable DM1
2. MMAF-style payload
3. Pure EGFR wild-type targeting
4. Radio-conjugate as first therapeutic format

My final pick

For EGFRvIII GBM, I would start with:

EGFRvIII-specific Fab/scFv drug conjugate

site-specific DAR 2–4
cleavable Val-Cit–PABC or cathepsin-sensitive linker
membrane-permeable topoisomerase I payload
with a PEG/spacer tuned for solubility and tumor penetration
```

**Scoring**

| field | score / note |
|---|---|
| biological grounding | |
| conjugation specificity | |
| usefulness | |
| uncertainty handling | |
| novelty / strategy generation | |
| hallucination risk | |
| overall preference (`planner` / `baseline` / `tie` / `both-weak`) | |
| notes | |
| future benchmark idea | |

## 5. `eval-ibm-thin-evidence`

**Prompt**  
`possible conjugates for inclusion body myositis`

**Planner Output**

```text
confidence
insufficient

important note
biology is still too underdefined for a fully confident recommendation. the system is intentionally abstaining from a responsible winner and treating any ranking below as provisional only.

status
under-specified

why the planner is abstaining
the prompt names a specific disease, and the disease-level biology now points toward bbb-shuttle or transport-aware logic, small-format or pathway-matched conjugate strategies, non-cytotoxic targeted architectures as plausible directions. the strongest grounded themes right now are chronic non-oncology, immune biology. but the target, trafficking story, and exact construct logic are still too underdefined to choose a responsible winner.

disease-level mechanistic read
the retrieved evidence points toward pathway- or transport-aware disease biology rather than classical released-warhead delivery. that makes non-cytotoxic, transport-aware, or pathway-matched conjugate strategies more plausible at disease level, while still leaving the final construct open until target and entry-handle details are clearer.

what would make this rankable
add the subtype, target, or actual mechanism you want to leverage. for example: exon skipping, toxic-rna correction, cytotoxic delivery, radioligand localization, or enzyme/prodrug activation.

useful exploratory strategy buckets
- non-cytotoxic pathway-matched targeting: the disease frame looks more like chronic pathway control than kill-and-release payload logic, so a non-cytotoxic targeted architecture is a more plausible starting bucket.
- extracellular neutralization / localization: the wording and abstraction state both point to biology that can be addressed outside the cell, so extracellular engagement can be explored before committing to intracellular-delivery architectures.
- non-cytotoxic immune-targeted modulation: the current biology reads like chronic inflammatory control rather than cytotoxic elimination, so the useful strategy space is immune-modulatory targeting rather than warhead-first delivery.
```

**Baseline Output**

```text
For inclusion body myositis, I would be cautious: there is no obvious validated “best conjugate” the way there is for HER2 breast cancer or DMD exon 51. IBM is a mixed degenerative + inflammatory + aging-muscle disease, and it has historically responded poorly to broad immunosuppression.

So the best answer is: possible conjugates exist, but they are speculative.

Most plausible conjugate strategies for IBM

1. Muscle-targeted oligonucleotide conjugates

This is where I would start.

Possible format:

muscle-targeting antibody/Fab or peptide
+ linker
+ ASO / siRNA / splice-modulating oligo

The hard question is: what RNA target?

Potential RNA targets might relate to:

- inflammatory mediators
- cytotoxic T-cell recruitment
- protein aggregation pathways
- autophagy / lysosomal stress
- mitochondrial stress pathways
- fibrosis or muscle atrophy pathways

The conjugate logic is strong because IBM affects skeletal muscle, and modern oligo-delivery platforms are getting better at delivering to muscle. But the target biology is much less obvious than in DMD.

2. Anti-inflammatory immune-cell conjugates

IBM has a strong immune component, especially cytotoxic T-cell involvement.

Possible conjugate concept:

T-cell targeting antibody or ligand
+ immune-modulating payload
+ non-cytotoxic or carefully cytotoxic mechanism

But this is risky. If the conjugate broadly depletes T cells, you may get infection risk without fixing the degenerative muscle component.

3. Mitochondria-targeted conjugates

IBM muscle shows mitochondrial abnormalities.

Possible format:

mitochondria-targeting motif
+ antioxidant / mitophagy modulator / mitochondrial stabilizer

4. Autophagy / lysosomal pathway conjugates

IBM is associated with protein aggregates, impaired proteostasis, lysosomal dysfunction, and autophagy abnormalities.

Possible format:

muscle-targeting ligand
+ autophagy/lysosomal modulator

5. Myostatin / activin pathway antibody conjugates or fusions

IBM causes progressive muscle weakness and wasting.

What I would avoid

- classic ADCs
- therapeutic radio-conjugates
- broad immune-depleting conjugates

My ranking

1. Muscle-targeted oligo conjugate
2. Autophagy/lysosomal modulator conjugate
3. Mitochondria-targeted protective conjugate
4. Selective immune-cell modulating conjugate
5. Myostatin/activin pathway biologic fusion/conjugate

Best starting point

If I had to start a conjugate program for IBM, I would start with:

Muscle-targeted oligonucleotide conjugate

with this general structure:

anti-transferrin receptor Fab / muscle-homing peptide / other muscle-targeting ligand
+ stable linker
+ ASO or siRNA payload against a validated IBM pathway target

But I would not claim a winner yet. The first research step should be target discovery, not linker optimization. For IBM, the delivery format is easier to imagine than the correct biological target.

My honest conclusion: IBM is a thin-evidence conjugate indication. The most sensible conjugate family is probably muscle-targeted oligonucleotide delivery, but the field needs much stronger evidence on which RNA/protein target actually changes disease progression.
```

**Scoring**

| field | score / note |
|---|---|
| biological grounding | |
| conjugation specificity | |
| usefulness | |
| uncertainty handling | |
| novelty / strategy generation | |
| hallucination risk | |
| overall preference (`planner` / `baseline` / `tie` / `both-weak`) | |
| notes | |
| future benchmark idea | |
