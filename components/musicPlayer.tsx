"use client";

import { useEffect, useRef, useState } from "react";
import { useNavColor } from "@/context/navColor";
import { MUSIC_PROVIDER, MUSIC_PLAYLIST_ID } from "@/lib/music/config";
import type {
  MusicController,
  PlayerState,
  TrackInfo,
} from "@/lib/music/types";

const CONTAINER_ID = "music-iframe-container";

export default function MusicPlayer({ show }: { show: boolean }) {
  const { color } = useNavColor();
  const isWhite = color === "white";

  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [visible, setVisible] = useState(false);
  const controllerRef = useRef<MusicController | null>(null);
  const initiated = useRef(false);

  // Fade in shortly after hero completes
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, [show]);

  // Init provider and auto-play
  useEffect(() => {
    if (!visible || initiated.current) return;
    initiated.current = true;

    (async () => {
      let controller: MusicController;
      if (MUSIC_PROVIDER === "spotify") {
        const { spotifyController } = await import("@/lib/music/spotify");
        controller = spotifyController;
      } else {
        const { youtubeController } = await import("@/lib/music/youtube");
        controller = youtubeController;
      }

      controllerRef.current = controller;

      controller.init(CONTAINER_ID, MUSIC_PLAYLIST_ID, (state, trackInfo) => {
        setPlayerState(state);
        if (trackInfo) setTrack(trackInfo);
      });
    })();

    return () => {
      controllerRef.current?.destroy();
    };
  }, [visible]);

  const togglePlay = () => {
    if (playerState === "playing" || playerState === "loading") {
      controllerRef.current?.pause();
    } else {
      controllerRef.current?.play();
    }
  };

  if (!show) return null;

  const isPlaying = playerState === "playing" || playerState === "loading";
  const col = isWhite ? "white" : "black";

  // Spotify embed has no skip API and no track metadata — show play/pause only.
  const supportsSkip = MUSIC_PROVIDER === "youtube";

  const PlayIcon = ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 15 15" fill={col}>
      <polygon points="1,0.5 14,7.5 1,14.5" />
    </svg>
  );
  const PauseIcon = ({ size = 15 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 15 15" fill={col}>
      <rect x="1" y="0.5" width="4" height="14" rx="1" />
      <rect x="10" y="0.5" width="4" height="14" rx="1" />
    </svg>
  );

  const playMusicButton = (
    <button
      onClick={togglePlay}
      className="flex items-center gap-2 group"
      aria-label="Play music"
    >
      <span
        className="text-xs font-bold uppercase tracking-widest"
        style={{ color: col }}
      >
        Play Music
      </span>
      <PlayIcon size={22} />
    </button>
  );

  const nowPlaying = track?.title ? (
    <div className="leading-tight">
      <p className="text-[10px] font-semibold uppercase tracking-widest opacity-60">
        Now Playing
      </p>
      <p className="text-xs font-semibold max-w-[150px] truncate">
        {track.title}
      </p>
      {track.artist && (
        <p className="text-[10px] opacity-60 max-w-[150px] truncate">
          {track.artist}
        </p>
      )}
    </div>
  ) : null;

  const controlPill = (
    <div
      className="flex items-center gap-4 rounded-full px-4 py-1.5"
      style={{ border: `1.5px solid ${col}` }}
    >
      {/* Previous */}
      <button
        onClick={() => controllerRef.current?.prev()}
        aria-label="Previous"
        className="opacity-75 hover:opacity-100 transition-opacity"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill={col}>
          <rect x="0" y="0.5" width="2" height="14" rx="1" />
          <polygon points="13,0.5 3,7.5 13,14.5" />
        </svg>
      </button>

      {/* Pause */}
      <button
        onClick={togglePlay}
        aria-label="Pause"
        className="opacity-75 hover:opacity-100 transition-opacity"
      >
        <PauseIcon />
      </button>

      {/* Next */}
      <button
        onClick={() => controllerRef.current?.next()}
        aria-label="Next"
        className="opacity-75 hover:opacity-100 transition-opacity"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill={col}>
          <polygon points="2,0.5 12,7.5 2,14.5" />
          <rect x="13" y="0.5" width="2" height="14" rx="1" />
        </svg>
      </button>
    </div>
  );

  return (
    <div
      className="flex items-center justify-between w-full transition-opacity duration-700"
      style={{ opacity: visible ? 1 : 0, color: col }}
    >
      {/* Hidden iframe — Spotify / YouTube embeds render here */}
      <div id={CONTAINER_ID} className="sr-only" aria-hidden />

      {!isPlaying ? (
        // Idle or paused — only the Play Music button
        playMusicButton
      ) : supportsSkip ? (
        // Playing (YouTube) — Now Playing (if any) + skip controls
        <>
          {nowPlaying ?? <span />}
          {controlPill}
        </>
      ) : (
        // Playing (Spotify, no skip / no metadata) — Pause toggle only
        <button
          onClick={togglePlay}
          className="flex items-center gap-2 group"
          aria-label="Pause music"
        >
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: col }}
          >
            Pause Music
          </span>
          <PauseIcon size={22} />
        </button>
      )}
    </div>
  );
}
