"""Contextual True Cricket Metrics Engine for IPL Nexus.

Computes phase-normalized True Strike Rate (TSR), True Economy Rate (TER),
Clutch Rating under high pressure crucibles, and Win Probability Added (WPA).
"""

from typing import Dict, Any, List, Optional
import numpy as np
import duckdb

from data_pipeline.warehouse_loader import DEFAULT_DB_PATH, get_readonly_connection

# Global phase baseline benchmarks across IPL history
PHASE_BENCHMARKS = {
    "Powerplay": {"expected_sr": 124.2, "expected_econ": 7.42},
    "Middle": {"expected_sr": 126.8, "expected_econ": 7.85},
    "Death": {"expected_sr": 168.4, "expected_econ": 10.35}
}

_CONTEXTUAL_METRICS_CACHE: Dict[str, Dict[str, Any]] = {}


def compute_player_contextual_metrics(player_name: str, db_path: str = DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    """Compute context-normalized True Strike Rate, True Economy, Clutch Rating, and WPA for a player."""
    cache_key = player_name.strip().lower()
    if cache_key in _CONTEXTUAL_METRICS_CACHE:
        return _CONTEXTUAL_METRICS_CACHE[cache_key]

    con = get_readonly_connection(db_path)

    # 1. Batting phase deliveries
    bat_phase_query = """
        SELECT
            phase,
            COUNT(CASE WHEN is_legal_ball THEN 1 END) as legal_balls,
            COALESCE(SUM(runs_off_bat), 0) as runs,
            COUNT(CASE WHEN is_dot THEN 1 END) as dots,
            COUNT(CASE WHEN is_four THEN 1 END) as fours,
            COUNT(CASE WHEN is_six THEN 1 END) as sixes
        FROM fact_deliveries
        WHERE striker = ?
        GROUP BY phase
    """
    bat_phases = con.execute(bat_phase_query, [player_name]).fetchall()

    # 2. Bowling phase deliveries
    bowl_phase_query = """
        SELECT
            phase,
            COUNT(CASE WHEN is_legal_ball THEN 1 END) as legal_balls,
            COALESCE(SUM(total_runs), 0) as runs_conceded,
            COUNT(CASE WHEN is_wicket = 1 AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as wickets,
            COUNT(CASE WHEN is_dot THEN 1 END) as dots
        FROM fact_deliveries
        WHERE bowler = ?
        GROUP BY phase
    """
    bowl_phases = con.execute(bowl_phase_query, [player_name]).fetchall()

    # If player not found
    if not bat_phases and not bowl_phases:
        return None

    # Compute Batting TSR
    total_bat_balls = sum(r[1] for r in bat_phases)
    total_bat_runs = sum(r[2] for r in bat_phases)
    has_batting = total_bat_balls >= 15

    tsr = 0.0
    actual_bat_sr = round(total_bat_runs * 100.0 / total_bat_balls, 2) if total_bat_balls > 0 else 0.0
    expected_bat_sr = 130.0

    if has_batting:
        exp_runs_sum = 0.0
        for ph, b_balls, b_runs, dots, fours, sixes in bat_phases:
            base_sr = PHASE_BENCHMARKS.get(ph, {}).get("expected_sr", 130.0)
            exp_runs_sum += (b_balls * (base_sr / 100.0))
        expected_bat_sr = round(exp_runs_sum * 100.0 / total_bat_balls, 2)
        tsr = round(actual_bat_sr - expected_bat_sr, 2)

    # Compute Bowling TER
    total_bowl_balls = sum(r[1] for r in bowl_phases)
    total_bowl_runs = sum(r[2] for r in bowl_phases)
    total_bowl_wkts = sum(r[3] for r in bowl_phases)
    has_bowling = total_bowl_balls >= 30

    ter = 0.0
    actual_bowl_econ = round(total_bowl_runs / (total_bowl_balls / 6.0), 2) if total_bowl_balls > 0 else 0.0
    expected_bowl_econ = 8.20

    if has_bowling:
        exp_conceded_sum = 0.0
        for ph, b_balls, b_runs, wkts, dots in bowl_phases:
            base_econ = PHASE_BENCHMARKS.get(ph, {}).get("expected_econ", 8.20)
            exp_conceded_sum += (b_balls / 6.0) * base_econ
        expected_bowl_econ = round(exp_conceded_sum / (total_bowl_balls / 6.0), 2)
        # TER: negative is better (e.g. -1.45 means conceding 1.45 runs/over less than phase expectation)
        ter = round(actual_bowl_econ - expected_bowl_econ, 2)

    # 3. Clutch Rating (Performance under Pressure Index > 60)
    clutch_bat_query = """
        SELECT
            COUNT(CASE WHEN is_legal_ball THEN 1 END) as pressure_balls,
            COALESCE(SUM(runs_off_bat), 0) as pressure_runs,
            COUNT(CASE WHEN is_four = 1 OR is_six = 1 THEN 1 END) as pressure_boundaries
        FROM fact_deliveries
        WHERE striker = ? AND pressure_index >= 60.0
    """
    c_bat = con.execute(clutch_bat_query, [player_name]).fetchone()
    p_bat_balls = c_bat[0] or 0
    p_bat_runs = c_bat[1] or 0
    p_bat_bounds = c_bat[2] or 0

    clutch_bowl_query = """
        SELECT
            COUNT(CASE WHEN is_legal_ball THEN 1 END) as pressure_balls,
            COALESCE(SUM(total_runs), 0) as pressure_runs,
            COUNT(CASE WHEN is_wicket = 1 AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as pressure_wkts,
            COUNT(CASE WHEN is_dot THEN 1 END) as pressure_dots
        FROM fact_deliveries
        WHERE bowler = ? AND pressure_index >= 60.0
    """
    c_bowl = con.execute(clutch_bowl_query, [player_name]).fetchone()
    p_bowl_balls = c_bowl[0] or 0
    p_bowl_runs = c_bowl[1] or 0
    p_bowl_wkts = c_bowl[2] or 0
    p_bowl_dots = c_bowl[3] or 0

    # Calculate 0-100 Clutch Rating
    bat_clutch_score = 50.0
    if p_bat_balls >= 20:
        p_sr = (p_bat_runs * 100.0) / p_bat_balls
        p_bound_pct = (p_bat_bounds * 100.0) / p_bat_balls
        bat_clutch_score = min(max((p_sr - 100.0) / 70.0 * 60.0 + (p_bound_pct / 25.0 * 40.0), 20.0), 98.0)

    bowl_clutch_score = 50.0
    if p_bowl_balls >= 20:
        p_econ = p_bowl_runs / (p_bowl_balls / 6.0)
        p_dot_pct = (p_bowl_dots * 100.0) / p_bowl_balls
        p_wkt_rate = (p_bowl_wkts * 24.0) / p_bowl_balls
        bowl_clutch_score = min(max((11.0 - p_econ) / 4.0 * 50.0 + (p_dot_pct / 45.0 * 30.0) + min(p_wkt_rate * 20.0, 20.0), 20.0), 99.0)

    if has_batting and has_bowling:
        overall_clutch = round((bat_clutch_score * 0.5) + (bowl_clutch_score * 0.5), 1)
    elif has_batting:
        overall_clutch = round(bat_clutch_score, 1)
    else:
        overall_clutch = round(bowl_clutch_score, 1)

    # 4. Win Probability Added (WPA) calculation
    # Cumulative win equity based on runs, boundaries, dots, wickets, and pressure weighting
    bat_wpa = 0.0
    if has_batting:
        bat_wpa = (tsr * (total_bat_balls / 120.0) * 0.45) + (p_bat_runs * 0.12)
    bowl_wpa = 0.0
    if has_bowling:
        bowl_wpa = (-ter * (total_bowl_balls / 24.0) * 0.85) + (total_bowl_wkts * 1.6)

    total_wpa = round(bat_wpa + bowl_wpa, 1)
    wpa_per_match = round(total_wpa / max((total_bat_balls / 20.0) + (total_bowl_balls / 24.0), 5.0), 2)

    # Qualitative verdict
    if tsr >= 15.0:
        tsr_verdict = f"Elite Hyper-Scorer (+{tsr} over phase expectation)"
    elif tsr >= 5.0:
        tsr_verdict = f"Above Average Batter (+{tsr} over phase expectation)"
    elif tsr >= -5.0:
        tsr_verdict = f"Par Tempo Batter ({tsr} relative to phase expectation)"
    else:
        tsr_verdict = f"Sub-Par Tempo ({tsr} below phase expectation)"

    if ter <= -1.20:
        ter_verdict = f"Elite Restrictor ({ter:+.2f} RPO relative to phase expectation)"
    elif ter <= -0.40:
        ter_verdict = f"Economical Bowler ({ter:+.2f} RPO relative to phase expectation)"
    elif ter <= 0.40:
        ter_verdict = f"Par Economy ({ter:+.2f} RPO relative to phase expectation)"
    else:
        ter_verdict = f"High-Expense Bowler ({ter:+.2f} RPO relative to phase expectation)"

    result = {
        "player_name": player_name,
        "true_strike_rate": {
            "value": tsr,
            "actual_sr": actual_bat_sr,
            "expected_sr": expected_bat_sr,
            "sample_balls": total_bat_balls,
            "verdict": tsr_verdict,
            "is_significant": has_batting
        },
        "true_economy_rate": {
            "value": ter,
            "actual_economy": actual_bowl_econ,
            "expected_economy": expected_bowl_econ,
            "sample_balls": total_bowl_balls,
            "verdict": ter_verdict,
            "is_significant": has_bowling
        },
        "clutch_rating": {
            "score": overall_clutch,
            "tier": "Ice-Cold Match Winner" if overall_clutch >= 85 else "High-Pressure Performer" if overall_clutch >= 70 else "Reliable Under Pressure" if overall_clutch >= 55 else "Pressure Susceptible",
            "pressure_balls_faced": p_bat_balls,
            "pressure_balls_bowled": p_bowl_balls
        },
        "win_probability_added": {
            "total_wpa_pct": total_wpa,
            "wpa_per_match": wpa_per_match,
            "batting_wpa": round(bat_wpa, 1),
            "bowling_wpa": round(bowl_wpa, 1)
        }
    }

    _CONTEXTUAL_METRICS_CACHE[cache_key] = result
    return result
