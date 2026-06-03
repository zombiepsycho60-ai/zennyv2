import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { playSFX } from "@/utils/soundFX";

interface FeatureCardProps {
  title: string;
  subtitle: string;
  iconName: keyof typeof Feather.glyphMap;
  enabled: boolean;
  accentColor: string;
  onToggle: () => void;
  delay?: number;
}

type InjectState = "idle" | "injecting" | "injected";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FeatureCard({
  title,
  subtitle,
  iconName,
  enabled,
  accentColor,
  onToggle,
  delay = 0,
}: FeatureCardProps) {
  const colors = useColors();
  const [injectState, setInjectState] = useState<InjectState>(
    enabled ? "injected" : "idle"
  );

  const toggleAnim = useSharedValue(enabled ? 1 : 0);
  const pulseAnim = useSharedValue(0);
  const entranceAnim = useSharedValue(0);
  const pressAnim = useSharedValue(1);
  const scanAnim = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      entranceAnim.value = withSpring(1, { damping: 15, stiffness: 100 });
    }, delay);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    toggleAnim.value = withSpring(enabled ? 1 : 0, {
      damping: 14,
      stiffness: 180,
    });
    if (enabled) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1400 }),
          withTiming(0, { duration: 1400 })
        ),
        -1,
        false
      );
      scanAnim.value = withRepeat(
        withTiming(1, { duration: 1800 }),
        -1,
        false
      );
    } else {
      pulseAnim.value = withTiming(0, { duration: 300 });
      scanAnim.value = withTiming(0, { duration: 300 });
      setInjectState("idle");
    }
  }, [enabled]);

  const cardStyle = useAnimatedStyle(() => {
    const base = interpolate(toggleAnim.value, [0, 1], [0, 0.65]);
    const extra = interpolate(pulseAnim.value, [0, 1], [0, 0.18]);
    return {
      opacity: interpolate(entranceAnim.value, [0, 1], [0, 1]),
      transform: [
        { translateY: interpolate(entranceAnim.value, [0, 1], [28, 0]) },
        { scale: pressAnim.value },
      ],
      shadowColor: accentColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: Math.min(base + extra, 0.9),
      shadowRadius: 20,
      elevation: enabled ? 14 : 2,
    };
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(toggleAnim.value, [0, 1], [2, 22]) }],
    backgroundColor: interpolateColor(toggleAnim.value, [0, 1], ["#3a3a5c", accentColor]),
    shadowColor: accentColor,
    shadowOpacity: interpolate(toggleAnim.value, [0, 1], [0, 0.8]),
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(toggleAnim.value, [0, 1], ["#1a1a2e", accentColor + "33"]),
    borderColor: interpolateColor(toggleAnim.value, [0, 1], ["#2a2a4a", accentColor]),
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(toggleAnim.value, [0, 1], ["#1a1a2e", accentColor + "22"]),
    borderColor: interpolateColor(toggleAnim.value, [0, 1], ["#2a2a4a", accentColor + "88"]),
  }));

  const statusDotStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(toggleAnim.value, [0, 1], ["#3a3a5c", accentColor]),
    shadowColor: accentColor,
    shadowOpacity: interpolate(pulseAnim.value, [0, 1], [0.3, 1]),
    shadowRadius: interpolate(pulseAnim.value, [0, 1], [3, 10]),
    shadowOffset: { width: 0, height: 0 },
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(scanAnim.value, [0, 1], [-200, 200]) },
    ],
    opacity: interpolate(scanAnim.value, [0, 0.1, 0.9, 1], [0, 0.6, 0.6, 0]),
  }));

  const handlePress = () => {
    pressAnim.value = withSequence(
      withTiming(0.95, { duration: 70 }),
      withSpring(1, { damping: 10 })
    );

    if (!enabled) {
      playSFX("inject");
      setInjectState("injecting");
      setTimeout(() => setInjectState("injected"), 900);
    } else {
      playSFX("disable");
    }

    onToggle();
  };

  const injectLabel =
    injectState === "injecting"
      ? "INJECTING..."
      : injectState === "injected"
      ? "INJECTED"
      : "OFF";

  const injectColor =
    injectState === "injecting"
      ? "#f59e0b"
      : injectState === "injected"
      ? accentColor
      : colors.mutedForeground;

  return (
    <AnimatedPressable onPress={handlePress} style={[styles.card, cardStyle]}>
      <View style={[styles.cardInner, { backgroundColor: colors.card, borderColor: enabled ? accentColor + "44" : colors.border }]}>

        {/* Scan line effect when enabled */}
        {enabled && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.scanLine,
              { backgroundColor: accentColor },
              scanLineStyle,
            ]}
          />
        )}

        <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
          <Feather
            name={injectState === "injecting" ? "loader" : iconName}
            size={22}
            color={enabled ? accentColor : colors.mutedForeground}
          />
        </Animated.View>

        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Animated.View style={[styles.statusDot, statusDotStyle]} />
            <Text style={[styles.title, { color: enabled ? accentColor : colors.foreground }]}>
              {title}
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {injectState === "injecting" ? "Injecting into com.dts.freefireth..." : subtitle}
          </Text>
        </View>

        <View style={styles.toggleWrapper}>
          <Text style={[styles.statusLabel, { color: injectColor }]}>
            {enabled ? injectLabel : "OFF"}
          </Text>
          <Animated.View style={[styles.track, trackStyle]}>
            <Animated.View style={[styles.thumb, thumbStyle]} />
          </Animated.View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    opacity: 0.08,
    borderRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  toggleWrapper: {
    alignItems: "center",
    gap: 5,
  },
  statusLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  track: {
    width: 48,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    justifyContent: "center",
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: "absolute",
    left: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    shadowOpacity: 1,
  },
});
