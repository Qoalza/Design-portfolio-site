"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import { galleryInputArbiter } from "../lib/gallery-input-arbiter";
import { registerScrollController } from "../lib/scroll-controller";
import { registerScrollFrameSubscriber } from "../lib/scroll-frame-coordinator";

const DESKTOP_QUERY = "(min-width: 1280px) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SmoothScrollEnabledContext = createContext(false);

function RootLenisRegistration() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    galleryInputArbiter.setStopRootAtActual(() => {
      lenis.scrollTo(lenis.actualScroll, { immediate: true, force: true });
    });

    const unregisterFrame = registerScrollFrameSubscriber({
      id: "root-lenis",
      priority: 10,
      continuous: true,
      update: (timestamp) => lenis.raf(timestamp),
    });
    const unregisterController = registerScrollController("root", {
      scrollTo: (target, options = {}) => {
        lenis.scrollTo(target, {
          offset: options.offset,
          immediate: options.immediate,
          force: true,
          onComplete: options.onComplete,
        });
      },
      cancel: () => {
        lenis.scrollTo(lenis.actualScroll, { immediate: true, force: true });
      },
      stop: () => lenis.stop(),
      start: () => lenis.start(),
    });

    return () => {
      galleryInputArbiter.setStopRootAtActual(undefined);
      galleryInputArbiter.reset();
      unregisterController();
      unregisterFrame();
    };
  }, [lenis]);

  return null;
}

export function useDesktopSmoothScrollEnabled(): boolean {
  return useContext(SmoothScrollEnabledContext);
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setEnabled(desktop.matches && !reducedMotion.matches);

    update();
    desktop.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (enabled) document.documentElement.dataset.lenisEnabled = "true";
    else delete document.documentElement.dataset.lenisEnabled;
    return () => { delete document.documentElement.dataset.lenisEnabled; };
  }, [enabled]);

  return (
    <SmoothScrollEnabledContext.Provider value={enabled}>
      {enabled ? (
        <ReactLenis
          root
          options={{
            autoRaf: false,
            smoothWheel: true,
            syncTouch: false,
            lerp: 0.1,
            wheelMultiplier: 1,
            stopInertiaOnNavigate: true,
            virtualScroll: (data) => {
              const target = data.event.target;
              const viewport = target instanceof Element
                ? target.closest<HTMLElement>("[data-gallery-viewport][data-gallery-arbiter-active='true']")
                : null;
              if (!viewport || !(data.event instanceof WheelEvent)) return true;

              const owner = viewport.dataset.galleryArbiterOwner;
              if (!owner) return true;
              const decision = galleryInputArbiter.classify(data.event, owner);
              if (decision.blockRoot) return false;
              const rootDeltaY = galleryInputArbiter.takeRootDelta(data.event);
              if (rootDeltaY !== null) data.deltaY = rootDeltaY;
              return true;
            },
          }}
        >
          <RootLenisRegistration />
        </ReactLenis>
      ) : null}
      {children}
    </SmoothScrollEnabledContext.Provider>
  );
}
