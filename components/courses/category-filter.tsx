"use client";

import Link from "next/link";
import type { CourseCategory } from "@/lib/courses/categories";

interface CategoryFilterProps {
  categories: CourseCategory[];
  active?: string;
}

export function CategoryFilter({ categories, active }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/cursos"
        className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
          !active
            ? "bg-white/15 text-white"
            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
        }`}
      >
        Todos
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/cursos?category=${cat.slug}`}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
            active === cat.slug
              ? "bg-white/15 text-white"
              : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
          }`}
        >
          {cat.name}
          {cat.status === "coming_soon" && (
            <span className="ml-1 text-[10px] text-amber-400">soon</span>
          )}
        </Link>
      ))}
    </div>
  );
}
