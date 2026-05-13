import { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Alert, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-deck-swiper";
import { supabase } from "@/lib/supabase";
import { rankCandidates } from "@/lib/matching";
import SwipeCard from "@/components/swipe/SwipeCard";
import type { ProfileWithPreferences, CompatibilityResult } from "@/lib/types";
import { useRouter } from "expo-router";

type RankedProfile = ProfileWithPreferences & { compatibility: CompatibilityResult };

const { width } = Dimensions.get("window");

export default function SwipeScreen() {
  const router = useRouter();
  const swiperRef = useRef<Swiper<RankedProfile>>(null);
  const [profiles, setProfiles] = useState<RankedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [matchedName, setMatchedName] = useState<string | null>(null);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("*, preferences(*)")
      .eq("id", user.id)
      .single();

    const { data: swiped } = await supabase
      .from("swipes")
      .select("swiped_id")
      .eq("swiper_id", user.id);

    const excludedIds = [user.id, ...(swiped?.map((s) => s.swiped_id) ?? [])];

    const { data: candidates } = await supabase
      .from("profiles")
      .select("*, preferences(*)")
      .eq("is_onboarded", true)
      .not("id", "in", `(${excludedIds.join(",")})`)
      .limit(20);

    if (currentProfile?.preferences && candidates?.length) {
      const ranked = rankCandidates(
        currentProfile as ProfileWithPreferences,
        candidates as ProfileWithPreferences[],
      );
      setProfiles(ranked);
    }

    setLoading(false);
  }

  async function recordSwipe(
    direction: "like" | "pass" | "super_like",
    cardIndex: number,
  ) {
    if (!currentUserId || !profiles[cardIndex]) return;
    const profile = profiles[cardIndex];

    await supabase
      .from("swipes")
      .insert({ swiper_id: currentUserId, swiped_id: profile.id, direction });

    if (direction !== "pass") {
      // Check for a new match
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(user1_id.eq.${currentUserId},user2_id.eq.${profile.id}),and(user1_id.eq.${profile.id},user2_id.eq.${currentUserId})`,
        )
        .single();

      if (match) {
        setMatchedName(profile.name);
        setTimeout(() => {
          setMatchedName(null);
          router.push("/(app)/matches");
        }, 2200);
      }
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="mt-3 text-sm text-gray-400">Finding roommates…</Text>
      </SafeAreaView>
    );
  }

  if (matchedName) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-7xl">💜</Text>
        <Text className="mt-4 text-3xl font-black text-brand-600">It&apos;s a match!</Text>
        <Text className="mt-2 text-base text-gray-500">You and {matchedName} liked each other</Text>
      </SafeAreaView>
    );
  }

  if (!profiles.length) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-6xl">🌙</Text>
        <Text className="mt-4 text-2xl font-black text-gray-800">All caught up!</Text>
        <Text className="mt-2 text-center text-base text-gray-500">
          You&apos;ve seen everyone nearby. Check back soon!
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Text className="text-2xl font-black text-gray-900">
          Som<Text className="text-brand-600">nia</Text>
        </Text>
        <Text className="text-sm text-gray-400">{profiles.length} nearby</Text>
      </View>

      {/* Swiper */}
      <View className="flex-1 items-center">
        <Swiper
          ref={swiperRef}
          cards={profiles}
          renderCard={(profile) => <SwipeCard profile={profile} />}
          onSwipedRight={(i) => recordSwipe("like", i)}
          onSwipedLeft={(i) => recordSwipe("pass", i)}
          onSwipedTop={(i) => recordSwipe("super_like", i)}
          verticalSwipe
          stackSize={3}
          stackSeparation={12}
          stackScale={4}
          backgroundColor="transparent"
          cardVerticalMargin={0}
          cardHorizontalMargin={16}
          animateOverlayLabelsOpacity
          animateCardOpacity
          swipeBackCard
          overlayLabels={{
            left: {
              title: "PASS",
              style: {
                label: {
                  backgroundColor: "#ef4444",
                  borderColor: "#ef4444",
                  color: "white",
                  borderWidth: 1,
                  fontSize: 18,
                  fontWeight: "900",
                  borderRadius: 8,
                  padding: 8,
                },
                wrapper: {
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "flex-start",
                  marginTop: 24,
                  marginLeft: -20,
                },
              },
            },
            right: {
              title: "LIKE 💜",
              style: {
                label: {
                  backgroundColor: "#22c55e",
                  borderColor: "#22c55e",
                  color: "white",
                  borderWidth: 1,
                  fontSize: 18,
                  fontWeight: "900",
                  borderRadius: 8,
                  padding: 8,
                },
                wrapper: {
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "flex-start",
                  marginTop: 24,
                  marginLeft: 20,
                },
              },
            },
            top: {
              title: "SUPER ⭐",
              style: {
                label: {
                  backgroundColor: "#7c3aed",
                  borderColor: "#7c3aed",
                  color: "white",
                  borderWidth: 1,
                  fontSize: 18,
                  fontWeight: "900",
                  borderRadius: 8,
                  padding: 8,
                },
                wrapper: {
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  marginTop: 24,
                },
              },
            },
          }}
        />
      </View>

      {/* Button row */}
      <View className="flex-row items-center justify-center gap-6 px-6 pb-6">
        <TouchableOpacity
          onPress={() => swiperRef.current?.swipeLeft()}
          className="h-16 w-16 items-center justify-center rounded-full border-2 border-red-200 bg-white shadow-sm"
          activeOpacity={0.8}
        >
          <Text className="text-2xl">✗</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => swiperRef.current?.swipeTop()}
          className="h-14 w-14 items-center justify-center rounded-full border-2 border-brand-200 bg-white shadow-sm"
          activeOpacity={0.8}
        >
          <Text className="text-xl">⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => swiperRef.current?.swipeRight()}
          className="h-16 w-16 items-center justify-center rounded-full border-2 border-green-200 bg-white shadow-sm"
          activeOpacity={0.8}
        >
          <Text className="text-2xl">💜</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
