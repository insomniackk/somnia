import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { formatRelativeTime } from "@/lib/utils";
import type { Message } from "@/lib/types";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) { router.replace("/(auth)/login"); return; }
      setCurrentUserId(user.id);

      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });

      setMessages(data ?? []);
      setLoading(false);

      // Realtime subscription
      channel = supabase
        .channel(`conversation:${id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as Message]);
          },
        )
        .subscribe();
    }

    init();
    return () => { channel?.unsubscribe(); };
  }, [id]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim() || !currentUserId || sending) return;
    setSending(true);
    await supabase.from("messages").insert({
      conversation_id: id,
      sender_id: currentUserId,
      content: newMessage.trim(),
    });
    setNewMessage("");
    setSending(false);
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator color="#7c3aed" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-gray-100 px-4 py-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-base font-bold text-gray-900">Conversation</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 12, gap: 8 }}
          renderItem={({ item }) => {
            const isOwn = item.sender_id === currentUserId;
            return (
              <View className={`flex-row ${isOwn ? "justify-end" : "justify-start"}`}>
                <View className="max-w-[75%]">
                  <View
                    className={`rounded-2xl px-4 py-2.5 ${
                      isOwn
                        ? "rounded-br-sm bg-brand-600"
                        : "rounded-bl-sm bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-sm leading-5 ${isOwn ? "text-white" : "text-gray-800"}`}
                    >
                      {item.content}
                    </Text>
                  </View>
                  <Text
                    className={`mt-1 text-xs text-gray-400 ${isOwn ? "text-right" : ""}`}
                  >
                    {formatRelativeTime(item.created_at)}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-4xl">👋</Text>
              <Text className="mt-2 text-sm text-gray-400">Say hello!</Text>
            </View>
          )}
        />

        {/* Input */}
        <View className="flex-row items-center gap-3 border-t border-gray-100 px-4 py-3">
          <TextInput
            className="flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message…"
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`h-11 w-11 items-center justify-center rounded-2xl ${
              newMessage.trim() ? "bg-brand-600" : "bg-gray-200"
            }`}
          >
            <Ionicons
              name="send"
              size={18}
              color={newMessage.trim() ? "white" : "#9ca3af"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
