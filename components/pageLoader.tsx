"use client";

import { useState, useEffect } from "react";

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const dismiss = () => {
      setFading(true);
      setTimeout(() => setVisible(false), 500);
    };

    // If already loaded, dismiss after a short delay so fonts/layout paint first
    if (document.readyState === "complete") {
      const t = setTimeout(dismiss, 300);
      return () => clearTimeout(t);
    }

    // Otherwise wait for load, with a 4s hard cap
    window.addEventListener("load", dismiss, { once: true });
    const cap = setTimeout(dismiss, 4000);
    return () => {
      window.removeEventListener("load", dismiss);
      clearTimeout(cap);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#fffcf5]"
      style={{
        transition: "opacity 0.5s ease",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#D9788B]" />
      </div>
    </div>
  );
}
