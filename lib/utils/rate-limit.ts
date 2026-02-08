import { prisma } from "@/lib/prisma";

export async function assertRateLimit(route: string, actorKey: string, maxHits: number, windowSeconds: number) {
  try {
    await prisma.rateLimitEvent.create({
      data: { route, actor_key: actorKey },
    });

    const cutoff = new Date(Date.now() - windowSeconds * 1000);
    const count = await prisma.rateLimitEvent.count({
      where: {
        route,
        actor_key: actorKey,
        created_at: { gte: cutoff },
      },
    });

    return count <= maxHits;
  } catch {
    return false;
  }
}
