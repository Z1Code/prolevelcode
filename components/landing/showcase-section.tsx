"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "@/lib/i18n/language-provider";

const ChipScroll = dynamic(
  () => import("./chip-scroll").then((m) => ({ default: m.ChipScroll })),
  { ssr: false },
);

const FRAMES = Array.from({ length: 249 }, (_, i) =>
  `/sequence/ezgif-frame-${String(i + 1).padStart(3, "0")}.jpg`,
);

const titleContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18, delayChildren: 0.1 },
  },
};

const titleLine = {
  hidden: { y: 40, opacity: 0, filter: "blur(8px)" },
  visible: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export function ShowcaseSection() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Continuous parallax drift after entrance
  const parallaxY = useTransform(scrollYProgress, [0, 1], [20, -60]);

  return (
    <section ref={sectionRef} className="showcase-section">
      <div className="container-wide flex flex-col items-center">
        <motion.div style={{ y: parallaxY }}>
          <motion.h2
            className="showcase-title"
            variants={titleContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.span className="showcase-title-line" variants={titleLine}>
              {t.showcase.line1Prefix}{" "}
              <span className="showcase-title-accent">{t.showcase.line1Accent}</span>
            </motion.span>
            <motion.span className="showcase-title-line" variants={titleLine}>
              {t.showcase.line2}
            </motion.span>
          </motion.h2>
        </motion.div>

        <motion.div
          className="iphone-landscape"
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
            delay: 0.15,
          }}
        >
          <div className="iphone-body">
            <div className="iphone-edge-highlight" aria-hidden />
            <div className="iphone-btn-power" aria-hidden />
            <div className="iphone-btn-vol-up" aria-hidden />
            <div className="iphone-btn-vol-down" aria-hidden />
            <div className="iphone-btn-silent" aria-hidden />

            <div className="iphone-bezel">
              <div className="iphone-screen">
                <div className="iphone-dynamic-island" aria-hidden>
                  <div className="iphone-di-camera" />
                </div>
                <ChipScroll frames={FRAMES} fps={30} />
              </div>
            </div>
          </div>

          <div className="iphone-glow" aria-hidden />
        </motion.div>
      </div>
    </section>
  );
}
