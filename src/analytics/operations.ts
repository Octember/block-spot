import { type DailyStats, type PageViewSource } from "wasp/entities";
import { HttpError } from "wasp/server";
import { type GetDailyStats } from "wasp/server/operations";

type DailyStatsWithSources = DailyStats & {
  sources: PageViewSource[];
};

type DailyStatsValues = {
  dailyStats: DailyStatsWithSources;
  weeklyStats: DailyStatsWithSources[];
};

export const getDailyStats: GetDailyStats<void, DailyStatsValues> = async (
  _args,
  context,
) => {
  if (!context.user?.isAdmin) {
    console.log(`[ANALYTICS] Unauthorized attempt to access daily stats`);
    throw new HttpError(401);
  }

  console.log(`[ANALYTICS] Admin ${context.user.id} fetching daily stats`);
  const dailyStats = await context.entities.DailyStats.findFirst({
    orderBy: {
      date: "desc",
    },
    include: {
      sources: true,
    },
  });
  if (!dailyStats) {
    console.log(`[ANALYTICS] No daily stats available yet`);
    throw new HttpError(204, "No daily stats generated yet.");
  }

  console.log(`[ANALYTICS] Fetching weekly stats for the last 7 days`);
  const weeklyStats = await context.entities.DailyStats.findMany({
    orderBy: {
      date: "desc",
    },
    take: 7,
    include: {
      sources: true,
    },
  });

  return { dailyStats, weeklyStats };
};
