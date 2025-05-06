import React from "react";
import { View, Text, FlatList } from "react-native";
import exercises from "../assets/data/exersises.json";
import styles from "../styles/display.styles";

const DisplayPage = () => {
  const renderExerciseItem = ({ item }) => {
    return (
      <View style={styles.exerciseItem}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.displayText}>Type: {item.type}</Text>
        <Text style={styles.displayText}>Resistance: {item.resistanceProfile}</Text>
        <Text style={styles.displayText}>Instructions: {item.instructions}</Text>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercises</Text>
      <FlatList
        data={exercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.name}
      />
    </View>
  );
};

export default DisplayPage;