import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";

interface ShizukuBannerProps {
  active: boolean;
}

const FF_PKG = "com.dts.freefireth";

export function ShizukuBanner({ active }: ShizukuBannerProps) {
  const colors = useColors();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1800 }),
          withTiming(0, { duration: 1800 })
        ),
        -1,
        false
      );
    }
  }, [active]);

  const dotStyle = useAnimatedStyle(() => ({
    shadowOpacity: active ? interpolate(pulse.value, [0, 1], [0.4, 1]) : 0,
    shadowRadius: active ? interpolate(pulse.value, [0, 1], [3, 8]) : 0,
  }));

  return (
    <Pressable
      onPress={() => router.push("/shizuku")}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: active ? colors.primary + "0e" : colors.card,
          borderColor: active ? colors.primary + "55" : colors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {/* Left: status */}
      <View style={styles.leftRow}>
        <Animated.View
          style={[
            styles.statusDot,
            {
              backgroundColor: active ? colors.primary : colors.mutedForeground,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
            },
            dotStyle,
          ]}
        />
        <View style={styles.textBlock}>
          <Text style={[styles.label, { color: active ? colors.primary : colors.mutedForeground }]}>
            SHIZUKU {active ? "ACTIVE" : "INACTIVE"}
          </Text>
          <Text style={[styles.pkg, { color: colors.mutedForeground }]} numberOfLines={1}>
            {FF_PKG}
          </Text>
        </View>
      </View>

      {/* Right: target + arrow */}
      <View style={styles.rightRow}>
        <View style={[styles.badge, { backgroundColor: "#ff6b3518", borderColor: "#ff6b3544" }]}>
          <Feather name="crosshair" size={11} color="#ff6b35" />
          <Text style={[styles.badgeText, { color: "#ff6b35" }]}>FREE FIRE</Text>
        </View>
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 16,
    gap: 8,
  },
  leftRow: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  textBlock: { gap: 2, flex: 1 },
  label: { fontSize: 10, fontWeight: "700", letterSpacing: 2 },
  pkg: { fontSize: 10, letterSpacing: 0.3 },
  rightRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1 },
});
