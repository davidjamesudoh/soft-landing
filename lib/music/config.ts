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

export const MUSIC_PROVIDER: "youtube" | "spotify" = "youtube";
// To switch providers, change the line above to "spotify"
// (or wire it back to process.env.NEXT_PUBLIC_MUSIC_PROVIDER).

export const MUSIC_PLAYLIST_ID =
  process.env.NEXT_PUBLIC_MUSIC_PLAYLIST_ID ||
  // TEST playlist (NoCopyrightSounds — guaranteed embeddable). Swap for the
  // real one once you confirm the chosen songs allow embedding.
  "PLRBp0Fe2GpgnIh0AiYKh7o7HnYAej-5ph";
