import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getInitials } from "@/lib/utils";
import type { Match, Profile, Conversation } from "@/lib/types";

interface MatchItem {
  match: Match;
  profile: Profile;
  conversation: Conversation | null;
}

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rawMatches } = await supabase
      .from("matches")
      .select("*, conversations(id, match_id, created_at)")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (!rawMatches?.length) {
      setLoading(false);
      return;
    }

    const items: MatchItem[] = await Promise.all(
      rawMatches.map(async (m) => {
        const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", otherId)
          .single();
        const convos = Array.isArray(m.conversations) ? m.conversations : [m.conversations];
        return { match: m, profile: profile!, conversation: convos[0] ?? null };
      }),
    );

    setMatches(items);
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#7c3aed" />
      </SafeAreaView>
    );
  }

  if (!matches.length) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-6xl">💜</Text>
        <Text className="mt-4 text-2xl font-black text-gray-800">No matches yet</Text>
        <Text className="mt-2 text-center text-base text-gray-500">
          Keep swiping — when someone likes you back, they&apos;ll show up here.
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(app)/swipe")}
          className="mt-6 rounded-2xl bg-brand-600 px-6 py-3.5"
        >
          <Text className="font-bold text-white">Go discover</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pb-2 pt-5">
        <Text className="text-2xl font-black text-gray-900">
          Matches{" "}
          <Text className="text-brand-600">({matches.length})</Text>
        </Text>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => item.match.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        renderItem={({ item }) => {
          const { match, profile, conversation } = item;
          return (
            <TouchableOpacity
              onPress={() =>
                conversation && router.push(`/(app)/messages/${conversation.id}` as never)
              }
              className="flex-row items-center gap-4 rounded-3xl bg-gray-50 p-4"
              activeOpacity={0.75}
            >
              {/* Avatar */}
              <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
                <Text className="text-xl font-black text-brand-700">
                  {getInitials(profile?.name ?? "?")}
                </Text>
              </View>

              {/* Info */}
              <View className="flex-1">
                <Text className="font-bold text-gray-900">{profile?.name}</Text>
                <Text className="text-sm text-gray-500">
                  {profile?.school} · {profile?.major}
                </Text>
                {/* Compatibility bar */}
                <View className="mt-2 flex-row items-center gap-2">
                  <View className="h-1.5 w-20 rounded-full bg-gray-200">
                    <View
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${match.compatibility_score ?? 0}%` }}
                    />
                  </View>
                  <Text className="text-xs text-gray-400">
                    {match.compatibility_score ?? 0}% match
                  </Text>
                </View>
              </View>

              <Text className="text-brand-400">→</Text>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}
