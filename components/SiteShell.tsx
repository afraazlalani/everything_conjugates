"use client";

import type { ReactNode } from "react";
import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";
import { BackgroundMotif } from "@/components/BackgroundMotif";
import { BrandLogo } from "@/components/BrandLogo";

type MotifVariant =
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

const DEFAULT_LINKS = [
  { label: "home", href: "/" },
  { label: "vision", href: "/vision" },
  { label: "design", href: "/design" },
  { label: "suggestions", href: "/suggestions" },
];

export function SiteShell({
  children,
  motif,
  links = DEFAULT_LINKS,
  mainClassName,
}: {
  children: ReactNode;
  motif?: MotifVariant;
  links?: Array<{ label: string; href: string }>;
  mainClassName?: string;
}) {
  return (
    <div className="site-page">
      {motif ? <BackgroundMotif variant={motif} /> : null}

      <Navbar className="site-navbar">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <NavbarContent justify="end" className="gap-3 sm:gap-5">
          {links.map((item) => (
            <NavbarItem key={item.label}>
              <Link href={item.href} className="site-nav-link">
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      </Navbar>

      <main className={["site-main", mainClassName].filter(Boolean).join(" ")}>
        {children}
      </main>
    </div>
  );
}
