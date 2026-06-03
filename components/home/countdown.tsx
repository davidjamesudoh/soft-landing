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
    <section
      id="countdown"
      className="grid grid-cols-2 md:gird-cols-4 gap-10 py-12 md:py-24 px-10 max-w-[320px] mx-auto"
    >
      {/* <section
      id="countdown"
      className="flex items-center justify-center gap-4 py-12 md:py-24 px-10"
    > */}
      {units.map((unit, i) => (
        // <div key={unit.label} className="flex items-center gap-4">
        <div key={unit.label} className="">
          <div className="flex flex-col items-center">
            <span className="text-7xl md:text-7xl font-ed-lavonia">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="text-sm uppercase font-semibold mt-1">
              {unit.label}
            </span>
          </div>
          {/* {i < units.length - 1 && (
            <span className="text-4xl font-light mb-4">:</span>
          )} */}
        </div>
      ))}
    </section>
  );
}
