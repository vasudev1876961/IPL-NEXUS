"""Live Win Probability Prediction API router."""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from ml.inference.win_predictor import predict_win_probability

router = APIRouter(prefix="/api/predict", tags=["Prediction"])


class WinPredictionRequest(BaseModel):
    innings: int = Field(2, ge=1, le=2)
    over_num: int = Field(15, ge=0, le=19)
    current_score: int = Field(135, ge=0)
    current_wickets: int = Field(3, ge=0, le=10)
    balls_remaining: int = Field(30, ge=0, le=120)
    target_runs: int = Field(175, ge=0)
    pressure_index: Optional[float] = Field(50.0, ge=0.0, le=100.0)
    batting_team: Optional[str] = "Chennai Super Kings"
    bowling_team: Optional[str] = "Mumbai Indians"


@router.post("")
def predict_match_outcome(req: WinPredictionRequest):
    """Predict live win probabilities, driver attribution, and counterfactuals."""
    res = predict_win_probability(
        innings=req.innings,
        over_num=req.over_num,
        current_score=req.current_score,
        current_wickets=req.current_wickets,
        balls_remaining=req.balls_remaining,
        target_runs=req.target_runs,
        pressure_index=req.pressure_index or 50.0,
        batting_team=req.batting_team or "Batting Team",
        bowling_team=req.bowling_team or "Bowling Team"
    )
    return res
