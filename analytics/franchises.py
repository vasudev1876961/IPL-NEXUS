"""Franchise War Room and Team Decision Intelligence Engine.

Computes broadcast-grade franchise dossiers, head-to-head rivalry matrices,
playing XI tactical clash simulations (with IPL Impact Player rule), and
mega auction purse valuations directly from DuckDB OLAP warehouse.
"""

from typing import Dict, Any, List, Optional
import duckdb
import numpy as np

from data_pipeline.warehouse_loader import DEFAULT_DB_PATH, get_readonly_connection

# In-memory performance caches for fast responses (<1ms)
_RIVALRY_MATRIX_CACHE: Optional[Dict[str, Any]] = None
_FRANCHISE_SUMMARIES_CACHE: Optional[List[Dict[str, Any]]] = None
_FRANCHISE_DOSSIER_CACHE: Dict[str, Dict[str, Any]] = {}

# Canonical 10 Active Franchises Metadata
ACTIVE_FRANCHISES = {
    "CSK": {
        "id": "CSK",
        "name": "Chennai Super Kings",
        "short": "CSK",
        "city": "Chennai",
        "home_ground": "MA Chidambaram Stadium, Chepauk, Chennai",
        "home_patterns": ["%chidambaram%", "%chepauk%"],
        "trophies": [2010, 2011, 2018, 2021, 2023],
        "titles_count": 5,
        "primary_color": "#f9ed25",
        "secondary_color": "#0668b3",
        "established": 2008,
        "motto": "Whistle Podu",
        "captains": ["MS Dhoni", "RD Gaikwad", "RA Jadeja"]
    },
    "MI": {
        "id": "MI",
        "name": "Mumbai Indians",
        "short": "MI",
        "city": "Mumbai",
        "home_ground": "Wankhede Stadium, Mumbai",
        "home_patterns": ["%wankhede%", "%brabourne%"],
        "trophies": [2013, 2015, 2017, 2019, 2020],
        "titles_count": 5,
        "primary_color": "#005289",
        "secondary_color": "#edce83",
        "established": 2008,
        "motto": "Duniya Hila Denge",
        "captains": ["RG Sharma", "HH Pandya", "SR Tendulkar", "Harbhajan Singh"]
    },
    "KKR": {
        "id": "KKR",
        "name": "Kolkata Knight Riders",
        "short": "KKR",
        "city": "Kolkata",
        "home_ground": "Eden Gardens, Kolkata",
        "home_patterns": ["%eden%"],
        "trophies": [2012, 2014, 2024],
        "titles_count": 3,
        "primary_color": "#602f92",
        "secondary_color": "#f2c028",
        "established": 2008,
        "motto": "Korbo Lorbo Jeetbo",
        "captains": ["G Gambhir", "SS Iyer", "KD Karthik", "SC Ganguly"]
    },
    "RCB": {
        "id": "RCB",
        "name": "Royal Challengers Bengaluru",
        "short": "RCB",
        "city": "Bengaluru",
        "home_ground": "M Chinnaswamy Stadium, Bengaluru",
        "home_patterns": ["%chinnaswamy%"],
        "trophies": [],
        "titles_count": 0,
        "primary_color": "#d6272e",
        "secondary_color": "#001f61",
        "established": 2008,
        "motto": "Ee Sala Cup Namde",
        "captains": ["V Kohli", "F du Plessis", "A Kumble", "DL Vettori"]
    },
    "RR": {
        "id": "RR",
        "name": "Rajasthan Royals",
        "short": "RR",
        "city": "Jaipur",
        "home_ground": "Sawai Mansingh Stadium, Jaipur",
        "home_patterns": ["%sawai mansingh%", "%jaipur%"],
        "trophies": [2008],
        "titles_count": 1,
        "primary_color": "#ed1164",
        "secondary_color": "#26235e",
        "established": 2008,
        "motto": "Halla Bol",
        "captains": ["SV Samson", "SK Warne", "AM Rahane", "SR Watson"]
    },
    "SRH": {
        "id": "SRH",
        "name": "Sunrisers Hyderabad",
        "short": "SRH",
        "city": "Hyderabad",
        "home_ground": "Rajiv Gandhi International Stadium, Uppal, Hyderabad",
        "home_patterns": ["%rajiv gandhi%", "%uppal%", "%hyderabad%"],
        "trophies": [2016],
        "titles_count": 1,
        "primary_color": "#f04e23",
        "secondary_color": "#ff7d19",
        "established": 2013,
        "motto": "Orange Army",
        "captains": ["PJ Cummins", "DA Warner", "KS Williamson", "KC Sangakkara"]
    },
    "DC": {
        "id": "DC",
        "name": "Delhi Capitals",
        "short": "DC",
        "city": "Delhi",
        "home_ground": "Arun Jaitley Stadium, Delhi",
        "home_patterns": ["%arun jaitley%", "%feroz shah kotla%", "%delhi%"],
        "trophies": [],
        "titles_count": 0,
        "primary_color": "#253e8a",
        "secondary_color": "#f04945",
        "established": 2008,
        "motto": "Roar Macha",
        "captains": ["RR Pant", "SS Iyer", "DA Warner", "V Sehwag", "G Gambhir"]
    },
    "PBKS": {
        "id": "PBKS",
        "name": "Punjab Kings",
        "short": "PBKS",
        "city": "Mohali",
        "home_ground": "PCA IS Bindra Stadium, Mohali",
        "home_patterns": ["%bindra%", "%mohali%", "%mullanpur%"],
        "trophies": [],
        "titles_count": 0,
        "primary_color": "#d52027",
        "secondary_color": "#ffdead",
        "established": 2008,
        "motto": "Sadda Punjab",
        "captains": ["S Dhawan", "KL Rahul", "R Ashwin", "Yuvraj Singh", "GJ Bailey"]
    },
    "GT": {
        "id": "GT",
        "name": "Gujarat Titans",
        "short": "GT",
        "city": "Ahmedabad",
        "home_ground": "Narendra Modi Stadium, Ahmedabad",
        "home_patterns": ["%narendra modi%", "%motera%", "%ahmedabad%"],
        "trophies": [2022],
        "titles_count": 1,
        "primary_color": "#0b1d34",
        "secondary_color": "#bd9e5e",
        "established": 2022,
        "motto": "Aava De",
        "captains": ["Shubman Gill", "HH Pandya"]
    },
    "LSG": {
        "id": "LSG",
        "name": "Lucknow Super Giants",
        "short": "LSG",
        "city": "Lucknow",
        "home_ground": "Ekana Cricket Stadium, Lucknow",
        "home_patterns": ["%ekana%", "%lucknow%"],
        "trophies": [],
        "titles_count": 0,
        "primary_color": "#aa003b",
        "secondary_color": "#002554",
        "established": 2022,
        "motto": "Adab Se Harayenge",
        "captains": ["KL Rahul", "N Pooran"]
    }
}

# Known Overseas Players in IPL
KNOWN_OVERSEAS = {
    "ab de villiers", "ch gayle", "da warner", "f du plessis", "dj bravo", "sp narine",
    "rashid khan", "ad russell", "jc buttler", "gj maxwell", "n pooran", "q de kock",
    "ka pollard", "so hetmyer", "ta boult", "lh ferguson", "pj cummins", "ma starc",
    "h klaasen", "tm head", "k rabada", "a nortje", "j archer", "sw tait", "sl malinga",
    "m muralitharan", "ja morkel", "sr watson", "mek hussey", "dr smith", "bb mccullum",
    "ml hayden", "ac gilchrist", "sa yadav", "dw steyn", "m johnson", "st jayasuriya",
    "kp pietersen", "e morgan", "ba stokes", "m ali", "sm curran", "ls livingstone",
    "c green", "mw short", "mp stoinis", "th david", "dg bracewell", "noor ahmad",
    "m theekshana", "m pathirana", "fazalhaq farooqi", "w hasaranga", "d conway",
    "ra ravindra", "m santner", "dp conway", "gd phillips", "m jansen", "w jacks",
    "gc coetzee", "kw richardson", "aj tye", "n burger", "tstubbs", "t stubbs", "j fraser-mcgurk"
}

# Known Wicket Keepers
KNOWN_WICKET_KEEPERS = {
    "ms dhoni", "rr pant", "kl rahul", "sv samson", "kd karthik", "q de kock",
    "jc buttler", "n pooran", "wp saha", "ab de villiers", "ishank kishan", "ishan kishan",
    "pa patel", "ac gilchrist", "kc sangakkara", "bb mccullum", "jm bairstow",
    "jitesh sharma", "prabhsimran singh", "anuj rawat", "ks bharat", "dhruv jurel",
    "philip salt", "pd salt", "rh uthappa", "r uthappa"
}


def get_franchise_id_by_name(team_name: str) -> Optional[str]:
    """Find franchise ID by full or partial team name."""
    norm = team_name.lower().strip()
    for fid, meta in ACTIVE_FRANCHISES.items():
        if norm == meta["name"].lower() or norm == meta["short"].lower():
            return fid
        if meta["name"].lower() in norm or norm in meta["name"].lower():
            return fid
    return None


def get_all_franchises_summary(db_path: str = DEFAULT_DB_PATH) -> List[Dict[str, Any]]:
    """Return overview summary for all 10 active IPL franchises."""
    global _FRANCHISE_SUMMARIES_CACHE
    if _FRANCHISE_SUMMARIES_CACHE is not None:
        return _FRANCHISE_SUMMARIES_CACHE

    con = get_readonly_connection(db_path)

    # Pre-aggregate all batting delivery totals in one batch query
    bat_map = {}
    for r in con.execute("""
        SELECT batting_team, COALESCE(SUM(runs_off_bat + extras), 0), COUNT(CASE WHEN is_four = 1 THEN 1 END), COUNT(CASE WHEN is_six = 1 THEN 1 END)
        FROM fact_deliveries
        GROUP BY batting_team
    """).fetchall():
        fid = get_franchise_id_by_name(r[0])
        if fid:
            bat_map[fid] = {
                "runs": int(r[1] or 0),
                "fours": int(r[2] or 0),
                "sixes": int(r[3] or 0)
            }

    # Pre-aggregate all bowling wickets in one batch query
    bowl_map = {}
    for r in con.execute("""
        SELECT bowling_team, COUNT(CASE WHEN is_wicket = 1 AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END)
        FROM fact_deliveries
        GROUP BY bowling_team
    """).fetchall():
        fid = get_franchise_id_by_name(r[0])
        if fid:
            bowl_map[fid] = int(r[1] or 0)

    summaries = []

    for fid, meta in ACTIVE_FRANCHISES.items():
        team_name = meta["name"]

        # Matches and wins
        query = """
            SELECT
                COUNT(match_id) as matches_played,
                COUNT(CASE WHEN match_winner = ? THEN 1 END) as wins,
                COUNT(CASE WHEN match_winner != ? AND match_winner != 'Tie/No Result' AND match_winner IS NOT NULL THEN 1 END) as losses,
                COUNT(CASE WHEN match_winner = 'Tie/No Result' OR match_winner IS NULL THEN 1 END) as ties,
                -- Defending (batting 1st)
                COUNT(CASE WHEN team1 = ? THEN 1 END) as bat1_matches,
                COUNT(CASE WHEN team1 = ? AND match_winner = ? THEN 1 END) as bat1_wins,
                -- Chasing (batting 2nd)
                COUNT(CASE WHEN team2 = ? THEN 1 END) as bat2_matches,
                COUNT(CASE WHEN team2 = ? AND match_winner = ? THEN 1 END) as bat2_wins
            FROM dim_matches
            WHERE team1 = ? OR team2 = ?
        """
        params = [team_name, team_name, team_name, team_name, team_name, team_name, team_name, team_name, team_name, team_name]
        row = con.execute(query, params).fetchone()

        played = row[0] or 0
        wins = row[1] or 0
        losses = row[2] or 0
        ties = row[3] or 0
        win_rate = round((wins / played * 100.0), 1) if played > 0 else 0.0

        bat1_matches = row[4] or 0
        bat1_wins = row[5] or 0
        defend_win_pct = round((bat1_wins / bat1_matches * 100.0), 1) if bat1_matches > 0 else 0.0

        bat2_matches = row[6] or 0
        bat2_wins = row[7] or 0
        chase_win_pct = round((bat2_wins / bat2_matches * 100.0), 1) if bat2_matches > 0 else 0.0

        deliv_info = bat_map.get(fid, {"runs": 0, "fours": 0, "sixes": 0})
        total_wkts = bowl_map.get(fid, 0)

        summaries.append({
            "id": fid,
            "name": meta["name"],
            "short": meta["short"],
            "city": meta["city"],
            "home_ground": meta["home_ground"],
            "primary_color": meta["primary_color"],
            "secondary_color": meta["secondary_color"],
            "trophies": meta["trophies"],
            "titles_count": meta["titles_count"],
            "established": meta["established"],
            "motto": meta["motto"],
            "captains": meta["captains"],
            "matches_played": played,
            "wins": wins,
            "losses": losses,
            "ties": ties,
            "win_rate": win_rate,
            "defend_win_pct": defend_win_pct,
            "chase_win_pct": chase_win_pct,
            "total_runs": deliv_info["runs"],
            "fours": deliv_info["fours"],
            "sixes": deliv_info["sixes"],
            "total_wickets": int(total_wkts)
        })

    # Sort by titles won, then win rate
    summaries.sort(key=lambda x: (x["titles_count"], x["win_rate"]), reverse=True)
    _FRANCHISE_SUMMARIES_CACHE = summaries
    return summaries


def get_franchise_dossier(franchise_id: str, db_path: str = DEFAULT_DB_PATH) -> Dict[str, Any]:
    """Generate detailed strategic dossier for an IPL franchise."""
    fid = franchise_id.upper()
    if fid not in ACTIVE_FRANCHISES:
        raise ValueError(f"Unknown franchise ID: {franchise_id}")

    if fid in _FRANCHISE_DOSSIER_CACHE:
        return _FRANCHISE_DOSSIER_CACHE[fid]

    meta = ACTIVE_FRANCHISES[fid]
    team_name = meta["name"]
    con = get_readonly_connection(db_path)

    # 1. Overall Career & Standings
    stats_query = """
        SELECT
            COUNT(match_id) as matches,
            COUNT(CASE WHEN match_winner = ? THEN 1 END) as wins,
            COUNT(CASE WHEN match_winner != ? AND match_winner != 'Tie/No Result' AND match_winner IS NOT NULL THEN 1 END) as losses,
            -- Defend vs Chase
            COUNT(CASE WHEN team1 = ? AND match_winner = ? THEN 1 END) as bat1_wins,
            COUNT(CASE WHEN team1 = ? THEN 1 END) as bat1_matches,
            COUNT(CASE WHEN team2 = ? AND match_winner = ? THEN 1 END) as bat2_wins,
            COUNT(CASE WHEN team2 = ? THEN 1 END) as bat2_matches,
            -- Max and min score
            MAX(CASE WHEN team1 = ? THEN innings1_score WHEN team2 = ? THEN innings2_score ELSE NULL END) as max_score,
            MIN(CASE WHEN team1 = ? THEN innings1_score WHEN team2 = ? THEN innings2_score ELSE NULL END) as min_score,
            AVG(CASE WHEN team1 = ? THEN innings1_score ELSE NULL END) as avg_1st_innings
        FROM dim_matches
        WHERE team1 = ? OR team2 = ?
    """
    params = [team_name] * 15
    s_row = con.execute(stats_query, params).fetchone()

    played = s_row[0] or 0
    wins = s_row[1] or 0
    losses = s_row[2] or 0
    win_pct = round((wins / played * 100.0), 1) if played > 0 else 0.0

    bat1_wins = s_row[3] or 0
    bat1_matches = s_row[4] or 0
    defend_pct = round((bat1_wins / bat1_matches * 100.0), 1) if bat1_matches > 0 else 0.0

    bat2_wins = s_row[5] or 0
    bat2_matches = s_row[6] or 0
    chase_pct = round((bat2_wins / bat2_matches * 100.0), 1) if bat2_matches > 0 else 0.0

    max_score = s_row[7] or 0
    min_score = s_row[8] or 0
    avg_1st_innings = round(s_row[9] or 0.0, 1)

    # 2. Fortress Analysis (Home vs Away)
    home_conds = " OR ".join(["venue ILIKE ?" for _ in meta["home_patterns"]])
    home_query = f"""
        SELECT
            COUNT(match_id) as home_matches,
            COUNT(CASE WHEN match_winner = ? THEN 1 END) as home_wins
        FROM dim_matches
        WHERE (team1 = ? OR team2 = ?) AND ({home_conds})
    """
    home_params = [team_name, team_name, team_name] + meta["home_patterns"]
    h_row = con.execute(home_query, home_params).fetchone()

    home_matches = h_row[0] or 0
    home_wins = h_row[1] or 0
    home_win_pct = round((home_wins / home_matches * 100.0), 1) if home_matches > 0 else 0.0

    away_matches = played - home_matches
    away_wins = wins - home_wins
    away_win_pct = round((away_wins / away_matches * 100.0), 1) if away_matches > 0 else 0.0
    fortress_differential = round(home_win_pct - away_win_pct, 1)

    # 3. Batting Phase Radar Metrics
    bat_phase_query = """
        SELECT
            phase,
            COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
            COALESCE(SUM(runs_off_bat + extras), 0) as runs,
            COUNT(CASE WHEN is_wicket THEN 1 END) as wickets,
            COUNT(CASE WHEN is_boundary THEN 1 END) as boundaries,
            COUNT(CASE WHEN is_dot THEN 1 END) as dots
        FROM fact_deliveries
        WHERE batting_team = ?
        GROUP BY phase
    """
    bat_phase_rows = con.execute(bat_phase_query, [team_name]).fetchall()
    bat_phase_map = {r[0]: r for r in bat_phase_rows}

    def calc_bat_phase(phase_name):
        row = bat_phase_map.get(phase_name)
        if not row or row[1] == 0:
            return {"run_rate": 7.5, "boundary_pct": 14.0, "dot_pct": 35.0, "balls_per_wicket": 18.0}
        balls = row[1]
        runs = row[2]
        wkts = max(row[3], 1)
        bounds = row[4]
        dots = row[5]
        return {
            "run_rate": round((runs * 6.0) / balls, 2),
            "boundary_pct": round((bounds / balls) * 100.0, 1),
            "dot_pct": round((dots / balls) * 100.0, 1),
            "balls_per_wicket": round(balls / wkts, 1)
        }

    powerplay_bat = calc_bat_phase("Powerplay")
    middle_bat = calc_bat_phase("Middle")
    death_bat = calc_bat_phase("Death")

    # 4. Bowling Phase Radar Metrics
    bowl_phase_query = """
        SELECT
            phase,
            COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
            COALESCE(SUM(runs_off_bat + extras), 0) as runs,
            COUNT(CASE WHEN is_wicket AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as wickets,
            COUNT(CASE WHEN is_dot THEN 1 END) as dots
        FROM fact_deliveries
        WHERE bowling_team = ?
        GROUP BY phase
    """
    bowl_phase_rows = con.execute(bowl_phase_query, [team_name]).fetchall()
    bowl_phase_map = {r[0]: r for r in bowl_phase_rows}

    def calc_bowl_phase(phase_name):
        row = bowl_phase_map.get(phase_name)
        if not row or row[1] == 0:
            return {"economy": 8.0, "dot_pct": 35.0, "balls_per_wicket": 20.0}
        balls = row[1]
        runs = row[2]
        wkts = max(row[3], 1)
        dots = row[4]
        return {
            "economy": round((runs * 6.0) / balls, 2),
            "dot_pct": round((dots / balls) * 100.0, 1),
            "balls_per_wicket": round(balls / wkts, 1)
        }

    powerplay_bowl = calc_bowl_phase("Powerplay")
    middle_bowl = calc_bowl_phase("Middle")
    death_bowl = calc_bowl_phase("Death")

    # 5. Hall of Fame (Top 5 Run Scorers & Top 5 Wicket Takers)
    top_batters_query = """
        SELECT
            striker,
            COUNT(DISTINCT match_id) as matches,
            COALESCE(SUM(runs_off_bat), 0) as runs,
            COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
            COUNT(CASE WHEN is_four THEN 1 END) as fours,
            COUNT(CASE WHEN is_six THEN 1 END) as sixes
        FROM fact_deliveries
        WHERE batting_team = ?
        GROUP BY striker
        ORDER BY runs DESC
        LIMIT 5
    """
    top_batters = []
    for r in con.execute(top_batters_query, [team_name]).fetchall():
        balls = r[3] or 1
        runs = r[2] or 0
        sr = round(runs * 100.0 / balls, 1)
        top_batters.append({
            "player": r[0],
            "matches": r[1],
            "runs": runs,
            "balls": balls,
            "strike_rate": sr,
            "fours": r[4],
            "sixes": r[5]
        })

    top_bowlers_query = """
        SELECT
            bowler,
            COUNT(DISTINCT match_id) as matches,
            COUNT(CASE WHEN is_wicket = 1 AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as wkts,
            COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
            COALESCE(SUM(runs_off_bat + extras), 0) as runs_conceded
        FROM fact_deliveries
        WHERE bowling_team = ?
        GROUP BY bowler
        ORDER BY wkts DESC
        LIMIT 5
    """
    top_bowlers = []
    for r in con.execute(top_bowlers_query, [team_name]).fetchall():
        balls = r[3] or 1
        runs = r[4] or 0
        econ = round(runs * 6.0 / balls, 2)
        top_bowlers.append({
            "player": r[0],
            "matches": r[1],
            "wickets": r[2],
            "overs": round(balls / 6.0, 1),
            "economy": econ
        })

    # 6. Squad Roster Pool
    roster_query = """
        WITH batting AS (
            SELECT striker as player, COUNT(DISTINCT match_id) as matches_bat, SUM(runs_off_bat) as runs,
                   COUNT(CASE WHEN is_legal_ball = 1 THEN 1 END) as balls,
                   COUNT(CASE WHEN phase = 'Death' THEN 1 END) as death_balls
            FROM fact_deliveries WHERE batting_team = ? GROUP BY striker
        ),
        bowling AS (
            SELECT bowler as player, COUNT(DISTINCT match_id) as matches_bowl,
                   COUNT(CASE WHEN is_wicket = 1 AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as wkts,
                   COUNT(CASE WHEN is_legal_ball = 1 THEN 1 END) as balls_bowled,
                   SUM(runs_off_bat + extras) as runs_conceded
            FROM fact_deliveries WHERE bowling_team = ? GROUP BY bowler
        )
        SELECT
            COALESCE(b.player, bw.player) as player_name,
            COALESCE(b.runs, 0) as runs,
            ROUND(COALESCE(b.runs, 0)*100.0/NULLIF(b.balls, 0), 1) as sr,
            COALESCE(b.balls, 0) as balls_faced,
            COALESCE(bw.wkts, 0) as wickets,
            ROUND(COALESCE(bw.runs_conceded, 0)*6.0/NULLIF(bw.balls_bowled, 0), 2) as econ,
            COALESCE(bw.balls_bowled, 0) as balls_bowled,
            COALESCE(b.death_balls, 0) as death_balls
        FROM batting b FULL OUTER JOIN bowling bw ON b.player = bw.player
        ORDER BY (COALESCE(b.runs, 0) + COALESCE(bw.wkts, 0)*25) DESC
        LIMIT 35
    """
    roster_rows = con.execute(roster_query, [team_name, team_name]).fetchall()
    roster_pool = []

    for r in roster_rows:
        p_name = r[0]
        p_lower = p_name.lower()
        runs = r[1] or 0
        sr = r[2] or 0.0
        wkts = r[4] or 0
        econ = r[5] or 0.0
        death_balls = r[7] or 0

        is_overseas = p_lower in KNOWN_OVERSEAS
        is_wk = p_lower in KNOWN_WICKET_KEEPERS

        # Classify primary role
        if is_wk:
            role = "Wicket-Keeper"
        elif runs >= 500 and wkts >= 15:
            role = "All-Rounder"
        elif wkts >= 20:
            if econ <= 7.8 and ("chahal" in p_lower or "ashwin" in p_lower or "narine" in p_lower or "rashid" in p_lower or "jadeja" in p_lower or "chawla" in p_lower or "mishra" in p_lower or "bishnoi" in p_lower or "kuldeep" in p_lower):
                role = "Spin Bowler"
            else:
                role = "Pace Bowler"
        elif death_balls >= 150 and sr >= 140.0:
            role = "Finisher"
        elif sr >= 135.0:
            role = "Top-Order Batter"
        else:
            role = "Middle-Order Batter"

        base_val = 1.5
        bat_val = min(runs / 400.0, 8.0) * (sr / 130.0)
        bowl_val = min(wkts / 15.0, 7.5) * (8.5 / max(econ, 6.0))
        allround_bonus = 2.5 if role == "All-Rounder" else 0.0
        wk_bonus = 1.5 if is_wk else 0.0
        total_val = round(min(max(base_val + bat_val + bowl_val + allround_bonus + wk_bonus, 0.75), 18.5), 2)

        roster_pool.append({
            "player_name": p_name,
            "role": role,
            "is_overseas": is_overseas,
            "is_wicket_keeper": is_wk,
            "runs": runs,
            "strike_rate": sr,
            "wickets": wkts,
            "economy": econ,
            "expected_auction_price_cr": total_val
        })

    con.close()

    tactical_insights = [
        f"{meta['name']} boasts a {home_win_pct}% win rate at {meta['short']} Fortress ({meta['city']}) vs {away_win_pct}% in away encounters.",
        f"Chasing conversion rate stands at {chase_pct}% compared to {defend_pct}% when defending target totals.",
        f"Powerplay scoring tempo is {powerplay_bat['run_rate']} RPO with a {powerplay_bat['boundary_pct']}% boundary hit rate.",
        f"Death-overs execution yields {death_bat['run_rate']} RPO with bat and {death_bowl['economy']} economy with ball."
    ]

    dossier_result = {
        "id": fid,
        "name": meta["name"],
        "short": meta["short"],
        "city": meta["city"],
        "home_ground": meta["home_ground"],
        "primary_color": meta["primary_color"],
        "secondary_color": meta["secondary_color"],
        "trophies": meta["trophies"],
        "titles_count": meta["titles_count"],
        "established": meta["established"],
        "motto": meta["motto"],
        "captains": meta["captains"],
        "matches_played": played,
        "wins": wins,
        "losses": losses,
        "win_rate": win_pct,
        "defend_win_pct": defend_pct,
        "chase_win_pct": chase_pct,
        "max_score": max_score,
        "min_score": min_score,
        "avg_1st_innings": avg_1st_innings,
        "fortress": {
            "home_matches": home_matches,
            "home_wins": home_wins,
            "home_win_pct": home_win_pct,
            "away_matches": away_matches,
            "away_wins": away_wins,
            "away_win_pct": away_win_pct,
            "fortress_differential": fortress_differential
        },
        "phase_radar": {
            "batting": {
                "powerplay": powerplay_bat,
                "middle": middle_bat,
                "death": death_bat
            },
            "bowling": {
                "powerplay": powerplay_bowl,
                "middle": middle_bowl,
                "death": death_bowl
            }
        },
        "top_batters": top_batters,
        "top_bowlers": top_bowlers,
        "roster_pool": roster_pool,
        "tactical_insights": tactical_insights
    }
    _FRANCHISE_DOSSIER_CACHE[fid] = dossier_result
    return dossier_result


def get_rivalry_details(team1_id: str, team2_id: str, db_path: str = DEFAULT_DB_PATH) -> Dict[str, Any]:
    """Analyze head-to-head historic clashes between two franchises."""
    t1_id = team1_id.upper()
    t2_id = team2_id.upper()
    if t1_id not in ACTIVE_FRANCHISES or t2_id not in ACTIVE_FRANCHISES:
        raise ValueError("Both team IDs must be valid active IPL franchises.")

    meta1 = ACTIVE_FRANCHISES[t1_id]
    meta2 = ACTIVE_FRANCHISES[t2_id]
    t1_name = meta1["name"]
    t2_name = meta2["name"]

    con = get_readonly_connection(db_path)

    # 1. Clash summary
    clash_query = """
        SELECT
            COUNT(match_id) as total_clashes,
            COUNT(CASE WHEN match_winner = ? THEN 1 END) as t1_wins,
            COUNT(CASE WHEN match_winner = ? THEN 1 END) as t2_wins,
            COUNT(CASE WHEN match_winner = 'Tie/No Result' OR match_winner IS NULL THEN 1 END) as ties,
            MAX(CASE WHEN team1 = ? THEN innings1_score WHEN team2 = ? THEN innings2_score ELSE NULL END) as t1_max_score,
            MAX(CASE WHEN team1 = ? THEN innings1_score WHEN team2 = ? THEN innings2_score ELSE NULL END) as t2_max_score,
            MIN(CASE WHEN team1 = ? THEN innings1_score WHEN team2 = ? THEN innings2_score ELSE NULL END) as t1_min_score,
            MIN(CASE WHEN team1 = ? THEN innings1_score WHEN team2 = ? THEN innings2_score ELSE NULL END) as t2_min_score,
            ROUND(AVG(innings1_score), 1) as avg_1st_innings
        FROM dim_matches
        WHERE (team1 = ? AND team2 = ?) OR (team1 = ? AND team2 = ?)
    """
    params = [
        t1_name, t2_name,
        t1_name, t1_name,
        t2_name, t2_name,
        t1_name, t1_name,
        t2_name, t2_name,
        t1_name, t2_name, t2_name, t1_name
    ]
    row = con.execute(clash_query, params).fetchone()

    total_clashes = row[0] or 0
    t1_wins = row[1] or 0
    t2_wins = row[2] or 0
    ties = row[3] or 0

    t1_win_pct = round((t1_wins / total_clashes * 100.0), 1) if total_clashes > 0 else 0.0
    t2_win_pct = round((t2_wins / total_clashes * 100.0), 1) if total_clashes > 0 else 0.0

    t1_max = row[4] or 0
    t2_max = row[5] or 0
    t1_min = row[6] or 0
    t2_min = row[7] or 0
    avg_1st_innings = row[8] or 0.0

    # 2. Key Venue Splits
    venue_query = """
        SELECT
            venue,
            COUNT(match_id) as matches,
            COUNT(CASE WHEN match_winner = ? THEN 1 END) as t1_wins,
            COUNT(CASE WHEN match_winner = ? THEN 1 END) as t2_wins
        FROM dim_matches
        WHERE (team1 = ? AND team2 = ?) OR (team1 = ? AND team2 = ?)
        GROUP BY venue
        ORDER BY matches DESC
        LIMIT 6
    """
    v_rows = con.execute(venue_query, [t1_name, t2_name, t1_name, t2_name, t2_name, t1_name]).fetchall()
    venue_splits = []
    for vr in v_rows:
        venue_splits.append({
            "venue": vr[0],
            "matches": vr[1],
            "team1_wins": vr[2],
            "team2_wins": vr[3]
        })

    # 3. Top Batter & Top Bowler in this rivalry
    top_batter_query = """
        SELECT striker, batting_team, SUM(runs_off_bat) as runs, COUNT(DISTINCT match_id) as matches,
               COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls
        FROM fact_deliveries
        WHERE (batting_team = ? AND bowling_team = ?) OR (batting_team = ? AND bowling_team = ?)
        GROUP BY striker, batting_team
        ORDER BY runs DESC
        LIMIT 4
    """
    tb_rows = con.execute(top_batter_query, [t1_name, t2_name, t2_name, t1_name]).fetchall()
    top_batters = []
    for tb in tb_rows:
        balls = tb[4] or 1
        runs = tb[2] or 0
        top_batters.append({
            "player": tb[0],
            "team": tb[1],
            "runs": runs,
            "matches": tb[3],
            "strike_rate": round(runs * 100.0 / balls, 1)
        })

    top_bowler_query = """
        SELECT bowler, bowling_team,
               COUNT(CASE WHEN is_wicket = 1 AND dismissal_kind NOT IN ('run out', 'retired hurt') THEN 1 END) as wkts,
               COUNT(DISTINCT match_id) as matches,
               COUNT(CASE WHEN is_legal_ball THEN 1 END) as balls,
               SUM(runs_off_bat + extras) as runs_conceded
        FROM fact_deliveries
        WHERE (bowling_team = ? AND batting_team = ?) OR (bowling_team = ? AND batting_team = ?)
        GROUP BY bowler, bowling_team
        ORDER BY wkts DESC
        LIMIT 4
    """
    tbowl_rows = con.execute(top_bowler_query, [t1_name, t2_name, t2_name, t1_name]).fetchall()
    top_bowlers = []
    for tbow in tbowl_rows:
        balls = tbow[4] or 1
        runs = tbow[5] or 0
        top_bowlers.append({
            "player": tbow[0],
            "team": tbow[1],
            "wickets": tbow[2],
            "matches": tbow[3],
            "economy": round(runs * 6.0 / balls, 2)
        })

    # 4. Recent Encounters
    recent_query = """
        SELECT match_id, match_date, season, venue, team1, team2,
               innings1_score, innings1_wickets, innings2_score, innings2_wickets, match_winner
        FROM dim_matches
        WHERE (team1 = ? AND team2 = ?) OR (team1 = ? AND team2 = ?)
        ORDER BY match_date DESC
        LIMIT 6
    """
    rec_rows = con.execute(recent_query, [t1_name, t2_name, t2_name, t1_name]).fetchall()
    recent_matches = []
    for r in rec_rows:
        recent_matches.append({
            "match_id": str(r[0]),
            "match_date": str(r[1]),
            "season": str(r[2]),
            "venue": r[3],
            "team1": r[4],
            "team2": r[5],
            "innings1": f"{r[6]}/{r[7]}",
            "innings2": f"{r[8]}/{r[9]}",
            "winner": r[10]
        })

    con.close()

    rivalry_title = f"{meta1['short']} vs {meta2['short']}"
    if total_clashes >= 30:
        derby_name = "El Clásico of the IPL" if (t1_id in ["CSK", "MI"] and t2_id in ["CSK", "MI"]) else "Blockbuster Marquee Derby"
    else:
        derby_name = "High-Stakes Franchise Showdown"

    return {
        "team1": {
            "id": t1_id,
            "name": meta1["name"],
            "short": meta1["short"],
            "primary_color": meta1["primary_color"],
            "wins": t1_wins,
            "win_pct": t1_win_pct,
            "max_score": t1_max,
            "min_score": t1_min
        },
        "team2": {
            "id": t2_id,
            "name": meta2["name"],
            "short": meta2["short"],
            "primary_color": meta2["primary_color"],
            "wins": t2_wins,
            "win_pct": t2_win_pct,
            "max_score": t2_max,
            "min_score": t2_min
        },
        "total_clashes": total_clashes,
        "ties_no_result": ties,
        "avg_1st_innings": avg_1st_innings,
        "derby_name": derby_name,
        "rivalry_title": rivalry_title,
        "venue_splits": venue_splits,
        "top_batters": top_batters,
        "top_bowlers": top_bowlers,
        "recent_matches": recent_matches
    }


def get_rivalry_matrix(db_path: str = DEFAULT_DB_PATH) -> Dict[str, Any]:
    """Generate 10x10 team rivalry summary grid using a single vectorized DuckDB query."""
    global _RIVALRY_MATRIX_CACHE
    if _RIVALRY_MATRIX_CACHE is not None:
        return _RIVALRY_MATRIX_CACHE

    con = get_readonly_connection(db_path)
    teams_list = list(ACTIVE_FRANCHISES.keys())
    grid = {t1: {t2: {"matches": 0, "t1_wins": 0, "t2_wins": 0} for t2 in teams_list} for t1 in teams_list}

    # Execute single grouped aggregation across all matches
    rows = con.execute("""
        SELECT team1, team2, match_winner, COUNT(*) as cnt
        FROM dim_matches
        WHERE team1 IS NOT NULL AND team2 IS NOT NULL
        GROUP BY team1, team2, match_winner
    """).fetchall()

    for t1, t2, winner, cnt in rows:
        f1 = get_franchise_id_by_name(t1)
        f2 = get_franchise_id_by_name(t2)
        if not f1 or not f2 or f1 == f2:
            continue

        fw = get_franchise_id_by_name(winner) if winner else None
        grid[f1][f2]["matches"] += cnt
        grid[f2][f1]["matches"] += cnt

        if fw == f1:
            grid[f1][f2]["t1_wins"] += cnt
            grid[f2][f1]["t2_wins"] += cnt
        elif fw == f2:
            grid[f1][f2]["t2_wins"] += cnt
            grid[f2][f1]["t1_wins"] += cnt

    result = {
        "teams": [
            {
                "id": fid,
                "short": ACTIVE_FRANCHISES[fid]["short"],
                "name": ACTIVE_FRANCHISES[fid]["name"],
                "color": ACTIVE_FRANCHISES[fid]["primary_color"]
            }
            for fid in teams_list
        ],
        "grid": grid
    }
    _RIVALRY_MATRIX_CACHE = result
    return result


def simulate_playing_xi_clash(
    team1_id: str,
    team1_lineup: List[str],
    team1_impact_sub: Optional[str],
    team2_id: str,
    team2_lineup: List[str],
    team2_impact_sub: Optional[str],
    venue_id: str = "wankhede",
    db_path: str = DEFAULT_DB_PATH
) -> Dict[str, Any]:
    """Simulate tactical match between two custom Playing XIs with IPL Impact Player rule."""
    t1_id = team1_id.upper()
    t2_id = team2_id.upper()
    if t1_id not in ACTIVE_FRANCHISES or t2_id not in ACTIVE_FRANCHISES:
        raise ValueError("Invalid team ID provided.")

    meta1 = ACTIVE_FRANCHISES[t1_id]
    meta2 = ACTIVE_FRANCHISES[t2_id]

    con = get_readonly_connection(db_path)

    def evaluate_lineup(players: List[str], impact_player: Optional[str]):
        all_selected = list(players)
        if impact_player and impact_player not in all_selected:
            all_selected.append(impact_player)

        placeholders = ", ".join(["?" for _ in all_selected])
        query = f"""
            SELECT
                p.player_name,
                COALESCE(p.total_runs, 0) as runs,
                COALESCE(p.strike_rate, 125.0) as strike_rate,
                COALESCE(p.total_wickets, 0) as wickets,
                COALESCE(p.economy, 8.5) as economy
            FROM dim_players p
            WHERE p.player_name IN ({placeholders})
        """
        rows = con.execute(query, all_selected).fetchall() if all_selected else []
        p_map = {r[0]: {"runs": r[1], "sr": r[2], "wkts": r[3], "econ": r[4]} for r in rows}

        for p in all_selected:
            if p not in p_map:
                p_map[p] = {"runs": 100, "sr": 125.0, "wkts": 5, "econ": 8.5}

        overseas_count = sum(1 for p in players if p.lower() in KNOWN_OVERSEAS)
        wk_count = sum(1 for p in players if p.lower() in KNOWN_WICKET_KEEPERS)
        bowling_options = sum(1 for p in players if p_map[p]["wkts"] >= 5)

        # Radar Dimensions (0 - 100)
        top3 = players[:3]
        top3_sr = float(np.mean([p_map[p]["sr"] for p in top3])) if top3 else 125.0
        top_order_firepower = min(max((top3_sr - 110.0) / 45.0 * 100.0, 30.0), 98.0)

        mid_players = players[3:7]
        mid_runs = float(np.mean([p_map[p]["runs"] for p in mid_players])) if mid_players else 800.0
        middle_stability = min(max((mid_runs - 400.0) / 3000.0 * 100.0, 35.0), 98.0)

        fin_players = players[5:8]
        fin_sr = float(np.mean([p_map[p]["sr"] for p in fin_players])) if fin_players else 130.0
        death_finishing = min(max((fin_sr - 115.0) / 55.0 * 100.0, 30.0), 99.0)

        bowlers = [p for p in players if p_map[p]["wkts"] >= 15]
        if not bowlers:
            bowlers = players[-4:]
        avg_econ = float(np.mean([p_map[p]["econ"] for p in bowlers])) if bowlers else 8.5
        total_wkts = sum(p_map[p]["wkts"] for p in bowlers)

        pace_threat = min(max((10.0 - avg_econ) / 3.0 * 70.0 + min(total_wkts / 300.0 * 30.0, 30.0), 30.0), 98.0)
        death_bowling = min(max((9.5 - avg_econ) / 2.5 * 60.0 + (death_finishing * 0.3), 35.0), 98.0)

        spinners = [p for p in bowlers if any(s in p.lower() for s in ["chahal", "ashwin", "narine", "rashid", "jadeja", "chawla", "kuldeep", "bishnoi", "santner", "varun"])]
        spin_choke = 88.0 if len(spinners) >= 2 else (72.0 if len(spinners) == 1 else 48.0)

        impact_boost = 0.0
        if impact_player:
            imp_stats = p_map.get(impact_player, {"runs": 100, "sr": 125.0, "wkts": 5, "econ": 8.5})
            if imp_stats["runs"] >= 1000 or imp_stats["sr"] >= 140.0:
                impact_boost = 6.0
            elif imp_stats["wkts"] >= 30:
                impact_boost = 5.0

        return {
            "overseas_count": overseas_count,
            "wk_count": wk_count,
            "bowling_options": bowling_options,
            "radar": {
                "top_order": round(top_order_firepower, 1),
                "middle_order": round(middle_stability, 1),
                "death_finishing": round(death_finishing, 1),
                "pace_threat": round(pace_threat, 1),
                "spin_choke": round(spin_choke, 1),
                "death_bowling": round(death_bowling, 1)
            },
            "composite_rating": round(float(np.mean([top_order_firepower, middle_stability, death_finishing, pace_threat, spin_choke, death_bowling])) + impact_boost, 1)
        }

    eval1 = evaluate_lineup(team1_lineup, team1_impact_sub)
    eval2 = evaluate_lineup(team2_lineup, team2_impact_sub)

    con.close()

    venue_par = 172
    if venue_id in ["chinnaswamy", "wankhede", "eden"]:
        venue_par = 186
    elif venue_id in ["chidambaram", "ekana"]:
        venue_par = 162

    r1 = eval1["composite_rating"]
    r2 = eval2["composite_rating"]
    diff = r1 - r2

    p1 = 1.0 / (1.0 + np.exp(-diff / 14.0))
    p2 = 1.0 - p1

    t1_prob = round(p1 * 100.0, 1)
    t2_prob = round(p2 * 100.0, 1)

    t1_score = int(np.round(venue_par + (r1 - 65.0) * 0.45))
    t2_score = int(np.round(venue_par + (r2 - 65.0) * 0.45))

    pp_winner = meta1["short"] if eval1["radar"]["top_order"] >= eval2["radar"]["top_order"] else meta2["short"]
    mid_winner = meta1["short"] if eval1["radar"]["middle_order"] >= eval2["radar"]["middle_order"] else meta2["short"]
    death_winner = meta1["short"] if (eval1["radar"]["death_finishing"] + eval1["radar"]["death_bowling"]) >= (eval2["radar"]["death_finishing"] + eval2["radar"]["death_bowling"]) else meta2["short"]

    verdict = (
        f"{meta1['short']} holds a {t1_prob}% tactical win probability edge over {meta2['short']} at {venue_id.title()}. "
        f"Key differentiator: {meta1['short'] if diff >= 0 else meta2['short']} possesses superior depth in the "
        f"{'Death Overs' if abs(eval1['radar']['death_finishing'] - eval2['radar']['death_finishing']) > 8 else 'Top-Order Firepower'}."
    )

    return {
        "team1": {
            "id": t1_id,
            "name": meta1["name"],
            "short": meta1["short"],
            "primary_color": meta1["primary_color"],
            "win_probability": t1_prob,
            "projected_score": f"{t1_score} ± 14",
            "composite_rating": eval1["composite_rating"],
            "radar": eval1["radar"],
            "overseas_count": eval1["overseas_count"],
            "wk_count": eval1["wk_count"],
            "bowling_options": eval1["bowling_options"],
            "impact_sub": team1_impact_sub,
            "is_valid_ipl_rules": eval1["overseas_count"] <= 4 and eval1["wk_count"] >= 1 and eval1["bowling_options"] >= 5
        },
        "team2": {
            "id": t2_id,
            "name": meta2["name"],
            "short": meta2["short"],
            "primary_color": meta2["primary_color"],
            "win_probability": t2_prob,
            "projected_score": f"{t2_score} ± 14",
            "composite_rating": eval2["composite_rating"],
            "radar": eval2["radar"],
            "overseas_count": eval2["overseas_count"],
            "wk_count": eval2["wk_count"],
            "bowling_options": eval2["bowling_options"],
            "impact_sub": team2_impact_sub,
            "is_valid_ipl_rules": eval2["overseas_count"] <= 4 and eval2["wk_count"] >= 1 and eval2["bowling_options"] >= 5
        },
        "venue": venue_id,
        "phase_battle": {
            "powerplay": pp_winner,
            "middle": mid_winner,
            "death": death_winner
        },
        "tactical_verdict": verdict
    }


def get_auction_targets(franchise_id: str, db_path: str = DEFAULT_DB_PATH) -> Dict[str, Any]:
    """Retrieve mega-auction player pool with Expected Auction Valuation (EAV) and squad purse status."""
    fid = franchise_id.upper()
    if fid not in ACTIVE_FRANCHISES:
        raise ValueError("Invalid franchise ID.")

    meta = ACTIVE_FRANCHISES[fid]
    con = get_readonly_connection(db_path)

    query = """
        SELECT
            player_name,
            total_runs,
            strike_rate,
            total_wickets,
            economy,
            matches_played
        FROM dim_players
        WHERE matches_played >= 12
        ORDER BY (total_runs + total_wickets * 28) DESC
        LIMIT 60
    """
    rows = con.execute(query).fetchall()
    con.close()

    players = []
    for r in rows:
        name = r[0]
        p_lower = name.lower()
        runs = r[1] or 0
        sr = r[2] or 120.0
        wkts = r[3] or 0
        econ = r[4] or 8.5
        matches = r[5] or 0

        is_overseas = p_lower in KNOWN_OVERSEAS
        is_wk = p_lower in KNOWN_WICKET_KEEPERS

        if is_wk:
            role = "Wicket-Keeper"
        elif runs >= 600 and wkts >= 15:
            role = "All-Rounder"
        elif wkts >= 20:
            role = "Bowler"
        else:
            role = "Batter"

        base = 1.0
        val = base + min(runs / 450.0, 9.0) * (sr / 130.0) + min(wkts / 14.0, 8.5) * (8.5 / max(econ, 6.0))
        if role == "All-Rounder":
            val += 2.5
        if is_wk:
            val += 1.5
        eav = round(min(max(val, 0.75), 22.0), 2)

        tier = "Marquee" if eav >= 12.0 else ("Gold" if eav >= 6.0 else "Value")

        players.append({
            "name": name,
            "role": role,
            "is_overseas": is_overseas,
            "is_wicket_keeper": is_wk,
            "matches": matches,
            "runs": runs,
            "strike_rate": sr,
            "wickets": wkts,
            "economy": econ,
            "expected_auction_price_cr": eav,
            "tier": tier
        })

    return {
        "franchise": meta["name"],
        "short": meta["short"],
        "total_purse_cr": 120.0,
        "available_purse_cr": 38.5,
        "squad_size_limit": 25,
        "current_squad_size": 18,
        "max_overseas": 8,
        "current_overseas": 5,
        "recommended_targets": players[:15],
        "auction_pool": players
    }
