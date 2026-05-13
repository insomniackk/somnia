import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = "#8fbc8f";
const BG = "#0a0a0a";
const INPUT_BG = "#1a1a1a";
const MUTED = "#9ca3af";
const CHIP_TEXT = "#6b7280";
const TRACK = "#1f2937";
const { width: SW } = Dimensions.get("window");

// ─── Types ────────────────────────────────────────────────────────────────────

type LivingSituation = "off-campus" | "dorm" | "";
type EduSub = "question" | "email" | "verified";

interface FormData {
  name: string;
  eduEmail: string;
  livingSituation: LivingSituation;
  age: string;
  major: string;
  minor: string;
  gradYear: string;
  ethnicity: string;
  religion: string;
  alcohol: string;
  smoking: string;
  sleepHabits: string;
  monthlyBudget: string;
  locationPreferences: string[];
}

const INITIAL_DATA: FormData = {
  name: "",
  eduEmail: "",
  livingSituation: "",
  age: "",
  major: "",
  minor: "",
  gradYear: "",
  ethnicity: "",
  religion: "",
  alcohol: "",
  smoking: "",
  sleepHabits: "",
  monthlyBudget: "",
  locationPreferences: [],
};

const BASE_STEPS = [
  "name", "edu", "living", "age", "major", "minor",
  "gradYear", "ethnicity", "religion", "alcohol", "smoking", "sleep",
] as const;

const OFF_CAMPUS_STEPS = ["budget", "location"] as const;
type StepKey = (typeof BASE_STEPS)[number] | (typeof OFF_CAMPUS_STEPS)[number];

const GRAD_YEARS = ["2025", "2026", "2027", "2028", "2029"];

const ETHNICITIES = [
  "Asian", "Black/African American", "Hispanic/Latino", "Middle Eastern",
  "Native American", "Pacific Islander", "White/Caucasian",
  "Mixed/Multiracial", "Other", "Prefer not to disclose",
];

const NEIGHBORHOODS = [
  "Fenway", "Back Bay", "South End", "Allston", "Brighton",
  "Brookline", "Cambridge", "Mission Hill", "Jamaica Plain", "Downtown",
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function ChipSelector({
  options, value, onSelect,
}: {
  options: string[]; value: string; onSelect: (v: string) => void;
}) {
  return (
    <View style={s.chipRow}>
      {options.map((opt) => {
        const sel = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            style={[s.chip, sel ? s.chipSel : s.chipUnsel]}
            activeOpacity={0.75}
          >
            <Text style={[s.chipText, { color: sel ? "#000" : CHIP_TEXT }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MultiSelect({
  options, values, onToggle,
}: {
  options: string[]; values: string[]; onToggle: (v: string) => void;
}) {
  return (
    <View style={s.chipRow}>
      {options.map((opt) => {
        const sel = values.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onToggle(opt)}
            style={[s.chip, sel ? s.chipSel : s.chipUnsel]}
            activeOpacity={0.75}
          >
            <Text style={[s.chipText, { color: sel ? "#000" : CHIP_TEXT }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Dropdown({
  options, value, placeholder, onSelect,
}: {
  options: string[]; value: string; placeholder: string; onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginTop: 24 }}>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[s.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 0 }]}
        activeOpacity={0.8}
      >
        <Text style={{ color: value ? "#fff" : CHIP_TEXT, fontSize: 18 }}>{value || placeholder}</Text>
        <Text style={{ color: MUTED, fontSize: 16 }}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={s.sheet}>
            <ScrollView>
              {options.map((opt) => {
                const sel = value === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => { onSelect(opt); setOpen(false); }}
                    style={[s.sheetRow, sel && { backgroundColor: `${ACCENT}20` }]}
                  >
                    <Text style={{ color: sel ? ACCENT : "#fff", fontSize: 16, fontWeight: sel ? "600" : "400" }}>
                      {opt}
                    </Text>
                    {sel && <Text style={{ color: ACCENT, fontSize: 14 }}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [eduSub, setEduSub] = useState<EduSub>("question");
  const [focused, setFocused] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const steps = useMemo((): StepKey[] => {
    const base = [...BASE_STEPS] as StepKey[];
    return data.livingSituation === "off-campus"
      ? [...base, ...OFF_CAMPUS_STEPS]
      : base;
  }, [data.livingSituation]);

  const currentStep = steps[stepIdx];
  const totalSteps = steps.length;

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setData((p) => ({ ...p, [key]: value }));
  }

  function toggleLocation(loc: string) {
    setData((p) => ({
      ...p,
      locationPreferences: p.locationPreferences.includes(loc)
        ? p.locationPreferences.filter((l) => l !== loc)
        : [...p.locationPreferences, loc],
    }));
  }

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (stepIdx + 1) / totalSteps,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [stepIdx, totalSteps]);

  // Auto-advance from verified edu state
  useEffect(() => {
    if (currentStep !== "edu" || eduSub !== "verified") return;
    const t = setTimeout(() => {
      setEduSub("question");
      doSlide("forward", () => setStepIdx((i) => i + 1));
    }, 1500);
    return () => clearTimeout(t);
  }, [eduSub, currentStep]);

  // Guard stepIdx if living situation changes and shrinks steps
  useEffect(() => {
    if (stepIdx >= steps.length) setStepIdx(steps.length - 1);
  }, [steps.length]);

  function doSlide(dir: "forward" | "back", callback: () => void) {
    const out = dir === "forward" ? -SW : SW;
    const inn = dir === "forward" ? SW : -SW;
    Animated.timing(slideAnim, { toValue: out, duration: 220, useNativeDriver: true }).start(() => {
      slideAnim.setValue(inn);
      callback();
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    });
  }

  function goNext() {
    if (currentStep === "edu" && eduSub === "email") {
      doSlide("forward", () => setEduSub("verified"));
      return;
    }
    if (stepIdx >= steps.length - 1) {
      console.log("✅ Onboarding complete:", JSON.stringify(data, null, 2));
      return;
    }
    doSlide("forward", () => setStepIdx((i) => i + 1));
  }

  function goBack() {
    if (currentStep === "edu" && eduSub === "email") {
      doSlide("back", () => setEduSub("question"));
      return;
    }
    if (stepIdx === 0) return;
    doSlide("back", () => setStepIdx((i) => i - 1));
  }

  const showNext = !(currentStep === "edu" && (eduSub === "question" || eduSub === "verified"));
  const showBack = stepIdx > 0 && !(currentStep === "edu" && eduSub === "verified");

  const canProceed: boolean = (() => {
    switch (currentStep) {
      case "name":     return data.name.trim().length > 0;
      case "edu":      return eduSub !== "email" || (data.eduEmail.includes("@") && data.eduEmail.includes(".edu"));
      case "living":   return data.livingSituation !== "";
      case "age":      return data.age.trim().length > 0;
      case "major":    return data.major.trim().length > 0;
      case "gradYear": return data.gradYear !== "";
      case "ethnicity":return data.ethnicity !== "";
      case "alcohol":  return data.alcohol !== "";
      case "smoking":  return data.smoking !== "";
      case "sleep":    return data.sleepHabits !== "";
      case "budget":   return data.monthlyBudget.trim().length > 0;
      case "location": return data.locationPreferences.length > 0;
      default:         return true;
    }
  })();

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SW],
  });

  // ─── Step renderers ──────────────────────────────────────────────────────────

  function renderStep() {
    switch (currentStep) {

      case "name":
        return <>
          <Text style={s.q}>What's your name?</Text>
          <TextInput
            style={[s.input, focused === "name" && s.inputFocused]}
            value={data.name}
            onChangeText={(v) => set("name", v)}
            placeholder="Your name"
            placeholderTextColor={CHIP_TEXT}
            onFocus={() => setFocused("name")}
            onBlur={() => setFocused(null)}
            autoFocus
          />
        </>;

      case "edu":
        if (eduSub === "question") return <>
          <Text style={s.q}>
            Hi {data.name || "there"}. Somnia requires .edu verification. Proceed?
          </Text>
          <View style={{ flexDirection: "row", gap: 16, marginTop: 36 }}>
            {["Yes", "No"].map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => opt === "Yes"
                  ? doSlide("forward", () => setEduSub("email"))
                  : doSlide("forward", () => setStepIdx((i) => i + 1))
                }
                style={[s.bigChip, { flex: 1 }]}
                activeOpacity={0.75}
              >
                <Text style={s.bigChipText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>;

        if (eduSub === "email") return <>
          <Text style={s.q}>Login with your school email address</Text>
          <TextInput
            style={[s.input, focused === "edu" && s.inputFocused]}
            value={data.eduEmail}
            onChangeText={(v) => set("eduEmail", v)}
            placeholder="you@university.edu"
            placeholderTextColor={CHIP_TEXT}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => setFocused("edu")}
            onBlur={() => setFocused(null)}
            autoFocus
          />
        </>;

        return (
          <View style={{ alignItems: "center", paddingTop: 48 }}>
            <Text style={{ fontSize: 64, marginBottom: 20 }}>✓</Text>
            <Text style={[s.q, { textAlign: "center", color: ACCENT }]}>
              Student status verified!
            </Text>
            <Text style={[s.muted, { textAlign: "center", marginTop: 12, fontSize: 16 }]}>
              Now, for the details.
            </Text>
          </View>
        );

      case "living":
        return <>
          <Text style={s.q}>Are you living:</Text>
          <View style={{ flexDirection: "row", gap: 16, marginTop: 36 }}>
            {([
              { val: "off-campus" as LivingSituation, label: "Off-Campus" },
              { val: "dorm" as LivingSituation, label: "Dorm" },
            ]).map(({ val, label }) => {
              const sel = data.livingSituation === val;
              return (
                <TouchableOpacity
                  key={val}
                  onPress={() => set("livingSituation", val)}
                  style={[s.bigChip, { flex: 1 }, sel && s.bigChipSel]}
                  activeOpacity={0.75}
                >
                  <Text style={[s.bigChipText, { color: sel ? "#000" : "#fff" }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>;

      case "age":
        return <>
          <Text style={s.q}>How old are you?</Text>
          <TextInput
            style={[s.input, focused === "age" && s.inputFocused]}
            value={data.age}
            onChangeText={(v) => set("age", v.replace(/\D/g, ""))}
            placeholder="e.g. 20"
            placeholderTextColor={CHIP_TEXT}
            keyboardType="numeric"
            maxLength={2}
            onFocus={() => setFocused("age")}
            onBlur={() => setFocused(null)}
            autoFocus
          />
        </>;

      case "major":
        return <>
          <Text style={s.q}>What's your major?</Text>
          <TextInput
            style={[s.input, focused === "major" && s.inputFocused]}
            value={data.major}
            onChangeText={(v) => set("major", v)}
            placeholder="e.g. Computer Science"
            placeholderTextColor={CHIP_TEXT}
            maxLength={50}
            onFocus={() => setFocused("major")}
            onBlur={() => setFocused(null)}
            autoFocus
          />
          <Text style={[s.muted, { marginTop: 6, textAlign: "right" }]}>{data.major.length}/50</Text>
        </>;

      case "minor": {
        const noMinor = data.minor === "__none__";
        return <>
          <Text style={s.q}>Minor?</Text>
          <TextInput
            style={[s.input, focused === "minor" && s.inputFocused, noMinor && { opacity: 0.35 }]}
            value={noMinor ? "" : data.minor}
            onChangeText={(v) => set("minor", v)}
            placeholder="e.g. Mathematics"
            placeholderTextColor={CHIP_TEXT}
            maxLength={50}
            editable={!noMinor}
            onFocus={() => setFocused("minor")}
            onBlur={() => setFocused(null)}
          />
          <Text style={[s.muted, { marginTop: 6, textAlign: "right" }]}>
            {noMinor ? 0 : data.minor.length}/50
          </Text>
          <TouchableOpacity
            onPress={() => set("minor", noMinor ? "" : "__none__")}
            style={[s.chip, { marginTop: 14, alignSelf: "flex-start" }, noMinor ? s.chipSel : s.chipUnsel]}
            activeOpacity={0.75}
          >
            <Text style={[s.chipText, { color: noMinor ? "#000" : CHIP_TEXT }]}>No Minor</Text>
          </TouchableOpacity>
        </>;
      }

      case "gradYear":
        return <>
          <Text style={s.q}>Graduation year?</Text>
          <Dropdown options={GRAD_YEARS} value={data.gradYear} placeholder="Select year" onSelect={(v) => set("gradYear", v)} />
        </>;

      case "ethnicity":
        return <>
          <Text style={s.q}>Ethnicity?</Text>
          <Dropdown options={ETHNICITIES} value={data.ethnicity} placeholder="Select one" onSelect={(v) => set("ethnicity", v)} />
        </>;

      case "religion": {
        const noPref = data.religion === "__none__";
        return <>
          <Text style={s.q}>Religion?</Text>
          <TextInput
            style={[s.input, focused === "religion" && s.inputFocused, noPref && { opacity: 0.35 }]}
            value={noPref ? "" : data.religion}
            onChangeText={(v) => set("religion", v)}
            placeholder="e.g. Catholic, Muslim, Agnostic…"
            placeholderTextColor={CHIP_TEXT}
            editable={!noPref}
            onFocus={() => setFocused("religion")}
            onBlur={() => setFocused(null)}
          />
          <TouchableOpacity
            onPress={() => set("religion", noPref ? "" : "__none__")}
            style={[s.chip, { marginTop: 14, alignSelf: "flex-start" }, noPref ? s.chipSel : s.chipUnsel]}
            activeOpacity={0.75}
          >
            <Text style={[s.chipText, { color: noPref ? "#000" : CHIP_TEXT }]}>Prefer not to disclose</Text>
          </TouchableOpacity>
        </>;
      }

      case "alcohol":
        return <>
          <Text style={s.q}>Do you drink alcohol?</Text>
          <ChipSelector options={["Yes", "Sometimes", "No"]} value={data.alcohol} onSelect={(v) => set("alcohol", v)} />
        </>;

      case "smoking":
        return <>
          <Text style={s.q}>Do you smoke?</Text>
          <ChipSelector options={["Yes", "Sometimes", "No"]} value={data.smoking} onSelect={(v) => set("smoking", v)} />
        </>;

      case "sleep":
        return <>
          <Text style={s.q}>Sleep habits?</Text>
          <ChipSelector
            options={["Night Owl 🦉", "Early Riser 🌅", "It Changes 😴"]}
            value={data.sleepHabits}
            onSelect={(v) => set("sleepHabits", v)}
          />
        </>;

      case "budget":
        return <>
          <Text style={s.q}>What's your monthly budget?</Text>
          <View style={[
            s.input,
            { flexDirection: "row", alignItems: "center", marginTop: 24 },
            focused === "budget" && s.inputFocused,
          ]}>
            <Text style={{ color: MUTED, fontSize: 20, marginRight: 6 }}>$</Text>
            <TextInput
              style={{ flex: 1, color: "#fff", fontSize: 20 }}
              value={data.monthlyBudget}
              onChangeText={(v) => set("monthlyBudget", v.replace(/\D/g, ""))}
              placeholder="1200"
              placeholderTextColor={CHIP_TEXT}
              keyboardType="numeric"
              onFocus={() => setFocused("budget")}
              onBlur={() => setFocused(null)}
              autoFocus
            />
          </View>
          <Text style={[s.muted, { marginTop: 8 }]}>per month</Text>
        </>;

      case "location":
        return <>
          <Text style={s.q}>Preferred neighborhoods?</Text>
          <Text style={[s.muted, { marginTop: 8 }]}>Select all that apply</Text>
          <MultiSelect options={NEIGHBORHOODS} values={data.locationPreferences} onToggle={toggleLocation} />
        </>;
    }
  }

  // ─── Layout ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      {/* Progress bar */}
      <View style={s.track}>
        <Animated.View style={[s.fill, { width: progressWidth }]} />
      </View>

      {/* Header */}
      <View style={s.header}>
        {showBack ? (
          <TouchableOpacity onPress={goBack} hitSlop={{ top: 12, left: 12, bottom: 12, right: 12 }}>
            <Text style={{ color: ACCENT, fontSize: 24, fontWeight: "300" }}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
        <Text style={s.counter}>{stepIdx + 1} of {totalSteps}</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Scrollable content + Next button */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
            {renderStep()}
          </Animated.View>
        </ScrollView>

        {showNext && (
          <View style={s.bottom}>
            <TouchableOpacity
              onPress={goNext}
              style={[s.nextBtn, !canProceed && { opacity: 0.4 }]}
              disabled={!canProceed}
              activeOpacity={0.85}
            >
              <Text style={s.nextTxt}>
                {stepIdx === steps.length - 1 ? "Finish" : "Next"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: BG },
  track:        { height: 3, backgroundColor: TRACK },
  fill:         { height: 3, backgroundColor: ACCENT },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14 },
  counter:      { color: MUTED, fontSize: 12, fontWeight: "500" },
  scroll:       { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  q:            { fontSize: 32, fontWeight: "700", color: "#fff", lineHeight: 42 },
  muted:        { fontSize: 14, color: MUTED },
  input:        { backgroundColor: INPUT_BG, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, fontSize: 18, color: "#fff", marginTop: 24, borderWidth: 1.5, borderColor: "transparent" },
  inputFocused: { borderColor: ACCENT },
  chipRow:      { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 24 },
  chip:         { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999 },
  chipUnsel:    { backgroundColor: INPUT_BG, borderWidth: 1, borderColor: "#374151" },
  chipSel:      { backgroundColor: ACCENT, borderWidth: 0 },
  chipText:     { fontSize: 15, fontWeight: "500" },
  bigChip:      { paddingVertical: 22, paddingHorizontal: 16, borderRadius: 16, alignItems: "center", backgroundColor: INPUT_BG, borderWidth: 1, borderColor: "#374151" },
  bigChipSel:   { backgroundColor: ACCENT, borderColor: ACCENT },
  bigChipText:  { fontSize: 17, fontWeight: "600", color: "#fff" },
  bottom:       { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  nextBtn:      { width: "100%", height: 56, backgroundColor: ACCENT, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  nextTxt:      { fontSize: 16, fontWeight: "700", color: "#000" },
  overlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet:        { backgroundColor: "#111827", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%", paddingVertical: 8 },
  sheetRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: TRACK },
});
