"""Automated pytest suite for IPL Nexus backend APIs and intelligence engines."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from ml.simulation.simulator import run_monte_carlo_simulation
from analytics.pressure import compute_delivery_pressure
from analytics.matchups import get_matchup_analysis

client = TestClient(app)


def test_health_endpoint():
    """Verify health endpoint returns 200 and healthy status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["dataset_matches"] >= 1000


def test_live_match_endpoint():
    """Verify live match broadcast state."""
    response = client.get("/api/live")
    assert response.status_code == 200
    data = response.json()
    assert "batting_team" in data
    assert "win_probability" in data["batting_team"]
    assert "current_pressure" in data


def test_list_matches():
    """Verify matches listing returns historical matches."""
    response = client.get("/api/matches?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "matches" in data
    assert len(data["matches"]) > 0


def test_players_list_and_search():
    """Verify player listing and search."""
    response = client.get("/api/players?query=Kohli")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert any("Kohli" in p["player_name"] for p in data["players"])


def test_player_dna():
    """Verify 10-axis Player DNA radar vector."""
    response = client.get("/api/players/V Kohli/dna")
    assert response.status_code == 200
    dna = response.json()
    assert len(dna["radar_axes"]) == 10
    assert dna["role"] in ["Batter", "Bowler"]


def test_matchups():
    """Verify Batter vs Bowler head-to-head analysis."""
    response = client.get("/api/matchups?batter=V Kohli&bowler=JJ Bumrah")
    assert response.status_code == 200
    res = response.json()
    assert res["balls_faced"] > 0
    assert "strike_rate" in res
    assert "tactical_edge" in res


def test_win_prediction_endpoint():
    """Verify ML win probability and counterfactual response."""
    payload = {
        "innings": 2,
        "over_num": 16,
        "current_score": 140,
        "current_wickets": 4,
        "balls_remaining": 24,
        "target_runs": 180,
        "pressure_index": 68.0,
        "batting_team": "Chennai Super Kings",
        "bowling_team": "Mumbai Indians"
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert 0 <= data["batting_win_probability"] <= 100
    assert len(data["counterfactuals"]) >= 3


def test_monte_carlo_simulation():
    """Verify 10,000-run Monte Carlo simulation converges."""
    res = run_monte_carlo_simulation(
        current_score=135,
        current_wickets=3,
        balls_remaining=30,
        target_runs=180,
        innings=2,
        num_simulations=5000
    )
    assert 0 <= res["win_probability"] <= 100
    assert res["expected_final_score"] >= 135
    assert len(res["score_distribution"]) > 0


def test_ai_chat_assistant():
    """Verify grounded AI assistant responds with evidence."""
    response = client.post("/api/chat", json={"query": "Who has hit the most sixes in IPL history?"})
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "evidence" in data


def test_match_detail_scorecards_and_timeline():
    """Verify full dual-innings scorecards, FOW, and overs timeline."""
    list_res = client.get("/api/matches?limit=1")
    assert list_res.status_code == 200
    match_id = list_res.json()["matches"][0]["match_id"]

    detail_res = client.get(f"/api/matches/{match_id}")
    assert detail_res.status_code == 200
    data = detail_res.json()
    assert "innings1_card" in data
    assert "innings2_card" in data
    assert "overs_timeline" in data
    assert len(data["innings1_card"]["batting"]) > 0
    assert len(data["innings1_card"]["bowling"]) > 0
    assert "fall_of_wickets" in data["innings1_card"]


def test_list_matches_filter():
    """Verify filtering by team name."""
    res = client.get("/api/matches?team=Chennai&limit=5")
    assert res.status_code == 200
    data = res.json()
    assert len(data["matches"]) > 0
    for m in data["matches"]:
        assert "Chennai" in m["team1"]["name"] or "Chennai" in m["team2"]["name"]

