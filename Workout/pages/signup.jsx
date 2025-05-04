import React from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import styles from "../styles/login.styles";

const SignUpPage = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your email"
          placeholderTextColor="#999999"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Enter your password"
          placeholderTextColor="#999999"
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Sign Up </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.googleButton} activeOpacity={0.8}>
        <Image
          source={{
            uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Google_%22G%22_Logo.svg/512px-Google_%22G%22_Logo.svg.png",
          }}
          style={[styles.googleIcon, { width: 24, height: 24 }]}
        />
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUpPage;
