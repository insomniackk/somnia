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

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !password || !confirm) return;
    if (password !== confirm) {
      Alert.alert("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      Alert.alert("Sign up failed", error.message);
    } else {
      router.replace("/(onboarding)");
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
            <View className="mb-10 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-brand-600">
                <Text className="text-4xl">🌙</Text>
              </View>
              <Text className="text-4xl font-black text-gray-900">
                Som<Text className="text-brand-600">nia</Text>
              </Text>
              <Text className="mt-1 text-base text-gray-500">Your perfect roommate is waiting.</Text>
            </View>

            <View className="gap-4">
              {[
                {
                  label: "Email",
                  value: email,
                  set: setEmail,
                  placeholder: "you@university.edu",
                  keyboardType: "email-address" as const,
                  secure: false,
                },
                {
                  label: "Password",
                  value: password,
                  set: setPassword,
                  placeholder: "min 8 characters",
                  keyboardType: "default" as const,
                  secure: true,
                },
                {
                  label: "Confirm password",
                  value: confirm,
                  set: setConfirm,
                  placeholder: "••••••••",
                  keyboardType: "default" as const,
                  secure: true,
                },
              ].map(({ label, value, set, placeholder, keyboardType, secure }) => (
                <View key={label}>
                  <Text className="mb-1.5 text-sm font-semibold text-gray-700">{label}</Text>
                  <TextInput
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-base text-gray-900"
                    value={value}
                    onChangeText={set}
                    placeholder={placeholder}
                    placeholderTextColor="#9ca3af"
                    keyboardType={keyboardType}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={secure}
                  />
                </View>
              ))}

              <TouchableOpacity
                onPress={handleSignup}
                disabled={loading}
                className="mt-2 items-center rounded-2xl bg-brand-600 py-4"
                activeOpacity={0.85}
              >
                <Text className="text-base font-bold text-white">
                  {loading ? "Creating account…" : "Get started"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-8 flex-row items-center justify-center gap-1.5">
              <Text className="text-sm text-gray-500">Already have an account?</Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-bold text-brand-600">Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
