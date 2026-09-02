import { MouseGlyph } from "./icons";

export default function ScrollIndicator() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-2 lg:bottom-7">
      <MouseGlyph className="h-[26px] w-[17px] text-ink/45 lg:h-[30px] lg:w-[20px]" />
      <span className="text-[11.5px] font-light tracking-[0.01em] text-mute lg:text-[12.5px]">
        Scroll to explore
      </span>
      <span className="block h-[3px] w-[3px] rounded-full bg-ink/25" />
    </div>
  );
}
