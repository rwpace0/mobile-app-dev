import React, { useState, useCallback, useRef, useEffect } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import templateAPI from "../API/templateAPI";
import exercisesAPI from "../API/exercisesAPI";
import planAPI from "../API/planAPI";
import Header from "../components/static/header";
import ScrollableCalendar from "../components/ScrollableCalendar";
import { getColors } from "../constants/colors";
import { createStyles } from "../styles/start.styles";
import { useTheme } from "../state/SettingsContext";
import { useActiveWorkout } from "../state/ActiveWorkoutContext";
import BottomSheetModal from "../components/modals/bottomModal";
import ActiveWorkoutModal from "../components/modals/ActiveWorkoutModal";
import RoutineDeleteModal from "../components/modals/RoutineDeleteModal";

const WorkoutStartPage = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { activeWorkout, isWorkoutActive, endWorkout } = useActiveWorkout();
  const [templates, setTemplates] = useState([]);
  const [todaysWorkout, setTodaysWorkout] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showActiveWorkoutModal, setShowActiveWorkoutModal] = useState(false);
  const [pendingWorkoutAction, setPendingWorkoutAction] = useState(null);
  const [showRoutineDeleteModal, setShowRoutineDeleteModal] = useState(false);
  const [isRoutinesExpanded, setIsRoutinesExpanded] = useState(false);
  const routinesExpandedInitialized = useRef(false);
  const [isTodaysWorkoutExpanded, setIsTodaysWorkoutExpanded] = useState(true);
  const [isWeeklyCalendarExpanded, setIsWeeklyCalendarExpanded] =
    useState(true);
  const [isQuickStartExpanded, setIsQuickStartExpanded] = useState(true);

  const fetchTemplates = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Check for active plan and today's workout
      try {
        const plan = await planAPI.getActivePlan();
        setActivePlan(plan);

        if (plan) {
          const todayTemplate = await planAPI.getTodaysWorkout();
          if (todayTemplate) {
            // Fetch exercise details for today's workout
            const exercisesWithDetails = await Promise.all(
              (todayTemplate.exercises || []).map(async (ex) => {
                try {
                  const exercise = await exercisesAPI.getExerciseById(
                    ex.exercise_id
                  );
                  return { ...ex, ...exercise };
                } catch (err) {
                  console.error(
                    `Failed to get exercise ${ex.exercise_id}:`,
                    err
                  );
                  return ex;
                }
              })
            );
            setTodaysWorkout({
              ...todayTemplate,
              exercises: exercisesWithDetails,
            });
          } else {
            setTodaysWorkout(null);
          }
        } else {
          setActivePlan(null);
          setTodaysWorkout(null);
        }
      } catch (err) {
        console.error("Failed to fetch plan data:", err);
        setActivePlan(null);
        setTodaysWorkout(null);
      }

      const data = await templateAPI.getTemplates();

      // Fetch exercise details for each template
      const templatesWithExercises = await Promise.all(
        data.map(async (template) => {
          try {
            // Filter out null exercises and ensure no duplicates by exercise_id
            const uniqueExercises = template.exercises.filter(
              (ex) => ex && ex.exercise_id
            );
            const exerciseMap = new Map();
            uniqueExercises.forEach((ex) => {
              if (!exerciseMap.has(ex.exercise_id)) {
                exerciseMap.set(ex.exercise_id, ex);
              }
            });

            const exercisesWithDetails = await Promise.all(
              Array.from(exerciseMap.values()).map(async (exercise) => {
                try {
                  const details = await exercisesAPI.getExerciseById(
                    exercise.exercise_id
                  );
                  return {
                    ...exercise,
                    name: details.name || "Unknown Exercise",
                    muscle_group: details.muscle_group || "",
                  };
                } catch (err) {
                  console.error(
                    `Failed to fetch exercise ${exercise.exercise_id}:`,
                    err
                  );
                  return {
                    ...exercise,
                    name: "Unknown Exercise",
                    muscle_group: "",
                  };
                }
              })
            );

            // Sort exercises by their original order
            exercisesWithDetails.sort(
              (a, b) => a.exercise_order - b.exercise_order
            );

            return {
              ...template,
              exercises: exercisesWithDetails,
            };
          } catch (err) {
            console.error(
              `Failed to process template ${template.template_id}:`,
              err
            );
            return template;
          }
        })
      );

      setTemplates(templatesWithExercises);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setError(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Set initial collapsed state based on whether there's an active plan
  // Only set it once when activePlan first becomes known
  useEffect(() => {
    if (activePlan !== null && !routinesExpandedInitialized.current) {
      // If plan is active, collapse routines by default
      // If no plan, expand routines by default
      setIsRoutinesExpanded(!activePlan);
      routinesExpandedInitialized.current = true;
    }
  }, [activePlan]);

  // Load templates when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      routinesExpandedInitialized.current = false; // Reset to allow re-initialization
      fetchTemplates();
      return () => {
        // Clear template cache when leaving the screen
        templateAPI.cache.clearPattern("^templates:");
      };
    }, [fetchTemplates])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTemplates(false);
  }, [fetchTemplates]);

  const handleStartEmptyWorkout = useCallback(() => {
    if (isWorkoutActive) {
      setPendingWorkoutAction(() => () => navigation.navigate("activeWorkout"));
      setShowActiveWorkoutModal(true);
    } else {
      navigation.navigate("activeWorkout");
    }
  }, [navigation, isWorkoutActive]);

  const handleNewRoutine = useCallback(() => {
    navigation.navigate("RoutineCreate");
  }, [navigation]);

  // Explore removed

  const handleTemplateOptions = useCallback((template) => {
    setSelectedTemplate(template);
    setShowTemplateOptions(true);
  }, []);

  const handleEditTemplate = useCallback(() => {
    if (selectedTemplate) {
      navigation.navigate("EditTemplate", {
        template_id: selectedTemplate.template_id,
      });
    }
    setShowTemplateOptions(false);
    setSelectedTemplate(null);
  }, [selectedTemplate, navigation]);

  const handleDuplicateTemplate = useCallback(async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      await templateAPI.duplicateTemplate(
        selectedTemplate.template_id,
        `${selectedTemplate.name} (Copy)`
      );

      // Refresh the templates list
      await fetchTemplates(false);
    } catch (error) {
      console.error("Failed to duplicate template:", error);
      setError("Failed to duplicate template");
    } finally {
      setLoading(false);
      setShowTemplateOptions(false);
      setSelectedTemplate(null);
    }
  }, [selectedTemplate, fetchTemplates]);

  const handleDeleteTemplateClick = useCallback(() => {
    setShowTemplateOptions(false);
    setShowRoutineDeleteModal(true);
  }, []);

  const handleConfirmDeleteTemplate = useCallback(async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      await templateAPI.deleteTemplate(selectedTemplate.template_id);

      // Refresh the templates list
      await fetchTemplates(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error("Failed to delete template:", error);
      setError("Failed to delete template");
    } finally {
      setLoading(false);
    }
  }, [selectedTemplate, fetchTemplates]);

  const routineActions = [
    {
      title: "Edit Routine",
      icon: "create-outline",
      onPress: handleEditTemplate,
    },
    {
      title: "Duplicate Routine",
      icon: "copy-outline",
      onPress: handleDuplicateTemplate,
    },
    {
      title: "Delete Routine",
      icon: "trash-outline",
      destructive: true,
      onPress: handleDeleteTemplateClick,
    },
  ];

  const handleStartRoutine = useCallback(
    (template) => {
      if (isWorkoutActive) {
        setPendingWorkoutAction(() => () => {
          // Transform template exercises into the format expected by activeWorkout
          const selectedExercises = template.exercises.map((exercise) => ({
            exercise_id: exercise.exercise_id,
            name: exercise.name,
            muscle_group: exercise.muscle_group,
            sets: Array(exercise.sets || 1)
              .fill()
              .map((_, idx) => ({
                id: (idx + 1).toString(),
                weight: "",
                reps: "",
                rir: "",
                completed: false,
              })),
          }));

          // Navigate to activeWorkout with the exercises and template ID
          navigation.navigate("activeWorkout", {
            selectedExercises,
            workoutName: template.name,
            templateId: template.template_id, // Pass template ID to link workout to template
          });
        });
        setShowActiveWorkoutModal(true);
      } else {
        // Transform template exercises into the format expected by activeWorkout
        const selectedExercises = template.exercises.map((exercise) => ({
          exercise_id: exercise.exercise_id,
          name: exercise.name,
          muscle_group: exercise.muscle_group,
          sets: Array(exercise.sets || 1)
            .fill()
            .map((_, idx) => ({
              id: (idx + 1).toString(),
              weight: "",
              reps: "",
              rir: "",
              completed: false,
            })),
        }));

        // Navigate to activeWorkout with the exercises and template ID
        navigation.navigate("activeWorkout", {
          selectedExercises,
          workoutName: template.name,
          templateId: template.template_id, // Pass template ID to link workout to template
        });
      }
    },
    [navigation, isWorkoutActive]
  );

  const handleTemplatePress = useCallback(
    (template) => {
      navigation.navigate("RoutineDetail", {
        template_id: template.template_id,
      });
    },
    [navigation]
  );

  const handleResumeWorkout = useCallback(() => {
    navigation.navigate("activeWorkout");
  }, [navigation]);

  const handleStartNewWorkout = useCallback(async () => {
    try {
      // End the current active workout first and wait for it to complete
      await endWorkout();

      // Then execute the pending workout action (start new workout)
      if (pendingWorkoutAction) {
        pendingWorkoutAction();
        setPendingWorkoutAction(null);
      }
    } catch (error) {
      console.error("Failed to end workout before starting new one:", error);
      // Still proceed with the new workout even if cleanup fails
      if (pendingWorkoutAction) {
        pendingWorkoutAction();
        setPendingWorkoutAction(null);
      }
    }
  }, [pendingWorkoutAction, endWorkout]);

  const handleCloseActiveWorkoutModal = useCallback(() => {
    setShowActiveWorkoutModal(false);
    setPendingWorkoutAction(null);
  }, []);

  const handleCalendarDayPress = useCallback(
    (date, routine) => {
      if (routine && routine.template_id) {
        navigation.navigate("RoutineDetail", {
          template_id: routine.template_id,
        });
      }
    },
    [navigation]
  );

  const renderTodaysWorkout = useCallback(() => {
    // Don't show anything if user doesn't have a plan
    if (!activePlan) return null;

    // If user has a plan but today is a rest day
    if (!todaysWorkout) {
      return (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setIsTodaysWorkoutExpanded(!isTodaysWorkoutExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Today's Workout</Text>
            <Ionicons
              name={isTodaysWorkoutExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {isTodaysWorkoutExpanded && (
            <View style={styles.restDayContainer}>
              <Ionicons
                name="bed-outline"
                size={48}
                color={colors.textSecondary}
                style={styles.restDayIcon}
              />
              <Text style={styles.restDayTitle}>Rest Day</Text>
              <Text style={styles.restDayText}>No workout scheduled today</Text>
            </View>
          )}
        </View>
      );
    }

    // User has a plan and today has a workout
    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setIsTodaysWorkoutExpanded(!isTodaysWorkoutExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          <Ionicons
            name={isTodaysWorkoutExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {isTodaysWorkoutExpanded && (
          <Animated.View style={styles.todayWorkoutContainer}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("RoutineDetail", {
                  template_id: todaysWorkout.template_id,
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.templateHeader}>
                <Text style={styles.templateName}>{todaysWorkout.name}</Text>
              </View>
              <Text style={styles.templateExercises}>
                {todaysWorkout.exercises.map((ex) => ex.name).join(" • ")}
              </Text>
              <TouchableOpacity
                style={styles.startRoutineButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleStartRoutine(todaysWorkout);
                }}
              >
                <Text style={styles.startRoutineText}>
                  Start Today's Workout
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  }, [
    activePlan,
    todaysWorkout,
    navigation,
    handleStartRoutine,
    styles,
    colors,
    isTodaysWorkoutExpanded,
  ]);

  const renderWeeklyCalendar = useCallback(() => {
    if (!activePlan) return null;

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => setIsWeeklyCalendarExpanded(!isWeeklyCalendarExpanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionTitle}>This Week</Text>
          <Ionicons
            name={isWeeklyCalendarExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
        {isWeeklyCalendarExpanded && (
          <View style={styles.calendarContainer}>
            <ScrollableCalendar
              plan={activePlan}
              startDate={activePlan.start_date}
              patternLength={activePlan.pattern_length}
              schedule={activePlan.schedule}
              onDayPress={handleCalendarDayPress}
            />
          </View>
        )}
      </View>
    );
  }, [
    activePlan,
    handleCalendarDayPress,
    styles,
    colors,
    isWeeklyCalendarExpanded,
  ]);

  const renderTemplateList = useCallback(() => {
    if (loading && !refreshing) {
      return (
        <View style={styles.emptyRoutinesContainer}>
          <ActivityIndicator color={colors.primaryBlue} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyRoutinesContainer}>
          <Text style={styles.emptyRoutinesText}>"Error loading routines"</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchTemplates()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!templates || templates.length === 0) {
      return (
        <View style={styles.emptyRoutinesContainer}>
          <Text style={styles.emptyRoutinesText}>
            No routines created yet. Create a new routine to get started.
          </Text>
        </View>
      );
    }

    return templates.map((template) => {
      return (
        <Animated.View
          key={template.template_id}
          style={styles.templateContainer}
        >
          <TouchableOpacity
            onPress={() => handleTemplatePress(template)}
            activeOpacity={0.7}
          >
            <View style={styles.templateHeader}>
              <Text style={styles.templateName}>{template.name}</Text>
              <TouchableOpacity onPress={() => handleTemplateOptions(template)}>
                <Ionicons
                  name="ellipsis-horizontal"
                  size={24}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.templateExercises}>
              {template.exercises.map((ex) => ex.name).join(" • ")}
            </Text>
            <TouchableOpacity
              style={styles.startRoutineButton}
              onPress={(e) => {
                e.stopPropagation();
                handleStartRoutine(template);
              }}
            >
              <Text style={styles.startRoutineText}>Start Routine</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      );
    });
  }, [
    loading,
    refreshing,
    error,
    templates,
    handleStartRoutine,
    handleTemplateOptions,
    handleTemplatePress,
    fetchTemplates,
    colors.textSecondary,
    colors.primaryBlue,
    styles,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Workout" />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Weekly Calendar - shows if user has an active plan */}
        {renderWeeklyCalendar()}

        {/* Today's Workout Section - shows if plan is active and today has a workout */}
        {renderTodaysWorkout()}

        {/* Quick Start Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setIsQuickStartExpanded(!isQuickStartExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Quick Start</Text>
            <Ionicons
              name={isQuickStartExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {isQuickStartExpanded && (
            <TouchableOpacity
              style={styles.startEmptyWorkoutButton}
              onPress={handleStartEmptyWorkout}
            >
              <Ionicons name="add" size={20} color={colors.textWhite} />
              <Text style={styles.startEmptyWorkoutText}>
                Start Empty Workout
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Routines Section - always show, but collapse when plan is active */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => setIsRoutinesExpanded(!isRoutinesExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionTitle}>Routines</Text>
            <Ionicons
              name={isRoutinesExpanded ? "chevron-up" : "chevron-down"}
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* New Routine button and Templates List - only show when expanded */}
          {isRoutinesExpanded && (
            <>
              {/* New Routine button */}
              <View style={styles.routineActionButtons}>
                <TouchableOpacity
                  style={styles.newRoutineButton}
                  onPress={handleNewRoutine}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color={colors.textPrimary} />
                  <Text style={styles.newRoutineText}>New Routine</Text>
                </TouchableOpacity>
              </View>

              {/* Templates List */}
              {renderTemplateList()}
            </>
          )}
        </View>
      </ScrollView>
      <BottomSheetModal
        visible={showTemplateOptions}
        onClose={() => {
          setShowTemplateOptions(false);
          // Don't clear selectedTemplate here - it's needed for delete/duplicate modals
        }}
        title={selectedTemplate?.name || "Template Options"}
        actions={routineActions}
        showHandle={true}
      />
      <ActiveWorkoutModal
        visible={showActiveWorkoutModal}
        onClose={handleCloseActiveWorkoutModal}
        onResumeWorkout={handleResumeWorkout}
        onStartNew={handleStartNewWorkout}
      />
      <RoutineDeleteModal
        visible={showRoutineDeleteModal}
        onClose={() => {
          setShowRoutineDeleteModal(false);
          setSelectedTemplate(null);
        }}
        onDeleteRoutine={handleConfirmDeleteTemplate}
        routineName={selectedTemplate?.name || ""}
      />
    </SafeAreaView>
  );
};

export default WorkoutStartPage;
