import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

interface GlowHeaderProps {
  activeCount: number;
}

export function GlowHeader({ activeCount }: GlowHeaderProps) {
  const colors = useColors();
  const glowPulse = useSharedValue(0);
  const entrance = useSharedValue(0);

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 12, stiffness: 80 });
    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(entrance.value, [0, 1], [-20, 0]) },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.4, 1]),
    textShadowRadius: interpolate(glowPulse.value, [0, 1], [8, 20]),
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(glowPulse.value, [0, 1], [0.5, 1]),
    shadowRadius: interpolate(glowPulse.value, [0, 1], [6, 14]),
  }));

  return (
    <Animated.View style={[styles.container, headerStyle]}>
      <View style={styles.titleRow}>
        <Animated.Text
          style={[
            styles.title,
            { color: colors.primary },
            glowStyle,
          ]}
        >
          ZENNY
        </Animated.Text>
        <Text style={[styles.version, { color: colors.secondary }]}>V2</Text>
      </View>
      <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
        ADVANCED CONTROL PANEL
      </Text>
      <Animated.View
        style={[
          styles.statusBadge,
          {
            backgroundColor: colors.primary + "18",
            borderColor: colors.primary + "55",
            shadowColor: colors.primary,
          },
          badgeStyle,
        ]}
      >
        <View
          style={[styles.activeDot, { backgroundColor: colors.primary }]}
        />
        <Text style={[styles.statusText, { color: colors.primary }]}>
          {activeCount > 0
            ? `${activeCount} MODULE${activeCount > 1 ? "S" : ""} ACTIVE`
            : "STANDBY"}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: "700",
    letterSpacing: 8,
    textShadowColor: "#00ff88",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  version: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 3,
    marginBottom: 6,
    textShadowColor: "#00d4ff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 4,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    shadowColor: "#00ff88",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
