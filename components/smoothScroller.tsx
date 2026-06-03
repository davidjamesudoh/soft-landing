"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";

export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1 });

    // Drive Lenis through GSAP's ticker so it stays in sync with all
    // other GSAP animations running on the page (hero float, ourStory tunnel).
    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, []);

  return null;
}
