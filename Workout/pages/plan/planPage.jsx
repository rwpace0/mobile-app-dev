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
import Header from "../../components/static/header";
import WeeklyCalendar from "../../components/WeeklyCalendar";
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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchPlanData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      // Get active plan
      const plan = await planAPI.getActivePlan();
      setActivePlan(plan);

      // Get all templates
      const allTemplates = await planAPI.getAllTemplates();

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

  const handleCreatePlan = useCallback(async () => {
    try {
      await planAPI.createPlan({ name: "My Workout Plan" });
      fetchPlanData(false);
    } catch (error) {
      console.error("Failed to create plan:", error);
    }
  }, [fetchPlanData]);

  const handleDayPress = useCallback((dayIndex) => {
    setSelectedDay(dayIndex);
    setShowTemplateModal(true);
  }, []);

  const handleAssignTemplate = useCallback(
    async (templateId) => {
      if (!activePlan || selectedDay === null) return;

      try {
        await planAPI.updatePlanSchedule(
          activePlan.plan_id,
          selectedDay,
          templateId
        );
        setShowTemplateModal(false);
        setSelectedDay(null);
        fetchPlanData(false);
      } catch (error) {
        console.error("Failed to assign template:", error);
      }
    },
    [activePlan, selectedDay, fetchPlanData]
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

  const renderTemplateModal = () => {
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const modalActions = [
      {
        title: "Rest Day",
        icon: "bed-outline",
        onPress: () => handleAssignTemplate(null),
      },
      ...templates.map((template) => ({
        title: template.name,
        icon: "barbell-outline",
        onPress: () => handleAssignTemplate(template.template_id),
      })),
    ];

    return (
      <BottomSheetModal
        visible={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setSelectedDay(null);
        }}
        title={`Select Workout for ${
          selectedDay !== null ? daysOfWeek[selectedDay] : ""
        }`}
        actions={modalActions}
        showHandle={true}
      />
    );
  };

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

    return templates.map((template) => (
      <TouchableOpacity
        key={template.template_id}
        style={styles.templateContainer}
        onPress={() =>
          navigation.navigate("RoutineDetail", {
            template_id: template.template_id,
          })
        }
        activeOpacity={0.7}
      >
        <View style={styles.templateHeader}>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.templateCount}>
            {template.exercises.length}{" "}
            {template.exercises.length === 1 ? "exercise" : "exercises"}
          </Text>
        </View>
        <View style={styles.exerciseList}>
          {template.exercises.map((ex, index) => (
            <View key={index} style={styles.exerciseItem}>
              <Text style={styles.exerciseName} numberOfLines={1}>
                {ex.name}
              </Text>
              <Text style={styles.exerciseSets}>
                {ex.sets || 0} {ex.sets === 1 ? "set" : "sets"}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    ));
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
      <Header title="Plan" leftComponent={{ type: "back" }} />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Weekly Calendar */}
        <View style={styles.calendarSection}>
          <Text style={styles.calendarTitle}>Weekly Schedule</Text>
          <WeeklyCalendar
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
            <Ionicons name="add" size={20} color={colors.textPrimary} />
            <Text style={styles.newRoutineText}>New Routine</Text>
          </TouchableOpacity>

          {renderTemplates()}
        </View>

        {/* Volume Stats */}
        <View style={styles.volumeSection}>
          <VolumeStats volumeData={volumeData} />
        </View>
      </ScrollView>

      {renderTemplateModal()}
    </SafeAreaView>
  );
};

export default PlanPage;
