"use client";
import Countdown from "@/components/home/countdown";
import FAQ from "@/components/home/faq";
import Hero from "@/components/home/hero";
import OurStory from "@/components/home/ourStory";
import Registry from "@/components/home/registry";
import Rsvp from "@/components/home/rsvp";
import Schedule from "@/components/home/schedule";

export default function HomePage() {
  return (
    <main className="relative overflow-x-hidden">
      <Hero />
      <OurStory />
      <Schedule />
      <Rsvp />
      <Countdown />
      <Registry />
      <FAQ />
    </main>
  );
}
