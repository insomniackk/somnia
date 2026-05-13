import { View, Text } from "react-native";
import { Image } from "expo-image";
import type { ProfileWithPreferences } from "@/lib/types";
import { getInitials, formatBudget } from "@/lib/utils";

interface ProfileCardProps {
  profile: ProfileWithPreferences;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const { preferences } = profile;

  return (
    <View className="overflow-hidden rounded-3xl bg-white shadow-sm">
      {/* Photo / Avatar */}
      <View className="h-44 items-center justify-center bg-brand-100">
        {profile.photos?.[0] ? (
          <Image
            source={{ uri: profile.photos[0] }}
            style={{ width: "100%", height: 176 }}
            contentFit="cover"
          />
        ) : (
          <Text className="text-5xl font-black text-brand-200">
            {getInitials(profile.name)}
          </Text>
        )}
      </View>

      <View className="p-4">
        <View className="flex-row items-baseline gap-2">
          <Text className="text-lg font-black text-gray-900">{profile.name}</Text>
          <Text className="text-sm text-gray-500">{profile.age}</Text>
        </View>
        <Text className="mt-0.5 text-sm text-gray-500">
          {profile.school} · {profile.major}
        </Text>

        {preferences && (
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            {preferences.sleep_schedule && (
              <View className="rounded-full bg-brand-50 px-2.5 py-1">
                <Text className="text-xs font-semibold text-brand-700">
                  {preferences.sleep_schedule.replace("_", " ")}
                </Text>
              </View>
            )}
            {preferences.budget_min && preferences.budget_max && (
              <View className="rounded-full bg-green-50 px-2.5 py-1">
                <Text className="text-xs font-semibold text-green-700">
                  {formatBudget(preferences.budget_min, preferences.budget_max)}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
