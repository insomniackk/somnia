import type { CompatibilityResult, Preferences, ProfileWithPreferences } from "./types";

const WEIGHTS = {
  sleep_schedule: 22,
  cleanliness: 20,
  noise_level: 15,
  guests: 12,
  study_habits: 10,
  smoking: 8,
  drinking: 7,
  pets: 6,
} as const;

function scoreSleepSchedule(a: string, b: string): number {
  if (a === b) return 100;
  if (a === "flexible" || b === "flexible") return 70;
  return 10; // early_bird vs night_owl
}

function scoreNumeric(a: number, b: number, range: number): number {
  return Math.max(0, 100 - (Math.abs(a - b) / range) * 100);
}

function scoreCategorical(a: string, b: string, adjacent?: Record<string, string[]>): number {
  if (a === b) return 100;
  if (adjacent?.[a]?.includes(b) || adjacent?.[b]?.includes(a)) return 60;
  return 0;
}

function scoreYesNoOkay(a: string, b: string): number {
  if (a === b) return 100;
  if ((a === "yes" && b === "no") || (a === "no" && b === "yes")) return 0;
  return 60; // okay_with_it bridges hard yes/no
}

export function calculateCompatibility(a: Preferences, b: Preferences): CompatibilityResult {
  const scores = {
    sleep_schedule: scoreSleepSchedule(a.sleep_schedule, b.sleep_schedule),
    cleanliness: scoreNumeric(a.cleanliness, b.cleanliness, 4),
    noise_level: scoreCategorical(a.noise_level, b.noise_level, {
      quiet: ["moderate"],
      moderate: ["quiet", "lively"],
      lively: ["moderate"],
    }),
    guests: scoreCategorical(a.guests, b.guests, {
      rarely: ["occasionally"],
      occasionally: ["rarely", "frequently"],
      frequently: ["occasionally"],
    }),
    study_habits: scoreCategorical(a.study_habits, b.study_habits, {
      at_home: ["mixed"],
      mixed: ["at_home", "library"],
      library: ["mixed"],
    }),
    smoking: scoreYesNoOkay(a.smoking, b.smoking),
    drinking: scoreYesNoOkay(a.drinking, b.drinking),
    pets: scoreYesNoOkay(a.pets, b.pets),
  };

  const totalScore = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce((sum, key) => {
    return sum + (scores[key] * WEIGHTS[key]) / 100;
  }, 0);

  return {
    score: Math.round(totalScore),
    breakdown: (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).map((key) => ({
      category: key,
      score: scores[key],
      weight: WEIGHTS[key],
    })),
  };
}

export function budgetOverlaps(a: Preferences, b: Preferences): boolean {
  return a.budget_min <= b.budget_max && b.budget_min <= a.budget_max;
}

export function rankCandidates(
  currentUser: ProfileWithPreferences,
  candidates: ProfileWithPreferences[],
): (ProfileWithPreferences & { compatibility: CompatibilityResult })[] {
  return candidates
    .filter((c) => budgetOverlaps(currentUser.preferences, c.preferences))
    .map((c) => ({ ...c, compatibility: calculateCompatibility(currentUser.preferences, c.preferences) }))
    .sort((a, b) => b.compatibility.score - a.compatibility.score);
}
