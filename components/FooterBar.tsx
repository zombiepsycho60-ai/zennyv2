import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";

const FF_PKG = "com.dts.freefireth";

export function FooterBar() {
  const colors = useColors();
  const blink = useSharedValue(0);
  const scan = useSharedValue(0);

  useEffect(() => {
    blink.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0, { duration: 600 })),
      -1, false
    );
    scan.value = withRepeat(withTiming(1, { duration: 3000 }), -1, false);
  }, []);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(blink.value, [0, 1], [0, 1]),
  }));

  const scanStyle = useAnimatedStyle(() => ({
    width: `${interpolate(scan.value, [0, 0.5, 1], [0, 100, 0])}%` as any,
    opacity: interpolate(scan.value, [0, 0.1, 0.9, 1], [0, 0.6, 0.6, 0]),
  }));

  return (
    <View style={styles.container}>
      <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
        <Animated.View style={[styles.progressBar, { backgroundColor: colors.primary }, scanStyle]} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.row}>
        <View style={styles.cell}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>TARGET</Text>
          <Text style={[styles.value, { color: colors.secondary }]} numberOfLines={1}>{FF_PKG}</Text>
        </View>
        <View style={[styles.sep, { backgroundColor: colors.border }]} />
        <View style={styles.cell}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>ENGINE</Text>
          <Text style={[styles.value, { color: colors.primary }]}>SHIZUKU</Text>
        </View>
        <View style={[styles.sep, { backgroundColor: colors.border }]} />
        <View style={styles.cell}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>BUILD</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={[styles.value, { color: colors.primary }]}>2.0.0</Text>
            <Animated.Text style={[styles.cursor, { color: colors.primary }, cursorStyle]}>_</Animated.Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginTop: 12 },
  progressTrack: { height: 2, borderRadius: 1, overflow: "hidden" },
  progressBar: { height: "100%", borderRadius: 1 },
  divider: { height: 1, opacity: 0.4 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  cell: { alignItems: "center", gap: 3, flex: 1 },
  sep: { width: 1, height: 28, opacity: 0.5 },
  label: { fontSize: 9, letterSpacing: 1.5, fontWeight: "500" },
  value: { fontSize: 10, letterSpacing: 1, fontWeight: "700" },
  cursor: { fontSize: 12, fontWeight: "700" },
});
