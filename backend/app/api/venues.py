"""Stadium & Pitch Matrix Intelligence API Router.

Provides broadcast-grade stadium dossiers, pitch behavioral profiles,
toss/dew analytics, pace vs spin splits, and phase telemetry directly from DuckDB.
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
import duckdb

from data_pipeline.warehouse_loader import DEFAULT_DB_PATH

router = APIRouter(prefix="/api/venues", tags=["Stadium & Pitch Matrix"])

# Well-known spinners in IPL history for accurate Pace vs Spin classification
KNOWN_SPINNERS = {
    "ys chahal", "r ashwin", "sp narine", "rashid khan", "ra jadeja", "harbhajan singh",
    "kuldeep yadav", "ar patel", "a kumble", "pp chawla", "a mishra", "imran tahir",
    "r bishnoi", "cv varun", "kh pandya", "washington sundar", "m theekshana",
    "noor ahmad", "m santner", "sk warne", "m muralitharan", "sl munda", "s gopal",
    "karan sharma", "shahbaz ahmed", "pj sangwan", "s nadim", "s badree", "sn thakur",
    "m ashwin", "m markande", "rd chahar", "swapnil singh", "sai kishore", "gurbani",
    "dj bravo", "jp duminy", "sk raina", "yuvraj singh", "v sehwag", "rg sharma"
}

# Canonical venue definitions with aliases, franchise affiliation, and ground telemetry
STADIUM_PROFILES = [
    {
        "id": "wankhede",
        "name": "Wankhede Stadium, Mumbai",
        "short_name": "Wankhede",
        "city": "Mumbai",
        "franchise": "MI",
        "aliases": ["%wankhede%", "%brabourne%"],
        "pitch_type": "Red Soil / True Bounce & Fast Outfield",
        "dew_risk": "Extreme (Maritime Coastal)",
        "toss_verdict": "Bowl First — Chasing Bias with Heavy Evening Dew",
        "dimensions": {"straight": 74, "square_off": 66, "square_leg": 64, "fine_third": 58},
        "tactical_keys": [
            "Batters gain +14% boundary efficiency against pace through the line.",
            "Cross-seam hard lengths prevent ball skidding under night lights.",
            "Death overs yield 10.1 RPO — protect short boundary towards Sachin Tendulkar Stand."
        ]
    },
    {
        "id": "chinnaswamy",
        "name": "M Chinnaswamy Stadium, Bengaluru",
        "short_name": "Chinnaswamy",
        "city": "Bengaluru",
        "franchise": "RCB",
        "aliases": ["%chinnaswamy%"],
        "pitch_type": "High Altitude / Fast Outfield / Batting Wonderland",
        "dew_risk": "Moderate",
        "toss_verdict": "Bowl First — No Total Is Safe (200+ Regular)",
        "dimensions": {"straight": 70, "square_off": 61, "square_leg": 60, "fine_third": 55},
        "tactical_keys": [
            "Thin air at 920m elevation adds 8–10% carry to aerial strokes.",
            "Target boundaries at square leg / fine leg are shortest in the tournament.",
            "Spinners must bowl defensive flatter trajectories outside off-stump."
        ]
    },
    {
        "id": "eden_gardens",
        "name": "Eden Gardens, Kolkata",
        "short_name": "Eden Gardens",
        "city": "Kolkata",
        "franchise": "KKR",
        "aliases": ["%eden gardens%"],
        "pitch_type": "Black Soil / Good Pace & Evening Seam",
        "dew_risk": "High (Hooghly River Humidity)",
        "toss_verdict": "Field First — Fast Chasing Deck with Sloping Runoffs",
        "dimensions": {"straight": 76, "square_off": 68, "square_leg": 67, "fine_third": 62},
        "tactical_keys": [
            "Powerplay seam movement is highest in the east zone under lights.",
            "Spinners exploit spongy bounce in middle overs if pace is varied.",
            "Lush outfield provides rapid boundary conversion on ground strokes."
        ]
    },
    {
        "id": "chepauk",
        "name": "MA Chidambaram Stadium, Chepauk",
        "short_name": "Chepauk",
        "city": "Chennai",
        "franchise": "CSK",
        "aliases": ["%chidambaram%", "%chepauk%"],
        "pitch_type": "Dry Clay / Gripping Turn & Variable Bounce",
        "dew_risk": "Low to Moderate",
        "toss_verdict": "Bat First — Spin Fortress & 2nd Innings Grip",
        "dimensions": {"straight": 78, "square_off": 70, "square_leg": 68, "fine_third": 65},
        "tactical_keys": [
            "Defending teams hold 54.1% win rate — highest defending fortress in IPL.",
            "Finger spin and mystery spin concede <6.9 RPO with sharp purchase.",
            "Patience required in middle overs: rotating strike is prioritized over wild slogging."
        ]
    },
    {
        "id": "narendra_modi",
        "name": "Narendra Modi Stadium, Ahmedabad",
        "short_name": "Narendra Modi",
        "city": "Ahmedabad",
        "franchise": "GT",
        "aliases": ["%narendra modi%", "%motera%"],
        "pitch_type": "Dual Strip (Red / Black Soil) / True Bounce & Large Dimensions",
        "dew_risk": "Moderate",
        "toss_verdict": "Balanced — High 1st Innings Par Score (185+)",
        "dimensions": {"straight": 80, "square_off": 75, "square_leg": 72, "fine_third": 68},
        "tactical_keys": [
            "Longest square boundaries in India punish mistimed lofted shots.",
            "Extremely fast outfield rewards well-placed 2s and piercing ground cover drives.",
            "Two-paced behavior when black soil pitch is deployed."
        ]
    },
    {
        "id": "arun_jaitley",
        "name": "Arun Jaitley Stadium, Delhi",
        "short_name": "Kotla / Delhi",
        "city": "Delhi",
        "franchise": "DC",
        "aliases": ["%kotla%", "%arun jaitley%"],
        "pitch_type": "Re-laid Fast Surface / Short Square Boundaries",
        "dew_risk": "High in April/May",
        "toss_verdict": "Bowl First — Short Boundaries Make Chasing Rewarding",
        "dimensions": {"straight": 68, "square_off": 62, "square_leg": 61, "fine_third": 56},
        "tactical_keys": [
            "Re-laid surface in recent seasons elevated 1st innings par from 162 to 193.",
            "High boundary frequency: 19.8% of all balls reach the boundary rope.",
            "Cutters and off-pace deliveries into the pitch reduce power-hitting arc."
        ]
    },
    {
        "id": "rajiv_gandhi",
        "name": "Rajiv Gandhi Stadium, Hyderabad",
        "short_name": "Uppal / Hyderabad",
        "city": "Hyderabad",
        "franchise": "SRH",
        "aliases": ["%rajiv gandhi%", "%uppal%"],
        "pitch_type": "True Batting Strip / Record High Scoring Arena",
        "dew_risk": "Low to Moderate",
        "toss_verdict": "Bat First — Set Giant Score (Holds IPL 277 Record)",
        "dimensions": {"straight": 75, "square_off": 68, "square_leg": 66, "fine_third": 62},
        "tactical_keys": [
            "Venue of SRH 277/3 — highest powerplay boundary rate in the subcontinent.",
            "Even bounce enables batters to hit through the line comfortably.",
            "Wide yorkers and knuckle balls are crucial to survive death overs."
        ]
    },
    {
        "id": "sawai_mansingh",
        "name": "Sawai Mansingh Stadium, Jaipur",
        "short_name": "SMS / Jaipur",
        "city": "Jaipur",
        "franchise": "RR",
        "aliases": ["%sawai mansingh%"],
        "pitch_type": "Spacious Outfield / Big Boundaries / High Chase Efficiency",
        "dew_risk": "High",
        "toss_verdict": "Bowl First — 64.7% Chasing Win Rate (Highest in IPL)",
        "dimensions": {"straight": 78, "square_off": 74, "square_leg": 72, "fine_third": 65},
        "tactical_keys": [
            "Chasing teams dominate here with 64.7% victory percentage.",
            "Running between the wickets yields high double count due to large outfield.",
            "Wrist spinners hold lower economy than standard seamers."
        ]
    },
    {
        "id": "ekana",
        "name": "Ekana Cricket Stadium, Lucknow",
        "short_name": "Ekana / Lucknow",
        "city": "Lucknow",
        "franchise": "LSG",
        "aliases": ["%ekana%"],
        "pitch_type": "Multi-Pitch (Black Soil Sluggish / Red Soil True)",
        "dew_risk": "Moderate",
        "toss_verdict": "Assess Pitch Soil First — 160 is Defendable on Black Soil",
        "dimensions": {"straight": 77, "square_off": 71, "square_leg": 70, "fine_third": 63},
        "tactical_keys": [
            "Black soil pitches offer low bounce and heavy grip for finger spinners.",
            "Change of pace bowlers with back-of-the-hand slower balls thrive here.",
            "Cross-batted pull shots carry high top-edge dismissal risk."
        ]
    },
    {
        "id": "pca_mohali",
        "name": "PCA Stadium, Mohali / Mullanpur",
        "short_name": "Mohali / Mullanpur",
        "city": "Mohali",
        "franchise": "PBKS",
        "aliases": ["%punjab cricket%", "%pca%", "%mullanpur%"],
        "pitch_type": "Lively Seam / Early Swing & Rapid Carry",
        "dew_risk": "High (North India Evening)",
        "toss_verdict": "Bowl First — Fast Pace Attack Weapon",
        "dimensions": {"straight": 76, "square_off": 70, "square_leg": 68, "fine_third": 62},
        "tactical_keys": [
            "Good carry and bounce throughout the match favors genuine fast bowlers.",
            "New ball swings under floodlights during initial 4 overs.",
            "Dew makes death-over yorker execution challenging in the second innings."
        ]
    },
    {
        "id": "hpca_dharamshala",
        "name": "HPCA Stadium, Dharamshala",
        "short_name": "Dharamshala",
        "city": "Dharamshala",
        "franchise": "PBKS",
        "aliases": ["%himachal pradesh%", "%dharamsala%", "%dharamshala%"],
        "pitch_type": "High Altitude (1457m) / Cold Breeze / Extreme Seam & Ball Carry",
        "dew_risk": "Low",
        "toss_verdict": "Bat First — High 1st Innings Average (191.2)",
        "dimensions": {"straight": 73, "square_off": 67, "square_leg": 65, "fine_third": 60},
        "tactical_keys": [
            "Highest first innings scoring average (191.2) among all permanent IPL venues.",
            "Thin mountain air allows sixes to travel 10–12 meters further.",
            "Seamers get lateral zip off the fresh morning and evening surface."
        ]
    }
]


def _build_venue_where(aliases: List[str], field_name: str = "venue") -> str:
    clauses = [f"{field_name} ILIKE '{alias}'" for alias in aliases]
    return " OR ".join(clauses)


@router.get("")
def list_venues() -> Dict[str, Any]:
    """Retrieve all major IPL venues with live aggregated DuckDB analytics."""
    con = duckdb.connect(DEFAULT_DB_PATH, read_only=True)
    
    venue_cards = []
    
    for p in STADIUM_PROFILES:
        where_clause = _build_venue_where(p["aliases"], "venue")
        
        # 1. Match aggregations
        match_stats = con.execute(f"""
            SELECT
                COUNT(*) as total_matches,
                ROUND(AVG(innings1_score), 1) as avg1,
                ROUND(AVG(innings2_score), 1) as avg2,
                ROUND(100.0 * SUM(CASE WHEN team2 = match_winner THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) as chase_win_pct,
                MAX(innings1_score) as highest_inn1,
                MAX(innings2_score) as highest_inn2,
                MIN(innings1_score) as min_inn1
            FROM dim_matches
            WHERE {where_clause}
        """).fetchone()

        matches_count = match_stats[0] if match_stats else 0
        if matches_count == 0:
            continue
            
        avg1 = float(match_stats[1]) if match_stats[1] is not None else 165.0
        avg2 = float(match_stats[2]) if match_stats[2] is not None else 152.0
        chase_pct = float(match_stats[3]) if match_stats[3] is not None else 50.0
        bat1_pct = round(100.0 - chase_pct, 1)
        high_score = max(int(match_stats[4] or 0), int(match_stats[5] or 0))
        low_score = int(match_stats[6] or 68)

        # 2. Boundary rate & sixes per match from deliveries
        deliv_stats = con.execute(f"""
            SELECT
                COUNT(*) as total_balls,
                ROUND(100.0 * SUM(CASE WHEN is_boundary THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 1) as boundary_pct,
                ROUND(SUM(CASE WHEN is_six THEN 1 ELSE 0 END) * 1.0 / {matches_count}, 1) as sixes_per_match
            FROM fact_deliveries
            WHERE {where_clause}
        """).fetchone()

        boundary_pct = float(deliv_stats[1]) if deliv_stats and deliv_stats[1] else 17.5
        sixes_per_match = float(deliv_stats[2]) if deliv_stats and deliv_stats[2] else 11.2

        venue_cards.append({
            "id": p["id"],
            "name": p["name"],
            "short_name": p["short_name"],
            "city": p["city"],
            "franchise": p["franchise"],
            "matches": matches_count,
            "avg_1st_innings": avg1,
            "avg_2nd_innings": avg2,
            "chase_win_pct": chase_pct,
            "bat_first_win_pct": bat1_pct,
            "boundary_pct": boundary_pct,
            "sixes_per_match": sixes_per_match,
            "highest_score": high_score,
            "lowest_score": low_score,
            "pitch_type": p["pitch_type"],
            "dew_risk": p["dew_risk"],
            "toss_verdict": p["toss_verdict"]
        })

    con.close()
    
    # Sort by number of matches hosted descending
    venue_cards.sort(key=lambda x: x["matches"], reverse=True)
    
    return {
        "total_venues": len(venue_cards),
        "venues": venue_cards
    }


@router.get("/{venue_id}/insights")
def get_venue_insights(venue_id: str) -> Dict[str, Any]:
    """Retrieve deep tactical ground dossier, phase velocity, pace vs spin splits, and top stars."""
    # Find profile
    profile = next((p for p in STADIUM_PROFILES if p["id"].lower() == venue_id.lower() or p["name"].lower() == venue_id.lower()), None)
    if not profile:
        # Fallback to loose match
        profile = next((p for p in STADIUM_PROFILES if venue_id.lower() in p["name"].lower()), None)
    if not profile:
        raise HTTPException(status_code=404, detail=f"Venue '{venue_id}' not found.")

    con = duckdb.connect(DEFAULT_DB_PATH, read_only=True)
    where_clause = _build_venue_where(profile["aliases"], "venue")

    # 1. Base Summary
    base_stats = con.execute(f"""
        SELECT
            COUNT(*) as matches,
            ROUND(AVG(innings1_score), 1) as avg1,
            ROUND(AVG(innings2_score), 1) as avg2,
            ROUND(100.0 * SUM(CASE WHEN team2 = match_winner THEN 1 ELSE 0 END) / COUNT(*), 1) as chase_win_pct,
            MAX(innings1_score) as max_inn1,
            MAX(innings2_score) as max_inn2,
            MIN(innings1_score) as min_inn1
        FROM dim_matches
        WHERE {where_clause}
    """).fetchone()

    matches_count = base_stats[0]
    avg1 = float(base_stats[1])
    avg2 = float(base_stats[2])
    chase_pct = float(base_stats[3])
    bat1_pct = round(100.0 - chase_pct, 1)
    highest_score = max(int(base_stats[4] or 0), int(base_stats[5] or 0))
    lowest_score = int(base_stats[6] or 0)

    # 2. Phase-by-Phase Telemetry
    phase_rows = con.execute(f"""
        SELECT
            phase,
            ROUND(AVG(total_runs) * 6, 2) as run_rate,
            ROUND(100.0 * SUM(CASE WHEN is_boundary THEN 1 ELSE 0 END) / COUNT(*), 1) as boundary_pct,
            ROUND(100.0 * SUM(CASE WHEN is_wicket THEN 1 ELSE 0 END) / COUNT(*), 2) as wicket_pct,
            ROUND(100.0 * SUM(CASE WHEN is_dot THEN 1 ELSE 0 END) / COUNT(*), 1) as dot_pct
        FROM fact_deliveries
        WHERE {where_clause}
        GROUP BY phase
    """).fetchall()

    # Tournament baselines for comparison
    LEAGUE_BASELINES = {
        "Powerplay": {"run_rate": 7.42, "boundary_pct": 18.2, "dot_pct": 49.0},
        "Middle": {"run_rate": 7.75, "boundary_pct": 14.8, "dot_pct": 34.5},
        "Death": {"run_rate": 9.85, "boundary_pct": 21.0, "dot_pct": 29.5}
    }

    phases_data = []
    for r in phase_rows:
        p_name = r[0]
        base = LEAGUE_BASELINES.get(p_name, {"run_rate": 7.8, "boundary_pct": 16.0, "dot_pct": 35.0})
        diff = round(float(r[1]) - base["run_rate"], 2)
        phases_data.append({
            "phase": p_name,
            "run_rate": float(r[1]),
            "boundary_pct": float(r[2]),
            "wicket_pct": float(r[3]),
            "dot_pct": float(r[4]),
            "league_avg_rr": base["run_rate"],
            "delta_rr": diff
        })

    # Sort in standard match order
    order_map = {"Powerplay": 1, "Middle": 2, "Death": 3}
    phases_data.sort(key=lambda x: order_map.get(x["phase"], 99))

    # 3. Pace vs Spin breakdown
    bowler_deliveries = con.execute(f"""
        SELECT
            bowler,
            SUM(total_runs) as runs,
            COUNT(*) as balls,
            COUNT(*) FILTER (WHERE is_wicket AND dismissal_kind NOT IN ('run out', 'retired hurt', 'obstructing the field')) as wickets
        FROM fact_deliveries
        WHERE {where_clause}
        GROUP BY bowler
        HAVING balls >= 30
    """).fetchall()

    pace_wickets, pace_runs, pace_balls = 0, 0, 0
    spin_wickets, spin_runs, spin_balls = 0, 0, 0

    for b_name, b_runs, b_balls, b_wkts in bowler_deliveries:
        is_spin = any(sp in b_name.lower() for sp in KNOWN_SPINNERS)
        if is_spin:
            spin_wickets += b_wkts
            spin_runs += b_runs
            spin_balls += b_balls
        else:
            pace_wickets += b_wkts
            pace_runs += b_runs
            pace_balls += b_balls

    total_wkts = max(1, pace_wickets + spin_wickets)
    pace_wkt_pct = round(100.0 * pace_wickets / total_wkts, 1)
    spin_wkt_pct = round(100.0 * spin_wickets / total_wkts, 1)
    pace_econ = round(pace_runs * 6.0 / max(1, pace_balls), 2)
    spin_econ = round(spin_runs * 6.0 / max(1, spin_balls), 2)

    # 4. Top Batters at Venue
    top_batters_rows = con.execute(f"""
        SELECT
            striker,
            CAST(SUM(runs_off_bat) AS INTEGER) as runs,
            COUNT(*) as balls,
            ROUND(100.0 * SUM(runs_off_bat) / COUNT(*), 1) as strike_rate,
            SUM(CASE WHEN is_four THEN 1 ELSE 0 END) as fours,
            SUM(CASE WHEN is_six THEN 1 ELSE 0 END) as sixes
        FROM fact_deliveries
        WHERE {where_clause}
        GROUP BY striker
        ORDER BY runs DESC
        LIMIT 5
    """).fetchall()

    top_batters = [
        {
            "name": row[0],
            "runs": row[1],
            "balls": row[2],
            "strike_rate": float(row[3]),
            "fours": row[4],
            "sixes": row[5]
        }
        for row in top_batters_rows
    ]

    # 5. Top Bowlers at Venue
    top_bowlers_rows = con.execute(f"""
        SELECT
            bowler,
            COUNT(*) FILTER (WHERE is_wicket AND dismissal_kind NOT IN ('run out', 'retired hurt', 'obstructing the field')) as wickets,
            COUNT(*) as balls,
            ROUND(AVG(total_runs) * 6, 2) as economy,
            SUM(CASE WHEN is_dot THEN 1 ELSE 0 END) as dots
        FROM fact_deliveries
        WHERE {where_clause}
        GROUP BY bowler
        ORDER BY wickets DESC
        LIMIT 5
    """).fetchall()

    top_bowlers = [
        {
            "name": row[0],
            "wickets": row[1],
            "overs": round(row[2] / 6.0, 1),
            "economy": float(row[3]),
            "dots": row[4]
        }
        for row in top_bowlers_rows
    ]

    # 6. Recent iconic matches at this venue
    recent_matches_df = con.execute(f"""
        SELECT
            match_id,
            match_date,
            season,
            team1,
            team2,
            innings1_score,
            innings1_wickets,
            innings2_score,
            innings2_wickets,
            match_winner
        FROM dim_matches
        WHERE {where_clause}
        ORDER BY match_date DESC
        LIMIT 4
    """).fetchdf()

    recent_matches = []
    for _, r in recent_matches_df.iterrows():
        recent_matches.append({
            "match_id": r["match_id"],
            "date": r["match_date"],
            "season": str(r["season"]),
            "team1": {"name": r["team1"], "score": f"{int(r['innings1_score'])}/{int(r['innings1_wickets'])}"},
            "team2": {"name": r["team2"], "score": f"{int(r['innings2_score'])}/{int(r['innings2_wickets'])}"},
            "winner": r["match_winner"]
        })

    con.close()

    return {
        "id": profile["id"],
        "name": profile["name"],
        "short_name": profile["short_name"],
        "city": profile["city"],
        "franchise": profile["franchise"],
        "matches": matches_count,
        "avg_1st_innings": avg1,
        "avg_2nd_innings": avg2,
        "chase_win_pct": chase_pct,
        "bat_first_win_pct": bat1_pct,
        "highest_score": highest_score,
        "lowest_score": lowest_score,
        "pitch_type": profile["pitch_type"],
        "dew_risk": profile["dew_risk"],
        "toss_verdict": profile["toss_verdict"],
        "dimensions": profile["dimensions"],
        "tactical_keys": profile["tactical_keys"],
        "phases": phases_data,
        "pace_vs_spin": {
            "pace_wickets_pct": pace_wkt_pct,
            "spin_wickets_pct": spin_wkt_pct,
            "pace_economy": pace_econ,
            "spin_economy": spin_econ,
            "pace_wickets_total": pace_wickets,
            "spin_wickets_total": spin_wickets
        },
        "top_batters": top_batters,
        "top_bowlers": top_bowlers,
        "recent_matches": recent_matches
    }
