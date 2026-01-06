"use client";

import { useState, useCallback } from "react";
import RidgelineChart from "@/components/RidgelineChart";
import { processSpotifyData } from "@/lib/processData";
import { SpotifyStreamEntry, ProcessedData } from "@/lib/types";

export default function Home() {
  const [songsData, setSongsData] = useState<ProcessedData | null>(null);
  const [artistsData, setArtistsData] = useState<ProcessedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    totalMinutes: number;
    uniqueSongs: number;
    uniqueArtists: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setLoading(true);
      setError(null);

      try {
        const allEntries: SpotifyStreamEntry[] = [];

        for (const file of Array.from(files)) {
          const text = await file.text();
          const data = JSON.parse(text);
          allEntries.push(...data);
        }

        if (allEntries.length === 0) {
          throw new Error("No streaming data found in the uploaded files");
        }

        const year = 2025;

        const songs = processSpotifyData(allEntries, year, 50, "songs");
        const artists = processSpotifyData(allEntries, year, 50, "artists");

        // Calculate stats
        const yearEntries = allEntries.filter((e) => {
          const d = new Date(e.endTime);
          return d.getFullYear() === year;
        });
        const totalMinutes = yearEntries.reduce(
          (sum, e) => sum + e.msPlayed / 60000,
          0
        );
        const uniqueSongs = new Set(
          yearEntries.map((e) => `${e.trackName}-${e.artistName}`)
        ).size;
        const uniqueArtists = new Set(yearEntries.map((e) => e.artistName)).size;

        setStats({ totalMinutes, uniqueSongs, uniqueArtists });
        setSongsData(songs);
        setArtistsData(artists);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to parse the uploaded files"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-semibold text-gray-900 mb-3 tracking-tight">
            Spotify Ridgeline
          </h1>
          <p className="text-gray-500 text-lg">
            Visualize your listening trends over time
          </p>
        </header>

        {!songsData && !artistsData ? (
          <>
          <div className="max-w-2xl">
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Request your Spotify data
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Go to your Spotify Privacy Settings and request your data under
                    &quot;Download your data&quot;.
                  </p>
                  <a
                    href="https://www.spotify.com/account/privacy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Open Spotify Privacy Settings
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    Wait for your data
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Spotify takes up to 5 days to prepare your data. You&apos;ll receive
                    an email when it&apos;s ready to download.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Upload your streaming history
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    From the downloaded zip, upload the{" "}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                      StreamingHistory_music_*.json
                    </code>{" "}
                    files. You can select multiple files at once.
                  </p>

                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Upload JSON files
                    <input
                      type="file"
                      accept=".json"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {loading && (
                    <div className="mt-4 flex items-center gap-2 text-gray-600">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      Processing your data...
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 text-red-600 text-sm">{error}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100">
              <div className="flex items-start gap-3 text-sm text-gray-500">
                <svg
                  className="w-5 h-5 shrink-0 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <p>
                  <strong className="text-gray-700">Your data stays private.</strong>{" "}
                  All processing happens locally in your browser. Nothing is uploaded
                  to any server.
                </p>
              </div>
            </div>

          </div>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Here&apos;s how your data will look
            </h3>
            <div className="flex gap-4">
              <div className="flex-1 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src="/top-songs-2025.png"
                  alt="Example: Top Songs visualization"
                  className="w-full"
                />
              </div>
              <div className="flex-1 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src="/top-artists-2025.png"
                  alt="Example: Top Artists visualization"
                  className="w-full"
                />
              </div>
            </div>
          </div>
          </>
        ) : (
          <>
            {stats && (
              <div className="flex gap-8 mb-10 text-sm">
                <div>
                  <span className="text-gray-400">Total listening time</span>
                  <p className="text-gray-900 font-medium text-lg">
                    {Math.round(stats.totalMinutes / 60).toLocaleString()} hours
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Unique songs</span>
                  <p className="text-gray-900 font-medium text-lg">
                    {stats.uniqueSongs.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Unique artists</span>
                  <p className="text-gray-900 font-medium text-lg">
                    {stats.uniqueArtists.toLocaleString()}
                  </p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => {
                      setSongsData(null);
                      setArtistsData(null);
                      setStats(null);
                    }}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Upload different data
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-16">
              {songsData && (
                <section>
                  <h2 className="text-2xl font-medium text-gray-800 mb-6">
                    Top Songs
                  </h2>
                  <RidgelineChart data={songsData} title="top-songs" />
                </section>
              )}

              {artistsData && (
                <section>
                  <h2 className="text-2xl font-medium text-gray-800 mb-6">
                    Top Artists
                  </h2>
                  <RidgelineChart data={artistsData} title="top-artists" />
                </section>
              )}
            </div>
          </>
        )}

        <footer className="mt-16 pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
          Built with Next.js and D3.js by <a href="https://x.com/faisal_sayed05" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">Faisal Sayed</a>
        </footer>
      </div>
    </div>
  );
}
