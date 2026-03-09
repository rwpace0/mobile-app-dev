import React, { useMemo, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { createStyles } from "../../styles/workoutHistory.styles";
import { getColors } from "../../constants/colors";
import {
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
} from "../../constants/theme";
import { useTheme } from "../../state/SettingsContext";
import Header from "../../components/static/header";
import { useWeight } from "../../utils/useWeight";
import { hapticSuccess } from "../../utils/hapticFeedback";
import exercisesAPI from "../../API/exercisesAPI";
import { formatDurationHuman } from "../../utils/timerUtils";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CONFETTI_COUNT = 60;
const CONFETTI_COLORS = [
  "#FFD700",
  "#FF6B6B",
  "#4CD964",
  "#007AFF",
  "#AF52DE",
  "#FF9500",
  "#FF2D55",
  "#5AC8FA",
  "#FFCC00",
  "#34C759",
];

const MESSAGES = [
  "Great work!",
  "You crushed it!",
  "Another one down.",
  "Solid session!",
  "Well done!",
  "Keep it up!",
];

const ordinalSuffix = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};


// Single confetti piece
const ConfettiPiece = ({ color, startX, delay }) => {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (Math.random() - 0.5) * 120;
    const duration = 1800 + Math.random() * 1200;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT * 0.75,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: drift,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: (Math.random() - 0.5) * 10,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(duration * 0.6),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.4,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [-10, 10],
    outputRange: ["-720deg", "720deg"],
  });

  const isRect = Math.random() > 0.5;
  const size = 6 + Math.random() * 6;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: startX,
        width: isRect ? size * 1.5 : size,
        height: size,
        borderRadius: isRect ? 2 : size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: spin }],
      }}
    />
  );
};

// Confetti overlay
const Confetti = ({ active }) => {
  const pieces = useMemo(() => {
    if (!active) return [];
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      startX: Math.random() * SCREEN_WIDTH,
      delay: Math.random() * 600,
    }));
  }, [active]);

  if (!active) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        overflow: "hidden",
      }}
    >
      {pieces.map((p) => (
        <ConfettiPiece
          key={p.id}
          color={p.color}
          startX={p.startX}
          delay={p.delay}
        />
      ))}
    </View>
  );
};

const WorkoutComplete = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const weight = useWeight();

  const {
    exercises = [],
    duration = 0,
    name = "Workout",
    workoutCount = null,
  } = route.params || {};

  const [exercisePRs, setExercisePRs] = useState({});
  const [prCount, setPrCount] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);

  const message = useMemo(
    () => MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
    [],
  );

  const totalSets = exercises.reduce(
    (sum, ex) => sum + (ex.sets?.length || 0),
    0,
  );
  const totalExercises = exercises.length;

  // Fetch exercise histories and calculate PRs
  useEffect(() => {
    if (!exercises.length) return;

    const fetchPRs = async () => {
      const prs = {};
      let totalPRs = 0;

      await Promise.all(
        exercises.map(async (exercise) => {
          try {
            const history = await exercisesAPI.getExerciseHistory(
              exercise.exercise_id,
            );
            if (!history || history.length === 0) return;

            // Find the overall best performance across all history
            let bestPerformance = 0;
            history.forEach((entry) => {
              entry.sets?.forEach((set) => {
                const perf =
                  (set.weight || 0) *
                  (set.reps || 0) *
                  (set.rir !== null && set.rir !== undefined ? set.rir : 1);
                if (perf > bestPerformance) bestPerformance = perf;
              });
            });

            // The most recent entry is the workout we just saved
            const currentEntry = history[0];
            if (!currentEntry) return;

            // Check if the current workout achieved the best performance
            const currentHasPR = currentEntry.sets?.some((set) => {
              const perf =
                (set.weight || 0) *
                (set.reps || 0) *
                (set.rir !== null && set.rir !== undefined ? set.rir : 1);
              return perf === bestPerformance && bestPerformance > 0;
            });

            if (currentHasPR) {
              prs[exercise.exercise_id] = true;
              totalPRs++;
            }
          } catch (err) {
            // silently skip
          }
        }),
      );

      setExercisePRs(prs);
      setPrCount(totalPRs);
      if (totalPRs > 0) {
        setConfettiActive(true);
        // Stop confetti after 3s
        setTimeout(() => setConfettiActive(false), 3000);
      }
    };

    fetchPRs();
  }, []);

  // Always fire confetti briefly on mount for celebration
  useEffect(() => {
    setConfettiActive(true);
    const timer = setTimeout(() => setConfettiActive(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDone = () => {
    hapticSuccess();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.detailContainer}>
      <Confetti active={confettiActive} />

      <Header
        title="Workout Complete"
        rightComponent={{
          type: "button",
          text: "Done",
          onPress: handleDone,
        }}
      />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Trophy + workout count */}
        <View
          style={{
            alignItems: "center",
            paddingTop: Spacing.xl,
            paddingBottom: Spacing.m,
            paddingHorizontal: Spacing.m,
          }}
        >
          <Ionicons name="trophy" size={52} color={colors.accentGold} />
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: FontSize.xlarge,
              fontWeight: FontWeight.bold,
              textAlign: "center",
              marginTop: Spacing.m,
            }}
          >
            {message}
          </Text>
          {workoutCount != null && workoutCount > 0 && (
            <Text
              style={{
                color: colors.primaryLight,
                fontSize: FontSize.base,
                fontWeight: FontWeight.semiBold,
                textAlign: "center",
                marginTop: Spacing.xs,
              }}
            >
              This is your {ordinalSuffix(workoutCount)} workout!
            </Text>
          )}
        </View>

        {/* Workout name + stats */}
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{name}</Text>
          <View style={[styles.detailStatsRow, { flexWrap: "wrap" }]}>
            <View style={styles.statItemWithIcon}>
              <View style={styles.statIconContainer}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.textPrimary}
                />
              </View>
              <Text style={styles.statText}>{formatDurationHuman(duration)}</Text>
            </View>
            <View style={styles.statItemWithIcon}>
              <View style={styles.statIconContainer}>
                <Ionicons name="barbell" size={20} color={colors.textPrimary} />
              </View>
              <Text style={styles.statText}>
                {totalExercises}{" "}
                {totalExercises === 1 ? "exercise" : "exercises"}
              </Text>
            </View>
            <View style={styles.statItemWithIcon}>
              <View style={styles.statIconContainer}>
                <Ionicons
                  name="list-outline"
                  size={20}
                  color={colors.textPrimary}
                />
              </View>
              <Text style={styles.statText}>{totalSets} sets</Text>
            </View>
            {prCount > 0 && (
              <View style={[styles.statItemWithIcon, { marginTop: Spacing.s }]}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trophy" size={20} color={colors.accentGold} />
                </View>
                <Text style={styles.statText}>
                  {prCount} {prCount === 1 ? "PR" : "PRs"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Best set summary table */}
        {exercises.length > 0 && (
          <View style={{ marginTop: Spacing.m }}>
            {/* Table header */}
            <View style={[styles.exerciseRow, { paddingVertical: Spacing.xs }]}>
              <Text style={[styles.setsHeaderText, styles.setHeaderColumn]}>
                #
              </Text>
              <Text
                style={[
                  styles.setsHeaderText,
                  { flex: 1, marginLeft: Spacing.m },
                ]}
              >
                EXERCISE
              </Text>
              <Text style={[styles.setsHeaderText, styles.bestSetColumn]}>
                BEST SET
              </Text>
            </View>

            {/* Exercise rows */}
            {exercises.map((exercise, index) => {
              const sets = exercise.sets || [];
              const bestSet =
                sets.length > 0
                  ? sets.reduce(
                      (best, cur) =>
                        !best || cur.weight > best.weight ? cur : best,
                      sets[0],
                    )
                  : null;
              const isPR = !!exercisePRs[exercise.exercise_id];

              return (
                <View
                  key={exercise.exercise_id || index}
                  style={[
                    styles.exerciseRow,
                    index % 2 === 0 ? styles.setRowEven : styles.setRowOdd,
                  ]}
                >
                  <Text style={[styles.setNumber, { width: 50 }]}>
                    {index + 1}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      marginLeft: Spacing.m,
                    }}
                  >
                    <Text
                      style={[styles.exerciseName, { marginLeft: 0, flex: 1 }]}
                      numberOfLines={1}
                    >
                      {exercise.name || "Exercise"}
                    </Text>
                    {isPR && (
                      <Ionicons
                        name="trophy"
                        size={14}
                        color={colors.accentGold}
                        style={{ marginLeft: Spacing.xxs }}
                      />
                    )}
                  </View>
                  <Text style={styles.bestSet}>
                    {bestSet
                      ? weight.formatSet(bestSet.weight, bestSet.reps)
                      : "-"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Done button */}
        <View
          style={{
            paddingHorizontal: Spacing.m,
            paddingTop: Spacing.xl,
            paddingBottom: Spacing.xl,
          }}
        >
          <TouchableOpacity
            onPress={handleDone}
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.primaryBlue,
              borderRadius: BorderRadius.md,
              paddingVertical: Spacing.s,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: colors.textWhite,
                fontSize: FontSize.medium,
                fontWeight: FontWeight.semiBold,
              }}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutComplete;
