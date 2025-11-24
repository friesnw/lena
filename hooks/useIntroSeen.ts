"use client";

import { useCallback, useEffect, useState } from "react";

const INTRO_STORAGE_KEY = "lenaIntroSeen";

export function useIntroSeen() {
  const [hasSeenIntro, setHasSeenIntro] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedValue = window.localStorage.getItem(INTRO_STORAGE_KEY);
      setHasSeenIntro(storedValue === "true");
    } catch (err) {
      console.warn("Failed to read intro flag:", err);
      setHasSeenIntro(false);
    }
  }, []);

  const markIntroSeen = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, "true");
      setHasSeenIntro(true);
    } catch (err) {
      console.warn("Failed to set intro flag:", err);
    }
  }, []);

  return { hasSeenIntro, markIntroSeen };
}

