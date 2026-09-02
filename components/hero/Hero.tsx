import HeroBackground from "./HeroBackground";
import HeroContent from "./HeroContent";
import Navbar from "./Navbar";
import ParticleLogo from "./ParticleLogo";
import ScrollIndicator from "./ScrollIndicator";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-svh w-full flex-col overflow-hidden">
      <HeroBackground />
      <Navbar />

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-5 sm:px-8 lg:px-14">
        <div className="grid flex-1 grid-cols-1 items-center gap-y-7 pb-24 pt-[98px] sm:pt-[112px] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-x-[7vw] lg:gap-y-0 lg:pb-24 lg:pt-[104px]">
          <ParticleLogo className="h-[29vh] min-h-[180px] w-full sm:h-[32vh] sm:min-h-[230px] md:h-[38vh] lg:h-[68vh] lg:min-h-[400px] lg:max-h-[720px]" />
          <HeroContent />
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
