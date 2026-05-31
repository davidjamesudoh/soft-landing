"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import styles from "../../styles/tunnelSlide.module.css";

const CONFIG = {
  totalImages: 12,
  scrollSpeed: 2,
  layerGap: 2500,
  lerp: 0.07,
};

const storyText = [
  "1 Mike Wagenheim met in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015",
  "2 Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015",
  "3 while attending college in Boston. Jennifer Heintz and Mike Wagenheim met in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015 ",
  "4 Mike Wagenheim met in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015",
  "5 Mike Wagenheim met in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015",
  "6 Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015",
  "7 while attending college in Boston. Jennifer Heintz and Mike Wagenheim met in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015 ",
  "8 Mike Wagenheim met in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015",
  "9 Mike Wagenheim met in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015",
  "10 Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015",
  "11 while attending college in Boston. Jennifer Heintz and Mike Wagenheim met in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015 ",
  "12 Mike Wagenheim met in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015. Jennifer Heintz met Mike Wagenheim in a design course in 2015",
];

export default function OurStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const storyTextRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const totalLayerCount = CONFIG.totalImages;
    const visibleDepth = 2 * CONFIG.layerGap;
    const exitPoint = 1500;

    // Start one full layerGap behind the camera so layer 0 appears small
    // in the distance rather than already large and close.
    //
    // At z = -layerGap (-2500), perspective math gives:
    //   size = 1000 / (1000 - (-2500)) = 1000 / 3500 ≈ 29% of CSS size  ✓ small
    //
    // Old value (750) gave: 1000 / (1000 - 750) = 4× CSS size  ✗ huge & off-screen
    const initialScroll = -CONFIG.layerGap;

    const maxScroll = (totalLayerCount - 1) * CONFIG.layerGap + exitPoint;

    const spotlightEl = spotlightRef.current!;
    const sectionEl = sectionRef.current!;

    const sectionScrollDistance =
      (maxScroll - initialScroll) / CONFIG.scrollSpeed;
    sectionEl.style.height = `${sectionScrollDistance + window.innerHeight}px`;

    const sectionAbsoluteTop =
      sectionEl.getBoundingClientRect().top + window.scrollY;

    // Build tunnel DOM
    const tunnelEl = document.createElement("div");
    tunnelEl.classList.add(styles.tunnel);
    spotlightEl.appendChild(tunnelEl);

    const layerData: {
      el: HTMLDivElement;
      baseZ: number;
      imageNumber: number;
      currentOverlay: number;
    }[] = [];

    for (let i = 0; i < totalLayerCount; i++) {
      const layerEl = document.createElement("div");
      layerEl.classList.add(styles.layer);

      const imageNumber = i + 1;
      const isLeft = i % 2 === 0;
      const itemX = isLeft ? -520 : 120;
      const itemY = -170;

      const itemEl = document.createElement("div");
      itemEl.classList.add(styles.item);
      itemEl.style.left = `${itemX}px`;
      itemEl.style.top = `${itemY}px`;

      const imageEl = document.createElement("img");
      imageEl.src = `/images/our-story/${imageNumber}.webp`;
      imageEl.alt = `Image ${imageNumber}`;
      itemEl.appendChild(imageEl);

      const overlayEl = document.createElement("div");
      overlayEl.classList.add(styles.itemOverlay);
      itemEl.appendChild(overlayEl);

      layerEl.appendChild(itemEl);
      tunnelEl.appendChild(layerEl);
      layerData.push({
        el: layerEl,
        baseZ: -i * CONFIG.layerGap,
        imageNumber,
        currentOverlay: 1,
      });
    }

    let targetScroll = initialScroll;
    let currentScroll = initialScroll;
    let activeImageNumber = -1;

    const handleScroll = () => {
      const scrolled = window.scrollY - sectionAbsoluteTop;
      if (scrolled <= 0) {
        targetScroll = initialScroll;
      } else {
        targetScroll = Math.min(
          maxScroll,
          initialScroll + scrolled * CONFIG.scrollSpeed,
        );
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    function calculateOverlay(z: number) {
      if (z > exitPoint) return 1;
      if (z >= 0) return 0;
      if (z > -visibleDepth) {
        const progress = Math.abs(z) / visibleDepth;
        return progress * progress;
      }
      return 1;
    }

    const tickerCallback = () => {
      currentScroll += (targetScroll - currentScroll) * CONFIG.lerp;

      let lowestOverlay = 1;
      let mostVisibleLayer: (typeof layerData)[0] | null = null;

      layerData.forEach((layer) => {
        const z = layer.baseZ + currentScroll;
        const overlay = calculateOverlay(z);
        layer.currentOverlay = overlay;

        gsap.set(layer.el, {
          z,
          "--overlay": Math.min(1, Math.max(0, overlay)),
          visibility: overlay >= 1 ? "hidden" : "visible",
        });

        if (overlay < lowestOverlay) {
          lowestOverlay = overlay;
          mostVisibleLayer = layer;
        }
      });

      if (
        mostVisibleLayer &&
        (mostVisibleLayer as (typeof layerData)[0]).imageNumber !==
          activeImageNumber &&
        storyTextRef.current
      ) {
        activeImageNumber = (mostVisibleLayer as (typeof layerData)[0])
          .imageNumber;
        storyTextRef.current.textContent =
          storyText[activeImageNumber - 1] ?? "";
      }

      if (percentRef.current) {
        const percent = Math.round(
          ((currentScroll - initialScroll) / (maxScroll - initialScroll)) * 100,
        );
        percentRef.current.textContent = `${Math.max(0, Math.min(100, percent))}%`;
      }
    };

    gsap.ticker.add(tickerCallback);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      gsap.ticker.remove(tickerCallback);
      if (spotlightEl.contains(tunnelEl)) {
        spotlightEl.removeChild(tunnelEl);
      }
    };
  }, []);

  return (
    <section id="our-story" ref={sectionRef} className="mb-4 md:mb-8">
      <div
        ref={spotlightRef}
        className="sticky top-0 h-screen w-full bg-[#D9788B] py-8 md:py-12 overflow-hidden perspective-[1000px]"
      >
        <div className="container mx-auto text-white px-4">
          <h2 className="font-ed-lavonia text-5xl md:text-7xl mb-11 text-center">
            Our Story
          </h2>
          <p
            ref={storyTextRef}
            className="text-xs md:text-sm max-w-[350px] md:max-w-[500px] px-4 mx-auto text-center"
          >
            {storyText[0]}
          </p>
        </div>
        <div className="absolute bottom-[2.5rem] right-[5%] z-10 text-white/70 text-xs flex items-center gap-2">
          <span>SCROLL↓</span>
          <span ref={percentRef}>0%</span>
        </div>
      </div>
    </section>
  );
}
