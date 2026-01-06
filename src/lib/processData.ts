import { SpotifyStreamEntry, WeeklyData, ProcessedData } from "./types";
import * as d3 from "d3";

export function processSpotifyData(
  entries: SpotifyStreamEntry[],
  year: number = 2025,
  topN: number = 40,
  mode: "artists" | "songs" = "songs"
): ProcessedData {
  // Filter to the specified year and valid entries
  const yearEntries = entries.filter((entry) => {
    const date = new Date(entry.endTime);
    return date.getFullYear() === year && entry.msPlayed > 30000; // At least 30 seconds
  });

  // Generate all weeks for the year
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const weeks = d3.timeWeeks(startDate, endDate);

  // Group by artist or song and week
  const itemWeekMap = new Map<string, { weekMap: Map<number, number>; artist?: string }>();

  yearEntries.forEach((entry) => {
    const date = new Date(entry.endTime);
    const weekStart = d3.timeWeek.floor(date);
    const weekIndex = weeks.findIndex(
      (w) => w.getTime() === weekStart.getTime()
    );

    if (weekIndex === -1) return;

    // Use track name + artist as key for songs to differentiate same-named songs
    const key = mode === "artists"
      ? entry.artistName
      : `${entry.trackName}|||${entry.artistName}`;

    if (!itemWeekMap.has(key)) {
      itemWeekMap.set(key, {
        weekMap: new Map(),
        artist: mode === "songs" ? entry.artistName : undefined
      });
    }

    const item = itemWeekMap.get(key)!;
    const current = item.weekMap.get(weekIndex) || 0;
    item.weekMap.set(weekIndex, current + entry.msPlayed / 60000); // Convert to minutes
  });

  // Convert to array format and calculate totals
  const itemsData: WeeklyData[] = [];

  itemWeekMap.forEach((item, key) => {
    const data = weeks.map((week, i) => ({
      week,
      minutes: item.weekMap.get(i) || 0,
    }));

    const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0);
    const peakMinutes = Math.max(...data.map((d) => d.minutes));

    // Extract display label
    const label = mode === "artists" ? key : key.split("|||")[0];

    itemsData.push({
      label,
      artist: item.artist,
      data,
      totalMinutes,
      peakMinutes,
    });
  });

  // Sort by total listening time and take top N
  itemsData.sort((a, b) => b.totalMinutes - a.totalMinutes);
  const topItems = itemsData.slice(0, topN);

  // Sort by peak week (when did this item trend)
  topItems.sort((a, b) => {
    const peakWeekA = a.data.findIndex((d) => d.minutes === a.peakMinutes);
    const peakWeekB = b.data.findIndex((d) => d.minutes === b.peakMinutes);
    return peakWeekA - peakWeekB;
  });

  return {
    items: topItems,
    weeks,
    year,
    mode,
  };
}
