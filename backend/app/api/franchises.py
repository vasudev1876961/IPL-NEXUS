"""Franchise War Room & Squad Decision Intelligence API Router.

Exposes broadcast-grade franchise dossiers, head-to-head rivalry matrices,
playing XI tactical clash simulations (with IPL Impact Player rule), and
mega auction purse optimization directly from DuckDB.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from analytics.franchises import (
    get_all_franchises_summary,
    get_franchise_dossier,
    get_rivalry_details,
    get_rivalry_matrix,
    simulate_playing_xi_clash,
    get_auction_targets,
    ACTIVE_FRANCHISES
)

router = APIRouter(prefix="/api/franchises", tags=["Franchise War Room"])


class PlayingXIClashRequest(BaseModel):
    team1_id: str = Field(...)
    team1_lineup: List[str] = Field(..., min_length=11, max_length=11)
    team1_impact_sub: Optional[str] = Field(None)
    team2_id: str = Field(...)
    team2_lineup: List[str] = Field(..., min_length=11, max_length=11)
    team2_impact_sub: Optional[str] = Field(None)
    venue_id: str = Field("wankhede")


@router.get("")
def list_franchises() -> Dict[str, Any]:
    """Retrieve catalog and career standings of all 10 active IPL franchises."""
    summaries = get_all_franchises_summary()
    return {
        "count": len(summaries),
        "franchises": summaries
    }


@router.get("/rivalry-matrix")
def get_matrix() -> Dict[str, Any]:
    """Retrieve complete 10x10 head-to-head clash matrix for all active franchises."""
    matrix = get_rivalry_matrix()
    return matrix


@router.get("/rivalry")
def get_team_rivalry(
    team1: str = Query("MI", description="First franchise ID (e.g. MI, CSK)"),
    team2: str = Query("CSK", description="Second franchise ID (e.g. CSK, RCB)")
) -> Dict[str, Any]:
    """Retrieve comprehensive head-to-head clash history between two franchises."""
    t1 = team1.upper()
    t2 = team2.upper()
    if t1 not in ACTIVE_FRANCHISES or t2 not in ACTIVE_FRANCHISES:
        raise HTTPException(status_code=404, detail="One or both franchise IDs are invalid.")
    if t1 == t2:
        raise HTTPException(status_code=400, detail="Cannot compare a franchise against itself.")

    try:
        details = get_rivalry_details(t1, t2)
        return details
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{franchise_id}/dossier")
def get_dossier(franchise_id: str) -> Dict[str, Any]:
    """Retrieve executive strategic dossier for an IPL franchise."""
    fid = franchise_id.upper()
    if fid not in ACTIVE_FRANCHISES:
        raise HTTPException(status_code=404, detail=f"Franchise '{franchise_id}' not found.")

    try:
        dossier = get_franchise_dossier(fid)
        return dossier
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{franchise_id}/auction-targets")
def get_targets(franchise_id: str) -> Dict[str, Any]:
    """Retrieve auction player pool with Expected Auction Valuation (EAV) and purse balance."""
    fid = franchise_id.upper()
    if fid not in ACTIVE_FRANCHISES:
        raise HTTPException(status_code=404, detail=f"Franchise '{franchise_id}' not found.")

    try:
        data = get_auction_targets(fid)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate-clash")
def simulate_clash(req: PlayingXIClashRequest) -> Dict[str, Any]:
    """Simulate tactical battle between two Playing XIs with IPL Impact Player rule."""
    t1 = req.team1_id.upper()
    t2 = req.team2_id.upper()
    if t1 not in ACTIVE_FRANCHISES or t2 not in ACTIVE_FRANCHISES:
        raise HTTPException(status_code=404, detail="Invalid franchise ID in lineup request.")

    try:
        result = simulate_playing_xi_clash(
            team1_id=t1,
            team1_lineup=req.team1_lineup,
            team1_impact_sub=req.team1_impact_sub,
            team2_id=t2,
            team2_lineup=req.team2_lineup,
            team2_impact_sub=req.team2_impact_sub,
            venue_id=req.venue_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
