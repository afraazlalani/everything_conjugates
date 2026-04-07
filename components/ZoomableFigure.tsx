"use client";

import { ReactNode, useEffect, useState } from "react";

export function ZoomableFigure({
  children,
  label,
  className,
  modalClassName,
}: {
  children: ReactNode;
  label: string;
  className?: string;
  modalClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`Expand ${label}`}
        onClick={() => setOpen(true)}
        className={`block w-full cursor-zoom-in text-left ${className ?? ""}`.trim()}
      >
        {children}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/72 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <div
            className={`max-h-[92vh] w-full max-w-6xl overflow-auto rounded-[1.5rem] border border-white/20 bg-white p-4 shadow-2xl md:p-6 [&_.zoom-frame]:!h-auto [&_.zoom-frame]:!max-h-[80vh] [&_.zoom-frame]:!overflow-visible [&_.zoom-frame]:!p-2 [&_.zoom-graphic]:!h-auto [&_.zoom-graphic]:!max-h-[78vh] [&_.zoom-graphic]:!w-full ${modalClassName ?? ""}`.trim()}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-zinc-700">{label}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-zinc-600 transition hover:bg-slate-50"
              >
                close
              </button>
            </div>
            <div className="cursor-default">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
