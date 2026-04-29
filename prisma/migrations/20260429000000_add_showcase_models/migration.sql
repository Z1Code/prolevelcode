-- CreateTable
CREATE TABLE "public"."showcase_projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "app_url" TEXT,
    "tech_tags" TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "showcase_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."showcase_videos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "bunny_video_id" TEXT NOT NULL,
    "bunny_thumbnail_url" TEXT,
    "duration_minutes" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "showcase_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "showcase_projects_slug_key" ON "public"."showcase_projects"("slug");

-- CreateIndex
CREATE INDEX "showcase_videos_project_id_sort_order_idx" ON "public"."showcase_videos"("project_id", "sort_order");

-- AddForeignKey
ALTER TABLE "public"."showcase_videos" ADD CONSTRAINT "showcase_videos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."showcase_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
