import { NextRequest, NextResponse } from "next/server";

const PROPERTY_FIELDS = [
  "MolecularFormula",
  "MolecularWeight",
  "IUPACName",
  "XLogP",
  "HBondDonorCount",
  "HBondAcceptorCount",
].join(",");

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("name")?.trim();

  if (!query) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
    query,
  )}/property/${PROPERTY_FIELDS}/JSON`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "compound not found" }, { status: 404 });
    }

    const data = (await response.json()) as {
      PropertyTable?: {
        Properties?: Array<{
          MolecularFormula?: string;
          MolecularWeight?: number;
          IUPACName?: string;
          XLogP?: number;
          HBondDonorCount?: number;
          HBondAcceptorCount?: number;
        }>;
      };
    };

    const compound = data.PropertyTable?.Properties?.[0];

    if (!compound) {
      return NextResponse.json({ error: "compound not found" }, { status: 404 });
    }

    return NextResponse.json({
      formula: compound.MolecularFormula ?? null,
      molecularWeight:
        typeof compound.MolecularWeight === "number"
          ? compound.MolecularWeight.toFixed(2)
          : null,
      iupacName: compound.IUPACName ?? null,
      xlogp:
        typeof compound.XLogP === "number" ? compound.XLogP.toFixed(2) : null,
      hBondDonors:
        typeof compound.HBondDonorCount === "number"
          ? compound.HBondDonorCount
          : null,
      hBondAcceptors:
        typeof compound.HBondAcceptorCount === "number"
          ? compound.HBondAcceptorCount
          : null,
    });
  } catch {
    return NextResponse.json(
      { error: "pubchem lookup failed" },
      { status: 502 },
    );
  }
}
