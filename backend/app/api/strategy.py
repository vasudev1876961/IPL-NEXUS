"""Strategy Lab and Tactical Decision Recommender API router."""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from analytics.strategy import recommend_bowler_for_over, get_batting_tactical_plan

router = APIRouter(prefix="/api/strategy", tags=["Strategy"])


class BowlerRecommendationRequest(BaseModel):
    striker: str = "V Kohli"
    non_striker: str = "F du Plessis"
    phase: str = Field("Death", pattern="^(Powerplay|Middle|Death)$")
    available_bowlers: List[str] = ["JJ Bumrah", "TA Boult", "SP Narine", "Rashid Khan", "HV Patel"]


class BattingPlanRequest(BaseModel):
    required_rr: float = Field(10.5, ge=0.0)
    wickets_lost: int = Field(3, ge=0, le=10)
    overs_remaining: float = Field(5.0, ge=0.0, le=20.0)
    current_score: int = Field(130, ge=0)
    target_runs: int = Field(182, ge=0)


@router.post("/recommend-bowler")
def get_bowler_advice(req: BowlerRecommendationRequest):
    """Rank available bowlers and select optimal matchup choice for upcoming over."""
    rec = recommend_bowler_for_over(
        striker=req.striker,
        non_striker=req.non_striker,
        phase=req.phase,
        available_bowlers=req.available_bowlers
    )
    return rec


@router.post("/batting-plan")
def get_batting_advice(req: BattingPlanRequest):
    """Generate tactical batting plan and risk posture for remaining overs."""
    plan = get_batting_tactical_plan(
        required_rr=req.required_rr,
        wickets_lost=req.wickets_lost,
        overs_remaining=req.overs_remaining,
        current_score=req.current_score,
        target_runs=req.target_runs
    )
    return plan
