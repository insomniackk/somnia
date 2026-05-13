import { TouchableOpacity, Text, ActivityIndicator } from "react-native";

interface ButtonProps {
  onPress?: () => void;
  label: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({
  onPress,
  label,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  fullWidth,
}: ButtonProps) {
  const baseClasses = "flex-row items-center justify-center rounded-2xl";

  const variantClasses = {
    primary: "bg-brand-600",
    secondary: "bg-brand-100",
    outline: "border-2 border-brand-600 bg-transparent",
    ghost: "bg-transparent",
  };

  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-5 py-3.5",
    lg: "px-8 py-4",
  };

  const labelVariantClasses = {
    primary: "text-white",
    secondary: "text-brand-700",
    outline: "text-brand-600",
    ghost: "text-gray-600",
  };

  const labelSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? "w-full" : ""} ${disabled || loading ? "opacity-50" : ""}`}
    >
      {loading && <ActivityIndicator size="small" color={variant === "primary" ? "white" : "#7c3aed"} className="mr-2" />}
      <Text className={`font-bold ${labelVariantClasses[variant]} ${labelSizeClasses[size]}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
