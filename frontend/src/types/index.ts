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

export interface VenueSummary {
  id: string;
  name: string;
  short_name: string;
  city: string;
  franchise: string;
  matches: number;
  avg_1st_innings: number;
  avg_2nd_innings: number;
  chase_win_pct: number;
  bat_first_win_pct: number;
  boundary_pct: number;
  sixes_per_match: number;
  highest_score: number;
  lowest_score: number;
  pitch_type: string;
  dew_risk: string;
  toss_verdict: string;
}

export interface VenuePhaseData {
  phase: string;
  run_rate: number;
  boundary_pct: number;
  wicket_pct: number;
  dot_pct: number;
  league_avg_rr: number;
  delta_rr: number;
}

export interface VenueInsights extends VenueSummary {
  dimensions: {
    straight: number;
    square_off: number;
    square_leg: number;
    fine_third: number;
  };
  tactical_keys: string[];
  phases: VenuePhaseData[];
  pace_vs_spin: {
    pace_wickets_pct: number;
    spin_wickets_pct: number;
    pace_economy: number;
    spin_economy: number;
    pace_wickets_total: number;
    spin_wickets_total: number;
  };
  top_batters: Array<{
    name: string;
    runs: number;
    balls: number;
    strike_rate: number;
    fours: number;
    sixes: number;
  }>;
  top_bowlers: Array<{
    name: string;
    wickets: number;
    overs: number;
    economy: number;
    dots: number;
  }>;
  recent_matches: Array<{
    match_id: string;
    date: string;
    season: string;
    team1: { name: string; score: string };
    team2: { name: string; score: string };
    winner: string;
  }>;
}

// Franchise War Room & Squad Decision Intelligence Types

export interface FranchiseSummary {
  id: string;
  name: string;
  short: string;
  city: string;
  home_ground: string;
  primary_color: string;
  secondary_color: string;
  trophies: number[];
  titles_count: number;
  established: number;
  motto: string;
  captains: string[];
  matches_played: number;
  wins: number;
  losses: number;
  ties: number;
  win_rate: number;
  defend_win_pct: number;
  chase_win_pct: number;
  total_runs: number;
  fours: number;
  sixes: number;
  total_wickets: number;
}

export interface FranchisePhaseBatting {
  run_rate: number;
  boundary_pct: number;
  dot_pct: number;
  balls_per_wicket: number;
}

export interface FranchisePhaseBowling {
  economy: number;
  dot_pct: number;
  balls_per_wicket: number;
}

export interface RosterPlayer {
  player_name: string;
  role: string;
  is_overseas: boolean;
  is_wicket_keeper: boolean;
  runs: number;
  strike_rate: number;
  wickets: number;
  economy: number;
  expected_auction_price_cr: number;
}

export interface FranchiseDossier extends FranchiseSummary {
  max_score: number;
  min_score: number;
  avg_1st_innings: number;
  fortress: {
    home_matches: number;
    home_wins: number;
    home_win_pct: number;
    away_matches: number;
    away_wins: number;
    away_win_pct: number;
    fortress_differential: number;
  };
  phase_radar: {
    batting: {
      powerplay: FranchisePhaseBatting;
      middle: FranchisePhaseBatting;
      death: FranchisePhaseBatting;
    };
    bowling: {
      powerplay: FranchisePhaseBowling;
      middle: FranchisePhaseBowling;
      death: FranchisePhaseBowling;
    };
  };
  top_batters: Array<{
    player: string;
    matches: number;
    runs: number;
    balls: number;
    strike_rate: number;
    fours: number;
    sixes: number;
  }>;
  top_bowlers: Array<{
    player: string;
    matches: number;
    wickets: number;
    overs: number;
    economy: number;
  }>;
  roster_pool: RosterPlayer[];
  tactical_insights: string[];
}

export interface RivalryDetails {
  team1: {
    id: string;
    name: string;
    short: string;
    primary_color: string;
    wins: number;
    win_pct: number;
    max_score: number;
    min_score: number;
  };
  team2: {
    id: string;
    name: string;
    short: string;
    primary_color: string;
    wins: number;
    win_pct: number;
    max_score: number;
    min_score: number;
  };
  total_clashes: number;
  ties_no_result: number;
  avg_1st_innings: number;
  derby_name: string;
  rivalry_title: string;
  venue_splits: Array<{
    venue: string;
    matches: number;
    team1_wins: number;
    team2_wins: number;
  }>;
  top_batters: Array<{
    player: string;
    team: string;
    runs: number;
    matches: number;
    strike_rate: number;
  }>;
  top_bowlers: Array<{
    player: string;
    team: string;
    wickets: number;
    matches: number;
    economy: number;
  }>;
  recent_matches: Array<{
    match_id: string;
    match_date: string;
    season: string;
    venue: string;
    team1: string;
    team2: string;
    innings1: string;
    innings2: string;
    winner: string;
  }>;
}

export interface RivalryMatrix {
  teams: Array<{
    id: string;
    short: string;
    name: string;
    color: string;
  }>;
  grid: Record<string, Record<string, {
    matches: number;
    t1_wins: number;
    t2_wins: number;
  }>>;
}

export interface PlayingXIClashRequest {
  team1_id: string;
  team1_lineup: string[];
  team1_impact_sub?: string;
  team2_id: string;
  team2_lineup: string[];
  team2_impact_sub?: string;
  venue_id?: string;
}

export interface PlayingXIClashResult {
  team1: {
    id: string;
    name: string;
    short: string;
    primary_color: string;
    win_probability: number;
    projected_score: string;
    composite_rating: number;
    radar: {
      top_order: number;
      middle_order: number;
      death_finishing: number;
      pace_threat: number;
      spin_choke: number;
      death_bowling: number;
    };
    overseas_count: number;
    wk_count: number;
    bowling_options: number;
    impact_sub: string | null;
    is_valid_ipl_rules: boolean;
  };
  team2: {
    id: string;
    name: string;
    short: string;
    primary_color: string;
    win_probability: number;
    projected_score: string;
    composite_rating: number;
    radar: {
      top_order: number;
      middle_order: number;
      death_finishing: number;
      pace_threat: number;
      spin_choke: number;
      death_bowling: number;
    };
    overseas_count: number;
    wk_count: number;
    bowling_options: number;
    impact_sub: string | null;
    is_valid_ipl_rules: boolean;
  };
  venue: string;
  phase_battle: {
    powerplay: string;
    middle: string;
    death: string;
  };
  tactical_verdict: string;
}

export interface AuctionPlayer {
  name: string;
  role: string;
  is_overseas: boolean;
  is_wicket_keeper: boolean;
  matches: number;
  runs: number;
  strike_rate: number;
  wickets: number;
  economy: number;
  expected_auction_price_cr: number;
  tier: "Marquee" | "Gold" | "Value";
}

export interface AuctionResponse {
  franchise: string;
  short: string;
  total_purse_cr: number;
  available_purse_cr: number;
  squad_size_limit: number;
  current_squad_size: number;
  max_overseas: number;
  current_overseas: number;
  recommended_targets: AuctionPlayer[];
  auction_pool: AuctionPlayer[];
}

// Tournament Playoff Predictor & NRR Interfaces
export interface SeasonStanding {
  team_id: string;
  team_name: string;
  short_name: string;
  primary_color: string;
  secondary_color: string;
  played: number;
  won: number;
  lost: number;
  tied_nr: number;
  points: number;
  runs_scored: number;
  overs_faced: number;
  runs_conceded: number;
  overs_bowled: number;
  nrr: number;
  form: string[];
  status: string;
  rank: number;
}

export interface PlayoffProbability {
  team_id: string;
  team_name: string;
  short_name: string;
  primary_color: string;
  current_points: number;
  playoff_prob: number;
  top2_prob: number;
  title_prob: number;
  wooden_spoon_prob: number;
  magic_number_wins: number;
  qualification_status: string;
}

export interface RemainingFixtureTeam {
  id: string;
  name: string;
  short: string;
  win_prob: number;
}

export interface RemainingFixture {
  fixture_id: string;
  match_num: number;
  date: string;
  team1: RemainingFixtureTeam;
  team2: RemainingFixtureTeam;
  user_override?: string;
}

export interface MagicMatrixItem {
  points: number;
  historical_qualify_pct: number;
  status: string;
}

export interface PlayoffsSimulationResponse {
  season: string;
  simulations_count: number;
  completed_matches_count: number;
  remaining_matches_count: number;
  probabilities: PlayoffProbability[];
  remaining_fixtures: RemainingFixture[];
  magic_matrix: MagicMatrixItem[];
}

export interface NRRScenarioResult {
  team: string;
  target_team: string;
  scenario: string;
  current_nrr: number;
  target_nrr: number;
  projected_score?: number;
  max_runs_conceded?: number;
  required_victory_margin_runs?: number;
  target_score?: number;
  max_chase_overs?: string;
  tactical_directive: string;
}

export interface ContextualMetrics {
  player_name: string;
  true_strike_rate: {
    value: number;
    actual_sr: number;
    expected_sr: number;
    sample_balls: number;
    verdict: string;
    is_significant: boolean;
  };
  true_economy_rate: {
    value: number;
    actual_economy: number;
    expected_economy: number;
    sample_balls: number;
    verdict: string;
    is_significant: boolean;
  };
  clutch_rating: {
    score: number;
    tier: string;
    pressure_balls_faced: number;
    pressure_balls_bowled: number;
  };
  win_probability_added: {
    total_wpa_pct: number;
    wpa_per_match: number;
    batting_wpa: number;
    bowling_wpa: number;
  };
}




