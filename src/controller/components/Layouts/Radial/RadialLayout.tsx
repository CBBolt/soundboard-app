import { useEffect, useState } from "react";
import RadialControl from "./RadialControl";
import RadialSound from "./RadialSound";

type RadialLayoutProps = {
  settings: Settings;
  sounds: (Sound | null)[];
  hexagon?: boolean;
};

export default function RadialLayout({
  settings,
  sounds,
  hexagon = false,
}: RadialLayoutProps) {
  const MAX_RING_SIZE = hexagon ? 6 : 8;
  const [ring, setRing] = useState(0);

  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const maxRing = Math.max(0, Math.ceil(sounds.length / MAX_RING_SIZE) - 1);

    setRing((current) => Math.min(current, maxRing));
  }, [sounds.length]);

  const ringCount = Math.max(1, Math.ceil(sounds.length / MAX_RING_SIZE));

  const visibleSounds = sounds.slice(
    ring * MAX_RING_SIZE,
    (ring + 1) * MAX_RING_SIZE,
  );

  // Layout sizing
  const viewportSize = Math.min(viewport.width, viewport.height);

  const controlSize = viewportSize * 0.35;
  const controlRadius = controlSize / 2;

  const soundSize = Math.max(24, controlSize * 0.22);

  const orbitRadius = controlRadius + soundSize * 2;

  return (
    <>
      <RadialControl
        settings={settings}
        size={controlSize}
        ring={{ count: ringCount, cur: ring }}
        onPrev={() => setRing((r) => r - 1)}
        onNext={() => setRing((r) => r + 1)}
        hexagon={hexagon}
      />

      {visibleSounds.map((sound, index) => {
        const angle = (index / visibleSounds.length) * Math.PI * 2;

        const x = Math.cos(angle) * orbitRadius;

        const y = Math.sin(angle) * orbitRadius;

        return (
          <RadialSound
            key={sound?.id ?? index}
            sound={sound}
            x={x}
            y={y}
            size={soundSize}
            hexagon={hexagon}
          />
        );
      })}
    </>
  );
}
