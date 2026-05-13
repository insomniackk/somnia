import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import type { Message } from "@/lib/types";

interface ConvoItem {
  id: string;
  otherName: string;
  lastMessage: Message | null;
}

export default function MessagesScreen() {
  const router = useRouter();
  const [convos, setConvos] = useState<ConvoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, match_id, matches(user1_id, user2_id)")
      .order("created_at", { ascending: false });

    if (!conversations?.length) {
      setLoading(false);
      return;
    }

    const items: ConvoItem[] = await Promise.all(
      conversations.map(async (c) => {
        const match = Array.isArray(c.matches) ? c.matches[0] : c.matches;
        const otherId =
          match?.user1_id === user.id ? match?.user2_id : match?.user1_id;

        const { data: profile } = await supabase
          .from("profiles")
          .select("name")
          .eq("id", otherId)
          .single();

        const { data: messages } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1);

        return {
          id: c.id,
          otherName: profile?.name ?? "Unknown",
          lastMessage: messages?.[0] ?? null,
        };
      }),
    );

    setConvos(items);
    setLoading(false);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#7c3aed" />
      </SafeAreaView>
    );
  }

  if (!convos.length) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-6xl">💬</Text>
        <Text className="mt-4 text-2xl font-black text-gray-800">No conversations yet</Text>
        <Text className="mt-2 text-center text-base text-gray-500">
          Match with someone and say hello!
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(app)/swipe")}
          className="mt-6 rounded-2xl bg-brand-600 px-6 py-3.5"
        >
          <Text className="font-bold text-white">Start swiping</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 pb-2 pt-5">
        <Text className="text-2xl font-black text-gray-900">Messages</Text>
      </View>

      <FlatList
        data={convos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(app)/messages/${item.id}` as never)}
            className="flex-row items-center gap-4 px-5 py-4"
            activeOpacity={0.7}
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
              <Text className="text-base font-black text-brand-700">
                {getInitials(item.otherName)}
              </Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-gray-900">{item.otherName}</Text>
                {item.lastMessage && (
                  <Text className="text-xs text-gray-400">
                    {formatRelativeTime(item.lastMessage.created_at)}
                  </Text>
                )}
              </View>
              <Text className="mt-0.5 text-sm text-gray-500" numberOfLines={1}>
                {item.lastMessage?.content ?? "Say hello! 👋"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => (
          <View className="mx-5 h-px bg-gray-100" />
        )}
      />
    </SafeAreaView>
  );
}
