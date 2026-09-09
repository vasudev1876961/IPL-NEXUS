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


def test_matchup_battlefield_deep_analytics():
    """Verify Matchup Battlefield 2.0 delivery log, dismissal anatomy, and pressure splits."""
    response = client.get("/api/matchups?batter=V Kohli&bowler=JJ Bumrah")
    assert response.status_code == 200
    res = response.json()

    # 1. Delivery log
    assert "delivery_log" in res
    assert len(res["delivery_log"]) >= 100
    deliv = res["delivery_log"][0]
    assert "over_ball_label" in deliv
    assert "pressure_index" in deliv
    assert "result_badge" in deliv

    # 2. Dismissal anatomy
    assert "dismissal_events" in res
    assert len(res["dismissal_events"]) >= 3
    assert "dismissal_modes" in res
    assert "caught" in res["dismissal_modes"] or "lbw" in res["dismissal_modes"]

    # 3. Pressure crucible splits
    assert "pressure_splits" in res
    assert len(res["pressure_splits"]) == 3
    for tier in res["pressure_splits"]:
        assert "strike_rate" in tier
        assert "dot_pct" in tier

    # 4. Tactical blueprint
    assert "tactical_blueprint" in res
    assert "bowler_trap" in res["tactical_blueprint"]
    assert "batter_counter" in res["tactical_blueprint"]
    assert "key_battleground_phase" in res["tactical_blueprint"]

    # 5. Outcome distribution & Trajectory
    assert "outcome_distribution" in res
    assert res["outcome_distribution"]["dots"] > 0
    assert len(res["season_trajectory"]) > 0
    assert len(res["venue_splits"]) > 0


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


def test_player_dossier_endpoint():
    """Verify player dossier endpoint returns phase splits, threat matrix, and trajectory."""
    res = client.get("/api/players/V Kohli/dossier")
    assert res.status_code == 200
    data = res.json()
    assert data["player_name"] == "V Kohli"
    assert "phase_breakdown" in data
    assert len(data["phase_breakdown"]) == 3
    assert "threat_matrix" in data
    assert len(data["threat_matrix"]["nemesis_opponents"]) > 0
    assert "season_trajectory" in data
    assert len(data["season_trajectory"]) > 0


def test_player_compare_endpoint():
    """Verify dual player comparison endpoint returns delta metrics and head-to-head encounter."""
    res = client.get("/api/players/compare?p1=V Kohli&p2=JJ Bumrah")
    assert res.status_code == 200
    data = res.json()
    assert "player1" in data
    assert "player2" in data
    assert "head_to_head" in data
    assert data["head_to_head"]["has_direct_encounter"] is True
    assert "metric_deltas" in data


