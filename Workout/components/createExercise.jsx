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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from 'expo-image-picker';
import createStyles from "../styles/createExercise.styles";
import { createExercise as createExerciseAPI } from "../API/exercisesAPI";
import { mediaAPI } from "../API/mediaAPI";
import { requestMediaLibraryPermission, validateImageFile } from "../utils/permissions";

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
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [equipment, setEquipment] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState("");
  const [errors, setErrors] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null); // 'equipment' or 'muscle' or null
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Exercise name is required.";
    if (!equipment.trim()) newErrors.equipment = "Equipment is required.";
    if (!primaryMuscle.trim())
      newErrors.primaryMuscle = "Primary muscle group is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePick = async () => {
    try {
      // Request permissions
      await requestMediaLibraryPermission();

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        
        try {
          // Validate the image
          validateImageFile(imageUri, result.assets[0].fileSize);
          
          // Set the image if validation passes
          setSelectedImage(imageUri);
          setErrors(prev => ({ ...prev, image: null }));
        } catch (error) {
          setErrors(prev => ({ ...prev, image: error.message }));
        }
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, image: error.message }));
    }
  };

  const handleCreate = async () => {
    if (validate()) {
      setIsLoading(true);
      try {
        // Create exercise first
        const exerciseData = await createExerciseAPI({
          name,
          equipment,
          muscle_group: primaryMuscle,
        });

        console.log('Exercise creation response:', exerciseData);

        // If we have an image, upload it
        if (selectedImage && exerciseData.exercise_id) {
          try {
            console.log('Attempting to upload image for exercise:', exerciseData.exercise_id);
            await mediaAPI.uploadExerciseMedia(exerciseData.exercise_id, selectedImage);
          } catch (error) {
            console.error('Image upload error:', error);
            setErrors(prev => ({ ...prev, image: 'Failed to upload image. Please try again.' }));
            // Continue with navigation even if image upload fails
          }
        } else if (selectedImage) {
          console.error('No exercise_id received from exercise creation');
          setErrors(prev => ({ ...prev, form: 'Failed to create exercise properly' }));
        }

        navigation.goBack();
      } catch (error) {
        console.error('Exercise creation error:', error);
        if (error && error.error === "Missing required fields") {
          setErrors({ form: "Please fill in all required fields." });
        } else {
          setErrors({ form: "Failed to create exercise." });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={createStyles.container}>
      {/* Header */}
      <View style={createStyles.header}>
        <TouchableOpacity
          style={createStyles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text
          style={[
            createStyles.headerActionText,
            { flex: 1, textAlign: "center" },
          ]}
        >
          Create Exercise
        </Text>
        <TouchableOpacity onPress={handleCreate} disabled={isLoading}>
          <Text style={[
            createStyles.headerActionTextActive,
            isLoading && { opacity: 0.5 }
          ]}>
            {isLoading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Image Section */}
        <TouchableOpacity 
          style={createStyles.imageSection}
          onPress={handleImagePick}
          disabled={isLoading}
        >
          {selectedImage ? (
            <Image
              source={{ uri: selectedImage }}
              style={createStyles.imagePlaceholder}
              resizeMode="cover"
            />
          ) : (
            <View style={createStyles.imagePlaceholder}>
              <Ionicons name="image-outline" size={48} color="#888" />
            </View>
          )}
          <Text style={createStyles.addImageText}>
            {selectedImage ? 'Change Image' : 'Add Image'}
          </Text>
          {errors.image && (
            <Text style={createStyles.errorText}>{errors.image}</Text>
          )}
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={createStyles.formContainer}>
          {/* Exercise Name */}
          <Text style={createStyles.label}>Exercise Name</Text>
          <TextInput
            style={[createStyles.input, errors.name && createStyles.inputError]}
            placeholder="Enter exercise name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />
          {errors.name && (
            <Text style={createStyles.errorText}>{errors.name}</Text>
          )}

          {/* Equipment Dropdown */}
          <Text style={[createStyles.label, { marginTop: 16 }]}>Equipment</Text>
          <TouchableOpacity
            style={[
              createStyles.input,
              createStyles.dropdown,
              errors.equipment && createStyles.inputError,
            ]}
            onPress={() =>
              setOpenDropdown(openDropdown === "equipment" ? null : "equipment")
            }
          >
            <Text style={{ color: equipment ? "#fff" : "#999", flex: 1 }}>
              {equipment || "Select equipment"}
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
            <View style={createStyles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 200 }}>
                {equipmentOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      createStyles.dropdownItem,
                      equipment === option && createStyles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setEquipment(option);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={createStyles.dropdownItemText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {errors.equipment && (
            <Text style={createStyles.errorText}>{errors.equipment}</Text>
          )}

          {/* Primary Muscle Group Dropdown */}
          <Text style={[createStyles.label, { marginTop: 16 }]}>
            Primary Muscle Group
          </Text>
          <TouchableOpacity
            style={[
              createStyles.input,
              createStyles.dropdown,
              errors.primaryMuscle && createStyles.inputError,
            ]}
            onPress={() =>
              setOpenDropdown(openDropdown === "muscle" ? null : "muscle")
            }
          >
            <Text style={{ color: primaryMuscle ? "#fff" : "#999", flex: 1 }}>
              {primaryMuscle || "Select muscle group"}
            </Text>
            <Ionicons
              name={openDropdown === "muscle" ? "chevron-up" : "chevron-down"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
          {openDropdown === "muscle" && (
            <View style={createStyles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 200 }}>
                {muscleOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      createStyles.dropdownItem,
                      primaryMuscle === option &&
                        createStyles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setPrimaryMuscle(option);
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={createStyles.dropdownItemText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {errors.primaryMuscle && (
            <Text style={createStyles.errorText}>{errors.primaryMuscle}</Text>
          )}

          {errors.form && (
            <Text style={createStyles.errorText}>{errors.form}</Text>
          )}
        </View>

        {isLoading && (
          <View style={createStyles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateExercise;
