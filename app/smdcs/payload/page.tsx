"use client";

import { useEffect, useRef } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Link,
  Navbar,
  NavbarBrand,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { motion } from "framer-motion";
import { StructureCard } from "@/components/StructureCard";
import { SourceList } from "@/components/SourceList";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { ZoomableFigure } from "@/components/ZoomableFigure";

const references = [
  {
    id: 1,
    label: "Small-Molecule Drug Conjugates: A Review of Recent Advances (Molecular Pharmaceutics, 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acs.molpharmaceut.4c00009",
    note: "Broad review used for SMDC payload classes, release-state logic, and compact-carrier constraints.",
  },
  {
    id: 2,
    label: "Small-molecule drug conjugates: Recent advances and future prospects (Chinese Chemical Letters, 2024)",
    href: "https://www.sciencedirect.com/science/article/pii/S1001841724000747",
    note: "Used for current payload trends and platform-level SMDC design pressures.",
  },
  {
    id: 3,
    label: "Small Molecule-Drug Conjugates: A Review of Recent Advances (Cancers, 2022) — CC BY",
    href: "https://www.mdpi.com/2072-6694/14/2/391",
    note: "Useful for architecture, release logic, and wider SMDC development context.",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const payloadRealityCards = [
  {
    title: "Potency still has to carry the biology",
    body: "SMDCs can penetrate fast, but they do not bring the big carrier mass or long half-life of an antibody. the payload usually still has to do a lot of the efficacy work once the construct reaches tissue.",
  },
  {
    title: "Hydrophobicity bites earlier",
    body: "Because the carrier is small, a hydrophobic warhead can change solubility, aggregation behavior, plasma protein binding, and clearance much faster than it would on a large antibody scaffold.",
  },
  {
    title: "The released species matters",
    body: "In many SMDCs, the active thing is not automatically the naked parent drug. sometimes it is a linker-drug fragment, and that fragment can change permeability, potency, or transporter handling.",
  },
  {
    title: "Imaging payloads play by different rules",
    body: "Radiometal and imaging builds are usually less about ultra-potent killing and more about whether the ligand can route a stable chelated signal into the right tissue window with low background.",
  },
];

const classRows = [
  {
    family: "Microtubule inhibitors",
    role: "Targeted mitotic arrest and cell kill",
    why: "auristatin- or maytansinoid-style warheads can still buy enough potency when the compact carrier delivers only limited payload copy number",
    watchout: "Hydrophobicity and exposure-window problems can show up fast on small carriers",
  },
  {
    family: "DNA-damaging / alkylating payloads",
    role: "Ultra-potent DNA injury at low delivered dose",
    why: "duocarmycin- or PBD-like logic stays attractive when teams want very strong kill from very small delivered amounts",
    watchout: "The safety margin can narrow quickly, so these classes are usually handled more cautiously than platform-default payloads",
  },
  {
    family: "Radiometal / imaging payload systems",
    role: "Diagnostic imaging or theranostic designs",
    why: "smdcs are often strong at rapid distribution and target localization, which matches short-lived imaging windows well",
    watchout: "The payload is really the metal-loaded chelate system, so chelation stability and normal-tissue retention matter a lot",
  },
  {
    family: "Topoisomerase I inhibitors",
    role: "DNA-strand break pressure through topo-I poisoning",
    why: "sn-38- or exatecan-like logic is appealing when teams want payload classes beyond classic tubulin agents",
    watchout: "This class is discussed more than it is broadly established in SMDCs, so release-state and exposure assumptions have to be tested, not assumed",
  },
  {
    family: "Emerging non-cytotoxic or degrader-style payloads",
    role: "Local pathway modulation rather than only classic cell kill",
    why: "small carriers can suit tissue-biased delivery of modulators, chelator systems, or other effectors that do not behave like traditional adc warheads",
    watchout: "This is still an exploratory zone, so selectivity and pharmacology have to do more work than raw payload potency alone",
  },
];

const verifiedClassCards = [
  {
    title: "Microtubule inhibitors",
    examples: "mmae, mmaf, dm1, dm4",
    body: "These are the classic tubulin-disrupting warheads. they remain attractive when the SMDC needs very high potency, but they can make compact constructs sticky or clearance-prone faster than they do on antibody carriers.",
  },
  {
    title: "DNA-damaging agents",
    examples: "duocarmycins, pbd-style warheads, calicheamicin-like logic",
    body: "These are the ultra-potent DNA-injury classes. they can be conceptually attractive for SMDCs because copy number can stay low, but the therapeutic window usually gets tighter as potency climbs.",
  },
  {
    title: "Radiometal systems",
    examples: "lu-177, ac-225, ga-68, cu-64 on dota-like chelators",
    body: "This is where SMDCs often feel most naturally differentiated from ADCs. the compact targeting ligand is paired to a metal-loaded chelator for imaging or radiotherapy, and the intact chelated complex is the functional payload.",
  },
  {
    title: "Topoisomerase I inhibitors",
    examples: "sn-38, exatecan-like derivatives",
    body: "These payloads are appealing because they can stay strong outside the strict dividing-cell logic of tubulin poisons. in SMDCs, though, the chemistry and released species still need careful validation.",
  },
  {
    title: "Emerging modulators",
    examples: "parp-like, bcl-2-like, or degrader-inspired ideas",
    body: "These are not the core established SMDC payload class yet, but they matter because the platform does not have to stop at classical cytotoxic warheads. compact delivery can also be used for local pathway modulation.",
  },
];

const releaseRows = [
  {
    state: "free active payload after cleavage",
    bestFor: "Programs built around regenerating a known active warhead once the linker breaks",
    implication: "the linker has to release a chemically competent species, not merely cut somewhere near the payload",
  },
  {
    state: "linker-payload fragment remains active",
    bestFor: "Designs where a residual spacer or trigger fragment is tolerated on the active species",
    implication: "small changes in the released fragment can alter permeability, potency, and tissue partitioning more than teams expect",
  },
  {
    state: "chelated imaging or radiometal complex stays intact",
    bestFor: "Diagnostic or theranostic SMDCs where the intact metal-chelate system is the functional payload",
    implication: "the problem becomes retention, background, and chelation stability rather than classic free-drug release",
  },
];

const payloadFitRows = [
  {
    question: "How much potency headroom does the program need?",
    cytotoxic: "usually very high",
    imaging: "lower potency, but very high signal efficiency",
    modulation: "mechanism-dependent and often narrower",
  },
  {
    question: "How sensitive is the class to clean release chemistry?",
    cytotoxic: "high",
    imaging: "lower if the intact chelate is the payload",
    modulation: "mixed; depends on whether the modulator must be released free",
  },
  {
    question: "How badly can hydrophobicity punish the construct?",
    cytotoxic: "often severe",
    imaging: "usually lower for chelator-based systems",
    modulation: "varies a lot by scaffold",
  },
  {
    question: "What usually drives failure first?",
    cytotoxic: "premature release or off-target exposure",
    imaging: "background uptake and poor signal window",
    modulation: "insufficient tissue bias or weak pharmacology",
  },
];

export default function SmdcPayloadPage() {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const burdenRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const Plotly = (
      window as typeof window & {
        Plotly?: {
          newPlot: (
            target: HTMLDivElement,
            data: unknown[],
            layout: Record<string, unknown>,
            config?: Record<string, unknown>,
          ) => Promise<void>;
          purge: (target: HTMLDivElement) => void;
        };
      }
    ).Plotly;

    const plotEl = plotRef.current;
    const burdenEl = burdenRef.current;
    if (!Plotly || !plotEl || !burdenEl) return;

    const data = [
      {
        type: "scatter",
        mode: "markers+text",
        x: [4.8, 3.1, 2.8],
        y: [4.7, 2.4, 3.2],
        text: ["cytotoxic warheads", "radiometal / imaging", "immune / modulating"],
        textposition: ["top center", "bottom center", "top center"],
        marker: {
          size: [30, 24, 24],
          color: ["#ef4444", "#8b5cf6", "#22c55e"],
          line: { color: "#334155", width: 2 },
        },
        hovertemplate:
          "<b>%{text}</b><br>potency pressure: %{x}<br>release sensitivity: %{y}<extra></extra>",
      },
    ];

    const layout = {
      margin: { l: 72, r: 32, t: 24, b: 72 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      xaxis: {
        title: "How much payload potency pressure the class usually carries",
        range: [2, 5.2],
        tickvals: [2, 3, 4, 5],
        ticktext: ["lower", "moderate", "high", "very high"],
        gridcolor: "#dbeafe",
        zeroline: false,
      },
      yaxis: {
        title: "How much the class depends on clean release / exposure logic",
        range: [2, 5.2],
        tickvals: [2, 3, 4, 5],
        ticktext: ["lower", "moderate", "high", "very high"],
        gridcolor: "#dbeafe",
        zeroline: false,
      },
      annotations: [
        {
          x: 5.1,
          y: 5.1,
          text: "harder payloads usually punish weak release logic faster",
          showarrow: false,
          xanchor: "right",
          font: { size: 12, color: "#64748b" },
        },
      ],
      font: {
        family: "Var(--font-manrope), sans-serif",
        color: "#334155",
      },
      showlegend: false,
    };

    void Plotly.newPlot(plotEl, data, layout, {
      displayModeBar: false,
      responsive: true,
    });

    void Plotly.newPlot(
      burdenEl,
      [
        {
          type: "bar",
          name: "hydrophobicity burden",
          x: ["microtubule", "DNA-damaging", "radiometal", "topo-I", "modulating"],
          y: [4.8, 4.1, 1.8, 3.7, 3.2],
          marker: { color: "#ef4444" },
        },
        {
          type: "bar",
          name: "free-release dependence",
          x: ["microtubule", "DNA-damaging", "radiometal", "topo-I", "modulating"],
          y: [4.5, 4.3, 1.2, 4.0, 2.8],
          marker: { color: "#8b5cf6" },
        },
        {
          type: "bar",
          name: "systemic-window pressure",
          x: ["microtubule", "DNA-damaging", "radiometal", "topo-I", "modulating"],
          y: [4.2, 4.9, 3.0, 4.0, 3.4],
          marker: { color: "#f59e0b" },
        },
      ],
      {
        barmode: "group",
        margin: { l: 60, r: 24, t: 28, b: 84 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        yaxis: {
          title: "Qualitative burden",
          range: [0, 5.2],
          tickvals: [1, 2, 3, 4, 5],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        legend: { orientation: "h", y: 1.16, x: 0 },
        font: {
          family: "Var(--font-manrope), sans-serif",
          color: "#334155",
        },
      },
      {
        displayModeBar: false,
        responsive: true,
      },
    );

    return () => {
      Plotly.purge(plotEl);
      Plotly.purge(burdenEl);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="smdc" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/smdcs" className="text-sm text-sky-700">
            smdc overview
          </Link>
          <Link href="/" className="text-sm text-sky-700">
            home
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            payload
          </Chip>
          <h1 className="site-page-title font-semibold">
            payloads decide whether a compact carrier actually becomes a useful therapy
          </h1>
          <p className="max-w-4xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            smdc payloads are not chosen only for raw potency. they also have to survive the
            chemistry, fit a compact carrier, and behave well as whatever species is actually
            released or retained in tissue.
            {cite(1)}
            {cite(2)}
            {cite(3)}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              as={Link}
              href="/smdcs/ligand"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              ligand page
            </Button>
            <Button
              as={Link}
              href="/smdcs/linker"
              radius="full"
              variant="bordered"
              className="border-sky-200 text-sky-700"
            >
              linker page
            </Button>
            <Button as={Link} href="/smdcs/payload" radius="full" className="bg-sky-600 text-white">
              payload page
            </Button>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <Card className="overflow-hidden border border-white/80 bg-white/70 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-sky-500">
                payload logic
              </p>
              <h2 className="site-page-heading font-semibold">
                what the payload is really asked to do in an smdc
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="gap-6 p-6">
              <ZoomableFigure label="SMDC payload logic">
                <div className="zoom-frame rounded-[2rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(243,248,255,0.96))] p-6">
                  <svg
                    viewBox="0 0 1180 420"
                    className="zoom-graphic h-auto w-full"
                    role="img"
                    aria-label="SMDC payload logic diagram"
                  >
                    <rect x="64" y="88" width="300" height="114" rx="38" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="4" />
                    <text x="214" y="140" textAnchor="middle" fontSize="32" fontWeight="700" fill="#0369a1">
                      targeting ligand
                    </text>
                    <text x="214" y="174" textAnchor="middle" fontSize="20" fill="#475569">
                      finds receptor or transporter biology
                    </text>

                    <rect x="444" y="108" width="216" height="92" rx="30" fill="#e0e7ff" stroke="#818cf8" strokeWidth="4" />
                    <text x="552" y="164" textAnchor="middle" fontSize="30" fontWeight="700" fill="#4338ca">
                      linker
                    </text>

                    <rect x="744" y="72" width="324" height="146" rx="42" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="4" />
                    <text x="906" y="138" textAnchor="middle" fontSize="34" fontWeight="700" fill="#6d28d9">
                      payload
                    </text>
                    <text x="906" y="173" textAnchor="middle" fontSize="20" fill="#475569">
                      warhead, imaging system, or modulator
                    </text>

                    <line x1="364" y1="145" x2="444" y2="145" stroke="#0f172a" strokeWidth="10" strokeLinecap="round" />
                    <polygon points="444,145 408,122 408,168" fill="#0f172a" />
                    <line x1="660" y1="145" x2="744" y2="145" stroke="#0f172a" strokeWidth="10" strokeLinecap="round" />
                    <polygon points="744,145 708,122 708,168" fill="#0f172a" />

                    <rect x="104" y="282" width="228" height="58" rx="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                    <text x="218" y="318" textAnchor="middle" fontSize="17" fontWeight="600" fill="#334155">
                      1. reach the tissue before it clears
                    </text>

                    <rect x="360" y="282" width="228" height="58" rx="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                    <text x="474" y="318" textAnchor="middle" fontSize="17" fontWeight="600" fill="#334155">
                      2. survive chemistry and circulation
                    </text>

                    <rect x="616" y="282" width="228" height="58" rx="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                    <text x="730" y="318" textAnchor="middle" fontSize="17" fontWeight="600" fill="#334155">
                      3. release the right active species
                    </text>

                    <rect x="872" y="282" width="228" height="58" rx="20" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                    <text x="986" y="318" textAnchor="middle" fontSize="17" fontWeight="600" fill="#334155">
                      4. avoid off-target exposure first
                    </text>
                  </svg>
                </div>
              </ZoomableFigure>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {payloadRealityCards.map((card) => (
                  <Card key={card.title} className="border border-sky-100 bg-white/75 shadow-none">
                    <CardBody className="gap-3 p-5">
                      <h3 className="text-xl font-semibold text-zinc-900">{card.title}</h3>
                      <p className="font-[family-name:var(--font-manrope)] text-sm leading-7 text-zinc-600">
                        {card.body}
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border border-white/80 bg-white/70 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-sky-500">
                interactive comparison
              </p>
              <h2 className="site-page-heading font-semibold">
                which payload classes feel most demanding in compact smdc builds
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="gap-5 p-6">
              <p className="max-w-4xl text-sm leading-7 text-zinc-600">
                this plot is a qualitative design aid, not a measured dataset. farther right means the
                payload class usually needs more potency headroom from the program. higher means the class
                usually punishes sloppy release or messy exposure windows more aggressively.
                {cite(1)}
                {cite(2)}
              </p>
              <div ref={plotRef} className="h-[430px] w-full" />
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border border-red-100 bg-red-50/70 shadow-none">
                  <CardBody className="gap-2 p-5">
                    <h3 className="text-lg font-semibold text-red-700">cytotoxic warheads</h3>
                    <p className="text-sm leading-7 text-zinc-600">
                      the smaller the carrier, the less room there is to hide a difficult warhead. potency,
                      hydrophobicity, and released-species behavior usually hit at the same time.
                      {cite(1)}
                      {cite(2)}
                    </p>
                  </CardBody>
                </Card>
                <Card className="border border-violet-100 bg-violet-50/70 shadow-none">
                  <CardBody className="gap-2 p-5">
                    <h3 className="text-lg font-semibold text-violet-700">radiometal / imaging systems</h3>
                    <p className="text-sm leading-7 text-zinc-600">
                      these are less about free-drug release and more about whether the intact signal-bearing
                      construct stays chelated, reaches target tissue quickly, and keeps background low.
                      {cite(1)}
                    </p>
                  </CardBody>
                </Card>
                <Card className="border border-emerald-100 bg-emerald-50/70 shadow-none">
                  <CardBody className="gap-2 p-5">
                    <h3 className="text-lg font-semibold text-emerald-700">immune / modulating payloads</h3>
                    <p className="text-sm leading-7 text-zinc-600">
                      these classes can be attractive when raw cytotoxicity is not the main aim, but they still
                      need strong tissue bias because compact constructs see normal compartments fast.
                      {cite(2)}
                      {cite(3)}
                    </p>
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          <StructureCard
            title="MMAE"
            subtitle="cytotoxic payload example"
            smilesName="monomethyl auristatin E"
            note="representative ultra-potent warhead used when the smdc is trying to turn compact targeting into true cell kill."
            category="payload"
            className="h-full"
          />
          <StructureCard
            title="Mertansine (DM1)"
            subtitle="maytansinoid payload example"
            smilesName="mertansine"
            note="another tubulin-directed payload class often used as the reference point when people compare compact conjugates with adc-style warhead logic."
            category="payload"
            className="h-full"
          />
          <StructureCard
            title="SN-38"
            subtitle="topoisomerase I payload example"
            smilesName="SN-38"
            note="illustrates a class where release state and local exposure can matter as much as raw potency once the conjugate reaches tissue."
            category="payload"
            className="h-full"
          />
          <StructureCard
            title="DOTA"
            subtitle="chelator scaffold for radiometal payload systems"
            smilesName="DOTA"
            note="dota alone is the chelator, not the whole payload. in imaging or theranostic smdcs, the functional payload is the metal-loaded dota complex."
            category="payload"
            className="h-full"
          />
          <StructureCard
            title="exatecan"
            subtitle="topoisomerase-I payload example"
            smilesName="exatecan"
            pubchemQuery="exatecan"
            note="useful stand-in for topo-I payload logic when teams want a class beyond classic tubulin warheads."
            category="payload"
            className="h-full"
          />
          <StructureCard
            title="venetoclax"
            subtitle="emerging modulator-style payload example"
            smilesName="venetoclax"
            pubchemQuery="venetoclax"
            note="not a classic SMDC default payload, but a helpful example of how compact targeted delivery can move beyond pure cytotoxic design."
            category="payload"
            className="h-full"
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.17 }}
        >
          <Card className="border border-white/80 bg-white/70 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-sky-500">
                verified class overview
              </p>
              <h2 className="site-page-heading font-semibold">
                the payload classes most often discussed in smdc design
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5">
              {verifiedClassCards.map((item) => (
                <Card key={item.title} className="border border-sky-100 bg-white/80 shadow-none">
                  <CardBody className="gap-3 p-5">
                    <h3 className="text-xl font-semibold text-zinc-900">{item.title}</h3>
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600">
                      examples: {item.examples}
                    </p>
                    <p className="text-sm leading-7 text-zinc-600">{item.body}</p>
                  </CardBody>
                </Card>
              ))}
            </CardBody>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.19 }}
        >
          <Card className="border border-white/80 bg-white/70 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-sky-500">
                integrated burden map
              </p>
              <h2 className="site-page-heading font-semibold">
                which payload classes make a compact construct work hardest
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="gap-5 p-6">
              <div ref={burdenRef} className="h-[430px] w-full" />
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border border-white/70 bg-white/80 shadow-none">
                  <CardBody className="gap-2 p-5">
                    <h3 className="text-lg font-semibold text-zinc-900">why tubulin and DNA classes stay hard</h3>
                    <p className="text-sm leading-7 text-zinc-600">
                      they still deliver massive potency, but they also punish hydrophobicity, premature release, and any exposure mistake faster than gentler payload systems.
                      {cite(1)}
                    </p>
                  </CardBody>
                </Card>
                <Card className="border border-white/70 bg-white/80 shadow-none">
                  <CardBody className="gap-2 p-5">
                    <h3 className="text-lg font-semibold text-zinc-900">why radiometals are different</h3>
                    <p className="text-sm leading-7 text-zinc-600">
                      the main challenge is not free-drug release. it is keeping the chelate intact while the ligand gets enough fast tumor localization to create a clean signal window.
                      {cite(1)}
                    </p>
                  </CardBody>
                </Card>
                <Card className="border border-white/70 bg-white/80 shadow-none">
                  <CardBody className="gap-2 p-5">
                    <h3 className="text-lg font-semibold text-zinc-900">why emerging modulators need biology to carry more weight</h3>
                    <p className="text-sm leading-7 text-zinc-600">
                      once the payload is less brutally potent, target selection and tissue bias have to do more of the therapeutic work.
                      {cite(2)}
                      {cite(3)}
                    </p>
                  </CardBody>
                </Card>
              </div>
            </CardBody>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border border-white/80 bg-white/70 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-sky-500">
                payload classes
              </p>
              <h2 className="site-page-heading font-semibold">
                the main payload families used in smdcs
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="p-0">
              <Table removeWrapper aria-label="SMDC payload family comparison">
                <TableHeader>
                  <TableColumn>family</TableColumn>
                  <TableColumn>what it is trying to do</TableColumn>
                  <TableColumn>why it can fit smdcs</TableColumn>
                  <TableColumn>main watchout</TableColumn>
                </TableHeader>
                <TableBody>
                  {classRows.map((row) => (
                    <TableRow key={row.family}>
                      <TableCell className="font-semibold text-zinc-900">{row.family}</TableCell>
                      <TableCell className="text-zinc-600">{row.role}</TableCell>
                      <TableCell className="text-zinc-600">{row.why}</TableCell>
                      <TableCell className="text-zinc-600">{row.watchout}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
        >
          <Card className="border border-white/80 bg-white/70 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-sky-500">
                released species
              </p>
              <h2 className="site-page-heading font-semibold">
                what the payload actually becomes after delivery
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="p-0">
              <Table removeWrapper aria-label="Released species logic in SMDC payload design">
                <TableHeader>
                  <TableColumn>release state</TableColumn>
                  <TableColumn>best fit</TableColumn>
                  <TableColumn>what it changes</TableColumn>
                </TableHeader>
                <TableBody>
                  {releaseRows.map((row) => (
                    <TableRow key={row.state}>
                      <TableCell className="font-semibold text-zinc-900">{row.state}</TableCell>
                      <TableCell className="text-zinc-600">{row.bestFor}</TableCell>
                      <TableCell className="text-zinc-600">{row.implication}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          <Card className="border border-white/80 bg-white/70 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-sky-500">
                compact-carrier reality
              </p>
              <h2 className="site-page-heading font-semibold">
                what smdcs punish first
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="gap-4 p-6">
              <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-4">
                <h3 className="text-lg font-semibold text-zinc-900">off-target exposure</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  if the ligand is not strongly biased, a compact construct can expose healthy tissue to the
                  payload before the therapeutic window has a chance to open.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50/70 p-4">
                <h3 className="text-lg font-semibold text-zinc-900">renal handling and fast clearance</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  compact systems move quickly, which is good for penetration but bad if the payload needs longer
                  exposure to matter or if kidney signal becomes dominant.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-4">
                <h3 className="text-lg font-semibold text-zinc-900">warhead-driven hydrophobicity</h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  smdcs lose their compact advantage fast when the payload makes the whole construct sticky,
                  protein-binding, or aggregation-prone.
                </p>
              </div>
            </CardBody>
          </Card>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border border-white/80 bg-white/70 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.32em] text-sky-500">
                payload fit
              </p>
              <h2 className="site-page-heading font-semibold">
                how the main payload families compare in smdc builds
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="p-0">
              <Table removeWrapper aria-label="SMDC payload fit comparison">
                <TableHeader>
                  <TableColumn>question</TableColumn>
                  <TableColumn>cytotoxic warheads</TableColumn>
                  <TableColumn>imaging / radiometal</TableColumn>
                  <TableColumn>immune / modulating</TableColumn>
                </TableHeader>
                <TableBody>
                  {payloadFitRows.map((row) => (
                    <TableRow key={row.question}>
                      <TableCell className="font-semibold text-zinc-900">{row.question}</TableCell>
                      <TableCell className="text-zinc-600">{row.cytotoxic}</TableCell>
                      <TableCell className="text-zinc-600">{row.imaging}</TableCell>
                      <TableCell className="text-zinc-600">{row.modulation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </motion.section>

        <SourceList title="verified sources" items={references} />
      </main>
    </div>
  );
}
