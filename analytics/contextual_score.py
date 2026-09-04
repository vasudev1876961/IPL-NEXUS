"""Contextual Performance Index (CPI) algorithm.

Evaluates player contributions calibrated by match pressure, phase difficulty,
and win probability added (WPA).
"""

import numpy as np
import pandas as pd
from typing import Dict, Any


def calculate_batting_cpi(
    runs: int,
    balls_faced: int,
    fours: int,
    sixes: int,
    avg_pressure_faced: float,
    phase_runs: Dict[str, int],
    is_not_out: bool = False,
    is_winning_chase: bool = False
) -> Dict[str, Any]:
    """Calculate Contextual Performance Score (0-100) for a batting innings.
    
    Factors:
    - Base Strike Rate vs T20 baseline (130)
    - Pressure multiplier (rewards performance in high-pressure crunch phases)
    - Death overs boundary premium
    - Chasing anchor bonus
    """
    if balls_faced <= 0:
        return {"cpi_score": 0.0, "rating_tier": "DNP", "analysis": "Did not face deliveries"}

    sr = (runs / balls_faced) * 100.0
    boundary_runs = (fours * 4) + (sixes * 6)
    boundary_pct = (boundary_runs / max(1, runs)) * 100.0

    # Base volume score (up to 40 pts)
    volume_score = min(40.0, runs * 0.7)

    # Efficiency / Strike Rate score (up to 30 pts)
    # Baseline 100 SR = 15 pts, 160 SR = 25 pts, 200+ SR = 30 pts
    sr_score = min(30.0, max(0.0, (sr - 70.0) / 130.0 * 30.0))

    # Pressure leverage factor (up to 20 pts)
    # High pressure (>60) significantly enhances rating
    pressure_multiplier = (avg_pressure_faced / 100.0)
    pressure_score = pressure_multiplier * 20.0

    # Situational bonus (up to 10 pts)
    situational_bonus = 0.0
    if is_winning_chase:
        situational_bonus += 5.0
    if phase_runs.get("Death", 0) >= 20:
        situational_bonus += 5.0

    raw_cpi = volume_score + sr_score + pressure_score + situational_bonus
    final_score = float(np.clip(round(raw_cpi, 1), 10.0, 99.5))

    # Qualitative tier
    if final_score >= 85.0:
        tier = "Elite Impact"
    elif final_score >= 70.0:
        tier = "High Impact"
    elif final_score >= 50.0:
        tier = "Solid Contributor"
    else:
        tier = "Sub-par / Below Context Par"

    analysis = (
        f"Scored {runs} ({balls_faced}b) with {boundary_pct:.0f}% boundary runs "
        f"under an average match pressure of {avg_pressure_faced:.1f}/100."
    )

    return {
        "cpi_score": final_score,
        "strike_rate": round(sr, 1),
        "boundary_pct": round(boundary_pct, 1),
        "pressure_faced": round(avg_pressure_faced, 1),
        "rating_tier": tier,
        "analysis": analysis,
    }


def calculate_bowling_cpi(
    wickets: int,
    balls_bowled: int,
    runs_conceded: int,
    dot_balls: int,
    avg_pressure_defended: float,
    death_overs_bowled: int
) -> Dict[str, Any]:
    """Calculate Contextual Performance Score (0-100) for a bowling spell."""
    if balls_bowled <= 0:
        return {"cpi_score": 0.0, "rating_tier": "DNP", "analysis": "Did not bowl"}

    overs = balls_bowled / 6.0
    economy = (runs_conceded / overs) if overs > 0 else 0.0
    dot_pct = (dot_balls / balls_bowled) * 100.0

    # Wicket impact (up to 40 pts, each wicket is worth ~10-12 pts)
    wicket_score = min(40.0, wickets * 12.0)

    # Economy containment score (up to 30 pts)
    # T20 par economy is ~8.5. Sub 6.0 is elite.
    economy_score = min(30.0, max(0.0, (12.0 - economy) / 6.0 * 30.0))

    # Dot ball pressure generation (up to 15 pts)
    dot_score = (dot_pct / 100.0) * 15.0

    # Death overs execution bonus (up to 15 pts)
    death_bonus = min(15.0, death_overs_bowled * 7.5) if economy <= 9.5 else 0.0

    raw_cpi = wicket_score + economy_score + dot_score + death_bonus
    final_score = float(np.clip(round(raw_cpi, 1), 10.0, 99.5))

    if final_score >= 85.0:
        tier = "Elite Spell"
    elif final_score >= 70.0:
        tier = "Match-Winning Defense"
    elif final_score >= 50.0:
        tier = "Controlled Delivery"
    else:
        tier = "Expensive Spell"

    analysis = (
        f"Claimed {wickets} wickets with economy {economy:.2f} ({dot_balls} dots) "
        f"defending under {avg_pressure_defended:.1f}/100 pressure."
    )

    return {
        "cpi_score": final_score,
        "economy": round(economy, 2),
        "wickets": wickets,
        "dot_pct": round(dot_pct, 1),
        "rating_tier": tier,
        "analysis": analysis,
    }
