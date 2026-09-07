"""Players and Player DNA API router."""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
import duckdb

from data_pipeline.warehouse_loader import DEFAULT_DB_PATH
from analytics.player_dna import get_player_dna
from analytics.player_dossier import get_player_dossier, compare_players

router = APIRouter(prefix="/api/players", tags=["Players"])


@router.get("/compare")
def compare_two_players(
    p1: str = Query(..., description="First player name"),
    p2: str = Query(..., description="Second player name")
):
    """Compare two players side-by-side with dual 10-axis radar and head-to-head encounters."""
    comparison = compare_players(p1, p2, db_path=DEFAULT_DB_PATH)
    if not comparison:
        raise HTTPException(
            status_code=404,
            detail=f"Could not compare players '{p1}' and '{p2}'. Ensure both names are valid."
        )
    return comparison


@router.get("")
def list_players(
    query: Optional[str] = None,
    sort_by: str = Query("runs", pattern="^(runs|wickets|sr|economy)$"),
    limit: int = Query(30, ge=1, le=100)
):
    """List and search player profiles with career aggregates."""
    con = duckdb.connect(DEFAULT_DB_PATH, read_only=True)
    where_clause = ""
    params = []

    if query:
        where_clause = "WHERE LOWER(player_name) LIKE ?"
        params.append(f"%{query.lower()}%")

    sort_map = {
        "runs": "total_runs DESC",
        "wickets": "total_wickets DESC",
        "sr": "strike_rate DESC",
        "economy": "economy ASC"
    }
    order_clause = sort_map.get(sort_by, "total_runs DESC")

    sql = f"""
        SELECT
            player_name,
            total_runs,
            balls_faced,
            strike_rate,
            total_fours,
            total_sixes,
            total_wickets,
            balls_bowled,
            economy,
            matches_played
        FROM dim_players
        {where_clause}
        ORDER BY {order_clause}
        LIMIT {limit}
    """
    df = con.execute(sql, params).fetchdf()
    con.close()

    players = df.to_dict(orient="records")
    return {"count": len(players), "players": players}


@router.get("/{player_name}/dna")
def get_player_dna_profile(player_name: str):
    """Retrieve 10-axis Player DNA radar vector and archetype."""
    dna = get_player_dna(player_name, db_path=DEFAULT_DB_PATH)
    if not dna or not dna.get("radar_axes"):
        raise HTTPException(status_code=404, detail=f"Player DNA not found for '{player_name}'")
    return dna


@router.get("/{player_name}/dossier")
def get_player_dossier_profile(player_name: str):
    """Retrieve deep scouting dossier: phase telemetry, nemesis matrix, and season trajectory."""
    dossier = get_player_dossier(player_name, db_path=DEFAULT_DB_PATH)
    if not dossier:
        raise HTTPException(status_code=404, detail=f"Scouting dossier not found for '{player_name}'")
    return dossier

