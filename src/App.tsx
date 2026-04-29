import { motion, useScroll, useSpring, AnimatePresence } from "motion/react";
import { BookOpen, ChevronDown, Mail, Star, Sun, Moon } from "lucide-react";
import {
  SiGithub,
  SiX,
  SiNeteasecloudmusic,
  SiBilibili,
  SiTelegram,
  SiOsu,
} from "@icons-pack/react-simple-icons";
import { useRef, useState, useEffect, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import siteData from "./data.json";
import { SakuraCanvas } from "./components/SakuraCanvas";

const iconMap: Record<string, any> = {
  SiGithub,
  SiX,
  SiNeteasecloudmusic,
  SiBilibili,
  BookOpen,
  SiTelegram,
  SiOsu,
  Mail,
};

function ThemeToggle({
  isDark,
  onToggle,
}: {
  isDark: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="fixed top-6 right-6 z-50 p-2.5 rounded-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-sm transition-colors text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

const AnimatedBackground = () => {
  const backgroundImages = siteData.design?.backgroundImages;

  return (
    <div className="fixed inset-0 pointer-events-none -z-20">
      {/* Light mode anime bg (Makoto Shinkai style sky/city) */}
      <img
        src={backgroundImages?.light}
        alt="Anime Background Light"
        className="absolute inset-0 w-full h-full object-cover brightness-[0.78] saturate-[0.9] transition-opacity duration-1000 dark:opacity-0 opacity-100"
      />
      {/* Dark mode anime bg (Starry night landscape) */}
      <img
        src={backgroundImages?.dark}
        alt="Anime Background Dark"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 dark:opacity-100 opacity-0"
      />

      {/* Glassmorphism overlay to ensure UI legibility */}
      <div
        className={`absolute inset-0 bg-zinc-100/45 dark:bg-zinc-950/70 ${siteData.design?.glassmorphism?.blur || "backdrop-blur-sm"} transition-colors duration-1000`}
      />
    </div>
  );
};

export default function App() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );
    }
    return false;
  });
  const [clicks, setClicks] = useState<{ id: string; x: number; y: number }[]>(
    [],
  );

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleAvatarClick = (e: MouseEvent<HTMLDivElement>) => {
    const x = e.clientX;
    const y = e.clientY;
    const offset_x = (Math.random() - 0.5) * 20;

    const newClick = { id: crypto.randomUUID(), x: x + offset_x, y };
    setClicks((prev) => [...prev, newClick]);

    // Auto-remove after animation completes
    setTimeout(() => {
      setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
    }, 1000);
  };

  // Create a spring-based scrolling progress value
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div
      ref={scrollRef}
      className="h-[100dvh] w-full relative overflow-y-auto overflow-x-hidden snap-y snap-mandatory bg-transparent"
    >
      <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
      <AnimatedBackground />

      {/* Global Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-zinc-800 dark:bg-zinc-200 origin-left z-50 transform origin-left"
        style={{ scaleX }}
      />

      {siteData.design?.sakura?.enabled !== false && (
        <SakuraCanvas config={siteData.design?.sakura} isDark={isDark} />
      )}

      {/* --- Screen 1: Hero Section --- */}
      <section className="relative z-10 w-full min-h-[100dvh] flex flex-col items-center justify-center px-6 snap-start snap-always">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="mb-8"
        >
          <div
            className="relative group perspective-1000"
            onClick={handleAvatarClick}
          >
            <motion.img
              whileHover={{ rotateY: 10, rotateX: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              src={siteData.profile.avatar}
              alt={siteData.profile.name}
              className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover shadow-2xl border-4 border-white dark:border-zinc-900 bg-white dark:bg-zinc-900 z-10 relative cursor-pointer"
            />

            {/* The +1 Effects */}
            {createPortal(
              <AnimatePresence>
                {clicks.map((click) => (
                  <motion.div
                    key={click.id}
                    initial={{
                      opacity: 1,
                      y: 0,
                      scale: 0.5,
                    }}
                    animate={{ opacity: 0, y: -60, scale: 1.2 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="fixed text-xl font-bold text-zinc-900 dark:text-white z-[9999] pointer-events-none select-none drop-shadow-sm"
                    style={{
                      left: click.x + 15,
                      top: click.y,
                      textShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    }}
                  >
                    +1
                  </motion.div>
                ))}
              </AnimatePresence>,
              document.body,
            )}
          </div>
        </motion.div>

        {/* Minimalist Titles */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.2,
            type: "spring",
            bounce: 0.5,
            duration: 0.8,
          }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 drop-shadow-sm">
            {siteData.profile.name}
          </h1>
          <p className="text-sm md:text-base font-medium text-zinc-600 dark:text-zinc-400 tracking-wider">
            {siteData.profile.titles.join(" / ")}
          </p>
          <div className="flex flex-row flex-wrap justify-center gap-3 pt-6">
            {siteData.socials.map((link) => {
              const IconComponent = iconMap[link.icon];
              return (
                <a
                  key={link.name}
                  href={link.url}
                  title={link.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-11 h-11 rounded-full hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: link.color, color: "#fff" }}
                >
                  {IconComponent && <IconComponent className="w-5 h-5" />}
                </a>
              );
            })}
          </div>
        </motion.div>

        {/* Serene Anime Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-8 relative"
        >
          <div className="absolute inset-0 bg-white/40 dark:bg-black/20 blur-xl rounded-full -z-10" />
          <p className="font-serif text-lg md:text-xl text-zinc-600 dark:text-zinc-400 font-medium tracking-wide text-center px-6 py-2">
            {siteData.profile.quote}
          </p>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.a
          href="#projects"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{
            opacity: { delay: 1, duration: 0.4 },
            y: {
              delay: 1,
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors cursor-pointer"
        >
          <span className="text-[10px] tracking-[0.2em] uppercase mb-2 font-bold">
            Discover
          </span>
          <ChevronDown className="w-6 h-6" />
        </motion.a>
      </section>

      {/* --- Screen 2: Projects --- */}
      <section
        id="projects"
        className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-center items-center py-16 px-4 sm:px-6 snap-start snap-always"
      >
        <div className="max-w-5xl w-full mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {siteData.sections.projects}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
            {siteData.projects.map((project, idx) => (
              <motion.a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                key={project.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  type: "spring",
                  bounce: 0.4,
                  duration: 0.6,
                  delay: idx * 0.05,
                }}
                className="group flex flex-col p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/40 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors duration-300 w-full text-left shadow-sm backdrop-blur-sm h-full"
              >
                <div className="flex flex-col gap-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate pr-2">
                      {project.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div
                        className="w-2 h-2 rounded-full shadow-sm"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                        {project.language}
                      </span>
                    </div>
                  </div>
                  {project.role && (
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-md w-fit">
                      {project.role}
                    </span>
                  )}
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-grow mb-5 leading-relaxed line-clamp-3">
                  {project.description}
                </p>

                {project.techStack && (
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 rounded-md bg-zinc-100/80 dark:bg-zinc-800 text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-500 font-mono font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* --- Screen 3: Now & Skills --- */}
      <section
        id="now"
        className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-center items-center py-16 px-4 sm:px-6 snap-start snap-always"
      >
        <div className="max-w-5xl w-full mx-auto">
          <div className="flex flex-col md:flex-row gap-16 lg:gap-24 w-full">
            {/* Now Section (List style, no nested cards) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
              className="flex-1 w-full flex flex-col"
            >
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">
                  <Star className="w-7 h-7 text-yellow-500 fill-yellow-500/20" />
                  {siteData.sections.currently}
                </h2>
                <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 mt-2 font-medium">
                  {siteData.sections.currentlyDesc}
                </p>
              </div>

              <div className="flex flex-col gap-6">
                {siteData.now.map((item, idx) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-4 group"
                  >
                    <div className="w-1.5 h-1.5 mt-2 rounded-full bg-zinc-400 dark:bg-zinc-500 group-hover:bg-blue-500 group-hover:scale-150 transition-all duration-300 shadow-sm flex-shrink-0" />
                    <p className="text-base text-zinc-800 dark:text-zinc-200 font-medium tracking-wide leading-relaxed">
                      {item}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Separator for desktop */}
            <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-zinc-300/80 dark:via-zinc-700/80 to-transparent" />

            {/* Skills Section (Clean bento tags) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                type: "spring",
                bounce: 0.4,
                duration: 0.8,
                delay: 0.2,
              }}
              className="flex-[1.2] w-full flex flex-col"
            >
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">
                  <BookOpen className="w-7 h-7 text-blue-500" />
                  {siteData.sections.expertise}
                </h2>
                <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 mt-2 font-medium">
                  {siteData.sections.expertiseDesc}
                </p>
              </div>

              <div className="space-y-8">
                {siteData.skills.map((group, idx) => (
                  <motion.div
                    key={group.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                  >
                    <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-4">
                      {group.name}
                    </h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      {group.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center before:content-[''] before:inline-block before:w-1 before:h-1 before:rounded-full before:bg-zinc-300 dark:before:bg-zinc-600 before:mr-2"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Screen 4: Details & Socials --- */}
      <section
        id="about"
        className="relative z-10 w-full min-h-[100dvh] flex flex-col justify-between pt-16 snap-start snap-always"
      >
        <div className="max-w-4xl w-full mx-auto px-6 py-12 flex-grow flex flex-col justify-center">
          {/* Biography */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight pb-2 border-b border-zinc-200 dark:border-zinc-800">
              {siteData.profile.about.title}
            </h2>
            <div className="space-y-4 text-zinc-700 dark:text-zinc-300 text-sm md:text-base leading-relaxed mix-blend-normal">
              <p
                className="font-medium text-base mb-6 text-zinc-800 dark:text-zinc-200"
                dangerouslySetInnerHTML={{
                  __html: siteData.profile.about.introHtml,
                }}
              />

              <ul className="space-y-3 list-disc pl-5">
                {siteData.profile.about.items.map((item, idx) => (
                  <li key={idx}>
                    <span dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
        {/* Footer attached to the bottom of the About section screen */}
        <footer className="w-full py-8 flex flex-col items-center bg-transparent relative z-10 border-t border-zinc-200/50 dark:border-zinc-800/50 mt-auto">
          <p className="font-mono text-xs text-zinc-400 dark:text-zinc-500 tracking-[0.1em] uppercase px-6 text-center leading-relaxed">
            © {new Date().getFullYear()} DINGYI
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> · </span>Built with Care
          </p>
        </footer>
      </section>
    </div>
  );
}
