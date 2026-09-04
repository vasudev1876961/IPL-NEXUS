"""End-to-End IPL Nexus Data Engineering Pipeline Runner.

Orchestrates:
1. Raw Cricsheet CSV ingestion
2. Cleaning & canonical franchise mapping
3. Situational feature engineering (CRR, RRR, phase, running state)
4. Dynamic Pressure Index calculation
5. Clean Parquet serialization
6. DuckDB Analytical Warehouse population
"""

import os
import time
import logging
import pandas as pd
import numpy as np
import duckdb

from data_pipeline.downloader import download_ipl_dataset, DEFAULT_RAW_DIR, DEFAULT_PROCESSED_DIR
from data_pipeline.cleaner import clean_deliveries
from data_pipeline.feature_engineering import compute_match_features
from data_pipeline.warehouse_loader import load_deliveries_to_duckdb, DEFAULT_DB_PATH
from analytics.pressure import calculate_match_pressure_series

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("IPL-Nexus-Pipeline")


def run_pipeline(
    raw_csv_path: str = None,
    output_parquet: str = None,
    db_path: str = DEFAULT_DB_PATH,
    sample_matches: int = None
) -> str:
    """Run full data engineering pipeline and populate DuckDB warehouse."""
    t0 = time.time()
    logger.info("=== Starting IPL Nexus Data Intelligence Pipeline ===")

    if raw_csv_path is None:
        raw_csv_path = os.path.join(DEFAULT_RAW_DIR, "all_matches.csv")
        if not os.path.exists(raw_csv_path):
            raw_csv_path = download_ipl_dataset()

    if output_parquet is None:
        output_parquet = os.path.join(DEFAULT_PROCESSED_DIR, "deliveries_clean.parquet")

    logger.info(f"Reading raw deliveries from {raw_csv_path}...")
    # Load dataset with proper dtypes
    df = pd.read_csv(
        raw_csv_path,
        low_memory=False,
        dtype={
            "match_id": str,
            "season": str,
            "start_date": str,
            "wides": float,
            "noballs": float,
            "byes": float,
            "legbyes": float,
            "penalty": float,
        }
    )
    logger.info(f"Raw dataset loaded: {len(df):,} deliveries across {df['match_id'].nunique()} matches.")

    if sample_matches is not None and sample_matches > 0:
        unique_matches = df["match_id"].unique()[:sample_matches]
        df = df[df["match_id"].isin(unique_matches)].copy()
        logger.info(f"Subsetting to first {sample_matches} matches for rapid processing.")

    # 1. Cleaning & phase classification
    df = clean_deliveries(df)

    # 2. Situational feature engineering (cumulative scores, wickets, RRR)
    df = compute_match_features(df)

    # 3. Dynamic Pressure Index
    logger.info("Computing situational pressure indices across deliveries...")
    df = calculate_match_pressure_series(df)

    # 4. Populate DuckDB Analytical Warehouse & export high-performance Parquet
    load_deliveries_to_duckdb(df, db_path=db_path)

    os.makedirs(os.path.dirname(output_parquet), exist_ok=True)
    con = duckdb.connect(db_path)
    parquet_path_sql = output_parquet.replace('\\', '/')
    con.execute(f"COPY fact_deliveries TO '{parquet_path_sql}' (FORMAT PARQUET)")
    con.close()
    logger.info(f"Saved processed deliveries to {output_parquet} ({os.path.getsize(output_parquet) / 1024 / 1024:.2f} MB)")

    elapsed = time.time() - t0
    logger.info(f"=== Pipeline completed successfully in {elapsed:.1f}s! ===")
    return output_parquet


if __name__ == "__main__":
    run_pipeline()
