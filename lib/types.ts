// ─── Enums / Union Types ────────────────────────────────────────────────────

export type SleepSchedule = "early_bird" | "night_owl" | "flexible";
export type CleanlinessLevel = 1 | 2 | 3 | 4 | 5;
export type NoisePreference = "quiet" | "moderate" | "lively";
export type GuestPolicy = "rarely" | "occasionally" | "frequently";
export type YesNoOkay = "yes" | "no" | "okay_with_it";
export type StudyHabits = "at_home" | "library" | "mixed";
export type LeaseDuration = "3_months" | "6_months" | "12_months" | "flexible";
export type SwipeDirection = "like" | "pass" | "super_like";

// ─── Database Row Types ──────────────────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  age: number;
  school: string;
  major: string;
  grad_year: number;
  bio: string;
  photos: string[];
  is_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Preferences {
  id: string;
  user_id: string;
  sleep_schedule: SleepSchedule;
  cleanliness: CleanlinessLevel;
  noise_level: NoisePreference;
  guests: GuestPolicy;
  smoking: YesNoOkay;
  drinking: YesNoOkay;
  pets: YesNoOkay;
  study_habits: StudyHabits;
  budget_min: number;
  budget_max: number;
  move_in_date: string;
  lease_duration: LeaseDuration;
  location_preference: string;
  created_at: string;
  updated_at: string;
}

export interface Swipe {
  id: string;
  swiper_id: string;
  swiped_id: string;
  direction: SwipeDirection;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  match_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

// ─── Composite Types ─────────────────────────────────────────────────────────

export interface ProfileWithPreferences extends Profile {
  preferences: Preferences;
}

export interface MatchWithProfile extends Match {
  matched_profile: Profile;
  conversation: Conversation;
  last_message?: Message;
}

// ─── Compatibility ────────────────────────────────────────────────────────────

export interface CompatibilityResult {
  score: number; // 0–100
  breakdown: { category: string; score: number; weight: number }[];
}

// ─── Onboarding Form ─────────────────────────────────────────────────────────

export interface OnboardingData {
  name: string;
  age: number;
  school: string;
  major: string;
  grad_year: number;
  sleep_schedule: SleepSchedule;
  cleanliness: CleanlinessLevel;
  noise_level: NoisePreference;
  study_habits: StudyHabits;
  guests: GuestPolicy;
  smoking: YesNoOkay;
  drinking: YesNoOkay;
  pets: YesNoOkay;
  budget_min: number;
  budget_max: number;
  move_in_date: string;
  lease_duration: LeaseDuration;
  location_preference: string;
}
