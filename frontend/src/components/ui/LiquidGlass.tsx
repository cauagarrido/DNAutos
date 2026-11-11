import { useEffect, useRef, type HTMLAttributes } from "react";

/** Pointer lighting updates CSS variables without re-rendering React or changing content. */
export function useGlassLighting<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const element = ref.current;
    const enabled = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    if (!element) return;
    let frame = 0;
    const move = (event: PointerEvent) => {
      if (!enabled.matches) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const bounds = element.getBoundingClientRect();
        element.style.setProperty(
          "--glass-x",
          `${((event.clientX - bounds.left) / bounds.width) * 100}%`,
        );
        element.style.setProperty(
          "--glass-y",
          `${((event.clientY - bounds.top) / bounds.height) * 100}%`,
        );
      });
    };
    const reset = () => {
      window.cancelAnimationFrame(frame);
      element.style.removeProperty("--glass-x");
      element.style.removeProperty("--glass-y");
    };
    element.addEventListener("pointermove", move, { passive: true });
    element.addEventListener("pointerleave", reset);
    enabled.addEventListener("change", reset);
    return () => {
      reset();
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", reset);
      enabled.removeEventListener("change", reset);
    };
  }, []);
  return ref;
}

export function LiquidGlass({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const ref = useGlassLighting<HTMLDivElement>();
  return (
    <div ref={ref} className={`liquid-glass ${className}`} {...props}>
      {children}
    </div>
  );
}

export function GlassEffects() {
  return (
    <svg
      className="glass-effects"
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
    >
      <defs>
        <filter
          id="liquid-refraction"
          x="-10%"
          y="-10%"
          width="120%"
          height="120%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.018"
            numOctaves="2"
            seed="8"
            result="glass-map"
          />
          <feGaussianBlur in="glass-map" stdDeviation="1" result="soft-map" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft-map"
            scale="10"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
