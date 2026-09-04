"""Real-time Win Predictor inference service with XAI and counterfactuals.

Provides:
- Calibrated match win probabilities
- Confidence scoring
- Primary situational drivers
- Sensitivity counterfactuals ("What if next over yields 14 runs?")
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional

from ml.explainability.counterfactual import generate_counterfactuals

MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models", "calibrated_win_model.joblib")

_model = None


def get_model():
    """Lazy load calibrated model."""
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Train the model first.")
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_win_probability(
    innings: int,
    over_num: int,
    current_score: int,
    current_wickets: int,
    balls_remaining: int,
    target_runs: int = 0,
    current_rr: float = None,
    required_rr: float = None,
    pressure_index: float = 45.0,
    batting_team: str = "Team A",
    bowling_team: str = "Team B",
) -> Dict[str, Any]:
    """Calculate calibrated win probability and counterfactual explanations."""
    model = get_model()

    legal_balls = max(1, 120 - balls_remaining)
    if current_rr is None:
        current_rr = round((current_score / legal_balls) * 6.0, 2)

    runs_needed = max(0, target_runs - current_score) if innings == 2 else 0

    if required_rr is None and innings == 2:
        rem_balls = max(1, balls_remaining)
        required_rr = round((runs_needed / rem_balls) * 6.0, 2)
    elif required_rr is None:
        required_rr = 0.0

    state_dict = {
        "innings": innings,
        "over_num": over_num,
        "current_score": current_score,
        "current_wickets": current_wickets,
        "current_rr": current_rr,
        "balls_remaining": balls_remaining,
        "target_runs": target_runs,
        "runs_needed": runs_needed,
        "required_rr": required_rr,
        "pressure_index": pressure_index,
    }

    feature_cols = [
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

    def _predict_raw(s: Dict[str, float]) -> float:
        row_df = pd.DataFrame([[s.get(c, 0.0) for c in feature_cols]], columns=feature_cols)
        p = model.predict_proba(row_df)[0][1] * 100.0
        return float(p)

    batting_win_prob = round(_predict_raw(state_dict), 1)
    # Clamp bounds cleanly
    batting_win_prob = float(np.clip(batting_win_prob, 1.0, 99.0))
    bowling_win_prob = round(100.0 - batting_win_prob, 1)

    # Counterfactual analysis
    xai = generate_counterfactuals(_predict_raw, state_dict)

    # Confidence calculation: higher as match nears completion or probability is decisive
    decisiveness = abs(batting_win_prob - 50.0) * 2.0
    progress = (120 - balls_remaining) / 120.0 * 50.0
    confidence = float(np.clip(round(50.0 + (decisiveness * 0.3) + progress, 1), 60.0, 96.0))

    return {
        "batting_team": batting_team,
        "bowling_team": bowling_team,
        "batting_win_probability": batting_win_prob,
        "bowling_win_probability": bowling_win_prob,
        "confidence_score": confidence,
        "current_state": {
            "score": f"{current_score}/{current_wickets}",
            "overs": f"{over_num}.{(120 - balls_remaining) % 6}",
            "crr": current_rr,
            "rrr": required_rr if innings == 2 else None,
            "runs_needed": runs_needed if innings == 2 else None,
            "balls_remaining": balls_remaining,
            "pressure_index": round(pressure_index, 1)
        },
        "counterfactuals": xai["counterfactuals"],
        "primary_drivers": xai["primary_drivers"],
        "model_engine": "HistGradientBoosting + Isotonic Calibration"
    }


if __name__ == "__main__":
    res = predict_win_probability(
        innings=2,
        over_num=15,
        current_score=134,
        current_wickets=4,
        balls_remaining=30,
        target_runs=178,
        batting_team="Chennai Super Kings",
        bowling_team="Mumbai Indians"
    )
    print("Inference Result:", res)
