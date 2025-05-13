import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import styles from "../styles/start.styles";

const Navbar = () => {
    return(
        <SafeAreaView>
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home-outline" size={24} color="#BBBBBB" />
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.tabItem, styles.tabItemActive]}>
          <Ionicons name="barbell" size={24} color="#47A3FF" />
          <Text style={styles.tabTextActive}>Workout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="stats-chart-outline" size={24} color="#BBBBBB" />
          <Text style={styles.tabText}>Stats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={24} color="#BBBBBB" />
          <Text style={styles.tabText}>Profile</Text>
        </TouchableOpacity>
      </View>
        </SafeAreaView>

    );
}