"""FastAPI Main Application for IPL Nexus.

High-throughput decision intelligence platform backend for T20 cricket.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any

from backend.app.api.matches import router as matches_router
from backend.app.api.players import router as players_router
from backend.app.api.matchups import router as matchups_router
from backend.app.api.prediction import router as prediction_router
from backend.app.api.simulation import router as simulation_router
from backend.app.api.strategy import router as strategy_router
from backend.app.api.chat import router as chat_router

app = FastAPI(
    title="IPL Nexus API",
    description="Explainable AI & Decision Intelligence Platform for T20 Cricket",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(matches_router)
app.include_router(players_router)
app.include_router(matchups_router)
app.include_router(prediction_router)
app.include_router(simulation_router)
app.include_router(strategy_router)
app.include_router(chat_router)


@app.get("/api/health")
@app.get("/health")
def health_check() -> Dict[str, Any]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "system": "IPL Nexus Decision Intelligence Platform",
        "engine": "DuckDB OLAP + Calibrated Gradient Boosting",
        "dataset_matches": 1243,
        "deliveries": 295732
    }


@app.get("/api/live")
def get_live_match_state() -> Dict[str, Any]:
    """Simulate active high-stakes live match center state for real-time dashboard."""
    return {
        "match_id": "live-ipl-final-2025",
        "title": "IPL 2025 Final — High Tension Death Over Chase",
        "venue": "Wankhede Stadium, Mumbai",
        "innings": 2,
        "batting_team": {
            "name": "Chennai Super Kings",
            "short": "CSK",
            "score": "164/4",
            "overs": "17.2",
            "crr": 9.46,
            "target": 188,
            "runs_needed": 24,
            "balls_remaining": 16,
            "rrr": 9.0,
            "win_probability": 63.8
        },
        "bowling_team": {
            "name": "Mumbai Indians",
            "short": "MI",
            "score": "187/6 (20.0)",
            "win_probability": 36.2
        },
        "current_pressure": 78.4,
        "pressure_tier": "HIGH PRESSURE / CRUNCH PHASE",
        "active_batsmen": [
            {"name": "RA Jadeja", "runs": 28, "balls": 16, "fours": 2, "sixes": 1, "sr": 175.0, "is_striker": True},
            {"name": "MS Dhoni", "runs": 12, "balls": 7, "fours": 1, "sixes": 1, "sr": 171.4, "is_striker": False}
        ],
        "active_bowler": {
            "name": "JJ Bumrah",
            "figures": "3.2-0-22-2",
            "econ": 6.6,
            "dots": 11
        },
        "recent_balls": ["4", "1", "W", "2", "6", "1"],
        "recent_turning_point": {
            "over": 16.4,
            "event": "WICKET: RD Gaikwad b JJ Bumrah (Caught Deep Midwicket)",
            "impact": "-16.4% Win Probability",
            "significance": "CRITICAL"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
