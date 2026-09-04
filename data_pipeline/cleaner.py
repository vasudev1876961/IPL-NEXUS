"""IPL data cleaner and normalizer.

Standardizes franchise team names, resolves player aliases, handles extras,
and tags delivery phases (Powerplay, Middle, Death).
"""

import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

TEAM_NAME_MAPPING = {
    "Delhi Daredevils": "Delhi Capitals",
    "Kings XI Punjab": "Punjab Kings",
    "Royal Challengers Bangalore": "Royal Challengers Bengaluru",
    "Rising Pune Supergiant": "Rising Pune Supergiant",
    "Rising Pune Supergiants": "Rising Pune Supergiant",
    "Deccan Chargers": "Sunrisers Hyderabad",
    "Pune Warriors": "Pune Warriors",
    "Gujarat Lions": "Gujarat Lions",
    "Kochi Tuskers Kerala": "Kochi Tuskers Kerala",
}

CANONICAL_TEAMS = [
    "Chennai Super Kings",
    "Mumbai Indians",
    "Kolkata Knight Riders",
    "Royal Challengers Bengaluru",
    "Delhi Capitals",
    "Punjab Kings",
    "Rajasthan Royals",
    "Sunrisers Hyderabad",
    "Gujarat Titans",
    "Lucknow Super Giants",
]


def clean_team_name(team: str) -> str:
    """Normalize team name to standard franchise moniker."""
    if not isinstance(team, str):
        return ""
    team_clean = team.strip()
    return TEAM_NAME_MAPPING.get(team_clean, team_clean)


def get_match_phase(ball: float) -> str:
    """Classify delivery over into match phase.
    
    ball is given in Cricsheet notation (e.g. 0.1 to 19.6).
    """
    over = int(ball)
    if over < 6:
        return "Powerplay"
    elif over < 15:
        return "Middle"
    else:
        return "Death"


def clean_deliveries(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and standardize raw ball-by-ball DataFrame."""
    logger.info("Standardizing team names and match phases...")
    df = df.copy()

    # Standardize teams
    if "batting_team" in df.columns:
        df["batting_team"] = df["batting_team"].apply(clean_team_name)
    if "bowling_team" in df.columns:
        df["bowling_team"] = df["bowling_team"].apply(clean_team_name)

    # Standardize balls and overs
    if "ball" in df.columns:
        df["over_num"] = df["ball"].astype(float).astype(int)
        df["ball_in_over"] = ((df["ball"].astype(float) * 10).round() % 10).astype(int)
        df["phase"] = df["ball"].apply(get_match_phase)

    # Standardize extras and runs
    df["runs_off_bat"] = df["runs_off_bat"].fillna(0).astype(int)
    df["extras"] = df["extras"].fillna(0).astype(int)
    df["total_runs"] = df["runs_off_bat"] + df["extras"]

    # Wickets
    df["is_wicket"] = df["player_dismissed"].notna() & (df["player_dismissed"] != "")
    df["dismissal_kind"] = df["wicket_type"].fillna("none")

    # Flag legal deliveries (wides and noballs do not count as legal balls bowled)
    df["is_wide"] = df["wides"].fillna(0) > 0
    df["is_noball"] = df["noballs"].fillna(0) > 0
    df["is_legal_ball"] = ~(df["is_wide"] | df["is_noball"])

    # Boundary flags
    df["is_dot"] = (df["total_runs"] == 0) & df["is_legal_ball"]
    df["is_four"] = df["runs_off_bat"] == 4
    df["is_six"] = df["runs_off_bat"] == 6
    df["is_boundary"] = df["is_four"] | df["is_six"]

    return df
