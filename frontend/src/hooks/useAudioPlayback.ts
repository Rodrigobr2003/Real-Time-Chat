import { useCallback, useEffect, useRef, useState } from "react";

export const useAudioPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const release = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;

    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  }, []);

  const stop = useCallback(() => {
    release();
    setIsPlaying(false);
  }, [release]);

  const play = useCallback(
    async (blob: Blob | null) => {
      release();

      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      urlRef.current = url;
      audioRef.current = audio;
      audio.onended = stop;
      audio.onerror = stop;

      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        stop();
      }
    },
    [release, stop],
  );

  useEffect(() => release, [release]);

  return { isPlaying, play, stop };
};
