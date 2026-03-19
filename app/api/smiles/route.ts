import { NextResponse } from "next/server";

const RESOLVER_BASE = "https://cactus.nci.nih.gov/chemical/structure";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${RESOLVER_BASE}/${encodeURIComponent(name)}/smiles`,
      { cache: "force-cache" }
    );
    const text = (await res.text()).trim();
    if (!text || text.toLowerCase().includes("not found")) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json({ smiles: text });
  } catch {
    return NextResponse.json({ error: "resolver failed" }, { status: 502 });
  }
}
