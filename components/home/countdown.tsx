"use client";

import { useEffect, useState } from "react";

const WEDDING_DATE = new Date("2026-10-16T00:00:00");

function getTimeLeft() {
  const now = new Date();
  const diff = WEDDING_DATE.getTime() - now.getTime();

  if (diff <= 0) return { /* weeks: 0, */ days: 0, hours: 0, seconds: 0 };

  const totalSeconds = Math.floor(diff / 1000);
  const totalHours = Math.floor(diff / (1000 * 60 * 60));
  const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));

  // const weeks = Math.floor(totalDays / 7);
  const days = totalDays;
  const hours = totalHours % 24;
  const seconds = totalSeconds % 60;

  return { /* weeks, */ days, hours, seconds };
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const units = [
    // { label: "Weeks", value: timeLeft.weeks },
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <section
      id="countdown"
      className="flex items-center justify-center gap-4 py-8 md:py-12 px-3 md:px-6"
    >
      {units.map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <span className="text-5xl md:text-7xl font-ed-lavonia">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="text-sm uppercase font-semibold mt-1">
              {unit.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-4xl font-light mb-4">:</span>
          )}
        </div>
      ))}
    </section>
  );
}
