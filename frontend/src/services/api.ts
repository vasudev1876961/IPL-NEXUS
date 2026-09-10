import {
  LiveMatchState,
  MatchSummary,
  PlayerProfile,
  PlayerDNAResponse,
  MatchupAnalysis,
  PredictionResponse,
  SimulationResponse,
  ChatResponse,
  MatchDetailResponse,
  PlayerDossierResponse,
  PlayerComparisonResponse,
} from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000/api";

export async function fetchLiveMatch(): Promise<LiveMatchState> {
  const res = await fetch(`${API_BASE}/live`);
  if (!res.ok) throw new Error("Failed to fetch live match");
  return res.json();
}

export async function fetchMatches(options: { limit?: number; season?: string; team?: string } | number = 12): Promise<{ total: number; matches: MatchSummary[] }> {
  let url = `${API_BASE}/matches`;
  if (typeof options === "number") {
    url += `?limit=${options}`;
  } else {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", String(options.limit));
    if (options.season) params.set("season", options.season);
    if (options.team) params.set("team", options.team);
    url += `?${params.toString()}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

export async function fetchMatchDetail(matchId: string): Promise<MatchDetailResponse> {
  const res = await fetch(`${API_BASE}/matches/${matchId}`);
  if (!res.ok) throw new Error(`Failed to fetch match ${matchId}`);
  return res.json();
}

export async function fetchPlayers(query = "", sortBy = "runs", limit = 30): Promise<{ count: number; players: PlayerProfile[] }> {
  const url = `${API_BASE}/players?limit=${limit}&sort_by=${sortBy}${query ? `&query=${encodeURIComponent(query)}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch players");
  return res.json();
}

export async function fetchPlayerDNA(playerName: string): Promise<PlayerDNAResponse> {
  const res = await fetch(`${API_BASE}/players/${encodeURIComponent(playerName)}/dna`);
  if (!res.ok) throw new Error(`Failed to fetch DNA for ${playerName}`);
  return res.json();
}

export async function fetchPlayerDossier(playerName: string): Promise<PlayerDossierResponse> {
  const res = await fetch(`${API_BASE}/players/${encodeURIComponent(playerName)}/dossier`);
  if (!res.ok) throw new Error(`Failed to fetch dossier for ${playerName}`);
  return res.json();
}

export async function fetchPlayerComparison(p1: string, p2: string): Promise<PlayerComparisonResponse> {
  const res = await fetch(`${API_BASE}/players/compare?p1=${encodeURIComponent(p1)}&p2=${encodeURIComponent(p2)}`);
  if (!res.ok) throw new Error(`Failed to compare ${p1} and ${p2}`);
  return res.json();
}


export async function fetchMatchup(batter: string, bowler: string): Promise<MatchupAnalysis> {
  const res = await fetch(`${API_BASE}/matchups?batter=${encodeURIComponent(batter)}&bowler=${encodeURIComponent(bowler)}`);
  if (!res.ok) throw new Error("Failed to fetch matchup");
  return res.json();
}

export async function predictWinProb(payload: {
  innings: number;
  over_num: number;
  current_score: number;
  current_wickets: number;
  balls_remaining: number;
  target_runs: number;
  pressure_index?: number;
  batting_team?: string;
  bowling_team?: string;
}): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to predict win probability");
  return res.json();
}

export async function runSimulation(payload: {
  current_score: number;
  current_wickets: number;
  balls_remaining: number;
  target_runs: number;
  innings: number;
  expected_next_over_runs?: number | null;
  wicket_in_next_over?: boolean;
  bowling_intensity?: string;
  num_simulations?: number;
}): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to run simulation");
  return res.json();
}

import {
  BowlerRecommendationResponse,
  BattingPlanResponse,
} from "../types";

export async function fetchBowlerRecommendation(payload: {
  striker: string;
  non_striker: string;
  phase: string;
  available_bowlers: string[];
}): Promise<BowlerRecommendationResponse> {
  const res = await fetch(`${API_BASE}/strategy/recommend-bowler`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to get bowler recommendation");
  return res.json();
}

export async function fetchBattingTacticalPlan(payload: {
  required_rr: number;
  wickets_lost: number;
  overs_remaining: number;
  current_score: number;
  target_runs: number;
}): Promise<BattingPlanResponse> {
  const res = await fetch(`${API_BASE}/strategy/batting-plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to get batting tactical plan");
  return res.json();
}

export async function askAssistant(query: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("Failed to query AI assistant");
  return res.json();
}
