import { View, Text, TouchableOpacity } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <Text style={{ fontSize: 64, fontWeight: "900", color: "#8fbc8f", letterSpacing: -2 }}>
        somnia
      </Text>
      <Text style={{ marginTop: 12, fontSize: 16, color: "#ffffff" }}>
        don't sleep on good roommates.
      </Text>
      <Link href="/(onboarding)" asChild>
        <TouchableOpacity
          style={{ marginTop: 48, width: "100%", alignItems: "center", backgroundColor: "#8fbc8f", borderRadius: 16, paddingVertical: 16 }}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#000000" }}>Get Started</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
