"use client";
import Countdown from "@/components/home/countdown";
import FAQ from "@/components/home/faq";
import Hero from "@/components/home/hero";
import OurStory from "@/components/home/ourStory";
import Rsvp from "@/components/home/rsvp";

export default function HomePage() {
  return (
    <main className="relative">
      <Hero />
      <OurStory />
      <Rsvp />
      <Countdown />
      <FAQ />
    </main>
  );
}
