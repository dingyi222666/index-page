import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { Lock, Mail, Moon, NotebookPen, Sun } from "lucide-react";
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
  type ReactNode,
} from "react";
import siteData from "../data.json";

/* ==================================================================
   Language borrowed from the reference site:
   - a 20-column grid; blocks placed by column, not by flexbox
   - ultrabold uppercase display type, line-height .86
   - pinned full-viewport stages that stack as you scroll
   - media scattered at hard-coded percentages with real rotations
   - flat colour fields, marquee tickers, a preloader curtain
   ================================================================== */

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
  className = "",
}: {
  media: { type: string; orientation: string; src: string; poster?: string };
  color: string;
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
      alt=""
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

/** True while the dark hero is the thing under the fixed header. */
function useOverHero() {
  const [over, setOver] = useState(true);

  useEffect(() => {
    // The hero is one viewport tall, so watching its bottom edge is enough:
    // while any of it is in view, the header is sitting on the dark artwork.
    const hero = document.getElementById("index");
    if (!hero || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => setOver(entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  return over;
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
}: {
  items: string[];
  reverse?: boolean;
  className?: string;
  itemClassName?: string;
  speed?: number;
}) {
  // Repeated 8x, and the keyframe travels half the track, so the loop is
  // seamless no matter how wide the viewport is.
  const track = Array.from({ length: 8 }, () => items).flat();

  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className={`marquee-track ${reverse ? "marquee-track--reverse" : ""}`}
        style={{ "--marquee-duration": `${speed}s` } as CSSProperties}
      >
        {track.map((t, i) => (
          <span key={i} className={`flex shrink-0 items-center gap-4 pr-4 ${itemClassName}`}>
            <span className={i % 2 === 1 ? "text-hollow" : ""}>{t}</span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sakura-deep" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Curtain — flashes the accent colour, then slides away               */
/* ------------------------------------------------------------------ */

function Preloader() {
  return (
    <div className="preloader fixed inset-0 z-[100] flex items-end bg-sakura p-6 md:p-12">
      <p className="display text-[14vw] leading-[0.8] text-[#141416] md:text-[9vw]">
        dingyi222666
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 00 — Title                                                          */
/* ------------------------------------------------------------------ */

function Hero() {
  const [i, setI] = useState(0);
  const images = siteData.hero.images;
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % images.length), 7000);
    return () => clearInterval(t);
  }, [images.length]);

  const slide = images[i];

  return (
    <section className="relative h-[100svh] w-full overflow-hidden bg-ink">
      {/* Slides. A curtain wipe, not a zoom — the frame is simply replaced. */}
      {images.map((img, k) => (
        <motion.div
          key={img.url}
          aria-hidden={k !== i}
          animate={{ clipPath: k === i ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          className="absolute inset-0"
        >
          <img
            src={img.url}
            alt={img.title}
            onError={(e) => {
              // No fallback art any more: drop the frame so the flat colour
              // field behind it reads as intentional.
              (e.currentTarget as HTMLImageElement).style.opacity = "0";
            }}
            className="h-full w-full scale-[1.02] object-cover"
          />
          <div className="absolute inset-0 bg-[#141416]/50" />
        </motion.div>
      ))}

      <div className="grid-20 absolute inset-0 z-10 content-end pb-24">
        <div className="grid-inner">
          <h1 className="display text-white" key={i}>
            <span className="block text-[17vw] md:text-[11vw]">
              <Words text="Still" />
            </span>
            <span className="block text-[17vw] md:text-[11vw]">
              <Words text="Render" delay={0.08} />
              <span className="word-mask">
                <span
                  className="word-up text-sakura"
                  style={{ animationDelay: "0.16s" }}
                >
                  Frame
                </span>
              </span>
            </span>
          </h1>

          {/* Slide switch — click a tick to jump to that frame */}
          <div className="mt-8 flex items-center gap-2">
            {images.map((img, k) => (
              <button
                key={img.url}
                onClick={() => setI(k)}
                aria-label={`Show ${img.title}`}
                className={`h-[3px] transition-all duration-500 ${
                  k === i ? "w-10 bg-sakura" : "w-4 bg-sakura/40 hover:bg-sakura/75"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 01 — Projects: pinned wall, mixed landscape/portrait media          */
/* ------------------------------------------------------------------ */

/* Holds the headline box (roughly x 10-36%, y 10-24%) clear while still
   filling the right-hand side. Widths are the final vw width of the card;
   portrait entries are kept narrow so they never run off the bottom. */
const WALL = [
  { top: 4, left: 40, w: 23, rot: -6.61, z: 4 },
  { top: 3, left: 66, w: 12, rot: -4.7, z: 3 },
  { top: 28, left: 1, w: 26, rot: 8.74, z: 2 },
  { top: 30, left: 29, w: 12, rot: 4.68, z: 5 },
  { top: 42, left: 68, w: 12, rot: -5.69, z: 4 },
  { top: 60, left: 1, w: 24, rot: 5.0, z: 3 },
  { top: 12, left: 85, w: 11, rot: 10.99, z: 2 },
];

function WallCard({
  project,
  index,
  total,
  progress,
}: {
  project: any;
  index: number;
  total: number;
  progress: MotionValue<number>;
  key?: string;
}) {
  const spot = WALL[index % WALL.length];
  const start = (index / total) * 0.7;
  const end = Math.min(start + 0.2, 0.93);

  const fromLeft = spot.left < 33;
  const fromRight = spot.left > 60;
  const fromX = fromLeft ? "-120vw" : fromRight ? "120vw" : "0vw";
  const fromY = !fromLeft && !fromRight ? (index % 2 ? "85vh" : "-85vh") : "10vh";

  const x = useTransform(progress, [start, end], [fromX, "0vw"]);
  const y = useTransform(progress, [start, end], [fromY, "0vh"]);
  const rotate = useTransform(progress, [start, end], [spot.rot * 4, spot.rot]);
  const scale = useTransform(progress, [start, end], [0.75, 1]);
  const opacity = useTransform(progress, [start, start + 0.06], [0, 1]);

  const Wrapper: any = project.private ? "div" : "a";
  const orientation = project.media?.orientation ?? "landscape";
  const portrait = orientation === "portrait";

  return (
    <motion.div
      style={{
        top: `${spot.top}%`,
        left: `${spot.left}%`,
        width: `${spot.w}vw`,
        zIndex: spot.z,
        x,
        y,
        rotate,
        scale,
        opacity,
        backgroundColor: project.color ?? "#141416",
      }}
      className={`group absolute ${
        portrait ? "aspect-[9/16]" : "aspect-[16/9]"
      } shadow-[0_40px_80px_-28px_rgba(20,20,22,0.75)]`}
    >
      <Wrapper
        {...(project.private
          ? {}
          : { href: project.url, target: "_blank", rel: "noopener noreferrer" })}
        aria-label={project.private ? project.name : `${project.name} on GitHub`}
        className="relative block h-full w-full overflow-hidden"
      >
        <Media
          media={project.media}
          color={project.color}
          className="absolute inset-0 h-full w-full"
        />

        {project.private && (
          <div className="absolute right-0 top-0 flex items-center gap-1.5 bg-sakura-deep px-2.5 py-1.5">
            <Lock className="h-3 w-3 text-white" />
            <span className="font-mono text-[10px] tracking-[0.15em] text-white">PRIVATE</span>
          </div>
        )}

        {/* Hover: the details wipe up from the bottom edge */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 origin-bottom translate-y-full bg-[#141416]/92 p-4 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 md:p-5">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3 className="display text-lg text-white md:text-xl">{project.name}</h3>
            <span className="mt-0.5 shrink-0 font-mono text-[10px] tracking-[0.15em] text-white/50">
              {project.language.toUpperCase()}
            </span>
          </div>
          <p className="mb-2 font-mono text-[10px] tracking-[0.1em] text-sakura">{project.role}</p>
          <p className="line-clamp-2 text-xs leading-relaxed text-white/70">
            {project.description}
          </p>
        </div>
      </Wrapper>
    </motion.div>
  );
}

function ProjectsStage() {
  const projects = siteData.projects;
  const trackRef = useRef<HTMLDivElement>(null);

  // The track is 520vh tall, so it has 420vh of travel through the viewport
  // for the wall to use up. Progress is tied to that travel, not to a scroll
  // container of our own.
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start start", "end end"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 26,
    restDelta: 0.0005,
  });

  return (
    <section id="projects" className="relative bg-smoke">
      <div ref={trackRef} className="relative h-[520vh]">
        <div className="sticky top-0 h-[100svh] overflow-hidden">
          {/* Dotted construction grid: horizontal bands plus column rules. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 hidden md:block"
          >
            {/* Square dashed cells, from .square-grid */}
            <div className="square-grid h-full w-full text-ink opacity-25" />
          </div>

          <div className="grid-20 absolute left-0 right-0 top-24 z-30">
            <div className="grid-inner">
              <h2 className="display mt-3 text-[9vw] text-ink md:text-[5.5vw]">
                The <span className="text-sakura-deep">work</span>
              </h2>
            </div>
          </div>

          {/* Slots are chosen so cards clear the headline box but still use
              the full width, including the whole right-hand column. */}
          <div className="absolute inset-0">
            {projects.map((p, i) => (
              <WallCard
                key={p.name}
                project={p}
                index={i}
                total={projects.length}
                progress={smooth}
              />
            ))}
          </div>

          {/* Wall progress, riding at the top of the stage */}
          <div className="absolute left-0 right-0 top-0 z-30">
            <span className="relative block h-[3px] w-full overflow-hidden bg-white/15">
              <motion.span
                style={{ scaleX: smooth }}
                className="absolute inset-0 origin-left bg-sakura"
              />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 02 — Games: a tall field of frames, columns drifting at their own   */
/* speed. Mixed landscape and portrait, name plate bottom-right.       */
/* ------------------------------------------------------------------ */

/** Deterministic shuffle so the field is varied but stable across renders. */
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

function GameColumn({
  frames,
  drift,
  progress,
}: {
  frames: any[];
  drift: number;
  progress: MotionValue<number>;
  key?: number;
}) {
  const y = useTransform(progress, [0, 1], [`${drift}%`, `${-drift}%`]);

  return (
    <motion.div style={{ y }} className="flex flex-col gap-7">
      {frames.map((f, i) => (
        <div
          key={`${f.game.name}-${i}`}
          className={`group relative shrink-0 overflow-hidden ${
            f.orientation === "portrait" ? "aspect-[9/16]" : "aspect-[16/9]"
          }`}
          style={{ backgroundColor: f.game.color }}
        >
          <img
            src={f.src}
            alt={`${f.game.name} screenshot ${i + 1}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
          />
          {/* Name plate, bottom-right of every frame */}
          <span className="absolute bottom-0 right-0 bg-white px-2.5 py-1 font-sans text-xs font-bold tracking-tight text-[#141416]">
            {f.game.name}
          </span>
        </div>
      ))}
    </motion.div>
  );
}

function GamesStage() {
  const games = siteData.games;
  const trackRef = useRef<HTMLDivElement>(null);

  const frames = useMemo(
    () =>
      games.flatMap((g) =>
        g.screenshots.map((s: any) => ({
          src: s.src,
          orientation: s.orientation,
          game: g,
        })),
      ),
    [games],
  );

  // Split into four columns; each drifts at a different rate.
  const columns = useMemo(() => {
    const cols: any[][] = [[], [], [], []];
    shuffled(frames, 7).forEach((f, i) => cols[i % 4].push(f));
    return cols;
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

  return (
    <section id="games" className="relative bg-paper">
      <div ref={trackRef} className="relative h-[360vh]">
        <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
          {/* Headline sits over the field */}
          <div className="grid-20 absolute left-0 right-0 top-24 z-20">
            <div className="grid-inner flex items-end justify-between gap-8">
              <div>
                <h2 className="display mt-3 text-[11vw] text-ink md:text-[6vw]">
                  What I <span className="text-sakura-deep">play</span>
                </h2>
              </div>
            </div>
          </div>

          {/* Drifting field, full-bleed behind and around the headline */}
          <div className="absolute inset-0">
            <div className="grid h-full grid-cols-2 gap-7 md:grid-cols-3">
              {columns.map((frames, i) => (
                <GameColumn
                  key={i}
                  frames={frames}
                  drift={i % 2 === 0 ? 14 : -14}
                  progress={smooth}
                />
              ))}
            </div>
          </div>

          {/* Flat fields top and bottom, equal height, so the frame reads
              symmetric and the headline stays legible over the images. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[20%] bg-paper/90" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[20%] bg-paper/90" />

          {/* Marquee band, the footer of the pinned stage */}
          <div className="absolute inset-x-0 bottom-0 z-20 shrink-0 border-t border-line bg-paper py-4">
            <Ticker
              items={games.map((g) => g.name)}
              className="display text-[1.75rem] text-ink md:text-[2.5rem]"
            />
          </div>
        </div>
      </div>
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
    <section id="profile" className="flex min-h-[100svh] flex-col justify-center bg-paper pb-20 pt-28">
      <div className="grid-20">
        <div className="grid-inner">
          <h2 className="display mt-3 text-[13vw] text-ink md:text-[7vw]">
            About <span className="text-sakura-deep">me</span>
          </h2>

          <div className="mt-10 grid gap-10 md:grid-cols-[1.2fr_1fr] md:gap-16">
            <div>
              <div className="flex items-center gap-5">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-16 w-16 shrink-0 rounded-full border border-line object-cover md:h-20 md:w-20"
                />
                <div>
                  <p className="font-mono text-[11px] tracking-[0.25em] text-gray">
                    {profile.location.toUpperCase()}
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
                    className="flex items-start gap-3 bg-mist px-4 py-3 text-sm leading-snug text-ink/75"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-sakura-deep" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col justify-center">
              {siteData.skills.map((group, gi) => (
                <div key={group.name} className={`py-4 ${gi > 0 ? "border-t border-line" : ""}`}>
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

              <div className="mt-4 bg-sakura px-5 py-4">
                <p className="font-mono text-[10px] tracking-[0.25em] text-[#141416]/70">
                  NOW
                </p>
                <ul className="mt-3 space-y-1.5">
                  {siteData.now.map((n) => (
                    <li key={n} className="text-sm leading-snug text-[#141416]">
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
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
  return (
    <section id="contact" className="flex min-h-[100svh] flex-col justify-center bg-mist pb-20 pt-28">
      <div className="grid-20">
        <div className="grid-inner">
          <h2 className="display mt-3 text-[13vw] text-ink md:text-[7vw]">
            Get in <span className="text-sakura-deep">touch</span>
          </h2>

          <div className="mt-10 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            {siteData.socials.map((social) => {
              const Icon = iconMap[social.icon];
              return (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col justify-between gap-6 bg-mist px-5 py-6 transition-colors hover:bg-paper"
                >
                  <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-sakura transition-transform duration-300 group-hover:scale-x-100" />
                  {Icon && (
                    <Icon className="h-5 w-5 text-ink/70 transition-colors group-hover:text-sakura-deep" />
                  )}
                  <div>
                    <p className="display text-base text-ink">{social.name}</p>
                    <p className="mt-1 truncate font-mono text-[11px] text-gray">
                      {social.handle}
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
            <p className="max-w-sm text-sm text-gray">{siteData.profile.quote}</p>
          </div>
        </div>
      </div>

      {/* Marquee band, running the other way */}
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

function useDeckStages(length: number) {
  const [active, setActive] = useState(0);
  const lock = useRef(0);

  const go = useCallback(
    (next: number) => setActive(Math.max(0, Math.min(length - 1, next))),
    [length],
  );

  const step = useCallback(
    (delta: number) =>
      setActive((p) => Math.max(0, Math.min(length - 1, p + delta))),
    [length],
  );

  // Paging is deliberate: the nav and the arrow keys move the deck. Scrolling
  // belongs to the stages themselves — the wall and the games field keep their
  // own scroll containers, and a wheel gesture never turns a page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea/i.test(t.tagName)) return;
      const forward = ["ArrowDown", "PageDown", " "].includes(e.key);
      const back = ["ArrowUp", "PageUp"].includes(e.key);
      if (!forward && !back) return;
      e.preventDefault();
      if (Date.now() < lock.current) return;
      lock.current = Date.now() + 380;
      step(forward ? 1 : -1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  return { active, go };
}

/* Panels are ordinary sections stacked in the document, so the page scrolls
   natively and every panel responds to the wheel — no paging, no hijacking.
   Content fades in as it enters view. */

function Panels() {
  const panels: { label: string; node: ReactNode; dark: boolean }[] = [
    { label: "Index", node: <Hero />, dark: true },
    { label: "Projects", node: <ProjectsStage />, dark: false },
    { label: "Games", node: <GamesStage />, dark: false },
    { label: "Profile", node: <ProfileStage />, dark: false },
    { label: "Contact", node: <ContactStage />, dark: false },
  ];

  return (
    <>
      {panels.map((p) => (
        <section key={p.label} id={p.label.toLowerCase()} className="relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.08 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {p.node}
          </motion.div>
        </section>
      ))}
    </>
  );
}

export default function Deck() {
  const { dark, toggle } = useTheme();

  // Document scroll drives the top hairline now that the page scrolls for real.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  const stages = ["Index", "Projects", "Games", "Profile", "Contact"];

  // Dark hero underneath ⇒ white chrome; light sections ⇒ ink chrome.
  const overHero = useOverHero();
  const fg = overHero ? "text-white" : "text-ink";
  const dim = overHero ? "text-white/60" : "text-gray";

  return (
    <div className="relative w-full bg-paper">
      <Preloader />

      {/* Reading progress, pinned to the top edge */}
      <motion.div
        aria-hidden="true"
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-50 h-[3px] origin-left bg-sakura-deep"
      />

      <Panels />

      <header className="fixed inset-x-0 top-0 z-40">
        <div className="grid-20 py-6 md:py-7">
          <div className="grid-inner flex items-center justify-between">
            <a href="#index" className={`display text-sm transition-colors duration-300 ${fg}`}>
              dingyi222666
            </a>

            <div className="flex items-center gap-7">
              <nav className="hidden items-center gap-7 md:flex">
                {stages.map((label) => (
                  <a
                    key={label}
                    href={`#${label.toLowerCase()}`}
                    className={`group relative font-sans text-[11px] font-medium tracking-[0.14em] transition-colors duration-300 hover:opacity-100 ${dim}`}
                  >
                    {label}
                    <span className="absolute -bottom-1.5 left-0 block h-px w-full origin-left scale-x-0 bg-sakura-deep transition-transform duration-300 group-hover:scale-x-100" />
                  </a>
                ))}
              </nav>

              <button
                onClick={toggle}
                aria-label="Toggle colour theme"
                className={`flex h-7 w-7 items-center justify-center transition-colors duration-300 hover:text-sakura-deep ${fg}`}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
