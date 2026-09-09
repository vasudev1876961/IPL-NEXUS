"""Batter vs Bowler head-to-head matchup analytics engine.

Analyzes historical delivery interactions between specific batters and bowlers
to compute strike rates, dismissals, dot-ball percentages, phase advantages,
delivery-by-delivery timeline logs, pressure crucible splits, dismissal anatomy,
and tactical blueprints.
"""

from typing import Dict, Any, List, Optional
import duckdb

from data_pipeline.warehouse_loader import DEFAULT_DB_PATH


def get_matchup_analysis(
    batter_name: str,
    bowler_name: str,
    db_path: str = DEFAULT_DB_PATH
) -> Dict[str, Any]:
    """Retrieve deep head-to-head metrics and ball-by-ball encounter intelligence."""
    con = duckdb.connect(db_path, read_only=True)

    # 1. Summary Metrics & Phase Splits
    summary_query = """
        SELECT
            COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls_faced,
            COALESCE(SUM(runs_off_bat), 0) AS runs_scored,
            COUNT(CASE WHEN is_dot THEN 1 END) AS dot_balls,
            COUNT(CASE WHEN is_four THEN 1 END) AS fours,
            COUNT(CASE WHEN is_six THEN 1 END) AS sixes,
            COUNT(CASE WHEN is_wicket AND player_dismissed = ? THEN 1 END) AS dismissals,
            -- Phase breakdowns
            COUNT(CASE WHEN phase = 'Powerplay' AND is_legal_ball THEN 1 END) AS pp_balls,
            COALESCE(SUM(CASE WHEN phase = 'Powerplay' THEN runs_off_bat ELSE 0 END), 0) AS pp_runs,
            COUNT(CASE WHEN phase = 'Middle' AND is_legal_ball THEN 1 END) AS mid_balls,
            COALESCE(SUM(CASE WHEN phase = 'Middle' THEN runs_off_bat ELSE 0 END), 0) AS mid_runs,
            COUNT(CASE WHEN phase = 'Death' AND is_legal_ball THEN 1 END) AS death_balls,
            COALESCE(SUM(CASE WHEN phase = 'Death' THEN runs_off_bat ELSE 0 END), 0) AS death_runs,
            -- Phase dismissals
            COUNT(CASE WHEN phase = 'Powerplay' AND is_wicket AND player_dismissed = ? THEN 1 END) AS pp_wickets,
            COUNT(CASE WHEN phase = 'Middle' AND is_wicket AND player_dismissed = ? THEN 1 END) AS mid_wickets,
            COUNT(CASE WHEN phase = 'Death' AND is_wicket AND player_dismissed = ? THEN 1 END) AS death_wickets
        FROM fact_deliveries
        WHERE striker = ? AND bowler = ?
    """

    res = con.execute(summary_query, [
        batter_name, batter_name, batter_name, batter_name, batter_name, bowler_name
    ]).fetchone()

    if not res or res[0] == 0:
        con.close()
        return {
            "batter": batter_name,
            "bowler": bowler_name,
            "sample_size": 0,
            "balls_faced": 0,
            "runs_scored": 0,
            "status": "No historical match deliveries recorded",
            "strike_rate": 0.0,
            "average": None,
            "dots": 0,
            "dot_pct": 0.0,
            "fours": 0,
            "sixes": 0,
            "dismissals": 0,
            "boundary_pct": 0.0,
            "tactical_edge": "Neutral / Unknown",
            "recommendation": f"Insufficient sample size ({batter_name} vs {bowler_name}). Base strategy on broader phase match-ups.",
            "phase_splits": {
                "powerplay": {"balls": 0, "runs": 0, "wickets": 0},
                "middle": {"balls": 0, "runs": 0, "wickets": 0},
                "death": {"balls": 0, "runs": 0, "wickets": 0}
            },
            "delivery_log": [],
            "dismissal_events": [],
            "dismissal_modes": {},
            "pressure_splits": [],
            "outcome_distribution": {
                "dots": 0, "singles": 0, "doubles": 0, "threes": 0,
                "fours": 0, "sixes": 0, "wickets": 0, "dot_pct": 0.0,
                "boundary_pct": 0.0, "strike_rotation_pct": 0.0
            },
            "season_trajectory": [],
            "venue_splits": [],
            "tactical_blueprint": {
                "bowler_trap": "No direct head-to-head data available.",
                "batter_counter": "Assess generic bowler pitch maps.",
                "key_battleground_phase": "Unknown",
                "dismissal_risk_rating": "LOW",
                "boundary_lethal_rating": "MODERATE",
                "pressure_vulnerability": "NEUTRAL"
            }
        }

    balls = int(res[0])
    runs = int(res[1])
    dots = int(res[2])
    fours = int(res[3])
    sixes = int(res[4])
    dismissals = int(res[5])

    sr = (runs / balls) * 100.0 if balls > 0 else 0.0
    dot_pct = (dots / balls) * 100.0 if balls > 0 else 0.0
    boundary_pct = ((fours * 4 + sixes * 6) / max(1, runs)) * 100.0 if runs > 0 else 0.0
    average = round(runs / dismissals, 1) if dismissals > 0 else None

    # 2. Detailed Ball-by-Ball Encounter Reel
    delivery_query = """
        SELECT
            match_id,
            match_date,
            season,
            venue,
            innings,
            over_num,
            ball_in_over,
            phase,
            runs_off_bat,
            extras,
            total_runs,
            is_wicket,
            dismissal_kind,
            player_dismissed,
            COALESCE(pressure_index, 0.0) AS pressure_index,
            is_legal_ball,
            is_dot,
            is_four,
            is_six
        FROM fact_deliveries
        WHERE striker = ? AND bowler = ?
        ORDER BY match_date ASC, innings ASC, over_num ASC, ball_in_over ASC
    """
    deliv_rows = con.execute(delivery_query, [batter_name, bowler_name]).fetchall()

    delivery_log = []
    dismissal_events = []
    dismissal_modes: Dict[str, int] = {}
    singles = 0
    doubles = 0
    threes = 0

    for r in deliv_rows:
        m_id, m_date, season, venue, inn, over, ball, phase, r_bat, ext, tot_r, is_wkt, d_kind, p_dism, p_idx, is_leg, is_d, is_4, is_6 = r
        over_val = int(over)
        ball_val = int(ball)
        r_bat_val = int(r_bat)
        tot_r_val = int(tot_r)
        is_batter_out = bool(is_wkt and p_dism == batter_name)
        pressure_val = round(float(p_idx), 1)

        # Classify delivery result badge text
        if is_batter_out:
            badge_text = f"W ({d_kind or 'out'})"
        elif is_6:
            badge_text = "6"
        elif is_4:
            badge_text = "4"
        elif r_bat_val == 3:
            badge_text = "3"
            threes += 1
        elif r_bat_val == 2:
            badge_text = "2"
            doubles += 1
        elif r_bat_val == 1:
            badge_text = "1"
            singles += 1
        elif is_d:
            badge_text = "•"
        else:
            badge_text = str(tot_r_val)

        deliv_entry = {
            "match_id": str(m_id),
            "match_date": str(m_date),
            "season": str(season),
            "venue": str(venue),
            "innings": int(inn),
            "over_num": over_val,
            "ball_in_over": ball_val,
            "over_ball_label": f"{over_val}.{ball_val}",
            "phase": str(phase),
            "runs_off_bat": r_bat_val,
            "extras": int(ext),
            "total_runs": tot_r_val,
            "is_wicket": is_batter_out,
            "dismissal_kind": str(d_kind) if is_batter_out else "none",
            "pressure_index": pressure_val,
            "is_boundary": bool(is_4 or is_6),
            "is_dot": bool(is_d),
            "result_badge": badge_text
        }
        delivery_log.append(deliv_entry)

        if is_batter_out:
            mode_clean = str(d_kind).lower().strip() if d_kind else "other"
            dismissal_modes[mode_clean] = dismissal_modes.get(mode_clean, 0) + 1
            dismissal_events.append({
                "match_id": str(m_id),
                "season": str(season),
                "match_date": str(m_date),
                "venue": str(venue),
                "innings": int(inn),
                "over_ball": f"{over_val}.{ball_val}",
                "phase": str(phase),
                "dismissal_kind": mode_clean,
                "pressure_index": pressure_val
            })

    # 3. Pressure Splits (Low < 40, Medium 40-59, Crunch >= 60)
    pressure_splits = []
    pressure_configs = [
        {"name": "Low Tension", "range_desc": "DPI < 40", "filter": "pressure_index < 40"},
        {"name": "Medium Pressure", "range_desc": "40 ≤ DPI < 60", "filter": "pressure_index >= 40 AND pressure_index < 60"},
        {"name": "Crunch / High Pressure", "range_desc": "DPI ≥ 60", "filter": "pressure_index >= 60"}
    ]
    for p_cfg in pressure_configs:
        q_p = f"""
            SELECT
                COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls,
                COALESCE(SUM(runs_off_bat), 0) AS runs,
                COUNT(CASE WHEN is_dot THEN 1 END) AS dots,
                COUNT(CASE WHEN is_wicket AND player_dismissed = ? THEN 1 END) AS wickets,
                COUNT(CASE WHEN is_boundary THEN 1 END) AS boundaries
            FROM fact_deliveries
            WHERE striker = ? AND bowler = ? AND {p_cfg['filter']}
        """
        p_row = con.execute(q_p, [batter_name, batter_name, bowler_name]).fetchone()
        p_balls = int(p_row[0]) if p_row and p_row[0] else 0
        p_runs = int(p_row[1]) if p_row and p_row[1] else 0
        p_dots = int(p_row[2]) if p_row and p_row[2] else 0
        p_wkts = int(p_row[3]) if p_row and p_row[3] else 0
        p_bounds = int(p_row[4]) if p_row and p_row[4] else 0

        p_sr = round((p_runs / p_balls) * 100.0, 1) if p_balls > 0 else 0.0
        p_dot_pct = round((p_dots / p_balls) * 100.0, 1) if p_balls > 0 else 0.0

        pressure_splits.append({
            "tier_name": p_cfg["name"],
            "range_desc": p_cfg["range_desc"],
            "balls": p_balls,
            "runs": p_runs,
            "strike_rate": p_sr,
            "dots": p_dots,
            "dot_pct": p_dot_pct,
            "wickets": p_wkts,
            "boundaries": p_bounds
        })

    # 4. Season-by-Season Rivalry Trajectory
    season_query = """
        SELECT
            season,
            COUNT(CASE WHEN is_legal_ball THEN 1 END) AS s_balls,
            COALESCE(SUM(runs_off_bat), 0) AS s_runs,
            COUNT(CASE WHEN is_four THEN 1 END) AS s_fours,
            COUNT(CASE WHEN is_six THEN 1 END) AS s_sixes,
            COUNT(CASE WHEN is_dot THEN 1 END) AS s_dots,
            COUNT(CASE WHEN is_wicket AND player_dismissed = ? THEN 1 END) AS s_wkts
        FROM fact_deliveries
        WHERE striker = ? AND bowler = ?
        GROUP BY season
        ORDER BY season ASC
    """
    s_rows = con.execute(season_query, [batter_name, batter_name, bowler_name]).fetchall()
    season_trajectory = []
    for s in s_rows:
        s_year, s_b, s_r, s_4, s_6, s_d, s_w = s
        s_b_val = int(s_b)
        s_r_val = int(s_r)
        season_trajectory.append({
            "season": str(s_year),
            "balls": s_b_val,
            "runs": s_r_val,
            "strike_rate": round((s_r_val / s_b_val) * 100.0, 1) if s_b_val > 0 else 0.0,
            "fours": int(s_4),
            "sixes": int(s_6),
            "dots": int(s_d),
            "dismissals": int(s_w)
        })

    # 5. Top Venues for Duel
    venue_query = """
        SELECT
            venue,
            COUNT(CASE WHEN is_legal_ball THEN 1 END) AS v_balls,
            COALESCE(SUM(runs_off_bat), 0) AS v_runs,
            COUNT(CASE WHEN is_dot THEN 1 END) AS v_dots,
            COUNT(CASE WHEN is_wicket AND player_dismissed = ? THEN 1 END) AS v_wkts
        FROM fact_deliveries
        WHERE striker = ? AND bowler = ?
        GROUP BY venue
        ORDER BY v_balls DESC
        LIMIT 6
    """
    v_rows = con.execute(venue_query, [batter_name, batter_name, bowler_name]).fetchall()
    venue_splits = []
    for v in v_rows:
        v_name, v_b, v_r, v_d, v_w = v
        v_b_val = int(v_b)
        v_r_val = int(v_r)
        venue_splits.append({
            "venue": str(v_name),
            "balls": v_b_val,
            "runs": v_r_val,
            "strike_rate": round((v_r_val / v_b_val) * 100.0, 1) if v_b_val > 0 else 0.0,
            "dots": int(v_d),
            "dismissals": int(v_w)
        })

    con.close()

    # 6. Outcome Distribution
    strike_rotation_balls = singles + doubles + threes
    outcome_distribution = {
        "dots": dots,
        "singles": singles,
        "doubles": doubles,
        "threes": threes,
        "fours": fours,
        "sixes": sixes,
        "wickets": dismissals,
        "dot_pct": round(dot_pct, 1),
        "boundary_pct": round(boundary_pct, 1),
        "strike_rotation_pct": round((strike_rotation_balls / max(1, balls)) * 100.0, 1)
    }

    # 7. Tactical Edge & Strategic Directive
    if dismissals >= 3 and sr < 120.0:
        edge = f"Heavy Bowler Dominance ({bowler_name})"
        rec = f"{bowler_name} holds psychological and technical control ({dismissals} dismissals, {sr:.1f} SR, {dot_pct:.0f}% dots). Deploy aggressively with close catchers."
        risk_rating = "CRITICAL"
        lethal_rating = "LOW"
    elif dismissals >= 2 and sr < 135.0:
        edge = f"Strong Bowler Advantage ({bowler_name})"
        rec = f"{bowler_name} consistently penetrates {batter_name}'s defense ({dismissals} dismissals at {average or 0:.1f} avg). Keep attacking 4th stump channel."
        risk_rating = "HIGH"
        lethal_rating = "MODERATE"
    elif sr >= 165.0 and dismissals <= 1:
        edge = f"Decisive Batter Dominance ({batter_name})"
        rec = f"{batter_name} systematically dispatches {bowler_name} (SR {sr:.1f}, {sixes} sixes). Bowler must resort to defensive wide yorkers or protect boundaries."
        risk_rating = "LOW"
        lethal_rating = "EXTREME"
    elif sr >= 140.0:
        edge = f"Slight Batter Edge ({batter_name})"
        rec = f"{batter_name} scores comfortably at {sr:.1f} SR with {fours + sixes} boundaries. Bowler needs unexpected variation (slower bouncer or cross-seam)."
        risk_rating = "MODERATE"
        lethal_rating = "HIGH"
    elif dismissals >= 1:
        edge = "Slight Bowler Advantage"
        rec = f"Evenly contested battle with wicket threat for {bowler_name}. Squeeze dot balls to force rash stroke."
        risk_rating = "MODERATE"
        lethal_rating = "MODERATE"
    else:
        edge = "Competitive Duel / Parity"
        rec = f"Disciplined duel: {batter_name} operates at {sr:.1f} SR while {bowler_name} maintains {dot_pct:.0f}% dot pressure."
        risk_rating = "MODERATE"
        lethal_rating = "MODERATE"

    # AI Tactical Blueprint
    pp_sr = ((int(res[7]) / max(1, int(res[6]))) * 100) if int(res[6]) > 0 else 0
    death_sr = ((int(res[11]) / max(1, int(res[10]))) * 100) if int(res[10]) > 0 else 0

    if int(res[6]) >= 18 and pp_sr < 110:
        bowler_trap = f"Exploit early swing in Powerplay; {batter_name} strikes at only {pp_sr:.1f} in overs 0-5 against {bowler_name}."
        batter_counter = f"Play out the initial 6 deliveries safely, avoiding expansive drives; capitalize in middle overs."
        key_phase = "Powerplay (Overs 0–5)"
    elif int(res[10]) >= 12 and death_sr > 160:
        bowler_trap = f"Avoid slot deliveries at the death; target wide yorkers outside the tramline to deny {batter_name}'s swing."
        batter_counter = f"Stand deep in crease to counter full yorkers and exploit vacant mid-wicket boundary."
        key_phase = "Death Overs (Overs 15–20)"
    else:
        bowler_trap = f"Cram batter for room on middle-and-leg line; maintain hard lengths to enforce {dot_pct:.0f}% dot ball pressure."
        batter_counter = f"Rotate strike aggressively with soft hands into vacant pockets to deny bowler rhythm."
        key_phase = "Middle Overs (Overs 6–14)"

    tactical_blueprint = {
        "bowler_trap": bowler_trap,
        "batter_counter": batter_counter,
        "key_battleground_phase": key_phase,
        "dismissal_risk_rating": risk_rating,
        "boundary_lethal_rating": lethal_rating,
        "pressure_vulnerability": "HIGH" if (pressure_splits and pressure_splits[2]["wickets"] > 0) else "RESILIENT"
    }

    return {
        "batter": batter_name,
        "bowler": bowler_name,
        "sample_size": balls,
        "balls_faced": balls,
        "runs_scored": runs,
        "dots": dots,
        "dot_pct": round(dot_pct, 1),
        "fours": fours,
        "sixes": sixes,
        "dismissals": dismissals,
        "strike_rate": round(sr, 1),
        "average": average,
        "boundary_pct": round(boundary_pct, 1),
        "tactical_edge": edge,
        "recommendation": rec,
        "phase_splits": {
            "powerplay": {"balls": int(res[6]), "runs": int(res[7]), "wickets": int(res[12])},
            "middle": {"balls": int(res[8]), "runs": int(res[9]), "wickets": int(res[13])},
            "death": {"balls": int(res[10]), "runs": int(res[11]), "wickets": int(res[14])}
        },
        "delivery_log": delivery_log,
        "dismissal_events": dismissal_events,
        "dismissal_modes": dismissal_modes,
        "pressure_splits": pressure_splits,
        "outcome_distribution": outcome_distribution,
        "season_trajectory": season_trajectory,
        "venue_splits": venue_splits,
        "tactical_blueprint": tactical_blueprint
    }
