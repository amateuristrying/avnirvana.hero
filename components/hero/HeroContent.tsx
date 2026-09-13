import { ArrowUpRight } from "./icons";

export default function HeroContent() {
  return (
    <div className="relative z-10">
      <p
        className="rise-in text-[clamp(1.15rem,2.1vw,1.95rem)] font-light tracking-[-0.015em] text-fg-soft"
        style={{ animationDelay: "80ms" }}
      >
        Distributing
      </p>

      {/*
        Two lines on desktop: "Innovation & Excellence in" / "Audio-Visual
        Experiences". Each line is ~10.9em wide, so from `lg` up the size is
        derived from the text column's width (≈ 0.456vw − 55px) rather than the
        viewport alone — that keeps both lines inside the column at every
        desktop width instead of letting them re-wrap. Below `lg` the spans go
        inline and the sentence wraps naturally.
      */}
      <h1
        className="rise-in mt-1.5 text-[clamp(2.05rem,4.15vw,4rem)] font-bold leading-[1.07] tracking-[-0.035em] text-fg lg:mt-2.5 lg:text-[clamp(2.2rem,calc(4.01vw_-_4.8px),3.45rem)]"
        style={{ animationDelay: "160ms" }}
      >
        <span className="lg:block lg:whitespace-nowrap">Innovation &amp; Excellence in </span>
        {/* The space after "Audio-Visual" must sit *outside* its nowrap span,
            or it stops being a wrap opportunity on narrow screens. */}
        <span className="lg:block lg:whitespace-nowrap">
          <span className="whitespace-nowrap text-accent">Audio-Visual</span> Experiences
        </span>
      </h1>

      <div
        className="rise-in mt-6 flex items-center gap-2 lg:mt-8"
        style={{ animationDelay: "260ms" }}
        aria-hidden="true"
      >
        <span className="block h-px w-[68px] bg-[linear-gradient(90deg,rgba(246,244,251,0.45),rgba(246,244,251,0.1))] lg:w-[84px]" />
        <span className="block h-[3px] w-[3px] rounded-full bg-fg/40" />
      </div>

      <p
        // A soft halo keeps the small copy readable where filaments cross it.
        className="rise-in mt-5 max-w-[25.5em] text-[clamp(0.92rem,1.12vw,1.1rem)] leading-[1.62] text-fg-mute [text-shadow:0_1px_14px_rgba(18,10,30,0.95)] lg:mt-6"
        style={{ animationDelay: "340ms" }}
      >
        Premium audio, visual &amp; distributed AV solutions imported and delivered with expert
        design support.
      </p>

      <div className="rise-in mt-7 lg:mt-9" style={{ animationDelay: "440ms" }}>
        <a
          href="#brands"
          className="group inline-flex items-center gap-2.5 rounded-full bg-fg py-3.5 pl-6 pr-5 text-[14px] font-medium text-canvas shadow-[0_14px_40px_-18px_rgba(0,0,0,0.9)] transition-[background-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-px hover:bg-white hover:shadow-[0_18px_46px_-16px_rgba(185,174,224,0.45)] sm:py-4 sm:pl-7 sm:pr-6 sm:text-[15px]"
        >
          Explore Our Brands
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-[3px] group-hover:-translate-y-[3px]" />
        </a>
      </div>
    </div>
  );
}
