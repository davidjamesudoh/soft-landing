"use client";
import { useEffect, useState } from "react";
import Countdown from "@/components/home/countdown";
import FAQ from "@/components/home/faq";
import Hero from "@/components/home/hero";
import OurStory from "@/components/home/ourStory";
import Registry from "@/components/home/registry";
import Rsvp from "@/components/home/rsvp";
import Schedule from "@/components/home/schedule";
import MusicPlayer from "@/components/musicPlayer";

export default function HomePage() {
  const [heroComplete, setHeroComplete] = useState(false);

  useEffect(() => {
    const handler = () => setHeroComplete(true);
    window.addEventListener("hero-complete", handler);
    return () => window.removeEventListener("hero-complete", handler);
  }, []);

  return (
    <main className="relative">
      <Hero />
      <OurStory />
      <Schedule />
      <Rsvp />
      <Countdown />
      <Registry />
      <FAQ />

      {/* Music player — fixed bottom-left, appears when hero image finishes scaling */}
      {/* <div className="fixed bottom-[2.5rem] left-[5%] z-50">
        <MusicPlayer show={heroComplete} />
      </div> */}
    </main>
  );
}
