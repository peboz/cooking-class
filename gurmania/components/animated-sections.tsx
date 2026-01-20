"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  variants?: "fadeInUp" | "stagger" | "fade" | "scale";
  delay?: number;
}

export function AnimatedSection({
  children,
  className,
  variants = "fadeInUp",
  delay = 0,
}: AnimatedSectionProps) {
  const getVariants = () => {
    switch (variants) {
      case "fadeInUp":
        return fadeInUp;
      case "stagger":
        return staggerContainer;
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.6, delay },
        };
      case "scale":
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.6, delay },
        };
      default:
        return fadeInUp;
    }
  };

  if (variants === "stagger") {
    return (
      <motion.div
        className={className}
        initial="initial"
        animate="animate"
        variants={staggerContainer}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div className={className} {...getVariants()}>
      {children}
    </motion.div>
  );
}

export function AnimatedViewSection({
  children,
  className,
  variants = "fadeInUp",
}: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      variants={variants === "stagger" ? staggerContainer : fadeInUp}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedNav({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.nav>
  );
}

export function AnimatedItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeInUp}>
      {children}
    </motion.div>
  );
}
