import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getProfileInitial,
  getVariantSrc,
  isFinalVariant,
  isMemorySufficient,
  isNetworkGoodForUpgrade,
  nextVariantInLadder,
} from '../utils/imageVariants';
import { getFileUrl } from '../utils/fileUrl';
import { scheduleImageUpgrade } from '../utils/progressiveImageQueue';

const DWELL_VISIBLE_MS = 200;
const CHAIN_GAP_MS = 150;
const BACKGROUND_POLL_MS = 2500;
const FADE_MS = 500;

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Progressive image: small first, chains to HD, crossfades between variant steps.
 */
export function useProgressiveImage({
  originalUrl,
  project = null,
  profile = 'feedCard',
  priority = 2,
  paused = false,
  enabled = true,
}) {
  const containerRef = useRef(null);
  const visibleRef = useRef(false);
  const dwellTimerRef = useRef(null);
  const chainTimerRef = useRef(null);
  const currentTypeRef = useRef(null);
  const tryUpgradeRef = useRef(null);
  const fadeTimerRef = useRef(null);
  const pendingTypeRef = useRef(null);

  const initialType = getProfileInitial(profile);

  const [baseSrc, setBaseSrc] = useState(() =>
    originalUrl && enabled ? getVariantSrc(originalUrl, initialType, project) : null
  );
  const [overlaySrc, setOverlaySrc] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [variantType, setVariantType] = useState(initialType);

  const scheduleChain = useCallback((delayMs = CHAIN_GAP_MS) => {
    if (chainTimerRef.current) clearTimeout(chainTimerRef.current);
    chainTimerRef.current = setTimeout(() => {
      chainTimerRef.current = null;
      tryUpgradeRef.current?.();
    }, delayMs);
  }, []);

  const commitOverlay = useCallback(() => {
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    setOverlaySrc((pending) => {
      if (pending) setBaseSrc(pending);
      return null;
    });
    setOverlayVisible(false);
  }, []);

  const finalizeReveal = useCallback(() => {
    const nextType = pendingTypeRef.current;
    if (!nextType) return;

    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }

    currentTypeRef.current = nextType;
    setVariantType(nextType);
    pendingTypeRef.current = null;
    commitOverlay();
    if (!isFinalVariant(nextType)) scheduleChain();
  }, [scheduleChain, commitOverlay]);

  const revealOverlay = useCallback((nextSrc, nextType) => {
    pendingTypeRef.current = nextType;

    if (prefersReducedMotion()) {
      currentTypeRef.current = nextType;
      setVariantType(nextType);
      setBaseSrc(nextSrc);
      setOverlaySrc(null);
      setOverlayVisible(false);
      pendingTypeRef.current = null;
      if (!isFinalVariant(nextType)) scheduleChain();
      return;
    }

    setOverlaySrc(nextSrc);
    setOverlayVisible(false);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOverlayVisible(true));
    });

    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(finalizeReveal, FADE_MS + 60);
  }, [scheduleChain, finalizeReveal]);

  const applyUpgrade = useCallback(
    (nextType, upgradePriority) => {
      if (!originalUrl || !nextType || nextType === currentTypeRef.current) return;
      const nextSrc = getVariantSrc(originalUrl, nextType, project);
      if (!nextSrc) return;

      scheduleImageUpgrade(() => {
        const img = new Image();
        img.onload = () => {
          revealOverlay(nextSrc, nextType);
        };
        img.onerror = () => {
          if (!isFinalVariant(nextType)) scheduleChain(CHAIN_GAP_MS * 2);
        };
        img.src = nextSrc;
      }, upgradePriority);
    },
    [originalUrl, project, revealOverlay, scheduleChain]
  );

  const tryUpgrade = useCallback(() => {
    if (!enabled || !originalUrl || paused) return;
    if (!isNetworkGoodForUpgrade() || !isMemorySufficient()) return;
    if (overlaySrc) return;

    const current = currentTypeRef.current || variantType;
    if (isFinalVariant(current)) return;

    const next = nextVariantInLadder(current, profile);
    if (!next) return;

    const upgradePriority = visibleRef.current ? priority : Math.min(priority + 2, 4);
    applyUpgrade(next, upgradePriority);
  }, [
    enabled,
    originalUrl,
    paused,
    overlaySrc,
    overlayVisible,
    variantType,
    profile,
    priority,
    applyUpgrade,
  ]);

  tryUpgradeRef.current = tryUpgrade;

  useEffect(() => {
    if (!originalUrl || !enabled) {
      setBaseSrc(null);
      setOverlaySrc(null);
      setOverlayVisible(false);
      return;
    }
    const init = getProfileInitial(profile);
    currentTypeRef.current = init;
    pendingTypeRef.current = null;
    setVariantType(init);
    setBaseSrc(getVariantSrc(originalUrl, init, project));
    setOverlaySrc(null);
    setOverlayVisible(false);
  }, [originalUrl, project?.id, profile, enabled]);

  // Lightbox is always "visible" — start upgrading immediately (no scroll intersection wait).
  useEffect(() => {
    if (profile !== 'lightbox' || !enabled || !originalUrl) return undefined;
    visibleRef.current = true;
    const kick = setTimeout(() => tryUpgradeRef.current?.(), 0);
    const chain = setInterval(() => {
      if (isFinalVariant(currentTypeRef.current)) return;
      tryUpgradeRef.current?.();
    }, 400);
    return () => {
      clearTimeout(kick);
      clearInterval(chain);
    };
  }, [originalUrl, profile, enabled]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled || !originalUrl) return undefined;
    if (profile === 'lightbox') {
      visibleRef.current = true;
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          visibleRef.current = true;
          if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
          dwellTimerRef.current = setTimeout(() => {
            tryUpgradeRef.current?.();
          }, DWELL_VISIBLE_MS);
        } else {
          visibleRef.current = false;
          if (dwellTimerRef.current) {
            clearTimeout(dwellTimerRef.current);
            dwellTimerRef.current = null;
          }
        }
      },
      { rootMargin: '0px 0px 20% 0px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    };
  }, [originalUrl, enabled]);

  useEffect(() => {
    if (!enabled || !originalUrl) return undefined;

    const poll = setInterval(() => {
      const current = currentTypeRef.current || variantType;
      if (isFinalVariant(current)) return;
      if (!isNetworkGoodForUpgrade() || !isMemorySufficient()) return;
      scheduleImageUpgrade(() => tryUpgradeRef.current?.(), 4);
    }, BACKGROUND_POLL_MS);

    return () => clearInterval(poll);
  }, [originalUrl, enabled, variantType]);

  useEffect(
    () => () => {
      if (chainTimerRef.current) clearTimeout(chainTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    },
    []
  );

  const onOverlayTransitionEnd = useCallback(
    (e) => {
      if (e.propertyName !== 'opacity') return;
      if (!overlayVisible || !overlaySrc) return;
      finalizeReveal();
    },
    [overlayVisible, overlaySrc, finalizeReveal]
  );

  const onMouseEnter = useCallback(() => {
    tryUpgradeRef.current?.();
  }, []);

  return {
    containerRef,
    baseSrc,
    overlaySrc,
    overlayVisible,
    onOverlayTransitionEnd,
    variantType,
    onMouseEnter,
  };
};
