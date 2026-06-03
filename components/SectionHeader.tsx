import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface SectionHeaderProps {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

export function SectionHeader({ title, icon, color }: SectionHeaderProps) {
  const colors = useColors();
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 14, stiffness: 90 });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 1], [0, 1]),
    transform: [{ translateX: interpolate(entrance.value, [0, 1], [-10, 0]) }],
  }));

  return (
    <Animated.View style={[styles.container, style]}>
      <View style={[styles.iconDot, { backgroundColor: color + "22", borderColor: color + "55" }]}>
        <Feather name={icon} size={12} color={color} />
      </View>
      <Text style={[styles.title, { color: color }]}>{title}</Text>
      <View style={[styles.line, { backgroundColor: color + "33" }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  iconDot: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2.5,
  },
  line: {
    flex: 1,
    height: 1,
  },
});
