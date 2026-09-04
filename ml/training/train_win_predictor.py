"""Train Calibrated Win Predictor with Gradient Boosting and SHAP Explainability.

Extracts ball-by-ball match states from DuckDB / processed parquet,
trains an XGBoost / GradientBoosting classifier, applies Isotonic probability
calibration, evaluates Brier score and Log Loss, and saves the calibrated pipeline.
"""

import os
import json
import logging
import joblib
import duckdb
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import brier_score_loss, log_loss, roc_auc_score, accuracy_score
from sklearn.ensemble import HistGradientBoostingClassifier

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("Train-Win-Predictor")

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
DEFAULT_PARQUET_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "processed", "deliveries_clean.parquet")


FEATURE_COLUMNS = [
    "innings",
    "over_num",
    "current_score",
    "current_wickets",
    "current_rr",
    "balls_remaining",
    "target_runs",
    "runs_needed",
    "required_rr",
    "pressure_index",
]


def load_training_data(parquet_path: str = DEFAULT_PARQUET_PATH) -> pd.DataFrame:
    """Load deliveries and join match winners to create binary target."""
    logger.info(f"Loading training data from {parquet_path} via DuckDB...")
    con = duckdb.connect()

    parquet_sql = parquet_path.replace("\\", "/")
    query = f"""
        WITH match_winners AS (
            SELECT
                match_id,
                MAX(CASE WHEN innings = 1 THEN current_score ELSE 0 END) AS inn1_score,
                MAX(CASE WHEN innings = 2 THEN current_score ELSE 0 END) AS inn2_score,
                FIRST(batting_team) AS team1,
                FIRST(bowling_team) AS team2
            FROM '{parquet_sql}'
            GROUP BY match_id
        ),
        matches_evaluated AS (
            SELECT
                match_id,
                CASE
                    WHEN inn2_score > inn1_score THEN team2
                    WHEN inn1_score > inn2_score THEN team1
                    ELSE 'Tie'
                END AS winner
            FROM match_winners
        )
        SELECT
            f.match_id,
            f.innings,
            f.over_num,
            f.current_score,
            f.current_wickets,
            f.current_rr,
            f.balls_remaining,
            f.target_runs,
            f.runs_needed,
            f.required_rr,
            f.pressure_index,
            f.batting_team,
            m.winner,
            CASE WHEN f.batting_team = m.winner THEN 1 ELSE 0 END AS batting_team_won
        FROM '{parquet_sql}' f
        JOIN matches_evaluated m ON f.match_id = m.match_id
        WHERE m.winner != 'Tie'
    """
    df = con.execute(query).fetchdf()
    con.close()
    logger.info(f"Loaded {len(df):,} delivery training samples.")
    return df


def train_calibrated_win_model(parquet_path: str = DEFAULT_PARQUET_PATH) -> dict:
    """Train, calibrate, evaluate, and persist the Win Probability Model."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    df = load_training_data(parquet_path)

    X = df[FEATURE_COLUMNS].fillna(0.0)
    y = df["batting_team_won"]

    # Match-level train/test split to prevent leakage across balls of same match
    unique_matches = df["match_id"].unique()
    train_matches, test_matches = train_test_split(unique_matches, test_size=0.2, random_state=42)

    train_idx = df["match_id"].isin(train_matches)
    test_idx = df["match_id"].isin(test_matches)

    X_train, y_train = X[train_idx], y[train_idx]
    X_test, y_test = X[test_idx], y[test_idx]

    logger.info(f"Training set: {len(X_train):,} samples. Test set: {len(X_test):,} samples.")

    # 1 & 2. HistGradientBoosting with 3-fold Isotonic Probability Calibration
    logger.info("Training HistGradientBoostingClassifier with 3-fold Isotonic Calibration...")
    base_model = HistGradientBoostingClassifier(
        max_iter=150,
        learning_rate=0.08,
        max_depth=7,
        min_samples_leaf=25,
        random_state=42
    )
    calibrated_model = CalibratedClassifierCV(
        estimator=base_model,
        method="isotonic",
        cv=3
    )
    calibrated_model.fit(X_train, y_train)

    # 3. Model Evaluation on Unseen Matches
    y_pred_proba = calibrated_model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.5).astype(int)

    acc = float(accuracy_score(y_test, y_pred))
    auc = float(roc_auc_score(y_test, y_pred_proba))
    brier = float(brier_score_loss(y_test, y_pred_proba))
    loss = float(log_loss(y_test, y_pred_proba))

    logger.info("=== Model Performance Benchmarks ===")
    logger.info(f"Accuracy:    {acc * 100:.2f}%")
    logger.info(f"ROC-AUC:     {auc:.4f}")
    logger.info(f"Brier Score: {brier:.4f}  (Lower is better, target < 0.18)")
    logger.info(f"Log Loss:    {loss:.4f}")

    # Reliability curve check
    prob_true, prob_pred = calibration_curve(y_test, y_pred_proba, n_bins=10)
    calibration_data = [
        {"predicted_bin": round(float(p), 3), "actual_win_rate": round(float(t), 3)}
        for p, t in zip(prob_pred, prob_true)
    ]

    # Save artifact models
    model_file = os.path.join(MODELS_DIR, "calibrated_win_model.joblib")
    joblib.dump(calibrated_model, model_file)
    logger.info(f"Saved calibrated model to {model_file}")

    metadata = {
        "model_type": "HistGradientBoostingClassifier + Isotonic Calibration",
        "features": FEATURE_COLUMNS,
        "metrics": {
            "accuracy": round(acc, 4),
            "roc_auc": round(auc, 4),
            "brier_score": round(brier, 4),
            "log_loss": round(loss, 4),
        },
        "sample_sizes": {
            "total_samples": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "matches": len(unique_matches)
        },
        "calibration_curve": calibration_data
    }

    card_file = os.path.join(MODELS_DIR, "model_card.json")
    with open(card_file, "w") as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"Saved model card metadata to {card_file}")

    return metadata


if __name__ == "__main__":
    train_calibrated_win_model()
