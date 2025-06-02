import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles/display.styles';

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const WorkoutDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { workout } = route.params;

  if (!workout) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  const totalSets = workout.exercises ? workout.exercises.reduce((sum, ex) => sum + (ex.sets ? ex.sets.length : 0), 0) : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomWidth: 0 }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Detail</Text>
        <TouchableOpacity>
          <Text style={styles.headerActionText}>Edit Workout</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.exerciseName, { fontSize: 22, marginBottom: 2 }]}>{workout.name}</Text>
        <Text style={[styles.exerciseMuscleGroup, { fontSize: 15, marginBottom: 2 }]}>{formatDate(workout.date_performed)}</Text>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={[styles.exerciseMuscleGroup, { marginRight: 16 }]}>Duration: {Math.round(workout.duration / 60)} min</Text>
          <Text style={[styles.exerciseMuscleGroup, { marginRight: 16 }]}>Volume: {workout.total_volume || 0} lbs</Text>
          <Text style={styles.exerciseMuscleGroup}>Sets: {totalSets}</Text>
        </View>
        {workout.exercises && workout.exercises.map((ex, idx) => (
          <View key={idx} style={{ marginBottom: 18, backgroundColor: '#181A20', borderRadius: 10, padding: 12 }}>
            <Text style={[styles.exerciseName, { color: '#47A3FF', fontSize: 18, marginBottom: 4 }]}>{ex.name}</Text>
            <View style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={[styles.exerciseMuscleGroup, { fontSize: 14, marginRight: 10 }]}>SET</Text>
              <Text style={[styles.exerciseMuscleGroup, { fontSize: 14, marginRight: 10 }]}>WEIGHT & REPS</Text>
            </View>
            {ex.sets && ex.sets.map((set, setIdx) => (
              <View key={setIdx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                <Text style={[styles.exerciseMuscleGroup, { width: 30, fontSize: 15 }]}>{setIdx + 1}</Text>
                <Text style={[styles.exerciseMuscleGroup, { fontSize: 15 }]}>{set.weight}lbs x {set.reps} reps</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default WorkoutDetail; 