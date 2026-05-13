import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert("Sign in failed", error.message);
    } else {
      router.replace("/(app)/swipe");
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-12">
            {/* Logo */}
            <View className="mb-10 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-brand-600">
                <Text className="text-4xl">🌙</Text>
              </View>
              <Text className="text-4xl font-black text-gray-900">
                Som<Text className="text-brand-600">nia</Text>
              </Text>
              <Text className="mt-1 text-base text-gray-500">
                Don&apos;t sleep on good roommates.
              </Text>
            </View>

            {/* Form */}
            <View className="gap-4">
              <View>
                <Text className="mb-1.5 text-sm font-semibold text-gray-700">Email</Text>
                <TextInput
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@university.edu"
                  placeholderTextColor="#9ca3af"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View>
                <Text className="mb-1.5 text-sm font-semibold text-gray-700">Password</Text>
                <TextInput
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className="mt-2 items-center rounded-2xl bg-brand-600 py-4"
                activeOpacity={0.85}
              >
                <Text className="text-base font-bold text-white">
                  {loading ? "Signing in…" : "Sign in"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-8 flex-row items-center justify-center gap-1.5">
              <Text className="text-sm text-gray-500">No account?</Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-bold text-brand-600">Create one</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
