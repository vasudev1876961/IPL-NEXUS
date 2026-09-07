"""Pro Scouting & Player Dossier Analytics Engine.

Computes deep player intelligence including:
- Situational Phase Telemetry (Powerplay, Middle Overs, Death)
- Innings Splits (Setting vs Chasing)
- Pressure Execution (pressure_index >= 60)
- Nemesis & Bunny Threat Matrices (top dismissals & run plunders)
- Career Season-by-Season Trajectory
- Dual-Player Comparative Scouting with Direct Encounter Telemetry
"""

from typing import Dict, Any, List, Optional
import duckdb
import numpy as np

from data_pipeline.warehouse_loader import DEFAULT_DB_PATH
from analytics.player_dna import get_player_dna
from analytics.matchups import get_matchup_analysis


def get_player_dossier(player_name: str, db_path: str = DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    """Compute comprehensive pro scouting dossier for a player."""
    dna = get_player_dna(player_name, db_path=db_path)
    if not dna or not dna.get("radar_axes"):
        return None

    role = dna.get("role", "Batter")
    is_primary_batter = (role == "Batter")

    con = duckdb.connect(db_path, read_only=True)

    # 1. Phase Breakdown Telemetry
    phase_breakdown = []
    for phase_name in ["Powerplay", "Middle", "Death"]:
        if is_primary_batter:
            query_phase = """
                SELECT
                    COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls,
                    COALESCE(SUM(runs_off_bat), 0) AS runs,
                    COUNT(CASE WHEN is_four THEN 1 END) AS fours,
                    COUNT(CASE WHEN is_six THEN 1 END) AS sixes,
                    COUNT(CASE WHEN is_dot THEN 1 END) AS dots,
                    COUNT(CASE WHEN is_wicket AND player_dismissed = ? AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) AS dismissals
                FROM fact_deliveries
                WHERE striker = ? AND phase = ?
            """
            row = con.execute(query_phase, [player_name, player_name, phase_name]).fetchone()
            balls = int(row[0]) if row and row[0] else 0
            runs = int(row[1]) if row and row[1] else 0
            fours = int(row[2]) if row and row[2] else 0
            sixes = int(row[3]) if row and row[3] else 0
            dots = int(row[4]) if row and row[4] else 0
            dismissals = int(row[5]) if row and row[5] else 0
            sr = round((runs / balls * 100.0), 1) if balls > 0 else 0.0
            dot_pct = round((dots / balls * 100.0), 1) if balls > 0 else 0.0
            boundary_pct = round(((fours * 4 + sixes * 6) / max(1, runs) * 100.0), 1) if runs > 0 else 0.0

            phase_breakdown.append({
                "phase": phase_name,
                "balls": balls,
                "runs": runs,
                "strike_rate": sr,
                "fours": fours,
                "sixes": sixes,
                "dot_pct": dot_pct,
                "boundary_pct": boundary_pct,
                "dismissals": dismissals
            })
        else:
            query_phase_bowl = """
                SELECT
                    COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls,
                    COALESCE(SUM(total_runs), 0) AS runs_conceded,
                    COUNT(CASE WHEN is_dot THEN 1 END) AS dots,
                    COUNT(CASE WHEN is_wicket AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) AS wickets
                FROM fact_deliveries
                WHERE bowler = ? AND phase = ?
            """
            row = con.execute(query_phase_bowl, [player_name, phase_name]).fetchone()
            balls = int(row[0]) if row and row[0] else 0
            runs_c = int(row[1]) if row and row[1] else 0
            dots = int(row[2]) if row and row[2] else 0
            wickets = int(row[3]) if row and row[3] else 0
            economy = round((runs_c / (balls / 6.0)), 2) if balls > 0 else 0.0
            dot_pct = round((dots / balls * 100.0), 1) if balls > 0 else 0.0

            phase_breakdown.append({
                "phase": phase_name,
                "balls": balls,
                "runs_conceded": runs_c,
                "economy": economy,
                "wickets": wickets,
                "dots": dots,
                "dot_pct": dot_pct
            })

    # 2. Innings Splits (Innings 1 vs Innings 2)
    innings_split = {}
    for inn, label in [(1, "first_innings"), (2, "chasing")]:
        if is_primary_batter:
            q_inn = """
                SELECT
                    COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls,
                    COALESCE(SUM(runs_off_bat), 0) AS runs,
                    COUNT(CASE WHEN is_wicket AND player_dismissed = ? AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) AS dismissals
                FROM fact_deliveries
                WHERE striker = ? AND innings = ?
            """
            row = con.execute(q_inn, [player_name, player_name, inn]).fetchone()
            b = int(row[0]) if row and row[0] else 0
            r = int(row[1]) if row and row[1] else 0
            d = int(row[2]) if row and row[2] else 0
            sr = round((r / b * 100.0), 1) if b > 0 else 0.0
            avg = round((r / max(1, d)), 1) if d > 0 else float(r)
            innings_split[label] = {"balls": b, "runs": r, "strike_rate": sr, "dismissals": d, "average": avg}
        else:
            q_inn_bowl = """
                SELECT
                    COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls,
                    COALESCE(SUM(total_runs), 0) AS runs_c,
                    COUNT(CASE WHEN is_wicket AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) AS wickets
                FROM fact_deliveries
                WHERE bowler = ? AND innings = ?
            """
            row = con.execute(q_inn_bowl, [player_name, inn]).fetchone()
            b = int(row[0]) if row and row[0] else 0
            r = int(row[1]) if row and row[1] else 0
            w = int(row[2]) if row and row[2] else 0
            econ = round((r / (b / 6.0)), 2) if b > 0 else 0.0
            innings_split[label] = {"balls": b, "runs_conceded": r, "economy": econ, "wickets": w}

    # 3. High Pressure Execution (pressure_index >= 60)
    if is_primary_batter:
        q_press = """
            SELECT
                COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls,
                COALESCE(SUM(runs_off_bat), 0) AS runs,
                COUNT(CASE WHEN is_four THEN 1 END) AS fours,
                COUNT(CASE WHEN is_six THEN 1 END) AS sixes,
                COUNT(CASE WHEN is_wicket AND player_dismissed = ? AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) AS dismissals
            FROM fact_deliveries
            WHERE striker = ? AND pressure_index >= 60
        """
        row = con.execute(q_press, [player_name, player_name]).fetchone()
        hp_balls = int(row[0]) if row and row[0] else 0
        hp_runs = int(row[1]) if row and row[1] else 0
        hp_fours = int(row[2]) if row and row[2] else 0
        hp_sixes = int(row[3]) if row and row[3] else 0
        hp_dismissals = int(row[4]) if row and row[4] else 0
        hp_sr = round((hp_runs / hp_balls * 100.0), 1) if hp_balls > 0 else 0.0
        pressure_stats = {
            "balls": hp_balls,
            "runs": hp_runs,
            "strike_rate": hp_sr,
            "fours": hp_fours,
            "sixes": hp_sixes,
            "dismissals": hp_dismissals
        }
    else:
        q_press_b = """
            SELECT
                COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls,
                COALESCE(SUM(total_runs), 0) AS runs_c,
                COUNT(CASE WHEN is_dot THEN 1 END) AS dots,
                COUNT(CASE WHEN is_wicket AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) AS wickets
            FROM fact_deliveries
            WHERE bowler = ? AND pressure_index >= 60
        """
        row = con.execute(q_press_b, [player_name]).fetchone()
        hp_balls = int(row[0]) if row and row[0] else 0
        hp_runs = int(row[1]) if row and row[1] else 0
        hp_dots = int(row[2]) if row and row[2] else 0
        hp_wickets = int(row[3]) if row and row[3] else 0
        hp_econ = round((hp_runs / (hp_balls / 6.0)), 2) if hp_balls > 0 else 0.0
        hp_dot_pct = round((hp_dots / hp_balls * 100.0), 1) if hp_balls > 0 else 0.0
        pressure_stats = {
            "balls": hp_balls,
            "runs_conceded": hp_runs,
            "economy": hp_econ,
            "wickets": hp_wickets,
            "dot_pct": hp_dot_pct
        }

    # 4. Nemesis & Bunny Threat Matrix
    if is_primary_batter:
        # Nemesis bowlers (most dismissals of this batter)
        nemesis_df = con.execute("""
            SELECT 
                bowler,
                COUNT(CASE WHEN is_wicket AND player_dismissed = ? AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as dismissals,
                COALESCE(SUM(runs_off_bat), 0) as runs,
                COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
                ROUND(COALESCE(SUM(runs_off_bat), 0) * 100.0 / NULLIF(COUNT(CASE WHEN is_legal_ball THEN 1 END), 0), 1) as strike_rate
            FROM fact_deliveries
            WHERE striker = ?
            GROUP BY bowler
            HAVING dismissals > 0
            ORDER BY dismissals DESC, balls ASC
            LIMIT 5
        """, [player_name, player_name]).fetchdf()
        nemesis_list = nemesis_df.to_dict(orient="records")

        # Dominated bowlers (most runs scored against)
        dominated_df = con.execute("""
            SELECT 
                bowler,
                COALESCE(SUM(runs_off_bat), 0) as runs,
                COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
                COUNT(CASE WHEN is_wicket AND player_dismissed = ? AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as dismissals,
                ROUND(COALESCE(SUM(runs_off_bat), 0) * 100.0 / NULLIF(COUNT(CASE WHEN is_legal_ball THEN 1 END), 0), 1) as strike_rate
            FROM fact_deliveries
            WHERE striker = ?
            GROUP BY bowler
            ORDER BY runs DESC
            LIMIT 5
        """, [player_name, player_name]).fetchdf()
        dominated_list = dominated_df.to_dict(orient="records")

        threat_matrix = {
            "primary_type": "batter",
            "nemesis_opponents": nemesis_list,
            "dominated_opponents": dominated_list
        }
    else:
        # Bunny batters (most wickets taken)
        bunnies_df = con.execute("""
            SELECT 
                striker as batter,
                COUNT(CASE WHEN is_wicket AND player_dismissed = striker AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as dismissals,
                COALESCE(SUM(runs_off_bat), 0) as runs_conceded,
                COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
                ROUND(COALESCE(SUM(runs_off_bat), 0) * 100.0 / NULLIF(COUNT(CASE WHEN is_legal_ball THEN 1 END), 0), 1) as strike_rate
            FROM fact_deliveries
            WHERE bowler = ?
            GROUP BY striker
            HAVING dismissals > 0
            ORDER BY dismissals DESC, runs_conceded ASC
            LIMIT 5
        """, [player_name]).fetchdf()
        bunnies_list = bunnies_df.to_dict(orient="records")

        # Punishing batters (most runs conceded against)
        punishers_df = con.execute("""
            SELECT 
                striker as batter,
                COALESCE(SUM(runs_off_bat), 0) as runs_conceded,
                COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
                COUNT(CASE WHEN is_wicket AND player_dismissed = striker AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as dismissals,
                ROUND(COALESCE(SUM(runs_off_bat), 0) * 100.0 / NULLIF(COUNT(CASE WHEN is_legal_ball THEN 1 END), 0), 1) as strike_rate
            FROM fact_deliveries
            WHERE bowler = ?
            GROUP BY striker
            ORDER BY runs_conceded DESC
            LIMIT 5
        """, [player_name]).fetchdf()
        punishers_list = punishers_df.to_dict(orient="records")

        threat_matrix = {
            "primary_type": "bowler",
            "nemesis_opponents": bunnies_list,
            "dominated_opponents": punishers_list
        }

    # 5. Career Season Trajectory
    if is_primary_batter:
        traj_df = con.execute("""
            SELECT 
                season,
                COALESCE(SUM(runs_off_bat), 0) as runs,
                COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
                ROUND(COALESCE(SUM(runs_off_bat), 0) * 100.0 / NULLIF(COUNT(CASE WHEN is_legal_ball THEN 1 END), 0), 1) as strike_rate,
                COUNT(CASE WHEN is_four THEN 1 END) as fours,
                COUNT(CASE WHEN is_six THEN 1 END) as sixes,
                COUNT(CASE WHEN is_wicket AND player_dismissed = ? AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as dismissals
            FROM fact_deliveries
            WHERE striker = ?
            GROUP BY season
            ORDER BY season ASC
        """, [player_name, player_name]).fetchdf()
        season_trajectory = traj_df.to_dict(orient="records")
    else:
        traj_df = con.execute("""
            SELECT 
                season,
                COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
                COALESCE(SUM(total_runs), 0) as runs_conceded,
                COUNT(CASE WHEN is_wicket AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as wickets,
                ROUND(COALESCE(SUM(total_runs), 0) * 6.0 / NULLIF(COUNT(CASE WHEN is_legal_ball THEN 1 END), 0), 2) as economy
            FROM fact_deliveries
            WHERE bowler = ?
            GROUP BY season
            ORDER BY season ASC
        """, [player_name]).fetchdf()
        season_trajectory = traj_df.to_dict(orient="records")

    con.close()

    return {
        "player_name": player_name,
        "role": role,
        "archetype": dna.get("archetype", "Standard"),
        "career_summary": dna.get("career_summary", {}),
        "radar_axes": dna.get("radar_axes", []),
        "phase_breakdown": phase_breakdown,
        "innings_split": innings_split,
        "pressure_performance": pressure_stats,
        "threat_matrix": threat_matrix,
        "season_trajectory": season_trajectory
    }


def compare_players(player1: str, player2: str, db_path: str = DEFAULT_DB_PATH) -> Optional[Dict[str, Any]]:
    """Compare two players side-by-side with dual 10-axis radar and head-to-head encounter stats."""
    dna1 = get_player_dna(player1, db_path=db_path)
    dna2 = get_player_dna(player2, db_path=db_path)

    if not dna1 or not dna2 or not dna1.get("radar_axes") or not dna2.get("radar_axes"):
        return None

    # Check direct head-to-head encounters in both directions
    # 1. P1 batting vs P2 bowling
    p1_bat_vs_p2_bowl = get_matchup_analysis(player1, player2, db_path=db_path)
    # 2. P2 batting vs P1 bowling
    p2_bat_vs_p1_bowl = get_matchup_analysis(player2, player1, db_path=db_path)

    p1_enc = p1_bat_vs_p2_bowl if p1_bat_vs_p2_bowl.get("sample_size", 0) > 0 else None
    p2_enc = p2_bat_vs_p1_bowl if p2_bat_vs_p1_bowl.get("sample_size", 0) > 0 else None

    # Build metric deltas
    p1_cs = dna1.get("career_summary", {})
    p2_cs = dna2.get("career_summary", {})

    runs_delta = p1_cs.get("runs", 0) - p2_cs.get("runs", 0)
    sr_delta = round(p1_cs.get("strike_rate", 0.0) - p2_cs.get("strike_rate", 0.0), 2)
    wkts_delta = p1_cs.get("wickets", 0) - p2_cs.get("wickets", 0)
    econ_p1 = p1_cs.get("economy", 0.0)
    econ_p2 = p2_cs.get("economy", 0.0)
    econ_delta = round(econ_p1 - econ_p2, 2)

    return {
        "player1": {
            "player_name": player1,
            "role": dna1.get("role"),
            "archetype": dna1.get("archetype"),
            "career_summary": p1_cs,
            "radar_axes": dna1.get("radar_axes", [])
        },
        "player2": {
            "player_name": player2,
            "role": dna2.get("role"),
            "archetype": dna2.get("archetype"),
            "career_summary": p2_cs,
            "radar_axes": dna2.get("radar_axes", [])
        },
        "head_to_head": {
            "p1_bat_vs_p2_bowl": p1_enc,
            "p2_bat_vs_p1_bowl": p2_enc,
            "has_direct_encounter": bool(p1_enc or p2_enc)
        },
        "metric_deltas": {
            "runs": runs_delta,
            "strike_rate": sr_delta,
            "wickets": wkts_delta,
            "economy": econ_delta
        }
    }
