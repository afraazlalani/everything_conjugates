"use client";

import { useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Image,
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
import { RdcSectionTabs } from "@/components/RdcSectionTabs";

const references = [
  {
    id: 1,
    label: "LUTATHERA (lutetium Lu 177 dotatate) prescribing information (FDA)",
    href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2018/208700s000lbl.pdf",
    note: "used for the approved beta-emitter example, radionuclide half-life context, and somatostatin-receptor radiotherapy framing.",
  },
  {
    id: 2,
    label: "PLUVICTO (lutetium Lu 177 vipivotide tetraxetan) prescribing information (FDA)",
    href: "https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/215833s000lbl.pdf",
    note: "used for PSMA-targeted beta-radioligand context and the importance of matching isotope behavior to target biology.",
  },
  {
    id: 3,
    label:
      "Radiolabeling of an Anti-CD33 Antibody with Actinium-225 (RSC Adv., 2021) — CC BY 3.0",
    href: "https://pubs.rsc.org/en/content/articlehtml/2021/ra/d1ra01214a",
    note: "used for targeted alpha-therapy context, including why actinium-225 is treated as a short-range high-LET option.",
  },
  {
    id: 4,
    label: "Lutetium Lu 177 Vipivotide Tetraxetan: First Approval (Drugs, 2022)",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9099330/",
    note: "used for radionuclide therapy context, approved clinical positioning, and why payload physics has to match the targeting scaffold.",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const familyRows = [
  {
    class: "beta emitters",
    examples: "Lu-177, Y-90",
    behavior: "longer path length with lower linear energy transfer",
    fit: "works well when cross-fire through a small cell neighborhood helps",
    watchout: "normal-tissue dose can spread beyond the exact binding site",
  },
  {
    class: "alpha emitters",
    examples: "Ac-225 and daughters",
    behavior: "very short path length with very high linear energy transfer",
    fit: "useful when dense local killing matters more than broader path length",
    watchout: "daughter handling, safety, and dosimetry become much harder",
  },
  {
    class: "diagnostic / paired isotopes",
    examples: "Ga-68, Cu-64 paired logic",
    behavior: "used to image target engagement or build theranostic pairs",
    fit: "helps when teams want the same targeting scaffold to support imaging first",
    watchout: "imaging-friendly behavior is not always the same as therapy-ready behavior",
  },
];

const matchingCards = [
  {
    title: "half-life has to match targeting",
    body: "a radionuclide that decays too early can waste dose before tumor localization, while one that decays too slowly can leave normal tissues carrying unnecessary exposure.",
    refs: [1, 2, 4],
  },
  {
    title: "internalization changes what matters",
    body: "for some targets the construct is internalized and retained, while for others the useful dose depends more on surface residence and local neighborhood irradiation.",
    refs: [1, 2, 4],
  },
  {
    title: "chelation and payload are inseparable",
    body: "the radionuclide is only useful if the chelator keeps it attached tightly enough in blood and tissue. unstable chelation turns a targeting problem into a safety problem fast.",
    refs: [1, 2, 3],
  },
  {
    title: "dosimetry is part of payload design",
    body: "with radionuclides, payload choice is not only potency. it is also path length, energy deposition, daughter behavior, and what organs pick up background dose.",
    refs: [1, 2, 3, 4],
  },
];

const programRows = [
  {
    anchor: "LUTATHERA",
    target: "somatostatin receptor",
    isotope: "Lu-177",
    why: "approved example showing a beta-emitter working with a receptor-internalizing peptide-targeting framework.",
  },
  {
    anchor: "PLUVICTO",
    target: "PSMA",
    isotope: "Lu-177",
    why: "approved example showing how ligand biology, chelation, and isotope behavior all have to align for systemic radioligand therapy.",
  },
  {
    anchor: "targeted alpha programs",
    target: "varies by scaffold",
    isotope: "Ac-225",
    why: "development-stage reminder that alpha emitters can intensify local kill, but they usually increase workflow, safety, and daughter-nuclide complexity too.",
  },
];

export default function RdcRadionuclidePage() {
  const emitterPlotRef = useRef<HTMLDivElement | null>(null);

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

    const plotEl = emitterPlotRef.current;
    if (!Plotly || !plotEl) return;

    void Plotly.newPlot(
      plotEl,
      [
        {
          type: "scatter",
          mode: "markers+text",
          x: [4.1, 4.6, 1.8],
          y: [2.2, 4.8, 4.7],
          text: ["Lu-177", "Y-90", "Ac-225"],
          textposition: ["top center", "bottom center", "top center"],
          marker: {
            size: [34, 34, 34],
            color: ["#38bdf8", "#6366f1", "#f97316"],
            line: { color: "#334155", width: 2 },
          },
          hovertemplate:
            "<b>%{text}</b><br>effective path length: %{x}<br>local damage density: %{y}<extra></extra>",
        },
      ],
      {
        margin: { l: 72, r: 30, t: 28, b: 72 },
        paper_bgcolor: "rgba(255,255,255,0)",
        plot_bgcolor: "rgba(255,255,255,0)",
        xaxis: {
          title: "how far the emitted radiation tends to reach",
          range: [1, 5],
          tickvals: [1, 2, 3, 4, 5],
          ticktext: ["very short", "short", "mid", "long", "longer"],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        yaxis: {
          title: "how concentrated the local damage is",
          range: [1.5, 5.2],
          tickvals: [2, 3, 4, 5],
          ticktext: ["lower", "mid", "high", "very high"],
          gridcolor: "#dbeafe",
          zeroline: false,
        },
        annotations: [
          {
            x: 1.08,
            y: 5.02,
            text: "short-range, dense hit",
            showarrow: false,
            font: { size: 12, color: "#64748b" },
            xanchor: "left",
          },
          {
            x: 4.95,
            y: 1.72,
            text: "longer-range, cross-fire help",
            showarrow: false,
            font: { size: 12, color: "#64748b" },
            xanchor: "right",
          },
        ],
        font: {
          family: "var(--font-manrope), sans-serif",
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
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="rdc" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/rdcs" className="text-sm text-sky-700">
            rdc overview
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
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            radionuclide
          </Chip>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-semibold sm:text-6xl">
            the radiation payload
          </h1>
          <p className="max-w-5xl font-[family-name:var(--font-manrope)] text-lg text-zinc-600">
            in RDCs, the payload is not a classic small-molecule warhead. it is the
            radionuclide itself plus the decay behavior that comes with it: path length,
            energy deposition, half-life, and what normal tissues see while the construct is
            moving through the body.{cite(1)}
            {cite(2)}
            {cite(3)}
            {cite(4)}
          </p>
          <RdcSectionTabs active="radionuclide" />
        </motion.section>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.35fr]">
          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                representative isotopes
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
                the payload is really a decay profile, not only a label
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4 md:grid-cols-3">
              <StructureCard
                title="Lu-177"
                subtitle="beta-emitter workhorse"
                formulaDisplay={
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                    <div className="rounded-full border border-sky-200 bg-sky-50 px-5 py-4 text-center text-3xl font-semibold text-sky-700">
                      177Lu
                    </div>
                    <p className="text-center text-sm text-zinc-500">therapeutic beta emitter</p>
                  </div>
                }
                note="used when teams want clinically proven beta-emitter behavior with approved ligand and chelator examples."
                category="payload"
              />
              <StructureCard
                title="Y-90"
                subtitle="longer-range beta logic"
                formulaDisplay={
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                    <div className="rounded-full border border-indigo-200 bg-indigo-50 px-5 py-4 text-center text-3xl font-semibold text-indigo-700">
                      90Y
                    </div>
                    <p className="text-center text-sm text-zinc-500">higher-energy beta emitter</p>
                  </div>
                }
                note="useful when cross-fire through a somewhat broader cell neighborhood is part of the design idea."
                category="payload"
              />
              <StructureCard
                title="Ac-225"
                subtitle="alpha-emitter logic"
                formulaDisplay={
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                    <div className="rounded-full border border-orange-200 bg-orange-50 px-5 py-4 text-center text-3xl font-semibold text-orange-700">
                      225Ac
                    </div>
                    <p className="text-center text-sm text-zinc-500">short-range alpha emitter</p>
                  </div>
                }
                note="the alpha-emitter case where dense local damage can be powerful but much less forgiving."
                category="payload"
              />
            </CardBody>
          </Card>
          <Card className="border border-white/80 bg-white/70">
            <CardHeader className="flex flex-col items-start gap-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
                payload reality
              </p>
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
                what a radionuclide is really bringing to the conjugate
              </h2>
            </CardHeader>
            <Divider />
            <CardBody className="grid gap-4 text-sm leading-7 text-zinc-600">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">beta-emitter logic</p>
                <p className="mt-2">
                  beta emitters like lutetium-177 are useful when a little cross-fire helps
                  cover nearby tumor cells rather than only the exact binding site.{cite(1)}
                  {cite(2)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">alpha-emitter logic</p>
                <p className="mt-2">
                  alpha emitters like actinium-225 deliver much denser local damage over a
                  much shorter path, which is why they are exciting and difficult at the
                  same time.{cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why timing matters</p>
                <p className="mt-2">
                  unlike a standard cytotoxic payload, the radionuclide keeps evolving with
                  time. so half-life and decay behavior have to match the ligand and chelator
                  rather than being treated as afterthoughts.{cite(1)}
                  {cite(2)}
                  {cite(4)}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              emitter logic
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              why alpha and beta payloads behave so differently
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-5">
            <ZoomableFigure label="Alpha vs beta payload logic">
              <div className="zoom-frame rounded-[1.5rem] border border-white/70 bg-white/70 p-5">
                <svg
                  viewBox="0 0 1080 420"
                  className="zoom-graphic h-auto w-full"
                  role="img"
                  aria-label="Diagram comparing beta and alpha radionuclide payload behavior"
                >
                  <rect x="40" y="56" width="455" height="300" rx="28" fill="#f8fbff" stroke="#bae6fd" strokeWidth="3" />
                  <rect x="585" y="56" width="455" height="300" rx="28" fill="#fffaf5" stroke="#fdba74" strokeWidth="3" />

                  <text x="72" y="104" fill="#0369a1" fontSize="26" fontWeight="700">beta-emitter pattern</text>
                  <text x="617" y="104" fill="#c2410c" fontSize="26" fontWeight="700">alpha-emitter pattern</text>

                  <circle cx="165" cy="208" r="30" fill="#38bdf8" />
                  <circle cx="245" cy="182" r="22" fill="#bfdbfe" />
                  <circle cx="287" cy="240" r="18" fill="#bfdbfe" />
                  <circle cx="345" cy="202" r="16" fill="#bfdbfe" />
                  <circle cx="388" cy="248" r="12" fill="#bfdbfe" />
                  <path d="M197 206 C 238 188, 292 187, 386 206" stroke="#38bdf8" strokeWidth="8" fill="none" strokeLinecap="round" />
                  <text x="72" y="300" fill="#0f172a" fontSize="20" fontWeight="600">
                    <tspan x="72" dy="0">can help with cross-fire through</tspan>
                    <tspan x="72" dy="24">a nearby cell cluster</tspan>
                  </text>
                  <text x="72" y="348" fill="#64748b" fontSize="17">
                    <tspan x="72" dy="0">useful when tumor coverage matters</tspan>
                    <tspan x="72" dy="22">more than ultra-local deposition</tspan>
                  </text>

                  <circle cx="710" cy="208" r="30" fill="#f97316" />
                  <circle cx="757" cy="204" r="12" fill="#fed7aa" />
                  <circle cx="785" cy="221" r="11" fill="#fed7aa" />
                  <circle cx="809" cy="194" r="10" fill="#fed7aa" />
                  <path d="M741 208 C 760 208, 780 210, 811 208" stroke="#f97316" strokeWidth="10" fill="none" strokeLinecap="round" />
                  <text x="617" y="300" fill="#0f172a" fontSize="20" fontWeight="600">
                    <tspan x="617" dy="0">concentrates damage into a very</tspan>
                    <tspan x="617" dy="24">short local neighborhood</tspan>
                  </text>
                  <text x="617" y="348" fill="#64748b" fontSize="17">
                    <tspan x="617" dy="0">useful when a dense local hit is worth</tspan>
                    <tspan x="617" dy="22">the harder safety and workflow tradeoff</tspan>
                  </text>
                </svg>
              </div>
            </ZoomableFigure>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what the figure is doing</p>
                <p className="mt-2">
                  this is a teaching diagram, not a measured dosimetry map. it is just there
                  to make the central payload difference visible: beta tends to travel
                  farther, while alpha tends to hit harder over a shorter path.{cite(1)}
                  {cite(2)}
                  {cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what it changes in design</p>
                <p className="mt-2">
                  the ligand, chelator, and radionuclide stop being separable decisions. once
                  the isotope changes, the whole exposure and safety logic changes with it.
                  {cite(2)}
                  {cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why this matters clinically</p>
                <p className="mt-2">
                  approved beta-radioligand drugs and emerging alpha programs do not succeed
                  for the same physical reasons, even when the target biology looks similar.
                  {cite(1)}
                  {cite(2)}
                  {cite(3)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              open-source figure
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              one real radioconjugate figure helps anchor the payload story
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <ZoomableFigure label="Open-source radioimmunoconjugate figure">
              <div className="zoom-frame rounded-[1.5rem] border border-white/70 bg-white/70 p-3">
                <Image
                  src="/images/ccby/rdc-rsc-graphical.gif"
                  alt="Open-source radioimmunoconjugate figure"
                  className="zoom-graphic h-auto w-full rounded-xl object-contain"
                />
              </div>
            </ZoomableFigure>
            <div className="grid gap-4">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why this figure still matters</p>
                <p className="mt-2">
                  it keeps the radionuclide discussion honest: the payload only makes sense as
                  part of a ligand-plus-chelator-plus-isotope construct.{cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">what it teaches fast</p>
                <p className="mt-2">
                  the radionuclide is useful only if targeting and chelation keep it where the
                  physics can help more than harm.{cite(3)}
                  {cite(4)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated plot
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              how the main therapeutic isotopes separate by range and local damage
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-[1.25rem] border border-white/70 bg-white/80 p-4">
              <div ref={emitterPlotRef} className="min-h-[25rem] w-full" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">how to read it</p>
                <p className="mt-2">
                  farther right means the radiation tends to reach farther beyond the exact
                  binding site. higher means the damage is denser over a shorter local
                  distance.{cite(1)}
                  {cite(2)}
                  {cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why lutetium stays important</p>
                <p className="mt-2">
                  Lu-177 keeps showing up because it gives clinically useful beta-radiation
                  with approved targeting frameworks and a workable development path.{cite(1)}
                  {cite(2)}
                  {cite(4)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
                <p className="font-semibold text-zinc-900">why actinium is different</p>
                <p className="mt-2">
                  Ac-225 is interesting when teams want denser local damage, but the payload
                  conversation immediately becomes harder because alpha therapy is less forgiving.
                  {cite(3)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              payload classes
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              the main radionuclide families used in rdc thinking
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="Radionuclide payload families" removeWrapper>
              <TableHeader>
                <TableColumn>class</TableColumn>
                <TableColumn>representative examples</TableColumn>
                <TableColumn>what they buy</TableColumn>
                <TableColumn>where they get harder</TableColumn>
              </TableHeader>
              <TableBody>
                {familyRows.map((row) => (
                  <TableRow key={row.class}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.class}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.examples}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.fit}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.watchout}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-4 text-sm leading-7 text-zinc-600">
              the key point is that payload class is not only a radiochemistry choice. it is
              also a tissue-range choice, a safety choice, and a trafficking choice.
              {cite(1)}
              {cite(2)}
              {cite(3)}
              {cite(4)}
            </p>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              fit to the rest of the construct
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              what the radionuclide has to match in the ligand and chelator
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2">
            {matchingCards.map((card) => (
              <div key={card.title} className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">{card.title}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  {card.body}
                  {card.refs.map((refId) => cite(refId))}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              clinical anchors
            </p>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold">
              why this page is not only theoretical
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label="Clinical radionuclide anchors" removeWrapper>
              <TableHeader>
                <TableColumn>program anchor</TableColumn>
                <TableColumn>target</TableColumn>
                <TableColumn>payload</TableColumn>
                <TableColumn>what it teaches</TableColumn>
              </TableHeader>
              <TableBody>
                {programRows.map((row) => (
                  <TableRow key={row.anchor}>
                    <TableCell className="align-top font-semibold text-zinc-900">{row.anchor}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.target}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.isotope}</TableCell>
                    <TableCell className="align-top text-sm text-zinc-600">{row.why}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <SourceList title="verified sources" items={references} />
      </main>
    </div>
  );
}
