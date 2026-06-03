import React, { useEffect } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export function ScanBackground() {
  const scanY = useSharedValue(-60);
  const scanY2 = useSharedValue(-60);

  useEffect(() => {
    scanY.value = withRepeat(
      withTiming(SCREEN_HEIGHT + 60, {
        duration: 3800,
        easing: Easing.linear,
      }),
      -1,
      false
    );
    setTimeout(() => {
      scanY2.value = withRepeat(
        withTiming(SCREEN_HEIGHT + 60, {
          duration: 3800,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }, 1900);
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value }],
  }));

  const scanStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY2.value }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Grid lines horizontal */}
      {Array.from({ length: 18 }).map((_, i) => (
        <View
          key={`h${i}`}
          style={[
            styles.gridLineH,
            { top: (SCREEN_HEIGHT / 17) * i, opacity: i % 3 === 0 ? 0.06 : 0.03 },
          ]}
        />
      ))}
      {/* Grid lines vertical */}
      {Array.from({ length: 8 }).map((_, i) => (
        <View
          key={`v${i}`}
          style={[
            styles.gridLineV,
            { left: (SCREEN_WIDTH / 7) * i, opacity: i % 2 === 0 ? 0.05 : 0.025 },
          ]}
        />
      ))}
      {/* Scan line 1 */}
      <Animated.View style={[styles.scanLine, scanStyle]} />
      {/* Scan line 2 */}
      <Animated.View style={[styles.scanLine, scanStyle2, { opacity: 0.3 }]} />
      {/* Glow corners */}
      <View style={[styles.cornerGlow, { top: -80, left: -80 }]} />
      <View style={[styles.cornerGlowRight, { top: -80, right: -80 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#00ff88",
  },
  gridLineV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#00d4ff",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#00ff88",
    opacity: 0.55,
    shadowColor: "#00ff88",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  cornerGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#00d4ff",
    opacity: 0.04,
  },
  cornerGlowRight: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#00ff88",
    opacity: 0.04,
  },
});
