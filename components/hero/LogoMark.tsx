import { AV_LOGO, AV_LOGO_VIEWBOX } from "@/lib/logo";

/**
 * The chevron mark as plain vector — used at small sizes (header, favicon-ish
 * contexts) where a particle field would be illegible. Same geometry source as
 * the particle logo, so the two can never drift apart.
 */
export default function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox={AV_LOGO_VIEWBOX} className={className} fill="currentColor" aria-hidden="true">
      {AV_LOGO.paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
