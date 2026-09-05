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
    team: Optional[str] = None,
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List historical and recent IPL matches with team scores, winner, and optional team/season filters."""
    con = duckdb.connect(DEFAULT_DB_PATH, read_only=True)
    
    where_parts = []
    if season:
        clean_season = season.replace("'", "''")
        where_parts.append(f"season = '{clean_season}'")
    if team:
        clean_team = team.replace("'", "''")
        where_parts.append(f"(team1 ILIKE '%{clean_team}%' OR team2 ILIKE '%{clean_team}%')")

    where_clause = ("WHERE " + " AND ".join(where_parts)) if where_parts else ""

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


def _build_innings_scorecard(deliveries_df, inn: int, batting_team: str, bowling_team: str):
    """Construct complete batting line-up, bowling figures, and FOW for an innings."""
    inn_df = deliveries_df[deliveries_df["innings"] == inn]
    if len(inn_df) == 0:
        return {
            "batting": [],
            "bowling": [],
            "fall_of_wickets": [],
            "extras": {"total": 0, "wides": 0, "no_balls": 0, "byes": 0, "leg_byes": 0},
            "total_runs": 0,
            "total_wickets": 0,
            "overs_completed": "0.0",
            "team": batting_team
        }

    # Batters in order of first appearance
    bat_order = []
    seen_batters = set()
    for _, r in inn_df.iterrows():
        st = r["striker"]
        if st not in seen_batters:
            seen_batters.add(st)
            bat_order.append(st)
        nst = r.get("non_striker")
        if nst and nst not in seen_batters:
            seen_batters.add(nst)
            bat_order.append(nst)

    # Build dismissal descriptions
    dismissals = {}
    wkts_df = inn_df[inn_df["is_wicket"] == True]
    for _, w in wkts_df.iterrows():
        p = w.get("player_dismissed") or w["striker"]
        k = str(w.get("dismissal_kind", "wicket")).strip()
        b = w["bowler"]
        if k == "bowled":
            desc = f"b {b}"
        elif k == "caught":
            desc = f"c sub b {b}"
        elif k == "lbw":
            desc = f"lbw b {b}"
        elif k == "stumped":
            desc = f"st b {b}"
        elif k in ["caught and bowled", "c&b"]:
            desc = f"c & b {b}"
        elif k == "run out":
            desc = "run out"
        elif k in ["hit wicket", "retired hurt", "obstructing the field"]:
            desc = k
        else:
            desc = f"{k} b {b}"
        dismissals[p] = desc

    batting_rows = []
    for b in bat_order:
        b_df = inn_df[inn_df["striker"] == b]
        runs = int(b_df["runs_off_bat"].sum()) if len(b_df) > 0 else 0
        balls = int(b_df["is_legal_ball"].sum()) if len(b_df) > 0 else 0
        fours = int(b_df["is_four"].sum()) if len(b_df) > 0 else 0
        sixes = int(b_df["is_six"].sum()) if len(b_df) > 0 else 0
        sr = round((runs / max(1, balls)) * 100.0, 1)
        dismissal = dismissals.get(b, "not out")
        batting_rows.append({
            "striker": b,
            "batting_team": batting_team,
            "runs": runs,
            "balls": balls,
            "fours": fours,
            "sixes": sixes,
            "sr": sr,
            "dismissal": dismissal
        })

    # Bowlers in order of bowling
    bowlers_order = []
    seen_bowlers = set()
    for _, r in inn_df.iterrows():
        bo = r["bowler"]
        if bo not in seen_bowlers:
            seen_bowlers.add(bo)
            bowlers_order.append(bo)

    bowling_rows = []
    for bo in bowlers_order:
        bo_df = inn_df[inn_df["bowler"] == bo]
        balls = int(bo_df["is_legal_ball"].sum())
        runs = int(bo_df["total_runs"].sum())
        # Bowler wickets exclude run outs, retired hurt
        wkts = int(bo_df[(bo_df["is_wicket"] == True) & (~bo_df["dismissal_kind"].isin(["run out", "retired hurt", "obstructing the field"]))].shape[0])
        dots = int(bo_df["is_dot"].sum())
        overs_str = f"{balls // 6}.{balls % 6}"
        economy = round(runs / max(0.1, balls / 6.0), 2)
        
        # Calculate maidens
        maidens = 0
        for _, ov_grp in bo_df.groupby("over_num"):
            if ov_grp["is_legal_ball"].sum() >= 6 and ov_grp["total_runs"].sum() == 0:
                maidens += 1

        bowling_rows.append({
            "bowler": bo,
            "bowling_team": bowling_team,
            "overs": overs_str,
            "maidens": maidens,
            "runs": runs,
            "wickets": wkts,
            "dots": dots,
            "economy": economy
        })

    # Fall of wickets
    fow = []
    for _, w in wkts_df.iterrows():
        ov = int(w["over_num"])
        b = int(w["ball_in_over"])
        fow.append({
            "score": int(w["current_score"]),
            "wickets": int(w["current_wickets"]),
            "player": w.get("player_dismissed") or w["striker"],
            "over": f"{ov}.{b}"
        })

    total_runs = int(inn_df["total_runs"].sum())
    total_wkts = int(inn_df["is_wicket"].sum())
    legal_balls = int(inn_df["is_legal_ball"].sum())
    overs_completed = f"{legal_balls // 6}.{legal_balls % 6}"
    total_extras = int(inn_df["extras"].sum())

    return {
        "batting": batting_rows,
        "bowling": bowling_rows,
        "fall_of_wickets": fow,
        "extras": {
            "total": total_extras,
        },
        "total_runs": total_runs,
        "total_wickets": total_wkts,
        "overs_completed": overs_completed,
        "team": batting_team
    }


def _build_overs_timeline(deliveries_df):
    """Group deliveries into over-by-over ball sequences for the interactive telemetry scrubber."""
    overs_by_innings = {1: [], 2: []}
    for inn in [1, 2]:
        inn_df = deliveries_df[deliveries_df["innings"] == inn]
        if len(inn_df) == 0:
            continue
        for ov_num, grp in inn_df.groupby("over_num"):
            balls = []
            for _, r in grp.iterrows():
                balls.append({
                    "ball_in_over": int(r["ball_in_over"]),
                    "ball_label": f"{int(ov_num) + 1}.{int(r['ball_in_over'])}",
                    "striker": str(r["striker"]),
                    "bowler": str(r["bowler"]),
                    "runs_off_bat": int(r["runs_off_bat"]),
                    "extras": int(r["extras"]),
                    "total_runs": int(r["total_runs"]),
                    "is_wicket": bool(r["is_wicket"]),
                    "dismissal_kind": str(r["dismissal_kind"]) if r["is_wicket"] else None,
                    "player_dismissed": str(r["player_dismissed"]) if r["is_wicket"] else None,
                    "is_dot": bool(r["is_dot"]),
                    "is_four": bool(r["is_four"]),
                    "is_six": bool(r["is_six"]),
                    "win_prob": round(float(r.get("win_prob", 50.0)), 1),
                    "delta_win_prob": round(float(r.get("delta_win_prob", 0.0)), 1),
                    "current_score": int(r.get("current_score", 0)),
                    "current_wickets": int(r.get("current_wickets", 0))
                })
            overs_by_innings[inn].append({
                "over_num": int(ov_num) + 1,
                "bowler": grp.iloc[-1]["bowler"],
                "runs": int(grp["total_runs"].sum()),
                "wickets": int(grp["is_wicket"].sum()),
                "balls": balls
            })
    return overs_by_innings


@router.get("/{match_id}")
def get_match_detail(match_id: str):
    """Retrieve comprehensive match scorecard, ball-by-ball timeline, momentum wave, and turning points."""
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

    # Detailed innings scorecards
    team1 = meta.get("team1", "Team 1")
    team2 = meta.get("team2", "Team 2")
    innings1_card = _build_innings_scorecard(deliveries_df, inn=1, batting_team=team1, bowling_team=team2)
    innings2_card = _build_innings_scorecard(deliveries_df, inn=2, batting_team=team2, bowling_team=team1)

    # Interactive overs timeline
    overs_timeline = _build_overs_timeline(deliveries_df)

    # Summarize top batters & bowlers for scorecard (backward compatibility)
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
        "turning_points": turning_points[:8],
        "scorecard": {
            "top_batters": top_batters,
            "top_bowlers": top_bowlers
        },
        "innings1_card": innings1_card,
        "innings2_card": innings2_card,
        "overs_timeline": overs_timeline,
        "total_deliveries": len(deliveries_df)
    }
