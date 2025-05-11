import { View, Text, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";

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
        title="Go to Display"
        onPress={() => navigation.navigate("Display")}
      />
    </View>
  );
}; 

export default HomePage;
