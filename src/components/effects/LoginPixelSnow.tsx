"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const PixelSnow = dynamic(() => import("./PixelSnow"), {
  ssr: false,
  loading: () => null,
});

export function LoginPixelSnow() {
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (!desktop.matches || reducedMotion.matches) {
        setColor(null);
        return;
      }
      const story = document.querySelector(".login-story");
      const token = story && getComputedStyle(story).getPropertyValue("--login-particle-color").trim();
      setColor(token || null);
    };

    update();
    desktop.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  if (!color) return null;

  return (
    <div className="login-particles" aria-hidden="true">
      <PixelSnow
        color={color}
        variant="square"
        density={0.055}
        speed={0.25}
        flakeSize={0.002}
        minFlakeSize={1}
        pixelResolution={260}
        direction={120}
        brightness={0.7}
      />
    </div>
  );
}
