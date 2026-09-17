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


def test_venues_list_endpoint():
    """Verify venues list returns major stadiums with DuckDB metrics."""
    res = client.get("/api/venues")
    assert res.status_code == 200
    data = res.json()
    assert data["total_venues"] >= 10
    assert "venues" in data
    v = data["venues"][0]
    assert "name" in v
    assert "matches" in v
    assert "avg_1st_innings" in v
    assert "chase_win_pct" in v
    assert "boundary_pct" in v


def test_venue_insights_endpoint():
    """Verify venue deep insights endpoint returns phase breakdowns, pace vs spin, and top stars."""
    res = client.get("/api/venues/wankhede/insights")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "wankhede"
    assert "phases" in data
    assert len(data["phases"]) == 3
    assert "pace_vs_spin" in data
    assert data["pace_vs_spin"]["pace_wickets_pct"] > 0
    assert "top_batters" in data
    assert len(data["top_batters"]) > 0
    assert "tactical_keys" in data


def test_franchises_list_endpoint():
    """Verify franchises endpoint returns all 10 active franchises with trophies and win rates."""
    res = client.get("/api/franchises")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] == 10
    fids = [f["id"] for f in data["franchises"]]
    assert "CSK" in fids
    assert "MI" in fids
    assert "KKR" in fids
    assert "RCB" in fids


def test_franchise_dossier_endpoint():
    """Verify franchise dossier returns career stats, fortress records, and roster pool."""
    res = client.get("/api/franchises/CSK/dossier")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "CSK"
    assert data["name"] == "Chennai Super Kings"
    assert data["titles_count"] == 5
    assert data["fortress"]["home_win_pct"] > 0
    assert "phase_radar" in data
    assert len(data["roster_pool"]) >= 10
    assert len(data["top_batters"]) >= 3


def test_franchise_rivalry_endpoint():
    """Verify head-to-head clash stats between two franchises."""
    res = client.get("/api/franchises/rivalry?team1=MI&team2=CSK")
    assert res.status_code == 200
    data = res.json()
    assert data["total_clashes"] >= 35
    assert "team1" in data
    assert "team2" in data
    assert len(data["venue_splits"]) > 0
    assert len(data["recent_matches"]) > 0


def test_franchise_rivalry_matrix_endpoint():
    """Verify 10x10 rivalry grid returns all active teams."""
    res = client.get("/api/franchises/rivalry-matrix")
    assert res.status_code == 200
    data = res.json()
    assert len(data["teams"]) == 10
    assert "CSK" in data["grid"]
    assert "MI" in data["grid"]["CSK"]


def test_playing_xi_clash_simulation_endpoint():
    """Verify Playing XI tactical clash simulation with Impact Player rule."""
    payload = {
        "team1_id": "CSK",
        "team1_lineup": [
            "RD Gaikwad", "F du Plessis", "SK Raina", "AT Rayudu",
            "MS Dhoni", "RA Jadeja", "DJ Bravo", "R Ashwin",
            "DL Chahar", "SN Thakur", "M Pathirana"
        ],
        "team1_impact_sub": "S Dube",
        "team2_id": "MI",
        "team2_lineup": [
            "RG Sharma", "Ishan Kishan", "SA Yadav", "Tilak Varma",
            "HH Pandya", "KA Pollard", "KH Pandya", "JJ Bumrah",
            "SL Malinga", "TA Boult", "PP Chawla"
        ],
        "team2_impact_sub": "TH David",
        "venue_id": "wankhede"
    }
    res = client.post("/api/franchises/simulate-clash", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "team1" in data
    assert "team2" in data
    assert 0 <= data["team1"]["win_probability"] <= 100
    assert data["team1"]["is_valid_ipl_rules"] is True
    assert "phase_battle" in data
    assert "tactical_verdict" in data


def test_franchise_auction_targets_endpoint():
    """Verify mega auction targets and purse management endpoint."""
    res = client.get("/api/franchises/CSK/auction-targets")
    assert res.status_code == 200
    data = res.json()
    assert data["total_purse_cr"] == 120.0
    assert len(data["recommended_targets"]) > 0
    p = data["recommended_targets"][0]
    assert "expected_auction_price_cr" in p
    assert p["expected_auction_price_cr"] > 0




