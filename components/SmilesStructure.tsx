"use client";

import { useEffect, useRef, useState } from "react";
import SmilesDrawer from "smiles-drawer";

type Props = {
  name?: string;
  smiles?: string;
  width?: number;
  height?: number;
  className?: string;
  ariaLabel?: string;
};

const RESOLVER_BASE = "/api/smiles?name=";

export function SmilesStructure({
  name,
  smiles,
  width = 180,
  height = 180,
  className,
  ariaLabel,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [resolved, setResolved] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const structureSmiles = smiles ?? resolved;

  useEffect(() => {
    if (smiles) return;
    if (!name) return;
    let active = true;
    fetch(`${RESOLVER_BASE}${encodeURIComponent(name)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.error) {
          setError(true);
          return;
        }
        const value = (data?.smiles ?? "").trim();
        if (!value || value.toLowerCase().includes("not found")) {
          setError(true);
          return;
        }
        setError(false);
        setResolved(value);
      })
      .catch(() => {
        if (!active) return;
        setError(true);
      });
    return () => {
      active = false;
    };
  }, [name, smiles]);

  useEffect(() => {
    if (!structureSmiles || !svgRef.current) return;
    svgRef.current.innerHTML = "";
    SmilesDrawer.parse(
      structureSmiles,
      (tree: unknown) => {
        const drawer = new SmilesDrawer.SvgDrawer({
          width,
          height,
          padding: 12,
          bondThickness: 1.6,
          bondSpacing: 0.18,
          fontSizeLarge: 10,
          fontSizeSmall: 8,
        });
        drawer.draw(tree, svgRef.current as unknown as SVGSVGElement, "light", false);
      },
      () => {
        setError(true);
      }
    );
  }, [structureSmiles, width, height]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-white text-xs text-zinc-400 ${className ?? ""}`}
        style={{ width, height }}
      >
        structure unavailable
      </div>
    );
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      aria-label={ariaLabel ?? name ?? "chemical structure"}
      className={className}
      role="img"
    />
  );
}
