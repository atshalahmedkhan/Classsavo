import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

const DUST_PARTICLES = [
  { left: '12%', bottom: '18%', delay: 0, duration: 9 },
  { left: '28%', bottom: '32%', delay: 1.2, duration: 10 },
  { left: '45%', bottom: '22%', delay: 2.4, duration: 8.5 },
  { left: '61%', bottom: '38%', delay: 0.8, duration: 11 },
  { left: '74%', bottom: '26%', delay: 3.1, duration: 9.5 },
  { left: '88%', bottom: '34%', delay: 1.8, duration: 10.5 },
] as const;

interface AuthPageBackgroundProps {
  children: ReactNode;
  className?: string;
}

export function AuthPageBackground({ children, className = '' }: AuthPageBackgroundProps) {
  return (
    <div className={`relative flex min-h-screen items-center justify-center overflow-hidden px-4 ${className}`}>
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-30"
        style={{
          backgroundImage: 'url(/images/study-room-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 bg-[#faf6f1]/50" />

      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-br from-[#f0c060]/10 to-transparent"
        animate={{ opacity: [0, 0.3, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {DUST_PARTICLES.map((particle, index) => (
        <motion.span
          key={index}
          aria-hidden
          className="pointer-events-none fixed -z-10 h-1 w-1 rounded-full bg-[#c2622a]"
          style={{ left: particle.left, bottom: particle.bottom }}
          animate={{ y: [0, -140], opacity: [0, 0.75, 0] }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        />
      ))}

      <motion.div
        className="relative z-10 w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
