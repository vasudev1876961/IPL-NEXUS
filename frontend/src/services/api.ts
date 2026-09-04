import {
  LiveMatchState,
  MatchSummary,
  PlayerProfile,
  PlayerDNAResponse,
  MatchupAnalysis,
  PredictionResponse,
  SimulationResponse,
  ChatResponse,
} from "../types";

const API_BASE = "http://localhost:8000/api";

export async function fetchLiveMatch(): Promise<LiveMatchState> {
  const res = await fetch(`${API_BASE}/live`);
  if (!res.ok) throw new Error("Failed to fetch live match");
  return res.json();
}

export async function fetchMatches(limit = 12): Promise<{ total: number; matches: MatchSummary[] }> {
  const res = await fetch(`${API_BASE}/matches?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

export async function fetchMatchDetail(matchId: string): Promise<any> {
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

export async function fetchBowlerRecommendation(payload: {
  striker: string;
  non_striker: string;
  phase: string;
  available_bowlers: string[];
}): Promise<any> {
  const res = await fetch(`${API_BASE}/strategy/recommend-bowler`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to get bowler recommendation");
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
