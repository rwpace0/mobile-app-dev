import React, { useState, useCallback, useRef } from "react";
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
import { LongPressGestureHandler, State } from "react-native-gesture-handler";
import templateAPI from "../API/templateAPI";
import exercisesAPI from "../API/exercisesAPI";
import folderStorage from "../API/local/folderStorage";
import Header from "../components/static/header";
import { getColors } from "../constants/colors";
import { createStyles } from "../styles/start.styles";
import { useTheme } from "../state/SettingsContext";
import { useActiveWorkout } from "../state/ActiveWorkoutContext";
import BottomSheetModal from "../components/modals/bottomModal";
import ActiveWorkoutModal from "../components/modals/ActiveWorkoutModal";
import FolderCard from "../components/folderCard";
import FolderModal from "../components/modals/FolderModal";
import FolderDeleteModal from "../components/modals/FolderDeleteModal";

const WorkoutStartPage = () => {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const { activeWorkout, isWorkoutActive, endWorkout } = useActiveWorkout();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showActiveWorkoutModal, setShowActiveWorkoutModal] = useState(false);
  const [pendingWorkoutAction, setPendingWorkoutAction] = useState(null);

  // Folder state
  const [folders, setFolders] = useState([]);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderModalMode, setFolderModalMode] = useState("create");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [showFolderOptions, setShowFolderOptions] = useState(false);
  const [showFolderDeleteModal, setShowFolderDeleteModal] = useState(false);
  const [showFolderSelectionModal, setShowFolderSelectionModal] =
    useState(false);
  const [routineToMove, setRoutineToMove] = useState(null);
  const [currentFolderOfRoutine, setCurrentFolderOfRoutine] = useState(null);

  const fetchFolders = useCallback(async () => {
    try {
      const loadedFolders = await folderStorage.getFolders();
      setFolders(loadedFolders);
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  }, []);

  const fetchTemplates = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

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

  // Load templates and folders when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchTemplates();
      fetchFolders();
      return () => {
        // Clear template cache when leaving the screen
        templateAPI.cache.clearPattern("^templates:");
      };
    }, [fetchTemplates, fetchFolders])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTemplates(false);
    fetchFolders();
  }, [fetchTemplates, fetchFolders]);

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

  const handleDeleteTemplate = useCallback(async () => {
    if (!selectedTemplate) return;

    try {
      setLoading(true);
      await templateAPI.deleteTemplate(selectedTemplate.template_id);

      // Also remove from any folders
      await folderStorage.removeRoutineFromAllFolders(
        selectedTemplate.template_id
      );

      // Refresh the templates list and folders
      await fetchTemplates(false);
      await fetchFolders();
    } catch (error) {
      console.error("Failed to delete template:", error);
      setError("Failed to delete template");
    } finally {
      setLoading(false);
      setShowTemplateOptions(false);
      setSelectedTemplate(null);
    }
  }, [selectedTemplate, fetchTemplates, fetchFolders]);

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
      onPress: handleDeleteTemplate,
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

  // Folder handlers
  const handleNewFolder = useCallback(() => {
    setFolderModalMode("create");
    setSelectedFolder(null);
    setShowFolderModal(true);
  }, []);

  const handleCreateFolder = useCallback(
    async (folderName) => {
      try {
        await folderStorage.createFolder(folderName);
        await fetchFolders();
      } catch (error) {
        console.error("Failed to create folder:", error);
        setError("Failed to create folder");
      }
    },
    [fetchFolders]
  );

  const handleFolderOptions = useCallback((folder) => {
    setSelectedFolder(folder);
    setShowFolderOptions(true);
  }, []);

  const handleRenameFolder = useCallback(() => {
    setFolderModalMode("rename");
    setShowFolderOptions(false);
    setShowFolderModal(true);
  }, []);

  const handleRenameFolderSave = useCallback(
    async (newName) => {
      if (!selectedFolder) return;

      try {
        await folderStorage.updateFolder(selectedFolder.id, { name: newName });
        await fetchFolders();
      } catch (error) {
        console.error("Failed to rename folder:", error);
        setError("Failed to rename folder");
      }
    },
    [selectedFolder, fetchFolders]
  );

  const handleDeleteFolderClick = useCallback(() => {
    setShowFolderOptions(false);
    setShowFolderDeleteModal(true);
  }, []);

  const handleDeleteFolderOnly = useCallback(async () => {
    if (!selectedFolder) return;

    try {
      await folderStorage.deleteFolder(selectedFolder.id);
      await fetchFolders();
      setSelectedFolder(null);
    } catch (error) {
      console.error("Failed to delete folder:", error);
      setError("Failed to delete folder");
    }
  }, [selectedFolder, fetchFolders]);

  const handleDeleteFolderAndRoutines = useCallback(async () => {
    if (!selectedFolder) return;

    try {
      setLoading(true);

      // Delete all routines in the folder
      for (const routineId of selectedFolder.routineIds) {
        await templateAPI.deleteTemplate(routineId);
      }

      // Delete the folder
      await folderStorage.deleteFolder(selectedFolder.id);

      // Refresh templates and folders
      await fetchTemplates(false);
      await fetchFolders();
      setSelectedFolder(null);
    } catch (error) {
      console.error("Failed to delete folder and routines:", error);
      setError("Failed to delete folder and routines");
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, fetchTemplates, fetchFolders]);

  const handleSaveFolder = useCallback(
    (folderName) => {
      if (folderModalMode === "create") {
        handleCreateFolder(folderName);
      } else {
        handleRenameFolderSave(folderName);
      }
    },
    [folderModalMode, handleCreateFolder, handleRenameFolderSave]
  );

  const folderActions = [
    {
      title: "Rename Folder",
      icon: "create-outline",
      onPress: handleRenameFolder,
    },
    {
      title: "Delete Folder",
      icon: "trash-outline",
      destructive: true,
      onPress: handleDeleteFolderClick,
    },
  ];

  // Drag and drop handlers
  const handleRoutineLongPress = useCallback(
    (event, routine) => {
      const { state } = event.nativeEvent;

      if (state === State.ACTIVE) {
        // Find if routine is currently in a folder
        const currentFolder = folders.find((folder) =>
          folder.routineIds.includes(routine.template_id)
        );

        setRoutineToMove(routine);
        setCurrentFolderOfRoutine(currentFolder || null);
        setShowFolderSelectionModal(true);
      }
    },
    [folders]
  );

  const handleMoveToFolder = useCallback(
    async (folderId) => {
      if (!routineToMove) return;

      try {
        await folderStorage.addRoutineToFolder(
          folderId,
          routineToMove.template_id
        );
        await fetchFolders();
        setShowFolderSelectionModal(false);
        setRoutineToMove(null);
      } catch (error) {
        console.error("Failed to add routine to folder:", error);
        setError("Failed to add routine to folder");
      }
    },
    [routineToMove, fetchFolders]
  );

  const handleRemoveFromFolder = useCallback(async () => {
    if (!routineToMove || !currentFolderOfRoutine) return;

    try {
      await folderStorage.removeRoutineFromFolder(
        currentFolderOfRoutine.id,
        routineToMove.template_id
      );
      await fetchFolders();
      setShowFolderSelectionModal(false);
      setRoutineToMove(null);
      setCurrentFolderOfRoutine(null);
    } catch (error) {
      console.error("Failed to remove routine from folder:", error);
      setError("Failed to remove routine from folder");
    }
  }, [routineToMove, currentFolderOfRoutine, fetchFolders]);

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
          <Text style={styles.emptyRoutinesText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchTemplates()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Filter out routines that are in folders
    const allRoutineIdsInFolders = folders.flatMap(
      (folder) => folder.routineIds
    );
    const availableTemplates = templates.filter(
      (template) => !allRoutineIdsInFolders.includes(template.template_id)
    );

    if (!templates || templates.length === 0) {
      return (
        <View style={styles.emptyRoutinesContainer}>
          <Text style={styles.emptyRoutinesText}>
            No routines created yet. Create a new routine to get started.
          </Text>
        </View>
      );
    }

    if (availableTemplates.length === 0 && folders.length > 0) {
      return (
        <View style={styles.emptyRoutinesContainer}>
          <Text style={styles.emptyRoutinesText}>
            All routines are in folders. Long press a routine in a folder to
            move it.
          </Text>
        </View>
      );
    }

    return availableTemplates.map((template) => {
      return (
        <LongPressGestureHandler
          key={template.template_id}
          onHandlerStateChange={(event) =>
            handleRoutineLongPress(event, template)
          }
          minDurationMs={500}
        >
          <Animated.View style={styles.templateContainer}>
            <TouchableOpacity
              onPress={() => handleTemplatePress(template)}
              activeOpacity={0.7}
            >
              <View style={styles.templateHeader}>
                <Text style={styles.templateName}>{template.name}</Text>
                <TouchableOpacity
                  onPress={() => handleTemplateOptions(template)}
                >
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
        </LongPressGestureHandler>
      );
    });
  }, [
    loading,
    refreshing,
    error,
    templates,
    folders,
    handleStartRoutine,
    handleTemplateOptions,
    handleTemplatePress,
    handleRoutineLongPress,
    fetchTemplates,
    colors.textSecondary,
    colors.primaryBlue,
    styles,
  ]);

  const renderFolders = useCallback(() => {
    if (folders.length === 0) {
      return null;
    }

    return folders.map((folder) => {
      return (
        <FolderCard
          key={folder.id}
          folder={folder}
          routines={templates}
          onPress={(routine) => handleTemplatePress(routine)}
          onOptionsPress={handleFolderOptions}
          onRoutinePress={handleTemplatePress}
          onRoutineOptions={handleTemplateOptions}
          onStartRoutine={handleStartRoutine}
          onRoutineLongPress={handleRoutineLongPress}
        />
      );
    });
  }, [
    folders,
    templates,
    handleFolderOptions,
    handleTemplatePress,
    handleTemplateOptions,
    handleStartRoutine,
    handleRoutineLongPress,
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
        {/* Quick Start Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <TouchableOpacity
            style={styles.startEmptyWorkoutButton}
            onPress={handleStartEmptyWorkout}
          >
            <Ionicons name="add" size={20} color={colors.textWhite} />
            <Text style={styles.startEmptyWorkoutText}>
              Start Empty Workout
            </Text>
          </TouchableOpacity>
        </View>

        {/* Routines Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Routines</Text>
          </View>

          {/* New Routine and New Folder buttons */}
          <View style={styles.routineActionButtons}>
            <TouchableOpacity
              style={styles.newRoutineButton}
              onPress={handleNewRoutine}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
              <Text style={styles.newRoutineText}>New Routine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.newFolderButton}
              onPress={handleNewFolder}
              activeOpacity={0.8}
            >
              <Ionicons
                name="folder-outline"
                size={20}
                color={colors.textPrimary}
              />
              <Text style={styles.newFolderText}>New Folder</Text>
            </TouchableOpacity>
          </View>

          {/* Folders List */}
          {renderFolders()}

          {/* Templates List */}
          {renderTemplateList()}
        </View>
      </ScrollView>
      <BottomSheetModal
        visible={showTemplateOptions}
        onClose={() => {
          setShowTemplateOptions(false);
          setSelectedTemplate(null);
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
      <BottomSheetModal
        visible={showFolderOptions}
        onClose={() => {
          setShowFolderOptions(false);
          setSelectedFolder(null);
        }}
        title={selectedFolder?.name || "Folder Options"}
        actions={folderActions}
        showHandle={true}
      />
      <FolderModal
        visible={showFolderModal}
        onClose={() => {
          setShowFolderModal(false);
          setSelectedFolder(null);
        }}
        onSave={handleSaveFolder}
        initialName={selectedFolder?.name || ""}
        mode={folderModalMode}
      />
      <FolderDeleteModal
        visible={showFolderDeleteModal}
        onClose={() => {
          setShowFolderDeleteModal(false);
        }}
        onDeleteFolder={handleDeleteFolderOnly}
        onDeleteRoutines={handleDeleteFolderAndRoutines}
        folderName={selectedFolder?.name || ""}
      />
      <BottomSheetModal
        visible={showFolderSelectionModal}
        onClose={() => {
          setShowFolderSelectionModal(false);
          setRoutineToMove(null);
          setCurrentFolderOfRoutine(null);
        }}
        title={currentFolderOfRoutine ? "Move Routine" : "Add to Folder"}
        actions={[
          ...(currentFolderOfRoutine
            ? [
                {
                  title: "Remove from Folder",
                  icon: "remove-circle-outline",
                  destructive: true,
                  onPress: handleRemoveFromFolder,
                },
              ]
            : []),
          ...folders
            .filter((folder) => folder.id !== currentFolderOfRoutine?.id)
            .map((folder) => ({
              title: folder.name,
              icon: "folder",
              onPress: () => handleMoveToFolder(folder.id),
            })),
        ]}
        showHandle={true}
      />
    </SafeAreaView>
  );
};

export default WorkoutStartPage;
