"""Batter vs Bowler Matchups API router."""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any

from data_pipeline.warehouse_loader import DEFAULT_DB_PATH
from analytics.matchups import get_matchup_analysis

router = APIRouter(prefix="/api/matchups", tags=["Matchups"])


@router.get("")
def analyze_matchup(
    batter: str = Query(..., description="Name of batter e.g. 'V Kohli'"),
    bowler: str = Query(..., description="Name of bowler e.g. 'JJ Bumrah'")
):
    """Retrieve ball-by-ball head-to-head metrics and tactical edge analysis."""
    matchup = get_matchup_analysis(batter, bowler, db_path=DEFAULT_DB_PATH)
    return matchup
