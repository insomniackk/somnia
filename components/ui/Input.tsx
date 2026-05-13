import { View, Text, TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, ...props }: InputProps) {
  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-semibold text-gray-700">{label}</Text>
      )}
      <TextInput
        className={`w-full rounded-2xl border bg-gray-50 px-4 py-3.5 text-base text-gray-900 ${
          error ? "border-red-400" : "border-gray-200"
        }`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="mt-1.5 text-xs text-red-600">{error}</Text>}
      {hint && !error && <Text className="mt-1.5 text-xs text-gray-400">{hint}</Text>}
    </View>
  );
}
