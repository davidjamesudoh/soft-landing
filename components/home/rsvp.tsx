"use client";

import { useSyncExternalStore, useState, useRef, useEffect } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import RsvpForm from "@/components/rsvpForm";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { smoothScrollTo } from "@/components/smoothScroller";

const RSVP_KEY = "rsvp_submitted";
gsap.registerPlugin(ScrollTrigger);

function useRsvpd() {
  return useSyncExternalStore(
    (callback) => {
      window.addEventListener("storage", callback);
      return () => window.removeEventListener("storage", callback);
    },
    () => localStorage.getItem(RSVP_KEY) === "true",
    () => false,
  );
}

export default function Rsvp() {
  const hasRsvpd = useRsvpd();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  const handleSuccess = () => {
    localStorage.setItem(RSVP_KEY, "true");
    window.dispatchEvent(new Event("storage"));
    setOpen(false);
  };

  const scrollToFaq = () => smoothScrollTo("#faq");

  useEffect(() => {
    const section = containerRef.current;
    const inner = innerRef.current;
    if (!section || !inner) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 95%",
        end: "top 10%",
        scrub: 2,
      },
    });

    tl.to(section, { paddingLeft: 16, paddingRight: 16, ease: "none" }, 0).to(
      inner,
      { borderRadius: 20, ease: "none" },
      0,
    );

    return () => {
      tl.scrollTrigger?.kill();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      id="rsvp"
      className="relative px-0 pt-20 md:pt-20"
    >
      {/* top gradient — blends from the section above */}

      <div
        ref={innerRef}
        className="relative z-10 min-h-[90vh] overflow-hidden flex items-center justify-center rounded-none"
      >
        <Image
          src="/images/rsvp1.png"
          fill
          className="object-cover"
          alt=""
          priority
        />

        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <Image
              src="/images/rsvp2.png"
              width={520}
              height={680}
              className="object-contain"
              alt=""
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <h2 className="font-ed-lavonia text-6xl md:text-7xl text-center text-brand-pink">
                {hasRsvpd ? (
                  <>
                    Thank <br /> You!
                  </>
                ) : (
                  <>
                    Kindly <br /> R.S.V.P
                  </>
                )}
              </h2>

              {hasRsvpd ? (
                <button
                  onClick={scrollToFaq}
                  className="text-base md:text-lg font-medium uppercase border-3 border-brand-pink rounded-full px-5 py-2"
                >
                  Continue
                </button>
              ) : (
                <Dialog.Root open={open} onOpenChange={setOpen}>
                  <Dialog.Trigger asChild>
                    <button className="text-base md:text-lg font-medium uppercase border-3 border-brand-pink rounded-full px-5 py-2">
                      click to R.S.V.P
                    </button>
                  </Dialog.Trigger>

                  <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10">
                      <Dialog.Title className="sr-only">RSVP Form</Dialog.Title>
                      <div className="relative w-full max-w-2xl">
                        <Dialog.Close className="absolute -top-3 right-0 z-10 w-8 h-8 rounded-full bg-brand-pink text-white flex items-center justify-center text-lg leading-none">
                          ×
                        </Dialog.Close>
                        <RsvpForm onSuccess={handleSuccess} />
                      </div>
                    </Dialog.Content>
                  </Dialog.Portal>
                </Dialog.Root>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
