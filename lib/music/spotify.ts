/**
 * Spotify Embed Controller integration.
 *
 * Set in .env.local:
 *   NEXT_PUBLIC_MUSIC_PROVIDER=spotify
 *   NEXT_PUBLIC_MUSIC_PLAYLIST_ID=4JWR3EGag21592DJWqR9Eb
 *
 * Free accounts: 30-second previews, shuffle only.
 * Premium accounts: full tracks, ordered playback.
 * No user login required on your site.
 */

import type { MusicController, PlayerState, TrackInfo } from "./types";

type SpotifyController = {
  play(): void;
  pause(): void;
  nextTrack(): void;
  previousTrack(): void;
  addListener(event: string, cb: (data: unknown) => void): void;
  destroy(): void;
};

let controller: SpotifyController | null = null;
let cb: ((state: PlayerState, track: TrackInfo | null) => void) | null = null;

export const spotifyController: MusicController = {
  init(containerId, playlistId, onUpdate) {
    cb = onUpdate;

    const setup = (
      IFrameAPI: {
        createController(
          el: HTMLElement,
          opts: Record<string, unknown>,
          callback: (c: SpotifyController) => void,
        ): void;
      },
    ) => {
      const el = document.getElementById(containerId);
      if (!el) return;

      IFrameAPI.createController(
        el,
        { uri: `spotify:playlist:${playlistId}`, width: "1", height: "1" },
        (ctrl) => {
          controller = ctrl;

          ctrl.addListener("playback_update", (raw) => {
            const d = raw as { isPaused?: boolean };
            if (d.isPaused === false) {
              cb?.("playing", null);
            } else if (d.isPaused === true) {
              cb?.("paused", null);
            }
          });

          // Signal ready — do NOT auto-play.
          // Spotify requires a user gesture, and we want the "Play Music"
          // button shown until the guest taps it.
          cb?.("idle", null);
        },
      );
    };

    const win = window as unknown as Record<string, unknown>;
    if (win.SpotifyIframeApi) {
      setup(win.SpotifyIframeApi as Parameters<typeof setup>[0]);
      return;
    }

    win.onSpotifyIframeApiReady = setup;

    const existing = document.querySelector(
      'script[src*="spotify.com/embed/iframe-api"]',
    );
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://open.spotify.com/embed/iframe-api/v1";
      script.async = true;
      document.head.appendChild(script);
    }
  },

  play() { controller?.play(); },
  pause() { controller?.pause(); },
  next() { controller?.nextTrack(); },
  prev() { controller?.previousTrack(); },

  destroy() {
    controller?.destroy();
    controller = null;
    cb = null;
  },
};
