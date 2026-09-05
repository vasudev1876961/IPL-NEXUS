export interface TeamScore {
  name: string;
  short?: string;
  score: string;
  overs?: string;
  crr?: number;
  rrr?: number;
  target?: number;
  runs_needed?: number;
  balls_remaining?: number;
  win_probability?: number;
}

export interface MatchSummary {
  match_id: string;
  date: string;
  season: string;
  venue: string;
  team1: { name: string; score: string };
  team2: { name: string; score: string };
  winner: string;
  status: string;
}

export interface LiveMatchState {
  match_id: string;
  title: string;
  venue: string;
  innings: number;
  batting_team: TeamScore;
  bowling_team: TeamScore;
  current_pressure: number;
  pressure_tier: string;
  active_batsmen: Array<{
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    sr: number;
    is_striker: boolean;
  }>;
  active_bowler: {
    name: string;
    figures: string;
    econ: number;
    dots: number;
  };
  recent_balls: string[];
  recent_turning_point: {
    over: number;
    event: string;
    impact: string;
    significance: string;
  };
}

export interface PlayerDNAAxis {
  axis: string;
  value: number;
}

export interface PlayerProfile {
  player_name: string;
  total_runs: number;
  balls_faced: number;
  strike_rate: number;
  total_fours: number;
  total_sixes: number;
  total_wickets: number;
  balls_bowled: number;
  economy: number;
  matches_played: number;
}

export interface PlayerDNAResponse {
  player_name: string;
  role: string;
  archetype: string;
  radar_axes: PlayerDNAAxis[];
  career_summary: {
    runs: number;
    strike_rate: number;
    wickets: number;
    balls_bowled: number;
    economy: number;
  };
}

export interface MatchupAnalysis {
  batter: string;
  bowler: string;
  sample_size: number;
  balls_faced: number;
  runs_scored: number;
  dots: number;
  dot_pct: number;
  fours: number;
  sixes: number;
  dismissals: number;
  strike_rate: number;
  average: number | null;
  boundary_pct: number;
  tactical_edge: string;
  recommendation: string;
  phase_splits?: {
    powerplay: { balls: number; runs: number };
    middle: { balls: number; runs: number };
    death: { balls: number; runs: number };
  };
}

export interface CounterfactualScenario {
  scenario: string;
  projected_win_prob: number;
  impact: string;
  risk_level: string;
}

export interface PredictionResponse {
  batting_team: string;
  bowling_team: string;
  batting_win_probability: number;
  bowling_win_probability: number;
  confidence_score: number;
  current_state: {
    score: string;
    overs: string;
    crr: number;
    rrr?: number | null;
    runs_needed?: number | null;
    balls_remaining: number;
    pressure_index: number;
  };
  counterfactuals: CounterfactualScenario[];
  primary_drivers: Array<{ factor: string; effect: string; detail: string }>;
  model_engine: string;
}

export interface SimulationResponse {
  win_probability: number;
  expected_final_score: number;
  score_confidence_interval: [number, number];
  simulations_count: number;
  score_distribution: Array<{ score_range: string; count: number }>;
}

export interface ChatResponse {
  query: string;
  intent: string;
  answer: string;
  evidence: any;
  confidence: string;
}

export interface BattingPlanResponse {
  tactical_posture: string;
  risk_profile: string;
  required_rr: number;
  wickets_in_hand: number;
  runs_needed: number;
  overs_remaining: number;
  strategic_advice: string;
  target_boundaries_per_over: number;
}

export interface BowlerRanking {
  bowler: string;
  tactical_score: number;
  phase_economy: number;
  phase_wickets: number;
  phase_dots_pct: number;
  vs_striker_dismissals: number;
  vs_striker_sr: number;
  sample_balls: number;
  h2h_edge: string;
}

export interface BowlerRecommendationResponse {
  recommended_bowler: string;
  phase: string;
  striker: string;
  non_striker: string;
  rationale: string;
  estimated_win_prob_lift: string;
  rankings: BowlerRanking[];
}

export interface BattingEntry {
  striker: string;
  batting_team: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: number;
  dismissal: string;
}

export interface BowlingEntry {
  bowler: string;
  bowling_team: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  dots: number;
  economy: number;
}

export interface FallOfWicket {
  score: number;
  wickets: number;
  player: string;
  over: string;
}

export interface InningsScorecard {
  batting: BattingEntry[];
  bowling: BowlingEntry[];
  fall_of_wickets: FallOfWicket[];
  extras: {
    total: number;
  };
  total_runs: number;
  total_wickets: number;
  overs_completed: string;
  team: string;
}

export interface OverDelivery {
  ball_in_over: number;
  ball_label: string;
  striker: string;
  bowler: string;
  runs_off_bat: number;
  extras: number;
  total_runs: number;
  is_wicket: boolean;
  dismissal_kind: string | null;
  player_dismissed: string | null;
  is_dot: boolean;
  is_four: boolean;
  is_six: boolean;
  win_prob: number;
  delta_win_prob: number;
  current_score: number;
  current_wickets: number;
}

export interface OverTimeline {
  over_num: number;
  bowler: string;
  runs: number;
  wickets: number;
  balls: OverDelivery[];
}

export interface MatchDetailResponse {
  match_id: string;
  summary: {
    match_id: string;
    match_date: string;
    season: string;
    venue: string;
    team1: string;
    team2: string;
    innings1_score: number;
    innings1_wickets: number;
    innings2_score: number;
    innings2_wickets: number;
    match_winner: string;
  };
  momentum_curve: Array<{
    innings: number;
    over: number;
    win_prob: number;
    pressure: number;
    runs: number;
    wickets: number;
  }>;
  turning_points: Array<{
    ball: number;
    innings: number;
    delta_win_prob: number;
    event: string;
    impact: string;
  }>;
  scorecard: {
    top_batters: BattingEntry[];
    top_bowlers: BowlingEntry[];
  };
  innings1_card?: InningsScorecard;
  innings2_card?: InningsScorecard;
  overs_timeline?: {
    [innings: number]: OverTimeline[];
  };
  total_deliveries: number;
}

