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
import createStyles from "../styles/createExercise.styles";
import exercisesAPI from "../API/exercisesAPI";
import { mediaAPI } from "../API/mediaAPI";
import { requestMediaLibraryPermission, validateImageFile } from "../utils/permissions";
import Header from "./header";

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
  const [formData, setFormData] = useState({
    name: "",
    equipment: "",
    muscle_group: "",
    instruction: "",
  });
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'equipment' or 'muscle' or null
  const [selectedImage, setSelectedImage] = useState(null);

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      Alert.alert("Error", "Exercise name is required");
      return;
    }
    if (!formData.muscle_group) {
      Alert.alert("Error", "Please select a muscle group");
      return;
    }
    if (!formData.equipment) {
      Alert.alert("Error", "Please select equipment type");
      return;
    }

    try {
      setLoading(true);
      const response = await exercisesAPI.createExercise(formData);
      console.log("Exercise created:", response);
      Alert.alert(
        "Success",
        "Exercise created successfully!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
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
          setFormData(prev => ({ ...prev, image: null }));
        } catch (error) {
          setFormData(prev => ({ ...prev, image: error.message }));
        }
      }
    } catch (error) {
      setFormData(prev => ({ ...prev, image: error.message }));
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
        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          <Text style={[
            createStyles.headerActionTextActive,
            loading && { opacity: 0.5 }
          ]}>
            {loading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Image Section */}
        <TouchableOpacity 
          style={createStyles.imageSection}
          onPress={handleImagePick}
          disabled={loading}
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
          {formData.image && (
            <Text style={createStyles.errorText}>{formData.image}</Text>
          )}
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={createStyles.formContainer}>
          {/* Exercise Name */}
          <Text style={createStyles.label}>Exercise Name</Text>
          <TextInput
            style={[createStyles.input, formData.name && createStyles.inputError]}
            placeholder="Enter exercise name"
            placeholderTextColor="#999"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          />
          {formData.name && (
            <Text style={createStyles.errorText}>{formData.name}</Text>
          )}

          {/* Equipment Dropdown */}
          <Text style={[createStyles.label, { marginTop: 16 }]}>Equipment</Text>
          <TouchableOpacity
            style={[
              createStyles.input,
              createStyles.dropdown,
              formData.equipment && createStyles.inputError,
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
            <View style={createStyles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 200 }}>
                {equipmentOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      createStyles.dropdownItem,
                      formData.equipment === option && createStyles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, equipment: option }));
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={createStyles.dropdownItemText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {formData.equipment && (
            <Text style={createStyles.errorText}>{formData.equipment}</Text>
          )}

          {/* Primary Muscle Group Dropdown */}
          <Text style={[createStyles.label, { marginTop: 16 }]}>
            Primary Muscle Group
          </Text>
          <TouchableOpacity
            style={[
              createStyles.input,
              createStyles.dropdown,
              formData.muscle_group && createStyles.inputError,
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
            <View style={createStyles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 200 }}>
                {muscleOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      createStyles.dropdownItem,
                      formData.muscle_group === option &&
                        createStyles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, muscle_group: option }));
                      setOpenDropdown(null);
                    }}
                  >
                    <Text style={createStyles.dropdownItemText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          {formData.muscle_group && (
            <Text style={createStyles.errorText}>{formData.muscle_group}</Text>
          )}

          {/* Instruction */}
          <Text style={createStyles.label}>Instruction</Text>
          <TextInput
            style={[createStyles.input, formData.instruction && createStyles.inputError]}
            placeholder="Enter exercise instruction"
            placeholderTextColor="#999"
            value={formData.instruction}
            onChangeText={(text) => setFormData(prev => ({ ...prev, instruction: text }))}
          />
          {formData.instruction && (
            <Text style={createStyles.errorText}>{formData.instruction}</Text>
          )}
        </View>

        {loading && (
          <View style={createStyles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateExercise;
