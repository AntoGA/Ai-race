const API = process.env.NEXT_PUBLIC_API_URL || "/api";

export interface Pilot {
  id: string;
  name: string;
  version: string;
  team: string;
  model_type: string;
  description: string;
  avatar_url: string | null;
  wins?: number;
  podiums?: number;
  best_lap_ms?: number | null;
  points?: number;
}

export interface Race {
  id: string;
  title: string;
  track: string;
  conditions: string;
  status: string;
  scheduled_at: string;
  stream_key: string;
  stream_url_hls: string | null;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export const getRaces = (status?: string) =>
  get<Race[]>(`/races${status ? `?status=${status}` : ""}`);
export const getRace = (id: string) => get<Race>(`/races/${id}`);
export const getPilots = () => get<Pilot[]>("/pilots");
export const getPilot = (id: string) => get<Pilot>(`/pilots/${id}`);
export const getPilotRaces = (id: string) => get<any[]>(`/pilots/${id}/races`);
export const getRaceParticipants = (id: string) => get<any[]>(`/races/${id}/participants`);
export const getLeaderboard = () => get<any[]>("/leaderboard/season/current");

export const hlsUrl = (streamKey: string) =>
  `${process.env.NEXT_PUBLIC_HLS_URL || "/hls"}/${streamKey}/index.m3u8`;
