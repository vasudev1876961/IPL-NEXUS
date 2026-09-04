"""Vectorized Monte Carlo What-If Match Simulator.

Runs 10,000 probabilistic match futures from any live game state to determine
win distributions, expected final scores, and tactical scenario sensitivity.
"""

from typing import Dict, Any, List
import numpy as np


def run_monte_carlo_simulation(
    current_score: int,
    current_wickets: int,
    balls_remaining: int,
    target_runs: int = 0,
    innings: int = 2,
    num_simulations: int = 10000,
    expected_next_over_runs: int = None,
    wicket_in_next_over: bool = False,
    bowling_intensity: str = "medium"  # "high", "medium", "low"
) -> Dict[str, Any]:
    """Execute 10,000 vectorized simulations from current match state."""
    np.random.seed(42)

    # Base delivery outcome distribution for IPL death/middle overs:
    # Outcomes: [0 (dot), 1, 2, 3, 4, 6]
    # Adjust probabilities based on bowling intensity
    if bowling_intensity == "high":
        # Elite bowling: higher dots, lower boundaries, higher wicket probability
        run_outcomes = np.array([0, 1, 2, 4, 6])
        probs = np.array([0.42, 0.36, 0.07, 0.10, 0.05])
        wicket_prob = 0.058
    elif bowling_intensity == "low":
        # Loose bowling / favorable conditions
        run_outcomes = np.array([0, 1, 2, 4, 6])
        probs = np.array([0.28, 0.35, 0.09, 0.18, 0.10])
        wicket_prob = 0.038
    else:
        # Medium / standard T20 baseline
        run_outcomes = np.array([0, 1, 2, 4, 6])
        probs = np.array([0.34, 0.38, 0.08, 0.13, 0.07])
        wicket_prob = 0.046

    # Normalize run probabilities
    probs = probs / probs.sum()

    # If balls_remaining is 0, game is over
    if balls_remaining <= 0:
        win = 100.0 if (innings == 2 and current_score >= target_runs) else 0.0
        return {
            "win_probability": win,
            "expected_final_score": current_score,
            "score_confidence_interval": [current_score, current_score],
            "simulations_count": num_simulations,
            "score_distribution": [{"score": current_score, "frequency": num_simulations}]
        }

    # Vectorized simulation matrix: shape (num_simulations, balls_remaining)
    sim_runs = np.random.choice(run_outcomes, size=(num_simulations, balls_remaining), p=probs)
    sim_wickets = np.random.rand(num_simulations, balls_remaining) < wicket_prob

    # Apply what-if scenario for next 6 balls if specified
    if expected_next_over_runs is not None and balls_remaining >= 6:
        # Distribute expected runs over next 6 balls
        fixed_runs = np.zeros(6, dtype=int)
        for i in range(expected_next_over_runs):
            fixed_runs[i % 6] += 1
        sim_runs[:, :6] = fixed_runs

    if wicket_in_next_over and balls_remaining >= 1:
        sim_wickets[:, 0] = True

    # Accumulate running scores and wickets per simulation path
    cum_runs = np.cumsum(sim_runs, axis=1) + current_score
    cum_wickets = np.cumsum(sim_wickets, axis=1) + current_wickets

    # Handle all-out condition: innings ends if wickets >= 10
    all_out_mask = cum_wickets >= 10
    # For paths that lost 10 wickets, freeze score at the ball the 10th wicket fell
    has_all_out = np.any(all_out_mask, axis=1)

    final_scores = np.zeros(num_simulations, dtype=int)
    for i in range(num_simulations):
        if has_all_out[i]:
            first_all_out_idx = np.argmax(all_out_mask[i])
            final_scores[i] = cum_runs[i, first_all_out_idx]
        else:
            final_scores[i] = cum_runs[i, -1]

    # Calculate metrics
    median_score = int(np.median(final_scores))
    p10 = int(np.percentile(final_scores, 10))
    p90 = int(np.percentile(final_scores, 90))

    if innings == 2 and target_runs > 0:
        wins = np.sum(final_scores >= target_runs)
        win_prob = round((wins / num_simulations) * 100.0, 1)
    else:
        # 1st innings: win probability relative to historical chase defense at median score
        # Historical IPL 1st innings defense curve: 160 is ~50%, 180 is ~70%, 200+ is ~88%
        win_prob = round(float(np.clip((median_score - 130.0) / 70.0 * 100.0, 5.0, 95.0)), 1)

    # Generate histogram for distribution chart (10 bins)
    counts, bin_edges = np.histogram(final_scores, bins=12)
    score_dist = [
        {"score_range": f"{int(bin_edges[i])}-{int(bin_edges[i+1])}", "count": int(counts[i])}
        for i in range(len(counts))
    ]

    return {
        "win_probability": win_prob,
        "expected_final_score": median_score,
        "score_confidence_interval": [p10, p90],
        "simulations_count": num_simulations,
        "score_distribution": score_dist,
        "scenario_applied": {
            "expected_next_over_runs": expected_next_over_runs,
            "wicket_in_next_over": wicket_in_next_over,
            "bowling_intensity": bowling_intensity
        }
    }
