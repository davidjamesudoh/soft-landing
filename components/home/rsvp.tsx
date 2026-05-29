"use client";

import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import RsvpForm from "@/components/rsvpForm";

export default function Rsvp() {
  return (
    <section
      id="rsvp"
      className="relative min-h-screen flex items-center justify-center overflow-hidden mb-8 md:mb-12"
    >
      {/* Full-screen background */}
      <Image
        src="/images/rsvp1.png"
        fill
        className="object-cover"
        alt=""
        priority
      />

      {/* Center card */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <Image
            src="/images/rsvp2.png"
            width={520}
            height={680}
            className="object-contain"
            alt=""
          />

          {/* Overlay content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <h2 className="font-ed-lavonia text-6xl md:text-7xl text-center text-brand-pink">
              Kindly <br /> R.S.V.P
            </h2>

            <Dialog.Root>
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
                    <RsvpForm />
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </div>
      </div>
    </section>
  );
}
