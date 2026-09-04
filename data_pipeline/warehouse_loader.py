"""DuckDB Analytical Data Warehouse Loader for IPL Nexus.

Creates star-schema tables for ultra-fast analytical queries, ML training,
and real-time live match state reconstruction.
"""

import os
import duckdb
import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "ipl_nexus.duckdb")


def get_db_connection(db_path: str = DEFAULT_DB_PATH) -> duckdb.DuckDBPyConnection:
    """Return a DuckDB connection to the local database file."""
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    return duckdb.connect(db_path)


def load_deliveries_to_duckdb(deliveries_df: pd.DataFrame, db_path: str = DEFAULT_DB_PATH) -> None:
    """Build dimensions and fact tables inside DuckDB from deliveries DataFrame."""
    logger.info(f"Connecting to DuckDB at {db_path}...")
    conn = get_db_connection(db_path)

    # Register delivery DataFrame in DuckDB
    conn.register("df_deliveries", deliveries_df)

    logger.info("Creating table: fact_deliveries...")
    conn.execute("""
        CREATE OR REPLACE TABLE fact_deliveries AS
        SELECT
            CAST(match_id AS VARCHAR) AS match_id,
            CAST(season AS VARCHAR) AS season,
            CAST(start_date AS VARCHAR) AS match_date,
            venue,
            CAST(innings AS INTEGER) AS innings,
            CAST(ball AS DOUBLE) AS ball,
            CAST(over_num AS INTEGER) AS over_num,
            CAST(ball_in_over AS INTEGER) AS ball_in_over,
            phase,
            batting_team,
            bowling_team,
            striker,
            non_striker,
            bowler,
            CAST(runs_off_bat AS INTEGER) AS runs_off_bat,
            CAST(extras AS INTEGER) AS extras,
            CAST(total_runs AS INTEGER) AS total_runs,
            is_wicket,
            dismissal_kind,
            player_dismissed,
            is_legal_ball,
            is_dot,
            is_four,
            is_six,
            is_boundary,
            CAST(current_score AS INTEGER) AS current_score,
            CAST(current_wickets AS INTEGER) AS current_wickets,
            CAST(legal_balls_bowled AS INTEGER) AS legal_balls_bowled,
            CAST(overs_completed AS DOUBLE) AS overs_completed,
            CAST(balls_remaining AS INTEGER) AS balls_remaining,
            CAST(current_rr AS DOUBLE) AS current_rr,
            CAST(target_runs AS INTEGER) AS target_runs,
            CAST(runs_needed AS INTEGER) AS runs_needed,
            CAST(required_rr AS DOUBLE) AS required_rr,
            CAST(pressure_index AS DOUBLE) AS pressure_index
        FROM df_deliveries
    """)

    logger.info("Creating table: dim_matches...")
    conn.execute("""
        CREATE OR REPLACE TABLE dim_matches AS
        WITH match_aggregates AS (
            SELECT
                match_id,
                MIN(match_date) AS match_date,
                MIN(season) AS season,
                MIN(venue) AS venue,
                FIRST(batting_team) AS team1,
                FIRST(bowling_team) AS team2,
                MAX(CASE WHEN innings = 1 THEN current_score ELSE 0 END) AS innings1_score,
                MAX(CASE WHEN innings = 1 THEN current_wickets ELSE 0 END) AS innings1_wickets,
                MAX(CASE WHEN innings = 2 THEN current_score ELSE 0 END) AS innings2_score,
                MAX(CASE WHEN innings = 2 THEN current_wickets ELSE 0 END) AS innings2_wickets
            FROM fact_deliveries
            GROUP BY match_id
        )
        SELECT
            m.*,
            CASE
                WHEN innings2_score >= (innings1_score + 1) THEN team2
                WHEN innings2_score < innings1_score AND innings1_score > 0 THEN team1
                ELSE 'Tie/No Result'
            END AS match_winner
        FROM match_aggregates m
    """)

    logger.info("Creating table: dim_players...")
    conn.execute("""
        CREATE OR REPLACE TABLE dim_players AS
        WITH batting_stats AS (
            SELECT
                striker AS player_name,
                COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls_faced,
                SUM(runs_off_bat) AS total_runs,
                COUNT(CASE WHEN is_four THEN 1 END) AS total_fours,
                COUNT(CASE WHEN is_six THEN 1 END) AS total_sixes,
                COUNT(CASE WHEN is_dot THEN 1 END) AS total_dots,
                COUNT(DISTINCT match_id) AS matches_batted
            FROM fact_deliveries
            GROUP BY striker
        ),
        bowling_stats AS (
            SELECT
                bowler AS player_name,
                COUNT(CASE WHEN is_legal_ball THEN 1 END) AS balls_bowled,
                SUM(total_runs) AS runs_conceded,
                COUNT(CASE WHEN is_wicket AND dismissal_kind NOT IN ('run out', 'retired hurt', 'obstructing the field') THEN 1 END) AS total_wickets,
                COUNT(CASE WHEN is_dot THEN 1 END) AS total_dot_balls_bowled,
                COUNT(DISTINCT match_id) AS matches_bowled
            FROM fact_deliveries
            GROUP BY bowler
        )
        SELECT
            COALESCE(b.player_name, bo.player_name) AS player_name,
            COALESCE(b.total_runs, 0) AS total_runs,
            COALESCE(b.balls_faced, 0) AS balls_faced,
            ROUND(CASE WHEN b.balls_faced > 0 THEN (b.total_runs * 100.0 / b.balls_faced) ELSE 0 END, 2) AS strike_rate,
            COALESCE(b.total_fours, 0) AS total_fours,
            COALESCE(b.total_sixes, 0) AS total_sixes,
            COALESCE(bo.total_wickets, 0) AS total_wickets,
            COALESCE(bo.balls_bowled, 0) AS balls_bowled,
            ROUND(CASE WHEN bo.balls_bowled > 0 THEN (bo.runs_conceded * 6.0 / bo.balls_bowled) ELSE 0 END, 2) AS economy,
            ROUND(CASE WHEN bo.total_wickets > 0 THEN (bo.runs_conceded * 1.0 / bo.total_wickets) ELSE 0 END, 2) AS bowling_average,
            GREATEST(COALESCE(b.matches_batted, 0), COALESCE(bo.matches_bowled, 0)) AS matches_played
        FROM batting_stats b
        FULL OUTER JOIN bowling_stats bo ON b.player_name = bo.player_name
    """)

    logger.info("Creating table: dim_venues...")
    conn.execute("""
        CREATE OR REPLACE TABLE dim_venues AS
        SELECT
            venue,
            COUNT(DISTINCT match_id) AS total_matches,
            ROUND(AVG(CASE WHEN innings = 1 AND over_num >= 18 THEN current_score END), 1) AS avg_1st_innings_score,
            ROUND(COUNT(CASE WHEN innings = 2 AND runs_needed = 0 THEN 1 END) * 100.0 / NULLIF(COUNT(DISTINCT match_id), 0), 1) AS chase_win_pct
        FROM fact_deliveries
        GROUP BY venue
        HAVING total_matches >= 3
    """)

    conn.close()
    logger.info("DuckDB Analytical Warehouse loaded successfully.")


if __name__ == "__main__":
    pass
