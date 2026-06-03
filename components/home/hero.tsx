"use client";

import Image from "next/image";
import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { useStableNavColor } from "@/context/navColor";

const ANIMATION_SCROLL = 2000;
const HOLD_SCROLL = 100;
const TARGET_W = 270;
const TARGET_H = 365;

const FONT_START = 62; // px – full-screen size
const FONT_END = 45; // px – card size

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export default function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageWrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const gradientRef = useRef<HTMLDivElement>(null);
  const floatTweenRef = useRef<gsap.core.Tween | null>(null);
  const setNavColor = useStableNavColor();

  useEffect(() => {
    const sectionEl = sectionRef.current!;
    const imageWrapEl = imageWrapRef.current!;
    const textEl = textRef.current!;
    const gradientEl = gradientRef.current!;

    const VW = window.innerWidth;
    const VH = window.innerHeight;

    sectionEl.style.height = `${ANIMATION_SCROLL + HOLD_SCROLL + VH}px`;

    // start: near the bottom of the viewport (inside the full-screen image)
    // end:   16px below the bottom edge of the small card
    const textTopStart = VH - 170;
    const textTopEnd = (VH + TARGET_H) / 2 + 16;

    const startFloat = () => {
      if (floatTweenRef.current) return;
      floatTweenRef.current = gsap.to(imageWrapEl, {
        y: -12,
        boxShadow: "0 32px 48px rgba(0,0,0,0.22)",
        duration: 2.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    };

    const stopFloat = () => {
      if (!floatTweenRef.current) return;
      floatTweenRef.current.kill();
      floatTweenRef.current = null;
      gsap.set(imageWrapEl, { y: 0, boxShadow: "none" });
    };

    const onScroll = () => {
      const raw = Math.max(0, Math.min(1, window.scrollY / ANIMATION_SCROLL));
      const progress = easeInOutCubic(raw);

      const w = VW + (TARGET_W - VW) * progress;
      const h = VH + (TARGET_H - VH) * progress;
      const fontSize = FONT_START + (FONT_END - FONT_START) * progress;
      const textTop = textTopStart + (textTopEnd - textTopStart) * progress;
      const channel = Math.round(255 * (1 - progress));

      gsap.set(imageWrapEl, { width: w, height: h });
      gsap.set(gradientEl, { height: 145 * progress });
      gsap.set(textEl, {
        top: textTop,
        fontSize,
        color: `rgb(${channel},${channel},${channel})`,
      });

      setNavColor(window.scrollY < 700 ? "white" : "black");

      if (progress >= 1) {
        startFloat();
      } else {
        stopFloat();
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      stopFloat();
    };
  }, [setNavColor]);

  return (
    <div ref={sectionRef} className="relative">
      {/* no overflow-hidden here so the text can escape below the image */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center">
        <div
          ref={imageWrapRef}
          className="relative overflow-hidden"
          style={{ width: "100vw", height: "100vh" }}
        >
          <Image
            src="/images/hero.png"
            fill
            className="object-cover"
            alt=""
            priority
          />
        </div>

        {/* bottom gradient — height grows from 0 as image shrinks */}
        <div
          ref={gradientRef}
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 pointer-events-none z-20"
          style={{
            height: 0,
            background: "linear-gradient(to top, #ffb1b1, transparent)",
          }}
        />

        {/* text: starts overlaid on the image, moves below it */}
        <h2
          ref={textRef}
          className="font-ed-lavonia absolute w-full text-center pointer-events-none z-10"
          style={{
            top: "calc(100vh - 170px)",
            fontSize: FONT_START,
            color: "rgb(255,255,255)",
          }}
        >
          Tomini & David
        </h2>
      </div>
    </div>
  );
}
