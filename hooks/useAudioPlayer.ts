"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const audioRegistry = new Set<HTMLAudioElement>();

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Register / unregister the element
  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    audioRegistry.add(element);
    return () => {
      audioRegistry.delete(element);
    };
  }, []);

  // Handle play / pause events
  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;

    const handlePlay = () => {
      audioRegistry.forEach((audioEl) => {
        if (audioEl !== element) {
          audioEl.pause();
        }
      });
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    element.addEventListener("play", handlePlay);
    element.addEventListener("pause", handlePause);
    element.addEventListener("ended", handleEnded);

    return () => {
      element.removeEventListener("play", handlePlay);
      element.removeEventListener("pause", handlePause);
      element.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const element = audioRef.current;
    if (!element) return;
    if (element.paused) {
      void element.play();
    } else {
      element.pause();
    }
  }, []);

  const play = useCallback(() => {
    const element = audioRef.current;
    if (!element) return;
    void element.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  return {
    audioRef,
    isPlaying,
    togglePlay,
    play,
    pause,
  };
}
