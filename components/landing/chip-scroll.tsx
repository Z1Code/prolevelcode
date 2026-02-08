"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BG_COLOR = "#000000";

interface ChipScrollProps {
  frames: string[];
  fps?: number;
}

export function ChipScroll({ frames, fps = 4 }: ChipScrollProps) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const frameRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  // Preload all images
  useEffect(() => {
    if (frames.length === 0) return;

    let loadedCount = 0;
    const images: HTMLImageElement[] = [];

    for (let i = 0; i < frames.length; i++) {
      const img = new Image();
      img.src = frames[i];

      img.onload = () => {
        loadedCount++;
        setLoadProgress(loadedCount / frames.length);
        if (loadedCount === frames.length) {
          imagesRef.current = images;
          setIsLoading(false);
        }
      };

      img.onerror = () => {
        loadedCount++;
        setLoadProgress(loadedCount / frames.length);
        if (loadedCount === frames.length) {
          imagesRef.current = images;
          setIsLoading(false);
        }
      };

      images[i] = img;
    }
  }, [frames]);

  // Draw frame to canvas — cover mode
  const drawFrame = useCallback((frameIndex: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const images = imagesRef.current;
    const img = images[frameIndex];

    if (!canvas || !ctx || !img || !img.complete || img.naturalWidth === 0) return;

    const container = canvasContainerRef.current;
    const dpr = window.devicePixelRatio || 1;
    const width = container?.clientWidth || 800;
    const height = container?.clientHeight || 600;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    // Cover-fit: fill container while maintaining aspect ratio
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const containerRatio = width / height;

    let drawW: number, drawH: number, drawX: number, drawY: number;

    if (containerRatio > imgRatio) {
      drawW = width;
      drawH = width / imgRatio;
      drawX = 0;
      drawY = (height - drawH) / 2;
    } else {
      drawH = height;
      drawW = height * imgRatio;
      drawX = (width - drawW) / 2;
      drawY = 0;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }, []);

  // Auto-play animation loop
  useEffect(() => {
    if (isLoading || imagesRef.current.length === 0) return;

    let animationFrame: number;
    const frameDuration = 1000 / fps;
    let lastFrameTime = Date.now();

    // Draw first frame immediately
    drawFrame(0);

    const animate = () => {
      const now = Date.now();
      const elapsed = now - lastFrameTime;

      if (elapsed >= frameDuration) {
        lastFrameTime = now - (elapsed % frameDuration);
        const nextFrame = (frameRef.current + 1) % frames.length;
        frameRef.current = nextFrame;
        drawFrame(nextFrame);
      }

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isLoading, drawFrame, fps, frames.length]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => drawFrame(frameRef.current);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawFrame]);

  return (
    <div ref={canvasContainerRef} className="absolute inset-0">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center"
            style={{ backgroundColor: BG_COLOR }}
          >
            <div className="relative h-1 w-32 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${loadProgress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
