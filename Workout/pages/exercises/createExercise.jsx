import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { createStyles } from "../../styles/createExercise.styles";
import exercisesAPI from "../../API/exercisesAPI";
import { mediaAPI } from "../../API/mediaAPI";
import {
  requestMediaLibraryPermission,
  validateImageFile,
} from "../../utils/permissions";
import Header from "../../components/static/header";
import { getColors } from "../../constants/colors";
import { Spacing } from "../../constants/theme";
import { useTheme } from "../../state/SettingsContext";
import AlertModal from "../../components/modals/AlertModal";
import { useAlertModal } from "../../utils/useAlertModal";
import { hapticLight, hapticSelection, hapticSuccess } from "../../utils/hapticFeedback";

const equipmentOptions = [
  "Dumbbell",
  "Cable",
  "Machine",
  "Barbell",
  "Bodyweight",
  "Kettlebell",
  "Resistance Band",
  "Other",
];

const muscleOptions = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Abs",
  "Glutes",
  "Quads",
  "Hamstrings",
  "Calves",
  "Forearms",
];

const CreateExercise = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(isDark);
  const navigation = useNavigation();
  const route = useRoute();

  // Check if we're in editing mode
  const isEditing = route.params?.isEditing || false;
  const exerciseToEdit = route.params?.exercise || null;
  const exerciseId = route.params?.exerciseId || null;

  const [formData, setFormData] = useState({
    name: "",
    equipment: "",
    muscle_group: "",
    secondary_muscle_groups: [],
    instruction: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [newImageSelected, setNewImageSelected] = useState(false);
  const { alertState, showError, showWarning, hideAlert } = useAlertModal();

  // Load exercise data for editing
  useEffect(() => {
    if (isEditing && exerciseToEdit) {
      // Check if trying to edit a public exercise

      setFormData({
        name: exerciseToEdit.name || "",
        equipment: exerciseToEdit.equipment || "",
        muscle_group: exerciseToEdit.muscle_group || "",
        secondary_muscle_groups: Array.isArray(
          exerciseToEdit.secondary_muscle_groups
        )
          ? exerciseToEdit.secondary_muscle_groups
          : [],
        instruction: exerciseToEdit.instruction || "",
      });

      // Set existing image if available
      if (exerciseToEdit.local_media_path) {
        setSelectedImage(
          `file://${FileSystem.cacheDirectory}app_media/exercises/${exerciseToEdit.local_media_path}`
        );
      }
    }
  }, [isEditing, exerciseToEdit, navigation]);

  const handleSubmit = async () => {
    // Reset error states
    setFormErrors({});

    // Validate required fields
    const errors = {};
    if (!formData.name?.trim()) {
      errors.name = "Exercise name is required";
    }
    if (!formData.muscle_group) {
      errors.muscle_group = "Please select a muscle group";
    }
    if (!formData.equipment) {
      errors.equipment = "Please select equipment type";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      console.log(
        `[CreateExercise] ${isEditing ? "Updating" : "Creating"} exercise:`,
        formData
      );

      let exercise;
      if (isEditing && exerciseId) {
        // Update existing exercise, syncing immediately if there's a new image
        exercise = await exercisesAPI.updateExercise(
          exerciseId,
          formData,
          newImageSelected
        );
        console.log("[CreateExercise] Exercise updated:", exercise);
      } else {
        // Create new exercise, syncing immediately if there's a new image
        exercise = await exercisesAPI.createExercise(
          formData,
          newImageSelected
        );
        console.log("[CreateExercise] Exercise created locally:", exercise);
      }

      // Handle image upload if a new image was selected
      if (newImageSelected) {
        try {
          setUploadingMedia(true);

          // The exercise is now synced (or pending immediate sync), we can use its ID to upload media
          const targetExerciseId = exercise.exercise_id;
          console.log(
            "[CreateExercise] Uploading media for exercise ID:",
            targetExerciseId
          );

          const { mediaUrl, localPath } = await mediaAPI.uploadExerciseMedia(
            targetExerciseId,
            selectedImage
          );
          console.log("[CreateExercise] Media uploaded:", {
            mediaUrl,
            localPath,
          });
        } catch (mediaError) {
          console.error("Failed to upload media:", mediaError);
          showWarning(
            "Warning",
            `Exercise ${
              isEditing ? "updated" : "created"
            } but failed to upload image. You can try adding the image later.`
          );
        } finally {
          setUploadingMedia(false);
        }
      }

      navigation.goBack();
    } catch (error) {
      console.error(
        `Failed to ${isEditing ? "update" : "create"} exercise:`,
        error
      );
      showError(
        "Error",
        error.response?.data?.error ||
          `Failed to ${isEditing ? "update" : "create"} exercise`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      await requestMediaLibraryPermission();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;

        try {
          validateImageFile(imageUri, result.assets[0].fileSize);
          setSelectedImage(imageUri);
          setNewImageSelected(true);
          setImageError(null);
        } catch (error) {
          setImageError(error.message);
        }
      }
    } catch (error) {
      setImageError(error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => {
            hapticLight();
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={[styles.headerActionText, { flex: 1, textAlign: "center" }]}
        >
          {isEditing ? "Edit Exercise" : "Create Exercise"}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || uploadingMedia}
        >
          <Text
            style={[
              styles.headerActionTextActive,
              (loading || uploadingMedia) && { opacity: 0.5 },
            ]}
          >
            {loading
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : uploadingMedia
              ? "Uploading..."
              : isEditing
              ? "Update"
              : "Create"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xxxl }}>
        {/* Image Section */}
        <TouchableOpacity
          style={styles.imageSection}
          onPress={() => {
            hapticLight();
            handleImagePick();
          }}
          disabled={loading || uploadingMedia}
        >
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={styles.imageplaceholder}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imageplaceholder}>
              <Ionicons name="image-outline" size={48} color="#888" />
            </View>
          )}
          <Text style={styles.addImageText}>
            {selectedImage ? "Change Image" : "Add Image"}
          </Text>
          {imageError && <Text style={styles.errorText}>{imageError}</Text>}
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Exercise Name */}
          <Text style={styles.label}>Exercise Name</Text>
          <TextInput
            style={[styles.input, formErrors.name && styles.inputError]}
            placeholder="Enter exercise name"
            placeholderTextColor="#999"
            value={formData.name}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, name: text }))
            }
          />
          {formErrors.name && (
            <Text style={styles.errorText}>{formErrors.name}</Text>
          )}

          {/* Equipment Dropdown */}
          <Text style={[styles.label, { marginTop: Spacing.m }]}>
            Equipment
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dropdown,
              formErrors.equipment && styles.inputError,
            ]}
            onPress={() =>
              setOpenDropdown(openDropdown === "equipment" ? null : "equipment")
            }
          >
            <Text
              style={{
                color: formData.equipment ? colors.textWhite : colors.textFaded,
                flex: 1,
              }}
            >
              {formData.equipment || "Select equipment"}
            </Text>
            <Ionicons
              name={
                openDropdown === "equipment" ? "chevron-up" : "chevron-down"
              }
              size={20}
              color="#999"
            />
          </TouchableOpacity>
          {openDropdown === "equipment" && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 200 }}>
                {equipmentOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      formData.equipment === option &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setFormData((prev) => ({ ...prev, equipment: option }));
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {formErrors.equipment && (
            <Text style={styles.errorText}>{formErrors.equipment}</Text>
          )}

          {/* Primary Muscle Group Dropdown */}
          <Text style={[styles.label, { marginTop: Spacing.m }]}>
            Primary Muscle Group
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dropdown,
              formErrors.muscle_group && styles.inputError,
            ]}
            onPress={() =>
              setOpenDropdown(openDropdown === "muscle" ? null : "muscle")
            }
          >
            <Text
              style={{
                color: formData.muscle_group
                  ? colors.textWhite
                  : colors.textFaded,
                flex: 1,
              }}
            >
              {formData.muscle_group || "Select muscle group"}
            </Text>
            <Ionicons
              name={openDropdown === "muscle" ? "chevron-up" : "chevron-down"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
          {openDropdown === "muscle" && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 200 }}>
                {muscleOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      formData.muscle_group === option &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      hapticSelection();
                      setFormData((prev) => ({
                        ...prev,
                        muscle_group: option,
                      }));
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {formErrors.muscle_group && (
            <Text style={styles.errorText}>{formErrors.muscle_group}</Text>
          )}

          {/* Secondary Muscle Groups - Multi-select */}
          <Text style={[styles.label, { marginTop: Spacing.m }]}>
            Secondary Muscle Groups (Optional)
          </Text>
          <TouchableOpacity
            style={[styles.input, styles.dropdown]}
            onPress={() =>
              setOpenDropdown(openDropdown === "secondary" ? null : "secondary")
            }
          >
            <Text
              style={{
                color:
                  formData.secondary_muscle_groups.length > 0
                    ? colors.textWhite
                    : colors.textFaded,
                flex: 1,
              }}
            >
              {formData.secondary_muscle_groups.length > 0
                ? formData.secondary_muscle_groups.join(", ")
                : "Select secondary muscle groups"}
            </Text>
            <Ionicons
              name={
                openDropdown === "secondary" ? "chevron-up" : "chevron-down"
              }
              size={20}
              color="#999"
            />
          </TouchableOpacity>
          {openDropdown === "secondary" && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 200 }}>
                {muscleOptions.map((option) => {
                  const isSelected =
                    formData.secondary_muscle_groups.includes(option);
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.dropdownItem,
                        isSelected && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        hapticSelection();
                        setFormData((prev) => {
                          const currentSelection = [
                            ...prev.secondary_muscle_groups,
                          ];
                          if (isSelected) {
                            // Remove from selection
                            return {
                              ...prev,
                              secondary_muscle_groups: currentSelection.filter(
                                (m) => m !== option
                              ),
                            };
                          } else {
                            // Add to selection
                            return {
                              ...prev,
                              secondary_muscle_groups: [
                                ...currentSelection,
                                option,
                              ],
                            };
                          }
                        });
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{option}</Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={20}
                          color={colors.primaryBlue}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Instruction */}
          <Text style={[styles.label, { marginTop: Spacing.m }]}>
            Instruction
          </Text>
          <TextInput
            style={[styles.input, formErrors.instruction && styles.inputError]}
            placeholder="Enter exercise instruction"
            placeholderTextColor="#999"
            value={formData.instruction}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, instruction: text }))
            }
          />
          {formErrors.instruction && (
            <Text style={styles.errorText}>{formErrors.instruction}</Text>
          )}
        </View>

        {(loading || uploadingMedia) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.textPrimary} />
            <Text style={styles.loadingText}>
              {uploadingMedia ? "Uploading image..." : "Creating exercise..."}
            </Text>
          </View>
        )}
      </ScrollView>
      <AlertModal
        visible={alertState.visible}
        onClose={hideAlert}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        showCancel={alertState.showCancel}
        onConfirm={alertState.onConfirm}
        onCancel={alertState.onCancel}
      />
    </SafeAreaView>
  );
};

export default CreateExercise;
