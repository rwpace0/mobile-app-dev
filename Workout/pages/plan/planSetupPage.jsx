import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import Header from "../../components/static/header";
import BottomSheetModal from "../../components/modals/bottomModal";
import AlertModal from "../../components/modals/AlertModal";
import { SwipeListView } from "react-native-swipe-list-view";
import { getColors } from "../../constants/colors";
import { createStyles } from "../../styles/planSetup.styles";
import { useTheme } from "../../state/SettingsContext";
import { Spacing } from "../../constants/theme";
import planAPI from "../../API/planAPI";
import { hapticLight, hapticMedium, hapticSelection, hapticSuccess, hapticWarning } from "../../utils/hapticFeedback";

const PlanSetupPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);

  // Check if editing existing plan
  const editingPlan = route.params?.plan || null;
  const isEditMode = !!editingPlan;

  // Form state
  const [planName, setPlanName] = useState(editingPlan?.name || "");
  const [patternLength, setPatternLength] = useState(
    editingPlan?.pattern_length?.toString() || "7"
  );
  const [startDate, setStartDate] = useState(
    editingPlan?.start_date ? new Date(editingPlan.start_date) : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [alertModal, setAlertModal] = useState({ visible: false, message: "" });

  // Load templates and existing schedule
  useEffect(() => {
    loadData();
  }, []);

  const handleAddRoutine = useCallback(() => {
    hapticMedium();
    navigation.navigate("RoutineCreate");
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);
      const allTemplates = await planAPI.getAllTemplates();
      setTemplates(allTemplates);

      // If editing, populate schedule
      if (isEditMode && editingPlan?.schedule) {
        const existingSchedule = editingPlan.schedule.map((item) => ({
          pattern_position: item.pattern_position,
          template_id: item.template_id,
          template_name: item.template_name,
        }));
        setSchedule(existingSchedule);
        setPatternLength(existingSchedule.length.toString());
      } else {
        // Initialize with 1 day for new plans
        setSchedule([
          {
            pattern_position: 0,
            template_id: null,
            template_name: null,
          },
        ]);
        setPatternLength("1");
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (day) => {
    // Create date at noon to avoid timezone issues
    const [year, month, dayOfMonth] = day.dateString.split("-").map(Number);
    const selectedDate = new Date(year, month - 1, dayOfMonth, 12, 0, 0);
    setStartDate(selectedDate);
    setShowDatePicker(false);
  };

  const handleSelectTemplate = (dayIndex) => {
    setSelectedDayIndex(dayIndex);
    setShowTemplateModal(true);
  };

  const handleAssignTemplate = (templateId) => {
    if (selectedDayIndex === null) return;

    const template = templates.find((t) => t.template_id === templateId);
    const newSchedule = [...schedule];
    newSchedule[selectedDayIndex] = {
      pattern_position: selectedDayIndex,
      template_id: templateId,
      template_name: template?.name || "Unknown",
    };
    setSchedule(newSchedule);
    setShowTemplateModal(false);
    setSelectedDayIndex(null);
  };

  const handleSetRestDay = () => {
    if (selectedDayIndex === null) return;

    const newSchedule = [...schedule];
    newSchedule[selectedDayIndex] = {
      pattern_position: selectedDayIndex,
      template_id: null,
      template_name: null,
    };
    setSchedule(newSchedule);
    setShowTemplateModal(false);
    setSelectedDayIndex(null);
  };

  const handleSave = async () => {
    hapticSuccess();
    if (!planName.trim()) {
      setAlertModal({
        visible: true,
        message: "Please enter a plan name",
      });
      return;
    }

    const length = parseInt(patternLength);
    if (!length || length < 1 || length > 100) {
      setAlertModal({
        visible: true,
        message: "Invalid Split Length",
      });
      return;
    }

    try {
      setSaving(true);

      if (isEditMode) {
        // Update existing plan
        await planAPI.updatePlan(editingPlan.plan_id, {
          name: planName,
          startDate: startDate.toISOString(),
          patternLength: length,
        });

        // Delete existing schedule and recreate
        for (const item of schedule) {
          await planAPI.updatePlanSchedule(
            editingPlan.plan_id,
            item.pattern_position,
            item.template_id
          );
        }
      } else {
        // Create new plan
        await planAPI.createPlan({
          name: planName,
          startDate: startDate.toISOString(),
          patternLength: length,
          schedule: schedule.map((item) => ({
            pattern_position: item.pattern_position,
            template_id: item.template_id,
          })),
        });
      }

      navigation.goBack();
    } catch (error) {
      console.error("Failed to save plan:", error);
      setAlertModal({
        visible: true,
        message: "Failed to save plan. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const formatDate = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const renderTemplateModal = () => {
    const modalActions = [
      {
        title: "Rest Day",
        icon: "bed-outline",
        onPress: handleSetRestDay,
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
          setSelectedDayIndex(null);
        }}
        title={`Select Routine for Day ${(selectedDayIndex || 0) + 1}`}
        actions={modalActions}
        showHandle={true}
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          title={isEditMode ? "Edit Plan" : "Create Plan"}
          leftComponent={{ type: "back" }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      </SafeAreaView>
    );
  }

  const handleAddDay = () => {
    const newLength = schedule.length + 1;
    if (newLength <= 100) {
      setSchedule([
        ...schedule,
        {
          pattern_position: schedule.length,
          template_id: null,
          template_name: null,
        },
      ]);
      setPatternLength(newLength.toString());
    }
  };

  const handleRemoveDay = (indexToRemove) => {
    hapticWarning();
    if (schedule.length > 1) {
      const newSchedule = schedule
        .filter((_, index) => index !== indexToRemove)
        .map((item, index) => ({
          ...item,
          pattern_position: index,
        }));
      setSchedule(newSchedule);
      setPatternLength(newSchedule.length.toString());
    }
  };

  const renderDayItem = ({ item, index }) => (
    <Pressable
      style={({ pressed }) => [
        styles.dayCard,
        pressed && styles.dayCardPressed,
      ]}
      onPress={() => handleSelectTemplate(index)}
    >
      <View style={styles.dayCardContent}>
        <View style={styles.dayCardInfo}>
          <Text style={styles.dayCardLabel}>Day {index + 1}</Text>
          <Text
            style={[
              styles.dayCardTemplate,
              item.template_id && styles.dayCardTemplateSelected,
            ]}
          >
            {item.template_name || "Rest"}
          </Text>
        </View>
        <Ionicons
          name={item.template_id ? "barbell" : "moon-outline"}
          size={24}
          color={item.template_id ? colors.primaryBlue : colors.textSecondary}
        />
      </View>
    </Pressable>
  );

  const renderHiddenItem = ({ item, index }) => (
    <View style={styles.hiddenItemContainer}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => {
          hapticWarning();
          handleRemoveDay(index);
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="trash" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={isEditMode ? "Edit Plan" : "Create Plan"}
        leftComponent={{ type: "back" }}
        rightComponent={{
          type: "text",
          text: saving ? "..." : isEditMode ? "Update" : "Create",
          onPress: handleSave,
          disabled: saving,
        }}
      />

      <ScrollView
        style={styles.content}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
      >
        {/* Plan Name */}
        <View>
          <TextInput
            style={styles.nameInput}
            value={planName}
            onChangeText={setPlanName}
            placeholder="Plan Name"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Start Date */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dateCard}
            onPress={() => {
              hapticLight();
              setShowDatePicker(true);
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={24}
              color={colors.primaryBlue}
            />
            <Text style={styles.dateCardText}>{formatDate(startDate)}</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Pattern Configuration */}
        <View style={styles.section}>
          <View style={{ paddingHorizontal: Spacing.m }}>
            <TouchableOpacity
              style={styles.addRoutineButton}
              onPress={handleAddRoutine}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
              <Text style={styles.addRoutineText}>New Routine</Text>
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: Spacing.m, marginTop: Spacing.l }}>
            <TouchableOpacity
              style={styles.addDayButton}
              onPress={handleAddDay}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={colors.textWhite} />
              <Text style={styles.addDayText}>Add Day</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.daysListContainer} pointerEvents="box-none">
            <SwipeListView
              data={schedule}
              renderItem={renderDayItem}
              renderHiddenItem={renderHiddenItem}
              rightOpenValue={-75}
              disableRightSwipe
              scrollEnabled={false}
              keyExtractor={(item, index) => `day-${index}`}
            />
          </View>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              hapticLight();
              setShowDatePicker(false);
            }}
          />
          <View style={styles.calendarModalContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Start Date</Text>
              <TouchableOpacity
                onPress={() => {
                  hapticLight();
                  setShowDatePicker(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={26} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Calendar
              current={startDate.toISOString().split("T")[0]}
              onDayPress={handleDateSelect}
              markedDates={{
                [startDate.toISOString().split("T")[0]]: {
                  selected: true,
                  selectedColor: colors.primaryBlue,
                },
              }}
              theme={{
                backgroundColor: "transparent",
                calendarBackground: "transparent",
                textSectionTitleColor: colors.textSecondary,
                selectedDayBackgroundColor: colors.primaryBlue,
                selectedDayTextColor: "#FFFFFF",
                todayTextColor: colors.primaryBlue,
                dayTextColor: colors.textPrimary,
                textDisabledColor: colors.textFaded,
                monthTextColor: colors.textPrimary,
                arrowColor: colors.primaryBlue,
                textMonthFontWeight: "600",
                textDayFontSize: 16,
                textMonthFontSize: 20,
                textDayHeaderFontSize: 14,
              }}
              style={styles.calendar}
            />
          </View>
        </View>
      </Modal>

      {/* Template Selection Modal */}
      {renderTemplateModal()}

      {/* Alert Modal */}
      <AlertModal
        visible={alertModal.visible}
        onClose={() => setAlertModal({ visible: false, message: "" })}
        message={alertModal.message}
        confirmText="OK"
      />
    </SafeAreaView>
  );
};

export default PlanSetupPage;
