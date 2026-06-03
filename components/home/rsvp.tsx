"use client";

import { useSyncExternalStore, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import RsvpForm from "@/components/rsvpForm";

const RSVP_KEY = "rsvp_submitted";

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

  const handleSuccess = () => {
    localStorage.setItem(RSVP_KEY, "true");
    window.dispatchEvent(new Event("storage"));
    setOpen(false);
  };

  const scrollToFaq = () => {
    document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="rsvp" className="relative mb-8 md:mb-12 px-4">
      {/* top gradient — blends from the section above */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[145px] pointer-events-none z-10"
        style={{
          background: "linear-gradient(to bottom, #ffb1b1, transparent)",
        }}
      />

      <div className="relative z-10 min-h-screen overflow-hidden flex items-center justify-center rounded-2xl border border-black">
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
                      <div className="relative w-full max-w-2xl">
                        <Dialog.Close className="absolute -top-3 -right-3 z-10 w-8 h-8 bg-black text-white flex items-center justify-center text-lg leading-none">
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
