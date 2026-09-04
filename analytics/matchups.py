"""Batter vs Bowler head-to-head matchup analytics engine.

Analyzes historical delivery interactions between specific batters and bowlers
to compute strike rates, dismissals, dot-ball percentages, phase advantages,
and tactical recommendations.
"""

from typing import Dict, Any, Optional
import duckdb
import numpy as np

from data_pipeline.warehouse_loader import DEFAULT_DB_PATH


def get_matchup_analysis(
    batter_name: str,
    bowler_name: str,
    db_path: str = DEFAULT_DB_PATH
) -> Dict[str, Any]:
    """Retrieve detailed ball-by-ball head-to-head metrics between batter and bowler."""
    con = duckdb.connect(db_path, read_only=True)

    query = """
        SELECT
            COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls_faced,
            COALESCE(SUM(runs_off_bat), 0) AS runs_scored,
            COUNT(CASE WHEN is_dot THEN 1 END) AS dot_balls,
            COUNT(CASE WHEN is_four THEN 1 END) AS fours,
            COUNT(CASE WHEN is_six THEN 1 END) AS sixes,
            COUNT(CASE WHEN is_wicket AND player_dismissed = ? THEN 1 END) AS dismissals,
            -- Phase breakdowns
            COUNT(CASE WHEN phase = 'Powerplay' AND is_legal_ball THEN 1 END) AS pp_balls,
            COALESCE(SUM(CASE WHEN phase = 'Powerplay' THEN runs_off_bat ELSE 0 END), 0) AS pp_runs,
            COUNT(CASE WHEN phase = 'Middle' AND is_legal_ball THEN 1 END) AS mid_balls,
            COALESCE(SUM(CASE WHEN phase = 'Middle' THEN runs_off_bat ELSE 0 END), 0) AS mid_runs,
            COUNT(CASE WHEN phase = 'Death' AND is_legal_ball THEN 1 END) AS death_balls,
            COALESCE(SUM(CASE WHEN phase = 'Death' THEN runs_off_bat ELSE 0 END), 0) AS death_runs
        FROM fact_deliveries
        WHERE striker = ? AND bowler = ?
    """

    res = con.execute(query, [batter_name, batter_name, bowler_name]).fetchone()
    con.close()

    if not res or res[0] == 0:
        return {
            "batter": batter_name,
            "bowler": bowler_name,
            "sample_size": 0,
            "status": "No historical match deliveries recorded",
            "strike_rate": 0.0,
            "average": None,
            "tactical_edge": "Neutral / Unknown",
            "recommendation": f"Insufficient sample size ({batter_name} vs {bowler_name}). Base strategy on broader phase match-ups."
        }

    balls = int(res[0])
    runs = int(res[1])
    dots = int(res[2])
    fours = int(res[3])
    sixes = int(res[4])
    dismissals = int(res[5])

    sr = (runs / balls) * 100.0 if balls > 0 else 0.0
    dot_pct = (dots / balls) * 100.0 if balls > 0 else 0.0
    boundary_pct = ((fours * 4 + sixes * 6) / max(1, runs)) * 100.0
    average = round(runs / dismissals, 1) if dismissals > 0 else None

    # Tactical edge assessment
    if dismissals >= 2 and sr < 115.0:
        edge = f"Strong Bowler Advantage ({bowler_name})"
        rec = f"{bowler_name} exerts severe control over {batter_name} (dismissed {dismissals} times, SR {sr:.1f}). Recommend deploying {bowler_name} immediately."
    elif sr >= 160.0 and dismissals <= 1:
        edge = f"Strong Batter Advantage ({batter_name})"
        rec = f"{batter_name} dominates this matchup (SR {sr:.1f}, {sixes} sixes). Bowler should alter lengths, bowl wide yorkers, or avoid this phase."
    elif dismissals >= 1:
        edge = "Slight Bowler Advantage"
        rec = f"Balanced contest with wicket threat for {bowler_name}. Target hard lengths outside off."
    else:
        edge = "Competitive / Batter Favored"
        rec = f"{batter_name} scores steadily against {bowler_name} at {sr:.1f} SR without losing wicket."

    return {
        "batter": batter_name,
        "bowler": bowler_name,
        "sample_size": balls,
        "balls_faced": balls,
        "runs_scored": runs,
        "dots": dots,
        "dot_pct": round(dot_pct, 1),
        "fours": fours,
        "sixes": sixes,
        "dismissals": dismissals,
        "strike_rate": round(sr, 1),
        "average": average,
        "boundary_pct": round(boundary_pct, 1),
        "tactical_edge": edge,
        "recommendation": rec,
        "phase_splits": {
            "powerplay": {"balls": int(res[6]), "runs": int(res[7])},
            "middle": {"balls": int(res[8]), "runs": int(res[9])},
            "death": {"balls": int(res[10]), "runs": int(res[11])}
        }
    }
