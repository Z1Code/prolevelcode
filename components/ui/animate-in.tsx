"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

/**
 * Staggered fade-in wrapper. Wrap children in <AnimateIn> for entrance animations.
 * Use `delay` for manual stagger or wrap multiple in a parent with staggerChildren.
 */

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const fadeIn = {
  hidden: { opacity: 0, filter: "blur(4px)" },
  visible: { opacity: 1, filter: "blur(0px)" },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(6px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)" },
};

const slideRight = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const variants = { fadeUp, fadeIn, scaleIn, slideRight };

interface AnimateInProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  variant?: keyof typeof variants;
  delay?: number;
  duration?: number;
  children: React.ReactNode;
}

export function AnimateIn({
  variant = "fadeUp",
  delay = 0,
  duration = 0.5,
  children,
  className,
  ...rest
}: AnimateInProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants[variant]}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger container — wraps children that each have their own motion variants.
 */
interface StaggerContainerProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  stagger?: number;
  delay?: number;
  children: React.ReactNode;
}

export function StaggerContainer({
  stagger = 0.08,
  delay = 0,
  children,
  className,
  ...rest
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual stagger child — use inside StaggerContainer.
 */
interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  variant?: keyof typeof variants;
  duration?: number;
  children: React.ReactNode;
}

export function StaggerItem({
  variant = "fadeUp",
  duration = 0.45,
  children,
  className,
  ...rest
}: StaggerItemProps) {
  return (
    <motion.div
      variants={variants[variant]}
      transition={{
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
