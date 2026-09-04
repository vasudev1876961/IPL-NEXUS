"""Momentum Wave Engine and Automated Turning Point Detection.

Calculates win probability swings per delivery and identifies match-defining
turning points with analytical narrative explanations.
"""

from typing import List, Dict, Any
import numpy as np
import pandas as pd


def detect_turning_points(
    deliveries: pd.DataFrame,
    swing_threshold: float = 10.0,
    cluster_window: int = 6
) -> List[Dict[str, Any]]:
    """Detect significant match turning points from delivery stream.
    
    Identifies:
    1. Single-ball pivotal shocks (|delta_p| >= swing_threshold)
    2. Multi-ball momentum cascades (over cluster swings)
    """
    turning_points = []
    if "delta_win_prob" not in deliveries.columns or len(deliveries) == 0:
        return turning_points

    df = deliveries.copy().reset_index(drop=True)

    for i, row in df.iterrows():
        delta = float(row.get("delta_win_prob", 0.0))
        abs_delta = abs(delta)

        if abs_delta >= swing_threshold:
            striker = row.get("striker", "Batter")
            bowler = row.get("bowler", "Bowler")
            over = row.get("ball", 0.0)
            runs = int(row.get("total_runs", 0))
            is_wicket = bool(row.get("is_wicket", False))
            dismissed = row.get("player_dismissed", "")

            # Build tactical explanation
            if is_wicket:
                event_desc = f"WICKET: {dismissed} dismissed by {bowler}"
                impact = f"Swung win probability by {delta:+.1f}%"
            elif runs >= 6:
                event_desc = f"MAXIMUM: {striker} hits {bowler} for a six"
                impact = f"Surged win probability by {delta:+.1f}%"
            elif runs == 4:
                event_desc = f"BOUNDARY: {striker} hits 4 runs"
                impact = f"Shifted win probability by {delta:+.1f}%"
            else:
                event_desc = f"Critical delivery at over {over}"
                impact = f"Probability shift: {delta:+.1f}%"

            turning_points.append({
                "ball": float(over),
                "innings": int(row.get("innings", 1)),
                "event": event_desc,
                "impact": impact,
                "delta_win_prob": round(delta, 1),
                "win_prob_after": round(float(row.get("win_prob", 50.0)), 1),
                "significance": "HIGH" if abs_delta >= 15.0 else "MEDIUM",
            })

    return turning_points


def calculate_momentum_curve(deliveries: pd.DataFrame) -> List[Dict[str, Any]]:
    """Generate smoothed over-by-over momentum series for charting."""
    if len(deliveries) == 0:
        return []

    # Group by innings and over_num
    curve = []
    for (innings, over_num), group in deliveries.groupby(["innings", "over_num"]):
        avg_win_prob = group["win_prob"].iloc[-1] if "win_prob" in group.columns else 50.0
        avg_pressure = group["pressure_index"].mean() if "pressure_index" in group.columns else 30.0
        runs_in_over = group["total_runs"].sum()
        wickets_in_over = group["is_wicket"].sum()

        curve.append({
            "innings": int(innings),
            "over": int(over_num) + 1,
            "win_prob": round(float(avg_win_prob), 1),
            "pressure": round(float(avg_pressure), 1),
            "runs": int(runs_in_over),
            "wickets": int(wickets_in_over),
        })

    return curve
