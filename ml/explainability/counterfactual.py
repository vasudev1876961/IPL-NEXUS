"""Counterfactual Explanations and Sensitivity Analysis Engine.

Answers:
- "What if the team loses a wicket now?"
- "What if the next over yields 14 runs?"
- "How does win probability respond to changes in Required Run Rate?"
"""

from typing import Dict, Any, List
import numpy as np


def generate_counterfactuals(
    predict_fn,
    current_state: Dict[str, float]
) -> Dict[str, Any]:
    """Generate sensitivity and counterfactual explanations for the current match state."""
    base_state = current_state.copy()
    base_prob = predict_fn(base_state)

    # 1. Counterfactual: What if a wicket falls on the very next ball?
    wicket_state = base_state.copy()
    wicket_state["current_wickets"] = min(10, wicket_state.get("current_wickets", 0) + 1)
    # Increase pressure due to wicket
    wicket_state["pressure_index"] = min(99.0, wicket_state.get("pressure_index", 50.0) + 12.0)
    prob_after_wicket = predict_fn(wicket_state)
    wicket_impact = round(prob_after_wicket - base_prob, 1)

    # 2. Counterfactual: What if the next over yields a big over (14 runs)?
    big_over_state = base_state.copy()
    big_over_state["over_num"] = min(19, big_over_state.get("over_num", 0) + 1)
    big_over_state["current_score"] = big_over_state.get("current_score", 0) + 14
    big_over_state["balls_remaining"] = max(0, big_over_state.get("balls_remaining", 120) - 6)
    if big_over_state.get("innings", 1) == 2:
        big_over_state["runs_needed"] = max(0, big_over_state.get("runs_needed", 0) - 14)
        rem_balls = max(1, big_over_state["balls_remaining"])
        big_over_state["required_rr"] = round((big_over_state["runs_needed"] / rem_balls) * 6.0, 2)
    prob_after_14_runs = predict_fn(big_over_state)
    big_over_impact = round(prob_after_14_runs - base_prob, 1)

    # 3. Counterfactual: What if the next over is a maiden / tight over (3 runs)?
    tight_over_state = base_state.copy()
    tight_over_state["over_num"] = min(19, tight_over_state.get("over_num", 0) + 1)
    tight_over_state["current_score"] = tight_over_state.get("current_score", 0) + 3
    tight_over_state["balls_remaining"] = max(0, tight_over_state.get("balls_remaining", 120) - 6)
    if tight_over_state.get("innings", 1) == 2:
        tight_over_state["runs_needed"] = max(0, tight_over_state.get("runs_needed", 0) - 3)
        rem_balls = max(1, tight_over_state["balls_remaining"])
        tight_over_state["required_rr"] = round((tight_over_state["runs_needed"] / rem_balls) * 6.0, 2)
        tight_over_state["pressure_index"] = min(99.0, tight_over_state.get("pressure_index", 50.0) + 10.0)
    prob_after_3_runs = predict_fn(tight_over_state)
    tight_over_impact = round(prob_after_3_runs - base_prob, 1)

    # Synthesize explainable drivers
    wickets_remaining = 10 - int(base_state.get("current_wickets", 0))
    rrr = base_state.get("required_rr", 0.0)
    crr = base_state.get("current_rr", 0.0)

    drivers: List[Dict[str, Any]] = []
    if wickets_remaining >= 6:
        drivers.append({"factor": f"{wickets_remaining} wickets in hand", "effect": "+POSITIVE", "detail": "Deep batting depth cushions risk"})
    elif wickets_remaining <= 3:
        drivers.append({"factor": f"Only {wickets_remaining} wickets remaining", "effect": "-CRITICAL", "detail": "Tailenders exposed, collapse risk elevated"})

    if base_state.get("innings", 1) == 2:
        if rrr <= 7.5:
            drivers.append({"factor": f"Manageable RRR of {rrr:.1f}", "effect": "+FAVORABLE", "detail": "Below baseline T20 scoring rate"})
        elif rrr >= 12.0:
            drivers.append({"factor": f"Steep RRR of {rrr:.1f}", "effect": "-SEVERE", "detail": "Requires multiple boundary strikes every over"})

    return {
        "base_win_probability": round(base_prob, 1),
        "counterfactuals": [
            {
                "scenario": "Loss of 1 Wicket in Next Over",
                "projected_win_prob": round(prob_after_wicket, 1),
                "impact": f"{wicket_impact:+.1f}%",
                "risk_level": "HIGH" if abs(wicket_impact) >= 12.0 else "MODERATE"
            },
            {
                "scenario": "Accelerated Over (+14 Runs)",
                "projected_win_prob": round(prob_after_14_runs, 1),
                "impact": f"{big_over_impact:+.1f}%",
                "risk_level": "FAVORABLE"
            },
            {
                "scenario": "Restricted Over (3 Runs)",
                "projected_win_prob": round(prob_after_3_runs, 1),
                "impact": f"{tight_over_impact:+.1f}%",
                "risk_level": "NEGATIVE"
            }
        ],
        "primary_drivers": drivers
    }
