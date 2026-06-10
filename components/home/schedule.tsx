"use client";
import { scheduleList } from "@/lib/data";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Schedule() {
  const sectionRef = useRef<HTMLElement>(null);
  const path1Ref = useRef<SVGPathElement | null>(null);
  const path2Ref = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const path1 = path1Ref.current;
    const path2 = path2Ref.current;
    const section = sectionRef.current;
    if (!path1 || !path2 || !section) return;

    const len1 = path1.getTotalLength();
    const len2 = path2.getTotalLength();

    gsap.set(path1, { strokeDasharray: len1, strokeDashoffset: len1 });
    gsap.set(path2, { strokeDasharray: len2, strokeDashoffset: len2 });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 70%",
        end: "bottom 50%",
        scrub: true,
      },
    });

    // path1 fills first, then path2 starts once path1 is done
    tl.to(path1, { strokeDashoffset: 0, ease: "none" }).to(path2, {
      strokeDashoffset: 0,
      ease: "none",
    });

    return () => {
      tl.scrollTrigger?.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative pt-17 md:pt-20 px-4 md:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[-40px] h-[85px] pointer-events-none z-10"
        style={{
          background: "linear-gradient(rgb(218 120 139), #fffcf5)",
        }}
      />
      <div id="schedule" className="relative z-20 max-w-[600px] mx-auto">
        <div className="pt-21">
          <h2 className="font-ed-lavonia text-black text-5xl md:text-7xl mb-10 text-center">
            Wedding Schedule
          </h2>
          <div className="relative">
            {/* SVG paths drawn on scroll, absolutely positioned behind items */}
            <div
              className="absolute inset-0 pointer-events-none w-[360px] sm:w-[75%] md:w-[350px] left-[-6px] sm:left-[15%] md:left-[31%] top-[-200px] md:top-[-150px]"
              aria-hidden="true"
            >
              <svg
                width="267"
                height="401"
                viewBox="0 0 267 401"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <path
                  ref={path1Ref}
                  d="M190.5 1.50002C212.956 2.2639 259.265 13.875 264.854 54.2083C271.84 104.625 220.252 135.106 204.139 124.792C187.672 114.25 210.855 93.1667 225.93 114.25C243.496 138.817 236.243 159.319 230.421 166.5"
                  stroke="#D6E5F3"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  ref={path2Ref}
                  d="M114.37 204.388C99.8701 213.388 93.4868 208.68 72.37 199.388C34.8701 182.888 -15.065 209.388 6.86996 260.388C25.3642 303.388 69.8874 283.116 101.37 324.388C119 347.5 108.037 391.833 101.37 399.5"
                  stroke="#D6E5F3"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div className="space-y-12 relative z-10">
              {scheduleList.map((item, index) => (
                <div
                  key={item.title}
                  className={`max-w-[260px] p-3 bg-secondary  ${index % 2 === 0 ? "" : "ml-auto"}`}
                >
                  <p className="mb-2 text-sm">{item.date}</p>
                  <h4 className="mb-3 text-base font-bold font-new-kansas">
                    {item.title}
                  </h4>
                  <p className="text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
