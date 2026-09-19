"""Pytest suite for Tournament Playoff Predictor, NRR Calculator, and Contextual True Metrics."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from analytics.playoffs import get_season_standings, simulate_tournament_playoffs, calculate_nrr_scenario
from analytics.contextual_metrics import compute_player_contextual_metrics

client = TestClient(app)


def test_season_standings_endpoint():
    """Verify standings returns all 10 active teams sorted by points and NRR."""
    response = client.get("/api/playoffs/standings?season=2024")
    assert response.status_code == 200
    data = response.json()
    assert "standings" in data
    assert len(data["standings"]) == 10

    # Ensure ranked in descending order of points
    points = [s["points"] for s in data["standings"]]
    assert points == sorted(points, reverse=True)

    top_team = data["standings"][0]
    assert "nrr" in top_team
    assert "form" in top_team
    assert "status" in top_team
    assert top_team["rank"] == 1


def test_monte_carlo_playoffs_simulation_endpoint():
    """Verify 10,000 Monte Carlo season simulations converge to probabilistic totals."""
    response = client.get("/api/playoffs/probabilities?season=2024&simulations=2000")
    assert response.status_code == 200
    data = response.json()
    assert "probabilities" in data
    assert len(data["probabilities"]) >= 8
    assert "magic_matrix" in data
    assert len(data["magic_matrix"]) == 5

    # Top 4 sum should roughly equal 400% (4 teams qualify per simulation)
    top4_sum = sum(p["playoff_prob"] for p in data["probabilities"])
    assert 380.0 <= top4_sum <= 420.0

    # Championship title sum should roughly equal 100%
    title_sum = sum(p["title_prob"] for p in data["probabilities"])
    assert 95.0 <= title_sum <= 105.0


def test_scenario_override_simulation():
    """Verify user fixture overrides dynamically alter playoff probabilities."""
    # Get remaining fixtures first
    prob_res = client.get("/api/playoffs/probabilities?season=2024&simulations=1000")
    assert prob_res.status_code == 200
    fixtures = prob_res.json()["remaining_fixtures"]
    assert len(fixtures) > 0

    fix_id = fixtures[0]["fixture_id"]
    t1_id = fixtures[0]["team1"]["id"]

    override_payload = {
        "season": "2024",
        "simulations": 1000,
        "fixture_overrides": {fix_id: t1_id}
    }
    response = client.post("/api/playoffs/simulate-scenarios", json=override_payload)
    assert response.status_code == 200
    data = response.json()
    assert "probabilities" in data

    # Verify fixture shows user override
    overridden_fixture = next(f for f in data["remaining_fixtures"] if f["fixture_id"] == fix_id)
    assert overridden_fixture["user_override"] == t1_id


def test_nrr_calculator_endpoint():
    """Verify defending and chasing Net Run Rate margin target computations."""
    # Defend scenario
    defend_req = {
        "team_id": "RCB",
        "target_team_id": "CSK",
        "scenario_type": "defend",
        "projected_runs": 190,
        "target_score": 175
    }
    res_defend = client.post("/api/playoffs/nrr-calculator", json=defend_req)
    assert res_defend.status_code == 200
    d_data = res_defend.json()
    assert d_data["team"] == "RCB"
    assert d_data["target_team"] == "CSK"
    assert d_data["required_victory_margin_runs"] > 0
    assert "tactical_directive" in d_data

    # Chase scenario
    chase_req = {
        "team_id": "RCB",
        "target_team_id": "CSK",
        "scenario_type": "chase",
        "projected_runs": 180,
        "target_score": 170
    }
    res_chase = client.post("/api/playoffs/nrr-calculator", json=chase_req)
    assert res_chase.status_code == 200
    c_data = res_chase.json()
    assert "max_chase_overs" in c_data
    assert "." in c_data["max_chase_overs"]


def test_player_contextual_metrics_endpoint():
    """Verify True Strike Rate (TSR), True Economy (TER), Clutch Rating, and WPA."""
    # Batter: Virat Kohli
    res_kohli = client.get("/api/players/V Kohli/contextual-metrics")
    assert res_kohli.status_code == 200
    k_data = res_kohli.json()
    assert "true_strike_rate" in k_data
    assert k_data["true_strike_rate"]["is_significant"] is True
    assert k_data["true_strike_rate"]["actual_sr"] > 120.0
    assert "clutch_rating" in k_data
    assert 0 <= k_data["clutch_rating"]["score"] <= 100
    assert "win_probability_added" in k_data

    # Bowler: JJ Bumrah
    res_bumrah = client.get("/api/players/JJ Bumrah/contextual-metrics")
    assert res_bumrah.status_code == 200
    b_data = res_bumrah.json()
    assert "true_economy_rate" in b_data
    assert b_data["true_economy_rate"]["is_significant"] is True
    # Bumrah's TER should be negative (better than phase average)
    assert b_data["true_economy_rate"]["value"] < 0.0
    assert b_data["win_probability_added"]["total_wpa_pct"] > 0.0
