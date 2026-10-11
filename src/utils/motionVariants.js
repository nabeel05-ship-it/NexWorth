/**
 * NexWorth Premium Motion Design System
 * Built on official Motion for React (motion/react)
 *
 * Design Guidelines:
 * - Restrained, purposeful easing curves for fintech trust
 * - Micro-interactions (100–180ms) for immediate responsiveness
 * - Entrances (250–350ms) with subtle stagger
 * - Strict reduced-motion fallbacks for accessibility
 */

export const EASE_FINTECH = [0.16, 1, 0.3, 1]; // Premium cubic-bezier
export const EASE_SMOOTH = [0.22, 1, 0.36, 1];

export const SPRING_PREMIUM = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
};

export const SPRING_GENTLE = {
  type: 'spring',
  stiffness: 300,
  damping: 26,
};

export const SPRING_TAP = {
  type: 'spring',
  stiffness: 500,
  damping: 35,
};

// ==========================================
// Page Transitions
// ==========================================
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: EASE_FINTECH },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};

export const pageVariantsReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

// ==========================================
// Stagger & List Entrances
// ==========================================
export const staggerContainer = (staggerChildren = 0.05, delayChildren = 0.02) => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const fadeInUp = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_FINTECH },
  },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.22, ease: 'easeOut' } },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.28, ease: EASE_FINTECH },
  },
};

// ==========================================
// Card & Container Interactions
// ==========================================
export const cardHoverProps = {
  whileHover: {
    y: -2.5,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.07)',
    transition: { duration: 0.18, ease: EASE_FINTECH },
  },
  whileTap: {
    scale: 0.995,
    transition: { duration: 0.1 },
  },
};

export const cardSubtleHover = {
  whileHover: {
    y: -2,
    transition: { duration: 0.18, ease: EASE_FINTECH },
  },
};

// ==========================================
// Buttons & Interactive Controls
// ==========================================
export const buttonClickProps = {
  whileHover: {
    scale: 1.02,
    transition: { duration: 0.14, ease: EASE_FINTECH },
  },
  whileTap: {
    scale: 0.97,
    transition: { duration: 0.08, ease: 'easeOut' },
  },
};

export const iconButtonProps = {
  whileHover: {
    scale: 1.08,
    transition: { duration: 0.12 },
  },
  whileTap: {
    scale: 0.92,
    transition: { duration: 0.08 },
  },
};

export const pillToggleProps = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.97 },
};

// ==========================================
// Modals & Overlays
// ==========================================
export const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalDialogVariants = {
  initial: { opacity: 0, scale: 0.96, y: 16 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.26, ease: EASE_FINTECH },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 10,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};

// ==========================================
// Notifications & Toasts
// ==========================================
export const toastVariants = {
  initial: { opacity: 0, y: -16, scale: 0.92 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_PREMIUM,
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.95,
    transition: { duration: 0.16, ease: 'easeIn' },
  },
};

// ==========================================
// Mobile Sidebar Drawer
// ==========================================
export const mobileDrawerVariants = {
  closed: {
    x: '-100%',
    transition: { duration: 0.24, ease: [0.4, 0, 1, 1] },
  },
  open: {
    x: 0,
    transition: { duration: 0.28, ease: EASE_FINTECH },
  },
};
