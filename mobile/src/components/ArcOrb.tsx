import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from "react-native-svg";

import { colors } from "../config";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

const SIZE = 240;
const C = SIZE / 2;

/** Vitesse de rotation (ms par tour) des anneaux selon l'état de l'assistant. */
const SPEED: Record<OrbState, number> = { idle: 24000, listening: 9000, thinking: 3500, speaking: 12000 };

function useLoop(duration: number, deps: unknown[]) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    value.setValue(0);
    const anim = Animated.loop(
      Animated.timing(value, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}

function Ring({ children, spin, reverse, size }: { children: ReactNode; spin: Animated.Value; reverse?: boolean; size: number }) {
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: reverse ? ["360deg", "0deg"] : ["0deg", "360deg"] });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]} pointerEvents="none">
      <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>{children}</Svg>
    </Animated.View>
  );
}

/**
 * Noyau holographique de l'assistant : anneaux concentriques cyan/orange en rotation,
 * cœur lumineux pulsant et filaments d'énergie. Toucher l'orbe active le micro.
 */
export function ArcOrb({ state, onPress, size = SIZE }: { state: OrbState; onPress?: () => void; size?: number }) {
  const base = SPEED[state];
  const slow = useLoop(base, [base]);
  const medium = useLoop(base * 0.6, [base]);
  const fast = useLoop(base * 0.35, [base]);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const period = state === "speaking" ? 350 : state === "listening" ? 700 : state === "thinking" ? 500 : 1800;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: period, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: period, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [state, pulse]);

  // Filaments d'énergie fixes (positions aléatoires mais stables).
  const filaments = useMemo(
    () =>
      Array.from({ length: 10 }, () => {
        const a = Math.random() * Math.PI * 2;
        const r1 = 40 + Math.random() * 20;
        const r2 = 100 + Math.random() * 20;
        return { x1: C + r1 * Math.cos(a), y1: C + r1 * Math.sin(a), x2: C + r2 * Math.cos(a + 0.3), y2: C + r2 * Math.sin(a + 0.3) };
      }),
    [],
  );

  const coreScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, state === "idle" ? 1.0 : 1.15] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  const hot = state === "thinking" ? colors.accent : colors.primary;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Parler à l'assistant">
      <View style={{ width: size, height: size, alignSelf: "center" }}>
        {/* Halo diffus (dégradé radial : rendu identique sur iOS, Android et web) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: glowOpacity }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Defs>
              <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={hot} stopOpacity={0.55} />
                <Stop offset="60%" stopColor={hot} stopOpacity={0.12} />
                <Stop offset="100%" stopColor={hot} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={C} cy={C} r={C} fill="url(#halo)" />
          </Svg>
        </Animated.View>

        {/* Filaments + graduations extérieures */}
        <Ring spin={slow} size={size}>
          {filaments.map((f, i) => (
            <Line key={i} {...f} stroke={colors.primary} strokeWidth={0.8} strokeOpacity={0.45} />
          ))}
          <Circle cx={C} cy={C} r={112} stroke={colors.primary} strokeWidth={1.2} strokeDasharray="2 6" fill="none" />
        </Ring>

        {/* Anneau orange segmenté */}
        <Ring spin={medium} reverse size={size}>
          <Circle cx={C} cy={C} r={94} stroke={colors.accent} strokeWidth={5} strokeDasharray="46 14 8 14" fill="none" strokeOpacity={0.85} />
        </Ring>

        {/* Anneau de mesure cyan */}
        <Ring spin={fast} size={size}>
          <Circle cx={C} cy={C} r={77} stroke={colors.primary} strokeWidth={8} strokeDasharray="1 5" fill="none" strokeOpacity={0.7} />
          <Circle cx={C} cy={C} r={64} stroke={colors.accent} strokeWidth={2} strokeDasharray="120 280" fill="none" />
        </Ring>

        {/* Cœur lumineux */}
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: coreScale }] }]} pointerEvents="none">
          <Svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <Defs>
              <RadialGradient id="core" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
                <Stop offset="25%" stopColor="#ffffff" stopOpacity={0.85} />
                <Stop offset="55%" stopColor={hot} stopOpacity={0.6} />
                <Stop offset="100%" stopColor={hot} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={C} cy={C} r={48} fill="url(#core)" />
            <Circle cx={C} cy={C} r={22} stroke="#ffffff" strokeWidth={1.5} fill="none" strokeOpacity={0.8} />
          </Svg>
        </Animated.View>
      </View>
    </Pressable>
  );
}
