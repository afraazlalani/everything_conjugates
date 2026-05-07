"use client";

import { useEffect, useRef } from "react";
import {
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
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";
import { PdcSectionTabs } from "@/components/PdcSectionTabs";
import { StructureCard } from "@/components/StructureCard";

const references = [
  {
    id: 1,
    label:
      "Peptide-Drug Conjugates: Design, Chemistry, and Drug Delivery System as a Novel Cancer Theranostic (ACS Pharmacol. Transl. Sci., 2024)",
    href: "https://pubs.acs.org/doi/10.1021/acsptsci.3c00269",
  },
  {
    id: 2,
    label:
      "Peptides as a platform for targeted therapeutics for cancer: PDCs (Chem. Soc. Rev., 2021)",
    href: "https://pubs.rsc.org/en/Content/ArticleLanding/2021/CS/D0CS00556H",
  },
  {
    id: 3,
    label:
      "Peptide-drug conjugates: A new paradigm for targeted cancer therapy (Eur. J. Med. Chem., 2024)",
    href: "https://pubmed.ncbi.nlm.nih.gov/38194773/",
  },
  {
    id: 4,
    label:
      "Peptide-Drug Conjugates with Different Linkers for Cancer Therapy (J. Med. Chem., 2021)",
    href: "https://pubmed.ncbi.nlm.nih.gov/33382619/",
  },
  {
    id: 5,
    label:
      "Recent Advances in Augmenting the Therapeutic Efficacy of Peptide–Drug Conjugates (J. Med. Chem., 2025)",
    href: "https://pubmed.ncbi.nlm.nih.gov/40267310/",
  },
];

const cite = (id: number) => (
  <sup className="ml-1 text-xs text-sky-700">
    <a href={`#ref-${id}`} className="hover:underline">
      [{id}]
    </a>
  </sup>
);

const payloadRows = [
  {
    class: "cytotoxic small molecules",
    use: "main oncology pdc route when copy number is limited",
    fit: "high potency can compensate for low delivered payload counts",
    watch: "hydrophobicity and premature systemic release can punish small carriers",
  },
  {
    class: "radionuclide / imaging payloads",
    use: "diagnostic or theranostic programs where distribution is as important as killing",
    fit: "compact peptides can be strong targeting vectors for imaging windows",
    watch: "chelation, residence time, and background uptake become critical",
  },
  {
    class: "immune or inflammatory payloads",
    use: "emerging non-oncology or local-modulation concepts",
    fit: "peptides can route the conjugate toward a defined tissue niche",
    watch: "potency windows and tissue selectivity have to be very well tuned",
  },
];

const releaseRows = [
  {
    question: "Released free drug",
    bestFor: "Programs where the unconjugated payload is the desired active species once the trigger fires",
    why: "common with cleavable payload-side bonds because the biology is trying to regenerate a familiar warhead",
    watchout: "Premature release is costly, and the liberated drug still has to behave well in that tissue context",
  },
  {
    question: "Released linker-drug species",
    bestFor: "Designs where a residual linker fragment is tolerated and still leaves the payload active enough",
    why: "sometimes easier to build or more stable than a perfectly traceless release path",
    watchout: "The linker remnant can change permeability, potency, or transporter sensitivity",
  },
  {
    question: "Intact construct until degradation",
    bestFor: "Non-cleavable or more stable architectures where carrier breakdown is part of the delivery logic",
    why: "can reduce premature release and widen the plasma-stability window",
    watchout: "The final active species may be bulkier and more context-dependent than the parent payload",
  },
];

export default function PdcPayloadPage() {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const propertyPlotRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !plotRef.current) return;
    const plotEl = plotRef.current;
    const Plotly = (
      window as typeof window & {
        Plotly?: {
          newPlot: (
            el: HTMLElement,
            data: unknown[],
            layout: Record<string, unknown>,
            config?: Record<string, unknown>
          ) => Promise<unknown>;
          purge: (el: HTMLElement) => void;
        };
      }
    ).Plotly;

    if (!Plotly) return;

    const data = [
      {
        type: "bar",
        x: ["cytotoxic", "imaging / theranostic", "immune / inflammatory"],
        y: [5, 3, 2],
        marker: { color: ["#38bdf8", "#8b5cf6", "#22c55e"], line: { color: "#334155", width: 1 } },
        text: ["dominant use", "growing use", "early use"],
        textposition: "outside",
        cliponaxis: false,
        hovertemplate: "%{x}<br>qualitative emphasis: %{y}<extra></extra>",
      },
    ];

    const layout = {
      margin: { l: 40, r: 10, t: 20, b: 60 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      xaxis: {
        title: { text: "payload class", font: { size: 16, color: "#334155" } },
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
      },
      yaxis: {
        title: { text: "qualitative current use", font: { size: 16, color: "#334155" } },
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
        range: [0, 6],
      },
      font: { family: "Var(--font-manrope), sans-serif", color: "#0f172a" },
      showlegend: false,
    };

    void Plotly.newPlot(plotEl, data, layout, {
      displayModeBar: false,
      responsive: true,
    });

    return () => Plotly.purge(plotEl);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !propertyPlotRef.current) return;
    const plotEl = propertyPlotRef.current;
    const Plotly = (
      window as typeof window & {
        Plotly?: {
          newPlot: (
            el: HTMLElement,
            data: unknown[],
            layout: Record<string, unknown>,
            config?: Record<string, unknown>
          ) => Promise<unknown>;
          purge: (el: HTMLElement) => void;
        };
      }
    ).Plotly;

    if (!Plotly) return;

    const data = [
      {
        type: "scatter",
        mode: "markers+text",
        x: [4.8, 3.2, 2.8],
        y: [4.6, 3.1, 2.4],
        text: ["cytotoxic warheads", "radiometal / imaging builds", "immune / modulating payloads"],
        textposition: ["top center", "bottom center", "top center"],
        marker: {
          size: [28, 26, 24],
          color: ["#38bdf8", "#8b5cf6", "#22c55e"],
          line: { color: "#334155", width: 1.5 },
        },
        hovertemplate: "%{text}<extra></extra>",
      },
    ];

    const layout = {
      margin: { l: 58, r: 24, t: 16, b: 58 },
      paper_bgcolor: "rgba(255,255,255,0)",
      plot_bgcolor: "rgba(255,255,255,0)",
      xaxis: {
        title: { text: "need for payload potency", font: { size: 15, color: "#334155" } },
        tickvals: [2, 3, 4, 5],
        ticktext: ["lower", "moderate", "high", "very high"],
        range: [1.8, 5.2],
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
      },
      yaxis: {
        title: { text: "dependence on clean release / exposure logic", font: { size: 15, color: "#334155" } },
        tickvals: [2, 3, 4, 5],
        ticktext: ["lower", "moderate", "high", "very high"],
        range: [1.8, 5.2],
        tickfont: { size: 13, color: "#334155" },
        gridcolor: "#dbeafe",
      },
      font: { family: "Var(--font-manrope), sans-serif", color: "#0f172a" },
      annotations: [
        {
          x: 5.05,
          y: 5.02,
          text: "harder payloads usually demand cleaner release logic",
          showarrow: false,
          xanchor: "right",
          font: { size: 12, color: "#64748b" },
        },
      ],
      showlegend: false,
    };

    void Plotly.newPlot(plotEl, data, layout, {
      displayModeBar: false,
      responsive: true,
    });

    return () => Plotly.purge(plotEl);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <BackgroundMotif variant="pdc" />

      <Navbar className="border-b border-white/40 bg-transparent backdrop-blur-md">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/pdcs" className="text-sm text-sky-700">
            pdc overview
          </Link>
          <Link href="/" className="text-sm text-sky-700">
            home
          </Link>
        </div>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit border border-sky-200 bg-white/70 text-sky-700">
            payload
          </Chip>
          <h1 className="site-page-title font-semibold">
            payload choice decides what a pdc is trying to accomplish
          </h1>
          <p className="max-w-4xl text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            payload selection in pdcs is not just about potency. the payload has to fit a
            small carrier, a shorter exposure window, and the release behavior of a peptide
            linker system, which means some adc payload intuitions transfer and some do not.
            {cite(1)}{cite(2)}{cite(3)}
          </p>
          <PdcSectionTabs active="payload" />
        </motion.section>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              qualitative plot
            </p>
            <h2 className="site-page-heading font-semibold">
              which payload classes show up most often
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <div ref={plotRef} className="min-h-[16rem] w-full" />
            </div>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why cytotoxics still dominate</p>
                <p className="mt-2">most pdcs are still built around potent oncology payloads because the platform often aims to deliver fewer but more selective hits.</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">where imaging wins</p>
                <p className="mt-2">small peptide vectors can be especially useful when fast target access and cleaner imaging windows matter more than long persistence.</p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">what the chart is not</p>
                <p className="mt-2">this is a teaching map, not a measured field census. it is there to show the current center of gravity, not exact market share.</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              payload reality
            </p>
            <h2 className="site-page-heading font-semibold">
              what pdc payload choice is usually balancing
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
              <p className="font-semibold text-zinc-900">potency still matters</p>
              <p className="mt-2">
                small peptide carriers usually do not deliver huge payload copy numbers, so
                the payload still has to work hard once it arrives.{cite(1)}{cite(2)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
              <p className="font-semibold text-zinc-900">hydrophobicity matters earlier</p>
              <p className="mt-2">
                because pdcs are small, hydrophobic payloads can distort exposure,
                aggregation tendency, and nonspecific behavior faster than teams expect.
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
              <p className="font-semibold text-zinc-900">the released species matters too</p>
              <p className="mt-2">
                for pdcs, the relevant active form is often the post-cleavage product, not
                only the named payload in the drawing.{cite(4)}{cite(5)}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4 text-sm leading-7 text-zinc-600">
              <p className="font-semibold text-zinc-900">payload choice reshapes the build</p>
              <p className="mt-2">
                a radiometal imaging construct, a cytotoxic pdc, and an immunomodulating pdc
                can all use the same peptide class but demand very different linker and
                exposure logic.
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              representative payload chemistry
            </p>
            <h2 className="site-page-heading font-semibold">
              a few common payload families
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4 md:grid-cols-3">
            <StructureCard
              title="MMAE"
              subtitle="microtubule inhibitor"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/11542188"
              pubchemQuery="monomethyl auristatin E"
              note="representative high-potency cytotoxic payload used across conjugate modalities."
              category="payload"
            />
            <StructureCard
              title="SN-38"
              subtitle="topoisomerase I inhibitor"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/104842"
              pubchemQuery="SN-38"
              note="representative topo-I payload logic when release chemistry and bystander behavior are part of the plan."
              category="payload"
            />
            <StructureCard
              title="dota-radiometal complex"
              subtitle="representative metal-loaded chelate"
              src="https://pubchem.ncbi.nlm.nih.gov/compound/CID/11359"
              pubchemQuery="DOTA"
              note="this image shows the dota chelator scaffold itself. in an actual radiopharmaceutical pdc, a metal ion such as gallium, copper, lutetium, or yttrium is chelated inside this cage, and that metal-loaded dota complex is the real payload-bearing form."
              category="payload"
            />
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              integrated comparison
            </p>
            <h2 className="site-page-heading font-semibold">
              which payloads need the cleanest release logic
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="grid gap-4">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <div ref={propertyPlotRef} className="min-h-[24rem] w-full" />
            </div>
            <div className="grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">how to read it</p>
                <p className="mt-2">
                  farther right means the payload class more often demands strong intrinsic
                  potency. higher on the chart means the construct depends more heavily on
                  clean release, preserved chemistry, and the right exposure window.
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">why this is pdc-specific</p>
                <p className="mt-2">
                  peptide carriers do not bring antibody-like half-life or shielding, so the
                  payload and released product are often exposed to a harsher design tradeoff
                  earlier.{cite(2)}{cite(3)}
                </p>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/80 p-4">
                <p className="font-semibold text-zinc-900">what it means in practice</p>
                <p className="mt-2">
                  a payload that looks strong on paper can still fail if the post-release
                  species is too hydrophobic, too weak, or too unstable in the compartments
                  the peptide actually reaches.{cite(4)}{cite(5)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              class table
            </p>
            <h2 className="site-page-heading font-semibold">
              what makes a payload fit a peptide carrier
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="pdc payload comparison"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>payload class</TableColumn>
                <TableColumn>where it fits</TableColumn>
                <TableColumn>why it fits</TableColumn>
                <TableColumn>watchout</TableColumn>
              </TableHeader>
              <TableBody>
                {payloadRows.map((row) => (
                  <TableRow key={row.class}>
                    <TableCell className="font-semibold text-zinc-900">{row.class}</TableCell>
                    <TableCell>{row.use}</TableCell>
                    <TableCell>{row.fit}</TableCell>
                    <TableCell>{row.watch}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <Card className="border border-white/80 bg-white/70">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-500">
              released species
            </p>
            <h2 className="site-page-heading font-semibold">
              what the payload may actually become after release
            </h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              removeWrapper
              aria-label="pdc released payload species"
              classNames={{
                th: "bg-sky-50/80 text-sky-700 text-xs uppercase tracking-[0.18em]",
                td: "align-top text-sm leading-7 text-zinc-600",
              }}
            >
              <TableHeader>
                <TableColumn>released-state logic</TableColumn>
                <TableColumn>best fit</TableColumn>
                <TableColumn>why it gets used</TableColumn>
                <TableColumn>watchout</TableColumn>
              </TableHeader>
              <TableBody>
                {releaseRows.map((row) => (
                  <TableRow key={row.question}>
                    <TableCell className="font-semibold text-zinc-900">{row.question}</TableCell>
                    <TableCell>{row.bestFor}</TableCell>
                    <TableCell>{row.why}</TableCell>
                    <TableCell>{row.watchout}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        <section className="grid gap-3">
          <h3 className="site-card-heading font-semibold">
            references
          </h3>
          <ol className="list-decimal pl-6 text-sm text-zinc-600">
            {references.map((ref) => (
              <li key={ref.id} id={`ref-${ref.id}`}>
                <Link href={ref.href} className="text-sky-700">
                  {ref.label}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
