"""Multidimensional Player DNA Profiler.

Computes a 10-axis situational player representation (0 - 100 on each axis)
for tactical scouting, radar visualizations, and similarity matching.
"""

from typing import Dict, Any, List
import duckdb
import numpy as np

from data_pipeline.warehouse_loader import DEFAULT_DB_PATH


def get_player_dna(player_name: str, db_path: str = DEFAULT_DB_PATH) -> Dict[str, Any]:
    """Compute 10-dimensional DNA profile for a cricketer."""
    con = duckdb.connect(db_path, read_only=True)

    # Batting queries across phases and pressure
    bat_query = """
        SELECT
            COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls,
            COALESCE(SUM(runs_off_bat), 0) AS runs,
            COUNT(CASE WHEN is_four THEN 1 END) AS fours,
            COUNT(CASE WHEN is_six THEN 1 END) AS sixes,
            COUNT(CASE WHEN is_dot THEN 1 END) AS dots,
            COUNT(DISTINCT match_id) AS matches,
            -- Phase breakdowns
            COUNT(CASE WHEN phase = 'Powerplay' AND is_legal_ball THEN 1 END) AS pp_balls,
            COALESCE(SUM(CASE WHEN phase = 'Powerplay' THEN runs_off_bat ELSE 0 END), 0) AS pp_runs,
            COUNT(CASE WHEN phase = 'Middle' AND is_legal_ball THEN 1 END) AS mid_balls,
            COALESCE(SUM(CASE WHEN phase = 'Middle' THEN runs_off_bat ELSE 0 END), 0) AS mid_runs,
            COUNT(CASE WHEN phase = 'Death' AND is_legal_ball THEN 1 END) AS death_balls,
            COALESCE(SUM(CASE WHEN phase = 'Death' THEN runs_off_bat ELSE 0 END), 0) AS death_runs,
            -- Chasing
            COUNT(CASE WHEN innings = 2 AND is_legal_ball THEN 1 END) AS chase_balls,
            COALESCE(SUM(CASE WHEN innings = 2 THEN runs_off_bat ELSE 0 END), 0) AS chase_runs,
            -- High pressure
            COUNT(CASE WHEN pressure_index >= 60 AND is_legal_ball THEN 1 END) AS high_p_balls,
            COALESCE(SUM(CASE WHEN pressure_index >= 60 THEN runs_off_bat ELSE 0 END), 0) AS high_p_runs
        FROM fact_deliveries
        WHERE striker = ?
    """
    bat = con.execute(bat_query, [player_name]).fetchone()

    # Bowling queries
    bowl_query = """
        SELECT
            COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls,
            COALESCE(SUM(total_runs), 0) AS runs_conceded,
            COUNT(CASE WHEN is_wicket AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) AS wickets,
            COUNT(CASE WHEN is_dot THEN 1 END) AS dots,
            COUNT(CASE WHEN phase = 'Powerplay' AND is_wicket THEN 1 END) AS pp_wickets,
            COUNT(CASE WHEN phase = 'Death' AND is_legal_ball THEN 1 END) AS death_balls,
            COALESCE(SUM(CASE WHEN phase = 'Death' THEN total_runs ELSE 0 END), 0) AS death_runs_conceded,
            COUNT(CASE WHEN phase = 'Death' AND is_wicket THEN 1 END) AS death_wickets
        FROM fact_deliveries
        WHERE bowler = ?
    """
    bowl = con.execute(bowl_query, [player_name]).fetchone()
    con.close()

    total_bat_balls = int(bat[0]) if bat and bat[0] else 0
    total_bowl_balls = int(bowl[0]) if bowl and bowl[0] else 0

    if total_bat_balls == 0 and total_bowl_balls == 0:
        return {
            "player_name": player_name,
            "role": "Unknown",
            "dna_radar": [],
            "summary": f"No historical match data found for {player_name}."
        }

    is_primary_batter = total_bat_balls >= total_bowl_balls

    if is_primary_batter:
        runs = int(bat[1])
        fours = int(bat[2])
        sixes = int(bat[3])
        dots = int(bat[4])
        matches = max(1, int(bat[5]))

        overall_sr = (runs / total_bat_balls) * 100.0 if total_bat_balls > 0 else 0.0
        pp_balls = int(bat[6])
        pp_sr = (int(bat[7]) / pp_balls) * 100.0 if pp_balls > 0 else overall_sr
        mid_balls = int(bat[8])
        mid_sr = (int(bat[9]) / mid_balls) * 100.0 if mid_balls > 0 else overall_sr
        death_balls = int(bat[10])
        death_sr = (int(bat[11]) / death_balls) * 100.0 if death_balls > 0 else overall_sr
        chase_balls = int(bat[12])
        chase_sr = (int(bat[13]) / chase_balls) * 100.0 if chase_balls > 0 else overall_sr
        hp_balls = int(bat[14])
        hp_sr = (int(bat[15]) / hp_balls) * 100.0 if hp_balls > 0 else overall_sr

        # Normalization functions to 0-100 scale
        aggression = float(np.clip((overall_sr - 90.0) / 100.0 * 100.0, 30.0, 99.0))
        consistency = float(np.clip((runs / matches) / 45.0 * 100.0, 35.0, 98.0))
        boundary_rate = float(np.clip(((fours * 4 + sixes * 6) / max(1, runs)) / 0.8 * 100.0, 25.0, 98.0))
        dot_resistance = float(np.clip((1.0 - (dots / max(1, total_bat_balls))) / 0.7 * 100.0, 30.0, 98.0))
        powerplay_impact = float(np.clip((pp_sr - 90.0) / 90.0 * 100.0, 25.0, 98.0))
        middle_control = float(np.clip((mid_sr - 90.0) / 80.0 * 100.0, 30.0, 98.0))
        death_acceleration = float(np.clip((death_sr - 110.0) / 130.0 * 100.0, 25.0, 99.0))
        chasing_ability = float(np.clip((chase_sr - 90.0) / 90.0 * 100.0, 30.0, 98.0))
        pressure_resilience = float(np.clip((hp_sr - 90.0) / 100.0 * 100.0, 25.0, 99.0))
        six_power = float(np.clip((sixes / max(1, total_bat_balls)) / 0.09 * 100.0, 20.0, 99.0))

        radar_axes = [
            {"axis": "Aggression", "value": round(aggression, 1)},
            {"axis": "Consistency", "value": round(consistency, 1)},
            {"axis": "Boundary Pct", "value": round(boundary_rate, 1)},
            {"axis": "Strike Rotation", "value": round(dot_resistance, 1)},
            {"axis": "Powerplay", "value": round(powerplay_impact, 1)},
            {"axis": "Middle Overs", "value": round(middle_control, 1)},
            {"axis": "Death Over SR", "value": round(death_acceleration, 1)},
            {"axis": "Chasing Impact", "value": round(chasing_ability, 1)},
            {"axis": "High Pressure", "value": round(pressure_resilience, 1)},
            {"axis": "Six Aptitude", "value": round(six_power, 1)},
        ]
        archetype = "Anchor / Master Chaser" if chasing_ability > 85 and consistency > 85 else "Explosive Finisher" if death_acceleration > 85 else "Top-Order Enforcer"

    else:
        # Bowling DNA
        runs_c = int(bowl[1])
        wickets = int(bowl[2])
        dots_b = int(bowl[3])
        econ = (runs_c / (total_bowl_balls / 6.0)) if total_bowl_balls > 0 else 8.5
        death_balls_b = int(bowl[5])
        death_runs_b = int(bowl[6])
        death_econ = (death_runs_b / (death_balls_b / 6.0)) if death_balls_b > 0 else 10.0

        control = float(np.clip((11.5 - econ) / 5.5 * 100.0, 30.0, 99.0))
        wicket_taking = float(np.clip((wickets / max(1, total_bowl_balls / 20.0)) * 75.0, 30.0, 99.0))
        dot_pressure = float(np.clip((dots_b / max(1, total_bowl_balls)) / 0.5 * 100.0, 30.0, 99.0))
        death_bowling = float(np.clip((14.0 - death_econ) / 6.0 * 100.0, 25.0, 99.0))
        powerplay_threat = float(np.clip(int(bowl[4]) * 5.0, 30.0, 95.0))
        variation = 85.0
        consistency = float(np.clip(70.0 + (wickets * 0.1), 50.0, 95.0))
        pressure_clutch = float(np.clip(death_bowling * 0.9, 30.0, 98.0))
        stamina = float(np.clip(total_bowl_balls / 10.0, 40.0, 95.0))
        strike_rate_b = float(np.clip((35.0 - (total_bowl_balls / max(1, wickets))) / 20.0 * 100.0, 30.0, 99.0))

        radar_axes = [
            {"axis": "Economy Control", "value": round(control, 1)},
            {"axis": "Wicket Taking", "value": round(wicket_taking, 1)},
            {"axis": "Dot Generation", "value": round(dot_pressure, 1)},
            {"axis": "Death Bowling", "value": round(death_bowling, 1)},
            {"axis": "Powerplay Threat", "value": round(powerplay_threat, 1)},
            {"axis": "Variation Index", "value": round(variation, 1)},
            {"axis": "Consistency", "value": round(consistency, 1)},
            {"axis": "High Pressure", "value": round(pressure_clutch, 1)},
            {"axis": "Strike Aptitude", "value": round(strike_rate_b, 1)},
            {"axis": "Workload Stamina", "value": round(stamina, 1)},
        ]
        archetype = "Elite Death Specialist" if death_bowling > 85 else "Powerplay Strike Bowler" if powerplay_threat > 80 else "Enforcer Bowler"

    return {
        "player_name": player_name,
        "role": "Batter" if is_primary_batter else "Bowler",
        "archetype": archetype,
        "radar_axes": radar_axes,
        "career_summary": {
            "runs": int(bat[1]) if bat and bat[1] else 0,
            "strike_rate": round((int(bat[1]) / total_bat_balls * 100.0), 2) if total_bat_balls > 0 else 0.0,
            "wickets": int(bowl[2]) if bowl and bowl[2] else 0,
            "balls_bowled": total_bowl_balls,
            "economy": round((int(bowl[1]) / (total_bowl_balls / 6.0)), 2) if total_bowl_balls > 0 else 0.0
        }
    }
