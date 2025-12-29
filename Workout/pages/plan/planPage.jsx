import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import DraggableFlatList from "react-native-draggable-flatlist";
import Header from "../../components/static/header";
import ScrollableCalendar from "../../components/ScrollableCalendar";
import VolumeStats from "../../components/VolumeStats";
import BottomSheetModal from "../../components/modals/bottomModal";
import { getColors } from "../../constants/colors";
import { createStyles } from "../../styles/plan.styles";
import { useTheme } from "../../state/SettingsContext";
import planAPI from "../../API/planAPI";
import exercisesAPI from "../../API/exercisesAPI";

const PlanPage = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  const [activePlan, setActivePlan] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [volumeData, setVolumeData] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPlanOptions, setShowPlanOptions] = useState(false);

  const fetchPlanData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Get active plan
      const plan = await planAPI.getActivePlan();
      setActivePlan(plan);

      // Get all templates, passing schedule for proper sorting
      const allTemplates = await planAPI.getAllTemplates(
        plan?.schedule || null
      );

      // Fetch exercise details for each template
      const templatesWithExercises = await Promise.all(
        allTemplates.map(async (template) => {
          try {
            const exercisesWithDetails = await Promise.all(
              (template.exercises || []).map(async (ex) => {
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

      // Get weekly volume if plan exists
      if (plan) {
        const volume = await planAPI.getWeeklyVolume(plan.plan_id);
        setVolumeData(volume);
      } else {
        setVolumeData({});
      }
    } catch (error) {
      console.error("Failed to fetch plan data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPlanData();
    }, [fetchPlanData])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPlanData(false);
  }, [fetchPlanData]);

  const handleCreatePlan = useCallback(() => {
    navigation.navigate("PlanSetup");
  }, [navigation]);

  const handleEditPlan = useCallback(() => {
    if (!activePlan) return;
    navigation.navigate("PlanSetup", { plan: activePlan });
  }, [activePlan, navigation]);

  const handleDeletePlan = useCallback(async () => {
    if (!activePlan) return;

    try {
      await planAPI.deletePlan(activePlan.plan_id);
      setShowPlanOptions(false);
      fetchPlanData(false);
    } catch (error) {
      console.error("Failed to delete plan:", error);
    }
  }, [activePlan, fetchPlanData]);

  const handleDayPress = useCallback(
    (date, routine) => {
      if (routine && routine.template_id) {
        navigation.navigate("RoutineDetail", {
          template_id: routine.template_id,
        });
      }
    },
    [navigation]
  );

  const handleNewRoutine = useCallback(() => {
    navigation.navigate("RoutineCreate");
  }, [navigation]);

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateText}>
        Create a workout plan to schedule your routines throughout the week and
        track your weekly volume.
      </Text>
      <TouchableOpacity
        style={styles.createPlanButton}
        onPress={handleCreatePlan}
      >
        <Text style={styles.createPlanButtonText}>Create Plan</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPlanOptionsModal = () => {
    const planActions = [
      {
        title: "Edit Plan",
        icon: "create-outline",
        onPress: () => {
          setShowPlanOptions(false);
          handleEditPlan();
        },
      },
      {
        title: "Delete Plan",
        icon: "trash-outline",
        onPress: handleDeletePlan,
        destructive: true,
      },
    ];

    return (
      <BottomSheetModal
        visible={showPlanOptions}
        onClose={() => setShowPlanOptions(false)}
        title="Plan Options"
        actions={planActions}
        showHandle={true}
      />
    );
  };

  const handleReorderTemplates = useCallback(
    async (data) => {
      // Update local state immediately for responsive UI
      setTemplates(data);

      if (!activePlan) {
        return;
      }

      try {
        // Create maps for tracking schedule entries
        const scheduleMap = new Map(); // template_id -> schedule entry
        const positionToScheduleMap = new Map(); // pattern_position -> schedule entry
        if (activePlan.schedule) {
          activePlan.schedule.forEach((s) => {
            if (s.template_id) {
              scheduleMap.set(s.template_id, s);
              positionToScheduleMap.set(s.pattern_position, s);
            }
          });
        }

        // Separate templates into those in schedule and those not
        const scheduleUpdates = [];
        const displayOrderUpdates = [];
        let displayOrderCounter = 0;

        // Track which positions are being moved to (for swap detection)
        const newPositionToTemplateMap = new Map(); // newPosition -> template_id
        const templateToNewPositionMap = new Map(); // template_id -> newPosition

        // First pass: collect all position changes
        data.forEach((template, newIndex) => {
          const scheduleEntry = scheduleMap.get(template.template_id);

          if (scheduleEntry) {
            // Template is in schedule - track position change
            const oldPosition = scheduleEntry.pattern_position;
            if (oldPosition !== newIndex) {
              newPositionToTemplateMap.set(newIndex, template.template_id);
              templateToNewPositionMap.set(template.template_id, {
                newPosition: newIndex,
                oldPosition: oldPosition,
                scheduleId: scheduleEntry.schedule_id,
              });
            }
          } else {
            // Template is not in schedule - update its display_order
            displayOrderUpdates.push({
              templateId: template.template_id,
              displayOrder: displayOrderCounter++,
            });
          }
        });

        // Second pass: handle swaps by updating pattern_positions
        // We need to update all pattern_positions, handling conflicts
        const positionUpdates = [];
        const processedTemplates = new Set();

        templateToNewPositionMap.forEach((change, templateId) => {
          if (processedTemplates.has(templateId)) {
            return; // Already processed as part of a swap
          }

          const conflictingTemplate = newPositionToTemplateMap.get(
            change.newPosition
          );

          if (conflictingTemplate && conflictingTemplate !== templateId) {
            // There's a conflict - need to swap
            const conflictingChange =
              templateToNewPositionMap.get(conflictingTemplate);
            if (conflictingChange) {
              // Swap: update both positions
              positionUpdates.push({
                scheduleId: change.scheduleId,
                newPosition: change.newPosition,
              });
              positionUpdates.push({
                scheduleId: conflictingChange.scheduleId,
                newPosition: change.oldPosition,
              });
              processedTemplates.add(templateId);
              processedTemplates.add(conflictingTemplate);
            } else {
              // No swap needed, just update this one
              positionUpdates.push({
                scheduleId: change.scheduleId,
                newPosition: change.newPosition,
              });
              processedTemplates.add(templateId);
            }
          } else {
            // No conflict, just update
            positionUpdates.push({
              scheduleId: change.scheduleId,
              newPosition: change.newPosition,
            });
            processedTemplates.add(templateId);
          }
        });

        // Update pattern positions for templates in schedule
        for (const update of positionUpdates) {
          await planAPI.updateSchedulePatternPosition(
            update.scheduleId,
            update.newPosition
          );
        }

        // Batch update display orders for templates not in schedule
        if (displayOrderUpdates.length > 0) {
          await planAPI.updateTemplateDisplayOrders(displayOrderUpdates);
        }

        // Refresh plan data to get updated schedule
        if (scheduleUpdates.length > 0) {
          const updatedPlan = await planAPI.getActivePlan();
          setActivePlan(updatedPlan);
        }
      } catch (error) {
        console.error("Failed to save template order:", error);
        // Refresh data to restore correct order
        fetchPlanData(false);
      }
    },
    [activePlan, fetchPlanData]
  );

  const renderTemplateItem = ({ item: template, drag, isActive }) => (
    <TouchableOpacity
      style={[styles.templateContainer, isActive && styles.templateDragging]}
      onLongPress={drag}
      delayLongPress={500}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate("RoutineDetail", {
          template_id: template.template_id,
        })
      }
    >
      {/* Routine Header */}
      <View style={styles.routineHeader}>
        <Text
          style={[styles.routineTitle, isActive && { opacity: 0.5 }]}
          numberOfLines={1}
        >
          {template.name}
        </Text>
      </View>

      {/* Exercise List - Compact */}
      <View style={styles.exerciseList}>
        {template.exercises?.slice(0, 4).map((ex, index) => (
          <View key={index} style={styles.exerciseRow}>
            <Text style={styles.exerciseNumber}>{index + 1}</Text>
            <Text style={styles.exerciseName} numberOfLines={1}>
              {ex.name}
            </Text>
            <Text style={styles.exerciseSets}>{ex.sets || 0}</Text>
          </View>
        ))}
        {template.exercises?.length > 4 && (
          <Text style={styles.moreExercisesText}>
            +{template.exercises.length - 4} more
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTemplates = () => {
    if (templates.length === 0) {
      return (
        <View style={styles.templateContainer}>
          <Text style={styles.emptyStateText}>
            No routines created yet. Create a new routine to get started.
          </Text>
        </View>
      );
    }

    return (
      <DraggableFlatList
        data={templates}
        renderItem={renderTemplateItem}
        keyExtractor={(item) => item.template_id}
        onDragEnd={({ data }) => handleReorderTemplates(data)}
        scrollEnabled={false}
        activationDistance={10}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Plan" leftComponent={{ type: "back" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  if (!activePlan) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Plan" leftComponent={{ type: "back" }} />
        {renderEmptyState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Plan"
        leftComponent={{ type: "back" }}
        rightComponent={{
          type: "icon",
          icon: "ellipsis-horizontal",
          onPress: () => setShowPlanOptions(true),
        }}
      />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Scrollable Calendar */}
        <View style={styles.calendarSection}>
          <Text style={styles.calendarTitle}>Schedule</Text>
          <ScrollableCalendar
            plan={activePlan}
            startDate={activePlan.start_date}
            patternLength={activePlan.pattern_length}
            schedule={activePlan.schedule}
            onDayPress={handleDayPress}
          />
        </View>

        {/* Routines Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Routines</Text>

          <TouchableOpacity
            style={styles.newRoutineButton}
            onPress={handleNewRoutine}
          >
            <Ionicons name="add" size={20} color={colors.textWhite} />
            <Text style={styles.newRoutineText}>New Routine</Text>
          </TouchableOpacity>

          {renderTemplates()}
        </View>

        {/* Volume Stats */}
        {volumeData && Object.keys(volumeData).length > 0 && (
          <View style={styles.volumeSection}>
            <Text style={styles.sectionTitle}>Weekly Volume</Text>
            <VolumeStats volumeData={volumeData} />
          </View>
        )}
      </ScrollView>

      {renderPlanOptionsModal()}
    </SafeAreaView>
  );
};

export default PlanPage;
