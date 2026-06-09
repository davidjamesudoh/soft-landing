"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.07,
    });

    // Expose instance so any component can call smoothScrollTo()
    (window as unknown as Record<string, unknown>).__lenis = lenis;

    // Drive through GSAP ticker so it stays in sync with animations
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // After OurStory, reduce lerp so the page feels heavier and absorbs
    // the momentum the user built up fast-scrolling through the tunnel.
    lenis.on("scroll", ({ scroll }: { scroll: number }) => {
      const ourStory = document.getElementById("our-story");
      if (!ourStory) return;
      const ourStoryBottom = ourStory.offsetTop + ourStory.offsetHeight;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (lenis as any).options.lerp = scroll > ourStoryBottom ? 0.04 : 0.07;
    });

    const ease = (t: number) => 1 - Math.pow(1 - t, 4);

    // Intercept hash links AND home-page logo clicks for smooth scroll
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href) return;

      // Logo / "go to top" — href="/" while already on the home page
      if (href === "/" && window.location.pathname === "/") {
        e.preventDefault();
        lenis.scrollTo(0, { duration: 1.6, easing: ease });
        return;
      }

      // Hash links — e.g. #our-story, #rsvp, #schedule …
      if (href.startsWith("#")) {
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, { duration: 1.6, easing: ease });
      }
    };
    // capture: true so we intercept before Next.js's router handler
    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      gsap.ticker.remove(onTick);
      lenis.destroy();
      delete (window as unknown as Record<string, unknown>).__lenis;
    };
  }, []);

  return null;
}

/** Call this anywhere to smoothly scroll to an element via the global Lenis instance. */
export function smoothScrollTo(target: HTMLElement | string, duration = 1.6) {
  const lenis = (window as unknown as Record<string, unknown>).__lenis as Lenis | undefined;
  const ease = (t: number) => 1 - Math.pow(1 - t, 4);
  if (lenis) {
    lenis.scrollTo(target, { duration, easing: ease });
  } else if (typeof target === "string") {
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  } else {
    target.scrollIntoView({ behavior: "smooth" });
  }
}
