"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation";

export default function NavigationWrapper() {
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  return <Navigation variant={isHomepage ? "homepage" : "default"} />;
}

