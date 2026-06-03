import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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

const AUTH_KEY = "zennyv2_auth";
const VALID_KEYS = ["ZENNY"];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [keyValue, setKeyValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const logoAnim = useSharedValue(0);
  const formAnim = useSharedValue(0);
  const shakeAnim = useSharedValue(0);
  const glowPulse = useSharedValue(0);
  const btnPress = useSharedValue(1);

  useEffect(() => {
    AsyncStorage.getItem(AUTH_KEY).then((val) => {
      if (val === "true") {
        router.replace("/(tabs)");
      } else {
        setChecking(false);
        logoAnim.value = withSpring(1, { damping: 12, stiffness: 70 });
        setTimeout(() => {
          formAnim.value = withSpring(1, { damping: 14, stiffness: 80 });
          playSFX("boot");
        }, 300);
        glowPulse.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 2000 }),
            withTiming(0, { duration: 2000 })
          ),
          -1,
          false
        );
      }
    });
  }, []);

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) {
        setKeyValue(text.trim());
        playSFX("click");
      }
    } catch {}
  };

  const handleLogin = async () => {
    if (!keyValue.trim()) {
      triggerShake();
      setError("Enter your sakura key");
      playSFX("error");
      return;
    }
    setLoading(true);
    setError("");
    btnPress.value = withSequence(
      withTiming(0.94, { duration: 80 }),
      withSpring(1, { damping: 10 })
    );
    playSFX("connect");
    await new Promise((r) => setTimeout(r, 1200));
    const normalized = keyValue.trim().toUpperCase();
    const valid = VALID_KEYS.includes(normalized);
    if (valid) {
      await AsyncStorage.setItem(AUTH_KEY, "true");
      playSFX("success");
      setTimeout(() => router.replace("/shizuku"), 300);
    } else {
      setLoading(false);
      setError("Invalid key. Access denied.");
      triggerShake();
      playSFX("error");
    }
  };

  const triggerShake = () => {
    shakeAnim.value = withSequence(
      withTiming(-12, { duration: 55 }),
      withTiming(12, { duration: 55 }),
      withTiming(-8, { duration: 45 }),
      withTiming(8, { duration: 45 }),
      withTiming(0, { duration: 35 })
    );
  };

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoAnim.value,
    transform: [{ translateY: interpolate(logoAnim.value, [0, 1], [-30, 0]) }],
  }));

  const formStyle = useAnimatedStyle(() => ({
    opacity: formAnim.value,
    transform: [
      { translateY: interpolate(formAnim.value, [0, 1], [30, 0]) },
      { translateX: shakeAnim.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowPulse.value, [0, 1], [0.5, 1]),
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnPress.value }],
  }));

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  if (checking) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScanBackground />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topPad + 20, paddingBottom: bottomPad + 20 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View style={[styles.logoBlock, logoStyle]}>
            <View style={[styles.hexRing, { borderColor: colors.primary + "55" }]}>
              <View style={[styles.hexInner, { borderColor: colors.primary + "99", backgroundColor: colors.primary + "11" }]}>
                <Animated.Text style={[styles.logoLetter, { color: colors.primary }, glowStyle]}>Z</Animated.Text>
              </View>
            </View>
            <Animated.Text style={[styles.appName, { color: colors.primary }, glowStyle]}>ZENNY V2</Animated.Text>
            <Text style={[styles.appSub, { color: colors.mutedForeground }]}>HUSH CLIENT · NON-ROOT EDITION</Text>
            <View style={[styles.versionBadge, { borderColor: colors.secondary + "55", backgroundColor: colors.secondary + "11" }]}>
              <View style={[styles.verDot, { backgroundColor: colors.secondary }]} />
              <Text style={[styles.versionText, { color: colors.secondary }]}>v2.0.0 · ALL PHONES</Text>
            </View>
          </Animated.View>

          {/* Welcome */}
          <Animated.View style={[styles.welcomeBlock, formStyle]}>
            <Text style={[styles.welcomeTitle, { color: colors.foreground }]}>Welcome Back</Text>
            <Text style={[styles.welcomeSub, { color: colors.mutedForeground }]}>
              Enter your sakura key to access the control panel
            </Text>
          </Animated.View>

          {/* Key input */}
          <Animated.View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, formStyle]}>
            <View style={styles.inputLabel}>
              <Feather name="key" size={14} color={colors.primary} />
              <Text style={[styles.labelText, { color: colors.primary }]}>SAKURA KEY</Text>
            </View>
            <View style={[styles.inputRow, { borderColor: keyValue ? colors.primary + "88" : colors.border, backgroundColor: colors.muted }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Enter your sakura key"
                placeholderTextColor={colors.mutedForeground}
                value={keyValue}
                onChangeText={(t) => { setKeyValue(t); setError(""); }}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loading}
              />
              <Pressable
                onPress={handlePaste}
                style={({ pressed }) => [styles.pasteBtn, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Text style={{ fontSize: 18 }}>📋</Text>
              </Pressable>
            </View>

            {error ? (
              <View style={styles.errorRow}>
                <Feather name="alert-circle" size={13} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <Animated.View style={btnStyle}>
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.loginBtn,
                  { backgroundColor: loading ? colors.primary + "44" : colors.primary, shadowColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <>
                    <Feather name="log-in" size={16} color={colors.background} />
                    <Text style={[styles.loginBtnText, { color: colors.background }]}>BLOSSOM IN</Text>
                  </>
                )}
              </Pressable>
            </Animated.View>
          </Animated.View>

          <Animated.View style={[styles.hintBlock, formStyle]}>
            <Feather name="info" size={13} color={colors.mutedForeground} />
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              Key: <Text style={{ color: colors.primary }}>zenny</Text>
            </Text>
          </Animated.View>

          <Animated.View style={[styles.badgeRow, formStyle]}>
            {["NO ROOT", "ALL PHONES", "ANTI-BAN"].map((label) => (
              <View key={label} style={[styles.badge, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                <Feather name="check-circle" size={11} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>{label}</Text>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 20 },
  logoBlock: { alignItems: "center", gap: 10, paddingVertical: 16 },
  hexRing: { width: 90, height: 90, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  hexInner: { width: 72, height: 72, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  logoLetter: {
    fontSize: 38, fontWeight: "700", letterSpacing: 2,
    textShadowColor: "#00ff88", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16,
  },
  appName: {
    fontSize: 28, fontWeight: "700", letterSpacing: 6,
    textShadowColor: "#00ff88", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12,
  },
  appSub: { fontSize: 11, letterSpacing: 3, fontWeight: "500" },
  versionBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginTop: 4 },
  verDot: { width: 6, height: 6, borderRadius: 3 },
  versionText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  welcomeBlock: { gap: 4 },
  welcomeTitle: { fontSize: 22, fontWeight: "700", letterSpacing: 0.5 },
  welcomeSub: { fontSize: 13, letterSpacing: 0.3 },
  card: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 14 },
  inputLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  labelText: { fontSize: 11, fontWeight: "700", letterSpacing: 2 },
  inputRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: Platform.OS === "ios" ? 14 : 10, gap: 8 },
  input: { flex: 1, fontSize: 15, letterSpacing: 1, fontWeight: "500" },
  pasteBtn: { paddingHorizontal: 4 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: -4 },
  errorText: { fontSize: 12, fontWeight: "500" },
  loginBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 6 },
  loginBtnText: { fontSize: 14, fontWeight: "700", letterSpacing: 2.5 },
  hintBlock: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  hintText: { fontSize: 12 },
  badgeRow: { flexDirection: "row", gap: 8, justifyContent: "center", flexWrap: "wrap", paddingBottom: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: "600", letterSpacing: 1 },
});
