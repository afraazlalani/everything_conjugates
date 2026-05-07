"use client";

import { SmilesStructure } from "@/components/SmilesStructure";

type Variant =
  | "main"
  | "adc"
  | "mab"
  | "linker"
  | "payload"
  | "pdc"
  | "smdc"
  | "oligo"
  | "enzyme"
  | "rdc"
  | "design"
  | "vision"
  | "suggestions";

const STRUCTURE = {
  mmae: "monomethyl auristatin E",
  dm1: "mertansine",
  sn38: "SN-38",
  smcc: "SMCC",
  valcit: "L-Valyl-L-citrulline",
  hydrazone: "benzaldehyde hydrazone",
  disulfide: "dipropyl disulfide",
  ala_ala_asn: "L-Ala-L-Ala-L-Asn",
  adenosine: "adenosine",
  uridine: "uridine",
  arg_glu_asp: "Arg-Glu-Asp",
  folic_acid: "folic acid",
  dota: "DOTA",
  mab: "https://cdn.rcsb.org/images/structures/ig/1igt/1igt_assembly-1.jpeg",
  enzyme: "https://cdn.rcsb.org/images/structures/cg/1cg2/1cg2_assembly-1.jpeg",
};

function FloatingImage({
  src,
  className,
  alt,
}: {
  src: string;
  className: string;
  alt: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={`absolute opacity-10 mix-blend-multiply saturate-[0.72] scale-110 md:scale-125 ${className}`}
    />
  );
}

function FloatingSmiles({
  name,
  className,
  alt,
  width = 180,
  height = 180,
}: {
  name: string;
  className: string;
  alt: string;
  width?: number;
  height?: number;
}) {
  return (
    <div className={`absolute opacity-10 mix-blend-multiply ${className}`}>
      <SmilesStructure name={name} width={width} height={height} ariaLabel={alt} />
    </div>
  );
}

function RingLabels({
  items,
  className,
  radius = 64,
}: {
  items: { label: string; sub?: string }[];
  className?: string;
  radius?: number;
}) {
  return (
    <div className={`absolute ${className ?? ""}`}>
      <div className="relative h-36 w-36">
        {items.map((item, index) => {
          const angle = (360 / items.length) * index;
          return (
            <div
              key={item.label}
              className="absolute left-1/2 top-1/2"
              style={{
                transform: `rotate(${angle}deg) translate(${radius}px) rotate(-${angle}deg)`,
              }}
            >
                <div className="rounded-full border border-slate-300/60 bg-white/78 px-2 py-1 text-[10px] text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                <div className="font-medium">{item.label}</div>
                {item.sub ? <div className="text-[9px] text-zinc-500">{item.sub}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BackgroundMotif({ variant }: { variant: Variant }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-sky-300/16 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-indigo-300/10 blur-3xl" />

      {variant === "main" ? <MainMotif /> : null}
      {variant === "adc" ? <AdcMotif /> : null}
      {variant === "mab" ? <MabMotif /> : null}
      {variant === "linker" ? <LinkerMotif /> : null}
      {variant === "payload" ? <PayloadMotif /> : null}
      {variant === "pdc" ? <PdcMotif /> : null}
      {variant === "smdc" ? <SmdcMotif /> : null}
      {variant === "oligo" ? <OligoMotif /> : null}
      {variant === "enzyme" ? <EnzymeMotif /> : null}
      {variant === "rdc" ? <RdcMotif /> : null}
      {variant === "design" ? <DesignMotif /> : null}
      {variant === "vision" ? <VisionMotif /> : null}
      {variant === "suggestions" ? <SuggestionsMotif /> : null}
    </div>
  );
}

function MainMotif() {
  return (
    <>
      <FloatingImage src={STRUCTURE.mab} alt="IgG structure" className="left-[10%] top-6 h-44 w-44 rotate-6" />
      <FloatingSmiles name={STRUCTURE.valcit} alt="Val-Cit linker" className="left-[45%] top-16" width={180} height={180} />
      <FloatingSmiles name={STRUCTURE.mmae} alt="Auristatin payload" className="right-[12%] top-10" width={190} height={190} />
      <FloatingSmiles name={STRUCTURE.uridine} alt="Uridine" className="left-[20%] bottom-10" width={160} height={160} />
      <FloatingSmiles name={STRUCTURE.folic_acid} alt="Folic acid" className="right-[20%] bottom-6" width={180} height={180} />
      <RingLabels
        className="left-[38%] bottom-6"
        items={[
          { label: "mAb" },
          { label: "Linker" },
          { label: "Payload" },
          { label: "Oligo" },
          { label: "Enzyme" },
          { label: "Radionuclide" },
        ]}
        radius={60}
      />
    </>
  );
}

function AdcMotif() {
  return (
    <>
      <FloatingImage src={STRUCTURE.mab} alt="IgG structure" className="right-6 top-10 h-52 w-52" />
      <FloatingSmiles name={STRUCTURE.valcit} alt="Val-Cit linker" className="left-[8%] top-16 rotate-6" width={170} height={170} />
      <FloatingSmiles name={STRUCTURE.mmae} alt="Auristatin payload" className="right-[22%] bottom-10 -rotate-3" width={190} height={190} />
      <RingLabels className="left-[42%] bottom-6" items={[{ label: "mAb" }, { label: "Linker" }, { label: "Payload" }]} />
    </>
  );
}

function MabMotif() {
  return (
    <>
      <FloatingImage src={STRUCTURE.mab} alt="IgG structure" className="right-10 top-12 h-60 w-60" />
      <RingLabels className="left-[14%] bottom-10" items={[{ label: "Fab" }, { label: "Fc" }, { label: "Hinge" }]} />
    </>
  );
}

function LinkerMotif() {
  return (
    <>
      <FloatingSmiles name={STRUCTURE.valcit} alt="Val-Cit linker" className="right-8 top-14" width={190} height={190} />
      <FloatingSmiles name={STRUCTURE.smcc} alt="SMCC linker" className="left-[12%] bottom-10 -rotate-6" width={170} height={170} />
      <FloatingSmiles name={STRUCTURE.disulfide} alt="Disulfide linker" className="right-[28%] bottom-6 rotate-3" width={150} height={150} />
      <FloatingSmiles name={STRUCTURE.hydrazone} alt="Hydrazone linker" className="left-[36%] top-10 -rotate-3" width={150} height={150} />
      <FloatingSmiles name={STRUCTURE.ala_ala_asn} alt="Ala-Ala-Asn linker" className="left-[4%] top-24 rotate-6" width={150} height={150} />
      <RingLabels
        className="left-[44%] bottom-4"
        items={[
          { label: "Cleavable" },
          { label: "Non‑cleavable" },
          { label: "Enzymatic" },
          { label: "pH‑labile" },
          { label: "Redox" },
        ]}
        radius={58}
      />
    </>
  );
}

function PayloadMotif() {
  return (
    <>
      <FloatingSmiles name={STRUCTURE.mmae} alt="Auristatin payload" className="right-6 top-12" width={180} height={180} />
      <FloatingSmiles name={STRUCTURE.dm1} alt="DM1 payload" className="left-[10%] bottom-10 -rotate-6" width={180} height={180} />
      <FloatingSmiles name={STRUCTURE.sn38} alt="SN-38 payload" className="right-[28%] bottom-6 rotate-3" width={170} height={170} />
      <RingLabels className="left-[42%] top-6" items={[{ label: "Tubulin" }, { label: "DNA" }, { label: "Topo‑I" }]} />
    </>
  );
}

function PdcMotif() {
  return (
    <>
      <FloatingSmiles name={STRUCTURE.arg_glu_asp} alt="Peptide motif" className="right-8 top-12" width={180} height={180} />
      <FloatingSmiles name={STRUCTURE.valcit} alt="Peptide linker" className="left-[12%] bottom-10 rotate-6" width={170} height={170} />
      <RingLabels className="left-[42%] bottom-6" items={[{ label: "Peptide" }, { label: "Linker" }, { label: "Payload" }]} />
    </>
  );
}

function SmdcMotif() {
  return (
    <>
      <FloatingSmiles name={STRUCTURE.folic_acid} alt="Folic acid ligand" className="right-6 top-10" width={180} height={180} />
      <FloatingSmiles name={STRUCTURE.smcc} alt="Linker" className="left-[14%] bottom-8 -rotate-6" width={170} height={170} />
      <RingLabels className="left-[42%] bottom-6" items={[{ label: "Ligand" }, { label: "Linker" }, { label: "Payload" }]} />
    </>
  );
}

function OligoMotif() {
  return (
    <>
      <FloatingSmiles name={STRUCTURE.adenosine} alt="Adenosine" className="right-8 top-10" width={160} height={160} />
      <FloatingSmiles name={STRUCTURE.uridine} alt="Uridine" className="left-[14%] bottom-10 -rotate-6" width={160} height={160} />
      <RingLabels className="left-[42%] bottom-6" items={[{ label: "siRNA" }, { label: "PMO" }, { label: "ASO" }]} />
    </>
  );
}

function EnzymeMotif() {
  return (
    <>
      <FloatingImage src={STRUCTURE.enzyme} alt="Carboxypeptidase G2 structure" className="right-10 top-10 h-48 w-48" />
      <FloatingSmiles name={STRUCTURE.smcc} alt="Linker" className="left-[12%] bottom-10 -rotate-3" width={150} height={150} />
      <RingLabels className="left-[42%] bottom-6" items={[{ label: "Enzyme" }, { label: "Prodrug" }, { label: "Targeting" }]} />
    </>
  );
}

function RdcMotif() {
  const isotopes = [
    { symbol: "Lu", z: 71 },
    { symbol: "Y", z: 39 },
    { symbol: "Ac", z: 89 },
    { symbol: "Ra", z: 88 },
    { symbol: "I", z: 53 },
    { symbol: "Sm", z: 62 },
    { symbol: "Re", z: 75 },
    { symbol: "Pb", z: 82 },
    { symbol: "Bi", z: 83 },
    { symbol: "Tb", z: 65 },
    { symbol: "At", z: 85 },
  ];
  return (
    <>
      <FloatingSmiles name={STRUCTURE.dota} alt="DOTA chelator" className="right-10 top-10" width={180} height={180} />
      <div className="absolute right-10 bottom-10">
        <div className="relative h-40 w-40">
          {isotopes.map((iso, index) => {
            const angle = (360 / isotopes.length) * index;
            return (
              <div
                key={iso.symbol}
                className="absolute left-1/2 top-1/2"
                style={{
                  transform: `rotate(${angle}deg) translate(62px) rotate(-${angle}deg)`,
                }}
              >
                <div className="rounded-full border border-white/60 bg-white/70 px-2 py-1 text-[10px] text-violet-700 shadow-sm">
                  <div className="font-semibold">{iso.symbol}</div>
                  <div className="text-[9px] text-violet-500">Z {iso.z}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function DesignMotif() {
  return (
    <>
      <FloatingImage src={STRUCTURE.mab} alt="IgG structure" className="right-8 top-8 h-44 w-44" />
      <FloatingSmiles name={STRUCTURE.valcit} alt="Linker" className="left-[12%] bottom-12" width={170} height={170} />
    </>
  );
}

function VisionMotif() {
  return (
    <>
      <FloatingImage src={STRUCTURE.mab} alt="IgG structure" className="right-8 top-10 h-44 w-44" />
      <FloatingSmiles name={STRUCTURE.folic_acid} alt="Folic acid" className="left-[10%] bottom-10" width={170} height={170} />
    </>
  );
}

function SuggestionsMotif() {
  return (
    <>
      <FloatingSmiles name={STRUCTURE.mmae} alt="Auristatin payload" className="right-10 top-10" width={170} height={170} />
      <FloatingSmiles name={STRUCTURE.adenosine} alt="Adenosine" className="left-[12%] bottom-10" width={150} height={150} />
    </>
  );
}
