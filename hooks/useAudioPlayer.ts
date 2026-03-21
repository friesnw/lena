"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const audioRegistry = new Set<HTMLAudioElement>();

const FADE_DURATION_MS = 2000;

export function useAudioPlayer(fadeOutAt?: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fadeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Fade-out logic
  useEffect(() => {
    const element = audioRef.current;
    if (!element || fadeOutAt == null) return;

    const handleTimeUpdate = () => {
      if (
        element.currentTime >= fadeOutAt &&
        !element.paused &&
        fadeIntervalRef.current == null
      ) {
        const startVolume = element.volume;
        const steps = 20;
        const stepInterval = FADE_DURATION_MS / steps;
        const volumeStep = startVolume / steps;

        fadeIntervalRef.current = setInterval(() => {
          if (element.volume > volumeStep) {
            element.volume = Math.max(0, element.volume - volumeStep);
          } else {
            element.volume = 0;
            element.pause();
            element.volume = startVolume;
            if (fadeIntervalRef.current != null) {
              clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
            }
          }
        }, stepInterval);
      }
    };

    element.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      element.removeEventListener("timeupdate", handleTimeUpdate);
      if (fadeIntervalRef.current != null) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    };
  }, [fadeOutAt]);

  const togglePlay = useCallback(() => {
    const element = audioRef.current;
    if (!element) return;
    // Cancel any in-progress fade if user manually resumes
    if (fadeIntervalRef.current != null) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
      element.volume = 1;
    }
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
