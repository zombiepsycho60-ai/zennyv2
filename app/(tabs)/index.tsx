import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { FeatureCard } from "@/components/FeatureCard";
import { ScanBackground } from "@/components/ScanBackground";
import { GlowHeader } from "@/components/GlowHeader";
import { FooterBar } from "@/components/FooterBar";
import { SectionHeader } from "@/components/SectionHeader";
import { ShizukuBanner } from "@/components/ShizukuBanner";
import { playSFX } from "@/utils/soundFX";

const STORAGE_KEY = "zennyv2_features";
const AUTH_KEY = "zennyv2_auth";
const SHIZUKU_KEY = "zennyv2_shizuku";
const FF_PKG = "com.dts.freefireth";

interface FeatureState {
  function: boolean;
  aimbot: boolean;
  location: boolean;
  esp: boolean;
  speedBoost: boolean;
  antiRecoil: boolean;
  wallhack: boolean;
  autoShoot: boolean;
}

const DEFAULT_STATE: FeatureState = {
  function: false,
  aimbot: false,
  location: false,
  esp: false,
  speedBoost: false,
  antiRecoil: false,
  wallhack: false,
  autoShoot: false,
};

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [features, setFeatures] = useState<FeatureState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [shizukuActive, setShizukuActive] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<"stopped" | "running" | "starting">("stopped");

  const statusBlink = useSharedValue(0);
  const scanLine = useSharedValue(0);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(SHIZUKU_KEY),
    ]).then(([featRaw, shizuku]) => {
      if (featRaw) setFeatures(JSON.parse(featRaw));
      const active = shizuku === "true";
      setShizukuActive(active);
      if (active) setServiceStatus("running");
    }).catch(() => {}).finally(() => setLoaded(true));

    statusBlink.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0, { duration: 700 })),
      -1, false
    );
    scanLine.value = withRepeat(withTiming(1, { duration: 3000 }), -1, false);
  }, []);

  const toggle = useCallback(
    async (key: keyof FeatureState) => {
      const next = { ...features, [key]: !features[key] };
      setFeatures(next);
      try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
    },
    [features]
  );

  const handleStartService = async () => {
    if (serviceStatus === "running") {
      setServiceStatus("stopped");
      playSFX("disable");
      return;
    }
    setServiceStatus("starting");
    playSFX("connect");
    await new Promise((r) => setTimeout(r, 1800));
    setServiceStatus("running");
    playSFX("success");
  };

  const handleLogout = async () => {
    playSFX("click");
    await AsyncStorage.multiRemove([AUTH_KEY, SHIZUKU_KEY]);
    router.replace("/");
  };

  const activeCount = Object.values(features).filter(Boolean).length;
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 12;

  const blinkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(statusBlink.value, [0, 1], [0.4, 1]),
  }));

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(scanLine.value, [0, 1], [-400, 400]) }],
    opacity: interpolate(scanLine.value, [0, 0.1, 0.9, 1], [0, 0.4, 0.4, 0]),
  }));

  if (!loaded) return null;

  const serviceColor = serviceStatus === "running" ? colors.primary : serviceStatus === "starting" ? "#f59e0b" : colors.mutedForeground;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScanBackground />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 14, paddingBottom: bottomPad + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <GlowHeader activeCount={activeCount} />
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.card, opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="log-out" size={15} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <View style={[styles.dividerDiamond, { borderColor: colors.primary + "66" }]} />
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Shizuku banner */}
        <ShizukuBanner active={shizukuActive} />

        {/* Background Service control */}
        <Pressable
          onPress={handleStartService}
          disabled={!shizukuActive}
          style={({ pressed }) => [
            styles.serviceCard,
            {
              backgroundColor: serviceStatus === "running" ? colors.primary + "0e" : colors.card,
              borderColor: serviceStatus === "running" ? colors.primary + "55" : colors.border,
              opacity: !shizukuActive ? 0.5 : pressed ? 0.85 : 1,
            }
          ]}
        >
          {/* Scan effect */}
          <Animated.View
            pointerEvents="none"
            style={[styles.serviceScanLine, { backgroundColor: colors.primary }, scanStyle]}
          />

          <View style={[
            styles.serviceIconWrap,
            { backgroundColor: serviceColor + "18", borderColor: serviceColor + "55" }
          ]}>
            <Feather
              name={serviceStatus === "running" ? "activity" : serviceStatus === "starting" ? "loader" : "power"}
              size={18}
              color={serviceColor}
            />
          </View>

          <View style={styles.serviceText}>
            <Text style={[styles.serviceLabel, { color: colors.foreground }]}>Background Service</Text>
            <Text style={[styles.serviceSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {serviceStatus === "running"
                ? `Active · Overlay ON · ${FF_PKG}`
                : serviceStatus === "starting"
                ? "Starting foreground service..."
                : "Tap to start · Shizuku required"}
            </Text>
          </View>

          <Animated.View style={[styles.serviceStatusDot, { backgroundColor: serviceColor, shadowColor: serviceColor }, blinkStyle]} />
          <Text style={[styles.serviceStatusText, { color: serviceColor }]}>
            {serviceStatus === "running" ? "ON" : serviceStatus === "starting" ? "..." : "OFF"}
          </Text>
        </Pressable>

        {/* CORE MODULES */}
        <SectionHeader title="CORE MODULES" icon="cpu" color="#00d4ff" />
        <View style={styles.cards}>
          <FeatureCard
            title="ENABLE FUNCTION"
            subtitle="Core module · Free Fire"
            iconName="cpu"
            enabled={features.function}
            accentColor="#00d4ff"
            onToggle={() => toggle("function")}
            delay={60}
          />
          <FeatureCard
            title="ENABLE AIMBOT"
            subtitle="Input injection aim assist · FF"
            iconName="crosshair"
            enabled={features.aimbot}
            accentColor="#00ff88"
            onToggle={() => toggle("aimbot")}
            delay={110}
          />
          <FeatureCard
            title="ENABLE LOCATION"
            subtitle="Mock GPS position · Free Fire"
            iconName="map-pin"
            enabled={features.location}
            accentColor="#ff00aa"
            onToggle={() => toggle("location")}
            delay={160}
          />
        </View>

        {/* VISION MODS */}
        <SectionHeader title="VISION MODS" icon="eye" color="#a855f7" />
        <View style={styles.cards}>
          <FeatureCard
            title="ENABLE ESP"
            subtitle="Overlay highlight · no game files touched"
            iconName="eye"
            enabled={features.esp}
            accentColor="#a855f7"
            onToggle={() => toggle("esp")}
            delay={210}
          />
          <FeatureCard
            title="WALLHACK"
            subtitle="Transparent overlay · Shizuku overlay"
            iconName="layers"
            enabled={features.wallhack}
            accentColor="#f59e0b"
            onToggle={() => toggle("wallhack")}
            delay={255}
          />
        </View>

        {/* COMBAT MODS */}
        <SectionHeader title="COMBAT MODS" icon="zap" color="#ef4444" />
        <View style={styles.cards}>
          <FeatureCard
            title="ANTI-RECOIL"
            subtitle="Inject swipe events · no memory edit"
            iconName="target"
            enabled={features.antiRecoil}
            accentColor="#ef4444"
            onToggle={() => toggle("antiRecoil")}
            delay={300}
          />
          <FeatureCard
            title="AUTO SHOOT"
            subtitle="Inject tap events via INJECT_EVENTS"
            iconName="zap"
            enabled={features.autoShoot}
            accentColor="#f97316"
            onToggle={() => toggle("autoShoot")}
            delay={345}
          />
        </View>

        {/* MOVEMENT MODS */}
        <SectionHeader title="MOVEMENT MODS" icon="activity" color="#10b981" />
        <View style={styles.cards}>
          <FeatureCard
            title="SPEED BOOST"
            subtitle="Input timing manipulation · FF"
            iconName="activity"
            enabled={features.speedBoost}
            accentColor="#10b981"
            onToggle={() => toggle("speedBoost")}
            delay={390}
          />
        </View>

        <FooterBar />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  iconBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 8 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, opacity: 0.5 },
  dividerDiamond: { width: 8, height: 8, borderWidth: 1, transform: [{ rotate: "45deg" }] },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 16,
    overflow: "hidden",
  },
  serviceScanLine: {
    position: "absolute",
    top: 0, bottom: 0,
    width: 80,
    opacity: 0.06,
  },
  serviceIconWrap: { width: 40, height: 40, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  serviceText: { flex: 1, gap: 3 },
  serviceLabel: { fontSize: 13, fontWeight: "600" },
  serviceSub: { fontSize: 11 },
  serviceStatusDot: { width: 8, height: 8, borderRadius: 4, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6 },
  serviceStatusText: { fontSize: 11, fontWeight: "700", letterSpacing: 1.5, minWidth: 24, textAlign: "right" },
  cards: { gap: 0, marginBottom: 6 },
});
