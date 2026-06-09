import type { MusicController, PlayerState, TrackInfo } from "./types";

let player: YT.Player | null = null;
let onUpdate: ((state: PlayerState, track: TrackInfo | null) => void) | null =
  null;

export const youtubeController: MusicController = {
  init(containerId, playlistId, cb) {
    onUpdate = cb;

    const create = () => createPlayer(containerId, playlistId);

    const win = window as unknown as Record<string, unknown>;
    // API already loaded and ready
    if (win.YT && (win.YT as { Player?: unknown }).Player) {
      create();
      return;
    }

    // Load the IFrame API once
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    win.onYouTubeIframeAPIReady = create;
  },

  play() {
    if (typeof player?.playVideo === "function") player.playVideo();
  },
  pause() {
    if (typeof player?.pauseVideo === "function") player.pauseVideo();
  },
  next() {
    if (typeof player?.nextVideo === "function") player.nextVideo();
  },
  prev() {
    if (typeof player?.previousVideo === "function") player.previousVideo();
  },

  destroy() {
    player?.destroy();
    player = null;
    onUpdate = null;
  },
};

function emitTrack(state: PlayerState) {
  const data = player?.getVideoData?.();
  const rawTitle = data?.title ?? "";
  const author = data?.author ?? "";

  let track: TrackInfo | null = null;
  if (rawTitle) {
    // YouTube titles are often "Artist - Song"; prefer that split,
    // otherwise fall back to channel name as the artist.
    if (rawTitle.includes(" - ")) {
      const [artist, ...rest] = rawTitle.split(" - ");
      track = { artist: artist.trim(), title: rest.join(" - ").trim() };
    } else {
      track = { title: rawTitle, artist: author || undefined };
    }
  }
  onUpdate?.(state, track);
}

function createPlayer(containerId: string, playlistId: string) {
  if (!playlistId) {
    console.error(
      "[music] No playlist ID — set NEXT_PUBLIC_MUSIC_PLAYLIST_ID in .env.local and restart the dev server.",
    );
  }

  player = new YT.Player(containerId, {
    height: "1",
    width: "1",
    playerVars: {
      autoplay: 0,
      controls: 0,
      playsinline: 1,
    },
    events: {
      onReady() {
        // Hide the iframe but keep it in the layout so playback is allowed.
        const iframe = player?.getIframe();
        if (iframe) {
          iframe.style.cssText =
            "position:fixed;bottom:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0;";
        }
        // Explicitly cue the playlist — more reliable than playerVars.list.
        player?.cuePlaylist({ listType: "playlist", list: playlistId });
        onUpdate?.("idle", null);
      },
      onStateChange(e) {
        const { PLAYING, PAUSED, BUFFERING, ENDED } = YT.PlayerState;
        if (e.data === PLAYING) {
          emitTrack("playing");
        } else if (e.data === BUFFERING) {
          emitTrack("loading");
        } else if (e.data === PAUSED) {
          onUpdate?.("paused", null);
        } else if (e.data === ENDED) {
          onUpdate?.("idle", null);
        }
      },
    },
  });
}
