import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import { createStyles } from "../styles/createExercise.styles";
import exercisesAPI from "../API/exercisesAPI";
import { mediaAPI } from "../API/mediaAPI";
import { requestMediaLibraryPermission, validateImageFile } from "../utils/permissions";
import Header from "./header";
import { getColors } from "../constants/colors";
import { useTheme } from "../state/SettingsContext";

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
  const [formData, setFormData] = useState({
    name: "",
    equipment: "",
    muscle_group: "",
    instruction: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageError, setImageError] = useState(null);

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
      console.log('[CreateExercise] Submitting form data:', formData);
      
      // Create exercise first
      const exercise = await exercisesAPI.createExercise(formData);
      console.log("[CreateExercise] Exercise created:", exercise);

      // If there's a selected image, upload it
      if (selectedImage) {
        try {
          setUploadingMedia(true);
          const { mediaUrl, localPath } = await mediaAPI.uploadExerciseMedia(
            exercise.exercise_id,
            selectedImage
          );
          console.log("[CreateExercise] Media uploaded:", { mediaUrl, localPath });
        } catch (mediaError) {
          console.error("Failed to upload media:", mediaError);
          Alert.alert(
            "Warning",
            "Exercise created but failed to upload image. You can try adding the image later."
          );
        } finally {
          setUploadingMedia(false);
        }
      }

      
      navigation.goBack();
    } catch (error) {
      console.error("Failed to create exercise:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || "Failed to create exercise"
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
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerActionText,
            { flex: 1, textAlign: "center" },
          ]}
        >
          Create Exercise
        </Text>
        <TouchableOpacity onPress={handleSubmit} disabled={loading || uploadingMedia}>
          <Text style={[
            styles.headerActionTextActive,
            (loading || uploadingMedia) && { opacity: 0.5 }
          ]}>
            {loading ? 'Creating...' : uploadingMedia ? 'Uploading...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Image Section */}
        <TouchableOpacity 
          style={styles.imageSection}
          onPress={handleImagePick}
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
            {selectedImage ? 'Change Image' : 'Add Image'}
          </Text>
          {imageError && (
            <Text style={styles.errorText}>{imageError}</Text>
          )}
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Exercise Name */}
          <Text style={styles.label}>Exercise Name</Text>
          <TextInput
            style={[
              styles.input,
              formErrors.name && styles.inputError
            ]}
            placeholder="Enter exercise name"
            placeholderTextColor="#999"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          />
          {formErrors.name && (
            <Text style={styles.errorText}>{formErrors.name}</Text>
          )}

          {/* Equipment Dropdown */}
          <Text style={[styles.label, { marginTop: 16 }]}>Equipment</Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dropdown,
              formErrors.equipment && styles.inputError
            ]}
            onPress={() =>
              setOpenDropdown(openDropdown === "equipment" ? null : "equipment")
            }
          >
            <Text style={{ color: formData.equipment ? "#fff" : "#999", flex: 1 }}>
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
                      formData.equipment === option && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, equipment: option }));
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
          <Text style={[styles.label, { marginTop: 16 }]}>
            Primary Muscle Group
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.dropdown,
              formErrors.muscle_group && styles.inputError
            ]}
            onPress={() =>
              setOpenDropdown(openDropdown === "muscle" ? null : "muscle")
            }
          >
            <Text style={{ color: formData.muscle_group ? "#fff" : "#999", flex: 1 }}>
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
                      setFormData(prev => ({ ...prev, muscle_group: option }));
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

          {/* Instruction */}
          <Text style={styles.label}>Instruction</Text>
          <TextInput
            style={[
              styles.input,
              formErrors.instruction && styles.inputError
            ]}
            placeholder="Enter exercise instruction"
            placeholderTextColor="#999"
            value={formData.instruction}
            onChangeText={(text) => setFormData(prev => ({ ...prev, instruction: text }))}
          />
          {formErrors.instruction && (
            <Text style={styles.errorText}>{formErrors.instruction}</Text>
          )}
        </View>

        {(loading || uploadingMedia) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>
              {uploadingMedia ? 'Uploading image...' : 'Creating exercise...'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateExercise;
