import { View, Text, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../state/SettingsContext"; 


const HomePage = () => {
  
  const navigation = useNavigation();
  
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Home Page</Text>
      <Button
        title="Go to Login"
        onPress={() => navigation.navigate("Login")}
      />
      <Button
        title="Go to Sign Up"
        onPress={() => navigation.navigate("SignUp")}
      />
      <Button
        title="Go to Add Exercise"
        onPress={() => navigation.navigate("AddExercise")}
      />
      <Button
        title="Go to Start"
        onPress={() => navigation.navigate("Start")}
      />
      <Button
        title="Go to Active"
        onPress={() => navigation.navigate("WorkoutActive")}
      />
      <Button
        title="Go to Routine"
        onPress={() => navigation.navigate("RoutineCreate")}
      />
      <Button
        title="Go to Create"
        onPress={() => navigation.navigate("CreateExercise")}
      />
      <Button
        title="Go to View Exercises"
        onPress={() => navigation.navigate("ViewExercises")}
      />
      <Button
        title="Go to History"
        onPress={() => navigation.navigate("WorkoutHistory")}
      />
      
    </View>
  );
}; 

export default HomePage;
