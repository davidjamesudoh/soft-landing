"use client";
import { useEffect, useRef, useState } from "react";

export default function MusicPlayer({ show }: { show: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(false);

  // Fade in when shown
  useEffect(() => {
    if (show) {
      // Small delay so the fade-in feels intentional
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    }
  }, [show]);

  // Autoplay when player becomes visible
  useEffect(() => {
    if (!visible || !audioRef.current) return;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  }, [visible]);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  if (!show) return null;

  return (
    <div
      className="flex items-center gap-2 transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <audio ref={audioRef} src="/music/loving-you.mp3" loop />
      <button
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="w-7 h-7 flex items-center justify-center rounded-full border border-white text-white text-[10px] shrink-0"
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <div className="text-white leading-tight">
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
          Now Playing
        </p>
        <p className="text-xs font-medium">Loving You</p>
      </div>
    </div>
  );
}
