"""Dynamic Match Pressure Index (DPI) calculation engine.

Computes a calibrated situational pressure score (0 - 100) for every over
and delivery in an IPL match.
"""

import numpy as np
import pandas as pd


def compute_delivery_pressure(
    innings: int,
    over_num: int,
    current_wickets: int,
    current_rr: float,
    required_rr: float,
    balls_remaining: int,
    runs_needed: int,
) -> float:
    """Compute normalized 0-100 Pressure Index for a single match state.
    
    Formula:
    - Innings 2: Dynamic composite of Required Run Rate stress, wicket attrition,
      and balls remaining crunch.
    - Innings 1: Phase par deficit, wicket loss pressure, and death over urgency.
    """
    if innings == 2:
        # Pressure base scales with required run rate
        # Baseline RRR in T20 is ~8.5
        rrr_stress = max(0.0, (required_rr - 6.0) / 10.0) * 40.0

        # Wicket stress: loss of wickets accelerates pressure non-linearly
        wicket_stress = ((current_wickets / 10.0) ** 1.8) * 35.0

        # Balls crunch: late match overs amplify tension
        urgency = (1.0 - (max(0, balls_remaining) / 120.0)) * 15.0

        # Close chase factor
        if balls_remaining <= 24 and runs_needed > 0:
            crunch = max(0.0, (runs_needed / max(1, balls_remaining) - 1.5)) * 10.0
        else:
            crunch = 0.0

        total_pressure = rrr_stress + wicket_stress + urgency + crunch
    else:
        # 1st Innings: pressure based on wickets lost vs par score progression
        expected_score_by_over = over_num * 8.5
        # Wickets lost early create high pressure
        wicket_pressure = (current_wickets / 10.0) * 50.0
        # Phase pressure
        if over_num < 6:
            # Powerplay: losing > 2 wickets is high pressure
            phase_stress = max(0, current_wickets - 1) * 15.0
        elif over_num >= 15:
            # Death overs: urgency to maximize runs
            phase_stress = 20.0 + (current_wickets * 2.0)
        else:
            phase_stress = 10.0

        total_pressure = wicket_pressure + phase_stress

    # Clamp cleanly between 5.0 and 99.0
    return float(np.clip(round(total_pressure, 1), 5.0, 99.0))


def calculate_match_pressure_series(deliveries: pd.DataFrame) -> pd.DataFrame:
    """Calculate pressure index across an entire match delivery DataFrame."""
    df = deliveries.copy()
    pressures = []

    for _, row in df.iterrows():
        p = compute_delivery_pressure(
            innings=int(row.get("innings", 1)),
            over_num=int(row.get("over_num", 0)),
            current_wickets=int(row.get("current_wickets", 0)),
            current_rr=float(row.get("current_rr", 0.0)),
            required_rr=float(row.get("required_rr", 0.0)),
            balls_remaining=int(row.get("balls_remaining", 120)),
            runs_needed=int(row.get("runs_needed", 0)),
        )
        pressures.append(p)

    df["pressure_index"] = pressures
    return df
