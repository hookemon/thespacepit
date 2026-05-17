"use client";

/**
 * Small client component — the dossier page is a server component and
 * needs a thin client island to trigger window.print(). Kept separate so
 * the bulk of the dossier stays server-rendered (no client JS bundle).
 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="font-[var(--font-jetbrains-mono)] text-xs uppercase tracking-wider bg-[#0B0B0B] text-[#F2B705] px-3 py-2 shadow-[3px_3px_0_#E83A1C] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#E83A1C] transition-transform"
    >
      Print / Save as PDF
    </button>
  );
}
