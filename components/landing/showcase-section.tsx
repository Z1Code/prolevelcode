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

export function ShowcaseSection() {
  const { lang } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Parallax: title moves slower than scroll (60 → -40px)
  const titleY = useTransform(scrollYProgress, [0, 0.5], [60, -40]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.18], [0, 1]);

  return (
    <section ref={sectionRef} className="showcase-section">
      <div className="container-wide flex flex-col items-center">
        {/* Title with scroll-linked parallax */}
        <motion.h2
          className="showcase-title"
          style={{ y: titleY, opacity: titleOpacity }}
        >
          {lang === "es" ? (
            <>
              Programa <span className="showcase-title-accent">web/móvil</span>
              <br />
              de nivel profesional.
            </>
          ) : (
            <>
              Professional-grade
              <br />
              <span className="showcase-title-accent">web/mobile</span> development.
            </>
          )}
        </motion.h2>

        {/* iPhone with reveal animation */}
        <motion.div
          className="iphone-landscape"
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
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
