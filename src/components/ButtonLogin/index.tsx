import React from "react";
import { TouchableOpacity, TouchableOpacityProps, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

interface ButtonLoginProps extends TouchableOpacityProps {
  title: string;
  isLoading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
}

export function ButtonLogin({
  title,
  isLoading = false,
  icon,
  backgroundColor = "#27272A",
  textColor = "#FFFFFF",
  iconColor = "#FFFFFF",
  ...rest
}: ButtonLoginProps) {
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor }]} 
      disabled={isLoading || rest.disabled}
      activeOpacity={0.8}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={iconColor} />
      ) : icon ? (
        <Ionicons name={icon} style={[styles.icon, { color: iconColor }]} />
      ) : null}
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
} 