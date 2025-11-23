
import { MatchState } from "../types";

// Service deprecated.
// AI Coach functionality has been removed as per latest requirements.
// This file is kept as a placeholder to prevent import errors in legacy contexts if any remain.

export const getMatchAnalysis = async (state: MatchState): Promise<string> => {
    return "Analysis module disabled.";
};

export const predictOutcome = async (state: MatchState): Promise<{prediction: string, confidence: number}> => {
    return { prediction: "N/A", confidence: 0 };
}
