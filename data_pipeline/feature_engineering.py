"""Feature engineering for ball-by-ball IPL match dynamics.

Computes situational states:
- Cumulative runs & wickets
- Legal balls bowled & balls remaining
- Current Run Rate (CRR) & Required Run Rate (RRR)
- Target runs in 2nd innings
- Rolling windows (last 30 balls / 5 overs runs and wickets)
"""

import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)


def compute_match_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute running match state and situational features per delivery."""
    logger.info("Computing situational match state features...")
    df = df.copy()

    # Sort strictly by match, innings, ball
    df = df.sort_values(by=["match_id", "innings", "over_num", "ball_in_over"]).reset_index(drop=True)

    # Cumulative calculations grouped by match and innings
    grouped = df.groupby(["match_id", "innings"], sort=False)

    df["current_score"] = grouped["total_runs"].cumsum()
    df["current_wickets"] = grouped["is_wicket"].cumsum()
    df["legal_balls_bowled"] = grouped["is_legal_ball"].cumsum()

    # Overs completed in decimal and balls remaining (capped at 120 per T20 innings)
    df["overs_completed"] = (df["legal_balls_bowled"] // 6) + (df["legal_balls_bowled"] % 6) / 6.0
    df["balls_remaining"] = np.maximum(0, 120 - df["legal_balls_bowled"])
    df["overs_remaining"] = df["balls_remaining"] / 6.0

    # Current Run Rate (CRR)
    df["current_rr"] = np.where(
        df["legal_balls_bowled"] > 0,
        (df["current_score"] / df["legal_balls_bowled"]) * 6.0,
        0.0
    ).round(2)

    # 1st Innings Total & 2nd Innings Target calculation
    # Find max score of innings 1 for each match
    inn1_totals = df[df["innings"] == 1].groupby("match_id")["total_runs"].sum().rename("inn1_total")
    df = df.merge(inn1_totals, on="match_id", how="left")

    df["target_runs"] = np.where(
        df["innings"] == 2,
        df["inn1_total"].fillna(0) + 1,
        0
    )

    df["runs_needed"] = np.where(
        df["innings"] == 2,
        np.maximum(0, df["target_runs"] - df["current_score"]),
        0
    )

    df["required_rr"] = np.where(
        (df["innings"] == 2) & (df["balls_remaining"] > 0),
        (df["runs_needed"] / df["balls_remaining"]) * 6.0,
        0.0
    ).round(2)

    # Clean up temporary columns
    if "inn1_total" in df.columns:
        df = df.drop(columns=["inn1_total"])

    return df
