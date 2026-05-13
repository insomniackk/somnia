import { View, Text, Dimensions } from "react-native";
import { Image } from "expo-image";
import type { ProfileWithPreferences, CompatibilityResult } from "@/lib/types";
import { getInitials, formatBudget } from "@/lib/utils";

interface SwipeCardProps {
  profile: ProfileWithPreferences & { compatibility: CompatibilityResult };
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

const SLEEP_LABELS: Record<string, string> = {
  early_bird: "🌅 Early bird",
  night_owl: "🦉 Night owl",
  flexible: "😴 Flexible",
};

const NOISE_LABELS: Record<string, string> = {
  quiet: "🤫 Quiet",
  moderate: "🎵 Moderate",
  lively: "🎉 Lively",
};

export default function SwipeCard({ profile }: SwipeCardProps) {
  const { preferences, compatibility } = profile;

  return (
    <View
      style={{ width: CARD_WIDTH }}
      className="overflow-hidden rounded-3xl bg-white shadow-xl"
    >
      {/* Photo / Avatar */}
      <View className="relative h-72 bg-brand-100 items-center justify-center">
        {profile.photos?.[0] ? (
          <Image
            source={{ uri: profile.photos[0] }}
            style={{ width: CARD_WIDTH, height: 288 }}
            contentFit="cover"
          />
        ) : (
          <Text className="text-7xl font-black text-brand-200">
            {getInitials(profile.name)}
          </Text>
        )}

        {/* Compatibility badge */}
        <View className="absolute right-3 top-3 flex-row items-center gap-1 rounded-full bg-white/90 px-3 py-1.5">
          <Text className="text-sm">✨</Text>
          <Text className="text-sm font-black text-brand-700">
            {compatibility.score}% match
          </Text>
        </View>
      </View>

      {/* Info section */}
      <View className="p-5">
        <View className="mb-1 flex-row items-baseline gap-2">
          <Text className="text-xl font-black text-gray-900">{profile.name}</Text>
          <Text className="text-base text-gray-500">{profile.age}</Text>
        </View>

        <Text className="mb-3 text-sm text-gray-500">
          {profile.school} · {profile.major} · {profile.grad_year}
        </Text>

        {/* Preference chips */}
        <View className="flex-row flex-wrap gap-2">
          {preferences.sleep_schedule && (
            <View className="rounded-full bg-brand-50 px-3 py-1">
              <Text className="text-xs font-semibold text-brand-700">
                {SLEEP_LABELS[preferences.sleep_schedule]}
              </Text>
            </View>
          )}
          {preferences.noise_level && (
            <View className="rounded-full bg-indigo-50 px-3 py-1">
              <Text className="text-xs font-semibold text-indigo-700">
                {NOISE_LABELS[preferences.noise_level]}
              </Text>
            </View>
          )}
          {preferences.budget_min && preferences.budget_max && (
            <View className="rounded-full bg-green-50 px-3 py-1">
              <Text className="text-xs font-semibold text-green-700">
                💰 {formatBudget(preferences.budget_min, preferences.budget_max)}
              </Text>
            </View>
          )}
        </View>

        {/* Bio */}
        {!!profile.bio && (
          <Text className="mt-3 text-sm leading-relaxed text-gray-600" numberOfLines={2}>
            {profile.bio}
          </Text>
        )}
      </View>
    </View>
  );
}
