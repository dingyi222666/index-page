import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Lock,
  Mail,
  Maximize2,
  Menu,
  Moon,
  NotebookPen,
  Sun,
  X,
} from "lucide-react";
import {
  SiGithub,
  SiX,
  SiNeteasecloudmusic,
  SiBilibili,
  SiTelegram,
  SiOsu,
} from "@icons-pack/react-simple-icons";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import siteData from "../data.json";
import { layoutWall, type WallSlot } from "../lib/wall";

const iconMap: Record<string, any> = {
  SiGithub,
  SiX,
  SiNeteasecloudmusic,
  SiBilibili,
  SiTelegram,
  SiOsu,
  NotebookPen,
  Mail,
};

const STAGES = [
  { id: "index", num: "00", label: "Index" },
  { id: "projects", num: "01", label: "Projects" },
  { id: "games", num: "02", label: "Games" },
  { id: "profile", num: "03", label: "Profile" },
  { id: "contact", num: "04", label: "Contact" },
] as const;

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/_#@*+-=";

/** Monospace text that decodes itself with a brief character scramble on hover. */
function ScrambleText({
  text,
  active,
  className = "",
}: {
  text: string;
  active: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!active) {
      setDisplay(text);
      return;
    }

    let frame = 0;
    const totalFrames = 12;
    const interval = window.setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      const resolvedCount = Math.floor(progress * text.length);
      const next = text
        .split("")
        .map((ch, idx) => {
          if (ch === " " || idx < resolvedCount) return ch;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join("");
      setDisplay(next);

      if (frame >= totalFrames) {
        window.clearInterval(interval);
        setDisplay(text);
      }
    }, 22);

    return () => window.clearInterval(interval);
  }, [active, text]);

  return <span className={className}>{display}</span>;
}

/** Flat colour field standing in for absent media. */
function Shot({
  src,
  alt,
  color,
  className = "",
}: {
  src: string;
  alt: string;
  color: string;
  className?: string;
}) {
  const [ok, setOk] = useState(true);
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: color }}>
      {ok ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setOk(false)}
          referrerPolicy="no-referrer"
          className="h-full w-full scale-[1.01] object-cover"
        />
      ) : null}
    </div>
  );
}

/** A project's media: still or clip, landscape or portrait. */
function Media({
  media,
  color,
  alt = "",
  className = "",
}: {
  media: { type: string; orientation: string; src: string; poster?: string };
  color: string;
  alt?: string;
  className?: string;
}) {
  const [videoOk, setVideoOk] = useState(media.type === "video" && !!media.src);

  if (videoOk) {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: color }}>
        <video
          src={media.src}
          poster={media.poster}
          muted
          loop
          playsInline
          autoPlay
          onError={() => setVideoOk(false)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <Shot
      src={media.poster || media.src}
      alt={alt}
      color={color}
      className={className}
    />
  );
}

/** Splits a headline into words, each riding up out of its own clip box. */
function Words({
  text,
  className = "",
  delay = 0,
}: {
  text: string;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((word, i) => (
        <span key={`${word}-${i}`} className="word-mask mr-[0.22em]">
          <span className="word-up" style={{ animationDelay: `${delay + i * 0.075}s` }}>
            {word}
          </span>
        </span>
      ))}
    </span>
  );
}

function useOverHero() {
  const [over, setOver] = useState(true);

  useEffect(() => {
    const hero = document.getElementById("index");
    if (!hero || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => setOver(entry.isIntersecting),
      {
        rootMargin: "-24px 0px -92% 0px",
        threshold: 0,
      },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return over;
}

function useActiveStage() {
  const [activeId, setActiveId] = useState<string>("index");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const elements = STAGES.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!elements.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-35% 0px -45% 0px",
        threshold: [0, 0.25, 0.5],
      },
    );

    elements.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return activeId;
}

function useTheme() {
  const [dark, setDark] = useState(
    () =>
      typeof window !== "undefined" &&
      (localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)),
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((v) => !v) };
}

function Ticker({
  items,
  reverse,
  className = "",
  itemClassName = "",
  speed = 26,
  activeItem,
  onSelectItem,
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
  speed?: number;
  activeItem?: string | null;
  onSelectItem?: (item: string) => void;
}) {
  const track = Array.from({ length: 8 }, () => items).flat();

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className={`marquee-track ${reverse ? "marquee-track--reverse" : ""}`}
        style={{ "--marquee-duration": `${speed}s` } as CSSProperties}
      >
        {track.map((t, i) => {
          const isSelected = activeItem === t;
          const isDimmed = activeItem && activeItem !== t;
          const InteractiveTag = onSelectItem ? "button" : "span";
          return (
            <InteractiveTag
              key={i}
              {...(onSelectItem
                ? {
                    type: "button" as const,
                    onClick: () => onSelectItem(t),
                  }
                : {})}
              className={`flex shrink-0 items-center gap-4 pr-4 transition-opacity duration-300 ${
                onSelectItem ? "cursor-pointer hover:text-sakura-deep" : ""
              } ${isDimmed ? "opacity-35" : "opacity-100"} ${itemClassName}`}
            >
              <span
                className={
                  isSelected
                    ? "text-sakura-deep"
                    : i % 2 === 1
                      ? "text-hollow"
                      : ""
                }
              >
                {t}
              </span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sakura-deep" />
            </InteractiveTag>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Curtain — live asset/font counter, then wipes up and unmounts       */
/* ------------------------------------------------------------------ */

function Preloader({ onReady }: { onReady: () => void }) {
  const [count, setCount] = useState(0);
  const [lifting, setLifting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const start = performance.now();
    const minDuration = 780;
    let assetsReady = false;

    const firstHero = siteData.hero.images[0]?.url;
    const imgPromise = new Promise<void>((resolve) => {
      if (!firstHero) {
        resolve();
        return;
      }
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = firstHero;
    });

    const fontPromise =
      typeof document !== "undefined" && "fonts" in document
        ? document.fonts.ready.then(() => undefined).catch(() => undefined)
        : Promise.resolve();

    const timeoutPromise = new Promise<void>((resolve) =>
      window.setTimeout(resolve, 1200),
    );

    Promise.race([Promise.all([imgPromise, fontPromise]), timeoutPromise]).then(() => {
      assetsReady = true;
    });

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - start;
      const timeProgress = Math.min(1, elapsed / minDuration);
      const eased = 1 - Math.pow(1 - timeProgress, 3);
      const cap = assetsReady ? 100 : 92;
      const nextCount = Math.min(cap, Math.round(eased * 100));
      setCount(nextCount);

      if (nextCount < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setLifting(true);
        onReady();
        window.setTimeout(() => {
          if (!cancelled) setDone(true);
        }, 820);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [onReady]);

  if (done) return null;

  return (
    <motion.div
      initial={{ y: "0%" }}
      animate={{ y: lifting ? "-100%" : "0%" }}
      transition={{ duration: 0.78, ease: [0.76, 0, 0.24, 1] }}
      className="pointer-events-none fixed inset-0 z-[100] flex flex-col justify-end bg-sakura p-6 text-[#141416] md:p-12"
    >
      <div className="mb-6 h-[2px] w-full overflow-hidden bg-[#141416]/15">
        <div
          className="h-full bg-[#141416] transition-[width] duration-75 ease-out"
          style={{ width: `${count}%` }}
        />
      </div>

      <div className="flex items-end justify-between gap-4">
        <p className="display text-[13vw] leading-[0.8] text-[#141416] md:text-[8.5vw]">
          dingyi222666
        </p>
        <p className="display text-[9vw] leading-[0.8] text-[#141416] md:text-[5vw]">
          {String(count).padStart(2, "0")}%
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* 00 — Title: Ken Burns + pointer parallax + anime frame HUD          */
/* ------------------------------------------------------------------ */

function Hero({ ready }: { ready: boolean }) {
  const [i, setI] = useState(0);
  const images = siteData.hero.images;
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => setI((v) => (v + 1) % images.length), 7000);
    return () => window.clearInterval(t);
  }, [images.length]);

  const slide = images[i];
  const accentColor = slide?.accent || "var(--color-sakura)";

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useSpring(mouseX, { stiffness: 90, damping: 24 });
  const parallaxY = useSpring(mouseY, { stiffness: 90, damping: 24 });

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(nx * -22);
      mouseY.set(ny * -22);
    },
    [mouseX, mouseY],
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const stageOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.45]);

  const wordBaseDelay = ready ? 0.05 : 0.95;

  return (
    <section
      id="index"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative h-[100svh] w-full overflow-hidden bg-[#141416]"
    >
      <motion.div
        style={{ scale: stageScale, opacity: stageOpacity }}
        className="relative h-full w-full origin-bottom"
      >
        {images.map((img, k) => {
          const isCurrent = k === i;
          return (
            <motion.div
              key={img.url}
              aria-hidden={!isCurrent}
              animate={{
                clipPath: isCurrent ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
              }}
              transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
              className="absolute inset-0"
            >
              <motion.img
                src={img.url}
                alt={img.title}
                style={isCurrent ? { x: parallaxX, y: parallaxY } : undefined}
                animate={{ scale: isCurrent ? 1.04 : 1.12 }}
                transition={{ duration: 6.8, ease: "easeOut" }}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "0";
                }}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141416]/85 via-[#141416]/40 to-[#141416]/55" />
            </motion.div>
          );
        })}

        {/* Hero Frame HUD Pill */}
        {slide && (
          <div className="grid-20 pointer-events-none absolute inset-x-0 top-24 z-10 md:top-28">
            <div className="grid-inner flex justify-end">
              <div
                key={`${slide.url}-${i}`}
                className="inline-flex items-center gap-3 border border-white/15 bg-[#141416]/65 px-3.5 py-2 backdrop-blur-md"
              >
                <span
                  className="h-2 w-2 rounded-full transition-colors duration-500"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="font-mono text-[11px] tracking-[0.16em] text-white uppercase">
                  {slide.title}
                </span>
                <span className="font-mono text-[10px] tracking-[0.14em] text-white/50 uppercase">
                  {slide.subtitle}
                </span>
                <span className="border-l border-white/15 pl-2.5 font-mono text-[10px] tracking-[0.18em] text-white/75">
                  {String(i + 1).padStart(2, "0")}/{String(images.length).padStart(2, "0")}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid-20 absolute inset-0 z-10 content-end pb-16 md:pb-24">
          <div className="grid-inner">
            <h1 className="display text-white" key={`${i}-${ready ? "ready" : "init"}`}>
              <span className="block text-[17vw] md:text-[11vw]">
                <Words text="Still" delay={wordBaseDelay} />
              </span>
              <span className="block text-[17vw] md:text-[11vw]">
                <Words text="Render" delay={wordBaseDelay + 0.08} />
                <span className="word-mask">
                  <span
                    className="word-up transition-colors duration-500"
                    style={{
                      animationDelay: `${wordBaseDelay + 0.16}s`,
                      color: accentColor,
                    }}
                  >
                    Frame
                  </span>
                </span>
              </span>
            </h1>

            <div className="mt-8 flex items-center gap-2">
              {images.map((img, k) => {
                const active = k === i;
                return (
                  <button
                    key={img.url}
                    type="button"
                    onClick={() => setI(k)}
                    aria-label={`Show ${img.title} (${img.subtitle})`}
                    className={`h-[3px] cursor-pointer transition-all duration-500 ${
                      active ? "w-10" : "w-4 bg-white/30 hover:bg-white/65"
                    }`}
                    style={active ? { backgroundColor: accentColor } : undefined}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 01 — Projects: clean stage, 3D magnetic cards & Full Image Modal    */
/* ------------------------------------------------------------------ */

const CONFIG = {
  seed: 20261001,
  topInset: 2.2,
  bottomInset: 4.0,
  desktopKeepOut: [
    { x0: 4, x1: 40, y0: 4.5, y1: 15.0 },
    { x0: 0, x1: 100, y0: 0, y1: 3.0 },
  ],
  phoneKeepOut: [
    { x0: 0, x1: 75, y0: 6, y1: 20 },
  ] as { x0: number; x1: number; y0: number; y1: number }[],
};

function useWallLayout(count: number) {
  const [layout, setLayout] = useState<{ slots: WallSlot[]; key: string | null }>({
    slots: [],
    key: null,
  });

  useEffect(() => {
    let lastW = 0;
    let lastH = 0;
    let timer: number | undefined;

    const build = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const narrow = w < 768;

      if (narrow && Math.abs(w - lastW) < 2 && lastW > 0 && Math.abs(h - lastH) < 120) {
        return;
      }
      lastW = w;
      lastH = h;

      const scale = narrow ? 1.85 : 1;

      const slots = layoutWall(
        siteData.projects.map((p) => ({
          portrait: p.media?.orientation === "portrait",
        })),
        {
          fieldAspect: w / h,
          topInset: CONFIG.topInset,
          bottomInset: CONFIG.bottomInset,
          keepOut: narrow ? CONFIG.phoneKeepOut : CONFIG.desktopKeepOut,
          scale,
          seed: CONFIG.seed,
        },
      );

      setLayout({ slots, key: `${w}x${h}` });
    };

    build();

    const onResize = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(build, 120);
    };

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [count]);

  return layout;
}

function WallCard({
  project,
  index,
  total,
  slot,
  progress,
  isFocused,
  isDimmed,
  onFocusChange,
  onInspect,
}: {
  project: any;
  index: number;
  total: number;
  slot: WallSlot;
  progress: MotionValue<number>;
  isFocused: boolean;
  isDimmed: boolean;
  onFocusChange: (index: number | null) => void;
  onInspect: (index: number) => void;
  key?: string;
}) {
  const start = (index / total) * 0.58;
  const end = Math.min(start + 0.28, 0.92);

  const fromX = slot.fromLeft ? "-65vw" : slot.fromRight ? "65vw" : "0vw";
  const fromY =
    !slot.fromLeft && !slot.fromRight ? (index % 2 ? "65vh" : "-65vh") : "12vh";

  const x = useTransform(progress, [start, end], [fromX, "0vw"]);
  const y = useTransform(progress, [start, end], [fromY, "0vh"]);
  const baseRotate = useTransform(progress, [start, end], [slot.rot * 2.8, slot.rot]);
  const baseScale = useTransform(progress, [start, end], [0.82, 1]);
  const opacity = useTransform(progress, [start, start + 0.08], [0, 1]);

  // 3D magnetic tilt
  const rawTiltX = useMotionValue(0);
  const rawTiltY = useMotionValue(0);
  const rotateX = useSpring(rawTiltX, { stiffness: 220, damping: 22 });
  const rotateY = useSpring(rawTiltY, { stiffness: 220, damping: 22 });

  const handlePointerMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rawTiltX.set(-py * 12);
    rawTiltY.set(px * 12);
  };

  const handlePointerLeave = () => {
    rawTiltX.set(0);
    rawTiltY.set(0);
    onFocusChange(null);
  };

  const orientation = project.media?.orientation ?? "landscape";
  const portrait = orientation === "portrait";
  const techStack: string[] = project.techStack ?? [];

  return (
    <motion.div
      style={{
        top: `${slot.top}%`,
        left: `${slot.left}vw`,
        width: `${slot.w}vw`,
        zIndex: isFocused ? 60 : slot.z,
        x,
        y,
        rotate: isFocused ? 0 : baseRotate,
        scale: baseScale,
        opacity,
        rotateX,
        rotateY,
        transformPerspective: 1100,
        backgroundColor: project.color ?? "#141416",
      }}
      onMouseEnter={() => onFocusChange(index)}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onClick={() => onInspect(index)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onInspect(index);
        }
      }}
      aria-label={`Inspect ${project.name}`}
      className={`group absolute cursor-pointer transition-[filter,opacity,box-shadow] duration-400 ${
        portrait ? "aspect-[9/16]" : "aspect-[16/9]"
      } ${
        isFocused
          ? "shadow-[0_48px_95px_-20px_rgba(20,20,22,0.88)] ring-2 ring-sakura"
          : "shadow-[0_36px_72px_-26px_rgba(20,20,22,0.68)]"
      } ${isDimmed ? "opacity-35 blur-[1.5px] grayscale-[25%]" : ""}`}
    >
      <div className="relative block h-full w-full overflow-hidden">
        <Media
          media={project.media}
          color={project.color}
          alt={project.name}
          className={`absolute inset-0 h-full w-full transition-transform duration-500 ease-out ${
            isFocused ? "scale-[1.04]" : "group-hover:scale-[1.04]"
          }`}
        />

        {project.private && (
          <div className="absolute right-0 top-0 flex items-center gap-1.5 bg-sakura-deep px-2.5 py-1.5">
            <Lock className="h-3 w-3 text-white" />
            <span className="font-mono text-[10px] tracking-[0.15em] text-white">PRIVATE</span>
          </div>
        )}

        {/* Hover drawer with techStack capsules */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 origin-bottom bg-[#141416]/94 p-4 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] md:p-5 ${
            isFocused ? "translate-y-0" : "translate-y-full group-hover:translate-y-0"
          }`}
        >
          <div className="mb-1.5 flex items-start justify-between gap-3">
            <h3 className="display text-lg text-white md:text-xl">{project.name}</h3>
            <span className="mt-0.5 shrink-0 font-mono text-[10px] tracking-[0.15em] text-white/50">
              {project.language.toUpperCase()}
            </span>
          </div>

          <p className="mb-2 font-mono text-[10px] tracking-[0.1em] text-sakura">
            {project.role}
          </p>

          <p className="line-clamp-2 text-xs leading-relaxed text-white/75">
            {project.description}
          </p>

          {techStack.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="border border-white/15 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-white/80 uppercase"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ProjectsStage() {
  const projects = siteData.projects;
  const trackRef = useRef<HTMLDivElement>(null);
  const { slots } = useWallLayout(projects.length);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null);

  // Magnetic cursor pill coordinates
  const cursorX = useMotionValue(-200);
  const cursorY = useMotionValue(-200);
  const smoothCursorX = useSpring(cursorX, { stiffness: 380, damping: 28 });
  const smoothCursorY = useSpring(cursorY, { stiffness: 380, damping: 28 });

  const handleStageMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      cursorX.set(e.clientX - rect.left);
      cursorY.set(e.clientY - rect.top);
    },
    [cursorX, cursorY],
  );

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.35", "end end"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.0005,
  });

  // Keyboard navigation for the floating full-image inspector
  useEffect(() => {
    if (inspectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInspectedIndex(null);
      if (e.key === "ArrowRight") {
        setInspectedIndex((prev) => (prev === null ? 0 : (prev + 1) % projects.length));
      }
      if (e.key === "ArrowLeft") {
        setInspectedIndex((prev) =>
          prev === null ? 0 : (prev - 1 + projects.length) % projects.length,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inspectedIndex, projects.length]);

  const focusedProject = focusedIndex !== null ? projects[focusedIndex] : null;
  const inspectedProject = inspectedIndex !== null ? projects[inspectedIndex] : null;

  return (
    <section
      id="projects"
      className="relative isolate border-b border-line bg-paper"
    >
      <div ref={trackRef} className="relative h-[400vh]">
        <div
          onMouseMove={handleStageMouseMove}
          onClick={(e) => {
            if (e.target === e.currentTarget) setFocusedIndex(null);
          }}
          className="sticky top-0 h-[100svh] overflow-hidden"
        >
          {/* Headline */}
          <div className="grid-20 pointer-events-none absolute left-0 right-0 top-24 z-30">
            <div className="grid-inner">
              <h2 className="display mt-3 text-[9vw] text-ink md:text-[5.5vw]">
                The <span className="text-sakura-deep">work</span>
              </h2>
              <span
                aria-hidden="true"
                className="paper-rule draw-in mt-6 hidden w-2/5 md:block"
              />
            </div>
          </div>

          {/* Scattered project wall */}
          <div className="absolute inset-0">
            {projects.map((p, i) =>
              slots[i] ? (
                <WallCard
                  key={p.name}
                  project={p}
                  index={i}
                  total={projects.length}
                  slot={slots[i]}
                  progress={smooth}
                  isFocused={focusedIndex === i}
                  isDimmed={focusedIndex !== null && focusedIndex !== i}
                  onFocusChange={setFocusedIndex}
                  onInspect={setInspectedIndex}
                />
              ) : null,
            )}
          </div>

          {/* Bottom interactive project capsules dock: hover to spotlight, click to inspect full image */}
          <div className="grid-20 pointer-events-none absolute inset-x-0 bottom-6 z-30">
            <div className="grid-inner flex flex-wrap items-center justify-between gap-3">
              <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
                {projects.map((p, idx) => {
                  const active = focusedIndex === idx || inspectedIndex === idx;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onMouseEnter={() => setFocusedIndex(idx)}
                      onMouseLeave={() => setFocusedIndex(null)}
                      onClick={() => setInspectedIndex(idx)}
                      className={`flex cursor-pointer items-center gap-2 border px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] backdrop-blur-md transition-all uppercase ${
                        active
                          ? "border-sakura-deep bg-sakura-deep text-white shadow-sm"
                          : "border-line bg-paper/85 text-ink/80 hover:border-sakura-deep hover:text-ink"
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: active ? "#ffffff" : p.color }}
                      />
                      <span>{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Contextual magnetic cursor pill */}
          <motion.div
            aria-hidden="true"
            style={{ x: smoothCursorX, y: smoothCursorY }}
            animate={{
              opacity: focusedProject ? 1 : 0,
              scale: focusedProject ? 1 : 0.75,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="pointer-events-none absolute left-4 top-4 z-[80] hidden items-center gap-1.5 bg-sakura px-3 py-1.5 font-mono text-[10px] font-medium tracking-[0.18em] text-[#141416] shadow-lg md:flex"
          >
            <Maximize2 className="h-3 w-3" />
            <span>INSPECT FULL IMAGE</span>
          </motion.div>

          {/* Wall progress, riding at the top of the stage */}
          <div className="absolute left-0 right-0 top-0 z-30">
            <span className="relative block h-[3px] w-full overflow-hidden bg-ink/10">
              <motion.span
                style={{ scaleX: smooth }}
                className="absolute inset-0 origin-left bg-sakura"
              />
            </span>
          </div>
        </div>
      </div>

      {/* Floating Full-Image & Project Dossier Modal */}
      <AnimatePresence>
        {inspectedProject && inspectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setInspectedIndex(null)}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-[#141416]/90 p-4 backdrop-blur-md md:p-10"
          >
            <motion.div
              key={inspectedProject.name}
              initial={{ scale: 0.93, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="grid max-h-[90svh] w-full max-w-6xl overflow-hidden border border-white/15 bg-[#141416] text-white shadow-2xl md:grid-cols-[1.35fr_1fr]"
            >
              {/* Left: Uncropped Full-Resolution Image Preview */}
              <div className="relative flex max-h-[52svh] items-center justify-center overflow-hidden bg-[#0b0b0d] p-4 md:max-h-[86svh] md:p-8">
                <img
                  src={(inspectedProject.media as any).poster || inspectedProject.media.src}
                  alt={inspectedProject.name}
                  className="max-h-[46svh] w-auto max-w-full object-contain shadow-2xl md:max-h-[76svh]"
                />
                <span className="absolute left-4 top-4 border border-white/15 bg-[#141416]/80 px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-white/75 backdrop-blur-xs">
                  {String(inspectedIndex + 1).padStart(2, "0")} /{" "}
                  {String(projects.length).padStart(2, "0")}
                </span>
              </div>

              {/* Right: Project Details, Tech Stack & Actions */}
              <div className="flex flex-col justify-between border-t border-white/10 p-6 md:border-l md:border-t-0 md:p-8">
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-2 border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] tracking-[0.18em] text-white/80 uppercase">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: inspectedProject.color }}
                      />
                      {inspectedProject.language}
                    </span>

                    <button
                      type="button"
                      onClick={() => setInspectedIndex(null)}
                      className="flex cursor-pointer items-center gap-1.5 border border-white/20 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-white/80 transition-colors hover:border-sakura hover:text-sakura uppercase"
                    >
                      <span>CLOSE [ESC]</span>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="display mt-6 text-3xl text-white md:text-5xl">
                    {inspectedProject.name}
                  </h3>

                  <p className="mt-2 font-mono text-xs tracking-[0.14em] text-sakura uppercase">
                    {inspectedProject.role}
                  </p>

                  <p className="mt-5 text-sm leading-relaxed text-white/80 md:text-base">
                    {inspectedProject.description}
                  </p>

                  {inspectedProject.techStack?.length > 0 && (
                    <div className="mt-6">
                      <p className="font-mono text-[10px] tracking-[0.22em] text-white/45 uppercase">
                        TECH STACK
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {inspectedProject.techStack.map((tech: string) => (
                          <span
                            key={tech}
                            className="border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[11px] tracking-[0.12em] text-white/90"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {inspectedProject.private ? (
                      <div className="inline-flex items-center gap-2 bg-sakura-deep px-4 py-2.5 font-mono text-xs tracking-[0.18em] text-white uppercase">
                        <Lock className="h-3.5 w-3.5" />
                        <span>PRIVATE REPOSITORY</span>
                      </div>
                    ) : (
                      <a
                        href={inspectedProject.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-sakura px-5 py-2.5 font-mono text-xs font-medium tracking-[0.18em] text-[#141416] transition-colors hover:bg-sakura-deep hover:text-white uppercase"
                      >
                        <span>OPEN ON GITHUB</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setInspectedIndex(
                            (inspectedIndex - 1 + projects.length) % projects.length,
                          )
                        }
                        aria-label="Previous project"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center border border-white/20 text-white/80 transition-colors hover:border-sakura hover:text-sakura"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setInspectedIndex((inspectedIndex + 1) % projects.length)
                        }
                        aria-label="Next project"
                        className="flex h-9 w-9 cursor-pointer items-center justify-center border border-white/20 text-white/80 transition-colors hover:border-sakura hover:text-sakura"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 02 — Games: 4-col velocity-skewed field, filter pills & lightbox    */
/* ------------------------------------------------------------------ */

function shuffled<T>(arr: T[], seed = 1): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

type GameFrame = {
  id: string;
  src: string;
  orientation: string;
  game: {
    name: string;
    note?: string;
    color: string;
  };
};

function GameColumn({
  frames,
  drift,
  progress,
  skewY,
  activeGame,
  onInspect,
}: {
  frames: GameFrame[];
  drift: number;
  progress: MotionValue<number>;
  skewY: MotionValue<number>;
  activeGame: string | null;
  onInspect: (frame: GameFrame) => void;
  key?: number;
}) {
  const y = useTransform(progress, [0, 1], [`${drift}%`, `${-drift}%`]);

  return (
    <motion.div style={{ y, skewY }} className="flex flex-col gap-5 md:gap-7">
      {frames.map((f, i) => {
        const isMatched = !activeGame || activeGame === f.game.name;
        return (
          <button
            key={`${f.id}-${i}`}
            type="button"
            onClick={() => onInspect(f)}
            className={`group relative shrink-0 cursor-pointer overflow-hidden text-left transition-all duration-500 ${
              f.orientation === "portrait" ? "aspect-[9/16]" : "aspect-[16/9]"
            } ${
              isMatched
                ? "opacity-100 ring-0 hover:ring-2 hover:ring-sakura-deep"
                : "scale-[0.97] opacity-25 grayscale"
            }`}
            style={{ backgroundColor: f.game.color }}
          >
            <img
              src={f.src}
              alt={`${f.game.name} screenshot ${i + 1}`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
            />
            <span className="absolute bottom-0 right-0 flex items-baseline gap-2 border-l border-t border-line bg-paper/95 px-2.5 py-1 font-sans text-xs font-bold tracking-tight text-ink backdrop-blur-xs">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: f.game.color }}
              />
              {f.game.name}
              {f.game.note && (
                <span className="font-mono text-[10px] font-normal tracking-[0.15em] text-gray uppercase">
                  {f.game.note}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}

function GamesStage() {
  const games = siteData.games;
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [inspected, setInspected] = useState<GameFrame | null>(null);

  const frames = useMemo<GameFrame[]>(
    () =>
      games.flatMap((g) =>
        g.screenshots.map((s: any, idx: number) => ({
          id: `${g.name}-${idx}`,
          src: s.src,
          orientation: s.orientation,
          game: g,
        })),
      ),
    [games],
  );

  const columns = useMemo(() => {
    const cols: GameFrame[][] = [[], [], [], []];
    shuffled<GameFrame>(frames, 7).forEach((f, i) => cols[i % 4].push(f));
    return cols.map((col) => [...col, ...col]);
  }, [frames]);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 26,
    restDelta: 0.0005,
  });

  const velocity = useVelocity(smooth);
  const rawSkew = useTransform(velocity, [-0.6, 0, 0.6], [-3.5, 0, 3.5]);
  const skewY = useSpring(rawSkew, { stiffness: 180, damping: 24 });

  useEffect(() => {
    if (!inspected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setInspected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inspected]);

  const handleToggleGame = useCallback((name: string) => {
    setActiveGame((prev) => (prev === name ? null : name));
  }, []);

  return (
    <section id="games" className="relative bg-paper">
      <div ref={trackRef} className="relative h-[360vh]">
        <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
          {/* Headline + interactive game capsules */}
          <div className="grid-20 pointer-events-none absolute left-0 right-0 top-20 z-20 md:top-24">
            <div className="grid-inner flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="display mt-2 text-[11vw] text-ink md:text-[6vw]">
                  What I <span className="text-sakura-deep">play</span>
                </h2>
              </div>

              <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveGame(null)}
                  className={`cursor-pointer border px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] transition-colors uppercase ${
                    activeGame === null
                      ? "border-sakura-deep bg-sakura-deep text-white"
                      : "border-line bg-paper/85 text-gray hover:border-ink hover:text-ink"
                  }`}
                >
                  ALL ({frames.length})
                </button>
                {games.map((g) => {
                  const selected = activeGame === g.name;
                  return (
                    <button
                      key={g.name}
                      type="button"
                      onClick={() => handleToggleGame(g.name)}
                      className={`cursor-pointer border px-2.5 py-1 font-mono text-[10px] tracking-[0.16em] transition-colors uppercase ${
                        selected
                          ? "border-sakura-deep bg-sakura-deep text-white"
                          : "border-line bg-paper/85 text-ink/80 hover:border-sakura-deep"
                      }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="absolute inset-0 px-3 md:px-6">
            <div className="grid h-full grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
              {columns.map((colFrames, i) => (
                <GameColumn
                  key={i}
                  frames={colFrames}
                  drift={i % 2 === 0 ? 15 : -15}
                  progress={smooth}
                  skewY={skewY}
                  activeGame={activeGame}
                  onInspect={setInspected}
                />
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-[24%] bg-gradient-to-b from-paper via-paper/85 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-paper via-paper/85 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 z-20 shrink-0 border-t border-line bg-paper/95 py-4 backdrop-blur-xs">
            <Ticker
              items={games.map((g) => g.name)}
              activeItem={activeGame}
              onSelectItem={handleToggleGame}
              className="display text-[1.75rem] text-ink md:text-[2.5rem]"
            />
          </div>
        </div>
      </div>

      {/* Full-screen Lightbox Modal */}
      <AnimatePresence>
        {inspected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setInspected(null)}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-[#141416]/90 p-4 backdrop-blur-md md:p-12"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[86svh] w-full max-w-5xl overflow-hidden border border-white/15 bg-[#141416] shadow-2xl"
            >
              <img
                src={inspected.src}
                alt={inspected.game.name}
                className="max-h-[76svh] w-full bg-[#0c0c0e] object-contain"
              />
              <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-3.5 text-white">
                <div className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: inspected.game.color }}
                  />
                  <span className="display text-lg">{inspected.game.name}</span>
                  {inspected.game.note && (
                    <span className="font-mono text-xs tracking-[0.2em] text-white/55 uppercase">
                      / {inspected.game.note}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setInspected(null)}
                  className="flex cursor-pointer items-center gap-1.5 border border-white/20 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-white/80 transition-colors hover:border-sakura hover:text-sakura uppercase"
                >
                  <span>CLOSE [ESC]</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 03 — Profile                                                        */
/* ------------------------------------------------------------------ */

function ProfileStage() {
  const profile = siteData.profile;
  const about = profile.about;

  return (
    <section
      id="profile"
      className="relative flex min-h-[100svh] flex-col justify-center bg-paper pb-20 pt-28"
    >
      <div className="grid-20">
        <div className="grid-inner">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="display mt-2 text-[13vw] text-ink md:text-[7vw]">
              About <span className="text-sakura-deep">me</span>
            </h2>
            <span aria-hidden="true" className="paper-rule draw-in mt-5 block w-full max-w-md" />
          </motion.div>

          <div className="mt-10 grid gap-10 md:grid-cols-[1.2fr_1fr] md:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-5">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-16 w-16 shrink-0 rounded-full border border-line object-cover md:h-20 md:w-20"
                />
                <div>
                  <p className="font-mono text-[11px] tracking-[0.25em] text-gray">
                    {profile.location.toUpperCase()} · {profile.handle}
                  </p>
                  <p className="mt-1 display text-xl text-ink">{profile.name}</p>
                </div>
              </div>

              <p
                className="mt-8 max-w-lg text-lg leading-relaxed text-ink/85 md:text-xl"
                dangerouslySetInnerHTML={{ __html: about.introHtml }}
              />

              <ul className="mt-8 grid gap-2 sm:grid-cols-2">
                {about.items.map((item, i) => (
                  <li
                    key={i}
                    className="group flex items-start gap-3 border border-transparent bg-mist px-4 py-3 text-sm leading-snug text-ink/80 transition-colors hover:border-line hover:bg-paper"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-sakura-deep transition-transform group-hover:scale-125" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.75, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col justify-center"
            >
              {siteData.skills.map((group, gi) => (
                <div key={group.name} className="relative py-4">
                  {gi > 0 && (
                    <span
                      aria-hidden="true"
                      className="draw-in absolute inset-x-0 top-0 block h-px bg-line"
                    />
                  )}
                  <p className="font-mono text-[10px] tracking-[0.25em] text-gray">
                    / {group.name.toUpperCase()}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {group.skills.map((s) => (
                      <span
                        key={s}
                        className="border border-line px-3 py-1.5 text-sm text-ink/85 transition-colors hover:border-sakura hover:bg-sakura/25"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div className="mt-4 bg-sakura px-5 py-4 text-[#141416]">
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-[#141416]/75">
                  <span className="blink inline-block h-2 w-2 rounded-full bg-[#141416]" />
                  <span>NOW</span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {siteData.now.map((n) => (
                    <li key={n} className="text-sm leading-snug text-[#141416]">
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 04 — Contact                                                        */
/* ------------------------------------------------------------------ */

function ContactStage() {
  const [hoveredSocial, setHoveredSocial] = useState<string | null>(null);
  const [spot, setSpot] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const handleGridMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setSpot({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true,
    });
  };

  return (
    <section
      id="contact"
      className="relative flex min-h-[100svh] flex-col justify-center bg-mist pb-20 pt-28"
    >
      <div className="grid-20">
        <div className="grid-inner">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <h2 className="display mt-2 text-[13vw] text-ink md:text-[7vw]">
              Get in <span className="text-sakura-deep">touch</span>
            </h2>

            <div className="flex items-center gap-4 border-l-2 border-sakura-deep pl-4 lg:border-l-0 lg:border-r-2 lg:pl-0 lg:pr-4 lg:text-right">
              <p className="font-sans text-sm tracking-wide text-ink/85 md:text-base">
                {siteData.profile.quote}
              </p>
              <span
                aria-hidden="true"
                className="vertical-jp hidden h-20 select-none text-xs tracking-[0.25em] text-sakura-deep/80 xl:block"
              >
                夜空に咲く花
              </span>
            </div>
          </div>

          <div
            onMouseMove={handleGridMouseMove}
            onMouseLeave={() => setSpot((s) => ({ ...s, active: false }))}
            className="relative mt-10 grid grid-cols-2 gap-px overflow-hidden bg-line sm:grid-cols-4"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
              style={{
                opacity: spot.active ? 1 : 0,
                background: `radial-gradient(380px circle at ${spot.x}px ${spot.y}px, var(--color-sakura), transparent 75%)`,
              }}
            />

            {siteData.socials.map((social) => {
              const Icon = iconMap[social.icon];
              const isHovered = hoveredSocial === social.name;
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setHoveredSocial(social.name)}
                  onMouseLeave={() => setHoveredSocial(null)}
                  className="group relative z-10 flex flex-col justify-between gap-6 bg-mist/95 px-5 py-6 transition-colors duration-300 hover:bg-paper"
                >
                  <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-sakura transition-transform duration-300 group-hover:scale-x-100" />
                  {Icon && (
                    <Icon className="h-5 w-5 text-ink/70 transition-colors group-hover:text-sakura-deep" />
                  )}
                  <div>
                    <p className="display text-base text-ink">{social.name}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-gray group-hover:text-sakura-deep">
                      <ScrambleText text={social.handle} active={isHovered} />
                    </p>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
            <p className="font-mono text-[11px] tracking-[0.2em] text-gray">
              © {new Date().getFullYear()} {siteData.profile.name}
            </p>
            <a
              href="#index"
              className="font-mono text-[11px] tracking-[0.22em] text-ink transition-colors hover:text-sakura-deep uppercase"
            >
              ↑ BACK TO TOP
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 border-y border-line py-3">
        <Ticker
          items={[siteData.profile.name, ...siteData.profile.titles]}
          reverse
          className="display text-[2rem] text-ink md:text-[3rem]"
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Deck                                                                */
/* ------------------------------------------------------------------ */

export default function Deck() {
  const { dark, toggle } = useTheme();
  const [heroReady, setHeroReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePreloaderReady = useCallback(() => {
    setHeroReady(true);
  }, []);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  const overHero = useOverHero();
  const activeStage = useActiveStage();
  const fg = overHero ? "text-white" : "text-ink";
  const dim = overHero ? "text-white/65" : "text-gray";

  return (
    <div className="relative w-full bg-paper">
      <Preloader onReady={handlePreloaderReady} />

      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-sakura-deep"
      />

      <main>
        <Hero ready={heroReady} />
        <ProjectsStage />
        <GamesStage />
        <ProfileStage />
        <ContactStage />
      </main>

      <header className="fixed inset-x-0 top-0 z-40">
        <div className="grid-20 py-5 md:py-7">
          <div className="grid-inner flex items-center justify-between">
            <a
              href="#index"
              className={`display text-sm transition-colors duration-300 ${fg}`}
            >
              dingyi222666
            </a>

            <div className="flex items-center gap-5 md:gap-7">
              <nav className="hidden items-center gap-7 md:flex">
                {STAGES.map((stage) => {
                  const isActive = activeStage === stage.id;
                  return (
                    <a
                      key={stage.id}
                      href={`#${stage.id}`}
                      className={`group relative flex items-baseline gap-1.5 font-sans text-[11px] font-medium tracking-[0.14em] transition-colors duration-300 ${
                        isActive ? fg : dim
                      } hover:opacity-100`}
                    >
                      <span className="font-mono text-[9px] text-sakura-deep">
                        {stage.num}
                      </span>
                      <span>{stage.label}</span>
                      {isActive ? (
                        <motion.span
                          layoutId="header-active-bar"
                          className="absolute -bottom-1.5 left-0 block h-[1.5px] w-full bg-sakura-deep"
                        />
                      ) : (
                        <span className="absolute -bottom-1.5 left-0 block h-px w-full origin-left scale-x-0 bg-sakura-deep transition-transform duration-300 group-hover:scale-x-100" />
                      )}
                    </a>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={toggle}
                aria-label="Toggle colour theme"
                className={`flex h-7 w-7 cursor-pointer items-center justify-center transition-colors duration-300 hover:text-sakura-deep ${fg}`}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle navigation menu"
                className={`flex h-7 w-7 cursor-pointer items-center justify-center transition-colors duration-300 hover:text-sakura-deep md:hidden ${fg}`}
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: "0%" }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-30 flex flex-col justify-between bg-paper px-6 pb-10 pt-24 md:hidden"
          >
            <nav className="flex flex-col gap-5">
              {STAGES.map((stage) => {
                const isActive = activeStage === stage.id;
                return (
                  <a
                    key={stage.id}
                    href={`#${stage.id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-baseline justify-between border-b border-line pb-3"
                  >
                    <span
                      className={`display text-4xl ${
                        isActive ? "text-sakura-deep" : "text-ink"
                      }`}
                    >
                      {stage.label}
                    </span>
                    <span className="font-mono text-xs tracking-[0.2em] text-gray">
                      / {stage.num}
                    </span>
                  </a>
                );
              })}
            </nav>

            <div className="font-mono text-[11px] tracking-[0.18em] text-gray">
              <p>{siteData.profile.quote}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
