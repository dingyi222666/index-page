import { useEffect, useRef, type RefObject } from "react";

export function useSectionScroll(scrollRef: RefObject<HTMLDivElement | null>) {
  const animationRef = useRef<number | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const scrollDirectionRef = useRef<1 | -1 | null>(null);

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
      scrollDirectionRef.current = null;
    };

    animationRef.current = requestAnimationFrame(animateScroll);
  };

  const getNearestSectionIndex = () => {
    const container = scrollRef.current;
    if (!container) return 0;

    const sections = Array.from(container.querySelectorAll("section"));
    return sections.reduce((nearest, section, index) => {
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

    const sections = Array.from(container.querySelectorAll("section"));
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

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaY) < 8) return;

      event.preventDefault();
      const direction = event.deltaY > 0 ? 1 : -1;
      if (animationRef.current && scrollDirectionRef.current === direction) {
        return;
      }

      scrollDirectionRef.current = direction;
      scrollToSection(direction);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return { scrollToElementId };
}
