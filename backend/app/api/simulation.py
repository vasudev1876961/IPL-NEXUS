"""Monte Carlo What-If Simulation API router."""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

from ml.simulation.simulator import run_monte_carlo_simulation

router = APIRouter(prefix="/api/simulate", tags=["Simulation"])


class SimulationRequest(BaseModel):
    current_score: int = Field(130, ge=0)
    current_wickets: int = Field(4, ge=0, le=10)
    balls_remaining: int = Field(36, ge=0, le=120)
    target_runs: int = Field(180, ge=0)
    innings: int = Field(2, ge=1, le=2)
    expected_next_over_runs: Optional[int] = Field(None, ge=0, le=36)
    wicket_in_next_over: bool = Field(False)
    bowling_intensity: str = Field("medium", pattern="^(high|medium|low)$")
    num_simulations: int = Field(10000, ge=1000, le=50000)


@router.post("")
def execute_simulation(req: SimulationRequest):
    """Run 10,000 Monte Carlo match simulations across remaining overs."""
    results = run_monte_carlo_simulation(
        current_score=req.current_score,
        current_wickets=req.current_wickets,
        balls_remaining=req.balls_remaining,
        target_runs=req.target_runs,
        innings=req.innings,
        num_simulations=req.num_simulations,
        expected_next_over_runs=req.expected_next_over_runs,
        wicket_in_next_over=req.wicket_in_next_over,
        bowling_intensity=req.bowling_intensity
    )
    return results
