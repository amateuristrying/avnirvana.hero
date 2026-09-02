import { ArrowUpRight } from "./icons";

export default function HeroContent() {
  return (
    <div className="relative z-10">
      <p
        className="rise-in text-[clamp(1.15rem,2.1vw,1.95rem)] font-light tracking-[-0.015em] text-ink-soft"
        style={{ animationDelay: "80ms" }}
      >
        Distributing
      </p>

      {/*
        The copy is a single sentence; the spans only control where it folds.
        They go inline below `lg`, so narrow viewports wrap it naturally.
      */}
      <h1
        className="rise-in mt-1.5 text-[clamp(2.05rem,4.15vw,4rem)] font-bold leading-[1.07] tracking-[-0.035em] text-ink lg:mt-2.5"
        style={{ animationDelay: "160ms" }}
      >
        <span className="lg:block">Innovation &amp; </span>
        <span className="lg:block">Excellence in </span>
        {/* The space must sit *outside* the nowrap span, or it stops being a
            wrap opportunity and the next word is pushed off narrow screens. */}
        <span className="lg:block">
          <span className="whitespace-nowrap text-accent">Audio-Visual</span>{" "}
        </span>
        <span className="lg:block">Experiences</span>
      </h1>

      <div
        className="rise-in mt-6 flex items-center gap-2 lg:mt-8"
        style={{ animationDelay: "260ms" }}
        aria-hidden="true"
      >
        <span className="block h-px w-[68px] bg-[linear-gradient(90deg,rgba(23,26,32,0.32),rgba(23,26,32,0.1))] lg:w-[84px]" />
        <span className="block h-[3px] w-[3px] rounded-full bg-ink/30" />
      </div>

      <p
        className="rise-in mt-5 max-w-[25.5em] text-[clamp(0.92rem,1.12vw,1.1rem)] leading-[1.62] text-mute lg:mt-6"
        style={{ animationDelay: "340ms" }}
      >
        Premium audio, visual &amp; distributed AV solutions imported and delivered with expert
        design support.
      </p>

      <div className="rise-in mt-7 lg:mt-9" style={{ animationDelay: "440ms" }}>
        <a
          href="#brands"
          className="group inline-flex items-center gap-2.5 rounded-full bg-ink py-3.5 pl-6 pr-5 text-[14px] font-medium text-white shadow-[0_14px_34px_-18px_rgba(23,26,32,0.85)] transition-[background-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-px hover:bg-ink-soft hover:shadow-[0_18px_40px_-18px_rgba(23,26,32,0.9)] sm:py-4 sm:pl-7 sm:pr-6 sm:text-[15px]"
        >
          Explore Our Brands
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-[3px] group-hover:-translate-y-[3px]" />
        </a>
      </div>
    </div>
  );
}
