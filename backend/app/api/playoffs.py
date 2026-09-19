"""Tournament Playoff & Decision Intelligence API Router.

Exposes broadcast points table standings, 10,000-run Monte Carlo tournament simulations,
interactive what-if fixture togglers, and tactical Net Run Rate (NRR) qualification calculators.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

from analytics.playoffs import (
    get_season_standings,
    simulate_tournament_playoffs,
    calculate_nrr_scenario
)
from analytics.franchises import ACTIVE_FRANCHISES

router = APIRouter(prefix="/api/playoffs", tags=["Tournament Playoff Predictor"])


class ScenarioSimulationRequest(BaseModel):
    season: str = Field("2024", description="IPL Season")
    simulations: int = Field(5000, ge=1000, le=20000, description="Number of Monte Carlo season simulations")
    fixture_overrides: Dict[str, str] = Field(default_factory=dict, description="Map of fixture_id to winning team_id")


class NRRCalculationRequest(BaseModel):
    team_id: str = Field(..., description="Challenging team ID (e.g. RCB)")
    target_team_id: str = Field(..., description="Target team ID to surpass (e.g. CSK)")
    scenario_type: str = Field("defend", pattern="^(defend|chase)$", description="'defend' (bat first) or 'chase' (bat second)")
    projected_runs: int = Field(180, ge=60, le=300, description="Projected 1st innings total if defending")
    target_score: int = Field(170, ge=60, le=300, description="Opposition target to chase down if chasing")


@router.get("/standings")
def get_standings(season: str = Query("2024", description="IPL season (e.g. 2024)")) -> Dict[str, Any]:
    """Retrieve official IPL standings table with Net Run Rate, form guide, and playoff status."""
    try:
        standings = get_season_standings(season=season)
        return {
            "season": season,
            "count": len(standings),
            "standings": standings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/probabilities")
def get_probabilities(
    season: str = Query("2024"),
    simulations: int = Query(5000, ge=1000, le=20000)
) -> Dict[str, Any]:
    """Run 10,000 Monte Carlo season simulations to project Top 4, Top 2, and Championship odds."""
    try:
        results = simulate_tournament_playoffs(season=season, num_simulations=simulations)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/simulate-scenarios")
def simulate_scenarios(req: ScenarioSimulationRequest) -> Dict[str, Any]:
    """Recalculate tournament standings and playoff odds with custom fixture outcome overrides."""
    try:
        results = simulate_tournament_playoffs(
            season=req.season,
            num_simulations=req.simulations,
            fixture_overrides=req.fixture_overrides
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/nrr-calculator")
def calculate_nrr(req: NRRCalculationRequest) -> Dict[str, Any]:
    """Compute exact required victory margins (run restriction or chase overs) to overtake target team's NRR."""
    t1 = req.team_id.upper()
    t2 = req.target_team_id.upper()
    if t1 not in ACTIVE_FRANCHISES or t2 not in ACTIVE_FRANCHISES:
        raise HTTPException(status_code=400, detail="Both team IDs must be valid active IPL franchises.")
    if t1 == t2:
        raise HTTPException(status_code=400, detail="Cannot calculate NRR margin against the same franchise.")

    try:
        nrr_result = calculate_nrr_scenario(
            team_id=t1,
            target_team_id=t2,
            scenario_type=req.scenario_type,
            projected_runs=req.projected_runs,
            target_score=req.target_score
        )
        return nrr_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
