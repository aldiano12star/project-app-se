"use server";

import { prisma } from "@/lib/prisma";

export async function getHallOfFameEntries(page: number = 1, pageSize: number = 10) {
  try {
    const skip = (page - 1) * pageSize;
    const [entries, totalCount] = await Promise.all([
      prisma.hallOfFame.findMany({
        orderBy: [{ generationYear: "desc" }, { archivedAt: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.hallOfFame.count(),
    ]);

    return {
      success: true,
      entries,
      totalCount,
      hasMore: skip + entries.length < totalCount,
    };
  } catch (error) {
    console.error("[HallOfFame] getHallOfFameEntries error:", error);
    return {
      success: false,
      entries: [],
      totalCount: 0,
      hasMore: false,
    };
  }
}
