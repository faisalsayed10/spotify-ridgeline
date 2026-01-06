export interface SpotifyStreamEntry {
  endTime: string;
  artistName: string;
  trackName: string;
  msPlayed: number;
}

export interface WeeklyData {
  label: string;
  artist?: string;
  data: { week: Date; minutes: number }[];
  totalMinutes: number;
  peakMinutes: number;
}

export interface ProcessedData {
  items: WeeklyData[];
  weeks: Date[];
  year: number;
  mode: "artists" | "songs";
}
