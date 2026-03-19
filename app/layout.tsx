import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

const manrope = localFont({
  src: "./fonts/Manrope-Bold.ttf",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Everything Conjugates",
  description: "A full-spectrum atlas of bioconjugate science.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${manrope.variable} min-h-screen text-foreground bg-background font-sans antialiased`}
      >
        <Script
          src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.plot.ly/plotly-2.30.0.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/smiles-drawer@2.1.6/dist/smiles-drawer.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/cytoscape@3.28.1/dist/cytoscape.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://3dmol.csb.pitt.edu/build/3Dmol-min.js"
          strategy="beforeInteractive"
        />
        <Script id="mermaid-init" strategy="afterInteractive">
          {`if (window.mermaid) { window.mermaid.initialize({ startOnLoad: true }); }`}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
