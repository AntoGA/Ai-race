"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true; // автовоспроизведение разрешено только без звука

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src; // нативный HLS (iOS)
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }

    video.play().catch(() => {});
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      poster={poster}
      className="w-full aspect-video bg-black rounded-xl"
    />
  );
}
