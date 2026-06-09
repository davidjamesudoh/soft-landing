export type PlayerState = "idle" | "loading" | "playing" | "paused";

export type TrackInfo = {
  title: string;
  artist?: string;
};

export interface MusicController {
  init(
    containerId: string,
    playlistId: string,
    onUpdate: (state: PlayerState, track: TrackInfo | null) => void,
  ): void;
  play(): void;
  pause(): void;
  next(): void;
  prev(): void;
  destroy(): void;
}
