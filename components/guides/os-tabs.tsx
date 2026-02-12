"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Apple } from "lucide-react";
import type { OsCommand } from "@/lib/guides/types";
import { CodeBlockDisplay } from "./code-block-display";

const STORAGE_KEY = "plc-os-preference";

function detectOs(): "windows" | "mac" {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "mac";
  return "windows";
}

export function OsTabs({ commands }: { commands: OsCommand }) {
  const [os, setOs] = useState<"windows" | "mac">("windows");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as "windows" | "mac" | null;
    setOs(stored ?? detectOs());
  }, []);

  const handleSwitch = (newOs: "windows" | "mac") => {
    setOs(newOs);
    localStorage.setItem(STORAGE_KEY, newOs);
  };

  return (
    <div>
      <div className="mb-3 flex gap-1.5">
        <button
          type="button"
          onClick={() => handleSwitch("windows")}
          className={`guide-os-tab inline-flex items-center gap-1.5 ${
            os === "windows" ? "guide-os-tab-active" : "guide-os-tab-inactive"
          }`}
        >
          <Monitor className="h-3.5 w-3.5" />
          Windows
        </button>
        <button
          type="button"
          onClick={() => handleSwitch("mac")}
          className={`guide-os-tab inline-flex items-center gap-1.5 ${
            os === "mac" ? "guide-os-tab-active" : "guide-os-tab-inactive"
          }`}
        >
          <Apple className="h-3.5 w-3.5" />
          Mac
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={os}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          <CodeBlockDisplay
            codeBlock={{
              language: "bash",
              code: commands[os],
              filename: os === "windows" ? "PowerShell" : "Terminal",
            }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
