import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  Menu,
  X,
  ArrowRight,
  Lock,
  Pencil,
  FolderOpen,
  BookOpen,
  Timer,
  MessageCircle,
} from 'lucide-react';

const SERIF = '"Playfair Display", Georgia, "Times New Roman", serif';
const SANS = '"DM Sans", Inter, system-ui, sans-serif';
const CREAM = '#fdfaf3';
const ORANGE = '#c2410c';
const ORANGE_BTN = '#d4622a';
const NAVY = '#1c1917';
const MUTED = '#78716c';

/* ─── Utilities ─── */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={fadeUp}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Logo({
  className = '',
  light = false,
  large = false,
  hoverGlow = false,
}: {
  className?: string;
  light?: boolean;
  large?: boolean;
  hoverGlow?: boolean;
}) {
  const orbShadow = light
    ? 'shadow-[0_0_0_3px_rgba(255,255,255,0.15),0_0_0_4px_rgba(194,65,12,0.2)] group-hover:shadow-[0_0_0_3px_rgba(255,255,255,0.2),0_0_10px_rgba(212,98,42,0.65),0_0_20px_rgba(212,132,90,0.4)]'
    : 'shadow-[0_0_0_3px_#fdfaf3,0_0_0_4px_rgba(194,65,12,0.2)] group-hover:shadow-[0_0_0_3px_#fdfaf3,0_0_10px_rgba(212,98,42,0.6),0_0_20px_rgba(212,132,90,0.35)]';

  return (
    <div
      className={`flex items-center gap-2.5 ${hoverGlow ? 'group cursor-default transition-all duration-300 ease-in-out hover:scale-[1.03]' : ''} ${className}`}
    >
      <div
        className={`shrink-0 rounded-full transition-all duration-300 ease-in-out ${large ? 'h-3.5 w-3.5' : 'h-3 w-3'} ${hoverGlow ? `group-hover:scale-105 ${orbShadow}` : ''}`}
        style={{
          background: ORANGE,
          ...(hoverGlow
            ? {}
            : {
                boxShadow: light
                  ? '0 0 0 3px rgba(255,255,255,0.15), 0 0 0 4px rgba(194,65,12,0.2)'
                  : `0 0 0 3px ${CREAM}, 0 0 0 4px ${ORANGE}33`,
              }),
        }}
      />
      <span
        className={`font-bold transition-all duration-300 ease-in-out ${large ? 'text-2xl sm:text-3xl' : 'text-xl'} ${hoverGlow ? 'group-hover:[text-shadow:0_0_12px_rgba(212,98,42,0.55),0_0_24px_rgba(212,132,90,0.35)]' : ''}`}
        style={{ fontFamily: SERIF, color: light ? '#ffffff' : NAVY }}
      >
        Lumio
      </span>
    </div>
  );
}

const NAV_LINKS = [
  { label: 'Features', id: 'instructors' },
  { label: 'How it Works', id: 'how-it-works' },
  { label: 'For Students', id: 'students' },
  { label: 'For Instructors', id: 'instructors' },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/* ─── SVG Illustrations ─── */

function MapleLeaf({ color = '#ea580c', size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 16 20" fill="none">
      <path
        d="M8 1 C11 5 14 8 8 19 C2 8 5 5 8 1 Z"
        fill={color}
        opacity={0.9}
      />
    </svg>
  );
}

function HeroDoorwayImage({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div
        className="overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-[0_8px_40px_rgba(0,0,0,0.08)]"
        style={{ border: '1px solid #f5f5f4' }}
      >
        <img
          src="/images/hero-doorway-tree.png"
          alt="Autumn Japanese garden viewed through open doors"
          className="w-full rounded-[1.25rem] object-cover"
        />
      </div>
      <div
        className="absolute -bottom-4 left-6 rounded-full bg-white px-5 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        style={{ border: '1px solid #f5f5f4' }}
      >
        <p className="text-sm" style={{ fontFamily: SANS, color: MUTED }}>
          Open the door to{' '}
          <span className="font-semibold italic" style={{ fontFamily: SERIF, color: NAVY }}>
            better learning
          </span>
        </p>
      </div>
    </div>
  );
}

function CtaAnimatedBackground() {
  const snowflakes = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 8,
        duration: 6 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 40,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Background image — slow zoom */}
      <motion.img
        src="/images/cta-background.png"
        alt=""
        aria-hidden
        className="h-full w-full object-cover"
        style={{
          filter: 'saturate(0.55) brightness(0.72) hue-rotate(15deg) contrast(1.08)',
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Warm amber frost overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2c1810]/55 via-[#c2622a]/35 to-[#d4845a]/25" />

      {/* Pulsing moon/sun glow — top right */}
      <motion.div
        className="absolute -right-8 top-4 h-40 w-40 rounded-full sm:h-56 sm:w-56"
        style={{
          background: 'radial-gradient(circle, rgba(212,132,90,0.35) 0%, rgba(194,98,42,0.12) 45%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Drifting mist layers */}
      <motion.div
        className="absolute bottom-0 left-0 h-2/3 w-full"
        style={{
          background: 'linear-gradient(to top, rgba(212,132,90,0.2) 0%, transparent 70%)',
          filter: 'blur(24px)',
        }}
        animate={{ x: ['-5%', '5%', '-5%'], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-0 left-0 h-1/2 w-[120%]"
        style={{
          background: 'linear-gradient(to top, rgba(250,246,241,0.15) 0%, transparent 60%)',
          filter: 'blur(32px)',
        }}
        animate={{ x: ['3%', '-8%', '3%'], opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Falling snow */}
      <div className="pointer-events-none absolute inset-0">
        {snowflakes.map((flake) => (
          <motion.div
            key={flake.id}
            className="absolute rounded-full bg-white"
            style={{
              left: flake.left,
              top: '-4%',
              width: flake.size,
              height: flake.size,
              boxShadow: '0 0 4px rgba(255,255,255,0.8)',
            }}
            animate={{
              y: ['0vh', '110vh'],
              x: [0, flake.drift, flake.drift * 0.5],
              opacity: [0, 0.9, 0.9, 0],
            }}
            transition={{
              duration: flake.duration,
              delay: flake.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Vignette for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#2c1810]/40 via-transparent to-[#2c1810]/20" />
    </div>
  );
}

/* ─── Cards ─── */

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
        <Icon className="h-5 w-5" style={{ color: ORANGE }} strokeWidth={1.75} />
      </div>
      <h3 className="mb-1.5 text-base font-semibold" style={{ fontFamily: SANS, color: NAVY }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ fontFamily: SANS, color: MUTED }}>
        {description}
      </p>
    </div>
  );
}

/* ─── Page ─── */

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (id: string) => {
    setMobileOpen(false);
    scrollToSection(id);
  };

  const floatingLeaves = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => ({
        id: i,
        x: 55 + i * 12,
        y: 20 + i * 15,
        delay: i * 2,
        duration: 6 + i,
      })),
    [],
  );

  return (
    <div className="min-h-screen" style={{ background: CREAM, fontFamily: SANS, color: NAVY }}>
      {/* ── Navbar ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-stone-200/80 bg-[#fdfaf3]/90 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-5 py-4 lg:px-8">
          <Logo />
          <nav className="hidden items-center justify-center gap-7 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.id)}
                className="relative text-sm transition-all duration-200 ease-in-out after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#c2622a] after:transition-all after:duration-300 hover:text-stone-900 hover:after:w-full"
                style={{ color: MUTED }}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className="hidden items-center justify-end gap-3 md:flex">
            <Link
              to="/login"
              className="relative px-4 py-2 text-sm font-medium text-[#1c1917] transition-all duration-200 ease-in-out after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#c2622a] after:transition-all after:duration-300 hover:text-[#c2622a] hover:after:w-full"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full px-5 py-2 text-sm font-medium text-white shadow-[0_4px_14px_rgba(194,65,12,0.35)] transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md hover:shadow-amber-300"
              style={{ background: ORANGE_BTN }}
            >
              Get Started
            </Link>
          </div>
          <button
            className="col-start-3 justify-self-end rounded-lg p-2 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-stone-200 bg-[#fdfaf3]/95 backdrop-blur-md md:hidden">
            <nav className="flex flex-col gap-1 px-5 py-3">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link.id)}
                  className="rounded-lg px-3 py-2.5 text-left text-sm hover:bg-stone-100"
                  style={{ color: MUTED }}
                >
                  {link.label}
                </button>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-stone-200 pt-3">
                <Link to="/login" className="px-3 py-2.5 text-sm font-medium" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full py-2.5 text-center text-sm font-medium text-white"
                  style={{ background: ORANGE_BTN }}
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-16 lg:pb-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
          {/* Left */}
          <div>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="mb-5 flex items-center gap-3"
            >
              <div className="h-px w-8" style={{ background: ORANGE }} />
              <span className="text-[11px] font-medium tracking-[0.16em]" style={{ color: ORANGE }}>
                MODERN LEARNING FOR STUDENTS &amp; EDUCATORS
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-5 text-[2.5rem] font-bold leading-[1.12] sm:text-5xl lg:text-[3.25rem]"
              style={{ fontFamily: SERIF, color: NAVY }}
            >
              The smarter way to{' '}
              <span style={{ color: ORANGE }}>learn and teach</span>
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mb-8 max-w-md text-base leading-relaxed"
              style={{ color: MUTED }}
            >
              Lumio brings instructors and students together with powerful course tools, real-time
              progress tracking, and seamless communication.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mb-12 flex flex-wrap gap-3"
            >
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_20px_rgba(194,65,12,0.35)] transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-amber-200"
                style={{ background: ORANGE_BTN }}
              >
                Start as Student
                <ArrowRight className="h-4 w-4 transition-all duration-200 ease-in-out group-hover:translate-x-1" />
              </Link>
              <Link
                to="/register"
                className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-[#1c1917] transition-all duration-200 ease-in-out hover:border-[#c2622a] hover:bg-[#c2622a] hover:text-white"
              >
                Start as Instructor
              </Link>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-wrap gap-10"
            >
              {[
                { value: '2', label: 'roles, one platform' },
                { value: '100%', label: 'role-based access' },
                { value: 'Real-time', label: 'progress tracking', small: true },
              ].map((s) => (
                <div key={s.label}>
                  <p
                    className={`font-bold ${s.small ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'}`}
                    style={{ fontFamily: SERIF, color: NAVY }}
                  >
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-sm" style={{ color: MUTED }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — doorway illustration */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
          >
            <HeroDoorwayImage />
            {floatingLeaves.map((l) => (
              <motion.div
                key={l.id}
                className="pointer-events-none absolute"
                style={{ left: `${l.x}%`, top: `${l.y}%` }}
                animate={{ y: [0, 60, 120], x: [0, 15, -10], rotate: [0, 90, 180], opacity: [0.8, 1, 0] }}
                transition={{ duration: l.duration, delay: l.delay, repeat: Infinity, ease: 'easeInOut' }}
              >
                <MapleLeaf color="#ea580c" size={14} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Journey Banner ── */}
      <section className="px-5 pb-20 lg:px-8">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] shadow-[0_8px_40px_rgba(0,0,0,0.08)]">
          <div className="aspect-[3.5/1] min-h-[200px] w-full sm:min-h-[260px]">
            <img
              src="/images/journey-banner.png"
              alt="Sunset valley landscape with torii gate"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/50 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12 lg:px-16">
            <Reveal>
              <h2
                className="mb-3 max-w-lg text-2xl font-bold text-white sm:text-3xl lg:text-4xl"
                style={{ fontFamily: SERIF }}
              >
                Every great journey starts with a single step
              </h2>
              <p className="max-w-md text-sm text-white/85 sm:text-base">
                Guide your students down a clear path — from first lesson to final milestone.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── For Instructors ── */}
      <section id="instructors" className="px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <div className="overflow-hidden rounded-[1.75rem] shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
              <img
                src="/images/instructors-pagoda.png"
                alt="Traditional pavilion by a lake surrounded by autumn trees"
                className="w-full object-cover"
              />
            </div>
          </Reveal>
          <div className="order-1 lg:order-2">
            <Reveal>
              <p className="mb-3 text-xs font-semibold tracking-[0.18em]" style={{ color: ORANGE }}>
                FOR INSTRUCTORS
              </p>
              <h2
                className="mb-8 text-3xl font-bold sm:text-4xl"
                style={{ fontFamily: SERIF, color: NAVY }}
              >
                Everything you need to build great courses
              </h2>
            </Reveal>
            <div className="space-y-4">
              {[
                {
                  icon: Pencil,
                  title: 'Rich Text Editor',
                  description:
                    'Plate.js powered chapter editor with H1, H2, bold, and italic formatting.',
                },
                {
                  icon: FolderOpen,
                  title: 'File Uploads',
                  description:
                    'Attach PDFs, documents, and images directly to any chapter for students to read in-browser.',
                },
                {
                  icon: Lock,
                  title: 'Access Codes',
                  description:
                    'Every course gets a unique auto-generated code — only students with the code can enroll.',
                },
              ].map((card, i) => (
                <Reveal key={card.title} delay={i * 0.1}>
                  <FeatureCard icon={card.icon} title={card.title} description={card.description} />
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── For Students ── */}
      <section id="students" className="px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal>
              <p className="mb-3 text-xs font-semibold tracking-[0.18em]" style={{ color: ORANGE }}>
                FOR STUDENTS
              </p>
              <h2
                className="mb-8 text-3xl font-bold sm:text-4xl"
                style={{ fontFamily: SERIF, color: NAVY }}
              >
                Learn at your own pace, track every step
              </h2>
            </Reveal>
            <div className="space-y-4">
              {[
                {
                  icon: BookOpen,
                  title: 'Course Catalog',
                  description: 'Browse and join courses instantly with a simple access code.',
                },
                {
                  icon: Timer,
                  title: 'Reading Tracker',
                  description:
                    'A smart timer tracks your real, active reading time — not idle tabs.',
                },
                {
                  icon: MessageCircle,
                  title: 'Message Instructors',
                  description:
                    'Direct one-on-one messaging with your teacher whenever you need help.',
                },
              ].map((card, i) => (
                <Reveal key={card.title} delay={i * 0.1}>
                  <FeatureCard icon={card.icon} title={card.title} description={card.description} />
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal delay={0.15}>
            <div className="overflow-hidden rounded-[1.75rem] shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
              <img
                src="/images/students-landscape.png"
                alt="Serene Japanese garden at sunset with cherry blossoms"
                className="w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <Reveal>
              <p className="mb-3 text-xs font-semibold tracking-[0.18em]" style={{ color: ORANGE }}>
                HOW IT WORKS
              </p>
              <h2
                className="mb-10 text-3xl font-bold sm:text-4xl"
                style={{ fontFamily: SERIF, color: NAVY }}
              >
                Up and running in 3 steps
              </h2>
            </Reveal>
            <div className="space-y-8">
              {[
                {
                  num: '1',
                  title: 'Instructor creates a course',
                  description:
                    'Adds chapters, uploads materials, and sets visibility — all in one place.',
                },
                {
                  num: '2',
                  title: 'Student joins with access code',
                  description: 'Instant enrollment, no approval needed. Just enter the code and start.',
                },
                {
                  num: '3',
                  title: 'Learn and track progress',
                  description:
                    'Read chapters, complete assignments, and message instructors directly.',
                },
              ].map((step, i) => (
                <Reveal key={step.num} delay={i * 0.1}>
                  <div className="flex gap-4">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: ORANGE_BTN }}
                    >
                      {step.num}
                    </div>
                    <div>
                      <h3
                        className="mb-1 text-lg font-semibold"
                        style={{ fontFamily: SERIF, color: NAVY }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
          <Reveal delay={0.15}>
            <div className="overflow-hidden rounded-[1.75rem] shadow-[0_8px_40px_rgba(0,0,0,0.07)]">
              <img
                src="/images/how-it-works-pagoda.png"
                alt="Japanese pagoda and red bridge reflected in a pond at sunset"
                className="w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA + Footer ── */}
      <section className="relative min-h-[500px] w-full overflow-hidden py-32">
        <div className="absolute inset-0">
          <CtaAnimatedBackground />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#2c1810]/30 to-[#2c1810]/20" />
        <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
          <Reveal>
            <h2
              className="mb-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl"
              style={{ fontFamily: SERIF }}
            >
              Ready to experience Lumio?
            </h2>
            <p className="mx-auto mb-8 max-w-md text-sm text-white/85 sm:text-base">
              Join as a student or set up your first course as an instructor today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-opacity hover:opacity-90"
                style={{ background: ORANGE_BTN }}
              >
                Get Started as Student
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="rounded-full border-2 border-white/90 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Get Started as Instructor
              </Link>
            </div>
          </Reveal>
          <div className="mt-28 flex max-w-4xl flex-col items-center text-center">
            <Logo className="mb-4" light large hoverGlow />
            <p className="text-sm text-white/80">
              Built for students. Designed for educators.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
