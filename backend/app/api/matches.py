"""Matches and Live Scorecards API router."""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
import duckdb
import numpy as np

from data_pipeline.warehouse_loader import DEFAULT_DB_PATH
from analytics.momentum import calculate_momentum_curve, detect_turning_points
from analytics.pressure import calculate_match_pressure_series

router = APIRouter(prefix="/api/matches", tags=["Matches"])


@router.get("")
def list_matches(
    season: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List historical and recent IPL matches with team scores and winner."""
    con = duckdb.connect(DEFAULT_DB_PATH, read_only=True)
    where_clause = f"WHERE season = '{season}'" if season else ""
    query = f"""
        SELECT
            match_id,
            match_date,
            season,
            venue,
            team1,
            team2,
            innings1_score,
            innings1_wickets,
            innings2_score,
            innings2_wickets,
            match_winner
        FROM dim_matches
        {where_clause}
        ORDER BY match_date DESC
        LIMIT {limit} OFFSET {offset}
    """
    df = con.execute(query).fetchdf()
    total = con.execute(f"SELECT COUNT(*) FROM dim_matches {where_clause}").fetchone()[0]
    con.close()

    matches = []
    for _, r in df.iterrows():
        matches.append({
            "match_id": r["match_id"],
            "date": r["match_date"],
            "season": str(r["season"]),
            "venue": r["venue"],
            "team1": {
                "name": r["team1"],
                "score": f"{int(r['innings1_score'])}/{int(r['innings1_wickets'])}"
            },
            "team2": {
                "name": r["team2"],
                "score": f"{int(r['innings2_score'])}/{int(r['innings2_wickets'])}"
            },
            "winner": r["match_winner"],
            "status": "Completed"
        })

    return {"total": total, "matches": matches}


@router.get("/{match_id}")
def get_match_detail(match_id: str):
    """Retrieve match scorecard, delivery streams, momentum wave, and turning points."""
    con = duckdb.connect(DEFAULT_DB_PATH, read_only=True)

    match_meta = con.execute(
        "SELECT * FROM dim_matches WHERE match_id = ?", [match_id]
    ).fetchdf()

    if len(match_meta) == 0:
        con.close()
        raise HTTPException(status_code=404, detail=f"Match {match_id} not found")

    meta = match_meta.iloc[0].to_dict()

    # Fetch ball-by-ball deliveries
    deliveries_df = con.execute(
        """
        SELECT * FROM fact_deliveries
        WHERE match_id = ?
        ORDER BY innings, over_num, ball_in_over
        """,
        [match_id]
    ).fetchdf()
    con.close()

    # Calculate delta win probability ball-by-ball for momentum
    if "pressure_index" not in deliveries_df.columns:
        deliveries_df = calculate_match_pressure_series(deliveries_df)

    # Estimate simulated win probability evolution
    win_probs = []
    deltas = []
    prev_p = 50.0
    for _, row in deliveries_df.iterrows():
        inn = int(row["innings"])
        wickets = int(row["current_wickets"])
        score = int(row["current_score"])
        over = int(row["over_num"])

        # Realistic probabilistic tracking
        if inn == 1:
            curr_p = float(np.clip(50.0 + (score / max(1, (over + 1) * 8.5) - 1.0) * 35.0 - (wickets * 4.5), 10.0, 90.0))
        else:
            req_rr = float(row.get("required_rr", 8.5))
            curr_p = float(np.clip(50.0 - (req_rr - 8.5) * 6.5 + (10 - wickets) * 3.0, 5.0, 95.0))

        delta = round(curr_p - prev_p, 1)
        win_probs.append(curr_p)
        deltas.append(delta)
        prev_p = curr_p

    deliveries_df["win_prob"] = win_probs
    deliveries_df["delta_win_prob"] = deltas

    # Generate momentum wave and turning points
    momentum_curve = calculate_momentum_curve(deliveries_df)
    turning_points = detect_turning_points(deliveries_df, swing_threshold=8.0)

    # Summarize top batters & bowlers for scorecard
    top_batters = deliveries_df.groupby(["striker", "batting_team"]).agg(
        runs=("runs_off_bat", "sum"),
        balls=("is_legal_ball", "sum"),
        fours=("is_four", "sum"),
        sixes=("is_six", "sum")
    ).reset_index().sort_values(by="runs", ascending=False).head(8).to_dict(orient="records")

    top_bowlers = deliveries_df.groupby(["bowler", "bowling_team"]).agg(
        runs=("total_runs", "sum"),
        balls=("is_legal_ball", "sum"),
        wickets=("is_wicket", "sum"),
        dots=("is_dot", "sum")
    ).reset_index().sort_values(by="wickets", ascending=False).head(8).to_dict(orient="records")

    for b in top_batters:
        b["sr"] = round((b["runs"] / max(1, b["balls"])) * 100.0, 1)
    for bo in top_bowlers:
        overs = bo["balls"] / 6.0
        bo["economy"] = round(bo["runs"] / max(0.1, overs), 2)
        bo["overs"] = f"{bo['balls'] // 6}.{bo['balls'] % 6}"

    return {
        "match_id": match_id,
        "summary": meta,
        "momentum_curve": momentum_curve,
        "turning_points": turning_points[:6],
        "scorecard": {
            "top_batters": top_batters,
            "top_bowlers": top_bowlers
        },
        "total_deliveries": len(deliveries_df)
    }
