"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation";

export default function NavigationWrapper() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const isLoginPage = pathname === "/login";
  const isIntroPage = pathname === "/intro";

  // Don't show navigation on login or intro pages
  if (isLoginPage || isIntroPage) {
    return null;
  }

  return <Navigation variant={isHomepage ? "homepage" : "default"} />;
}
