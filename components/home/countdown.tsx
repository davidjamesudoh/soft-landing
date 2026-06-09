"use client";

import { useSyncExternalStore } from "react";

const WEDDING_DATE = new Date("2026-10-30T00:00:00");
let cachedSnapshot = { days: 0, hours: 0, minutes: 0, seconds: 0 };
const getServerSnapshot = () => cachedSnapshot;

function getTimeLeft() {
  const now = new Date();
  const diff = WEDDING_DATE.getTime() - now.getTime();

  const days = diff <= 0 ? 0 : Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = diff <= 0 ? 0 : Math.floor(diff / (1000 * 60 * 60)) % 24;
  const minutes = diff <= 0 ? 0 : Math.floor(diff / (1000 * 60)) % 60;

  const seconds = diff <= 0 ? 0 : Math.floor(diff / 1000) % 60;

  if (
    cachedSnapshot.days === days &&
    cachedSnapshot.hours === hours &&
    cachedSnapshot.minutes === minutes &&
    cachedSnapshot.seconds === seconds
  ) {
    return cachedSnapshot;
  }

  cachedSnapshot = { days, hours, minutes, seconds };
  return cachedSnapshot;
}

export default function Countdown() {
  const timeLeft = useSyncExternalStore(
    (callback) => {
      const interval = setInterval(callback, 1000);
      return () => clearInterval(interval);
    },
    getTimeLeft,
    getServerSnapshot,
  );

  const units = [
    // { label: "Weeks", value: timeLeft.weeks },
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },

    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    // <section
    //   id="countdown"
    //   className="space-y-5 pt-18 md:pt-20 px-6"
    // >
    <section id="registry" className="space-y-5 pt-20 md:pt-30 px-6">
      <p className="text-xs uppercase font-semibold text-center">
        THE COUNTDOWN IS ON!
      </p>
      {/* <div className="grid grid-cols-2 md:gird-cols-4 gap-10 max-w-[320px] mx-auto"> */}

      <div className="flex items-center justify-center gap-6">
        {units.map((unit, i) => (
          // <div key={unit.label} className="flex items-center gap-4">
          <div key={unit.label} className="">
            <div className="flex flex-col items-center">
              <span className="text-5xl md:text-7xl text-green-dark font-ed-lavonia">
                {String(unit.value).padStart(2, "0")}
              </span>
              <span className="text-xs uppercase font-semibold mt-1">
                {unit.label}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full h-px max-w-[174px] mx-auto mt-14 bg-green-dark" />
    </section>
  );
}
