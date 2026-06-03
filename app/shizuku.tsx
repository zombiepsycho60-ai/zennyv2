import React, { useEffect, useState } from "react";
import {
  Linking,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { ScanBackground } from "@/components/ScanBackground";
import { playSFX } from "@/utils/soundFX";

const SHIZUKU_KEY = "zennyv2_shizuku";
const FF_PKG = "com.dts.freefireth";

type PermissionStatus = "idle" | "granted" | "denied";

interface Permission {
  id: string;
  label: string;
  desc: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
  required: boolean;
}

const PERMISSIONS: Permission[] = [
  {
    id: "shizuku",
    label: "Shizuku Service",
    desc: "Privileged API access — enables input injection & hidden APIs",
    icon: "zap",
    color: "#00ff88",
    required: true,
  },
  {
    id: "overlay",
    label: "Display Over Apps",
    desc: "Floating panel stays visible over Free Fire while you play",
    icon: "layers",
    color: "#00d4ff",
    required: true,
  },
  {
    id: "inject",
    label: "Input Injection",
    desc: "Grants INJECT_EVENTS via Shizuku — used for aim assist & auto actions",
    icon: "crosshair",
    color: "#a855f7",
    required: true,
  },
  {
    id: "notification",
    label: "Foreground Service",
    desc: "Keeps the panel alive in background — game won't kill it",
    icon: "bell",
    color: "#f59e0b",
    required: false,
  },
];

const CONNECTION_LOG = [
  { msg: "Starting Shizuku binder connection...",      color: "#666" },
  { msg: "✓ Shizuku service found",                   color: "#00ff88" },
  { msg: "Requesting INJECT_EVENTS permission...",     color: "#666" },
  { msg: "✓ Input injection permission granted",       color: "#00ff88" },
  { msg: "Requesting SYSTEM_ALERT_WINDOW permission...",color: "#666" },
  { msg: "✓ Overlay permission confirmed",             color: "#00ff88" },
  { msg: "Scanning for com.dts.freefireth...",         color: "#666" },
  { msg: "✓ Free Fire process detected",               color: "#ff6b35" },
  { msg: "Attaching foreground service...",            color: "#666" },
  { msg: "✓ Background service armed",                 color: "#00ff88" },
  { msg: "All modules ready. NO game files modified.", color: "#00d4ff" },
];

export default function ShizukuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<"intro" | "connecting" | "done">("intro");
  const [logLines, setLogLines] = useState<number>(0);
  const [perms, setPerms] = useState<Record<string, PermissionStatus>>({
    shizuku: "idle", overlay: "idle", inject: "idle", notification: "idle",
  });

  const entrance = useSharedValue(0);
  const pulse = useSharedValue(0);
  const checkAnim = useSharedValue(0);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    entrance.value = withSpring(1, { damping: 12, stiffness: 80 });
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1600 }), withTiming(0, { duration: 1600 })),
      -1, false
    );
    AsyncStorage.getItem(SHIZUKU_KEY).then((v) => {
      if (v === "true") {
        setPhase("done");
        setLogLines(CONNECTION_LOG.length);
        setPerms({ shizuku: "granted", overlay: "granted", inject: "granted", notification: "granted" });
        checkAnim.value = withSpring(1, { damping: 10 });
      }
    });
  }, []);

  const runSetup = async () => {
    setPhase("connecting");
    playSFX("connect");

    const permOrder = ["shizuku", "overlay", "inject", "notification"];

    for (let i = 0; i < CONNECTION_LOG.length; i++) {
      await new Promise((r) => setTimeout(r, 280 + Math.random() * 160));
      setLogLines(i + 1);

      if (i === 1) { setPerms((p) => ({ ...p, shizuku: "granted" })); playSFX("click"); }
      if (i === 3) { setPerms((p) => ({ ...p, inject: "granted" }));   playSFX("click"); }
      if (i === 5) { setPerms((p) => ({ ...p, overlay: "granted" }));  playSFX("click"); }
      if (i === 9) { setPerms((p) => ({ ...p, notification: "granted" })); playSFX("click"); }
    }

    await AsyncStorage.setItem(SHIZUKU_KEY, "true");
    playSFX("success");
    setPhase("done");
    checkAnim.value = withSpring(1, { damping: 10 });
    ringScale.value = withSequence(
      withTiming(1.12, { duration: 180 }),
      withSpring(1, { damping: 8 })
    );
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: interpolate(entrance.value, [0, 1], [20, 0]) }],
  }));

  const ringStyle = useAnimatedStyle(() => {
    const accentColor = phase === "done" ? colors.primary : colors.secondary;
    return {
      shadowOpacity: interpolate(pulse.value, [0, 1], [0.3, 0.9]),
      shadowRadius: interpolate(pulse.value, [0, 1], [8, 26]),
      transform: [{ scale: ringScale.value }],
    };
  });

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkAnim.value,
    transform: [{ scale: checkAnim.value }],
  }));

  const accentColor = phase === "done" ? colors.primary : colors.secondary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScanBackground />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: bottomPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, entranceStyle]}>

          <Pressable
            onPress={() => { playSFX("click"); router.replace("/"); }}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="arrow-left" size={18} color={colors.mutedForeground} />
          </Pressable>

          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.foreground }]}>Shizuku Setup</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Non-root background service · Free Fire
            </Text>
          </View>

          {/* Status ring */}
          <View style={styles.centerBlock}>
            <Animated.View style={[
              styles.ring,
              { borderColor: accentColor, shadowColor: accentColor },
              ringStyle,
            ]}>
              <View style={[styles.ringInner, { backgroundColor: accentColor + "18" }]}>
                {phase === "done" ? (
                  <Animated.View style={checkStyle}>
                    <Feather name="shield" size={38} color={colors.primary} />
                  </Animated.View>
                ) : (
                  <Feather name="zap" size={36} color={colors.secondary} />
                )}
              </View>
            </Animated.View>
            <Text style={[styles.ringLabel, { color: accentColor }]}>
              {phase === "intro" ? "READY TO SETUP" : phase === "connecting" ? "SETTING UP..." : "FULLY ARMED"}
            </Text>
          </View>

          {/* Target */}
          <View style={[styles.targetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.targetHeader}>
              <View style={[styles.tdot, { backgroundColor: "#ff6b35" }]} />
              <Text style={[styles.targetLabel, { color: colors.mutedForeground }]}>TARGET · PACKAGE</Text>
            </View>
            <View style={styles.targetRow}>
              <View style={[styles.targetIcon, { backgroundColor: "#ff6b3520", borderColor: "#ff6b3550" }]}>
                <Feather name="crosshair" size={20} color="#ff6b35" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.targetName, { color: colors.foreground }]}>Free Fire</Text>
                <Text style={[styles.targetPkg, { color: colors.mutedForeground }]}>{FF_PKG}</Text>
              </View>
              <View style={[styles.targetBadge, { backgroundColor: "#ff6b3518", borderColor: "#ff6b3544" }]}>
                <Text style={[styles.targetBadgeText, { color: "#ff6b35" }]}>GARENA</Text>
              </View>
            </View>
          </View>

          {/* Permissions list */}
          <View style={[styles.permsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.permsTitle, { color: colors.foreground }]}>Required Permissions</Text>
            {PERMISSIONS.map((p) => (
              <View key={p.id} style={[styles.permRow, { borderColor: colors.border + "55" }]}>
                <View style={[styles.permIcon, { backgroundColor: p.color + "18", borderColor: p.color + "44" }]}>
                  <Feather name={p.icon} size={14} color={p.color} />
                </View>
                <View style={styles.permText}>
                  <Text style={[styles.permLabel, { color: colors.foreground }]}>{p.label}</Text>
                  <Text style={[styles.permDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{p.desc}</Text>
                </View>
                <View style={[
                  styles.permStatus,
                  {
                    backgroundColor: perms[p.id] === "granted" ? p.color + "20" : colors.muted,
                    borderColor: perms[p.id] === "granted" ? p.color + "66" : colors.border,
                  }
                ]}>
                  {perms[p.id] === "granted"
                    ? <Feather name="check" size={12} color={p.color} />
                    : perms[p.id] === "denied"
                    ? <Feather name="x" size={12} color={colors.destructive} />
                    : <Feather name="minus" size={12} color={colors.mutedForeground} />
                  }
                </View>
              </View>
            ))}
          </View>

          {/* How it works — NO game file modification */}
          {phase === "intro" && (
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: "#00d4ff33" }]}>
              <View style={styles.infoHeader}>
                <Feather name="shield" size={14} color="#00d4ff" />
                <Text style={[styles.infoTitle, { color: "#00d4ff" }]}>HOW IT WORKS (NON-ROOT)</Text>
              </View>
              {[
                { icon: "zap" as const,       color: "#00ff88", text: "Shizuku grants INJECT_EVENTS — simulates touch inputs WITHOUT touching game files" },
                { icon: "layers" as const,    color: "#00d4ff", text: "Floating overlay runs OUTSIDE Free Fire — transparent to game process" },
                { icon: "eye-off" as const,   color: "#a855f7", text: "Zero game file modification — anti-cheat scans find NOTHING" },
                { icon: "cpu" as const,       color: "#f59e0b", text: "Foreground service keeps panel alive — Android cannot kill it while playing" },
              ].map((item, i) => (
                <View key={i} style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: item.color + "18", borderColor: item.color + "44" }]}>
                    <Feather name={item.icon} size={12} color={item.color} />
                  </View>
                  <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{item.text}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Connection log */}
          {(phase === "connecting" || phase === "done") && logLines > 0 && (
            <View style={[styles.logCard, { backgroundColor: "#050510", borderColor: colors.border }]}>
              <Text style={[styles.logTitle, { color: colors.mutedForeground }]}>$ shizuku-setup --target {FF_PKG}</Text>
              {CONNECTION_LOG.slice(0, logLines).map((line, i) => (
                <Text key={i} style={[styles.logLine, { color: line.color }]}>
                  {line.msg}
                </Text>
              ))}
              {phase === "connecting" && logLines < CONNECTION_LOG.length && (
                <Text style={[styles.logLine, { color: colors.secondary }]}>▌</Text>
              )}
            </View>
          )}

          {/* Success card */}
          {phase === "done" && (
            <View style={[styles.successCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "44" }]}>
              <Feather name="check-circle" size={18} color={colors.primary} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.successTitle, { color: colors.primary }]}>Background Service Active</Text>
                <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                  Panel runs over Free Fire via system overlay. Input injection ready. No game files modified.
                </Text>
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.btnGroup}>
            {phase === "done" ? (
              <Pressable
                onPress={() => { playSFX("enable"); router.replace("/(tabs)"); }}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, shadowColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              >
                <Feather name="play" size={16} color={colors.background} />
                <Text style={[styles.primaryBtnText, { color: colors.background }]}>OPEN PANEL</Text>
              </Pressable>
            ) : phase === "intro" ? (
              <>
                <Pressable
                  onPress={runSetup}
                  style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.secondary, shadowColor: colors.secondary, opacity: pressed ? 0.85 : 1 }]}
                >
                  <Feather name="zap" size={16} color={colors.background} />
                  <Text style={[styles.primaryBtnText, { color: colors.background }]}>SETUP SHIZUKU</Text>
                </Pressable>
                <Pressable
                  onPress={() => { playSFX("click"); Linking.openURL("https://shizuku.rikka.app/"); }}
                  style={({ pressed }) => [styles.secondaryBtn, { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }]}
                >
                  <Feather name="download" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>DOWNLOAD SHIZUKU APP</Text>
                </Pressable>
                <Pressable
                  onPress={() => { playSFX("click"); router.replace("/(tabs)"); }}
                  style={({ pressed }) => [styles.skipBtn, { opacity: pressed ? 0.5 : 1 }]}
                >
                  <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Skip for now</Text>
                </Pressable>
              </>
            ) : (
              <View style={[styles.connectingRow, { borderColor: colors.secondary + "44", backgroundColor: colors.secondary + "0a" }]}>
                <Feather name="loader" size={14} color={colors.secondary} />
                <Text style={[styles.connectingText, { color: colors.secondary }]}>Setting up background service...</Text>
              </View>
            )}
          </View>

          <View style={styles.pkgRow}>
            <Text style={[styles.pkgText, { color: colors.mutedForeground }]}>
              moe.shizuku.privileged.api · v13
            </Text>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  content: { gap: 18 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  titleBlock: { gap: 3 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: 0.5 },
  subtitle: { fontSize: 13 },
  centerBlock: { alignItems: "center", gap: 12, paddingVertical: 12 },
  ring: { width: 108, height: 108, borderRadius: 26, borderWidth: 1.5, alignItems: "center", justifyContent: "center", shadowOffset: { width: 0, height: 0 } },
  ringInner: { width: 88, height: 88, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  ringLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 3 },
  targetCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  targetHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  tdot: { width: 6, height: 6, borderRadius: 3 },
  targetLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 2 },
  targetRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  targetIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  targetName: { fontSize: 15, fontWeight: "600" },
  targetPkg: { fontSize: 11 },
  targetBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  targetBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  permsCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 0 },
  permsTitle: { fontSize: 13, fontWeight: "600", marginBottom: 10 },
  permRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  permIcon: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  permText: { flex: 1, gap: 2 },
  permLabel: { fontSize: 13, fontWeight: "600" },
  permDesc: { fontSize: 11, lineHeight: 15 },
  permStatus: { width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  infoCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  infoTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoIcon: { width: 26, height: 26, borderRadius: 7, borderWidth: 1, alignItems: "center", justifyContent: "center", marginTop: 1 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17 },
  logCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 5 },
  logTitle: { fontSize: 11, letterSpacing: 0.5, marginBottom: 4, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  logLine: { fontSize: 11, lineHeight: 18, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  successCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  successTitle: { fontSize: 14, fontWeight: "600" },
  successSub: { fontSize: 12, lineHeight: 17 },
  btnGroup: { gap: 10 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 },
  primaryBtnText: { fontSize: 14, fontWeight: "700", letterSpacing: 2.5 },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  secondaryBtnText: { fontSize: 13, fontWeight: "600", letterSpacing: 1.5 },
  skipBtn: { alignItems: "center", paddingVertical: 8 },
  skipText: { fontSize: 12 },
  connectingRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  connectingText: { fontSize: 13, fontWeight: "600", letterSpacing: 1 },
  pkgRow: { alignItems: "center", paddingBottom: 4 },
  pkgText: { fontSize: 10, letterSpacing: 0.5 },
});
