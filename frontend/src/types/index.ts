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

export interface DuelDelivery {
  match_id: string;
  match_date: string;
  season: string;
  venue: string;
  innings: number;
  over_num: number;
  ball_in_over: number;
  over_ball_label: string;
  phase: string;
  runs_off_bat: number;
  extras: number;
  total_runs: number;
  is_wicket: boolean;
  dismissal_kind: string;
  pressure_index: number;
  is_boundary: boolean;
  is_dot: boolean;
  result_badge: string;
}

export interface DismissalEvent {
  match_id: string;
  season: string;
  match_date: string;
  venue: string;
  innings: number;
  over_ball: string;
  phase: string;
  dismissal_kind: string;
  pressure_index: number;
}

export interface PressureDuelSplit {
  tier_name: string;
  range_desc: string;
  balls: number;
  runs: number;
  strike_rate: number;
  dots: number;
  dot_pct: number;
  wickets: number;
  boundaries: number;
}

export interface VenueDuelSplit {
  venue: string;
  balls: number;
  runs: number;
  strike_rate: number;
  dots: number;
  dismissals: number;
}

export interface SeasonDuelSplit {
  season: string;
  balls: number;
  runs: number;
  strike_rate: number;
  fours: number;
  sixes: number;
  dots: number;
  dismissals: number;
}

export interface OutcomeDistribution {
  dots: number;
  singles: number;
  doubles: number;
  threes: number;
  fours: number;
  sixes: number;
  wickets: number;
  dot_pct: number;
  boundary_pct: number;
  strike_rotation_pct: number;
}

export interface TacticalBlueprint {
  bowler_trap: string;
  batter_counter: string;
  key_battleground_phase: string;
  dismissal_risk_rating: string;
  boundary_lethal_rating: string;
  pressure_vulnerability: string;
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
    powerplay: { balls: number; runs: number; wickets?: number };
    middle: { balls: number; runs: number; wickets?: number };
    death: { balls: number; runs: number; wickets?: number };
  };
  delivery_log?: DuelDelivery[];
  dismissal_events?: DismissalEvent[];
  dismissal_modes?: Record<string, number>;
  pressure_splits?: PressureDuelSplit[];
  outcome_distribution?: OutcomeDistribution;
  season_trajectory?: SeasonDuelSplit[];
  venue_splits?: VenueDuelSplit[];
  tactical_blueprint?: TacticalBlueprint;
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

export interface PhaseBreakdownEntry {
  phase: string;
  balls: number;
  runs?: number;
  strike_rate?: number;
  fours?: number;
  sixes?: number;
  dot_pct: number;
  boundary_pct?: number;
  dismissals?: number;
  runs_conceded?: number;
  economy?: number;
  wickets?: number;
  dots?: number;
}

export interface NemesisEntry {
  bowler?: string;
  batter?: string;
  dismissals: number;
  runs?: number;
  runs_conceded?: number;
  balls: number;
  strike_rate: number;
}

export interface ThreatMatrix {
  primary_type: "batter" | "bowler";
  nemesis_opponents: NemesisEntry[];
  dominated_opponents: NemesisEntry[];
}

export interface SeasonTrajectoryEntry {
  season: string;
  runs?: number;
  balls: number;
  strike_rate?: number;
  fours?: number;
  sixes?: number;
  dismissals?: number;
  runs_conceded?: number;
  wickets?: number;
  economy?: number;
}

export interface PlayerDossierResponse {
  player_name: string;
  role: string;
  archetype: string;
  career_summary: {
    runs: number;
    strike_rate: number;
    wickets: number;
    balls_bowled: number;
    economy: number;
  };
  radar_axes: PlayerDNAAxis[];
  phase_breakdown: PhaseBreakdownEntry[];
  innings_split: {
    first_innings: {
      balls: number;
      runs?: number;
      strike_rate?: number;
      dismissals?: number;
      average?: number;
      runs_conceded?: number;
      economy?: number;
      wickets?: number;
    };
    chasing: {
      balls: number;
      runs?: number;
      strike_rate?: number;
      dismissals?: number;
      average?: number;
      runs_conceded?: number;
      economy?: number;
      wickets?: number;
    };
  };
  pressure_performance: {
    balls: number;
    runs?: number;
    strike_rate?: number;
    fours?: number;
    sixes?: number;
    dismissals?: number;
    runs_conceded?: number;
    economy?: number;
    wickets?: number;
    dot_pct?: number;
  };
  threat_matrix: ThreatMatrix;
  season_trajectory: SeasonTrajectoryEntry[];
}

export interface PlayerComparisonResponse {
  player1: {
    player_name: string;
    role: string;
    archetype: string;
    career_summary: {
      runs: number;
      strike_rate: number;
      wickets: number;
      balls_bowled: number;
      economy: number;
    };
    radar_axes: PlayerDNAAxis[];
  };
  player2: {
    player_name: string;
    role: string;
    archetype: string;
    career_summary: {
      runs: number;
      strike_rate: number;
      wickets: number;
      balls_bowled: number;
      economy: number;
    };
    radar_axes: PlayerDNAAxis[];
  };
  head_to_head: {
    p1_bat_vs_p2_bowl: MatchupAnalysis | null;
    p2_bat_vs_p1_bowl: MatchupAnalysis | null;
    has_direct_encounter: boolean;
  };
  metric_deltas: {
    runs: number;
    strike_rate: number;
    wickets: number;
    economy: number;
  };
}


