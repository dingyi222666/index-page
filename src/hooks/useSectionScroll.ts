import { useEffect, useRef, type RefObject } from "react";

const WHEEL_THRESHOLD = 40;
const WHEEL_IDLE_DELAY = 180;

export function useSectionScroll(scrollRef: RefObject<HTMLDivElement | null>) {
  const animationRef = useRef<number | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const wheelDeltaRef = useRef(0);
  const wheelHandledRef = useRef(false);
  const wheelIdleTimerRef = useRef<number | null>(null);

  const scrollToPosition = (end: number) => {
    const container = scrollRef.current;
    if (!container) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const start = container.scrollTop;
    const distance = end - start;
    if (Math.abs(distance) < 1) return;

    const duration = 520;
    const startedAt = performance.now();
    const previousSnapType = container.style.scrollSnapType;

    container.style.scrollSnapType = "none";

    const animateScroll = (now: number) => {
      const elapsed = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - elapsed, 3);

      container.scrollTop = start + distance * eased;

      if (elapsed < 1) {
        animationRef.current = requestAnimationFrame(animateScroll);
        return;
      }

      container.scrollTop = end;
      container.style.scrollSnapType = previousSnapType;
      animationRef.current = null;
    };

    animationRef.current = requestAnimationFrame(animateScroll);
  };

  const getNearestSectionIndex = () => {
    const container = scrollRef.current;
    if (!container) return 0;

    const sections = [...container.querySelectorAll<HTMLElement>("section")];
    return sections.reduce<number>((nearest, section, index) => {
      const nearestDistance = Math.abs(
        sections[nearest].offsetTop - container.scrollTop,
      );
      const sectionDistance = Math.abs(section.offsetTop - container.scrollTop);
      return sectionDistance < nearestDistance ? index : nearest;
    }, 0);
  };

  const scrollToSection = (direction: 1 | -1) => {
    const container = scrollRef.current;
    if (!container) return;

    const sections = [...container.querySelectorAll<HTMLElement>("section")];
    const currentIndex = targetIndexRef.current ?? getNearestSectionIndex();
    const targetIndex = Math.min(
      Math.max(currentIndex + direction, 0),
      sections.length - 1,
    );

    targetIndexRef.current = targetIndex;
    scrollToPosition(sections[targetIndex].offsetTop);
  };

  const scrollToElementId = (id: string) => {
    const target = document.getElementById(id);
    if (!target) return;

    scrollToPosition(target.offsetTop);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const isMacOS = /Macintosh|Mac OS X/.test(navigator.userAgent);

    const handleWheel = (event: WheelEvent) => {
      if (
        event.ctrlKey ||
        event.deltaY === 0 ||
        Math.abs(event.deltaX) >= Math.abs(event.deltaY)
      ) {
        return;
      }

      event.preventDefault();

      if (wheelIdleTimerRef.current !== null) {
        window.clearTimeout(wheelIdleTimerRef.current);
      }
      wheelIdleTimerRef.current = window.setTimeout(() => {
        wheelDeltaRef.current = 0;
        wheelHandledRef.current = false;
        wheelIdleTimerRef.current = null;
      }, WHEEL_IDLE_DELAY);

      if (wheelHandledRef.current) {
        return;
      }

      const deltaMultiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? container.clientHeight
            : 1;
      const delta = event.deltaY * deltaMultiplier;

      if (
        wheelDeltaRef.current !== 0 &&
        Math.sign(wheelDeltaRef.current) !== Math.sign(delta)
      ) {
        wheelDeltaRef.current = 0;
      }
      wheelDeltaRef.current += delta;

      if (Math.abs(wheelDeltaRef.current) < WHEEL_THRESHOLD) {
        return;
      }

      wheelHandledRef.current = true;
      scrollToSection(wheelDeltaRef.current > 0 ? 1 : -1);
    };

    if (!isMacOS) {
      container.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (wheelIdleTimerRef.current !== null) {
        window.clearTimeout(wheelIdleTimerRef.current);
      }
    };
  }, []);

  return { scrollToElementId };
}
