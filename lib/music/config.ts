/**
 * Music provider config — set in .env.local:
 *
 *   NEXT_PUBLIC_MUSIC_PROVIDER=youtube
 *   NEXT_PUBLIC_MUSIC_PLAYLIST_ID=PLxxxxxxxxxxxxxxxx
 *
 *   — or —
 *
 *   NEXT_PUBLIC_MUSIC_PROVIDER=spotify
 *   NEXT_PUBLIC_MUSIC_PLAYLIST_ID=37i9dQZF1DXxxxxxxxx
 */

export const MUSIC_PROVIDER = "youtube";
// (process.env.NEXT_PUBLIC_MUSIC_PROVIDER as "youtube" | "spotify") ??
// "youtube";

export const MUSIC_PLAYLIST_ID =
  process.env.NEXT_PUBLIC_MUSIC_PLAYLIST_ID ||
  "PLDIoUOhQQPlWm_njQtKkNIk5RYSGgzomm";
