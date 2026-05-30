"use client";
import Countdown from "@/components/home/countdown";
import FAQ from "@/components/home/faq";
import Hero from "@/components/home/hero";
import Rsvp from "@/components/home/rsvp";

export default function HomePage() {
  return (
    <main className="relative py-10">
      <Hero />
      <Rsvp />
      <Countdown />
      <FAQ />
    </main>
  );
}
