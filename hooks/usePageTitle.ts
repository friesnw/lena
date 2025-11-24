"use client";

import { useEffect } from "react";

const BASE_TITLE = "Letters for Lena";

/**
 * Syncs the browser tab title with the supplied page title (usually the on-page H1).
 * Falls back to the base site title when a value is not provided.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const nextTitle = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
    document.title = nextTitle;
  }, [title]);
}


