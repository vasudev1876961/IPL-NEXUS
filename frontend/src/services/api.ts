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
  VenueSummary,
  VenueInsights,
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

export async function fetchVenues(): Promise<{ total_venues: number; venues: VenueSummary[] }> {
  const res = await fetch(`${API_BASE}/venues`);
  if (!res.ok) throw new Error("Failed to fetch venues");
  return res.json();
}

export async function fetchVenueInsights(venueId: string): Promise<VenueInsights> {
  const res = await fetch(`${API_BASE}/venues/${encodeURIComponent(venueId)}/insights`);
  if (!res.ok) throw new Error(`Failed to fetch insights for venue ${venueId}`);
  return res.json();
}

import {
  FranchiseSummary,
  FranchiseDossier,
  RivalryDetails,
  RivalryMatrix,
  PlayingXIClashRequest,
  PlayingXIClashResult,
  AuctionResponse,
} from "../types";

export async function fetchFranchises(): Promise<{ count: number; franchises: FranchiseSummary[] }> {
  const res = await fetch(`${API_BASE}/franchises`);
  if (!res.ok) throw new Error("Failed to fetch franchises catalog");
  return res.json();
}

export async function fetchFranchiseDossier(franchiseId: string): Promise<FranchiseDossier> {
  const res = await fetch(`${API_BASE}/franchises/${encodeURIComponent(franchiseId)}/dossier`);
  if (!res.ok) throw new Error(`Failed to fetch dossier for franchise ${franchiseId}`);
  return res.json();
}

export async function fetchRivalry(team1: string, team2: string): Promise<RivalryDetails> {
  const res = await fetch(`${API_BASE}/franchises/rivalry?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`);
  if (!res.ok) throw new Error(`Failed to fetch rivalry between ${team1} and ${team2}`);
  return res.json();
}

export async function fetchRivalryMatrix(): Promise<RivalryMatrix> {
  const res = await fetch(`${API_BASE}/franchises/rivalry-matrix`);
  if (!res.ok) throw new Error("Failed to fetch rivalry matrix");
  return res.json();
}

export async function simulatePlayingXIClash(payload: PlayingXIClashRequest): Promise<PlayingXIClashResult> {
  const res = await fetch(`${API_BASE}/franchises/simulate-clash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to simulate Playing XI clash");
  return res.json();
}

export async function fetchAuctionTargets(franchiseId: string): Promise<AuctionResponse> {
  const res = await fetch(`${API_BASE}/franchises/${encodeURIComponent(franchiseId)}/auction-targets`);
  if (!res.ok) throw new Error(`Failed to fetch auction targets for ${franchiseId}`);
  return res.json();
}


