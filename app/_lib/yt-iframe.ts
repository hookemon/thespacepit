// Shared types + loader for the YouTube IFrame Player API.
// Both /radio (RadioClient) and /tv (TVClient) embed YouTube videos and need
// the same global Window.YT declaration. Declaring it twice causes
// TS2717 "Subsequent property declarations must have the same type" — so
// they import from this single source.

export type YTPlayer = {
  loadVideoById: (id: string) => void;
  destroy: () => void;
  playVideo?: () => void;
  pauseVideo?: () => void;
};

export type YTApi = {
  Player: new (
    el: HTMLElement,
    opts: {
      height?: string;
      width?: string;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (e: { target: YTPlayer }) => void;
        onStateChange?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytReadyPromise: Promise<YTApi> | null = null;

export function loadYouTubeAPI(): Promise<YTApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("server"));
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytReadyPromise) return ytReadyPromise;
  ytReadyPromise = new Promise<YTApi>((resolve) => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT?.Player) resolve(window.YT);
    };
  });
  return ytReadyPromise;
}
