import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import createStyles from "../styles/createExercise.styles";
import { createExercise as createExerciseAPI } from "../API/exercisesAPI";

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

  const validate = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = "Exercise name is required.";
    if (!equipment.trim()) newErrors.equipment = "Equipment is required.";
    if (!primaryMuscle.trim())
      newErrors.primaryMuscle = "Primary muscle group is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (validate()) {
      try {
        await createExerciseAPI({
          name,
          equipment,
          muscle_group: primaryMuscle,
        });
        navigation.goBack();
      } catch (error) {
        // Show validation errors if present
        if (error && error.error === "Missing required fields") {
          setErrors({ form: "Please fill in all required fields." });
        } else {
          setErrors({ form: "Failed to create exercise." });
        }
        console.log("Create exercise error:", error);
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
        <TouchableOpacity onPress={handleCreate}>
          <Text style={createStyles.headerActionTextActive}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Image Placeholder */}
        <View style={createStyles.imageSection}>
          <View style={createStyles.imagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#888" />
          </View>
          <Text style={createStyles.addImageText}>Add Image</Text>
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateExercise;
